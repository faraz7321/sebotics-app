FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
ENV VITE_PUBLIC_API_URL=http://localhost:8080/api

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
