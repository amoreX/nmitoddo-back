#!/bin/bash

# Manufacturing Orders API Test Script
# This script tests the new Manufacturing Orders dashboard API endpoints

BASE_URL="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Manufacturing Orders API Test Script ===${NC}"
echo ""

# First, let's try to authenticate (you'll need to adjust this based on your auth system)
echo -e "${YELLOW}Note: These tests assume you have a valid JWT token${NC}"
echo -e "${YELLOW}Replace 'YOUR_JWT_TOKEN' with an actual token${NC}"
echo ""

# Test variables
JWT_TOKEN="YOUR_JWT_TOKEN"
AUTH_HEADER="Authorization: Bearer $JWT_TOKEN"

echo -e "${GREEN}1. Testing Dashboard Endpoint (GET /api/mo/dashboard)${NC}"
echo "Request: GET $BASE_URL/mo/dashboard"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/dashboard" | jq '.' 2>/dev/null || echo "Response received (install jq for pretty formatting)"
echo ""
echo "---"

echo -e "${GREEN}2. Testing Dashboard with Filters${NC}"
echo "Request: GET $BASE_URL/mo/dashboard?limit=5&status=draft"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/dashboard?limit=5&status=draft" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${GREEN}3. Testing Dashboard Search${NC}"
echo "Request: GET $BASE_URL/mo/dashboard?search=1"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/dashboard?search=1" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${GREEN}4. Testing Single MO Details (assuming MO ID 1 exists)${NC}"
echo "Request: GET $BASE_URL/mo/1"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/1" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${GREEN}5. Testing MO Status Update (assuming MO ID 1 exists)${NC}"
echo "Request: PUT $BASE_URL/mo/1/status"
echo "Body: {\"status\": \"confirmed\"}"
curl -s -X PUT -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d '{"status": "confirmed"}' "$BASE_URL/mo/1/status" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${YELLOW}6. Testing MO Deletion (BE CAREFUL - this will delete/cancel the MO)${NC}"
echo -e "${RED}Uncomment the following line to test deletion:${NC}"
echo "# curl -s -X DELETE -H \"$AUTH_HEADER\" \"$BASE_URL/mo/1\""
echo ""

echo -e "${GREEN}=== Test Completed ===${NC}"
echo ""
echo -e "${YELLOW}Notes:${NC}"
echo "- Replace 'YOUR_JWT_TOKEN' with a valid JWT token"
echo "- Adjust MO IDs based on your database data"
echo "- Install 'jq' for better JSON formatting: sudo dnf install jq"
echo "- Check server logs for detailed error information"
echo ""
echo -e "${YELLOW}To get a JWT token, first create a user and login:${NC}"
echo "1. POST $BASE_URL/auth/register"
echo "2. POST $BASE_URL/auth/login"
echo "3. Use the returned token in the Authorization header"