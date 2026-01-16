import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// =========================================================
// PART 1: 배경 파티클 (Background Particles)
// =========================================================
const bgContainer = document.getElementById('bg-canvas');
const bgScene = new THREE.Scene();
bgScene.fog = new THREE.FogExp2(0x050505, 0.002);

const bgCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 초기 위치는 아래 리사이즈 함수에서 결정됨

const bgRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
bgRenderer.setSize(window.innerWidth, window.innerHeight);
bgRenderer.setPixelRatio(window.devicePixelRatio);
bgContainer.appendChild(bgRenderer.domElement);

const pCount = 2000;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(pCount * 3);
for(let i=0; i<pCount*3; i++) {
    pPos[i] = (Math.random() - 0.5) * 250; 
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

const pMat = new THREE.PointsMaterial({
    size: 0.7, 
    color: 0xff69b4, 
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending 
});

const particles = new THREE.Points(pGeo, pMat);
bgScene.add(particles);


// =========================================================
// PART 2: 인터랙션 (마우스 + 터치 + 자이로스코프)
// =========================================================
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const charImg = document.getElementById('charImg');

// 1. 공통 업데이트 함수 (좌표를 받아 움직임 처리)
function updateInteraction(clientX, clientY) {
    // 화면 중심 기준 좌표 계산
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;

    // 카메라 패럴럭스용 좌표
    targetX = clientX - window.innerWidth / 2;
    targetY = clientY - window.innerHeight / 2;

    // 캐릭터 CSS 3D 움직임
    const rotateY = x * 10; 
    const rotateX = y * 5;
    const transX = x * 20;
    const transY = y * 10;

    if(charImg) {
        charImg.style.transform = `
            perspective(1000px)
            rotateY(${rotateY}deg)
            rotateX(${rotateX}deg)
            translate(${transX}px, ${transY}px)
        `;
    }
}

// 2. 마우스 이벤트
document.addEventListener('mousemove', (event) => {
    updateInteraction(event.clientX, event.clientY);
});

// 3. 터치 이벤트 (모바일 드래그)
document.addEventListener('touchmove', (event) => {
    if(event.touches.length > 0) {
        // 스크롤 방지 (선택 사항)
        // event.preventDefault(); 
        updateInteraction(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: false });

// 4. 자이로스코프 (모바일 기울기)
// 참고: iOS 13+에서는 사용자 권한 요청 버튼이 필요할 수 있음. 안드로이드는 대체로 자동 동작.
window.addEventListener('deviceorientation', (event) => {
    // gamma: 좌우 기울기(-90 ~ 90), beta: 앞뒤 기울기(-180 ~ 180)
    let tiltX = event.gamma; 
    let tiltY = event.beta;

    // 값이 null인 경우(센서 없음) 무시
    if (tiltX === null || tiltY === null) return;

    // 각도를 화면 픽셀 좌표처럼 변환 (감도 조절)
    // 폰을 들고 있는 기본 각도(45도 등)를 고려해 offset을 줄 수 있으나 여기선 단순 매핑
    // beta는 보통 폰을 세우면 90도 근처이므로 90을 뺌
    const adjustedBeta = tiltY - 45; 

    const sensitivity = 15; // 민감도
    const simulClientX = (window.innerWidth / 2) + (tiltX * sensitivity);
    const simulClientY = (window.innerHeight / 2) + (adjustedBeta * sensitivity);

    // 부드러운 보간을 위해 직접 호출 대신 target 값만 업데이트하는 방식이 좋으나,
    // 여기서는 간단히 직접 호출 (터치와 겹치면 터치가 우선되게 하려면 플래그 필요)
    updateInteraction(simulClientX, simulClientY);
});

// 부드러운 카메라 이동을 위한 보간
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}


// =========================================================
// PART 3: 시계 (Clock Layer)
// =========================================================
const clockContainer = document.getElementById('clock-canvas');
const clockScene = new THREE.Scene();

const clockCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
// 초기 위치는 리사이즈 함수에서 결정

const clockRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
clockRenderer.setSize(window.innerWidth, window.innerHeight);
clockRenderer.setPixelRatio(window.devicePixelRatio);
clockRenderer.setClearColor(0x000000, 0); 
clockRenderer.toneMapping = THREE.NoToneMapping;
clockContainer.appendChild(clockRenderer.domElement);

// --- 텍스처 및 튜브 생성 (기존과 동일) ---
const thinFontFamily = '"Helvetica Neue", "Arial", sans-serif';

function createFilamentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(255, 105, 180, 0.2)';
    ctx.lineWidth = 1.0;
    ctx.font = '100 200px ' + thinFontFamily;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for(let i=0; i<10; i++) ctx.strokeText(i.toString(), 128, 256);
    ctx.beginPath(); ctx.arc(128, 256, 100, 0, Math.PI*2); ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; 
    return texture;
}
const filamentTexture = createFilamentTexture();

function createNumberTexture(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.font = '100 200px ' + thinFontFamily;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff0f5'; 
    ctx.shadowColor = '#ff1493'; 
    ctx.shadowBlur = 40; 
    ctx.fillText(number, 128, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; 
    return texture;
}
const numberTextures = Array.from({length: 10}, (_, i) => createNumberTexture(i.toString()));

function createColonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff0f5';
    ctx.shadowColor = '#ff1493';
    ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(128, 200, 12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(128, 312, 12, 0, Math.PI*2); ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
const colonTexture = createColonTexture();

class NixieTube {
    constructor(xPosition, isColon = false) {
        this.group = new THREE.Group();
        this.isColon = isColon;
        this.lockTime = 0;
        this.currentNumber = 0;
        this.pixels = [];
        this.isHovered = false;
        this.hoverTime = 0;
        this.pixelSize = 0.08;
        this.pixelSpacing = 0.1;

        const glassGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.0, 32);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x222222, metalness: 0.2, roughness: 0.1,
            transmission: 0.95, transparent: true, opacity: 0.1,
            side: THREE.FrontSide
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        this.group.add(glass);

        const planeGeo = new THREE.PlaneGeometry(1.6, 3.2);

        if (!isColon) {
            const filMat = new THREE.MeshBasicMaterial({
                map: filamentTexture, transparent: true, opacity: 0.3,
                color: 0xff69b4, blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide, depthWrite: false
            });
            const filMesh = new THREE.Mesh(planeGeo, filMat);
            filMesh.position.z = -0.05;
            this.group.add(filMesh);
            this.filamentMesh = filMesh;
        }

        // 픽셀화된 숫자 생성
        this.createPixelNumber(0);
        
        // 호버 감지를 위한 평면 추가
        this.hoverPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 3.2),
            new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
        );
        this.hoverPlane.position.z = 0.1;
        this.group.add(this.hoverPlane);

        // 위치 지정 (X축 가운데 유지 + 화면 하단으로 내림)
        this.group.position.set(xPosition, -6.0, 0);
        clockScene.add(this.group);
    }

    createPixelNumber(number) {
        // 기존 픽셀 제거
        this.pixels.forEach(pixel => {
            this.group.remove(pixel);
            pixel.geometry.dispose();
            pixel.material.dispose();
        });
        this.pixels = [];

        if (this.isColon) {
            // 콜론은 기존 방식 유지
            this.numMaterial = new THREE.MeshBasicMaterial({
                map: colonTexture, 
                transparent: true, opacity: 1.0,
                color: 0xffffff, blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide, depthTest: false
            });
            const numMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), this.numMaterial);
            this.group.add(numMesh);
            return;
        }

        // 숫자를 픽셀화하여 생성
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), 40, 80);
        
        const imageData = ctx.getImageData(0, 0, 80, 160);
        const data = imageData.data;
        
        const pixelGeo = new THREE.PlaneGeometry(this.pixelSize, this.pixelSize);
        const pixelMat = new THREE.MeshBasicMaterial({
            color: 0x4a90e2, // 파란색
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const width = 1.6;
        const height = 3.2;
        const cols = 20;
        const rows = 40;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = Math.floor((col / cols) * 80);
                const y = Math.floor((row / rows) * 160);
                const idx = (y * 80 + x) * 4;
                
                if (data[idx + 3] > 128) { // 알파값 체크
                    const pixel = new THREE.Mesh(pixelGeo.clone(), pixelMat.clone());
                    const xPos = (col / cols - 0.5) * width;
                    const yPos = (0.5 - row / rows) * height;
                    pixel.position.set(xPos, yPos, 0);
                    pixel.userData = {
                        originalX: xPos,
                        originalY: yPos,
                        originalZ: 0,
                        velocity: new THREE.Vector3(0, 0, 0),
                        scattered: false
                    };
                    this.group.add(pixel);
                    this.pixels.push(pixel);
                }
            }
        }

        this.currentNumber = number;
    }

    setNumber(n) {
        if (!this.isColon && n !== this.currentNumber) {
            this.createPixelNumber(n);
        }
    }

    updateHover(mouse, raycaster) {
        raycaster.setFromCamera(mouse, clockCamera);
        const intersects = raycaster.intersectObject(this.hoverPlane);
        
        const wasHovered = this.isHovered;
        this.isHovered = intersects.length > 0;

        if (this.isHovered && !wasHovered) {
            this.hoverTime = Date.now();
            // 흩어지기 시작
            this.pixels.forEach((pixel, i) => {
                if (!pixel.userData.scattered) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 0.03 + Math.random() * 0.04;
                    const zSpeed = (Math.random() - 0.5) * 0.03;
                    pixel.userData.velocity.set(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        zSpeed
                    );
                    pixel.userData.scattered = true;
                    pixel.userData.startOpacity = pixel.material.opacity;
                }
            });
        } else if (!this.isHovered && wasHovered) {
            // 원래 위치로 복귀
            this.pixels.forEach(pixel => {
                pixel.userData.scattered = false;
                pixel.userData.velocity.set(0, 0, 0);
            });
        }
    }

    update() {
        if (this.isColon || this.pixels.length === 0) return;

        const now = Date.now();
        const hoverDuration = now - this.hoverTime;

        this.pixels.forEach(pixel => {
            if (pixel.userData.scattered) {
                // 흩어지는 애니메이션
                pixel.position.add(pixel.userData.velocity);
                pixel.userData.velocity.multiplyScalar(0.97); // 저항
                
                // 거리에 따라 투명도 조절
                const distance = pixel.position.distanceTo(new THREE.Vector3(
                    pixel.userData.originalX,
                    pixel.userData.originalY,
                    pixel.userData.originalZ
                ));
                const maxDistance = 1.5;
                if (distance > maxDistance) {
                    pixel.material.opacity = Math.max(0, pixel.material.opacity - 0.03);
                } else {
                    const fadeStart = maxDistance * 0.6;
                    if (distance > fadeStart) {
                        const fadeRatio = (distance - fadeStart) / (maxDistance - fadeStart);
                        pixel.material.opacity = (pixel.userData.startOpacity || 1) * (1 - fadeRatio * 0.8);
                    }
                }
            } else {
                // 원래 위치로 복귀
                const targetX = pixel.userData.originalX;
                const targetY = pixel.userData.originalY;
                const targetZ = pixel.userData.originalZ;
                
                const distX = targetX - pixel.position.x;
                const distY = targetY - pixel.position.y;
                const distZ = targetZ - pixel.position.z;
                const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);
                
                if (distance > 0.01) {
                    pixel.position.x += distX * 0.15;
                    pixel.position.y += distY * 0.15;
                    pixel.position.z += distZ * 0.15;
                } else {
                    pixel.position.set(targetX, targetY, targetZ);
                }
                
                pixel.material.opacity = Math.min(1, pixel.material.opacity + 0.08);
            }
        });
    }
}

