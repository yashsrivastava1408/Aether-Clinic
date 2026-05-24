FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Only install production dependencies
RUN npm install --only=production

# Copy the rest of the application
COPY . .

# Permissions for security
RUN chown -R node:node /app
USER node

EXPOSE 5050

CMD ["node", "index.js"]
