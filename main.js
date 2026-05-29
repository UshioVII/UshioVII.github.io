// ── BLACK HOLE ──
(function () {
  var canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var W, H, BH, frame = 0;
  var CHARS = '01アイウエオカ<>/{}[]()!?#$%&*ABCDEFabcdefghijklmnopqrstuvwxyz'.split('');

  function randomChar() { return CHARS[Math.floor(Math.random() * CHARS.length)]; }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    BH = {
      x: W * 0.5,
      y: H * 0.42,
      r: Math.min(W, H) * 0.038,
      pull: Math.min(W, H) * 0.38,
      G: 0.28
    };
  }
  resize();
  window.addEventListener('resize', resize);

  // Code particles
  var TOTAL = 220;
  var particles = [];

  function mkParticle(scatter) {
    return {
      x: scatter ? Math.random() * W : Math.random() * W,
      y: scatter ? Math.random() * H : -10 - Math.random() * 150,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 1.8 + 0.4,
      char: randomChar(),
      alpha: Math.random() * 0.5 + 0.5,
      size: Math.floor(Math.random() * 3) + 11,
      ct: Math.floor(Math.random() * 25),
      near: false
    };
  }

  for (var i = 0; i < TOTAL; i++) particles.push(mkParticle(true));

  // Accretion disk dots
  var DISK = 320;
  var disk = [];
  for (var d = 0; d < DISK; d++) {
    var layer = Math.random() > 0.5 ? 1 : 2;
    disk.push({
      angle: Math.random() * Math.PI * 2,
      speed: (0.007 + Math.random() * 0.009) * (Math.random() > 0.5 ? 1 : -1),
      ro: (layer === 1 ? 1.15 : 1.55) + (Math.random() - 0.5) * 0.25,
      sz: Math.random() * 2.2 + 0.4,
      alpha: 0.4 + Math.random() * 0.6,
      layer: layer
    });
  }

  function draw() {
    frame++;

    // Dark fade
    ctx.fillStyle = 'rgba(8,8,8,0.14)';
    ctx.fillRect(0, 0, W, H);

    var r = BH.r, bx = BH.x, by = BH.y;

    // ── OUTER GLOW RINGS ──
    for (var g = 5; g >= 0; g--) {
      var gr = ctx.createRadialGradient(bx, by, r, bx, by, r + 30 + g * 30);
      var pulse = 0.8 + Math.sin(frame * 0.025 + g) * 0.2;
      var a = (0.06 - g * 0.008) * pulse;
      gr.addColorStop(0, g < 2 ? 'rgba(0,212,255,' + (a * 3) + ')' : 'rgba(0,255,65,' + a + ')');
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(bx, by, r + 30 + g * 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── RELATIVISTIC JETS ──
    var jLen = r * 9;
    var jW = r * 0.35;
    function jet(yStart, yEnd) {
      var jg = ctx.createLinearGradient(bx, yStart, bx, yEnd);
      jg.addColorStop(0, 'rgba(0,212,255,0.35)');
      jg.addColorStop(0.4, 'rgba(0,212,255,0.1)');
      jg.addColorStop(1, 'transparent');
      ctx.fillStyle = jg;
      ctx.beginPath();
      ctx.ellipse(bx, (yStart + yEnd) / 2, jW * (0.9 + Math.sin(frame * 0.03) * 0.1), Math.abs(yEnd - yStart) / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    jet(by - r, by - r - jLen);
    jet(by + r, by + r + jLen);

    // ── CODE PARTICLES ──
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      var dx = bx - p.x, dy = by - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < r * 0.85) { particles[i] = mkParticle(false); continue; }

      if (dist < BH.pull) {
        var t = 1 - dist / BH.pull;
        var force = BH.G * t * t * 0.45;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 14) { p.vx *= 14 / spd; p.vy *= 14 / spd; }
        p.alpha = Math.max(0.08, dist / (r * 5));
        p.near = dist < BH.pull * 0.35;
      }

      p.x += p.vx; p.y += p.vy;
      p.ct--;
      if (p.ct <= 0) { p.char = randomChar(); p.ct = 6 + Math.floor(Math.random() * 18); }

      if (p.y > H + 20 || p.x < -20 || p.x > W + 20) { particles[i] = mkParticle(false); continue; }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.near ? '#a0ffff' : '#00ff41';
      ctx.font = p.size + 'px JetBrains Mono, monospace';
      ctx.fillText(p.char, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    // ── ACCRETION DISK ──
    ctx.save();
    ctx.translate(bx, by);
    for (var d = 0; d < disk.length; d++) {
      var dp = disk[d];
      dp.angle += dp.speed;
      var dr = r * dp.ro;
      var dx2 = Math.cos(dp.angle) * dr;
      var dy2 = Math.sin(dp.angle) * dr * 0.22;
      var depthAlpha = 0.3 + Math.abs(Math.sin(dp.angle)) * 0.7;
      ctx.globalAlpha = dp.alpha * depthAlpha;
      ctx.fillStyle = dp.layer === 1 ? '#ffffff' : '#00cfff';
      ctx.beginPath();
      ctx.arc(dx2, dy2, dp.sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // ── PHOTON RING ──
    var ringPulse = 0.55 + Math.sin(frame * 0.04) * 0.15;
    ctx.strokeStyle = 'rgba(0,212,255,' + ringPulse + ')';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bx, by, r * 1.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── EVENT HORIZON ──
    var bhg = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    bhg.addColorStop(0, '#000000');
    bhg.addColorStop(0.82, '#000000');
    bhg.addColorStop(1, 'rgba(0,180,255,0.08)');
    ctx.fillStyle = bhg;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  draw();
})();

// ── TYPEWRITER ──
function typewriter(el, texts, speed) {
  speed = speed || 80;
  let ti = 0, ci = 0, del = false;
  function tick() {
    const cur = texts[ti];
    el.textContent = del ? cur.slice(0, ci - 1) : cur.slice(0, ci + 1);
    if (del) ci--; else ci++;
    if (!del && ci === cur.length) { setTimeout(function () { del = true; }, 2400); }
    else if (del && ci === 0) { del = false; ti = (ti + 1) % texts.length; }
    setTimeout(tick, del ? speed / 2 : speed);
  }
  tick();
}

// ── CURSOR ──
function initCursor() {
  var dot = document.getElementById('cursor-dot');
  var ring = document.getElementById('cursor-ring');
  if (!dot || !ring || window.matchMedia('(hover: none)').matches) return;

  document.body.classList.add('custom-cursor');

  var mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
  });

  (function loop() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    ring.style.transform = 'translate(' + (rx - 17) + 'px,' + (ry - 17) + 'px)';
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, .tech-badge, .project-card, .filter-btn').forEach(function (el) {
    el.addEventListener('mouseenter', function () { ring.classList.add('expanded'); dot.classList.add('hidden'); });
    el.addEventListener('mouseleave', function () { ring.classList.remove('expanded'); dot.classList.remove('hidden'); });
  });
}

// ── HERO ENTRANCE ──
function initHeroAnim() {
  if (typeof gsap === 'undefined') return;
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-prefix',    { opacity: 0, y: 18, duration: 0.55 }, 0.15)
    .from('.hero-ascii',     { opacity: 0, duration: 1.1, onComplete: function () { gsap.set('.hero-ascii', { clearProps: 'opacity' }); } }, 0.3)
    .from('.hero-title',     { opacity: 0, y: 16, duration: 0.5 }, 0.85)
    .from('.hero-subtitle',  { opacity: 0, y: 12, duration: 0.45 }, 1.0)
    .from('.hero-ctas .btn', { opacity: 0, y: 16, duration: 0.4, stagger: 0.12 }, 1.12)
    .from('.stat',           { opacity: 0, y: 16, duration: 0.4, stagger: 0.1 }, 1.3)
    .from('.scroll-hint',    { opacity: 0, duration: 0.4 }, 1.65);
}

// ── SCRAMBLE TEXT ──
function scrambleText(el, duration) {
  var CHARS = '01アイウエオカキクケコ<>/{}[]!?#$%&_-=+ABCDEFGHabcdefgh';
  var original = el.innerHTML;
  var text = el.textContent;
  duration = duration || 800;
  var totalFrames = Math.ceil(duration / 24);
  var frame = 0;

  var id = setInterval(function () {
    var progress = frame / totalFrames;
    var locked = Math.floor(progress * text.length);
    el.textContent = text.split('').map(function (c, i) {
      if (c === ' ' || c === '·' || c === '/' || c === '.') return c;
      if (i < locked) return c;
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join('');
    frame++;
    if (frame > totalFrames) {
      clearInterval(id);
      el.innerHTML = original;
    }
  }, 24);
}

// ── SCROLL ANIMATIONS (GSAP) ──
function initScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Generic reveals — skip section-header (scramble handles it) and project cards
  document.querySelectorAll('.reveal').forEach(function (el) {
    if (el.classList.contains('project-card')) return;
    if (el.classList.contains('section-header')) return;
    var delay = 0;
    if (el.classList.contains('reveal-delay-1')) delay = 0.1;
    if (el.classList.contains('reveal-delay-2')) delay = 0.2;
    if (el.classList.contains('reveal-delay-3')) delay = 0.3;
    if (el.classList.contains('reveal-delay-4')) delay = 0.4;

    gsap.fromTo(el,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.72, delay: delay, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });

  // Section headers: fade container + scramble tag and title
  document.querySelectorAll('.section-header').forEach(function (header) {
    var tag   = header.querySelector('.section-tag');
    var title = header.querySelector('.section-title');
    ScrollTrigger.create({
      trigger: header,
      start: 'top 85%',
      once: true,
      onEnter: function () {
        gsap.fromTo(header, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        if (tag)   scrambleText(tag, 650);
        if (title) { setTimeout(function () { scrambleText(title, 1000); }, 200); }
      }
    });
  });

  // Timeline items: GSAP handles y/opacity, scramble handles text
  document.querySelectorAll('.timeline-item').forEach(function (item) {
    var date  = item.querySelector('.timeline-date');
    var title = item.querySelector('.timeline-title');
    ScrollTrigger.create({
      trigger: item,
      start: 'top 87%',
      once: true,
      onEnter: function () {
        setTimeout(function () {
          if (date)  scrambleText(date, 420);
          if (title) { setTimeout(function () { scrambleText(title, 680); }, 140); }
        }, 260);
      }
    });
  });

  // Section lines expand
  document.querySelectorAll('.section-line').forEach(function (el) {
    gsap.fromTo(el,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.9, ease: 'power2.inOut',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      }
    );
  });
}

// ── PROJECT CARDS ANIMATION ──
function animateProjectCards() {
  var cards = document.querySelectorAll('#projects-grid .project-card');
  if (!cards.length) return;
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(cards,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.38, stagger: 0.08, ease: 'power2.out' }
    );
  } else {
    cards.forEach(function (c) { c.classList.add('visible'); });
  }
}

// ── DEFAULT PROJECTS (proyectos REALES — se ven en la web publicada) ──
var DEFAULT_PROJECTS = [
  {
    id: 1,
    title: 'CLI-001 — Clasificador de clientes con IA',
    description: 'Automatización con n8n + Claude que recibe los mensajes de clientes, los analiza con IA y los clasifica automáticamente (intención, urgencia, presupuesto, tipo de proyecto), guardando cada consulta en una base de datos. Sistema real, funcionando en producción.',
    tech: ['n8n', 'Claude AI', 'Automatización', 'Webhooks'],
    category: 'ia', badge: 'ai', url: '', github: '', placeholder: false
  },
  {
    id: 2,
    title: 'AK47 Store — Landing Streetwear',
    description: 'Landing page para tienda de gorras y streetwear. Diseño urbano con animaciones, galería de productos y conexión directa a Instagram y TikTok para consultas y ventas.',
    tech: ['HTML', 'CSS', 'JavaScript', 'UI Design'],
    category: 'cliente', badge: 'client', url: 'ak47/', github: '', placeholder: false
  },
  {
    id: 3,
    title: 'E-commerce — Claves de Videojuegos',
    description: 'Plataforma de venta de claves de videojuegos desarrollada en equipo durante la formación en De FORMAR & Digital House. Metodología ágil SCRUM.',
    tech: ['React', 'Node.js', 'Express', 'MySQL'],
    category: 'web', badge: 'featured', url: '', github: 'https://github.com/UshioVII', placeholder: false
  }
];

function getProjects() {
  // Los proyectos reales viven en el código (DEFAULT_PROJECTS) para que se vean
  // en la web publicada. El panel admin (localStorage) solo afecta tu navegador local.
  var stored = localStorage.getItem('drm_projects');
  if (stored) {
    try {
      var parsed = JSON.parse(stored);
      if (parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return DEFAULT_PROJECTS;
}

function renderProjects(filter) {
  filter = filter || 'all';
  var grid = document.getElementById('projects-grid');
  if (!grid) return;
  var projects = getProjects();
  var list = filter === 'all' ? projects : projects.filter(function (p) { return p.category === filter; });
  grid.innerHTML = '';

  var badgeMap = {
    featured: { cls: 'badge-featured', txt: '★ Destacado' },
    client:   { cls: 'badge-client',   txt: '◆ Cliente' },
    ai:       { cls: 'badge-ai',       txt: '◈ AI / ML' }
  };

  list.forEach(function (p, i) {
    var b = badgeMap[p.badge] || badgeMap.featured;
    var delay = (i % 4) + 1;
    var githubLink = p.github ? '<a href="' + p.github + '" target="_blank" class="project-link">⟨/⟩ GitHub</a>' : '';
    var liveLink   = p.url    ? '<a href="' + p.url    + '" target="_blank" class="project-link live">↗ Ver live</a>' : '';
    var noLinks    = (!p.github && !p.url) ? '<span class="project-link" style="color:var(--border)">//&nbsp;links&nbsp;pendientes</span>' : '';
    var phNote     = p.placeholder ? '<p class="placeholder-note">// placeholder — cargá el real desde el panel admin</p>' : '';

    var card = document.createElement('div');
    card.className = 'project-card reveal reveal-delay-' + delay;
    card.innerHTML =
      '<span class="project-badge ' + b.cls + '">' + b.txt + '</span>' +
      '<h3 class="project-title">' + p.title + '</h3>' +
      '<p class="project-desc">' + p.description + '</p>' +
      phNote +
      '<div class="project-tech">' + p.tech.map(function (t) { return '<span class="tech-tag">' + t + '</span>'; }).join('') + '</div>' +
      '<div class="project-links">' + githubLink + liveLink + noLinks + '</div>';
    grid.appendChild(card);
  });
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderProjects(btn.dataset.filter);
      animateProjectCards();
    });
  });
}

// ── CONTACT FORM ──
// Para que los mensajes te lleguen al mail de verdad:
//   1. Creá una cuenta gratis en https://formspree.io
//   2. Creá un formulario y copiá tu endpoint (algo como https://formspree.io/f/abcdwxyz)
//   3. Pegalo abajo en FORMSPREE_ENDPOINT.
// Si lo dejás vacío, el formulario abre el mail del visitante con el mensaje ya cargado (fallback).
var FORMSPREE_ENDPOINT = ''; // ← pegá acá tu endpoint de Formspree
var CONTACT_EMAIL = 'diegomontesraul@gmail.com';

function initForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var orig = btn.textContent;

    var data = {
      nombre: (form.querySelector('[name="nombre"]') || {}).value || '',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      mensaje: (form.querySelector('[name="mensaje"]') || {}).value || ''
    };

    function done(ok) {
      btn.textContent = ok ? '✓ Mensaje enviado' : '✓ Abriendo tu mail…';
      btn.style.cssText = 'background:var(--green);color:#000;';
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.cssText = '';
        form.reset();
      }, 3000);
    }

    if (FORMSPREE_ENDPOINT) {
      btn.textContent = 'Enviando…';
      fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        done(res.ok);
        if (!res.ok) mailtoFallback(data);
      }).catch(function () {
        done(false);
        mailtoFallback(data);
      });
    } else {
      mailtoFallback(data);
      done(false);
    }
  });
}

function mailtoFallback(data) {
  var subject = encodeURIComponent('Contacto desde el portfolio — ' + (data.nombre || 'sin nombre'));
  var body = encodeURIComponent(
    'Nombre: ' + data.nombre + '\n' +
    'Email: ' + data.email + '\n\n' +
    data.mensaje
  );
  window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', function () {
  // Lenis smooth scroll
  var lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  // Typewriter
  var typed = document.getElementById('typed-text');
  if (typed) typewriter(typed, ['Automatización con IA', 'Workflows con n8n + Claude', 'Fullstack Developer', 'Webs a medida']);

  // Effects
  initCursor();
  initHeroAnim();
  initScrollAnimations();

  // Projects
  renderProjects();
  animateProjectCards();
  initFilters();
  initForm();

  // Anchor links via Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      var t = document.querySelector(href);
      if (!t) return;
      e.preventDefault();
      if (lenis) { lenis.scrollTo(t, { offset: -70 }); }
      else { t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
});
