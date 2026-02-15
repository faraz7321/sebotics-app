FROM node:22-bullseye-slim AS base

WORKDIR /server

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS build

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM base AS runtime

COPY --chown=node:node --from=build /server/package*.json ./
COPY --chown=node:node --from=build /server/node_modules ./node_modules
COPY --chown=node:node --from=build /server/prisma ./prisma
COPY --chown=node:node --from=build /server/dist ./dist

ENV NODE_ENV=production
ARG PORT=8080
ENV PORT=${PORT}
EXPOSE ${PORT}
USER node

CMD ["node", "dist/main.js"]
