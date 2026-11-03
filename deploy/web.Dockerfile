# Image nginx pour les front web du dépôt `back-office`.
# Construite par .github/workflows/deploy.yml, depuis la racine du dépôt :
#
#   back-office : docker build -f deploy/web.Dockerfile -t ghcr.io/e-ticket-mali/back-office:TAG .
#   landing     : docker build -f deploy/web.Dockerfile --build-arg APP_DIR=landing \
#                              -t ghcr.io/e-ticket-mali/landing:TAG .
#
# VITE_API_URL n'est pas défini : le back-office appelle /api/v1 en relatif, routé vers le
# backend par l'Ingress (même domaine).
FROM node:20-alpine AS build
ARG APP_DIR=.
WORKDIR /src
COPY ${APP_DIR}/package.json ${APP_DIR}/package-lock.json ./
RUN npm ci
COPY ${APP_DIR}/ ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 8080
