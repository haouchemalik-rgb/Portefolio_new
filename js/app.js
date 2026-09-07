/* ═══════════════════════════════════════════════════════════════════
   Malik Haouche — portfolio
   Baie animée image par image sur canvas, pilotée au scroll.
   Vanilla JS · Lenis · GSAP + ScrollTrigger

   Budget par image de défilement, tenu volontairement bas :
     — un seul `drawImage`, sans redimensionnement (le canvas a la taille
       native des vues, la mise à l'échelle est faite une fois par le
       compositeur) ;
     — aucun dégradé ni aucune passe hors écran retracés à chaque image :
       le halo et le fondu des bords sont statiques, en CSS ;
     — une seule frame demandée par rAF, quelle que soit la cadence des
       événements de défilement.
   ═══════════════════════════════════════════════════════════════════ */

(() => {
'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_SMALL = window.matchMedia('(max-width: 820px)').matches;

/* ───────────────────────── Données ───────────────────────── */

const NIVEAUX = {
  'Solide': 4, 'Confirmé': 3, 'En cours': 2,
  'Notions': 2, 'À monter': 1, 'À travailler': 1,
};

const GROUPES = {
  infra: {
    caption: 'Le socle : ce que j’administre au quotidien en entreprise.',
    rows: [
      ['Administration Linux', 'Solide'],
      ['Administration Windows Server', 'Solide'],
      ['Virtualisation · VMware', 'Solide'],
      ['Serveurs physiques et virtuels', 'Solide'],
      ['Sauvegarde et restauration', 'Solide'],
      ['Longhorn · stockage distribué', 'Confirmé'],
      ['Postes de travail · MacOS', 'Confirmé'],
      ['Active Directory', 'En cours'],
    ],
  },
  reseau: {
    caption: 'Du parc client aux tunnels chiffrés entre sites.',
    rows: [
      ['Protocoles TCP/IP', 'Solide'],
      ['Aruba · Zyxel · UniFi', 'Solide'],
      ['Pare-feu Sophos', 'Solide'],
      ['WireGuard · NetBird', 'Solide'],
      ['Technologies Cisco', 'Confirmé'],
      ['Segmentation · VLAN', 'Confirmé'],
      ['GNS3 · maquettage', 'Confirmé'],
      ['Wireshark · analyse de trames', 'Confirmé'],
    ],
  },
  cloud: {
    caption: 'Deux clusters en exploitation : un en production, un en lab.',
    rows: [
      ['Kubernetes · K8s', 'Solide'],
      ['K3s · edge et petits clusters', 'Solide'],
      ['Docker', 'Solide'],
      ['GitOps · Argo CD', 'Confirmé'],
      ['CI/CD · GitLab', 'Confirmé'],
      ['Helm · Kustomize', 'Confirmé'],
      ['AWS · Azure', 'Notions'],
    ],
  },
  supervision: {
    caption: 'Savoir qu’une infrastructure va mal — avant que le client n’appelle.',
    rows: [
      ['Zabbix', 'Solide'],
      ['Prometheus · Alertmanager', 'Solide'],
      ['Grafana', 'Solide'],
      ['Loki · centralisation des journaux', 'Confirmé'],
      ['Wazuh · détection et conformité', 'Confirmé'],
      ['Falco · détection à l’exécution', 'Confirmé'],
      ['fail2ban', 'Confirmé'],
      ['rsyslog', 'Confirmé'],
      ['Tempo · traces', 'Notions'],
    ],
  },
  defense: {
    caption: 'Ma cible professionnelle — prévenir, détecter, tracer.',
    rows: [
      ['Kyverno · politiques d’admission', 'Confirmé'],
      ['Vault · gestion des secrets', 'Confirmé'],
      ['MITRE ATT&CK', 'Confirmé'],
      ['Politique de sécurité · RGPD', 'Confirmé'],
      ['Durcissement système', 'Confirmé'],
      ['Règles Sigma', 'En cours'],
      ['Forensic · Velociraptor', 'À monter'],
    ],
  },
  offense: {
    caption: 'Mon bagage d’origine, que je mets au service de la défense.',
    rows: [
      ['Pentest web manuel', 'Solide'],
      ['Burp Suite Proxy', 'Solide'],
      ['nmap · énumération', 'Solide'],
      ['Audit de sécurité', 'Confirmé'],
      ['John the Ripper · patator', 'Confirmé'],
      ['Post-exploitation Linux', 'Confirmé'],
      ['NetExec · BloodHound', 'En cours'],
      ['Reverse engineering', 'À travailler'],
    ],
  },
};

const FORMATIONS = [
  ['Master 2 · Architecte de systèmes d’information', 'ETNA — Ivry-sur-Seine', '2025 — 2026'],
  ['Bachelor · Administrateur d’infrastructures sécurisées', 'ETNA — Ivry-sur-Seine', '2024 — 2025'],
  ['Bachelor · Concepteur de projets SI', 'ETNA — Ivry-sur-Seine', '2024 — 2025'],
  ['Bac +2 · Chargé de projets informatiques', 'ETNA — Ivry-sur-Seine', '2022 — 2024'],
  ['Bac +2 · Intégrateur / développeur web', 'ETNA — Ivry-sur-Seine', '2022 — 2024'],
];

/* Coordonnées relevées sur la dernière vue de la séquence, en pourcentage
   du cadre 716 × 1280 — donc stables quelle que soit la taille d'affichage.
   Si la vidéo source change, ces sept points sont à relever à nouveau. */
const UNITES = [
  { u: 'U8', x: 62.8, y: 14.6, titre: 'Parcours & diplômes',
    role: 'L’écran de supervision, tout en haut : cinq ans d’alternance à l’ETNA, du web à l’architecture des systèmes d’information. Chaque diplôme a été passé pendant que j’administrais des parcs clients.',
    groupe: null },
  { u: 'U7', x: 81.0, y: 42.6, titre: 'Systèmes & infrastructure',
    role: 'Les baies de disques : le stockage et les serveurs que j’administre au quotidien chez les clients.',
    groupe: 'infra' },
  { u: 'U6', x: 51.0, y: 42.8, titre: 'Sécurité défensive',
    role: 'Le pare-feu : prévenir à l’admission, détecter à l’exécution, tracer pour enquêter. Ma cible professionnelle.',
    groupe: 'defense' },
  { u: 'U5', x: 58.0, y: 57.0, titre: 'Réseau & équipements',
    role: 'Les cartes réseau et leur faisceau : du parc client aux tunnels chiffrés entre sites.',
    groupe: 'reseau' },
  { u: 'U4', x: 31.4, y: 35.9, titre: 'Supervision & détection',
    role: 'Les ventilateurs : ce qui tourne en continu, et dont l’arrêt doit se savoir avant l’appel du client. C’est exactement le rôle d’un seuil Zabbix.',
    groupe: 'supervision' },
  { u: 'U2', x: 25.1, y: 50.8, titre: 'Cloud & conteneurs',
    role: 'La carte mère : deux clusters en exploitation, un en production chez OCH, un en lab.',
    groupe: 'cloud' },
  { u: 'U1', x: 60.8, y: 76.6, titre: 'Sécurité offensive',
    role: 'L’alimentation, tout en bas : mon bagage d’origine, celui sur lequel repose le reste.',
    groupe: 'offense' },
];

const DEPOTS = [
  ['etna-sak5', 'Sécurité & audit Kubernetes', 'Audit et durcissement d’un cluster : politiques, scripts de contrôle et tests.'],
  ['etna-k3s', 'Cluster K3s & supervision', 'Manifestes de déploiement et procédure de validation, documentées pas à pas.'],
  ['etna-mp3-terraform', 'Infrastructure as code', 'Provisionnement AWS décrit en Terraform.'],
  ['etna-virtualisation', 'Virtualisation', 'Mise en place et exploitation d’un environnement virtualisé.'],
  ['etna-cisco-2', 'Réseau Cisco', 'Topologies Packet Tracer et configurations, par étapes.'],
  ['etna-rtp-tdd', 'Développement piloté par les tests', 'Projet mené en TDD, avec rapports de couverture.'],
  ['etna-algorithmique', 'Algorithmique', 'Série d’exercices en C, un dossier par problème.'],
];

/* ───────────────────────── Séquence d'images ───────────────────────── */

const TOTAL_FRAMES = 103;   /* baie2.mp4, 0 → 9,4 s à 11 i/s */
const FRAME_W      = 716;   /* définition native de la source : ne pas réduire */
const FRAME_H      = 1280;
const STRIDE       = IS_SMALL ? 2 : 1;   /* mémoire des téléphones */

/* La décomposition doit s'achever AU MOMENT de « la baie est démontée »,
   pas à mi-parcours : la dernière section entre à 90 % de la course.
   1.08 place la dernière vue à ~92,6 %. */
const FRAME_SPEED  = 1.08;

const indices = [];
for (let i = 1; i <= TOTAL_FRAMES; i += STRIDE) indices.push(i);
if (indices[indices.length - 1] !== TOTAL_FRAMES) indices.push(TOTAL_FRAMES);
const FRAME_COUNT = indices.length;

const src = n => `frames/frame_${String(n).padStart(4, '0')}.webp`;
const frames = new Array(FRAME_COUNT);

/* ───────────────────────── Canvas ───────────────────────── */

const canvasWrap = document.querySelector('.canvas-wrap');
const canvas     = document.getElementById('canvas');
/* `desynchronized` retire le tracé de la synchronisation avec le
   compositeur : le navigateur peut peindre dès que le drawImage est prêt,
   sans attendre le prochain cycle de composition. Ignoré sans effet là où
   il n'est pas pris en charge. */
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

canvas.width  = FRAME_W;
canvas.height = FRAME_H;

let currentFrame = -1, wantedFrame = 0, rafId = 0;

/* Les vues sont opaques et couvrent tout le canvas : pas de clearRect,
   un seul drawImage sans mise à l'échelle. C'est le tracé le moins cher
   possible, et c'est tout ce qui se passe pendant le défilement. */
function paint() {
  rafId = 0;
  const img = frames[wantedFrame];
  if (!img || wantedFrame === currentFrame) return;
  currentFrame = wantedFrame;
  ctx.drawImage(img, 0, 0);
}

function requestFrame(i) {
  wantedFrame = i;
  if (!rafId) rafId = requestAnimationFrame(paint);
}

function drawNow(i) {
  const img = frames[i];
  if (!img) return;
  currentFrame = i;
  ctx.drawImage(img, 0, 0);
}

/* ───────────────────────── Préchargement ───────────────────────── */

const loader    = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderPct = document.getElementById('loader-percent');

/* `createImageBitmap` plutôt que `<img>` + `decode()` : une bitmap est une
   ressource explicite que le navigateur garde résidente côté GPU tant
   qu'on la référence. Un `<img>` détaché du DOM, lui, peut voir ses pixels
   décodés réévincés sous pression mémoire — avec 103 vues en définition
   native tenues en mémoire, c'était la cause la plus probable des à-coups
   pendant un défilement rapide : la vue devait être redécodée à la volée
   au lieu d'être simplement recopiée sur le canvas. */
const HAS_BITMAP = typeof createImageBitmap === 'function';

function loadImage(slot) {
  const url = src(indices[slot]);

  if (HAS_BITMAP) {
    return fetch(url)
      .then(r => r.blob())
      .then(createImageBitmap)
      .then(bmp => { frames[slot] = bmp; })
      .catch(() => { frames[slot] = null; });
  }

  return new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const done = () => { frames[slot] = img; resolve(); };
      img.decode ? img.decode().then(done, done) : done();
    };
    img.onerror = () => { frames[slot] = null; resolve(); };
    img.src = url;
  });
}