const tubes = [];
const colons = [];
// DDD:HH:MM:SS => 3 digits + colon + 2 + colon + 2 + colon + 2  (총 12개 슬롯)
// 기존 레이아웃을 약간 확장: 앞에 Day 자릿수 1개를 추가
const positions = [-8.6, -7.0, -5.4, -3.7, -2.0, -0.4, 1.3, 3.0, 4.6, 6.3, 8.0, 9.6];

positions.forEach((pos, idx) => {
    // colons at slot indices 3, 6, 9 -> DDD:HH:MM:SS
    const isColon = (idx === 3 || idx === 6 || idx === 9);
    if(isColon) colons.push(new NixieTube(pos, true));
    else tubes.push(new NixieTube(pos, false));
});

// 조명
const ambientLight = new THREE.AmbientLight(0x000000); 
clockScene.add(ambientLight);

const backLight = new THREE.PointLight(0xff1493, 30, 20);
backLight.position.set(0, -4, -5);
clockScene.add(backLight);

const frontLight = new THREE.PointLight(0xff69b4, 100, 50);
frontLight.position.set(0, -6, 10);
clockScene.add(frontLight);

// Effect Composer (Bloom)
const renderScene = new RenderPass(clockScene, clockCamera);
renderScene.clear = true; 

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 1.2;
bloomPass.radius = 0.5;

