#!/bin/bash

echo "Starting Trading Engine..."

# Start backend
echo "Starting C++ backend server..."
cd backend/build
./trading_engine &
BACKEND_PID=$!
cd ../..

# Start frontend
echo "Starting React frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Trading Engine started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"

# Wait for user to stop
echo "Press Ctrl+C to stop all services"
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
