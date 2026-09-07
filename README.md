# Portfolio — Malik Haouche

Site scroll-driven bâti autour de `baie.mp4` : la vidéo est décomposée en
103 vues rendues sur un `<canvas>` dont la progression est liée au
défilement. La baie se démonte au fil de la descente, puis devient une vue
éclatée cliquable où chaque équipement porte un domaine de compétence.

Thème sombre unique. La vidéo est tournée sur fond sombre — mesuré entre
`#0E0F14` et `#3B383E`, soit la couleur de la page — donc elle s'y pose
sans aucun traitement : ni étalonnage, ni halo, ni voile. Un simple fondu
des bords suffit.

La vidéo est verticale : la baie occupe le tiers central de l'écran et
laisse deux couloirs libres, où vit le texte de la traversée.

## Lancer

Les images doivent être servies en HTTP (pas en `file://`) :

```
node serve.js        # http://localhost:8123
```

## Structure

```
index.html            page principale
mentions-legales.html éditeur, hébergeur, RGPD, propriété, accessibilité
css/style.css         direction artistique complète
js/app.js             canvas, liaison au scroll, chorégraphie, baie interactive
frames/               103 vues WebP 716 × 1280 (~8,5 Mo au total)
baie.mp4              source
serve.js              serveur statique de développement
```

## Régénérer les vues depuis la vidéo

Deux points ne sont pas cosmétiques :

- **Aucun redimensionnement.** La source fait 716 × 1280, c'est un plafond
  dur. La réduire à l'encodage puis l'étirer à l'affichage était la cause
  d'un rendu mou constaté plus tôt.
- **On coupe à 9,4 s** (`-t 9.4`). Au-delà, la vidéo fait apparaître des
  étiquettes d'annotation dont le texte est de l'anglais inventé
  (« Topicvise panelal », « Dhaproneret chipsets », « Neureaxrve PSU »).
  Elles n'ont pas leur place sur un portfolio, et la vue est déjà
  pleinement éclatée à cet instant.

```
ffmpeg -y -i baie.mp4 -t 9.4 -vf "fps=11" \
  -c:v libwebp -quality 93 -compression_level 6 frames/frame_%04d.webp
```

Si la vidéo source change, quatre choses sont à reprendre :

1. `TOTAL_FRAMES`, `FRAME_W`, `FRAME_H` en tête de `js/app.js` ;
2. les attributs `width`/`height` du `<canvas>` dans `index.html` ;
3. l'`aspect-ratio` de `.canvas-stage` et `.rack-figure` dans le CSS ;
4. **les sept coordonnées de `UNITES`** — elles désignent des points
   précis de la dernière vue, relevés à la main.

## Budget de performance

Le coût par image de défilement est tenu volontairement bas :

| Choix | Raison |
|---|---|
| `<canvas>` à la taille native des vues | un seul `drawImage` sans redimensionnement ; la mise à l'échelle est faite une fois par le compositeur |
| voile en CSS statique | aucun dégradé ni passe hors écran retracés à chaque image |
| une seule frame par rAF | les événements de défilement arrivent plus vite que l'affichage |
| aucun `mix-blend-mode`, aucun `clip-path` animé | les deux forcent une recomposition plein écran par image |
| `transform`/`opacity` uniquement | ni recalcul de mise en page, ni repeinture |
| 103 vues en 716 px | compromis entre finesse de l'animation et mémoire des images décodées |
| `STRIDE` de 2 sur mobile | une vue sur deux, pour la mémoire |

## Réglages utiles (`js/app.js`)

| Constante | Rôle |
|---|---|
| `FRAME_SPEED` | 1.08 — la décomposition s'achève à ~93 %, au moment de « la baie est démontée » |
| `TOTAL_FRAMES` | 103, soit 11 i/s sur les 9,4 premières secondes : plus de vues = écarts visuels plus petits d'une vue à l'autre |
| `STRIDE` | 2 sur mobile |
| `UNITES` | les 7 repères cliquables, en % du cadre 716 × 1280 |

Les sections de la traversée se règlent en HTML par `data-enter`,
`data-leave` (en % de la course) et `data-animation`. `FRAME_SPEED` doit
rester cohérent avec le `data-enter` de la dernière section : la
décomposition est calée pour se terminer quand elle apparaît.

## Molette physique

