# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user (alpine comes with 'node' user but we can ensure permissions)
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Using default 'node' user is also fine in official images

COPY package*.json ./
# Only install production dependencies
RUN npm install --only=production

COPY --from=builder /app .

# Permissions
RUN chown -R node:node /app
USER node

EXPOSE 5050

CMD ["node", "index.js"]
