# Manufacturing Reports API Documentation

## Overview

This API provides comprehensive manufacturing reports with PDF generation capabilities. It supports daily, weekly, monthly, quarterly, and yearly reports with detailed KPIs and analytics.

## Base URL
```
http://localhost:3000/api/reports
```

## Authentication
All endpoints require authentication using Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### 1. Generate Manufacturing Report
Generate a new manufacturing report with PDF output.

**Endpoint:** `POST /api/reports/generate`

**Request Body:**
```json
{
  "reportType": "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
  "userId": number
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": 123,
    "reportType": "daily",
    "pdfBase64": "JVBERi0xLjQKJdPr6eEK...", // Base64 encoded PDF
    "generatedAt": "2025-09-20T22:35:00.000Z"
  },
  "message": "Daily report generated successfully"
}
```

**Report Types and KPIs:**

#### Daily Reports
- New manufacturing orders count and quantity
- Work order activity (completed, in-progress, pending)
- Stock movements (in/out/net change)
- Work center downtime
- Exceptions (delays, overdue items)

#### Weekly Reports
- Manufacturing order status summary
- Work order completion rate
- Work center utilization
- Top products by activity
- Stock changes summary

#### Monthly Reports
- Average lead times
- Productivity metrics
- Cancellation rates
- Stock reconciliation
- Cost analysis

#### Quarterly Reports
- Performance trends
- Capacity vs demand analysis
- BOM variances
- Productivity trends
- Cost analysis

#### Yearly Reports
- Total output metrics
- Overall efficiency
- Annual downtime analysis
- Inventory turnover
- Strategic KPIs (customer satisfaction, quality, on-time delivery)

### 2. Get Report Types
Get available report types and descriptions.

**Endpoint:** `GET /api/reports/types`

**Response:**
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
    }
    // ... more types
  ],
  "message": "Report types retrieved successfully"
}
```

### 3. Get Report History
Get report history for a specific user.

**Endpoint:** `GET /api/reports/history/:userId`

**Parameters:**
- `userId` (path parameter) - User ID to get report history for

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "reportType": "daily",
      "generatedAt": "2025-09-20T22:35:00.000Z"
    }
    // ... more reports (last 50)
  ],
  "message": "Found 3 reports for user 1"
}
```

### 4. Get Specific Report
Get a specific report by ID.

**Endpoint:** `GET /api/reports/:reportId`

**Parameters:**
- `reportId` (path parameter) - Report ID to retrieve

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "reportType": "daily",
    "data": {
      // Full report data with KPIs
    },
    "generatedAt": "2025-09-20T22:35:00.000Z",
    "userId": 1
  },
  "message": "Report retrieved successfully"
}
```

### 5. Regenerate PDF
Regenerate PDF for an existing report.

**Endpoint:** `POST /api/reports/:reportId/regenerate-pdf`

**Parameters:**
- `reportId` (path parameter) - Report ID to regenerate PDF for

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": 123,
    "reportType": "daily",
    "pdfBase64": "JVBERi0xLjQKJdPr6eEK...",
    "generatedAt": "2025-09-20T22:35:00.000Z"
  },
  "message": "PDF regenerated successfully"
}
```

### 6. Delete Report
Delete a specific report.

**Endpoint:** `DELETE /api/reports/:reportId`

**Parameters:**
- `reportId` (path parameter) - Report ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

## Frontend Integration

### Auto-Download PDF Implementation

```javascript
async function generateAndDownloadReport(reportType, userId) {
  try {
    // Generate report
    const response = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ reportType, userId })
    });

    const result = await response.json();
    
    if (result.success) {
      // Convert Base64 to Blob
      const pdfBlob = base64ToBlob(result.data.pdfBase64, 'application/pdf');
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return result.data.reportId;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
```

### React Component Example

```jsx
import React, { useState } from 'react';

const ReportGenerator = ({ userId, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  const generateReport = async (reportType) => {
    setLoading(true);
    try {
      const reportId = await generateAndDownloadReport(reportType, userId);
      console.log(`Report ${reportId} generated and downloaded`);
      
      // Refresh report history
      await fetchReportHistory();
    } catch (error) {
      alert(`Error generating report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportHistory = async () => {
    try {
      const response = await fetch(`/api/reports/history/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const result = await response.json();
      if (result.success) {
        setReportHistory(result.data);
      }
    } catch (error) {
      console.error('Error fetching report history:', error);
    }
  };

  return (
    <div>
      <h2>Manufacturing Reports</h2>
      
      <div>
        <h3>Generate New Report</h3>
        {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map(type => (
          <button
            key={type}
            onClick={() => generateReport(type)}
            disabled={loading}
          >
            Generate {type.charAt(0).toUpperCase() + type.slice(1)} Report
          </button>
        ))}
      </div>

      <div>
        <h3>Report History</h3>
        <button onClick={fetchReportHistory}>Refresh History</button>
        <ul>
          {reportHistory.map(report => (
            <li key={report.id}>
              {report.reportType} - {new Date(report.generatedAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportGenerator;
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type description",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid token)
- `404` - Not Found (user/report not found)
- `500` - Internal Server Error

## KPI Calculations

### Data Sources
The system queries the following Prisma models:
- `ManufacturingOrder` - Production orders
- `WorkOrder` - Individual work tasks
- `ProductLedger` - Stock movements
- `ProductStock` - Current inventory levels
- `WorkCenter` - Production facilities
- `BillOfMaterial` - Product recipes
- `User` - System users

### Performance Considerations
- Reports are cached in the database for quick retrieval
- PDF generation is done in-memory for security
- Large datasets are paginated and optimized
- Background processing for complex calculations

## Security
- JWT authentication required for all endpoints
- User-specific data access controls
- PDF generation in secure memory space
- No sensitive data in logs

## Monitoring
- Request/response logging
- Performance metrics tracking
- Error rate monitoring
- PDF generation success rates

## Future Enhancements
- Scheduled report generation
- Email delivery of reports
- Custom report templates
- Interactive charts in PDFs
- Excel export format
- Report comparison features