# Save Draft Manufacturing Order Tests with Relations

Based on your current system data, here are comprehensive tests for the save draft functionality with proper relations.

## Test Data Overview
From your system:
- **Products**: Coffee Table (ID: 109), Dining Table (ID: 108), Office Desk (ID: 110)
- **Users**: Keshav (ID: 25, admin), Nihal (ID: 26, manager), Ronish (ID: 27, user)
- **Work Centers**: Assembly Line (ID: 19), Paint Floor (ID: 20), Packaging Line (ID: 21)
- **BOM Entries**: Product 108 has BOMs (IDs: 67-71), Product 109 has BOMs (IDs: 72-76), Product 110 has BOMs (IDs: 77-82)

---

## Test 1: Basic Save Draft with Product Relations

**Endpoint**: `POST /api/mo/draft`

```json
{
  "id": 160,
  "userId": 25,
  "productId": 109,
  "quantity": 5,
  "scheduleStartDate": "2025-09-25T08:00:00.000Z",
  "deadline": "2025-10-10T17:00:00.000Z",
  "assignedToId": 26
}
```

**Expected Result**: 
- Creates MO with ID 160
- Auto-derives BOM components from Coffee Table (Product 109)
- Status: "draft"
- All relations properly linked

---

## Test 2: Save Draft with Product Updates

**Endpoint**: `POST /api/mo/draft`

```json
{
  "id": 161,
  "userId": 26,
  "productId": 108,
  "product": {
    "name": "Premium Dining Table - Oak",
    "description": "6-seater premium oak dining table with enhanced finish"
  },
  "quantity": 3,
  "assignedToId": 27
}
```

**Expected Result**:
- Updates product 108 with new name and description
- Creates MO with updated product data
- BOM components remain unchanged but linked to updated product

---

## Test 3: Save Draft with BOM Updates

**Endpoint**: `POST /api/mo/draft`

```json
{
  "id": 162,
  "userId": 25,
  "productId": 110,
  "quantity": 2,
  "bomUpdates": [
    {
      "id": 77,
      "productId": 110,
      "quantity": 6,
      "opDurationMins": 60
    },
    {
      "id": 78,
      "productId": 110,
      "operation": "Premium Painting",
      "opDurationMins": 50
    }
  ],
  "assignedToId": 26
}
```

**Expected Result**:
- Creates MO for Office Desk (Product 110)
- Updates BOM entry 77: quantity from 4 to 6, duration from 50 to 60 mins
- Updates BOM entry 78: operation name and duration
- Other BOM entries (79-82) remain unchanged

---

## Test 4: Save Draft with Work Orders

**Endpoint**: `POST /api/mo/draft`

```json
{
  "id": 163,
  "userId": 26,
  "productId": 109,
  "quantity": 4,
  "workOrders": [
    {
      "operation": "Assembly",
      "status": "to_do",
      "durationMins": 45,
      "workCenterId": 19,
      "assignedToId": 27
    },
    {
      "operation": "Painting",
      "status": "to_do", 
      "durationMins": 25,
      "workCenterId": 20,
      "assignedToId": 26
    },
    {
      "operation": "Quality Check",
      "status": "to_do",
      "durationMins": 15,
      "workCenterId": 21,
      "assignedToId": 25
    }
  ]
}
```

**Expected Result**:
- Creates MO with 3 work orders
- Work orders assigned to different work centers and users
- All work orders linked to the MO

---

## Test 5: Complete Save Draft with All Relations

**Endpoint**: `POST /api/mo/draft`

```json
{
  "id": 164,
  "userId": 25,
  "productId": 108,
  "product": {
    "name": "Custom Dining Table - Oak Premium",
    "description": "8-seater oak dining table with custom finish"
  },
  "quantity": 2,
  "scheduleStartDate": "2025-09-30T09:00:00.000Z",
  "deadline": "2025-10-15T17:00:00.000Z",
  "assignedToId": 26,
  "bomUpdates": [
    {
      "id": 67,
      "productId": 108,
      "quantity": 6,
      "operation": "Premium Assembly",
      "opDurationMins": 75
    },
    {
      "id": 70,
      "productId": 108,
      "quantity": 2,
      "opDurationMins": 20
    }
  ],
  "workOrders": [
    {
      "operation": "Pre-Assembly Setup",
      "status": "to_do",
      "durationMins": 30,
      "workCenterId": 19,
      "assignedToId": 27,
      "comments": "Prepare all components"
    },
    {
      "operation": "Main Assembly",
      "status": "to_do",
      "durationMins": 75,
      "workCenterId": 19,
      "assignedToId": 26
    },
    {
      "operation": "Premium Painting",
      "status": "to_do",
      "durationMins": 40,
      "workCenterId": 20,
      "assignedToId": 26
    },
    {
      "operation": "Final Packaging",
      "status": "to_do",
      "durationMins": 25,
      "workCenterId": 21,
      "assignedToId": 27
    }
  ]
}
```

