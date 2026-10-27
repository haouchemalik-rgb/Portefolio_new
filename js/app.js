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
      ['Postes de travail · macOS', 'Confirmé'],
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

/* La décomposition doit s'achever pendant la dernière section, pas à
   mi-parcours : celle-ci entre à 87 % de la course et y reste jusqu'au
   bout. 1.08 place la dernière vue à ~92,6 %. */
const FRAME_SPEED  = 1.08;

const indices = [];
for (let i = 1; i <= TOTAL_FRAMES; i += STRIDE) indices.push(i);
if (indices[indices.length - 1] !== TOTAL_FRAMES) indices.push(TOTAL_FRAMES);
const FRAME_COUNT = indices.length;

const src = n => `frames/frame_${String(n).padStart(4, '0')}.webp`;
const frames = new Array(FRAME_COUNT);

/* ───────────────────────── Canvas ───────────────────────── */

const canvasWrap = document.querySelector('.canvas-wrap');
const canvasStage = document.querySelector('.canvas-stage');
const canvas     = document.getElementById('canvas');
/* `desynchronized` retire le tracé de la synchronisation avec le
   compositeur : le navigateur peut peindre dès que le drawImage est prêt,
   sans attendre le prochain cycle de composition. Ignoré sans effet là où
   il n'est pas pris en charge. */
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

canvas.width  = FRAME_W;
canvas.height = FRAME_H;

let shownFrame = -1, shownMix = -1;

/* Fondu entre deux vues consécutives.

   103 vues réparties sur 900vh, ce sont ~80 px de défilement par vue : la
   décomposition avance donc par paliers visibles, quelle que soit la
   fluidité du défilement lui-même. Aucun réglage de scroll ne peut
   corriger ça — il n'y a tout simplement pas d'image à montrer entre
   deux. On en fabrique une : la vue suivante est superposée à la
   précédente avec l'opacité du reste, et la course redevient continue.

   Le coût est un second `drawImage` par image d'animation. On le paie sur
   ordinateur, pas sur téléphone (où STRIDE ne garde déjà qu'une vue sur
   deux, et où le budget de tracé est le plus serré).

   Ce fondu n'ajoute AUCUN mouvement : il ne fait qu'adoucir celui que le
   défilement produit déjà. Il n'a donc pas à être coupé par
   `prefers-reduced-motion`, contrairement à ce qui était fait ici.

   Les vues sont opaques et couvrent tout le canvas : pas de clearRect,
   et la superposition se comporte comme un fondu simple. */
const BLEND = !IS_SMALL;

/* En deçà, le fondu ne se voit pas et ne mérite pas un tracé de plus. */
const MIX_STEP = .02;

/* La vue voulue peut ne pas être encore arrivée : la séquence se charge
   maintenant en fond, pendant que le site est déjà utilisable. On recule
   alors sur la dernière vue disponible plutôt que de laisser le canvas
   figé sur ce qu'il affichait. Le décrochage se voit à peine, et il se
   résorbe de lui-même dès que le chargement rattrape. */
function nearestLoaded(i) {
  if (frames[i]) return i;
  for (let d = 1; d < FRAME_COUNT; d++) {
    if (i - d >= 0 && frames[i - d]) return i - d;
    if (i + d < FRAME_COUNT && frames[i + d]) return i + d;
  }
  return -1;
}

function paintAt(pos) {
  let i = Math.max(0, Math.min(FRAME_COUNT - 1, Math.floor(pos)));
  if (!frames[i]) {
    i = nearestLoaded(i);
    if (i < 0) return;
    pos = i;
  }
  const a = frames[i];

  const j = Math.min(FRAME_COUNT - 1, i + 1);
  const mix = BLEND && j !== i && frames[j] ? pos - i : 0;

  if (i === shownFrame && Math.abs(mix - shownMix) < MIX_STEP) return;

  ctx.drawImage(a, 0, 0);
  if (mix > MIX_STEP) {
    ctx.globalAlpha = mix;
    ctx.drawImage(frames[j], 0, 0);
    ctx.globalAlpha = 1;
  }
  shownFrame = i;
  shownMix = mix;
}

