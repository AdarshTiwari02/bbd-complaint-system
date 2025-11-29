#!/bin/bash

# Docker Setup Script for BBD Complaint System
# This script helps set up the Docker environment

set -e

echo "🐳 BBD Complaint System - Docker Setup"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo ""
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "📦 Setting up MinIO bucket..."
# Create bucket using MinIO client or API
docker-compose exec -T minio sh -c "
    mc alias set local http://localhost:9000 minioadmin minioadmin || true
    mc mb local/bbd-complaints || true
    mc anonymous set download local/bbd-complaints || true
" || echo "⚠️  MinIO bucket setup skipped. Please create 'bbd-complaints' bucket manually at http://localhost:9001"

echo ""
echo "🗄️  Running database migrations..."
docker-compose exec backend npx prisma migrate deploy --schema=../../prisma/schema.prisma

echo ""
echo "🌱 Seeding database..."
docker-compose exec backend npx prisma db seed --schema=../../prisma/schema.prisma || echo "⚠️  Seed script may need to be run manually"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Access points:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:3001/api/v1"
echo "   API Docs:    http://localhost:3001/api/docs"
echo "   MinIO:       http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "👤 Default admin credentials:"
echo "   Email:    admin@bbdu.edu.in"
echo "   Password: Admin@123"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"

