# ================================
# Build Stage
# ================================
FROM node:20-alpine AS build

# Declare ARG inside the stage it is used
ARG NPM_TOKEN

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig*.json ./

# 1. Create .npmrc, Install ALL (including devDeps), and Build
RUN echo "@kariru-k:registry=https://npm.pkg.github.com/" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc && \
    npm ci && \
    rm -f .npmrc

# Copy source and scripts
COPY src ./src
COPY nodemon.json ./
COPY scripts/ ./scripts/

# Build and fix imports
RUN npm run build && node scripts/fix-js-extensions.js

# 2. THE SECRET SAUCE: Prune devDependencies while we are still in the build stage
# Re-create .npmrc briefly just to prune (sometimes needed for private checks)
RUN echo "@kariru-k:registry=https://npm.pkg.github.com/" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc && \
    npm prune --omit=dev && \
    rm -f .npmrc


# ================================
# Production Stage (STAYS CLEAN)
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime tools (curl for healthchecks, pm2 for process management)
RUN apk add --no-cache curl && npm install -g pm2

# Copy package.json so npm knows how to run the start script
COPY package*.json ./

# 3. Copy ONLY the production-ready node_modules from the build stage
# No NPM_TOKEN needed in this stage at all!
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 4004

# Using PM2 to run the app is better for production stability
CMD ["pm2-runtime", "start", "build/index.js"]
