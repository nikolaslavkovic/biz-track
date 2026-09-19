#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Nema Node.js. Instaliraj LTS sa https://nodejs.org"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Instaliram zavisnosti (prvi put)..."
  npm install
fi

echo ""
echo "Pokrećem FirmaRačun → http://127.0.0.1:43127"
echo "Zaustavi sa Ctrl+C"
echo ""
npm run dev
