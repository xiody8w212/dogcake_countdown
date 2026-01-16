import { initBackground, updateBackground, resizeBackground } from './background.js';
import { updateMousePosition } from './interaction.js';
import { initTimer, updateTimer, resizeTimer, triggerScramble } from './timer-particles.js';

const background = initBackground();
const timer = initTimer();

const targetDate = new Date('2026-10-31T00:00:00+09:00').getTime();

triggerScramble(timer.digitParticles);
timer.clockCanvas.addEventListener('click', () => {
    triggerScramble(timer.digitParticles);
});

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

function animate() {
    requestAnimationFrame(animate);
    const now = Date.now();

    const { mouseX, mouseY } = updateMousePosition();
    updateBackground(
        background.bgScene,
        background.bgCamera,
        background.bgRenderer,
        background.particles,
        mouseX,
        mouseY
    );

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