let loaded = 0;
function tick() {
  loaded++;
  const p = Math.round((loaded / FRAME_COUNT) * 100);
  loaderBar.style.width = p + '%';
  loaderPct.textContent = p + '%';
}

async function preload() {
  document.body.classList.add('is-loading');

  const head = Math.min(8, FRAME_COUNT);
  await Promise.all(Array.from({ length: head }, (_, i) => loadImage(i).then(tick)));
  drawNow(0);

  const rest = [];
  for (let i = head; i < FRAME_COUNT; i++) rest.push(i);
  const BATCH = 10;
  for (let i = 0; i < rest.length; i += BATCH) {
    await Promise.all(rest.slice(i, i + BATCH).map(s => loadImage(s).then(tick)));
  }

  loader.classList.add('done');
  document.body.classList.remove('is-loading');
  setTimeout(() => { loader.style.display = 'none'; }, 950);
  start();
}

/* ───────────────────────── Défilement ───────────────────────── */

let lenis = null;

function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  if (REDUCED || typeof Lenis === 'undefined') { ScrollTrigger.refresh(); return; }

  lenis = new Lenis({
    /* `lerp` plutôt que `duration` + `easing` : une molette crantée envoie
       peu d'événements, mais chacun couvre une grande distance d'un coup.
       En mode duration/easing, chaque cran relançait un fondu à durée
       fixe, et ces fondus se chevauchaient si les crans arrivaient vite —
       d'où la sensation saccadée. En lerp, la position affichée se
       rapproche de la cible d'une fraction constante à chaque image
       (ici 10 %) : chaque saut de la molette est absorbé en continu dans
       le même mouvement au lieu de relancer une animation, ce qui donne
       un glissé plutôt qu'une série d'à-coups. 0.1 est la valeur
       généralement recommandée pour une molette physique ; descendre
       vers 0.07 lisse davantage mais ralentit la prise en compte du
       geste, monter vers 0.15 réagit plus vite mais lisse moins. */
    lerp: 0.01,
    smoothWheel: true,
    syncTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -40, duration: 1.4 });
  else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
}

