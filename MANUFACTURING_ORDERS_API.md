# Manufacturing Orders API Documentation

## Overview

This document describes the comprehensive Manufacturing Orders dashboard API with filtering, detailed views, status management, and CRUD operations.

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Base URL

All Manufacturing Order endpoints are prefixed with `/api/mo`

---

## Endpoints

### 1. GET /api/mo/dashboard

**Description**: Main dashboard endpoint that returns a paginated list of Manufacturing Orders with comprehensive filtering options.

**Query Parameters**:
- `status` (optional): Filter by order status (`draft`, `confirmed`, `in_progress`, `to_close`, `done`, `cancelled`)
- `assignedTo` (optional): Filter by assigned user ID (integer)
- `productId` (optional): Filter by product ID (integer)
- `dateStart` (optional): Filter by creation date start (ISO date string)
- `dateEnd` (optional): Filter by creation date end (ISO date string)
- `search` (optional): Search by MO ID or product name (string)
- `limit` (optional): Number of results per page (default: 10)
- `offset` (optional): Number of results to skip (default: 0)

**Example Request**:
```bash
GET /api/mo/dashboard?status=in_progress&limit=20&offset=0&search=Widget
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "quantity": 100,
      "status": "in_progress",
      "scheduleStartDate": "2025-09-21T08:00:00.000Z",
      "deadline": "2025-09-25T17:00:00.000Z",
      "createdAt": "2025-09-20T10:00:00.000Z",
      "updatedAt": "2025-09-21T09:30:00.000Z",
      "product": {
        "id": 5,
        "name": "Super Widget",
        "description": "High-quality widget for industrial use"
      },
      "assignedTo": {
        "id": 3,
        "name": "John Doe",
        "email": "john.doe@company.com"
      },
      "createdBy": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane.smith@company.com"
      },
      "workOrdersCount": 4,
      "completedWorkOrdersCount": 2,
      "progressPercentage": 50,
      "startedAt": "2025-09-21T09:30:00.000Z",
      "completedAt": null
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 2. GET /api/mo/:id

**Description**: Get detailed information about a single Manufacturing Order including work orders, BOM components, stock availability, and progress tracking.

**Path Parameters**:
- `id`: Manufacturing Order ID (integer)

**Example Request**:
```bash
GET /api/mo/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "quantity": 50,
    "status": "confirmed",
    "scheduleStartDate": "2025-09-22T08:00:00.000Z",
    "deadline": "2025-09-28T17:00:00.000Z",
    "createdAt": "2025-09-20T14:00:00.000Z",
    "updatedAt": "2025-09-21T10:00:00.000Z",
    "product": {
      "id": 10,
      "name": "Premium Gadget",
      "description": "Advanced gadget with multiple components",
      "unit": "piece",
      "bom": [
        {
          "id": 1,
          "productId": 10,
          "componentId": 15,
          "quantity": 2.5,
          "operation": "Assembly",
          "opDurationMins": 30,
          "component": {
            "id": 15,
            "name": "Metal Frame",
            "description": "Aluminum frame component",
            "stock": {
              "quantity": 500.0
            }
          }
        }
      ]
    },
    "assignedTo": {
      "id": 4,
      "name": "Mike Johnson",
      "email": "mike.johnson@company.com"
    },
    "createdBy": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@company.com"
    },
    "workOrders": [
      {
        "id": 201,
        "operation": "Cut metal frame",
        "status": "completed",
        "comments": "Completed successfully",
        "startedAt": "2025-09-21T08:00:00.000Z",
        "completedAt": "2025-09-21T10:30:00.000Z",
        "durationMins": 120,
        "durationDoneMins": 150,
        "assignedTo": {
          "id": 5,
          "name": "Bob Wilson",
          "email": "bob.wilson@company.com"
        },
        "workCenter": {
          "id": 2,
          "name": "CNC Machine 1",
          "location": "Shop Floor A"
        }
      }
    ],
    "componentAvailability": [
      {
        "componentId": 15,
        "componentName": "Metal Frame",
        "requiredQuantity": 125.0,
        "availableQuantity": 500.0,
        "isAvailable": true,
        "shortage": 0,
        "bomOperation": "Assembly",
        "bomDurationMins": 30
      }
    ],
    "progressPercentage": 25,
    "workOrdersCount": 4,
    "completedWorkOrdersCount": 1
  }
}
```

---

### 3. PUT /api/mo/:id/status

**Description**: Update the status of a Manufacturing Order with business rule validation, automatic work order generation, and timestamp management.

**Path Parameters**:
- `id`: Manufacturing Order ID (integer)

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**Valid Status Transitions**:
- `draft` → `confirmed` or `cancelled`
- `confirmed` → `in_progress` or `cancelled`
- `in_progress` → `done` or `cancelled`
- `to_close` → `done` or `cancelled`
- `done` → (terminal state)
- `cancelled` → (terminal state)

**Example Request**:
```bash
PUT /api/mo/123/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "quantity": 50,
    "status": "confirmed",
    "scheduleStartDate": "2025-09-22T08:00:00.000Z",
    "deadline": "2025-09-28T17:00:00.000Z",
    "createdAt": "2025-09-20T14:00:00.000Z",
    "updatedAt": "2025-09-21T11:00:00.000Z",
    "productId": 10,
    "createdById": 1,
    "assignedToId": 4
  },
  "message": "Manufacturing Order status updated to confirmed"
}
```

**Special Behaviors**:
- When transitioning from `draft` to `confirmed`: Automatically generates work orders based on BOM operations
- When transitioning to `in_progress`: Sets `scheduleStartDate` if not already set
- When transitioning to `done`: Validates that all work orders are completed

---

### 4. DELETE /api/mo/:id

**Description**: Delete or cancel a Manufacturing Order based on its current status with automatic cleanup of associated work orders.

**Path Parameters**:
- `id`: Manufacturing Order ID (integer)

**Business Rules**:
- **Draft MOs**: Hard deletion (permanently removes MO and all associated work orders)
- **Confirmed/In-Progress MOs**: Soft cancellation (changes status to `cancelled`)
- **Done/Cancelled MOs**: Cannot be deleted or cancelled

**Example Request**:
```bash
DELETE /api/mo/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format (Draft MO - Deletion)**:
```json
{
  "success": true,
  "message": "Manufacturing Order deleted successfully",
  "deleted": true
}
```

