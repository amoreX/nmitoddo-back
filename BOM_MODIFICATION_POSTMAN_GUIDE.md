# Updated Save Draft with BOM Component Modifications - Postman Guide

## 🚀 Enhanced Route: POST `/api/mo/save-draft`

### ✅ What This Supports:

1. **Auto-derive BOM** from Product (default behavior)
2. **Frontend BOM modifications** - User can change quantities, operations, durations
3. **Update actual BOM** in database with modified values
4. **Maintain data consistency** - BOM changes affect the actual Product BOM

---

## 📋 Frontend Workflow:

1. **Load Product**: Get product with existing BOM
2. **Display BOM**: Show BOM components to user for editing
3. **User Modifies**: User changes quantities, operations, or durations
4. **Send Changes**: Send modified BOM components back to save draft
5. **Update Database**: BOM entries are updated in database

---

### 🔧 Postman Request Examples:

#### **Example 1: Save Draft with BOM Modifications**

**POST** `http://localhost:3000/api/mo/save-draft`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

**Body (with BOM component modifications):**
```json
{
  "id": 64,
  "userId": 25,
  "productId": 120,
  "product": {
    "name": "Custom Dining Table - Pine",
    "description": "A custom pine dining table with modern design",
    "unit": "piece"
  },
  "quantity": 2,
  "scheduleStartDate": "2025-09-25T08:00:00Z",
  "deadline": "2025-10-05T17:00:00Z",
  "assignedToId": 25,
  "bomComponents": [
    {
      "id": 45,
      "componentId": 2,
      "quantity": 8,
      "operation": "Assembly - Modified",
      "opDurationMins": 50
    },
    {
      "id": 46,
      "componentId": 3,
      "quantity": 3,
      "operation": "Surface Preparation - Updated",
      "opDurationMins": 35
    },
    {
      "id": 47,
      "componentId": 4,
      "quantity": 20,
      "operation": "Fastening - Enhanced",
      "opDurationMins": 25
    }
  ],
  "workOrders": [
    {
      "operation": "Cut and Shape Components",
      "status": "to_do",
      "comments": "Prepare all wooden components",
      "durationMins": 120,
      "workCenterId": 1,
      "assignedToId": 25
    },
    {
      "operation": "Assembly",
      "status": "to_do", 
      "comments": "Assemble table structure",
      "durationMins": 90,
      "workCenterId": 2,
      "assignedToId": 25
    }
  ],
  "status": "draft"
}
```

#### **Example 2: Save Draft without BOM modifications (use existing BOM)**

**Body (no BOM changes - uses existing Product BOM):**
```json
{
  "id": 65,
  "userId": 25,
  "productId": 120,
  "quantity": 1,
  "scheduleStartDate": "2025-09-26T08:00:00Z",
  "deadline": "2025-10-06T17:00:00Z",
  "assignedToId": 25,
  "workOrders": [
    {
      "operation": "Standard Production",
      "status": "to_do",
      "comments": "Use standard BOM without modifications",
      "durationMins": 180,
      "workCenterId": 1,
      "assignedToId": 25
    }
  ],
  "status": "draft"
}
```

---

## 🔍 BOM Component Structure:

Each BOM component in `bomComponents` array should have:

```json
{
  "id": 45,              // BOM entry ID (required for updates)
  "componentId": 2,      // The component product ID
  "quantity": 8,         // Modified quantity
  "operation": "Assembly - Modified",  // Modified operation name
  "opDurationMins": 50   // Modified operation duration
}
```

---

## 🎯 How Frontend Should Work:

### Step 1: Load Product with BOM
```javascript
// GET /api/products/120
// Response includes BOM components
{
  "id": 120,
  "name": "Custom Dining Table - Pine",
  "bom": [
    {
      "id": 45,
      "componentId": 2,
      "quantity": 4.0,
      "operation": "Assembly",
      "opDurationMins": 45,
      "component": {
        "id": 2,
        "name": "Pine Wood Board"
      }
    }
  ]
}
```

### Step 2: Display BOM for Editing
```javascript
// Show BOM components in editable form
// User can modify:
// - quantity (4.0 → 8.0)
// - operation ("Assembly" → "Assembly - Modified")  
// - opDurationMins (45 → 50)
```

### Step 3: Send Modified BOM
```javascript
// Include modified BOM components in save draft request
// Only send BOM components that were actually modified
```

---

## ✅ Expected Response:

```json
{
  "success": true,
  "data": {
    "id": 64,
    "quantity": 2,
    "status": "draft",
    "product": {
      "id": 120,
      "name": "Custom Dining Table - Pine",
      "bom": [
        {
          "id": 45,
          "quantity": 8.0,           // Updated quantity
          "operation": "Assembly - Modified",  // Updated operation
          "opDurationMins": 50,      // Updated duration
          "component": {
            "id": 2,
            "name": "Pine Wood Board"
          }
        }
        // ... other BOM components (updated if provided)
      ]
    }
    // ... rest of MO data
  }
}
```

---

## 🔥 Key Benefits:

1. **✅ Flexible BOM Management**: Use existing BOM or modify as needed
2. **✅ Database Consistency**: BOM changes update the actual Product BOM
3. **✅ Frontend Control**: Frontend can modify quantities/operations per MO
4. **✅ Optional Updates**: Send only modified BOM components
5. **✅ Backward Compatible**: Works with or without BOM modifications

---

## 🚨 Important Notes:

### Required Fields:
- `id`: BOM entry ID (required for updates)
- `componentId`: The component product ID
- `quantity`: Component quantity

### Optional Fields:
- `operation`: Operation name (can be null)
- `opDurationMins`: Operation duration (can be null)

### BOM Update Rules:
- **Only send modified BOM components** in `bomComponents` array
- **BOM entry ID is required** to identify which BOM entry to update
- **Changes update the actual Product BOM** (affects future MOs for same product)
- **If no `bomComponents` provided**, uses existing Product BOM unchanged

---

## 🎯 Testing Scenarios:

### Scenario 1: Modify BOM Quantities
```json
"bomComponents": [
  {
    "id": 45,
    "componentId": 2,
    "quantity": 10,  // Changed from 4 to 10
    "operation": "Assembly",
    "opDurationMins": 45
  }
]
```

### Scenario 2: Change Operations
```json
"bomComponents": [
  {
    "id": 45,
    "componentId": 2,
    "quantity": 4,
    "operation": "Advanced Assembly with Glue",  // Modified operation
    "opDurationMins": 60  // Increased duration
  }
]
```

### Scenario 3: No BOM Changes
```json
// Simply omit "bomComponents" field entirely
// Uses existing Product BOM without modifications
```