**Expected Result**:
- Updates product 108 with new details
- Creates MO with complete workflow
- Updates specific BOM entries (67, 70) while preserving others
- Creates 4 work orders with proper assignments
- All relations properly maintained

---

## Test 6: Update Existing Draft (Upsert Test)

**Endpoint**: `POST /api/mo/draft`

```json
{
  "id": 160,
  "userId": 25,
  "productId": 109,
  "quantity": 8,
  "scheduleStartDate": "2025-09-26T08:00:00.000Z",
  "deadline": "2025-10-12T17:00:00.000Z",
  "assignedToId": 27,
  "bomUpdates": [
    {
      "id": 72,
      "productId": 109,
      "quantity": 5,
      "opDurationMins": 50
    }
  ]
}
```

**Expected Result**:
- Updates existing MO 160 (from Test 1)
- Changes quantity from 5 to 8
- Updates schedule and deadline
- Changes assigned user from 26 to 27
- Updates BOM entry 72

---

## Test 7: Error Cases

### Missing Required Fields
```json
{
  "id": 165,
  "userId": 25,
  "quantity": 3
}
```
**Expected Error**: "Required fields: id, userId, productId, quantity"

### Invalid Product ID
```json
{
  "id": 166,
  "userId": 25,
  "productId": 999,
  "quantity": 2
}
```
**Expected Error**: "Product not found"

### Invalid BOM Update (Wrong Product)
```json
{
  "id": 167,
  "userId": 25,
  "productId": 109,
  "quantity": 2,
  "bomUpdates": [
    {
      "id": 67,
      "productId": 108,
      "quantity": 4
    }
  ]
}
```
**Expected Error**: "BOM entry 67 does not belong to product 109"

### Non-existent BOM Entry
```json
{
  "id": 168,
  "userId": 25,
  "productId": 109,
  "quantity": 2,
  "bomUpdates": [
    {
      "id": 999,
      "productId": 109,
      "quantity": 4
    }
  ]
}
```
**Expected Error**: "BOM entry with ID 999 not found"

---

## Test 8: Complex Relations Verification

After creating MO with Test 5, verify the response includes:

```json
{
  "success": true,
  "data": {
    "id": 164,
    "quantity": 2,
    "status": "draft",
    "product": {
      "id": 108,
      "name": "Custom Dining Table - Oak Premium",
      "description": "8-seater oak dining table with custom finish",
      "bom": [
        {
          "id": 67,
          "quantity": 6,
          "operation": "Premium Assembly",
          "opDurationMins": 75,
          "component": {
            "id": 83,
            "name": "Wooden Legs - Dining",
            "unit": "pieces"
          }
        }
        // ... other BOM entries
      ],
      "stock": {
        "quantity": 1
      }
    },
    "createdBy": {
      "id": 25,
      "name": "Keshav J",
      "email": "keshav@example.com"
    },
    "assignedTo": {
      "id": 26,
      "name": "Nihal",
      "email": "nihal@example.com"
    },
    "workOrders": [
      {
        "operation": "Pre-Assembly Setup",
        "status": "to_do",
        "durationMins": 30,
        "workCenter": {
          "id": 19,
          "name": "Assembly Line"
        },
        "assignedTo": {
          "id": 27,
          "name": "Ronish"
        }
      }
      // ... other work orders
    ]
  }
}
```

---

## Postman Collection Setup

1. **Environment Variables**:
   ```
   baseUrl: http://localhost:3000
   authToken: <your-jwt-token>
   ```

2. **Headers** (for all requests):
   ```
   Content-Type: application/json
   Authorization: Bearer {{authToken}}
   ```

3. **Pre-request Script** (to generate unique IDs):
   ```javascript
   pm.globals.set("uniqueId", Date.now());
   ```

4. **Tests Script** (for success responses):
   ```javascript
   pm.test("Status code is 201", function () {
       pm.response.to.have.status(201);
   });
   
   pm.test("Response has success true", function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.success).to.be.true;
   });
   
   pm.test("Response contains MO data", function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.data).to.have.property('id');
       pm.expect(jsonData.data).to.have.property('product');
       pm.expect(jsonData.data).to.have.property('createdBy');
   });
   ```

---

## Key Testing Points

1. **Product Relations**: Verify product data updates and BOM auto-derivation
2. **BOM Updates**: Test selective BOM field updates with validation
3. **Work Orders**: Test creation and assignment to work centers/users
4. **User Relations**: Verify createdBy and assignedTo relationships
5. **Upsert Logic**: Test both create and update scenarios
6. **Error Handling**: Test all validation scenarios
7. **Response Structure**: Verify complete nested data returns correctly

These tests cover all the relation scenarios in your manufacturing system!