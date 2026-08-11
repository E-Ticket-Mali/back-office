# back-office — Mali E-Ticket

Back-office web (React + Vite + TypeScript) pour administrer le backend Spring
Boot du dépôt : hôtels/chambres, événements/billetterie, réservations,
clients, agents contrôleurs, tableau de bord.

Construit à partir du template `erp-pas` (structure, palette de couleurs,
composants — table, Modal, EntityForm, ConfirmDialog, Sidebar/Topbar) adapté
au domaine e-ticket et connecté au vrai backend (pas de mock/json-server).

## Lancer en local

Prérequis : le backend tourne (voir `../backend` ou `../docker`), par défaut
sur `http://localhost:5000`.

```bash
npm install
npm run dev      # http://localhost:5900, proxy /api -> backend:5000
npm run build    # build de production (dist/)
```

Identifiants admin par défaut (seedés au démarrage du backend) :
`admin@eticket.ml` / `admin123` (variables `DEMO_ADMIN_EMAIL` /
`DEMO_ADMIN_PASSWORD` côté backend pour les changer).

## Architecture

Même pattern que `erp-pas` : navigation par state machine (`App.tsx`, pas de
router), un module `api/*.ts` par entité (fetch vers `/api/v1/admin/**`), le
système de table typé (`components/table/`), et le trio
Modal/EntityForm/ConfirmDialog/SuccessPanel pour les flux créer/modifier/
supprimer. `AuthContext.tsx` gère le JWT admin (stocké en `localStorage`,
injecté par `api/http.ts`, déconnexion automatique sur 401).

`theme.ts` est repris à l'identique du template (palette verte/or/terracotta
sur fond crème) — ne pas modifier les valeurs sans raison.
