#!/bin/bash

echo "🚀 Setting up Financial Agent Application..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..
echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Check if server/.env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  server/.env file not found. Creating from template..."
    cp server/.env.example server/.env
    echo "✅ Created server/.env file"
    echo ""
    echo "⚠️  IMPORTANT: Update server/.env with your MongoDB URI and secrets!"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update server/.env with your configuration"
echo "2. Start MongoDB (or use Docker Compose)"
echo "3. Run 'npm run dev' to start development servers"
echo ""
echo "🐳 Or use Docker:"
echo "   docker-compose up -d"
echo ""
