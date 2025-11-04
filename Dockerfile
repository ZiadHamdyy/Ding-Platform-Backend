    FROM node:20-alpine AS builder

    WORKDIR /app
    
    RUN npm install -g pnpm
    ENV PNPM_HOME="/pnpm"
    ENV PATH="$PNPM_HOME:$PATH"
    
    COPY package*.json pnpm-lock.yaml* ./
    
    RUN pnpm set config ignore-scripts false
    
    RUN pnpm install --frozen-lockfile
    
    COPY . .
    
    RUN npx prisma generate --schema=prisma/schema.prisma
    
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
    COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
    
    ENV PORT=${WEB_PORT}
    EXPOSE ${WEB_PORT}
    
    CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
    