**Response Format (Confirmed/In-Progress MO - Cancellation)**:
```json
{
  "success": true,
  "message": "Manufacturing Order cancelled successfully",
  "cancelled": true,
  "data": {
    "id": 123,
    "quantity": 50,
    "status": "cancelled",
    "scheduleStartDate": "2025-09-22T08:00:00.000Z",
    "deadline": "2025-09-28T17:00:00.000Z",
    "createdAt": "2025-09-20T14:00:00.000Z",
    "updatedAt": "2025-09-21T11:30:00.000Z",
    "productId": 10,
    "createdById": 1,
    "assignedToId": 4
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters or body
- `401 Unauthorized`: Authentication required or invalid token
- `404 Not Found`: Manufacturing Order not found
- `500 Internal Server Error`: Server error

### Common Error Messages

- `"Invalid MO ID"`: When the provided ID is not a valid integer
- `"MO ID is required"`: When the ID parameter is missing
- `"Manufacturing Order not found"`: When the specified MO doesn't exist
- `"Status is required"`: When status is missing in update requests
- `"Invalid status value"`: When provided status is not a valid OrderStatus
- `"Invalid status transition from {current} to {new}"`: When the status transition is not allowed
- `"Cannot mark MO as done. Some work orders are not completed."`: When trying to complete MO with incomplete work orders
- `"Cannot delete/cancel MO with status: {status}"`: When trying to delete/cancel MO in terminal state

---

## Integration Notes

### Work Order Auto-Generation

When a Manufacturing Order transitions from `draft` to `confirmed`, the system automatically:

1. Retrieves the BOM (Bill of Materials) for the associated product
2. Creates work orders for each BOM operation
3. Sets default durations based on BOM `opDurationMins` (defaults to 60 minutes)
4. All generated work orders start with `to_do` status

### Progress Calculation

Progress percentage is calculated as:
```
progressPercentage = (completedWorkOrdersCount / totalWorkOrdersCount) * 100
```

Rounded to the nearest integer. Returns 0 if no work orders exist.

### Stock Availability Check

The detailed MO endpoint (`GET /api/mo/:id`) includes component availability information:
- Calculates required quantities based on MO quantity × BOM component quantity
- Compares with current stock levels
- Identifies shortages and availability status
- Useful for production planning and material requirements

### Search Functionality

The dashboard search feature supports:
- **Numeric search**: Searches by exact MO ID match
- **Text search**: Case-insensitive search in product names
- **Combined results**: Returns MOs matching either ID or product name

---

## Example Usage Scenarios

### 1. Dashboard with Filters
```bash
# Get in-progress MOs assigned to user 5, created this week
GET /api/mo/dashboard?status=in_progress&assignedTo=5&dateStart=2025-09-15&dateEnd=2025-09-21
```

### 2. Search for Specific Product
```bash
# Search for all MOs related to "Widget" products
GET /api/mo/dashboard?search=Widget&limit=50
```

### 3. Complete Manufacturing Workflow
```bash
# 1. Get MO details
GET /api/mo/123

# 2. Confirm the MO (generates work orders)
PUT /api/mo/123/status
{"status": "confirmed"}

# 3. Start production
PUT /api/mo/123/status
{"status": "in_progress"}

# 4. Complete production (after all work orders are done)
PUT /api/mo/123/status
{"status": "done"}
```

### 4. Emergency Cancellation
```bash
# Cancel an in-progress MO
DELETE /api/mo/123
```

---

## Performance Considerations

- Dashboard queries include database indexes on commonly filtered fields (`status`, `assignedToId`, `productId`, `createdAt`)
- Large result sets are paginated to prevent memory issues
- Related data is loaded efficiently using Prisma's `include` functionality
- Search queries are optimized for both numeric and text searches

## Security Notes

- All endpoints require valid JWT authentication
- User permissions should be validated at the application level
- Sensitive operations (status changes, deletions) should include additional authorization checks
- Database transactions ensure data consistency during complex operations