FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

FROM base AS build

RUN pnpm --filter api build \
  && pnpm --filter web build

FROM build AS api

ENV NODE_ENV=production

EXPOSE 4000

CMD ["pnpm", "--filter", "api", "start"]

FROM build AS web

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
