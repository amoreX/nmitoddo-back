# Clean Save Draft API - BOM IDs vs Full Objects Guide

## 🎯 **Final Recommended Approach**

After analyzing your schema relationships:

### **BOM Updates: Use IDs + Changed Fields Only**
- ✅ Send BOM entry ID + only the fields that changed
- ✅ BOM entries belong to Product (not MO-specific)
- ✅ Lighter payload, less redundant data

### **Work Orders: Use Full Objects**
- ✅ Send full work order objects
- ✅ Work orders are MO-specific
- ✅ May not exist yet (new MO)

---

## 📋 **Postman Request Structure**

### **URL:** `POST /api/mo/save-draft`

### **Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

### **Body Structure:**
```json
{
  "id": 64,
  "userId": 25,
  "productId": 120,
  "quantity": 2,
  "scheduleStartDate": "2025-09-25T08:00:00Z",
  "deadline": "2025-10-05T17:00:00Z",
  "assignedToId": 25,
  
  "bomUpdates": [
    {
      "id": 45,
      "productId": 120,
      "quantity": 8
    },
    {
      "id": 46,
      "productId": 120,
      "operation": "Enhanced Surface Prep",
      "opDurationMins": 35
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

---

## 🔧 **BOM Updates Structure**

### **Only send changed fields:**

```json
"bomUpdates": [
  {
    "id": 45,           // Required: BOM entry ID
    "productId": 120,   // Required: Product ID (for validation)
    "quantity": 8       // Only if quantity changed
  },
  {
    "id": 46,           // Required: BOM entry ID  
    "productId": 120,   // Required: Product ID (for validation)
    "operation": "Enhanced Surface Prep",  // Only if operation changed
    "opDurationMins": 35                   // Only if duration changed
  },
  {
    "id": 47,           // Required: BOM entry ID
    "productId": 120,   // Required: Product ID (for validation)
    "quantity": 20,     // Changed quantity
    "operation": "Fastening - Enhanced"    // Changed operation
  }
]
```

### **What NOT to send:**
- `componentId` (can't change - that's a different BOM entry)
- Unchanged fields (reduces payload size)
- Full component objects

---

## 🏗️ **Work Orders Structure**

### **Full objects (can create new or update existing):**

```json
"workOrders": [
  {
    "id": 201,                    // Optional: if provided, updates existing
    "operation": "Updated Operation",
    "status": "to_do",
    "comments": "Updated comments",
    "durationMins": 150,
    "workCenterId": 1,
    "assignedToId": 25
  },
  {
    // No ID = creates new work order
    "operation": "New Quality Check",
    "status": "to_do",
    "comments": "Additional quality step",
    "durationMins": 30,
    "workCenterId": 3,
    "assignedToId": 25
  }
]
```

---

## 🎯 **Example Frontend Workflow**

### **Step 1: Load Product with BOM**
```javascript
// GET /api/products/120
const product = {
  id: 120,
  name: "Custom Dining Table",
  bom: [
    { id: 45, componentId: 2, quantity: 4, operation: "Assembly", opDurationMins: 45 },
    { id: 46, componentId: 3, quantity: 2, operation: "Surface Prep", opDurationMins: 30 }
  ]
};
```

### **Step 2: User Modifies BOM in Frontend**
```javascript
// User changes quantity from 4 to 8 for BOM entry 45
// User changes operation for BOM entry 46
const bomUpdates = [
  { id: 45, productId: 120, quantity: 8 },                    // Only changed quantity
  { id: 46, productId: 120, operation: "Enhanced Surface Prep" } // Only changed operation
];
```

### **Step 3: Send Only Changes**
```javascript
// POST /api/mo/save-draft
{
  "productId": 120,
  "quantity": 2,
  "bomUpdates": bomUpdates,  // Only the changes
  "workOrders": [...],       // Full work order objects
  // ... other fields
}
```

---

## ✅ **Benefits of This Approach**

### **BOM Updates (IDs + Changes):**
- ✅ **Lighter payloads** - only send what changed
- ✅ **Clear intent** - explicit about what's being modified
- ✅ **Database efficiency** - updates only changed fields
- ✅ **Error prevention** - can't accidentally change componentId

### **Work Orders (Full Objects):**
- ✅ **MO-specific** - each MO has its own work orders
- ✅ **Create or update** - ID present = update, no ID = create new
- ✅ **Complete control** - full work order lifecycle management

---

## 🚨 **Important Notes**

### **BOM Updates:**
- **Required:** `id` (BOM entry ID), `productId` (for validation)
- **Optional:** `quantity`, `operation`, `opDurationMins`
- **Forbidden:** `componentId` (would create new BOM entry)
- **Behavior:** Updates the actual Product BOM
- **Validation:** BOM entry must belong to the specified product

### **Work Orders:**
- **With ID:** Updates existing work order
- **Without ID:** Creates new work order
- **Behavior:** Deletes existing MO work orders, creates new ones

### **Validation:**
- BOM entry IDs must exist and belong to the product
- Work center IDs must exist
- User IDs must exist for assignments

---

## 🔍 **Test Cases**

### **Case 1: Only BOM Changes**
```json
{
  "id": 64, "userId": 25, "productId": 120, "quantity": 2,
  "bomUpdates": [{ "id": 45, "productId": 120, "quantity": 10 }],
  "status": "draft"
}
```

### **Case 2: Only Work Order Changes**
```json
{
  "id": 64, "userId": 25, "productId": 120, "quantity": 2,
  "workOrders": [
    { "operation": "New Process", "durationMins": 120, "workCenterId": 1 }
  ],
  "status": "draft"
}
```

### **Case 3: No BOM or Work Order Changes**
```json
{
  "id": 64, "userId": 25, "productId": 120, "quantity": 5,
  "status": "draft"
}
```

This approach gives you the **best of both worlds**: 
- Efficient BOM updates with minimal data
- Flexible work order management with full control! 🚀