/* La scène est rendue depuis le ticker de GSAP, c'est-à-dire déjà à
   l'intérieur d'une image d'animation. Y demander une NOUVELLE image pour
   dessiner reportait chaque tracé à l'image suivante : une image de
   retard, en permanence. On dessine donc sur place. */
function drawNow(i) {
  const img = frames[i];
  if (!img) return;
  shownFrame = i;
  shownMix = 0;
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

/* La barre mesure ce qu'on attend vraiment — les vues d'amorçage — et non
   la séquence entière : le reste se charge une fois le site ouvert, et
   compter dessus aurait laissé le visiteur devant un compteur qui monte
   alors que la page est déjà prête. */
let loaded = 0;
function tick() {
  loaded++;
  const p = Math.min(100, Math.round((loaded / BOOT_FRAMES) * 100));
  loaderBar.style.width = p + '%';
  loaderPct.textContent = p + '%';
}

/* Vues nécessaires avant d'ouvrir le site. Le reste arrive derrière.

   La page attendait les 103 vues — plusieurs mégaoctets — avant de
   montrer quoi que ce soit, alors que la traversée n'en a besoin
   d'aucune : le visiteur arrive sur le titre, et il lui faut plusieurs
   secondes avant de descendre assez pour que la baie commence à se
   démonter. Les vues suivantes ont tout le temps d'arriver pendant ce
   temps-là. On n'attend donc que de quoi tenir le premier écran. */
const BOOT_FRAMES = Math.min(10, FRAME_COUNT);

/* Chargement de fond : par petits paquets, dans l'ordre de la course, pour
   que les vues arrivent toujours devant le visiteur plutôt que derrière.
   Assez large pour saturer une bonne connexion, assez étroit pour ne pas
   noyer une mauvaise. */
const BACKGROUND_BATCH = 6;

async function loadRest() {
  for (let i = BOOT_FRAMES; i < FRAME_COUNT; i += BACKGROUND_BATCH) {
    const slice = [];
    for (let j = i; j < Math.min(i + BACKGROUND_BATCH, FRAME_COUNT); j++) slice.push(j);
    await Promise.all(slice.map(loadImage));
  }
}

async function preload() {
  document.body.classList.add('is-loading');

  await Promise.all(
    Array.from({ length: BOOT_FRAMES }, (_, i) => loadImage(i).then(tick))
  );
  drawNow(0);

  loader.classList.add('done');
  document.body.classList.remove('is-loading');
  setTimeout(() => { loader.style.display = 'none'; }, 950);
  start();

  /* Sans await : le site est déjà rendu à la main du visiteur. */
  loadRest();
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
       geste, monter vers 0.15 réagit plus vite mais lisse moins.

       0.01 avait été essayé pour « lisser au maximum » : le glissé était
       lisse, mais la page continuait sur sa lancée bien après l'arrêt de
       la molette et mettait un temps visible à repartir. Le lissage se
       fait maintenant en deux temps — celui-ci, franc, pour suivre le
       geste, puis SCENE_LERP plus bas pour polir le rendu de la scène. */
    lerp: 0.085,
    wheelMultiplier: 0.9,
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
    '.section-label, .section-heading, .section-body, .section-meta, .stat'
  );

  const tl = gsap.timeline({ paused: true });

  /* En mouvement réduit, le texte est simplement VISIBLE.

     Un fondu sur place avait été tenté ici — il faisait dépendre
     l'affichage du texte du bon déclenchement d'une animation. Au moindre
     grain de sable, le texte ne réapparaissait jamais : page blanche.
     Pour un contenu, l'état de repos doit être « lisible », jamais
     « invisible en attendant que quelque chose se passe ».

     Les animations complètes restent disponibles en désactivant le
     réglage système « réduire les animations ». */
  if (REDUCED) {
    gsap.set(kids, { opacity: 1, x: 0, y: 0, scale: 1 });
  } else if (IS_SMALL) {
    /* Une seule entrée sur petit écran, et strictement VERTICALE.

       Les entrées latérales posent le texte à `x: ±80` en attendant leur
       tour. Sur un écran de 411 px, une colonne de 362 px décalée de 80 px
       s'étend jusqu'à 467 px : la page devient plus large que la fenêtre,
       et il faut dézoomer pour en voir le bout. Mesuré exactement ainsi.
       `rotate-in` faisait de même en plus discret, par sa rotation.

       Une translation verticale n'a pas ce défaut : elle ne peut pas
       élargir la page. */
    tl.from(kids, { y: 34, opacity: 0, stagger: .1, duration: .8, ease: 'power3.out' });
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

/* Nombre de passages complets 0→9 avant que le chiffre ne se pose. */
const ROLL_CYCLES = 3;

/* En mouvement réduit, le compteur n'est pas supprimé : il est raccourci.

   `prefers-reduced-motion` vise les mouvements amples et prolongés, ceux
   qui déclenchent des troubles vestibulaires — parallaxes, zooms,
   translations plein écran. Un chiffre qui bascule dans une fenêtre d'un
   caractère de haut n'en fait pas partie. Le couper entièrement, comme
   c'était le cas, allait au-delà de ce que le réglage demande et rendait
   la section muette sur toute machine où il est actif — sans que rien ne
   l'explique au visiteur.

   La variante réduite est donc plus courte, pas plus pauvre : **un** tour
   complet au lieu de trois.

   Zéro tour avait été essayé, et c'était trop peu : chaque chiffre allait
   droit à sa valeur, donc parcourait une distance différente — neuf
   cellules pour un « 9 », une seule pour un « 1 », aucune pour un « 0 »
   déjà en place. La moitié des chiffres sautaient au lieu de rouler, et
   l'ensemble paraissait haché. Un tour complet donne à tous une course
   comparable (dix à dix-neuf cellules) : c'est ce qui fait la fluidité,
   bien plus que la durée. */
const ROLL_CYCLES_REDUCED = 1;

/* Les repères se comptaient de 0 à leur valeur en interpolant le nombre
   lui-même. Sur des valeurs aussi basses — 3, 9, 2, 16 — l'affichage ne
   traversait que trois ou quatre états en 1,8 s : il n'y avait rien à
   voir, le chiffre semblait simplement apparaître.

   Chaque chiffre est donc monté sur sa propre colonne 0-9, répétée, qui
   défile derrière une fenêtre d'un caractère de haut et s'arrête sur la
   bonne valeur. Le mouvement ne dépend plus de l'écart entre 0 et la
   cible : « 02 » roule autant que « 16 ».

   Le déplacement est exprimé en `yPercent` : la colonne est faite de
   cellules de hauteur égale, donc amener la cellule d'indice i en haut de
   la fenêtre revient toujours à la décaler de i/total de sa propre
   hauteur — aucune mesure en pixels, rien à recalculer au
   redimensionnement ni après le chargement de la police. */
function buildCounters(section) {
  return Array.from(section.querySelectorAll('.stat-number')).map(el => {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const pad      = parseInt(el.dataset.pad || '0', 10);
    let text = parseFloat(el.dataset.value).toFixed(decimals);
    if (pad) {
      const [whole, frac] = text.split('.');
      text = whole.padStart(pad, '0') + (frac ? '.' + frac : '');
    }

    const cycles = REDUCED ? ROLL_CYCLES_REDUCED : ROLL_CYCLES;
    const cells  = (cycles + 1) * 10;
    const tracks = [];
    el.textContent = '';

    for (const ch of text) {
      if (ch < '0' || ch > '9') {
        /* Séparateur décimal : il ne roule pas. */
        const fixed = document.createElement('span');
        fixed.className = 'stat-fixed';
        fixed.textContent = ch;
        el.appendChild(fixed);
        continue;
      }
      const window_ = document.createElement('span');
      window_.className = 'stat-digit';
      const track = document.createElement('span');
      track.className = 'stat-digit-track';
      for (let i = 0; i < cells; i++) {
        const cell = document.createElement('span');
        cell.className = 'stat-digit-cell';
        cell.textContent = String(i % 10);
        track.appendChild(cell);
      }
      window_.appendChild(track);
      el.appendChild(window_);
      tracks.push({ track, stop: cycles * 10 + Number(ch) });
    }

    if (!tracks.length) return null;

    const tl = gsap.timeline({ paused: true });
    tracks.forEach(({ track, stop }, i) => {
      tl.fromTo(track,
        { yPercent: 0 },
        /* `power2.out` plutôt que `power3.out` : la décélération est moins
           brutale, la colonne ne se fige pas d'un coup en fin de course. */
        { yPercent: -100 * stop / cells, duration: REDUCED ? 1 : 1.5, ease: 'power2.out' },
        /* Les chiffres se posent de gauche à droite, comme on les lit ;
           décalage resserré en mouvement réduit, où la course est plus
           courte. */
        i * (REDUCED ? .07 : .12));
    });
    return tl;
  }).filter(Boolean);
}

/* ───────────────────── Bandeaux horizontaux ───────────────────── */

/* Part de la largeur de la fenêtre qu'occupe la phrase. Ce qui reste est
   le jeu dans lequel la bande glisse au défilement : plus la phrase est
   petite, plus elle voyage. En dessous de 1, elle est toujours lisible en
   entier — c'est tout l'objet du réglage. */
const MARQUEE_FIT = IS_SMALL ? .9 : .66;
const MARQUEE_MIN = 15;   /* px : en dessous, le bandeau ne se lit plus */
const MARQUEE_MAX = 150;

function initMarquees(refs) {
  document.querySelectorAll('.marquee-wrap').forEach(wrap => {
    const text  = wrap.querySelector('.marquee-text');
    const item  = wrap.querySelector('.marquee-item');
    const dir   = wrap.dataset.dir === 'right' ? 1 : -1;
    const inP   = parseFloat(wrap.dataset.in);
    const outP  = parseFloat(wrap.dataset.out);

    /* Une taille en vw ne sait pas ce que mesure la phrase dans la police
       réellement chargée. On la mesure donc, à une taille de référence,
       puis on met à l'échelle pour qu'elle tienne dans la fenêtre. */
    let itemW = 0, slack = 0;
    let tween = null;

    const fit = () => {
      const vw = window.innerWidth;
      text.style.transform = '';
      text.style.fontSize = '100px';
      const ref = item.getBoundingClientRect().width || 1;
      const size = Math.min(MARQUEE_MAX, Math.max(MARQUEE_MIN, (MARQUEE_FIT * vw) / (ref / 100)));
      text.style.fontSize = size + 'px';
      itemW = item.getBoundingClientRect().width;
      slack = Math.max(0, vw - itemW);
    };

    fit();

    /* Défilement BORNÉ, et non en boucle.

       Une bande qui boucle ne montre la phrase en entier que si celle-ci
       fait au plus la moitié de la fenêtre : au-delà, on voit toujours la
       fin d'un exemplaire et le début du suivant, jamais une phrase
       complète. C'était le cas ici même après l'avoir mise à l'échelle —
       elle occupait 84 % de la largeur.

       Un seul exemplaire, qui glisse dans le jeu qui lui reste
       (`slack`), n'a pas ce défaut : il est lisible en entier à tout
       instant, et il bouge quand même avec le défilement. */
    const build = () => {
      if (REDUCED || !itemW) return;
      if (tween) { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); }
      const from = dir < 0 ? slack : 0;
      const to   = dir < 0 ? 0 : slack;
      gsap.set(text, { x: from });
      tween = gsap.to(text, {
        x: to, ease: 'none',
        scrollTrigger: { trigger: container, start: 'top top', end: 'bottom bottom', scrub: true },
      });
    };

    build();

    let resizeId = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(() => { fit(); build(); }, 180);
    });
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
    /* L'agrandissement porte sur la SCÈNE, pas sur son cadre.

       `.canvas-wrap` est en `position: fixed; inset: 0` : il fait
       exactement la taille de la fenêtre. Lui appliquer un `scale(1.07)`
       le portait à 440 px sur un écran de 411 — la page s'en trouvait
       élargie de 15 px. `.canvas-stage`, lui, vit à l'intérieur d'un
       `overflow: hidden` : son agrandissement y est confiné.

       Passé par une variable pour ne pas écraser le centrage en
       `translate(-50%, -50%)` posé par la feuille de style. */
    canvasStage.style.setProperty('--stage-scale', (1.07 - r * .07).toFixed(4));
  });

  /* Vues liées à la course */
  refs.push(p => {
    const accel = Math.min(p * FRAME_SPEED, 1);
    const pos = accel * (FRAME_COUNT - 1);
    /* Flou entre deux vues tant que ça bouge, vue franche dès l'arrêt :
       un fondu figé à mi-chemin donnerait une image dédoublée. */
    paintAt(settled ? Math.round(pos) : pos);
  });

  /* Entrées / sorties des sections */
  refs.push(p => {
    for (const b of built) {
      const inRange = p >= b.enter - .006 && p <= b.leave + .006;
      if (inRange || (b.persist && p > b.leave)) {
        if (!b.played) {
          b.played = true;
          b.tl.play();
          /* Les animations portées par le CSS (le filet des repères qui se
             trace) se déclenchent sur cette classe : elles suivent donc
             exactement la même règle d'entrée que les autres, dans tous
             les formats. */
          b.section.classList.add('lit');
          b.counters.forEach(c => c.restart());
        }
      } else if (b.played) {
        b.played = false;
        b.tl.reverse();
        b.section.classList.remove('lit');
        b.counters.forEach(c => c.pause(0));
      }
    }
  });

  /* ── Second lissage, sur la scène elle-même ──

     Le défilement, même lissé par Lenis, avance par paliers : un
     événement de molette, une position, puis plus rien pendant quelques
     images. Rendre la scène directement sur ces paliers, c'est afficher
     la même vue plusieurs images de suite puis sauter — ce sont les
     à-coups qu'on voyait pendant la décomposition.

     La progression affichée poursuit donc la progression réelle à chaque
     image, au lieu de lui être égale. La scène a toujours quelque chose à
     dessiner entre deux événements, et la course des vues devient
     continue. Le coût est un retard très court (~4 images), invisible à
     l'œil mais suffisant pour effacer les paliers.

     Monter SCENE_LERP vers 1 supprime ce lissage ; descendre vers 0.08
     l'accentue au prix d'une traîne perceptible. */
  const SCENE_LERP = REDUCED ? 1 : 0.18;
  let sceneTarget = 0, sceneShown = 0, settled = false;

  const renderScene = () => {
    const d = sceneTarget - sceneShown;
    if (Math.abs(d) < 0.00002) {
      if (settled) return;
      sceneShown = sceneTarget;
      settled = true;
    } else {
      sceneShown += d * SCENE_LERP;
      settled = false;
    }
    for (const fn of refs) fn(sceneShown);
  };

  ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => { sceneTarget = self.progress; settled = false; },
    onLeave:     () => canvasWrap.classList.add('off'),
    onEnterBack: () => canvasWrap.classList.remove('off'),
  });

  gsap.ticker.add(renderScene);

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
