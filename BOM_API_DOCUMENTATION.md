# BOM API Documentation

## Overview
The BOM (Bill of Materials) API provides comprehensive CRUD operations for managing product BOMs. This includes creating, reading, updating, and deleting BOMs with proper validation, cost calculations, and version history support.

## Base URL
All BOM endpoints are prefixed with `/api/bom`

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create BOM
**POST** `/api/bom`

Creates a new BOM for a product with its components.

#### Request Body
```json
{
  "productId": 1,
  "components": [
    {
      "componentId": 2,
      "quantity": 5,
      "opDurationMins": 10,
      "notes": "Main component"
    },
    {
      "componentId": 3,
      "quantity": 2,
      "opDurationMins": 5,
      "notes": "Secondary component"
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "product": {
      "id": 1,
      "name": "Finished Product A",
      "description": "High-quality finished product"
    },
    "componentCount": 2,
    "totalCost": 125.50,
    "totalDuration": 15,
    "components": [
      {
        "id": 1,
        "componentId": 2,
        "productId": 1,
        "quantity": 5,
        "opDurationMins": 10,
        "notes": "Main component",
        "component": {
          "id": 2,
          "name": "Component B",
          "unitCost": 20.00
        }
      },
      {
        "id": 2,
        "componentId": 3,
        "productId": 1,
        "quantity": 2,
        "opDurationMins": 5,
        "notes": "Secondary component",
        "component": {
          "id": 3,
          "name": "Component C",
          "unitCost": 12.75
        }
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "BOM created successfully for product Finished Product A with 2 components"
}
```

#### Error Responses
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Product or components not found
- **409 Conflict**: BOM already exists for this product

### 2. Get All BOMs
**GET** `/api/bom`

Retrieves a paginated list of all BOMs with optional filtering.

#### Query Parameters
- `productId` (optional): Filter by specific product ID
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

