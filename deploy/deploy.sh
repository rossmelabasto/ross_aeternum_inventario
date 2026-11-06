#!/usr/bin/env bash
# Publica backend + frontend en lilarch. Uso: deploy/deploy.sh  (desde la raíz del repo)
set -euo pipefail
cd "$(dirname "$0")/.."
DEST=lilarch:aeternum-inventario

echo "→ build del frontend"
(cd frontend && npm run build)

echo "→ copiando a $DEST"
ssh lilarch 'mkdir -p ~/aeternum-inventario/backend ~/aeternum-inventario/dist'
rsync -a --delete --exclude venv --exclude __pycache__ --exclude .env backend/ "$DEST/backend/"
rsync -a --delete frontend/dist/ "$DEST/dist/"
rsync -a deploy/docker-compose.yml deploy/nginx.conf "$DEST/"

echo "→ levantando contenedores"
ssh lilarch 'bash -s' <<'REMOTO'
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH
cd ~/aeternum-inventario
test -f backend/.env || { echo "Falta backend/.env en lilarch"; exit 1; }
docker compose up -d --build
sleep 3
curl -fsS http://127.0.0.1:8108/api/v1/salud && echo
curl -fsS -o /dev/null -w "web %{http_code}\n" http://127.0.0.1:8109/
REMOTO
