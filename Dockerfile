# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Build the application
RUN npm run build

# Remove devDependencies after build
RUN npm ci --only=production && npm cache clean --force

# Create necessary directories
RUN mkdir -p uploads/logos assets logs

# Copy additional assets if they exist (optional)
# COPY assets/ ./assets/

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Set default PORT for Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
