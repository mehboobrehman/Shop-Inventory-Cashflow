# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests
COPY package.json package.json
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source
COPY shared/ shared/
COPY server/ server/

# Build server
RUN npm run build --workspace=@shop/server

# ---

FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json package.json
COPY server/package.json server/package.json
# Need to copy shared package.json too
COPY shared/package.json shared/package.json

RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/server/dist /app/dist
COPY --from=builder /app/server/prisma /app/prisma
COPY --from=builder /app/shared/ /app/shared/

# Install prisma client
RUN npx prisma generate --schema=/app/prisma/schema.prisma

EXPOSE 4000

CMD ["node", "dist/index.js"]