Lenis est configuré en `lerp: 0.01`, le maximum de lissage pratique,
plutôt qu'en `duration`/`easing`. Une molette à crans envoie peu
d'événements mais chacun couvre une grande distance d'un coup ; en mode
`duration`, chaque cran relançait un fondu à durée fixe, et ces fondus se
chevauchaient si les crans arrivaient vite — d'où une sensation saccadée.
En `lerp`, la position affichée se rapproche de la cible d'une fraction
constante à chaque image : chaque saut de molette est absorbé en continu
dans le même mouvement.

Plus la valeur est basse, plus le glissé est lisse — au prix d'un temps de
réponse un peu plus long au tout début du geste. À `0.01`, ce délai
devient nettement perceptible : la page continue de glisser un court
instant après l'arrêt de la molette, et met un peu de temps à repartir
quand on change de sens. C'est le compromis assumé pour le lissage
maximal.

Pour ajuster la sensation (dans `initScroll()`, `js/app.js`) :
- **plus réactif** (moins de traîne) → remonter, vers `0.05`–`0.1` ;
- `0.01` est déjà proche du minimum utile — en dessous, le défilement perd
  le fil du geste plutôt que de sembler plus lisse.

Les défilements programmés (clic sur un lien du menu) passent leur propre
`duration` à `lenis.scrollTo(...)`, qui prime sur ce réglage — ils
restent des fondus classiques.

Un projet antérieur avait exploré des boutons de défilement dédiés
(« maintenir pour glisser »). Retirés : sur Firefox, les Pointer Events
utilisés déclenchaient un `pointercancel` prématuré dès que le bouton
changeait de forme au clic (`transform` sur l'état actif), coupant le
glissé presque aussitôt après son démarrage. Le réglage de `lerp`
ci-dessus reste la façon de rendre le défilement à la molette plus fluide.

## Netteté

Une réduction d'image reste toujours nette ; un agrandissement jamais.
Tout le réglage tient là.

Le format vertical joue en notre faveur : la scène fait `height: 96vh` au
ratio 716/1280, soit environ **483 px de large sur un écran de 1600** pour
une source de **716 px**. C'est une réduction franche, et elle le reste
jusqu'en 1440p. Dans l'explorateur, l'image est affichée à ~440 px de large :
réduction plus franche encore.

C'est le réglage à préserver si la mise en page évolue — c'est aussi
pourquoi les vues sont encodées à la définition native, sans `scale`.

## Responsive

Un vrai bug a été trouvé et corrigé : sur téléphone étroit, « sept
métiers. » (titre d'accueil) pouvait déborder du cadre et être tronqué.
Cause exacte : les deux mots de chaque ligne sont collés dans le HTML
(`</span><span>`, sans espace) pour contrôler leur espacement au pixel
près via `margin`. Sans caractère entre eux, `white-space: normal` seul
n'a rien à casser — il n'existe aucun point de coupure. Le correctif
ajoute un `<wbr>` entre les deux mots de chaque ligne (`index.html`) :
invisible tant que la ligne tient, actif uniquement si elle doit se
couper. L'espacement, qui reposait sur `.hero-word + .hero-word`
(sélecteur de frère adjacent, cassé par le `<wbr>` interposé), a été
réécrit en `margin-left` uniforme + `:first-child` pour ne plus dépendre
de l'adjacence directe.

Si un autre titre venait à être composé mot par mot de la même manière
(plusieurs `<span>` glués, un par mot, pour une animation d'entrée),
le même piège s'appliquerait — c'est actuellement le cas du seul titre
d'accueil, ailleurs le texte est un flux normal qui s'enroule sans aide.

Cibles tactiles des repères de la baie relevées à 44 px sur mobile
(`.hotspot`, recommandation WCAG 2.5.5 / Apple HIG) — elles avaient été
réduites à 28 px dans une itération précédente, dans le mauvais sens.
Vérifié que les repères les plus proches restent à ~88 px l'un de
l'autre une fois convertis en pixels à cette largeur : aucun risque de
chevauchement.

## À vérifier avant mise en ligne

L'hébergeur nommé dans `mentions-legales.html` est **Vercel** : la loi
impose de nommer l'hébergeur réel avec sa raison sociale et son adresse.
Corriger si le site est déployé ailleurs.

## Dépendances

Lenis, GSAP et ScrollTrigger, chargés depuis jsDelivr. Aucun bundler.
