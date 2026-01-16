// =========================================================
// 인터랙션 (마우스 + 터치 + 자이로스코프)
// =========================================================

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const charImg = document.getElementById('charImg');

// 부드러운 카메라 이동을 위한 보간
export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// 공통 업데이트 함수 (좌표를 받아 움직임 처리)
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

// 마우스 이벤트
document.addEventListener('mousemove', (event) => {
    updateInteraction(event.clientX, event.clientY);
});

// 터치 이벤트 (모바일 드래그)
document.addEventListener('touchmove', (event) => {
    if(event.touches.length > 0) {
        updateInteraction(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: false });

// 자이로스코프 (모바일 기울기)
window.addEventListener('deviceorientation', (event) => {
    let tiltX = event.gamma; 
    let tiltY = event.beta;

    if (tiltX === null || tiltY === null) return;

    const adjustedBeta = tiltY - 45; 
    const sensitivity = 15;
    const simulClientX = (window.innerWidth / 2) + (tiltX * sensitivity);
    const simulClientY = (window.innerHeight / 2) + (adjustedBeta * sensitivity);

    updateInteraction(simulClientX, simulClientY);
});

// 마우스 위치 업데이트 및 반환
// 참고 파일처럼 직접 값을 사용하되, 더 부드러운 보간 적용
export function updateMousePosition() {
    // 참고 파일처럼 직접 값을 사용하되, 더 부드러운 보간으로 은은하게
    mouseX = lerp(mouseX, targetX, 0.03); // 0.05 -> 0.03으로 더 부드럽게
    mouseY = lerp(mouseY, targetY, 0.03);
    return { mouseX, mouseY };
}
