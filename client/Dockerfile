# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests
COPY package.json package.json
COPY shared/package.json shared/package.json
COPY client/package.json client/package.json

# Install all dependencies
RUN npm install

# Copy source
COPY shared/ shared/
COPY client/ client/

# Build client
RUN npm run build --workspace=@shop/client

# ---

FROM nginx:alpine

# Copy built files
COPY --from=builder /app/client/dist /usr/share/nginx/html
