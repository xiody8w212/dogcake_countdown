// =========================================================
// 메인 애니메이션 루프 및 초기화
// =========================================================

import { initBackground, updateBackground, resizeBackground } from './background.js';
import { updateMousePosition } from './interaction.js';
import { initTimer, updateTimer, resizeTimer, triggerScramble } from './timer-particles.js';

// 초기화
const background = initBackground();
const timer = initTimer();

// 타겟 날짜 설정
// "2026.10.31 00:00" 서울시간(Asia/Seoul = UTC+09:00) 기준 타겟
const targetDate = new Date('2026-10-31T00:00:00+09:00').getTime();

// 초기 스크램블 효과
triggerScramble(timer.digitParticles);
timer.clockCanvas.addEventListener('click', () => {
    triggerScramble(timer.digitParticles);
});

// 리사이즈 이벤트
function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    resizeBackground(background.bgCamera, background.bgRenderer, w, h);
    resizeTimer(
        timer.clockCanvas,
        timer.digitParticles,
        timer.colonParticles,
        timer.positions,
        timer.digitSpacing,
        timer.colonSpacing,
        timer.getScale
    );
}

window.addEventListener('resize', handleResize);

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    const now = Date.now();

    // 1. 배경 애니메이션
    const { mouseX, mouseY } = updateMousePosition();
    updateBackground(
        background.bgScene,
        background.bgCamera,
        background.bgRenderer,
        background.particles,
        mouseX,
        mouseY
    );

    // 2. 타이머 애니메이션
    const scale = timer.getScale();
    updateTimer(
        timer.clockCtx,
        timer.clockCanvas,
        timer.digitParticles,
        timer.colonParticles,
        targetDate,
        now,
        scale
    );
}

animate();
