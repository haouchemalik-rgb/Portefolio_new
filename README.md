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
frames/               103 vues WebP 716 × 1280 (~4,5 Mo au total)
baie.mp4              source
serve.js              serveur statique de développement
```

## Régénérer les vues depuis la vidéo

Trois points ne sont pas cosmétiques :

- **Aucun redimensionnement.** La source fait 716 × 1280, c'est un plafond
  dur. La réduire à l'encodage puis l'étirer à l'affichage était la cause
  d'un rendu mou constaté plus tôt.
- **On coupe à 9,4 s** (`-t 9.4`). Au-delà, la vidéo fait apparaître des
  étiquettes d'annotation dont le texte est de l'anglais inventé
  (« Topicvise panelal », « Dhaproneret chipsets », « Neureaxrve PSU »).
  Elles n'ont pas leur place sur un portfolio, et la vue est déjà
  pleinement éclatée à cet instant.
- **Qualité 82, et non 93.** La séquence pesait 8,5 Mo ; elle en pèse 4,5.
  Comparées au format d'affichage réel (~483 px de large), les deux
  qualités sont indiscernables — la vérification a été faite en recadrant
  les deux à cette taille, côte à côte. C'est la définition qu'il ne faut
  pas toucher, pas le taux de compression. **Toujours réencoder depuis
  `baie.mp4`**, jamais depuis les WebP existants : deux passes avec pertes
  se cumulent.

```
ffmpeg -y -i baie.mp4 -t 9.4 -vf "fps=11" \
  -c:v libwebp -quality 82 -compression_level 6 frames/frame_%04d.webp
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
| 103 vues en 716 px, qualité 82 | compromis entre finesse de l'animation, netteté et poids |
| ouverture après 10 vues | le reste arrive en fond : voir « Temps d'ouverture » |
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

**Une section peut se retrouver trop haut dans l'écran.** Sa position est
le milieu de `data-enter`/`data-leave` (`placeSections()`), et une section
centrée au-delà de ~94 % de la course n'atteint jamais le centre de la
fenêtre : arrivé en bas du défilement, elle reste collée en haut, sur le
menu. La dernière section doit donc être centrée vers 93-94 %, pas plus
haut — c'est pourquoi elle porte `data-enter="87" data-leave="100"` et
`data-persist`.

La traversée comptait une huitième section, « 007 / À vous », dont le
titre annonçait « Sept équipements, sept domaines » — mot pour mot le
titre du chapitre suivant, à un écran de distance. Elle a été retirée, les
six restantes réparties sur toute la course, et les chapitres renumérotés
de 007 à 012.

## Temps d'ouverture

Le site attendait les **103 vues** — 8,5 Mo — avant d'afficher quoi que ce
soit. Or la traversée n'en a besoin d'aucune au départ : le visiteur
arrive sur le titre, et il lui faut plusieurs secondes avant de descendre
assez pour que la baie commence à se démonter. On n'attend donc plus que
`BOOT_FRAMES` (10 vues, ~450 Ko) ; `loadRest()` charge le reste en fond,
dans l'ordre de la course, une fois le site déjà rendu.

Mesuré en bridant la livraison des vues à 120 ms pièce, à 1440 px :

| | avant | après |
|---|---|---|
| site ouvert | 4 631 ms | **1 256 ms** |
| requis avant ouverture | 103 vues | 10 vues |

Contrepartie : le visiteur peut atteindre une vue pas encore arrivée.
`nearestLoaded()` recule alors sur la dernière vue disponible au lieu de
laisser le canvas figé — le décrochage se voit à peine et se résorbe seul
dès que le chargement rattrape. Vérifié en sautant à 55 % de la course
1,5 s après l'ouverture : la baie s'affiche, simplement un peu moins
avancée dans son démontage.

Les deux leviers restants, si besoin : baisser encore `-quality` à
l'encodage (76 reste indiscernable), et monter `BACKGROUND_BATCH` pour
saturer une bonne connexion plus vite.

## Fluidité du défilement

La fluidité ne tient pas à un seul réglage mais à **trois étages**, qui
corrigent trois causes différentes de saccade. Les toucher séparément.

### 1. Le geste — `lerp` de Lenis (`initScroll()`)

