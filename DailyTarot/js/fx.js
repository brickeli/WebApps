// js/fx.js
// Floating gold and lavender dust behind every page.

export function initCanvasFX() {
    const canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PARTICLE_COUNT = 50;
    const FRAME_MS = 1000 / 30;     // draw at ~30fps; the drift is slow enough that nobody can tell
    const GLOW_BLUR = 6;
    const GLOW_PAD = GLOW_BLUR * 2; // room around each dot for the glow
    const COLORS = [
        { rgb: '212, 175, 55' },   // gold
        { rgb: '226, 217, 243' }   // lavender
    ];
    const RADIUS_STEPS = 6;        // dot sizes are rounded to a few buckets so each one can be pre-rendered
    const MIN_R = 0.3, MAX_R = 2.1;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Pre-render each (color, size) glowing dot once. Per-frame shadowBlur is what made the old loop expensive.
    let sprites = null;
    function buildSprites() {
        sprites = COLORS.map(({ rgb }) => Array.from({ length: RADIUS_STEPS }, (_, step) => {
            const r = MIN_R + ((MAX_R - MIN_R) * step) / (RADIUS_STEPS - 1);
            const size = Math.ceil(r + GLOW_PAD) * 2;   // even, so the dot centre sits on a pixel boundary
            const c = document.createElement('canvas');
            c.width = c.height = size;
            const g = c.getContext('2d');
            g.shadowBlur = GLOW_BLUR;
            g.shadowColor = `rgba(${rgb}, 0.7)`;
            g.fillStyle = `rgb(${rgb})`;
            g.beginPath();
            g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
            g.fill();
            return { img: c, half: size / 2 };
        }));
    }

    let particles = [];
    function seedParticles() {
        particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            color: Math.random() > 0.4 ? 0 : 1,
            size: Math.floor(Math.random() * RADIUS_STEPS),
            alpha: Math.random() * 0.5 + 0.15,
            speedY: -Math.random() * 0.25 - 0.05,
            speedX: Math.sin(Math.random() * Math.PI) * 0.15
        }));
    }

    function sizeCanvas() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (canvas.width === w && canvas.height === h) return;
        const sx = canvas.width ? w / canvas.width : 1;
        const sy = canvas.height ? h / canvas.height : 1;
        canvas.width = w;   // resizing also clears the canvas
        canvas.height = h;
        // keep particles in view after a resize instead of stranding them off-screen
        particles.forEach(p => { p.x *= sx; p.y *= sy; });
    }

    sizeCanvas();
    seedParticles();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sizeCanvas, 150);
    });

    function draw(steps) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            p.y += p.speedY * steps;
            p.x += p.speedX * steps;

            if (p.y < 0) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            const s = sprites[p.color][p.size];
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(s.img, p.x - s.half, p.y - s.half);
        }
        ctx.globalAlpha = 1;
    }

    // Run only while the tab is visible and the visitor has not asked for reduced motion
    let rafId = 0;
    let lastTime = 0;

    function frame(now) {
        rafId = requestAnimationFrame(frame);
        const elapsed = now - lastTime;
        if (elapsed < FRAME_MS - 4) return;   // small tolerance so 60/120Hz displays land on 30fps
        lastTime = now;
        // movement is tuned per 60fps frame; scale by elapsed time and cap it after a stall
        draw(Math.min(elapsed, 100) / (1000 / 60));
    }

    function start() {
        if (rafId) return;
        if (!sprites) buildSprites();
        lastTime = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        if (!rafId) return;
        cancelAnimationFrame(rafId);
        rafId = 0;
    }

    function sync() {
        if (document.hidden || reducedMotion.matches) {
            stop();
            if (reducedMotion.matches) ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            start();
        }
    }

    document.addEventListener('visibilitychange', sync);
    if (reducedMotion.addEventListener) {
        reducedMotion.addEventListener('change', sync);
    } else if (reducedMotion.addListener) {
        reducedMotion.addListener(sync);   // older Safari
    }
    sync();
}
