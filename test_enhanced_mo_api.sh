#!/bin/bash

# Enhanced Manufacturing Orders API Test Script
# Tests the new component availability and validation endpoints

BASE_URL="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Enhanced Manufacturing Orders API Test Script ===${NC}"
echo ""

# Test variables
JWT_TOKEN="YOUR_JWT_TOKEN"
AUTH_HEADER="Authorization: Bearer $JWT_TOKEN"

echo -e "${YELLOW}Note: These tests assume you have a valid JWT token${NC}"
echo -e "${YELLOW}Replace 'YOUR_JWT_TOKEN' with an actual token${NC}"
echo ""

echo -e "${BLUE}=== NEW ENDPOINTS TESTING ===${NC}"
echo ""

echo -e "${GREEN}1. Testing Component Availability Check (GET /api/mo/:id/components)${NC}"
echo "Request: GET $BASE_URL/mo/1/components"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/1/components" | jq '.' 2>/dev/null || echo "Response received (install jq for pretty formatting)"
echo ""
echo "---"

echo -e "${GREEN}2. Testing MO Validation (POST /api/mo/:id/validate)${NC}"
echo "Request: POST $BASE_URL/mo/1/validate"
curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" "$BASE_URL/mo/1/validate" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${GREEN}3. Testing BOM Population Data (GET /api/products/:id/bom)${NC}"
echo "Request: GET $BASE_URL/products/1/bom"
curl -s -H "$AUTH_HEADER" "$BASE_URL/products/1/bom" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${GREEN}4. Testing Enhanced MO Creation (POST /api/mo/new-with-bom)${NC}"
echo "Request: POST $BASE_URL/mo/new-with-bom"
echo "Body: {\"productId\": 1, \"quantity\": 10, \"deadline\": \"2025-12-31T23:59:59.000Z\"}"
curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d '{"productId": 1, "quantity": 10, "deadline": "2025-12-31T23:59:59.000Z"}' "$BASE_URL/mo/new-with-bom" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${BLUE}=== EXISTING ENDPOINTS TESTING ===${NC}"
echo ""

echo -e "${GREEN}5. Testing Dashboard Endpoint (GET /api/mo/dashboard)${NC}"
echo "Request: GET $BASE_URL/mo/dashboard"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/dashboard" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${GREEN}6. Testing Dashboard with Filters${NC}"
echo "Request: GET $BASE_URL/mo/dashboard?limit=5&status=draft"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/dashboard?limit=5&status=draft" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${GREEN}7. Testing Single MO Details (assuming MO ID 1 exists)${NC}"
echo "Request: GET $BASE_URL/mo/1"
curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/1" | jq '.' 2>/dev/null || echo "Response received"
echo ""
echo "---"

echo -e "${BLUE}=== WORKFLOW TESTING ===${NC}"
echo ""

echo -e "${GREEN}8. Complete Workflow Test${NC}"
echo -e "${YELLOW}Step 1: Get BOM data for product 1${NC}"
curl -s -H "$AUTH_HEADER" "$BASE_URL/products/1/bom" | jq '.data.totalMaterialCost' 2>/dev/null || echo "BOM data retrieved"

echo -e "${YELLOW}Step 2: Create MO with BOM population${NC}"
NEW_MO_RESPONSE=$(curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d '{"productId": 1, "quantity": 5}' "$BASE_URL/mo/new-with-bom")
echo "$NEW_MO_RESPONSE" | jq '.' 2>/dev/null || echo "MO created"

# Extract MO ID from response (if jq is available)
if command -v jq &> /dev/null; then
    NEW_MO_ID=$(echo "$NEW_MO_RESPONSE" | jq -r '.data.mo.id' 2>/dev/null)
    if [ "$NEW_MO_ID" != "null" ] && [ -n "$NEW_MO_ID" ]; then
        echo -e "${YELLOW}Step 3: Check component availability for new MO ID: $NEW_MO_ID${NC}"
        curl -s -H "$AUTH_HEADER" "$BASE_URL/mo/$NEW_MO_ID/components" | jq '.data.allComponentsAvailable' 2>/dev/null || echo "Components checked"
        
        echo -e "${YELLOW}Step 4: Validate new MO${NC}"
        curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" "$BASE_URL/mo/$NEW_MO_ID/validate" | jq '.data.canConfirm' 2>/dev/null || echo "MO validated"
    else
        echo -e "${RED}Could not extract MO ID from response${NC}"
    fi
else
    echo -e "${YELLOW}Install jq for automated workflow testing${NC}"
fi

echo ""
echo "---"

echo -e "${GREEN}=== Test Completed ===${NC}"
echo ""
echo -e "${YELLOW}New Features Tested:${NC}"
echo "✓ Component Availability Checking"
echo "✓ MO Validation with Comprehensive Checks"
echo "✓ BOM Population Data Retrieval"
echo "✓ Enhanced MO Creation with Auto Work Orders"
echo "✓ Complete Manufacturing Planning Workflow"
echo ""
echo -e "${YELLOW}Notes:${NC}"
echo "- Replace 'YOUR_JWT_TOKEN' with a valid JWT token"
echo "- Adjust MO/Product IDs based on your database data"
echo "- Install 'jq' for better JSON formatting: sudo dnf install jq"
echo "- Check server logs for detailed error information"
echo ""
echo -e "${YELLOW}To get a JWT token:${NC}"
echo "1. POST $BASE_URL/auth/register"
echo "2. POST $BASE_URL/auth/login"
echo "3. Use the returned token in the Authorization header"
echo ""
echo -e "${YELLOW}Example Complete Manufacturing Workflow:${NC}"
echo "1. GET /api/products/{id}/bom (cost estimation)"
echo "2. POST /api/mo/new-with-bom (create MO with auto work orders)"
echo "3. GET /api/mo/{id}/components (check availability)"
echo "4. POST /api/mo/{id}/validate (comprehensive validation)"
echo "5. PUT /api/mo/{id}/status {\"status\": \"confirmed\"} (confirm if valid)"