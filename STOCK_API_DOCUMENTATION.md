# Stock Management API Documentation

This API provides comprehensive stock management functionality with automatic ledger tracking and role-based access control.

## Authentication

All stock API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

- **Read Operations**: All authenticated users (admin, manager, user)
- **Write Operations**: Only admin and manager roles
  - Record stock movements
  - Update stock quantities
  - Delete stock records

## API Endpoints

### 1. Record Stock Movement

**POST** `/api/stock/movement`

Records a stock movement (in/out) and automatically updates ProductStock and ProductLedger.

**Permissions**: Admin, Manager only

**Request Body**:
```json
{
  "productId": 1,
  "movementType": "in",  // "in" or "out"
  "quantity": 50,
  "referenceType": "purchase",  // optional: "purchase", "sales", "MO", "WO", "adjustment"
  "referenceId": 123,  // optional: related record ID
  "reason": "New stock delivery"  // optional: description
}
```

**Response**:
```json
{
  "status": true,
  "message": "Stock movement recorded successfully",
  "data": {
    "ledgerEntry": {
      "id": 15,
      "productId": 1,
      "movementType": "in",
      "quantity": 50,
      "referenceType": "purchase",
      "referenceId": 123,
      "createdAt": "2025-09-20T10:00:00.000Z"
    },
    "updatedStock": {
      "id": 5,
      "productId": 1,
      "quantity": 150,
      "updatedAt": "2025-09-20T10:00:00.000Z",
      "product": {
        "id": 1,
        "name": "Intel Core i7 Processor",
        "unit": "pieces"
      }
    },
    "previousQuantity": 100,
    "newQuantity": 150
  }
}
```

### 2. Get All Product Stocks

**GET** `/api/stock`

Returns all product stock records.

**Permissions**: All authenticated users

**Response**:
```json
{
  "status": true,
  "message": "All product stocks retrieved successfully",
  "data": [
    {
      "id": 1,
      "productId": 19,
      "quantity": 40,
      "updatedAt": "2025-09-20T10:00:00.000Z",
      "product": {
        "id": 19,
        "name": "Intel Core i7 Processor",
        "description": "High-performance processor",
        "unit": "pieces"
      }
    }
  ]
}
```

### 3. Get Product Stock by ID

**GET** `/api/stock/:productId`

Returns current stock for a specific product.

**Permissions**: All authenticated users

**Response**:
```json
{
  "status": true,
  "message": "Product stock retrieved successfully",
  "data": {
    "id": 1,
    "productId": 19,
    "quantity": 40,
    "updatedAt": "2025-09-20T10:00:00.000Z",
    "product": {
      "id": 19,
      "name": "Intel Core i7 Processor",
      "description": "High-performance processor",
      "unit": "pieces"
    }
  }
}
```

### 4. Update Product Stock

**PUT** `/api/stock/:productId`

Directly updates the stock quantity (creates adjustment ledger entry).

**Permissions**: Admin, Manager only

**Request Body**:
```json
{
  "quantity": 75,
  "reason": "Manual stock adjustment after inventory count"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Product stock updated successfully",
  "data": {
    "id": 1,
    "productId": 19,
    "quantity": 75,
    "updatedAt": "2025-09-20T10:00:00.000Z",
    "product": {
      "id": 19,
      "name": "Intel Core i7 Processor",
      "description": "High-performance processor",
      "unit": "pieces"
    }
  },
  "adjustment": {
    "previousQuantity": 40,
    "newQuantity": 75,
    "difference": 35
  }
}
```

### 5. Delete Product Stock

**DELETE** `/api/stock/:productId`

Deletes the product stock record (creates ledger entry if stock existed).

**Permissions**: Admin, Manager only

**Response**:
```json
{
  "status": true,
  "message": "Product stock deleted successfully",
  "data": {
    "id": 1,
    "productId": 19,
    "quantity": 75,
    "product": {
      "id": 19,
      "name": "Intel Core i7 Processor"
    }
  }
}
```