const composer = new EffectComposer(clockRenderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 마우스 호버 감지를 위한 Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- Logic ---
// "2026.10.31 00:00" 서울시간(Asia/Seoul = UTC+09:00) 기준 타겟
const targetDate = new Date('2026-10-31T00:00:00+09:00').getTime();

function triggerScramble() {
    const now = Date.now();
    tubes.forEach((t, i) => t.lockTime = now + 800 + (i * 200));
}
triggerScramble();
document.getElementById('clock-canvas').addEventListener('click', triggerScramble);

// =========================================================
// 반응형 카메라 거리 조절 (핵심)
// =========================================================
function updateCameraDistance() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;

    // 시계의 전체 너비가 대략 17~18 정도 됨.
    // 화면 비율(Aspect Ratio)이 작을수록(세로 모드) 카메라는 더 멀어져야(Z값 증가) 전체가 보임.
    // 기본 PC(가로)에서는 Z=26
    
    let targetZ = 26;
    if (aspect < 1.0) {
        // 모바일(세로) 환경: 비율에 반비례하여 거리 증가
        targetZ = 26 / (aspect * 0.8); 
    } else if (aspect < 1.5) {
        // 태블릿 등 애매한 비율
        targetZ = 35;
    }

    clockCamera.position.z = targetZ;
    // 배경 카메라는 훨씬 멀리
    bgCamera.position.z = 100;

    // 리사이즈 적용
    bgCamera.aspect = aspect; 
    bgCamera.updateProjectionMatrix(); 
    bgRenderer.setSize(w, h);

    clockCamera.aspect = aspect; 
    clockCamera.updateProjectionMatrix(); 
    clockRenderer.setSize(w, h); 
    composer.setSize(w, h);
}

