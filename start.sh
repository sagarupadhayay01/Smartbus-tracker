#!/bin/sh
# One-command start: ./start.sh   (builds the website the first time, then serves everything on port 4000)
cd "$(dirname "$0")"
[ -d client/dist ] || npm run build || exit 1
if command -v cloudflared >/dev/null 2>&1; then
  echo "Public link will appear below (look for trycloudflare.com)"
  cloudflared tunnel --url http://localhost:4000 &
fi
npm start