#### Example Request
```
GET /api/bom?productId=1&limit=10&offset=0
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "productId": 1,
      "productName": "Finished Product A",
      "componentCount": 2,
      "totalCost": 125.50,
      "totalDuration": 15,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Error Responses
- **400 Bad Request**: Invalid query parameters

### 3. Get BOM by Product ID
**GET** `/api/bom/:productId`

Retrieves detailed BOM information for a specific product.

#### Path Parameters
- `productId`: The ID of the product

#### Example Request
```
GET /api/bom/1
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "product": {
      "id": 1,
      "name": "Finished Product A",
      "description": "High-quality finished product"
    },
    "componentCount": 2,
    "totalCost": 125.50,
    "totalDuration": 15,
    "components": [
      {
        "id": 1,
        "componentId": 2,
        "productId": 1,
        "quantity": 5,
        "opDurationMins": 10,
        "notes": "Main component",
        "component": {
          "id": 2,
          "name": "Component B",
          "unitCost": 20.00
        }
      },
      {
        "id": 2,
        "componentId": 3,
        "productId": 1,
        "quantity": 2,
        "opDurationMins": 5,
        "notes": "Secondary component",
        "component": {
          "id": 3,
          "name": "Component C",
          "unitCost": 12.75
        }
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request**: Invalid product ID
- **404 Not Found**: Product not found or BOM doesn't exist

### 4. Update BOM
**PUT** `/api/bom/:productId`

Updates an existing BOM by replacing all components.

#### Path Parameters
- `productId`: The ID of the product

#### Request Body
```json
{
  "components": [
    {
      "componentId": 2,
      "quantity": 3,
      "opDurationMins": 8,
      "notes": "Updated main component"
    },
    {
      "componentId": 4,
      "quantity": 1,
      "opDurationMins": 12,
      "notes": "New additional component"
    }
  ]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "product": {
      "id": 1,
      "name": "Finished Product A",
      "description": "High-quality finished product"
    },
    "componentCount": 2,
    "totalCost": 85.25,
    "totalDuration": 20,
    "components": [
      {
        "id": 3,
        "componentId": 2,
        "productId": 1,
        "quantity": 3,
        "opDurationMins": 8,
        "notes": "Updated main component",
        "component": {
          "id": 2,
          "name": "Component B",
          "unitCost": 20.00
        }
      },
      {
        "id": 4,
        "componentId": 4,
        "productId": 1,
        "quantity": 1,
        "opDurationMins": 12,
        "notes": "New additional component",
        "component": {
          "id": 4,
          "name": "Component D",
          "unitCost": 25.25
        }
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:15:00.000Z"
  },
  "message": "BOM updated successfully for product Finished Product A with 2 components"
}
```

#### Error Responses
- **400 Bad Request**: Invalid input data or product ID
- **404 Not Found**: Product not found, BOM doesn't exist, or components not found

### 5. Delete BOM
**DELETE** `/api/bom/:productId`

Deletes a BOM for a specific product. Checks for active Manufacturing Orders before deletion.

#### Path Parameters
- `productId`: The ID of the product

#### Example Request
```
DELETE /api/bom/1
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "productName": "Finished Product A",
    "deletedComponents": 2
  },
  "message": "BOM deleted successfully for product Finished Product A. Deleted 2 components."
}
```

#### Error Responses
- **400 Bad Request**: Invalid product ID
- **404 Not Found**: Product not found or BOM doesn't exist
- **409 Conflict**: Cannot delete BOM because it's used in active Manufacturing Orders

### 6. Check BOM Usage
**GET** `/api/bom/:productId/usage`

Checks if a BOM is being used in active Manufacturing Orders.

#### Path Parameters
- `productId`: The ID of the product

#### Example Request
```
GET /api/bom/1/usage
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "productName": "Finished Product A",
    "isUsed": true,
    "activeManufacturingOrders": [
      {
        "id": 1,
        "name": "MO-001",
        "status": "PENDING",
        "quantity": 100,
        "targetDate": "2024-01-20T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "MO-002",
        "status": "IN_PROGRESS",
        "quantity": 50,
        "targetDate": "2024-01-25T00:00:00.000Z"
      }
    ],
    "totalActiveQuantity": 150
  }
}
```

#### Error Responses
- **400 Bad Request**: Invalid product ID

## Data Models

### BOM Component
```typescript
interface BOMComponent {
  id: number;
  componentId: number;
  productId: number;
  quantity: number;
  opDurationMins?: number;
  notes?: string;
  component: {
    id: number;
    name: string;
    unitCost?: number;
  };
}
```

### BOM Details
```typescript
interface BOMWithDetails {
  productId: number;
  product: {
    id: number;
    name: string;
    description?: string;
  };
  componentCount: number;
  totalCost: number;
  totalDuration: number;
  components: BOMComponent[];
  createdAt: Date;
  updatedAt: Date;
}
```

### BOM List Item
```typescript
interface BOMListItem {
  productId: number;
  productName: string;
  componentCount: number;
  totalCost: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Business Rules

1. **BOM Uniqueness**: Each product can have only one active BOM
2. **Component Validation**: All components must exist as products in the system
3. **Quantity Validation**: Component quantities must be greater than 0
4. **Cost Calculation**: Total cost is automatically calculated from component costs and quantities
5. **Duration Calculation**: Total duration is the sum of all component operation durations
6. **Deletion Protection**: BOMs cannot be deleted if they're used in active Manufacturing Orders
7. **Transaction Integrity**: All BOM operations use database transactions to ensure data consistency

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- **200**: Success
- **201**: Created successfully
- **400**: Bad request (validation errors)
- **401**: Unauthorized (invalid token)
- **404**: Resource not found
- **409**: Conflict (business rule violation)
- **500**: Internal server error

## Usage Examples

### Creating a Complete BOM
```javascript
const bomData = {
  productId: 1,
  components: [
    {
      componentId: 2,
      quantity: 5,
      opDurationMins: 10,
      notes: "Primary raw material"
    },
    {
      componentId: 3,
      quantity: 2,
      opDurationMins: 5,
      notes: "Secondary component"
    }
  ]
};

const response = await fetch('/api/bom', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(bomData)
});
```

### Updating a BOM
```javascript
const updateData = {
  components: [
    {
      componentId: 2,
      quantity: 3, // Changed quantity
      opDurationMins: 8, // Changed duration
      notes: "Updated primary component"
    }
  ]
};

const response = await fetch('/api/bom/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(updateData)
});
```

### Checking BOM Usage Before Deletion
```javascript
// First check usage
const usageResponse = await fetch('/api/bom/1/usage', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const usage = await usageResponse.json();

if (!usage.data.isUsed) {
  // Safe to delete
  const deleteResponse = await fetch('/api/bom/1', {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
}
```

## Version History & Audit Trail

The BOM system maintains automatic timestamps for creation and updates:
- `createdAt`: When the BOM was first created
- `updatedAt`: When the BOM was last modified

For full audit trail and version history, consider implementing additional logging in your application layer to track changes to BOMs over time.