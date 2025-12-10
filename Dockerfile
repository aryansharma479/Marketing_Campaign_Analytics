# --- STAGE 1: Builder ---
# This stage is for compiling and building the source code.
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy package files and install ALL dependencies (including dev) to run the build.
COPY package.json package-lock.json ./
RUN npm install
# If your project uses a C/C++ native addon (like a database driver), 
# you should install build tools here to compile them:
# RUN apk add --no-cache git python3 make g++

# 2. Copy source code and run the build command.
COPY . .
RUN npm run build

# --- STAGE 2: Runner ---
# This is the small, final production image.
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Security and Utility Setup
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
RUN apk add --no-cache wget 

# 1. Copy only the production dependency files from the host
COPY package.json package-lock.json ./

# 2. **CRITICAL STEP:** Install production dependencies directly into this final image.
# This ensures native bindings (like for PostgreSQL) are compiled against the final Alpine image.
RUN npm install --omit=dev

# 3. Copy the compiled source code (and package.json needed for runtime/scripts if any)
COPY --from=builder /app/dist ./dist
# The package.json file is already copied above, no need to copy it from build stage.

# User and Permissions
USER appuser

EXPOSE 5000

ENV PORT=5000
ENV HOST=0.0.0.0

# Healthcheck definition remains correct
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.cjs"]