// 초기 실행
updateCameraDistance();

// 리사이즈 이벤트
window.addEventListener('resize', updateCameraDistance);

// 마우스 이동 이벤트로 호버 감지
clockContainer.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

clockContainer.addEventListener('mouseleave', () => {
    // 마우스가 영역을 벗어나면 모든 호버 상태 해제
    tubes.forEach(tube => {
        if (tube.isHovered) {
            tube.isHovered = false;
            tube.pixels.forEach(pixel => {
                pixel.userData.scattered = false;
                pixel.userData.velocity.set(0, 0, 0);
            });
        }
    });
});

function animate() {
    requestAnimationFrame(animate);
    const now = Date.now();

    // 1. 배경 애니메이션 (Interactive)
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;
    
    // 부드러운 움직임 (Lerp)
    mouseX = lerp(mouseX, targetX, 0.05);
    mouseY = lerp(mouseY, targetY, 0.05);

    bgCamera.position.x += (mouseX * 0.005 - bgCamera.position.x) * 0.05;
    bgCamera.position.y += (-mouseY * 0.005 - bgCamera.position.y) * 0.05;
    bgCamera.lookAt(bgScene.position);
    bgRenderer.render(bgScene, bgCamera);

    // 2. 시계 애니메이션
    const diff = targetDate - now;
    let d="000", h="00", m="00", s="00";
    if(diff > 0) {
        d = String(Math.floor(diff / (86400000))).padStart(3,'0');
        h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
        m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
        s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
    }
    const timeStr = d+h+m+s;

    tubes.forEach((tube, i) => {
        if(tube.filamentMesh) tube.filamentMesh.material.opacity = 0.4 + Math.random()*0.3;
        
        if(now < tube.lockTime) {
            if(Math.random() > 0.5) tube.setNumber(Math.floor(Math.random()*10));
        } else {
            tube.setNumber(parseInt(timeStr[i]));
        }
        
        // 호버 감지 및 업데이트
        tube.updateHover(mouse, raycaster);
        tube.update();
    });
    
    colons.forEach(c => {
        if (c.numMaterial) {
            c.numMaterial.opacity = 0.7 + Math.sin(now*0.005)*0.3;
        }
    });

    composer.render();
}

animate();