### 6. Get Product Ledger

**GET** `/api/stock/ledger`

Returns product ledger entries with optional filters.

**Permissions**: All authenticated users

**Query Parameters**:
- `productId` (optional): Filter by product ID
- `movementType` (optional): Filter by "in" or "out"
- `referenceType` (optional): Filter by reference type
- `limit` (optional): Number of entries to return (default: 50, max: 1000)

**Example**: `/api/stock/ledger?productId=19&movementType=in&limit=20`

**Response**:
```json
{
  "status": true,
  "message": "Product ledger retrieved successfully",
  "data": [
    {
      "id": 15,
      "productId": 19,
      "movementType": "in",
      "quantity": 50,
      "referenceType": "purchase",
      "referenceId": 123,
      "createdAt": "2025-09-20T10:00:00.000Z",
      "product": {
        "id": 19,
        "name": "Intel Core i7 Processor",
        "unit": "pieces"
      }
    }
  ]
}
```

### 7. Get Product Ledger by Product ID

**GET** `/api/stock/:productId/ledger`

Returns ledger entries for a specific product.

**Permissions**: All authenticated users

**Query Parameters**:
- `movementType` (optional): Filter by "in" or "out"
- `referenceType` (optional): Filter by reference type
- `limit` (optional): Number of entries to return (default: 50, max: 1000)

### 8. Verify Product Stock

**GET** `/api/stock/:productId/verify`

Verifies stock consistency between ProductStock table and calculated quantity from ProductLedger.

**Permissions**: All authenticated users

**Response**:
```json
{
  "status": true,
  "message": "Stock calculation completed",
  "data": {
    "calculatedQuantity": 75,
    "actualQuantity": 75,
    "isConsistent": true,
    "totalMovementsIn": 200,
    "totalMovementsOut": 125
  }
}
```

## Frontend Integration Examples

### JavaScript/TypeScript

```javascript
// Record stock movement
const recordStockMovement = async (productId, movementType, quantity, referenceType = null, referenceId = null) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/stock/movement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      movementType,
      quantity,
      referenceType,
      referenceId
    })
  });
  
  return await response.json();
};

// Get current stock
const getProductStock = async (productId) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`/api/stock/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Update stock quantity
const updateStock = async (productId, quantity, reason = null) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`/api/stock/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ quantity, reason })
  });
  
  return await response.json();
};

// Get stock movements history
const getStockHistory = async (productId, limit = 50) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`/api/stock/${productId}/ledger?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

## Testing with cURL

```bash
# Record stock movement (increase stock)
curl -X POST http://localhost:3000/api/stock/movement \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": 19,
    "movementType": "in",
    "quantity": 50,
    "referenceType": "purchase",
    "reason": "New stock delivery"
  }'

# Get current stock
curl -X GET http://localhost:3000/api/stock/19 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update stock quantity
curl -X PUT http://localhost:3000/api/stock/19 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "quantity": 75,
    "reason": "Inventory adjustment"
  }'

# Get stock movement history
curl -X GET "http://localhost:3000/api/stock/19/ledger?limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all product stocks
curl -X GET http://localhost:3000/api/stock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

The API returns consistent error responses:

```json
{
  "status": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (for new records)
- `400`: Bad request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error

## Stock Management Workflow

1. **Record Purchases**: Use `POST /api/stock/movement` with `movementType: "in"`
2. **Record Sales/Usage**: Use `POST /api/stock/movement` with `movementType: "out"`
3. **Check Availability**: Use `GET /api/stock/:productId` before manufacturing
4. **Manual Adjustments**: Use `PUT /api/stock/:productId` for inventory corrections
5. **Audit Trail**: Use `GET /api/stock/:productId/ledger` to see all movements
6. **Verify Integrity**: Use `GET /api/stock/:productId/verify` to check consistency

The system automatically maintains both current stock levels (ProductStock) and complete audit trail (ProductLedger) for full traceability.