/* ───────────────── Les sections de la traversée ───────────────── */

const container = document.getElementById('scroll-container');
const sections  = Array.from(document.querySelectorAll('.scroll-section'));

function placeSections() {
  sections.forEach(s => {
    const enter = parseFloat(s.dataset.enter);
    const leave = parseFloat(s.dataset.leave);
    s.style.top = ((enter + leave) / 2) + '%';
  });
}

function buildSection(section) {
  const type    = section.dataset.animation;
  const persist = section.dataset.persist === 'true';
  const enter   = parseFloat(section.dataset.enter) / 100;
  const leave   = parseFloat(section.dataset.leave) / 100;
  const kids    = section.querySelectorAll(
    '.section-label, .section-heading, .section-body, .section-meta, .cta-button, .stat'
  );

  const tl = gsap.timeline({ paused: true });

  if (REDUCED) {
    gsap.set(kids, { opacity: 1, x: 0, y: 0, scale: 1 });
  } else {
    switch (type) {
      case 'fade-up':
        tl.from(kids, { y: 50, opacity: 0, stagger: .12, duration: .9, ease: 'power3.out' }); break;
      case 'slide-left':
        tl.from(kids, { x: -80, opacity: 0, stagger: .14, duration: .9, ease: 'power3.out' }); break;
      case 'slide-right':
        tl.from(kids, { x: 80, opacity: 0, stagger: .14, duration: .9, ease: 'power3.out' }); break;
      case 'scale-up':
        tl.from(kids, { scale: .85, opacity: 0, stagger: .12, duration: 1, ease: 'power2.out' }); break;
      case 'rotate-in':
        tl.from(kids, { y: 40, rotation: 3, opacity: 0, stagger: .1, duration: .9, ease: 'power3.out' }); break;
      case 'stagger-up':
        tl.from(kids, { y: 60, opacity: 0, stagger: .15, duration: .8, ease: 'power3.out' }); break;
      case 'clip-reveal':
        tl.from(kids, { yPercent: 40, opacity: 0, stagger: .15, duration: 1.1, ease: 'power4.out' }); break;
      default:
        tl.from(kids, { y: 40, opacity: 0, stagger: .12, duration: .9, ease: 'power3.out' });
    }
  }

  return { section, tl, counters: buildCounters(section), enter, leave, persist, played: false };
}

