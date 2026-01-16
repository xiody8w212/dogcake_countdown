export const timerMouse = {
    x: null,
    y: null,
    radius: 50
};

function getScale() {
    const baseWidth = 1920;
    const currentWidth = window.innerWidth;
    return Math.max(0.3, Math.min(1.5, currentWidth / baseWidth));
}

export class Particle {
    constructor(x, y, baseX, baseY, scale = 1) {
        this.x = baseX;
        this.y = baseY;
        this.baseX = baseX;
        this.baseY = baseY;
        this.size = 2.5 * scale;
        this.density = (Math.random() * 30) + 1;
        this.color = '#ff69b4';
        this.isAnimating = false;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        if (timerMouse.x !== null && timerMouse.y !== null) {
            let dx = timerMouse.x - this.x;
            let dy = timerMouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let maxDistance = timerMouse.radius;
            
            if (distance < maxDistance) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;
                
                this.x -= directionX * 3;
                this.y -= directionY * 3;
            } else {
                if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX;
                    this.x -= dx / 10;
                }
                if (this.y !== this.baseY) {
                    let dy = this.y - this.baseY;
                    this.y -= dy / 10;
                }
            }
        } else {
            if (this.x !== this.baseX) {
                let dx = this.x - this.baseX;
                this.x -= dx / 10;
            }
            if (this.y !== this.baseY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 10;
            }
        }
    }
}

export class DigitParticles {
    constructor(x, y, isColon = false) {
        this.x = x;
        this.y = y;
        this.isColon = isColon;
        this.particles = [];
        this.currentValue = isColon ? ':' : '0';
        this.lockTime = 0;
        this.initialAnimationTime = Date.now();
    }

    initParticles(value, scale = 1) {
        this.particles = [];
        this.currentValue = value;
        
        if (this.isColon) {
            const gap = 20 * scale;
            for (let i = 0; i < 2; i++) {
                const py = this.y - (30 * scale) + (i * 60 * scale);
                const particle = new Particle(this.x, py, this.x, py, scale);
                this.particles.push(particle);
            }
            return;
        }

        const tempCanvas = document.createElement('canvas');
        const canvasSize = 200 * scale;
        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize * 1.5;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.fillStyle = 'white';
        tempCtx.font = `bold ${180 * scale}px Arial`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(value.toString(), canvasSize / 2, canvasSize * 0.75);
        
        const textCoordinates = tempCtx.getImageData(0, 0, canvasSize, canvasSize * 1.5);
        const gap = Math.max(2, Math.floor(4 * scale));
        
        for (let y = 0; y < textCoordinates.height; y += gap) {
            for (let x = 0; x < textCoordinates.width; x += gap) {
                const idx = (y * 4 * textCoordinates.width) + (x * 4) + 3;
                if (textCoordinates.data[idx] > 128) {
                    const px = this.x + (x - canvasSize / 2);
                    const py = this.y + (y - canvasSize * 0.75);
                    const particle = new Particle(px, py, px, py, scale);
                    this.particles.push(particle);
                }
            }
        }
    }

    setValue(value, scale = 1) {
        if (value !== this.currentValue) {
            this.initParticles(value, scale);
        }
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });
    }

    update() {
        this.particles.forEach(particle => {
            particle.update();
        });
    }
}

