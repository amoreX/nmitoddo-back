# Postman API Test Collection for Manufacturing Reports

## Prerequisites
1. Server running at: `http://localhost:3000`
2. You need a valid JWT token for authentication (from your auth system)
3. A valid user ID in your database

## Sample API Calls for Postman

### **Generate Daily Report - Base64 Response** (JSON with Base64)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/reports/generate`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```
- **Body (raw JSON):**
  ```json
  {
    "reportType": "daily",
    "userId": 1
  }
  ```

### **Generate Daily Report - Direct PDF Download** (No frontend conversion needed!)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/reports/generate-direct-pdf`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```
- **Body (raw JSON):**
  ```json
  {
    "reportType": "daily",
    "userId": 1
  }
  ```
- **Response:** PDF file directly (will download automatically in browser)

### 2. Generate Weekly Report
**Method:** POST  
**URL:** `http://localhost:3000/api/reports/generate`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Body (raw JSON):**
```json
{
  "reportType": "weekly",
  "userId": 1
}
```

### 3. Generate Monthly Report
**Method:** POST  
**URL:** `http://localhost:3000/api/reports/generate`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Body (raw JSON):**
```json
{
  "reportType": "monthly",
  "userId": 1
}
```

### 4. Generate Quarterly Report
**Method:** POST  
**URL:** `http://localhost:3000/api/reports/generate`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Body (raw JSON):**
```json
{
  "reportType": "quarterly",
  "userId": 1
}
```

### 5. Generate Yearly Report
**Method:** POST  
**URL:** `http://localhost:3000/api/reports/generate`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Body (raw JSON):**
```json
{
  "reportType": "yearly",
  "userId": 1
}
```

### 6. Get Available Report Types
**Method:** GET  
**URL:** `http://localhost:3000/api/reports/types`  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### 7. Get Report History for User
**Method:** GET  
**URL:** `http://localhost:3000/api/reports/history/1`  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### 8. Get Specific Report by ID
**Method:** GET  
**URL:** `http://localhost:3000/api/reports/123`  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
*Replace 123 with actual report ID from previous responses*

### 9. Regenerate PDF for Existing Report
**Method:** POST  
**URL:** `http://localhost:3000/api/reports/123/regenerate-pdf`  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
*Replace 123 with actual report ID*

### 10. Delete Report
**Method:** DELETE  
**URL:** `http://localhost:3000/api/reports/123`  
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
*Replace 123 with actual report ID*

## Expected Responses

### Successful Report Generation Response:
```json
{
  "success": true,
  "data": {
    "reportId": 1,
    "reportType": "daily",
    "pdfBase64": "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMT4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCi9SZXNvdXJjZXMgPDwKL1Byb2NTZXQgWy9QREYgL1RleHRdCi9Gb250IDw8Ci9GMSA1IDAgUj4+Pj4+CmVuZG9iago...",
    "generatedAt": "2025-09-20T22:35:52.123Z"
  },
  "message": "Daily report generated successfully"
}
```

### Report Types Response:
```json
{
  "success": true,
  "data": [
    {
      "type": "daily",
      "description": "Daily operations report with new MOs, WO activity, stock movements, and exceptions"
    },
    {
      "type": "weekly",
      "description": "Weekly performance report with MO status, WO completion rates, and work center utilization"
    },
    {
      "type": "monthly",
      "description": "Monthly analysis with lead times, productivity metrics, and cost analysis"
    },
    {
      "type": "quarterly",
      "description": "Quarterly review with trends, capacity analysis, and BOM variances"
    },
    {
      "type": "yearly",
      "description": "Annual summary with total output, efficiency metrics, and strategic KPIs"
    }
  ],
  "message": "Report types retrieved successfully"
}
```

### Error Response Example:
```json
{
  "success": false,
  "error": "Invalid report type. Must be one of: daily, weekly, monthly, quarterly, yearly",
  "message": "Invalid report type. Must be one of: daily, weekly, monthly, quarterly, yearly"
}
```

## How to Get JWT Token for Testing

If you don't have a JWT token, you can use your existing auth endpoint:

**Method:** POST  
**URL:** `http://localhost:3000/api/auth/login`  
**Headers:**
```
Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

Copy the token from the response and use it in the Authorization header for all report API calls.

## Testing the PDF Download

1. Make a report generation API call in Postman
2. Copy the `pdfBase64` string from the response
3. Go to https://base64.guru/converter/decode/pdf
4. Paste the Base64 string and click "Decode"
5. Download the PDF to verify it was generated correctly

## Postman Collection Import

You can create a Postman collection with these requests:

1. Open Postman
2. Click "Import" 
3. Create a new collection called "Manufacturing Reports API"
4. Add each request above as separate items
5. Set up environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `authToken`: Your JWT token
   - `userId`: A valid user ID from your database

## Common Issues & Solutions

1. **401 Unauthorized**: Check if your JWT token is valid and properly formatted
2. **404 User not found**: Ensure the userId exists in your database
3. **400 Invalid report type**: Use exact strings: "daily", "weekly", "monthly", "quarterly", "yearly"
4. **500 Server Error**: Check server logs for detailed error information

## 🎯 **Two PDF Delivery Options**

### **Option 1: Base64 Response (Current)**
- **Endpoint:** `POST /api/reports/generate`
- **Response:** JSON with `pdfBase64` field
- **Frontend:** Need to convert Base64 to PDF (simple 5-line function)
- **Use Case:** When you want JSON response with metadata

### **Option 2: Direct PDF Response (NEW)**
- **Endpoint:** `POST /api/reports/generate-direct-pdf`
- **Response:** PDF file directly
- **Frontend:** No conversion needed - browser downloads automatically
- **Use Case:** When you want immediate PDF download

### **Download Existing Report as Direct PDF**
- **Endpoint:** `GET /api/reports/{reportId}/download-pdf`
- **Response:** PDF file directly from existing report

## Tips for Testing

1. Start with the `/types` endpoint to ensure authentication works
2. Test report generation with different report types
3. Use the report history endpoint to see generated reports
4. Test error cases with invalid data
5. **Option A:** Verify PDF generation by decoding Base64 responses
6. **Option B:** Use direct PDF endpoints for immediate download