Une molette à crans envoie peu d'événements, mais chacun couvre une
grande distance d'un coup. En mode `duration`/`easing`, chaque cran
relançait un fondu à durée fixe, et ces fondus se chevauchaient quand les
crans arrivaient vite — d'où une sensation saccadée. En `lerp`, la
position affichée se rapproche de la cible d'une fraction constante à
chaque image : chaque saut de molette est absorbé en continu.

Valeur : **`0.085`**. Une valeur de `0.01` avait été essayée pour « lisser
au maximum » : le glissé était effectivement lisse, mais la page
continuait sur sa lancée longtemps après l'arrêt de la molette et mettait
un temps visible à repartir — plus proche de la nage que du défilement.
Le lissage a été redistribué sur les deux étages suivants, qui lissent
l'image sans retarder le geste.

- plus réactif → monter vers `0.12` ;
- plus flottant → descendre vers `0.06`, pas en dessous.

### 2. Le rendu — `SCENE_LERP`

Même lissé, le défilement avance par paliers : un événement, une
position, puis plus rien pendant quelques images. Rendre la scène
directement sur ces paliers revient à afficher la même chose plusieurs
images de suite, puis à sauter.

La progression *affichée* poursuit donc la progression *réelle* à chaque
image au lieu de lui être égale (`0.18`). La scène a toujours quelque
chose à dessiner entre deux événements. Coût : ~4 images de retard,
invisibles.

### 3. L'image — fondu entre deux vues (`paintAt()`)

103 vues sur 900vh, ce sont **~80 px de défilement par vue**. Entre deux,
il n'existe aucune image à montrer : aucun réglage de scroll ne peut
combler ce trou. On fabrique l'image manquante en superposant la vue
suivante à la précédente avec l'opacité du reste de course.

Actif sur ordinateur seulement (`BLEND`) : c'est un second `drawImage` par
image, et sur téléphone `STRIDE` ne garde déjà qu'une vue sur deux. À
l'arrêt, la vue se cale sur l'entier le plus proche — un fondu figé à
mi-chemin donnerait une image dédoublée.

Les défilements programmés (clic sur un lien du menu) passent leur propre
`duration` à `lenis.scrollTo(...)`, qui prime sur ce réglage — ils
restent des fondus classiques.