/* ───────────────────────── Compteurs ───────────────────────── */

function buildCounters(section) {
  return Array.from(section.querySelectorAll('.stat-number')).map(el => {
    const target   = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const pad      = parseInt(el.dataset.pad || '0', 10);
    const fmt = v => {
      let s = decimals ? v.toFixed(decimals) : String(Math.round(v));
      if (pad) s = s.padStart(pad, '0');
      return s;
    };
    if (REDUCED) { el.textContent = fmt(target); return null; }
    el.textContent = fmt(0);
    const state = { v: 0 };
    return gsap.to(state, {
      v: target, duration: 1.8, ease: 'power1.out', paused: true,
      onUpdate() { el.textContent = fmt(state.v); },
    });
  }).filter(Boolean);
}

/* ───────────────────── Bandeaux horizontaux ───────────────────── */

function initMarquees(refs) {
  document.querySelectorAll('.marquee-wrap').forEach(wrap => {
    const text  = wrap.querySelector('.marquee-text');
    const speed = parseFloat(wrap.dataset.speed) || -25;
    const inP   = parseFloat(wrap.dataset.in);
    const outP  = parseFloat(wrap.dataset.out);

    if (!REDUCED) {
      gsap.to(text, {
        xPercent: speed, ease: 'none',
        scrollTrigger: { trigger: container, start: 'top top', end: 'bottom bottom', scrub: true },
      });
    }
    refs.push(p => {
      const fade = .05;
      let o = 0;
      if (p >= inP - fade && p < inP)        o = (p - (inP - fade)) / fade;
      else if (p >= inP && p <= outP)        o = 1;
      else if (p > outP && p <= outP + fade) o = 1 - (p - outP) / fade;
      wrap.style.opacity = o;
      wrap.classList.toggle('off', o === 0);
    });
  });
}

