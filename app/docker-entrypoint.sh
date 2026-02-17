#!/bin/sh
set -eu

: "${PORT:?PORT is required}"
: "${VITE_PUBLIC_API_URL:?VITE_PUBLIC_API_URL is required}"
: "${API_PROXY_TARGET:?API_PROXY_TARGET is required}"

envsubst '${PORT} ${API_PROXY_TARGET}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${VITE_PUBLIC_API_URL}"
};
EOF

exec nginx -g 'daemon off;'
