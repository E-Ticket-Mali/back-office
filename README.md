# back-office — Mali E-Ticket

Back-office web (React + Vite + TypeScript) pour administrer le backend Spring
Boot du dépôt : hôtels/chambres, événements/billetterie, réservations,
clients, agents contrôleurs, tableau de bord.

Construit à partir du template `erp-pas` (structure, palette de couleurs,
composants — table, Modal, EntityForm, ConfirmDialog, Sidebar/Topbar) adapté
au domaine e-ticket et connecté au vrai backend (pas de mock/json-server).

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5900
npm run build    # build de production (dist/)
```

Le proxy Vite (`/api` → `VITE_BACKEND_URL`) pointe par défaut sur le backend
déployé (Coolify) — aucun backend local requis. Pour tester contre un
backend Docker local à la place (voir `../backend` ou `../docker`), créer
`back-office/.env.local` :

```
VITE_BACKEND_URL=http://localhost:5000
```

Identifiants admin par défaut (seedés au démarrage du backend) :
`admin@eticket.ml` / `admin123` (variables `DEMO_ADMIN_EMAIL` /
`DEMO_ADMIN_PASSWORD` côté backend pour les changer).

## Déploiement (Netlify)

Le site de prod (`https://stupendous-longma-9a800f.netlify.app`) build avec
`netlify.toml` à la racine : `npm run build` → publie `dist/`, et un redirect
proxy `/api/* → <backend Coolify>/api/:splat` (`status = 200`) fait relayer
les appels API par Netlify côté serveur plutôt que par le navigateur — le
backend n'est servi qu'en HTTP, et un navigateur sur ce site HTTPS
bloquerait un appel direct comme "mixed content". Ne pas définir
`VITE_API_URL` dans les variables d'env du build Netlify : ça court-
circuiterait ce proxy et recasserait le login en mixed content.

## Architecture

Même pattern que `erp-pas` : navigation par state machine (`App.tsx`, pas de
router), un module `api/*.ts` par entité (fetch vers `/api/v1/admin/**`), le
système de table typé (`components/table/`), et le trio
Modal/EntityForm/ConfirmDialog/SuccessPanel pour les flux créer/modifier/
supprimer. `AuthContext.tsx` gère le JWT admin (stocké en `localStorage`,
injecté par `api/http.ts`, déconnexion automatique sur 401).

`theme.ts` est repris à l'identique du template (palette verte/or/terracotta
sur fond crème) — ne pas modifier les valeurs sans raison.