Un projet antérieur avait exploré des boutons de défilement dédiés
(« maintenir pour glisser »). Retirés : sur Firefox, les Pointer Events
utilisés déclenchaient un `pointercancel` prématuré dès que le bouton
changeait de forme au clic (`transform` sur l'état actif), coupant le
glissé presque aussitôt après son démarrage. Le réglage de `lerp`
ci-dessus reste la façon de rendre le défilement à la molette plus fluide.

## `prefers-reduced-motion` — à savoir avant de déboguer

Quand le système est réglé sur « réduire les animations » (Windows :
Paramètres → Accessibilité → Effets visuels → **Effets d'animation**), la
page coupe **presque tout** : Lenis n'est même pas instancié, donc pas de
défilement lissé, pas de bandeaux qui glissent, pas d'entrées de section,
et les repères chiffrés s'affichent directement au lieu de rouler.

C'est voulu — mais ça se confond très bien avec un bug, parce que le site
ne dit rien. Devant un « telle animation ne se fait pas sur mon PC alors
qu'elle se fait sur mon téléphone », **vérifier ce réglage en premier** :
c'est la seule différence qui coupe tout d'un coup, et elle est
machine-par-machine, pas navigateur-par-navigateur.

Attention aussi en test automatisé : **Chrome et Edge en `--headless`
rapportent `reduce` par défaut**, quel que soit le réglage du système, et
le drapeau `--force-prefers-reduced-motion=no-preference` n'y change rien.
Une capture headless montre donc le chemin « mouvement réduit », pas celui
que voit un visiteur ordinaire. Pour tester le chemin animé, remplacer
l'expression `matchMedia(...)` à la volée dans le fichier servi.

Deux choses ne sont volontairement plus coupées par ce réglage :

- **le fondu entre deux vues** (`BLEND`) — il n'ajoute aucun mouvement, il
  ne fait qu'adoucir celui que le défilement produit déjà ;
- **le défilement des chiffres**, désormais raccourci plutôt que
  supprimé (`ROLL_CYCLES_REDUCED`). Le réglage vise les mouvements amples
  et prolongés, ceux qui déclenchent des troubles vestibulaires. Un
  chiffre qui bascule dans une fenêtre d'un caractère de haut n'en fait
  pas partie ; le couper entièrement rendait la section muette sur toute
  machine où le réglage est actif, sans que rien ne l'explique.

  **Un** tour complet, pas zéro. Zéro avait été essayé : chaque chiffre
  allait droit à sa valeur, donc parcourait une distance différente — neuf
  cellules pour un « 9 », une seule pour un « 1 », aucune pour un « 0 »
  déjà en place. La moitié des chiffres sautaient au lieu de rouler et
  l'ensemble paraissait haché. Avec un tour, tous parcourent dix à
  dix-neuf cellules : **c'est l'uniformité des courses qui fait la
  fluidité, pas la durée.** À retenir si l'on retouche `ROLL_CYCLES`.

- **les entrées de texte**, qui ne sont plus supprimées mais réduites à un
  **fondu sur place** : plus de glissement, de bascule ni de mise à
  l'échelle. C'est le déplacement que le réglage vise, pas le fait qu'un
  élément apparaisse. Auparavant le texte était simplement déjà écrit, et
  la traversée n'avait plus rien d'une traversée. Vaut pour les sections
  (`buildSection`), le titre d'accueil (`heroIntro`) et les apparitions de
  la page (`initReveals`).

  Attention dans `initReveals` : la feuille de style remet `.reveal` à
  `opacity: 1` sous ce réglage — filet de sécurité si le script ne tourne
  pas. Il faut donc un `fromTo` partant de 0, un `to` vers 1 ne ferait
  rien.

Le reste — défilement lissé, parallaxe, glissement des bandeaux — reste
bien désactivé.

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

### `text-wrap: balance` raccourcit les lignes

Sur téléphone, les titres de la traversée paraissaient collés à gauche,
avec une bande vide sur toute la hauteur à droite — alors que le bloc
occupe bien toute la largeur moins 6 % de marge. Le coupable n'était pas
la mise en page mais la coupure des lignes.

`balance` égalise la longueur des lignes, et **pour y arriver il les
raccourcit toutes**. Sur une colonne large, où le titre tient en une ou
deux lignes, c'est exactement ce qu'on veut. Sur un téléphone, où « Tout
ce que j'administre tient dans ce châssis. » en fait trois ou quatre,
chaque ligne se retrouve nettement plus courte que le cadre — d'où la
bande vide, régulière, sur toute la hauteur du titre.

Par défaut les lignes remplissent donc la largeur (`pretty`, avec `normal`
en repli là où il n'est pas connu). `balance` n'est rétabli qu'en
`(min-width: 1181px) and (min-aspect-ratio: 3/2)`, c'est-à-dire là où la
colonne est assez large pour que le titre tienne en peu de lignes.

À retenir : `balance` se juge sur le **nombre de lignes** que le titre
occupe réellement dans sa colonne, pas sur l'apparence du titre au repos.

### Le couloir suppose une fenêtre en paysage

La largeur laissée au texte se déduit de la **hauteur** de la fenêtre,
puisque c'est la baie verticale qui libère les deux couloirs. Le garde-fou
était un seuil de **largeur** (820 px) — deux grandeurs différentes, d'où
des cas non couverts. Mesuré, mise en page en couloirs conservée :

| fenêtre | rapport | colonne de texte | vide à droite |
|---|---|---|---|
| 1920 × 1080 | 1,78 | 501 px | — |
| 1440 × 900 | 1,60 | 343 px | — |
| 1200 × 900 | 1,33 | 264 px | 381 px |
| téléphone en paysage | 2,22 | 261 px | 378 px |
| téléphone « mode bureau » | 0,45 | 216 px | la baie déborde |

Les trois derniers cas passaient à travers le seuil de largeur : un
téléphone en « mode bureau » annonce ~980 px, un téléphone en paysage
915 px, et une fenêtre d'ordinateur presque carrée bien davantage. Dans
tous, le texte s'entassait à gauche avec un grand vide en face.

Le basculement se fait donc maintenant sur le **rapport** de la fenêtre
(`@media (max-aspect-ratio: 3/2)`) : en dessous, texte pleine largeur sur
voile, comme sur téléphone. Au-dessus, rien ne change. `.canvas-stage`
reçoit en plus un `max-width: 96vw`, sans quoi la baie — dimensionnée en
`96vh` — dépassait la fenêtre sur un format très haut.

### Les couloirs latéraux suivent la baie

La baie est dimensionnée par la **hauteur** de la fenêtre (`96vh` au ratio
716/1280) ; le texte des couloirs l'était par la **largeur** (`padding:
6vw / 66vw`). Sur un écran large et court — 2560 × 1100, par exemple — la
baie devient étroite et centrée pendant que le texte reste collé au bord
gauche : plusieurs centaines de pixels de vide s'ouvrent entre les deux.

Les couloirs sont désormais calculés à partir de la baie elle-même
(`--rack-w` dans `:root`, reprise dans `.align-left` / `.align-right`), et
le bloc de texte est **centré dans son couloir** plutôt que plaqué au bord
de l'écran. Les deux restent solidaires quelle que soit la forme de la
fenêtre — la règle `@media (max-aspect-ratio: 3/2)` qui rattrapait le cas
à la main n'a plus lieu d'être et a été retirée.

La largeur du bloc est en `rem`, pas en `ch` : le `ch` se mesure sur la
police du conteneur, pas sur celle du titre, et donnait une colonne bien
trop étroite pour les grands titres.

### Les repères chiffrés avaient perdu leur enveloppe

`.section-stats` était la seule section de la traversée sans
`.section-inner`. Sur téléphone, la règle `padding: 0 !important` de
`.scroll-section` lui retirait donc ses marges sans que rien ne les
remplace : les chiffres se retrouvaient coupés au bord gauche de l'écran,
sur le fond de la vidéo, sans voile de lecture. Elle a maintenant la même
enveloppe que les autres.

Le filet horizontal de chaque repère est passé de `border-top` à un
pseudo-élément en `scaleX` : un `border` ne s'anime pas, une barre si.
Il se trace au moment où la section entre, piloté par la classe `.lit`
posée par le même code que les autres animations — donc identique dans
tous les formats.

### Le défilement des chiffres

Les repères se comptaient bien de 0 à leur valeur, en interpolant le
nombre lui-même. Le compteur fonctionnait — mais sur des valeurs aussi
basses (3, 9, 2, 16) l'affichage ne traversait que trois ou quatre états
en 1,8 s : il n'y avait rien à voir, le chiffre semblait simplement
apparaître. Le défaut n'était pas dans le déclenchement, il était dans le
choix de la grandeur animée.

Chaque chiffre est donc monté sur sa propre colonne 0-9, répétée
`ROLL_CYCLES` fois, qui défile derrière une fenêtre d'un caractère de haut
et s'arrête sur la bonne valeur — les chiffres se posant de gauche à
droite. Le mouvement ne dépend plus de l'écart entre 0 et la cible :
« 02 » roule autant que « 16 ».

Le déplacement est exprimé en `yPercent`, pas en pixels. Les cellules de
la colonne ayant toutes la même hauteur, amener la cellule d'indice `i` en
haut de la fenêtre revient toujours à décaler la colonne de `i / total` de
sa propre hauteur : rien à mesurer, rien à recalculer au redimensionnement
ni une fois la police chargée. C'est la seule raison pour laquelle
`.stat-digit` et `.stat-digit-cell` doivent garder exactement la même
hauteur.

**Cette hauteur n'est pas `1em`** — c'était l'erreur. À `line-height: 1`,
la zone de texte d'Archivo mesure ~1,084 em : mesuré, la cellule faisait
95,03 px pour un glyphe de 103 px, qui débordait donc de 4 px au-dessus et
au-dessous. La fenêtre laissait voir une tranche des chiffres voisins —
deux demi-chiffres empilés au lieu d'un. `--digit-cell` vaut `1.18em`,
avec un `line-height` égal pour centrer le glyphe, et un `margin` négatif
sur `.stat-number` rattrape le surplus pour que le bloc garde son assise.

**En changeant de police, remesurer.** Le débord dépend entièrement des
métriques : comparer la boîte du glyphe (`Range.getBoundingClientRect()`
sur le contenu d'une cellule) à celle de la cellule, et remonter
`--digit-cell` au-dessus du rapport obtenu.

### Vérifier ce genre d'animation

Les deux chemins — mouvement complet et mouvement réduit — rendent
différemment et **doivent être regardés tous les deux**. Un contrôle
uniquement numérique ne suffit pas non plus : les positions d'arrêt
étaient exactes pendant que l'affichage, lui, était faux. C'est la
capture d'écran qui a montré le défaut.

### Au-delà de 1700 px

Les blocs de texte cessent de grandir vers 1 200 px (au-delà d'une
soixantaine de caractères par ligne, on décroche) dans un cadre qui, lui,
va jusqu'à 1 560 : tout le vide se creusait à droite et la page semblait
poussée vers la gauche. Le cadre de ces blocs est donc recentré sur leur
largeur utile. Les grilles qui savent quoi faire de la largeur — les
quatre piliers, l'explorateur de la baie — gardent le cadre large.

### Bandeaux de fond

Trois causes se cumulaient pour qu'on ne lise jamais la phrase en entier.
Il a fallu les traiter toutes les trois.

**La taille.** Une valeur en `vw` ne peut pas savoir ce que mesure
« Systèmes · Réseaux · Sécurité » dans la police réellement chargée.
`initMarquees()` la mesure donc à une taille de référence et la met à
l'échelle pour qu'elle occupe `MARQUEE_FIT` de la fenêtre (66 % sur
ordinateur, 90 % sur téléphone). Recalculé au redimensionnement.

**La boucle.** Une bande qui boucle ne montre la phrase en entier que si
celle-ci fait au plus la **moitié** de la fenêtre : au-delà, on voit
toujours la fin d'un exemplaire et le début du suivant, jamais une phrase
complète. C'est resté vrai après la mise à l'échelle. La bande ne boucle
donc plus : un seul exemplaire glisse dans le jeu qui lui reste
(`slack = fenêtre − phrase`), en sens opposé d'une bande à l'autre. Elle
bouge toujours avec le défilement, mais reste lisible à tout instant.

C'est aussi pour ça que `MARQUEE_FIT` est bas sur ordinateur : ce qui
n'est pas occupé par la phrase est exactement ce dans quoi elle voyage.
Le monter la grossit et l'immobilise ; le descendre la rapetisse et lui
donne de la course.

**Le contraste.** La bande passe *devant* la baie (z-index 15 contre 10).
Un aplat à faible opacité disparaissait dès qu'il croisait une partie
claire de la scène — le milieu de la phrase s'effaçait. Les lettres sont
maintenant creuses (`-webkit-text-stroke`) : un contour tient sur le fond
sombre comme sur la baie, sans être plus présent qu'un aplat.

### Les repères de section sur ordinateur

Sur téléphone, le texte des sections repose sur un voile pleine largeur et
occupe l'écran. Sur ordinateur il vit dans un couloir, et le numéro y
était noyé dans une ligne de mono de `.68rem` : on ne le voyait pas. Le
numéro est donc sorti du libellé (`<b class="section-num">`) pour être
composé à part — filet laiton, chiffre au-dessus du nom, à la taille du
repère qu'il est.

Sa taille est bornée par la **hauteur** autant que par la largeur
(`min(3.4vw, 5vh)`) : calée sur la seule largeur, elle ajoutait assez de
hauteur au bloc pour en pousser la dernière ligne hors d'un écran de
portable court (1440 × 700).

Un voile local derrière le bloc a été essayé et retiré : à même la scène,
il se lisait comme un rectangle aux bords nets — exactement le défaut
qu'on avait mis du temps à effacer sur la vidéo. Le couloir est déjà
sombre ; c'est la composition du repère, et elle seule, qui donne sa
présence au bloc.

## À vérifier avant mise en ligne

L'hébergeur nommé dans `mentions-legales.html` est **Vercel** : la loi
impose de nommer l'hébergeur réel avec sa raison sociale et son adresse.
Corriger si le site est déployé ailleurs.

## Dépendances

Lenis, GSAP et ScrollTrigger, chargés depuis jsDelivr. Aucun bundler.
