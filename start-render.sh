#!/bin/bash

# Render Deployment Script
# ================================

echo "🚀 Starting DeceptiCall Backend Deployment..."

# Set environment variables
export NODE_ENV=production
export PORT=10000

# Health check configuration
echo "📊 Health check endpoint: /health"
echo "🌐 Server will be available on port: $PORT"

# Start server with specific configurations
echo "🔧 Starting server with production settings..."
node server.js

echo "✅ Server startup completed"
echo "📈 Monitoring health checks..."
echo "🌍 Service should be available at: https://backend-0s9d.onrender.com"
