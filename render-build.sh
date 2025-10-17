#!/bin/bash

# Render build script for AInspect Backend
echo "Starting Render build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install chromium --with-deps

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!"
