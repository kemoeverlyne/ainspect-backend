# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Build the application
RUN npm run build

# Remove devDependencies after build but keep Playwright
RUN npm ci --only=production && npm cache clean --force

# Reinstall Playwright browsers after production install
RUN npx playwright install chromium --with-deps

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
