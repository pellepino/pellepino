(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const now = new Date();

  /* ---------- Dati dinamici ---------- */
  const monthsSince = (value) => {
    const [y, m] = value.split('-').map(Number);
    return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1;
  };

  $$('[data-year]').forEach((el) => { el.textContent = now.getFullYear(); });

  $$('[data-since]').forEach((el) => {
    const total = monthsSince(el.dataset.since);
    const years = Math.floor(total / 12);
    const months = total % 12;
    el.textContent = [
      years ? `${years} ann${years === 1 ? 'o' : 'i'}` : '',
      months ? `${months} mes${months === 1 ? 'e' : 'i'}` : '',
    ].filter(Boolean).join(' ');
  });

  /* ---------- Esperienza: colonna sticky solo se entra nello schermo ---------- */
  const expAside = $('.exp__aside');
  if (expAside) {
    const fitAside = () => {
      const top = parseFloat(getComputedStyle(root).fontSize) * 7;
      expAside.classList.toggle('is-sticky', top + expAside.offsetHeight + 24 <= window.innerHeight);
    };
    fitAside();
    document.fonts?.ready.then(fitAside);
    window.addEventListener('resize', fitAside);
  }

  /* ---------- Logo di sfondo: contorno sempre a 1px qualunque sia la dimensione ---------- */
  const heroLogo = $('.hero__bg svg');
  if (heroLogo) {
    const fitStroke = () => {
      if (heroLogo.clientWidth) heroLogo.style.setProperty('--stroke', heroLogo.viewBox.baseVal.width / heroLogo.clientWidth);
    };
    fitStroke();
    window.addEventListener('resize', fitStroke);
  }

  /* ---------- Fallback senza animazioni ---------- */
  root.classList.add('hero-ready');

  const hasGSAP = window.gsap && window.ScrollTrigger;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!hasGSAP || reduceMotion) {
    root.classList.add('no-motion');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#' || id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Split helpers ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
            } else {
              const span = document.createElement('span');
              span.className = 'w';
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    return $$('.w', el);
  };

  const splitChars = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const word = document.createElement('span');
            word.className = 'word';
            [...part].forEach((ch) => {
              const c = document.createElement('span');
              c.className = 'char';
              c.textContent = ch;
              word.appendChild(c);
            });
            frag.appendChild(word);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('char')) {
          if (n.tagName === 'I') n.classList.add('char');
          else walk(n);
        }
      });
    };
    walk(el);
    return $$('.char', el);
  };

  /* ---------- Intro ---------- */
  gsap.set('.hero .line__inner', { yPercent: 115 });
  gsap.set('[data-hero-fade]', { autoAlpha: 0, y: 24 });
  gsap.set('.hero__bg', { autoAlpha: 0, scale: 1.08 });
  const pathLength = (i, el) => el.getTotalLength();
  gsap.set('.hero__bg path', { strokeDasharray: pathLength, strokeDashoffset: pathLength });

  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to('.hero .line__inner', { yPercent: 0, duration: 1.5, stagger: 0.12 })
    .to('.hero__bg', { autoAlpha: 1, scale: 1, duration: 2 }, '<')
    .to('[data-hero-fade]', { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, '-=1.2')
    // Il logo si disegna tratto per tratto
    .to('.hero__bg path', { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.15 }, 0);

  /* ---------- Progress + nav ---------- */
  gsap.to('.progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  const nav = $('.nav');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('nav--hidden', self.direction === 1 && self.scroll() > 240);
    },
  });

  /* ---------- Hero: parallasse in uscita ---------- */
  gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  })
    .to('.hero__line--1', { xPercent: -18, ease: 'none' }, 0)
    .to('.hero__line--2', { xPercent: 14, ease: 'none' }, 0)
    .to('.hero__bg', { yPercent: 45, rotate: -4, ease: 'none' }, 0)
    .to('.hero__grid', { yPercent: 20, opacity: 0.2, ease: 'none' }, 0)
    .to('.hero__meta', { y: -60, autoAlpha: 0, ease: 'none' }, 0);

  /* ---------- Esperienza: timeline verticale ---------- */
  gsap.to('.exp__line span', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.exp__list', start: 'top 70%', end: 'bottom 70%', scrub: true },
  });

  $$('.job').forEach((job) => {
    gsap.from($$('.job__reveal', job), {
      y: 40,
      autoAlpha: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.07,
      scrollTrigger: { trigger: job, start: 'top 82%' },
    });
    gsap.fromTo($('.job__num', job), { yPercent: -10 }, {
      yPercent: -90,
      ease: 'none',
      scrollTrigger: { trigger: job, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  gsap.from('.edu-mini > *', {
    y: 30,
    autoAlpha: 0,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.edu-mini', start: 'top 85%' },
  });

  gsap.from('.stack > div', {
    x: -40,
    autoAlpha: 0,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.stack', start: 'top 85%' },
  });

  /* ---------- Titoli e reveal generici ---------- */
  $$('.reveal-title').forEach((title) => {
    gsap.from($$('.line__inner', title), {
      yPercent: 115,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: title, start: 'top 85%' },
    });
  });

  // Le card del track orizzontale hanno animazioni proprie
  const reveals = $$('[data-reveal]');
  gsap.set(reveals, { autoAlpha: 0, y: 50 });
  ScrollTrigger.batch(reveals, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
    }),
  });

  /* ---------- About: parole che si "accendono" ---------- */
  const aboutText = $('.about__text');
  if (aboutText) {
    const words = splitWords(aboutText);
    gsap.fromTo(words, { opacity: 0.12 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: aboutText, start: 'top 80%', end: 'bottom 50%', scrub: true },
    });
    gsap.fromTo($$('.hl', aboutText), { '--hl': 0 }, {
      '--hl': 1,
      ease: 'none',
      scrollTrigger: { trigger: aboutText, start: 'top 60%', end: 'bottom 45%', scrub: true },
    });
  }

  /* ---------- Contatti ---------- */
  $$('[data-chars]').forEach((el) => {
    const chars = splitChars(el);
    gsap.from(chars, {
      yPercent: 120,
      rotate: 10,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.025,
      scrollTrigger: { trigger: el, start: 'top 80%' },
    });
  });

  gsap.fromTo('.contact__title', { scale: 0.92 }, {
    scale: 1,
    ease: 'none',
    transformOrigin: 'left bottom',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: true },
  });

  /* ---------- Cursore + bottoni magnetici ---------- */
  if (matchMedia('(pointer: fine)').matches) {
    const cursor = $('.cursor');
    root.classList.add('has-cursor');
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button'));
    });
    document.addEventListener('pointerleave', () => gsap.to(cursor, { autoAlpha: 0 }));
    document.addEventListener('pointerenter', () => gsap.to(cursor, { autoAlpha: 1 }));

    const heroBgX = gsap.quickTo('.hero__bg', 'x', { duration: 1.2, ease: 'power3' });
    $('.hero').addEventListener('pointermove', (e) => {
      heroBgX((e.clientX / window.innerWidth - 0.5) * -40);
    });

    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.35);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  $$('.theme-light').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 36px',
      end: 'bottom 36px',
      onToggle: (self) => nav.classList.toggle('nav--light', self.isActive),
    });
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
