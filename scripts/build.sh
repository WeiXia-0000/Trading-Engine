#!/bin/bash

echo "Building Trading Engine..."

# Build backend
echo "Building C++ backend..."
cd backend
mkdir -p build
cd build
cmake ..
make -j$(nproc)
cd ../..

# Build frontend
echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build completed!"
echo "Backend executable: backend/build/trading_engine"
echo "Frontend build: frontend/dist/"
