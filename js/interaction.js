let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const charImg = document.getElementById('charImg');

export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

function updateInteraction(clientX, clientY) {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;

    targetX = clientX - window.innerWidth / 2;
    targetY = clientY - window.innerHeight / 2;

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

document.addEventListener('mousemove', (event) => {
    updateInteraction(event.clientX, event.clientY);
});

document.addEventListener('touchmove', (event) => {
    if(event.touches.length > 0) {
        updateInteraction(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: false });

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

export function updateMousePosition() {
    mouseX = lerp(mouseX, targetX, 0.03);
    mouseY = lerp(mouseY, targetY, 0.03);
    return { mouseX, mouseY };
}
