# Corrected Save Draft Manufacturing Order - Postman Test

## 🚀 Fixed Route: POST `/api/mo/save-draft`

### ✅ What Changed:
- **Removed `components`** array from request (now auto-derived from Product's BOM)
- **Simplified request structure** - just specify the product and quantity
- **BOM components are automatically calculated** based on the product's existing BOM
- **Work orders are still customizable** per manufacturing order

---

## 📋 Postman Request

### URL:
```
POST http://localhost:3000/api/mo/save-draft
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

### Body (JSON):
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
    },
    {
      "operation": "Sanding and Finishing",
      "status": "to_do",
      "comments": "Sand and apply varnish",
      "durationMins": 180,
      "workCenterId": 3,
      "assignedToId": 25
    },
    {
      "operation": "Quality Control",
      "status": "to_do",
      "comments": "Final inspection",
      "durationMins": 30,
      "workCenterId": 1,
      "assignedToId": 25
    }
  ],
  "status": "draft"
}
```

---

## 🔧 How It Works Now:

1. **Product Selection**: You specify `productId: 120`
2. **Automatic BOM Lookup**: System finds Product 120's BOM in the database
3. **Component Calculation**: For quantity 2, it automatically calculates:
   - Component requirements from the BOM
   - Total material costs
   - Stock availability
4. **Work Orders**: You can still define custom work orders per MO
5. **Product Updates**: Optional product field updates

---

## 🎯 Expected Response:

```json
{
  "success": true,
  "data": {
    "id": 64,
    "quantity": 2,
    "status": "draft",
    "scheduleStartDate": "2025-09-25T08:00:00.000Z",
    "deadline": "2025-10-05T17:00:00.000Z",
    "createdAt": "2025-09-21T03:55:00.000Z",
    "updatedAt": "2025-09-21T03:55:00.000Z",
    "product": {
      "id": 120,
      "name": "Custom Dining Table - Pine",
      "description": "A custom pine dining table with modern design",
      "unit": "piece",
      "bom": [
        {
          "id": 45,
          "quantity": 4.0,
          "operation": "Assembly",
          "opDurationMins": 45,
          "component": {
            "id": 2,
            "name": "Pine Wood Board",
            "unit": "piece",
            "description": "High quality pine wood board"
          }
        }
        // ... more BOM components automatically included
      ],
      "stock": {
        "id": 120,
        "availableQuantity": 0,
        "reservedQuantity": 2,
        "cost": 150.00
      }
    },
    "assignedTo": {
      "id": 25,
      "name": "John Carpenter",
      "email": "john@company.com"
    },
    "createdBy": {
      "id": 25,
      "name": "John Carpenter", 
      "email": "john@company.com"
    },
    "workOrders": [
      {
        "id": 201,
        "operation": "Cut and Shape Components",
        "status": "to_do",
        "comments": "Prepare all wooden components",
        "durationMins": 120,
        "durationDoneMins": 0,
        "workCenter": {
          "id": 1,
          "name": "Wood Workshop"
        },
        "assignedTo": {
          "id": 25,
          "name": "John Carpenter"
        }
      }
      // ... more work orders
    ]
  }
}
```

---

## 📝 Key Benefits:

1. **✅ Data Consistency**: Components always match the Product's actual BOM
2. **✅ Simplified Frontend**: No need to manually specify components
3. **✅ Automatic Calculations**: Material costs and stock requirements calculated automatically
4. **✅ BOM-Driven**: Changes to Product BOM automatically reflect in all new MOs
5. **✅ Less Error-Prone**: No risk of component/BOM mismatches

---

## 🚨 Important Notes:

- **Product must exist** with productId
- **Product should have BOM defined** (otherwise no components will be calculated)
- **Work orders are optional** but recommended
- **All dates should be in ISO format**
- **Authentication required** - include JWT token in Authorization header

---

## 🔍 Testing Steps:

1. **First**: Ensure product 120 exists and has BOM components
2. **Login**: Get JWT token from login endpoint
3. **Save Draft**: Use the corrected request above
4. **Verify**: Check that BOM components are automatically included
5. **Check Stock**: Verify stock calculations are correct