# Component Availability & MO Validation API Documentation

## Overview

This document describes the enhanced Manufacturing Orders API with component availability checking, comprehensive MO validation, and automatic BOM population features.

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## New Endpoints

### 1. GET /api/mo/:id/components

**Description**: Check component availability for a Manufacturing Order based on BOM requirements and current stock levels.

**Path Parameters**:
- `id`: Manufacturing Order ID (integer)

**Example Request**:
```bash
GET /api/mo/123/components
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "moId": 123,
    "moQuantity": 50,
    "productName": "Premium Gadget",
    "components": [
      {
        "componentId": 15,
        "componentName": "Metal Frame",
        "componentDescription": "Aluminum frame component",
        "componentUnit": "piece",
        "requiredQuantity": 125.0,
        "availableQuantity": 500.0,
        "isAvailable": true,
        "shortage": 0,
        "unitCost": 10.0,
        "totalCost": 1250.0,
        "bomOperation": "Assembly",
        "bomDurationMins": 30
      },
      {
        "componentId": 20,
        "componentName": "Electronic Board",
        "componentDescription": "Main control board",
        "componentUnit": "piece",
        "requiredQuantity": 50.0,
        "availableQuantity": 30.0,
        "isAvailable": false,
        "shortage": 20.0,
        "unitCost": 25.0,
        "totalCost": 1250.0,
        "bomOperation": "Testing",
        "bomDurationMins": 45
      }
    ],
    "totalMaterialCost": 2500.0,
    "allComponentsAvailable": false,
    "shortageCount": 1
  }
}
```

**Use Cases**:
- Material requirements planning
- Cost estimation before production
- Inventory shortage identification
- Procurement planning

---

### 2. POST /api/mo/:id/validate

**Description**: Comprehensive validation of a Manufacturing Order before confirmation, checking components, work center capacity, and user permissions.

**Path Parameters**:
- `id`: Manufacturing Order ID (integer)

**Example Request**:
```bash
POST /api/mo/123/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "canConfirm": false,
    "errors": [
      {
        "field": "components",
        "message": "Insufficient stock for component \"Electronic Board\". Required: 50, Available: 30, Shortage: 20",
        "severity": "error"
      },
      {
        "field": "deadline",
        "message": "Deadline is in the past",
        "severity": "error"
      }
    ],
    "warnings": [
      {
        "field": "components",
        "message": "Low stock warning for component \"Metal Frame\". Consider restocking soon.",
        "severity": "warning"
      },
      {
        "field": "workCenter",
        "message": "Work center \"Assembly Line 1\" is nearing capacity. Active work orders: 8/10",
        "severity": "warning"
      },
      {
        "field": "assignedUser",
        "message": "Assigned user already has 4 active MOs. Consider load balancing.",
        "severity": "warning"
      }
    ],
    "validationSummary": {
      "componentsValid": false,
      "workCenterValid": true,
      "userPermissionsValid": true
    }
  }
}
```

**Validation Checks**:

1. **Component Availability**:
   - Checks if all BOM components are available in required quantities
   - Identifies specific shortages with quantities
   - Warns if stock levels are below 110% of requirements

2. **Work Center Capacity**:
   - Validates assigned work centers exist
   - Checks current workload vs. capacity
   - Warns when nearing capacity limits

3. **User Permissions**:
   - Validates assigned users exist
   - Checks role appropriateness for MO complexity
   - Warns about user overload (>5 active MOs)

4. **General Validations**:
   - Deadline validation (not in past)
   - Schedule start date presence
   - MO completeness checks

---

### 3. GET /api/products/:id/bom

**Description**: Get BOM population data for a product, including components, operations, and cost estimates for MO creation.

**Path Parameters**:
- `id`: Product ID (integer)

