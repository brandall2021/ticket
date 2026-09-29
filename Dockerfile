FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --only=production

# Etapa con el Prisma CLI completo (incluye dependencias transitivas como @prisma/config -> effect)
FROM base AS migrator
WORKDIR /migrator
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci
COPY prisma ./prisma

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci
COPY . .
RUN npm run prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache nmap
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma CLI aislado en /migrator con su node_modules completo (no pisa el node_modules del server)
COPY --from=migrator --chown=nextjs:nodejs /migrator /migrator
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "cd /migrator && node node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && cd /app && node server.js"]