/* ───────────────────────── Mise en marche ───────────────────────── */

function heroIntro() {
  const words = document.querySelectorAll('.hero-word > span');
  const rest  = ['.hero-label', '.hero-tagline', '.hero-foot', '.scroll-cue']
    .map(s => document.querySelector(s)).filter(Boolean);

  if (REDUCED) { gsap.set([...words, ...rest], { opacity: 1, y: 0 }); return; }

  gsap.timeline({ delay: .15 })
    .from(words, { yPercent: 112, duration: 1.15, stagger: .085, ease: 'power4.out' })
    .from(rest, { y: 26, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out' }, '-=.75');
}

function start() {
  initScroll();
  heroIntro();
  placeSections();

  const built = sections.map(buildSection);
  const refs  = [];

  /* Voile sombre des repères chiffrés */
  const overlay = document.getElementById('dark-overlay');
  const stats   = built.find(b => b.section.classList.contains('section-stats'));
  if (stats) {
    const fade = .04;
    refs.push(p => {
      let o = 0;
      if (p >= stats.enter - fade && p < stats.enter)      o = .94 * (p - (stats.enter - fade)) / fade;
      else if (p >= stats.enter && p <= stats.leave)       o = .94;
      else if (p > stats.leave && p <= stats.leave + fade) o = .94 * (1 - (p - stats.leave) / fade);
      overlay.style.opacity = o;
      overlay.classList.toggle('off', o === 0);
    });
  }

  initMarquees(refs);

  /* Ouverture : le héros s'efface, la baie se pose. Opacité + échelle
     uniquement — un clip-path animé forcerait une repeinture plein écran
     à chaque image. */
  const hero = document.querySelector('.hero-standalone');
  refs.push(p => {
    const o = Math.max(0, 1 - p * 15);
    hero.style.opacity = o;
    hero.style.visibility = o === 0 ? 'hidden' : 'visible';

    const r = REDUCED ? 1 : Math.min(1, Math.max(0, (p - .006) / .06));
    canvasWrap.style.opacity = r;
    canvasWrap.style.transform = `scale(${1.07 - r * .07})`;
  });

  /* Vues liées à la course */
  refs.push(p => {
    const accel = Math.min(p * FRAME_SPEED, 1);
    requestFrame(Math.min(Math.floor(accel * FRAME_COUNT), FRAME_COUNT - 1));
  });

  /* Entrées / sorties des sections */
  refs.push(p => {
    for (const b of built) {
      const inRange = p >= b.enter - .006 && p <= b.leave + .006;
      if (inRange || (b.persist && p > b.leave)) {
        if (!b.played) {
          b.played = true;
          b.tl.play();
          b.counters.forEach(c => c.restart());
        }
      } else if (b.played) {
        b.played = false;
        b.tl.reverse();
        b.counters.forEach(c => c.pause(0));
      }
    }
  });

  ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => { const p = self.progress; for (const fn of refs) fn(p); },
    onLeave:     () => canvasWrap.classList.add('off'),
    onEnterBack: () => canvasWrap.classList.remove('off'),
  });

  for (const fn of refs) fn(0);

  initRack();
  initTimeline();
  initReveals();
  initNav();
  initProgress();

  ScrollTrigger.refresh();
}

