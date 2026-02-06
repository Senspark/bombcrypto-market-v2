# Stage 1: Builder
FROM node:24-alpine AS builder
WORKDIR /build

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Runner (Production)
FROM node:24-alpine AS runner
WORKDIR /app

# Copy only production dependencies and built files
COPY --from=builder /build/package.json ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist

ENTRYPOINT ["node", "dist/cmd/main.js"]