**Example Request**:
```bash
GET /api/products/10/bom
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "productId": 10,
    "productName": "Premium Gadget",
    "components": [
      {
        "componentId": 15,
        "componentName": "Metal Frame",
        "quantity": 2.5,
        "operation": "Assembly",
        "opDurationMins": 30,
        "unitCost": 10.0
      },
      {
        "componentId": 20,
        "componentName": "Electronic Board",
        "quantity": 1.0,
        "operation": "Testing",
        "opDurationMins": 45,
        "unitCost": 25.0
      }
    ],
    "operations": ["Assembly", "Testing"],
    "totalMaterialCost": 50.0,
    "estimatedDurationMins": 75
  }
}
```

**Use Cases**:
- Pre-populate MO creation forms
- Cost estimation for quotes
- Manufacturing time estimation
- BOM review and validation

---

### 4. POST /api/mo/new-with-bom

**Description**: Enhanced MO creation that automatically fetches BOM data and creates associated work orders based on BOM operations.

**Request Body**:
```json
{
  "userId": 1,
  "productId": 10,
  "quantity": 50,
  "scheduleStartDate": "2025-09-22T08:00:00.000Z",
  "deadline": "2025-09-28T17:00:00.000Z",
  "assignedToId": 4
}
```

**Required Fields**:
- `productId`: Product to manufacture (integer)
- `quantity`: Number of units to produce (integer > 0)

**Optional Fields**:
- `userId`: Creator ID (defaults to authenticated user)
- `scheduleStartDate`: Planned start date (ISO date string)
- `deadline`: Target completion date (ISO date string)
- `assignedToId`: Assigned user ID (integer)

**Example Request**:
```bash
POST /api/mo/new-with-bom
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "productId": 10,
  "quantity": 100,
  "scheduleStartDate": "2025-09-22T08:00:00.000Z",
  "deadline": "2025-09-30T17:00:00.000Z",
  "assignedToId": 3
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "mo": {
      "id": 124,
      "quantity": 100,
      "status": "draft",
      "scheduleStartDate": "2025-09-22T08:00:00.000Z",
      "deadline": "2025-09-30T17:00:00.000Z",
      "createdAt": "2025-09-21T12:00:00.000Z",
      "updatedAt": "2025-09-21T12:00:00.000Z",
      "productId": 10,
      "createdById": 1,
      "assignedToId": 3
    },
    "bomPopulation": {
      "productId": 10,
      "productName": "Premium Gadget",
      "components": [
        {
          "componentId": 15,
          "componentName": "Metal Frame",
          "quantity": 2.5,
          "operation": "Assembly",
          "opDurationMins": 30,
          "unitCost": 10.0
        }
      ],
      "operations": ["Assembly", "Testing"],
      "totalMaterialCost": 50.0,
      "estimatedDurationMins": 75
    },
    "workOrdersCreated": 2
  },
  "message": "Manufacturing Order created with 2 work orders from BOM"
}
```

**Automatic Features**:
- Fetches BOM data for the specified product
- Creates work orders for each unique operation in BOM
- Distributes estimated duration across operations
- Sets all work orders to "to_do" status
- Maintains transaction integrity

---

## Integration Workflows

### 1. Complete MO Creation Workflow

```bash
# Step 1: Get BOM data for cost estimation
GET /api/products/10/bom

# Step 2: Create MO with automatic BOM population
POST /api/mo/new-with-bom
{
  "productId": 10,
  "quantity": 100,
  "deadline": "2025-09-30T17:00:00.000Z"
}

# Step 3: Check component availability
GET /api/mo/124/components

# Step 4: Validate MO before confirmation
POST /api/mo/124/validate

# Step 5: If valid, confirm the MO
PUT /api/mo/124/status
{"status": "confirmed"}
```

### 2. Production Planning Workflow

```bash
# Step 1: Check component availability for existing MO
GET /api/mo/123/components

# Step 2: Validate MO readiness
POST /api/mo/123/validate

# Step 3: If components are short, check other MOs
GET /api/mo/dashboard?status=draft

# Step 4: Prioritize MOs based on component availability
# (Repeat steps 1-2 for each MO)
```

### 3. Cost Estimation Workflow