/* ───────────────────── Redimensionnement ───────────────────── */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, 200);
});

/* ═══════════════════ La baie interactive ═══════════════════ */

function meter(level) {
  const on = NIVEAUX[level] || 1;
  let out = '<span class="meter">';
  for (let i = 0; i < 4; i++) out += `<i class="${i < on ? 'on' : ''}"></i>`;
  return out + '</span>';
}

function panelHTML(unit, index) {
  let body;

  if (unit.groupe === null) {
    body = '<ul class="panel-formations">' + FORMATIONS.map(([t, e, p]) => `
      <li>
        <div class="pf-titre">${t}</div>
        <div class="pf-meta"><span>${e}</span><span>${p}</span></div>
      </li>`).join('') + '</ul>' +
      '<p class="panel-note">Formé en alternance, donc jamais loin de la production : chaque diplôme a été passé pendant que j’administrais des parcs clients.</p>';
  } else {
    const g = GROUPES[unit.groupe];
    body = `<p class="panel-caption">${g.caption}</p><ul class="panel-rows">` +
      g.rows.map(([name, lvl]) => `
        <li>
          <span class="row-name">${name}</span>
          <span class="row-level">${lvl}</span>
          ${meter(lvl)}
        </li>`).join('') + '</ul>';
  }

  return `
    <div class="panel-swap">
      <div class="panel-head">
        <span class="panel-idx">${String(index + 1).padStart(2, '0')}</span>
        <span class="panel-u">Emplacement ${unit.u}</span>
      </div>
      <h3 class="panel-title">${unit.titre}</h3>
      <p class="panel-role">${unit.role}</p>
      ${body}
    </div>`;
}

