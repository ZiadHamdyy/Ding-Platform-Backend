FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
RUN pnpm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN pnpm install -g prisma

EXPOSE ${PORT}

CMD ["sh", "-c", "prisma migrate deploy && node dist/main.js"]
