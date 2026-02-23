#!/bin/bash

echo "🔍 Backend Diagnostics"
echo "====================="
echo ""

# Check if port 4000 is in use
echo "1. Checking port 4000..."
PORT_PID=$(lsof -ti :4000)
if [ -n "$PORT_PID" ]; then
  echo "   ⚠️  Port 4000 is already in use by PID: $PORT_PID"
  echo "   Process details:"
  ps -p "$PORT_PID" -o pid,command
  echo ""
  echo "   To kill it: kill $PORT_PID"
else
  echo "   ✅ Port 4000 is available"
fi
echo ""

# Check Node version
echo "2. Checking Node.js version..."
node --version
echo "   Required: Node 18+"
echo ""

# Check if .env exists
echo "3. Checking .env file..."
if [ -f ".env" ]; then
  echo "   ✅ .env file exists"
  echo "   Contents (secrets hidden):"
  cat .env | sed 's/=.*/=***HIDDEN***/'
else
  echo "   ❌ .env file NOT found!"
  echo "   Create it with:"
  echo "   cp .env.example .env"
fi
echo ""

# Check if node_modules exists
echo "4. Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "   ✅ node_modules exists"
else
  echo "   ❌ node_modules NOT found!"
  echo "   Run: npm install"
fi
echo ""

# Check Prisma client
echo "5. Checking Prisma client..."
if [ -d "node_modules/.prisma/client" ]; then
  echo "   ✅ Prisma client generated"
else
  echo "   ❌ Prisma client NOT generated!"
  echo "   Run: npx prisma generate"
fi
echo ""

# Check database connection
echo "6. Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
  echo "   ✅ Database connection works"
else
  echo "   ❌ Database connection failed!"
  echo "   Check DATABASE_URL in .env"
fi
echo ""

# Try to start backend
echo "7. Attempting to start backend (10 sec test)..."
echo "   Starting..."

npm run start:dev > /tmp/backend-test-output.log 2>&1 &
TEST_PID=$!
sleep 8

# Check if it's still running
if ps -p $TEST_PID > /dev/null 2>&1; then
  echo "   ✅ Backend started successfully!"
  echo "   Testing endpoint..."
  HEALTH=$(curl -s http://localhost:4000/api/health 2>&1 | head -c 100)
  echo "   Response: $HEALTH"
  echo ""
  echo "   Backend is running on PID: $TEST_PID"
  echo "   To stop it: kill $TEST_PID"
else
  echo "   ❌ Backend crashed during startup!"
  echo ""
  echo "   Last 30 lines of error log:"
  echo "   =========================================="
  tail -30 /tmp/backend-test-output.log
  echo "   =========================================="
fi

echo ""
echo "Full log available at: /tmp/backend-test-output.log"