```bash
# Step 1: Get BOM data
GET /api/products/10/bom

# Step 2: Calculate material cost for different quantities
# (Use bomData.totalMaterialCost * quantity)

# Step 3: Check current component availability
GET /api/mo/existing-mo-id/components

# Step 4: Estimate procurement needs
# (Based on shortage information)
```

---

## Data Models & Interfaces

### ComponentAvailability Interface
```typescript
interface ComponentAvailability {
  componentId: number;
  componentName: string;
  componentDescription: string | null;
  componentUnit: string;
  requiredQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  shortage: number;
  unitCost: number;
  totalCost: number;
  bomOperation: string | null;
  bomDurationMins: number | null;
}
```

### ValidationError Interface
```typescript
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
```

### MOValidationResult Interface
```typescript
interface MOValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  canConfirm: boolean;
  validationSummary: {
    componentsValid: boolean;
    workCenterValid: boolean;
    userPermissionsValid: boolean;
  };
}
```

### BOMComponent Interface
```typescript
interface BOMComponent {
  componentId: number;
  componentName: string;
  quantity: number;
  operation: string | null;
  opDurationMins: number | null;
  unitCost: number;
}
```

---

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Manufacturing Order not found"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: MO created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `404 Not Found`: MO/Product not found
- `500 Internal Server Error`: Server error

### Specific Error Messages

**Component Availability Endpoint**:
- `"Manufacturing Order not found"`
- `"Manufacturing Order has no associated product"`
- `"Manufacturing Order has no quantity specified"`

**Validation Endpoint**:
- `"Manufacturing Order not found"`
- Component-specific shortage messages
- Work center capacity messages
- User permission warnings

**BOM Population Endpoint**:
- `"Product not found"`

**Enhanced MO Creation**:
- `"Product ID is required"`
- `"Valid quantity is required"`
- `"Product not found"`

---

## Performance Considerations

1. **Database Optimization**:
   - Efficient joins for BOM and stock data
   - Indexed queries on frequently accessed fields
   - Transaction-based operations for data consistency

2. **Caching Strategies**:
   - BOM data can be cached as it changes infrequently
   - Stock levels should be real-time or near real-time
   - Validation results can be cached for short periods

3. **Scalability**:
   - Component availability checks are optimized for large BOMs
   - Validation logic is designed for high-frequency usage
   - Work order creation uses batch operations

## Security Considerations

1. **Authorization**:
   - All endpoints require valid JWT authentication
   - User permissions are validated for MO access
   - Role-based access can be implemented for sensitive operations

2. **Data Validation**:
   - All input parameters are validated and sanitized
   - SQL injection protection through Prisma ORM
   - Type safety enforced through TypeScript

3. **Business Logic Security**:
   - MO validation prevents invalid state transitions
   - Stock shortage checks prevent over-allocation
   - Work center capacity limits prevent overloading

## Usage Examples

### Frontend Integration Example

```javascript
// Check component availability before showing MO details
const checkComponents = async (moId) => {
  try {
    const response = await fetch(`/api/mo/${moId}/components`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success) {
      // Display component availability
      data.data.components.forEach(component => {
        if (!component.isAvailable) {
          console.warn(`Shortage: ${component.componentName} - Need ${component.shortage} more`);
        }
      });
    }
  } catch (error) {
    console.error('Error checking components:', error);
  }
};

// Validate MO before confirmation
const validateBeforeConfirm = async (moId) => {
  try {
    const response = await fetch(`/api/mo/${moId}/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    if (data.success && data.data.canConfirm) {
      // Safe to confirm MO
      return true;
    } else {
      // Show validation errors to user
      data.data.errors.forEach(error => {
        console.error(`${error.field}: ${error.message}`);
      });
      return false;
    }
  } catch (error) {
    console.error('Error validating MO:', error);
    return false;
  }
};
```

This enhanced API provides comprehensive manufacturing planning capabilities with real-time component availability checking, thorough validation, and automated BOM-based MO creation.