export function initTimer() {
    const clockContainer = document.getElementById('clock-canvas');
    const clockCanvas = document.createElement('canvas');
    clockCanvas.width = window.innerWidth;
    clockCanvas.height = window.innerHeight;
    clockCanvas.style.position = 'absolute';
    clockCanvas.style.top = '0';
    clockCanvas.style.left = '0';
    clockCanvas.style.width = '100%';
    clockCanvas.style.height = '100%';
    clockContainer.appendChild(clockCanvas);

    const clockCtx = clockCanvas.getContext('2d');
    const scale = getScale();

    function updateMousePosition(clientX, clientY) {
        const rect = clockCanvas.getBoundingClientRect();
        timerMouse.x = clientX - rect.left;
        timerMouse.y = clientY - rect.top;
    }

    clockCanvas.addEventListener('mousemove', (event) => {
        updateMousePosition(event.clientX, event.clientY);
    });

    clockCanvas.addEventListener('mouseleave', () => {
        timerMouse.x = null;
        timerMouse.y = null;
    });

    clockCanvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (event.touches.length > 0) {
            updateMousePosition(event.touches[0].clientX, event.touches[0].clientY);
        }
    }, { passive: false });

    clockCanvas.addEventListener('touchend', () => {
        timerMouse.x = null;
        timerMouse.y = null;
    });

    const digitParticles = [];
    const colonParticles = [];

    const centerX = window.innerWidth / 2;
    const bottomMargin = 150 * scale;
    const centerY = window.innerHeight - bottomMargin;
    const digitSpacing = 90 * scale;
    const colonSpacing = 50 * scale;

    const positions = [];
    let currentX = centerX - (digitSpacing * 5.5);

    for (let i = 0; i < 12; i++) {
        const isColon = (i === 3 || i === 6 || i === 9);
        if (isColon) {
            positions.push({ x: currentX, y: centerY, isColon: true });
            currentX += colonSpacing;
        } else {
            positions.push({ x: currentX, y: centerY, isColon: false });
            currentX += digitSpacing;
        }
    }

    positions.forEach((pos, idx) => {
        if (pos.isColon) {
            const colon = new DigitParticles(pos.x, pos.y, true);
            colon.initParticles(':', scale);
            colonParticles.push(colon);
        } else {
            const digit = new DigitParticles(pos.x, pos.y, false);
            digit.initParticles('0', scale);
            digitParticles.push(digit);
        }
    });

    return {
        clockCanvas,
        clockCtx,
        digitParticles,
        colonParticles,
        positions,
        digitSpacing,
        colonSpacing,
        getScale
    };
}

export function triggerScramble(digitParticles) {
    const now = Date.now();
    digitParticles.forEach((digit, i) => {
        digit.lockTime = now + 800 + (i * 200);
    });
}

export function updateTimer(clockCtx, clockCanvas, digitParticles, colonParticles, targetDate, now, scale = 1) {
    clockCtx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);
    
    const diff = targetDate - now;
    let d = "000", h = "00", m = "00", s = "00";
    if (diff > 0) {
        d = String(Math.floor(diff / (86400000))).padStart(3, '0');
        h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
        m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }
    const timeStr = d + h + m + s;

    digitParticles.forEach((digit, i) => {
        if (now < digit.lockTime) {
            if (Math.random() > 0.5) {
                digit.setValue(Math.floor(Math.random() * 10).toString(), scale);
            }
        } else {
            digit.setValue(timeStr[i], scale);
        }
        digit.update();
        digit.draw(clockCtx);
    });

    colonParticles.forEach(colon => {
        const opacity = 0.7 + Math.sin(now * 0.005) * 0.3;
        colon.particles.forEach(particle => {
            const r = parseInt('ff69b4'.substring(0, 2), 16);
            const g = parseInt('ff69b4'.substring(2, 4), 16);
            const b = parseInt('ff69b4'.substring(4, 6), 16);
            particle.color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        });
        colon.update();
        colon.draw(clockCtx);
    });
}

export function resizeTimer(clockCanvas, digitParticles, colonParticles, positions, digitSpacing, colonSpacing, getScale) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = getScale();
    
    clockCanvas.width = w;
    clockCanvas.height = h;
    
    const newCenterX = w / 2;
    const bottomMargin = 150 * scale;
    const newCenterY = h - bottomMargin;
    const newDigitSpacing = 90 * scale;
    const newColonSpacing = 50 * scale;
    let newCurrentX = newCenterX - (newDigitSpacing * 5.5);
    
    positions.forEach((pos, idx) => {
        if (pos.isColon) {
            positions[idx].x = newCurrentX;
            positions[idx].y = newCenterY;
            newCurrentX += newColonSpacing;
        } else {
            positions[idx].x = newCurrentX;
            positions[idx].y = newCenterY;
            newCurrentX += newDigitSpacing;
        }
    });
    
    let digitIdx = 0;
    let colonIdx = 0;
    positions.forEach((pos, idx) => {
        if (pos.isColon) {
            colonParticles[colonIdx].x = pos.x;
            colonParticles[colonIdx].y = pos.y;
            colonParticles[colonIdx].initParticles(':', scale);
            colonIdx++;
        } else {
            digitParticles[digitIdx].x = pos.x;
            digitParticles[digitIdx].y = pos.y;
            digitParticles[digitIdx].initParticles(digitParticles[digitIdx].currentValue, scale);
            digitIdx++;
        }
    });
}
