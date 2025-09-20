#!/bin/bash

# Test script for the authentication system
BASE_URL="http://localhost:3000/api"

echo "🚀 Testing Authentication System"
echo "================================="

# Test 1: Signup
echo ""
echo "📝 Test 1: User Signup"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "testuser'$(date +%s)'",
    "pwd": "testpassword123",
    "name": "Test User"
  }')

echo "Response: $SIGNUP_RESPONSE"

# Extract token from signup response (if successful)
TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Signup successful, token extracted"
    
    # Test 2: Login
    echo ""
    echo "🔐 Test 2: User Login"
    # Extract loginId from signup response for login test
    USER_LOGIN_ID=$(echo $SIGNUP_RESPONSE | grep -o '"loginId":"[^"]*"' | cut -d'"' -f4)
    
    LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"loginId\": \"$USER_LOGIN_ID\",
        \"pwd\": \"testpassword123\"
      }")
    
    echo "Response: $LOGIN_RESPONSE"
    
    # Test 3: Access Protected Route
    echo ""
    echo "🛡️  Test 3: Access Protected Route (Profile)"
    PROFILE_RESPONSE=$(curl -s -X GET $BASE_URL/profile \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Response: $PROFILE_RESPONSE"
    
    # Test 4: Access Protected Route without Token
    echo ""
    echo "❌ Test 4: Access Protected Route without Token"
    NO_TOKEN_RESPONSE=$(curl -s -X GET $BASE_URL/profile)
    
    echo "Response: $NO_TOKEN_RESPONSE"
    
    # Test 5: Access Protected Route with Invalid Token
    echo ""
    echo "❌ Test 5: Access Protected Route with Invalid Token"
    INVALID_TOKEN_RESPONSE=$(curl -s -X GET $BASE_URL/profile \
      -H "Authorization: Bearer invalid-token")
    
    echo "Response: $INVALID_TOKEN_RESPONSE"
    
else
    echo "❌ Signup failed, cannot continue with other tests"
fi

echo ""
echo "✅ Testing completed!"
echo ""
echo "🔧 To run these tests:"
echo "1. Start your server: yarn dev"
echo "2. In another terminal, run: bash test_auth.sh"