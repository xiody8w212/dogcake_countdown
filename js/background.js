import * as THREE from 'three';

export function initBackground() {
    const bgContainer = document.getElementById('bg-canvas');
    const bgScene = new THREE.Scene();
    bgScene.fog = new THREE.FogExp2(0x050505, 0.002);

    const bgCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    bgCamera.position.z = 100;

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

    return { bgScene, bgCamera, bgRenderer, particles };
}

export function updateBackground(bgScene, bgCamera, bgRenderer, particles, mouseX, mouseY) {
    particles.rotation.x += 0.0005;
    particles.rotation.y += 0.0003;
    
    bgCamera.position.x += (mouseX * 0.01 - bgCamera.position.x) * 0.05;
    bgCamera.position.y += (-mouseY * 0.01 - bgCamera.position.y) * 0.05;
    bgCamera.lookAt(bgScene.position);
    bgRenderer.render(bgScene, bgCamera);
}

export function resizeBackground(bgCamera, bgRenderer, width, height) {
    bgCamera.aspect = width / height;
    bgCamera.updateProjectionMatrix();
    bgRenderer.setSize(width, height);
}
