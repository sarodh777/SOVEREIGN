#!/bin/bash
# Quick start script for Sovereign Ledger

echo "=========================================="
echo "Sovereign Ledger - Quick Start"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java 17+"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ Java version: $(java -version 2>&1 | head -1)"
echo ""

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL not found. Ensure MySQL 8.0+ is running separately."
    echo "   Or access the database at: localhost:3306"
fi

echo ""
echo "=========================================="
echo "Setup Instructions"
echo "=========================================="
echo ""

echo "1️⃣  BACKEND SETUP (Spring Boot)"
echo "   cd backend"
echo "   ./mvnw clean install"
echo "   ./mvnw spring-boot:run"
echo "   Runs on: http://localhost:8080"
echo ""

echo "2️⃣  FRONTEND SETUP (React + Vite)"
echo "   npm install"
echo "   npm run dev"
echo "   Runs on: http://localhost:5173"
echo ""

echo "3️⃣  BLOCKCHAIN SETUP (Optional - Hardhat)"
echo "   cd blockchain"
echo "   npm install"
echo "   npm run node"
echo "   Runs on: http://localhost:8545"
echo "   (Deploy contracts in another terminal: npm run deploy-local)"
echo ""

echo "=========================================="
echo "Starting Services..."
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Installing frontend dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Now run these in separate terminals:"
echo -e "${BLUE}Terminal 1: Backend${NC}"
echo "  cd backend && ./mvnw spring-boot:run"
echo ""
echo -e "${BLUE}Terminal 2: Frontend${NC}"
echo "  npm run dev"
echo ""
echo -e "${BLUE}Terminal 3 (Optional): Blockchain${NC}"
echo "  cd blockchain && npm run node"
echo "  (Deploy: npm run deploy-local)"
echo ""
echo -e "${GREEN}Open http://localhost:5173 in your browser!${NC}"
