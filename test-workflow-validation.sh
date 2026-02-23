#!/bin/bash

# Test Workflow Validation
# This script tests both frontend and backend validation rules

echo "🧪 Testing Workflow Validation"
echo "================================"
echo ""

# First, let's get a valid token
echo "📝 Step 1: Getting auth token..."

# Try to sign in with admin user
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"testadmin@test.com","password":"password123"}' \
  | jq -r '.session.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to authenticate. Trying alternative credentials..."

  # Try another admin
  TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"cuquojafreipi-6821@yopmail.com","password":"password123"}' \
    | jq -r '.session.access_token')
fi

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Could not get auth token. Please check credentials."
  echo "Try logging in manually at http://localhost:3003/login"
  exit 1
fi

echo "✅ Got auth token"
echo ""

# Test 1: Try to create cycle with MORE than 3 steps
echo "Test 1: More than 3 workflow steps"
echo "-----------------------------------"

RESPONSE=$(curl -s -X POST http://localhost:4000/api/review-cycles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test - More than 3 steps",
    "startDate": "2026-03-01",
    "endDate": "2026-04-30",
    "reviewConfigs": [
      {
        "stepNumber": 1,
        "reviewType": "SELF",
        "startDate": "2026-03-01",
        "endDate": "2026-03-15"
      },
      {
        "stepNumber": 2,
        "reviewType": "MANAGER",
        "startDate": "2026-03-16",
        "endDate": "2026-03-31"
      },
      {
        "stepNumber": 3,
        "reviewType": "PEER",
        "startDate": "2026-04-01",
        "endDate": "2026-04-15"
      },
      {
        "stepNumber": 4,
        "reviewType": "MANAGER",
        "startDate": "2026-04-16",
        "endDate": "2026-04-30"
      }
    ]
  }')

ERROR=$(echo "$RESPONSE" | jq -r '.message // empty')

if [[ "$ERROR" == *"Maximum 3"* ]] || [[ "$ERROR" == *"maximum"* ]]; then
  echo "✅ PASS: Backend correctly rejected 4 steps"
  echo "   Error: $ERROR"
else
  echo "❌ FAIL: Backend should reject more than 3 steps"
  echo "   Response: $RESPONSE"
fi

echo ""

# Test 2: Try to create cycle with DUPLICATE Self Review steps
echo "Test 2: Duplicate Self Review steps"
echo "------------------------------------"

RESPONSE=$(curl -s -X POST http://localhost:4000/api/review-cycles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test - Duplicate SELF",
    "startDate": "2026-03-01",
    "endDate": "2026-04-30",
    "reviewConfigs": [
      {
        "stepNumber": 1,
        "reviewType": "SELF",
        "startDate": "2026-03-01",
        "endDate": "2026-03-15"
      },
      {
        "stepNumber": 2,
        "reviewType": "SELF",
        "startDate": "2026-03-16",
        "endDate": "2026-03-31"
      },
      {
        "stepNumber": 3,
        "reviewType": "MANAGER",
        "startDate": "2026-04-01",
        "endDate": "2026-04-30"
      }
    ]
  }')

ERROR=$(echo "$RESPONSE" | jq -r '.message // empty')

if [[ "$ERROR" == *"Self Review"* ]] || [[ "$ERROR" == *"duplicate"* ]] || [[ "$ERROR" == *"Only one"* ]]; then
  echo "✅ PASS: Backend correctly rejected duplicate SELF steps"
  echo "   Error: $ERROR"
else
  echo "❌ FAIL: Backend should reject duplicate SELF steps"
  echo "   Response: $RESPONSE"
fi

echo ""

# Test 3: Try to create VALID cycle with 3 steps (should work)
echo "Test 3: Valid cycle with 3 steps"
echo "---------------------------------"

RESPONSE=$(curl -s -X POST http://localhost:4000/api/review-cycles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test - Valid 3 Steps",
    "startDate": "2026-03-01",
    "endDate": "2026-04-30",
    "reviewConfigs": [
      {
        "stepNumber": 1,
        "reviewType": "SELF",
        "startDate": "2026-03-01",
        "endDate": "2026-03-15"
      },
      {
        "stepNumber": 2,
        "reviewType": "MANAGER",
        "startDate": "2026-03-16",
        "endDate": "2026-03-31"
      },
      {
        "stepNumber": 3,
        "reviewType": "PEER",
        "startDate": "2026-04-01",
        "endDate": "2026-04-30"
      }
    ]
  }')

CYCLE_ID=$(echo "$RESPONSE" | jq -r '.id // empty')

if [ -n "$CYCLE_ID" ] && [ "$CYCLE_ID" != "null" ]; then
  echo "✅ PASS: Backend accepted valid 3-step cycle"
  echo "   Created cycle ID: $CYCLE_ID"

  # Clean up - delete the test cycle
  curl -s -X DELETE "http://localhost:4000/api/review-cycles/$CYCLE_ID" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  echo "   (Cleaned up test cycle)"
else
  echo "❌ FAIL: Backend should accept valid 3-step cycle"
  echo "   Response: $RESPONSE"
fi

echo ""
echo "================================"
echo "📊 Summary"
echo "================================"
echo ""
echo "Backend API validation tests completed."
echo ""
echo "To test frontend UI validation:"
echo "1. Open browser: http://localhost:3003"
echo "2. Login with valid credentials"
echo "3. Go to Admin → Review Cycles → New Review Cycle"
echo "4. Try to:"
echo "   - Add 4th step (button should be disabled)"
echo "   - Add multiple Self Review steps (dropdown should disable SELF)"
echo "   - Submit form with violations (should show error)"
echo ""
