# ForkJam

ForkJam est un prototype web expérimental de création musicale collaborative.

Plutôt que de représenter la musique sous forme de timeline linéaire (comme dans un DAW classique),
ForkJam utilise une structure en graphe :
chaque noeud représente une idée musicale, et les branches représentent des variations, des forks
ou des évolutions possibles d’un même morceau.

L’objectif n’est pas de remplacer un DAW existant, mais d’explorer une autre manière de penser
la composition, l’itération et la collaboration musicale.

<img height="320" alt="image" src="https://github.com/user-attachments/assets/7e5121a6-723e-474c-a2ec-13b0268c7cf7" />
<img height="320" alt="Capture d’écran 2026-01-09 à 14 56 48" src="https://github.com/user-attachments/assets/97aa507f-386a-428c-aac8-07c3b375ea6e" />

## Fonctionnalités actuelles

- Graphe interactif de noeuds musicaux
- Lecture de branches et de séquences
- Gestion d’un contexte musical partagé (BPM, timing)
- Premières expérimentations autour de l’audio et de l’interface

Le projet est en work in progress et sert de terrain d’expérimentation technique et conceptuelle.

## Stack technique

- TypeScript
- React
- Tailwind CSS
- Gestion d’état (Zustand)
- Web Audio API (expérimentations audio)
- React Flow

## À propos du projet

Le cœur du travail porte sur la conception d’une interface interactive non linéaire,
la gestion des relations entre entités (nœuds, branches, contexte musical)
et l’exploration de nouveaux workflows pour des outils créatifs.
