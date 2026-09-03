FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY .bin ./.bin
COPY apps ./apps
COPY packages ./packages
COPY docker ./docker
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @aip/database prisma:generate

FROM base AS web
RUN pnpm --filter @aip/web build
ENV NODE_ENV=production
EXPOSE 3000
RUN chmod +x docker/entrypoint-web.sh
ENTRYPOINT ["./docker/entrypoint-web.sh"]
CMD ["pnpm", "--filter", "@aip/web", "start"]

FROM base AS worker
ENV NODE_ENV=production
RUN chmod +x docker/entrypoint-worker.sh
ENTRYPOINT ["./docker/entrypoint-worker.sh"]
CMD ["pnpm", "--filter", "@aip/worker", "start"]
