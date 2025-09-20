# Complete API Routes List for Frontend

## 🔐 Authentication Required
All APIs require JWT token in Authorization header: `Authorization: Bearer <token>`

## 📋 **Complete API Endpoints**

### **1. Authentication APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/auth/signup` | User registration | Public |
| `POST` | `/api/auth/login` | User login | Public |

### **2. User Profile APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/profile` | Get current user profile | All |
| `PUT` | `/api/profile` | Update user profile | All |

### **3. Product Management APIs (NEW)**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/products` | Get all products with BOM & stock | All |
| `GET` | `/api/products/:id` | Get product details | All |
| `POST` | `/api/products` | Create new product | Admin/Manager |
| `PUT` | `/api/products/:id` | Update product | Admin/Manager |
| `DELETE` | `/api/products/:id` | Delete product | Admin/Manager |
| `GET` | `/api/products/search?q=term` | Search products | All |
| `GET` | `/api/products/low-stock?threshold=10` | Get low stock products | All |

### **4. Stock Management APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/stock/movement` | Record stock movement | Admin/Manager |
| `GET` | `/api/stock` | Get all product stocks | All |
| `GET` | `/api/stock/:id` | Get product stock | All |
| `PUT` | `/api/stock/:id` | Update stock quantity | Admin/Manager |
| `DELETE` | `/api/stock/:id` | Delete stock record | Admin/Manager |
| `GET` | `/api/stock/ledger` | Get stock movements | All |
| `GET` | `/api/stock/:id/ledger` | Get product movements | All |
| `GET` | `/api/stock/:id/verify` | Verify stock consistency | All |

### **5. Manufacturing Order APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/mo/new` | Create new MO | Admin/Manager |
| `POST` | `/api/mo/save-draft` | Save MO draft | Admin/Manager |

### **6. Work Order APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/wo/new` | Create new work order | Admin/Manager |

### **7. Work Center APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/workCenters/new` | Create work center | Admin/Manager |

### **8. MO Presets APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/moPresets` | Get all MO presets | All |
| `GET` | `/api/moPresets/:id` | Get MO preset by ID | All |
| `POST` | `/api/moPresets` | Create MO preset | Admin |
| `PUT` | `/api/moPresets/:id` | Update MO preset | Admin |
| `DELETE` | `/api/moPresets/:id` | Delete MO preset | Admin |

### **9. Data Fetch APIs**
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/fetch/all` | Get all system data | All |
| `GET` | `/api/fetch/tables` | Get available tables | All |
| `GET` | `/api/fetch/:tableName` | Get specific table data | All |

---

## 🆕 **New Product APIs - Detailed Examples**

### **Create Product**
```javascript
POST /api/products
{
  "name": "Intel Core i9 Processor",
  "description": "High-performance gaming processor",
  "unit": "pieces"
}

Response:
{
  "status": true,
  "message": "Product created successfully",
  "data": {
    "id": 50,
    "name": "Intel Core i9 Processor",
    "description": "High-performance gaming processor",
    "unit": "pieces",
    "createdAt": "2025-09-20T10:00:00.000Z",
    "stock": null,
    "_count": {
      "bom": 0,
      "usedInBOM": 0,
      "manufacturingOrders": 0,
      "productLedger": 0
    }
  }
}
```

### **Get Product Details**
```javascript
GET /api/products/19

Response:
{
  "status": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": 19,
    "name": "Intel Core i7 Processor",
    "description": "High-performance processor",
    "unit": "pieces",
    "createdAt": "2025-09-20T08:00:00.000Z",
    "stock": {
      "id": 1,
      "productId": 19,
      "quantity": 40,
      "updatedAt": "2025-09-20T09:00:00.000Z"
    },
    "bom": [], // Products that use this as component
    "usedInBOM": [
      {
        "id": 1,
        "productId": 34,
        "quantity": 1,
        "operation": "CPU Installation",
        "product": {
          "id": 34,
          "name": "Premium Laptop A1",
          "unit": "Unit"
        }
      }
    ],
    "manufacturingOrders": [
      {
        "id": 6,
        "quantity": 10,
        "status": "confirmed",
        "createdAt": "2025-09-20T08:00:00.000Z",
        "scheduleStartDate": "2025-10-01T00:00:00.000Z",
        "deadline": "2025-10-15T00:00:00.000Z"
      }
    ],
    "productLedger": [
      {
        "id": 15,
        "movementType": "out",
        "quantity": 10,
        "referenceType": "MO",
        "referenceId": 6,
        "createdAt": "2025-10-01T12:00:00.000Z"
      }
    ],
    "_count": {
      "bom": 0,
      "usedInBOM": 5,
      "manufacturingOrders": 2,
      "productLedger": 8
    }
  }
}
```

### **Search Products**
```javascript
GET /api/products/search?q=processor&limit=20

Response:
{
  "status": true,
  "message": "Products search completed",
  "data": [
    {
      "id": 19,
      "name": "Intel Core i7 Processor",
      "description": "High-performance processor",
      "unit": "pieces",
      "stock": {
        "quantity": 40
      }
    }
  ],
  "searchTerm": "processor",
  "resultCount": 1
}
```

### **Get Low Stock Products**
```javascript
GET /api/products/low-stock?threshold=20

Response:
{
  "status": true,
  "message": "Low stock products retrieved successfully",
  "data": [
    {
      "id": 25,
      "name": "NVIDIA RTX 4080",
      "description": "High-end graphics card",
      "unit": "pieces",
      "stock": {
        "quantity": 15
      }
    }
  ],
  "threshold": 20,
  "count": 1
}
```

---

## 🎯 **Frontend Integration Examples**

### **Product Management**
```javascript
// Get all products
const getAllProducts = async () => {
  const response = await fetch('/api/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Create new product
const createProduct = async (productData) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return response.json();
};

// Search products
const searchProducts = async (searchTerm) => {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Get low stock alerts
const getLowStockProducts = async (threshold = 10) => {
  const response = await fetch(`/api/products/low-stock?threshold=${threshold}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### **Complete Stock Management**
```javascript
// Get product with stock info
const getProductWithStock = async (productId) => {
  const response = await fetch(`/api/products/${productId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Record stock movement
const recordStockMovement = async (productId, type, quantity, reason) => {
  const response = await fetch('/api/stock/movement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      movementType: type,
      quantity,
      referenceType: 'manual',
      reason
    })
  });
  return response.json();
};
```

---

## ✅ **Frontend Features You Can Now Build**

### **Product Management Dashboard**
- ✅ View all products with stock levels
- ✅ Create/edit/delete products
- ✅ Search products by name/description
- ✅ View product details with BOM and usage
- ✅ Low stock alerts and monitoring

### **Inventory Management**
- ✅ Real-time stock levels
- ✅ Record stock movements (in/out)
- ✅ Complete movement history
- ✅ Stock adjustments and corrections
- ✅ Stock verification and audit

### **Manufacturing Integration**
- ✅ Check component availability
- ✅ Create manufacturing orders
- ✅ Track material consumption
- ✅ Work order management
- ✅ BOM management through presets

### **User Management**
- ✅ Role-based access control
- ✅ User authentication
- ✅ Profile management

This complete API ecosystem now provides everything needed for a full-featured manufacturing management frontend! 🚀