function initRack() {
  const hosts = document.getElementById('rack-hotspots');
  const panel = document.getElementById('rack-panel');
  const prev  = document.getElementById('rack-prev');
  const next  = document.getElementById('rack-next');
  const count = document.getElementById('rack-count');
  if (!hosts || !panel) return;

  hosts.innerHTML = UNITES.map((u, i) => `
    <button class="hotspot" type="button"
            style="left:${u.x}%;top:${u.y}%"
            data-i="${i}"
            aria-label="${u.u} — ${u.titre}">${String(i + 1).padStart(2, '0')}</button>
  `).join('');

  const buttons = Array.from(hosts.querySelectorAll('.hotspot'));
  let active = 0;

  function select(i, focusMarker) {
    active = (i + UNITES.length) % UNITES.length;
    buttons.forEach((b, n) => {
      const on = n === active;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    panel.innerHTML = panelHTML(UNITES[active], active);
    if (count) count.innerHTML = `<b>${String(active + 1).padStart(2, '0')}</b> / ${String(UNITES.length).padStart(2, '0')}`;
    if (focusMarker) buttons[active].focus();
  }

  const step = d => select(active + d, true);

  buttons.forEach(b => {
    b.addEventListener('click', () => select(parseInt(b.dataset.i, 10), false));
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    });
  });

  if (prev) prev.addEventListener('click', () => step(-1));
  if (next) next.addEventListener('click', () => step(1));

  select(0, false);

  const repos = document.getElementById('repos');
  if (repos) {
    repos.innerHTML = DEPOTS.map(([nom, sujet, note]) => `
      <li class="reveal">
        <a href="https://github.com/haouchemalik-rgb/${nom}" target="_blank" rel="noopener">
          <span class="repo-name">${nom}</span>
          <span class="repo-subject">${sujet}</span>
          <span class="repo-note">${note}</span>
          <svg class="repo-arrow" viewBox="0 0 24 10" width="24" height="10" aria-hidden="true">
            <path d="M0 5H22M17 1L22 5L17 9" fill="none" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </a>
      </li>`).join('');
  }
}

/* ═══════════════ Parcours : rail qui se remplit ═══════════════ */

function initTimeline() {
  const list  = document.querySelector('.timeline');
  const fill  = document.getElementById('tl-fill');
  const items = Array.from(document.querySelectorAll('.tl-item'));
  if (!list || !items.length) return;

  if (fill) {
    const sizeFill = () => {
      const last = items[items.length - 1];
      fill.style.height =
        (last.offsetTop + Math.min(last.offsetHeight, 220) - items[0].offsetTop) + 'px';
    };
    sizeFill();
    window.addEventListener('resize', sizeFill);

    if (REDUCED) {
      fill.style.transform = 'scaleY(1)';
    } else {
      gsap.to(fill, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: list, start: 'top 65%', end: 'bottom 75%', scrub: .6 },
      });
    }
  }

  items.forEach(item => {
    if (REDUCED) { item.classList.add('lit'); return; }

    ScrollTrigger.create({
      trigger: item,
      start: 'top 72%',
      onEnter:     () => item.classList.add('lit'),
      onLeaveBack: () => item.classList.remove('lit'),
    });

    const parts = item.querySelectorAll(
      '.tl-years, .tl-months, .tl-badge, .tl-org, .tl-role, .tl-resume, .tl-facts li, .tl-stack span'
    );
    gsap.from(parts, {
      y: 26, opacity: 0, duration: .8, stagger: .045, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 78%', once: true },
    });
  });
}

/* ═══════════════════ Révélations de la page ═══════════════════ */

function initReveals() {
  const items = document.querySelectorAll('.reveal');
  if (REDUCED) { items.forEach(el => gsap.set(el, { opacity: 1, y: 0 })); return; }

  items.forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: .95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

/* ═══════════════════ Navigation & progression ═══════════════════ */

function initNav() {
  document.querySelectorAll('[data-scroll]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      if (href === '#top') lenis ? lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0 });
      else scrollToId(href);
    });
  });

  const links = Array.from(document.querySelectorAll('.site-nav a'));
  const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!targets.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach(t => io.observe(t));
}

function initProgress() {
  const fill = document.getElementById('progress-fill');
  if (!fill) return;
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    /* scaleX plutôt que width : une transformation ne déclenche ni
       recalcul de mise en page ni repeinture. */
    onUpdate: self => { fill.style.transform = `scaleX(${self.progress})`; },
  });
}

/* ───────────────────────── Go ───────────────────────── */

preload();

})();
