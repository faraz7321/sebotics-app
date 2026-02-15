#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${VITE_PUBLIC_API_URL:=http://localhost:8080/api}"

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${VITE_PUBLIC_API_URL}"
};
EOF

exec nginx -g 'daemon off;'
