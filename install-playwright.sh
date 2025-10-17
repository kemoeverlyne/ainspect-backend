#!/bin/bash

# Install Playwright browsers for production deployment
echo "Installing Playwright browsers..."

# Install system dependencies
apt-get update
apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2

# Install Playwright browsers
npx playwright install chromium --with-deps

echo "Playwright browsers installed successfully!"
