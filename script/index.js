(function () {
      const hero = document.getElementById('hero');
      const W = () => hero.offsetWidth;
      const H = () => hero.offsetHeight;

      // Animate in text on load
      setTimeout(() => {
        document.getElementById('hero-title').classList.add('animate-in');
        document.getElementById('hero-sub').classList.add('animate-in');
        const btn = document.getElementById('hero-btn');
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, 100);

      // Canvas elements
      const geoC      = document.getElementById('geo-canvas');
      const particleC = document.getElementById('particle-canvas');
      const shimmerC  = document.getElementById('shimmer-canvas');
      const geoCtx    = geoC.getContext('2d');
      const pCtx      = particleC.getContext('2d');
      const sCtx      = shimmerC.getContext('2d');

      function resizeCanvases() {
        [geoC, particleC, shimmerC].forEach(c => {
          c.width  = W();
          c.height = H();
        });
      }

      // Particle state
      let particles   = [];
      let animSpeed   = 20;
      let gradIntensity = 0.7;

      function buildParticles(count) {
        particles = Array.from({ length: count }, () => ({
          x:     Math.random() * 100,
          baseY: Math.random() * 100,
          size:  Math.random() * 4 + 1,
          speed: Math.random() * 0.3 + 0.1,
          phase: Math.random() * Math.PI * 2,
        }));
      }
      buildParticles(30);

      // Draw rotating geometric circles
      function drawGeo(t) {
        const w = W(), h = H();
        geoCtx.clearRect(0, 0, w, h);

        const r1 = Math.min(w, h) * 0.28;
        const scale1 = 1 + 0.2 * Math.sin(t * 0.02);
        geoCtx.beginPath();
        geoCtx.arc(w - r1 * scale1 * 0.5, r1 * scale1 * -0.2, r1 * scale1, 0, Math.PI * 2);
        geoCtx.strokeStyle = `rgba(212,175,55,${0.1 * gradIntensity / 0.7})`;
        geoCtx.lineWidth = 1;
        geoCtx.stroke();

        const r2 = Math.min(w, h) * 0.24;
        const scale2 = 1 + 0.3 * Math.sin(t * 0.016 + 1);
        geoCtx.beginPath();
        geoCtx.arc(r2 * scale2 * -0.2, h - r2 * scale2 * 0.5, r2 * scale2, 0, Math.PI * 2);
        geoCtx.strokeStyle = `rgba(201,169,97,${0.1 * gradIntensity / 0.7})`;
        geoCtx.stroke();
      }

      // Draw floating gold particles
      function drawParticles(t) {
        const w = W(), h = H();
        pCtx.clearRect(0, 0, w, h);
        particles.forEach(p => {
          const yOff  = -((t * p.speed * animSpeed / 20) % 100);
          const relY  = ((p.baseY + yOff) % 100 + 100) % 100;
          const opacity = 0.3 + 0.3 * Math.sin(t * 0.03 + p.phase);
          pCtx.beginPath();
          pCtx.arc(p.x / 100 * w, relY / 100 * h, p.size / 2, 0, Math.PI * 2);
          pCtx.fillStyle = `rgba(212,175,55,${opacity})`;
          pCtx.fill();
        });
      }

      // Draw sweeping shimmer
      function drawShimmer(t) {
        const w = W(), h = H();
        sCtx.clearRect(0, 0, w, h);
        const x = ((t * 1.5) % (w * 3)) - w;
        const grad = sCtx.createLinearGradient(x, 0, x + w * 0.6, 0);
        grad.addColorStop(0,   'rgba(212,175,55,0)');
        grad.addColorStop(0.5, `rgba(212,175,55,${0.1 * gradIntensity / 0.7})`);
        grad.addColorStop(1,   'rgba(212,175,55,0)');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, w, h);
      }

      // Main animation loop
      function loop(ts) {
        const t = ts * 0.05;
        drawGeo(t);
        drawParticles(t);
        drawShimmer(t);
        requestAnimationFrame(loop);
      }

      resizeCanvases();
      requestAnimationFrame(loop);
      window.addEventListener('resize', resizeCanvases);

     
    })();