# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
