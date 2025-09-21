# NMIT Manufacturing ERP Backend

A comprehensive manufacturing ERP system backend built with Node.js, TypeScript, Express, and Prisma. This system provides complete manufacturing management capabilities including Bill of Materials (BOM), Manufacturing Orders (MO), Work Orders (WO), Stock Management, and comprehensive reporting with PDF generation.

## Features

### Core Manufacturing
- **Bill of Materials (BOM)** - Create and manage product BOMs with components, operations, and cost calculations
- **Manufacturing Orders** - Complete MO lifecycle management with status tracking and progress monitoring
- **Work Orders** - Detailed work order management with work center assignments
- **Stock Management** - Real-time inventory tracking with movement ledgers and stock verification
- **Work Centers** - Manage production resources and capacity

### Advanced Features
- **JWT Authentication** - Secure user authentication with role-based access control
- **PDF Report Generation** - Comprehensive manufacturing reports (daily, weekly, monthly, quarterly, yearly)
- **MO Presets** - Pre-configured manufacturing order templates
- **Component Availability** - Real-time component stock verification for manufacturing orders
- **Product Management** - Complete CRUD operations with search and filtering
- **User Management** - Multi-role user system (admin, manager, user)

### Technical Features
- **TypeScript** - Full type safety and modern JavaScript features
- **Prisma ORM** - Type-safe database operations with PostgreSQL
- **RESTful APIs** - Well-structured API endpoints with comprehensive documentation
- **CORS Support** - Cross-origin resource sharing for frontend integration
- **Password Reset** - OTP-based password recovery system

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **PDF Generation**: PDFKit, PDFMake, Puppeteer
- **Password Hashing**: bcrypt
- **Development**: ts-node-dev, nodemon

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nmitoddo-back
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database
   POSTGRES_URL="postgresql://username:password@localhost:5432/nmit_manufacturing"
   
   # JWT Secret (minimum 32 characters)
   JWT_SECRET="your-very-secure-secret-key-here-min-32-chars"
   
   # Server Configuration
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Setup database and seed initial data
   npm run prisma:setup
   
   # Or run individually:
   npx prisma db push
   npx prisma generate
   node prisma/seed.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The server will start at `http://localhost:3000`

## 🚀 Quick Start

### Health Check
```bash
curl http://localhost:3000/
```

### User Registration
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "admin@example.com",
    "pwd": "password123"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "admin@example.com",
    "pwd": "password123"
  }'
```

## 📚 API Documentation

### Authentication
All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints Overview

#### 🔐 Authentication APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/auth/signup` | User registration | Public |
| `POST` | `/api/auth/login` | User login | Public |
| `GET` | `/api/profile` | Get user profile | Authenticated |
| `PUT` | `/api/profile` | Update user profile | Authenticated |

#### 🏭 Product Management APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/products` | Get all products with BOM & stock | All |
| `GET` | `/api/products/:id` | Get product details | All |
| `POST` | `/api/products` | Create new product | Admin/Manager |
| `PUT` | `/api/products/:id` | Update product | Admin/Manager |
| `DELETE` | `/api/products/:id` | Delete product | Admin/Manager |
| `GET` | `/api/products/search?q=term` | Search products | All |
| `GET` | `/api/products/low-stock?threshold=10` | Get low stock products | All |

#### 📋 Bill of Materials (BOM) APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/bom` | Get all BOMs | All |
| `GET` | `/api/bom/:productId` | Get BOM by product ID | All |
| `POST` | `/api/bom` | Create new BOM | Admin/Manager |
| `PUT` | `/api/bom/:productId` | Update BOM | Admin/Manager |
| `DELETE` | `/api/bom/:productId` | Delete BOM | Admin/Manager |

#### 🏭 Manufacturing Order APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/mo/dashboard` | Get MO dashboard with filters | All |
| `GET` | `/api/mo/:id` | Get detailed MO information | All |
| `POST` | `/api/mo/new` | Create new MO | Admin/Manager |
| `POST` | `/api/mo/save-draft` | Save MO draft | Admin/Manager |
| `PUT` | `/api/mo/:id/status` | Update MO status | Admin/Manager |

#### ⚙️ Work Order APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/wo/new` | Create new work order | Admin/Manager |

#### 📦 Stock Management APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/stock` | Get all product stocks | All |
| `GET` | `/api/stock/:id` | Get product stock | All |
| `POST` | `/api/stock/movement` | Record stock movement | Admin/Manager |
| `PUT` | `/api/stock/:id` | Update stock quantity | Admin/Manager |
| `GET` | `/api/stock/ledger` | Get stock movements | All |
| `GET` | `/api/stock/:id/ledger` | Get product movements | All |

#### 📊 Reports APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `POST` | `/api/reports/generate` | Generate manufacturing report | All |
| `GET` | `/api/reports/types` | Get available report types | All |

#### ⚡ Data Fetch APIs
| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| `GET` | `/api/fetch/all` | Get all system data | All |
| `GET` | `/api/fetch/tables` | Get available tables | All |
| `GET` | `/api/fetch/:tableName` | Get specific table data | All |

## 🗄️ Database Schema

### Core Models
- **User** - System users with role-based access
- **Product** - Manufacturing products and components
- **BOM** - Bill of Materials with component relationships
- **ManufacturingOrder** - Production orders with lifecycle management
- **WorkOrder** - Individual work tasks within manufacturing orders
- **WorkCenter** - Production resources and equipment
- **Stock** - Inventory management with real-time tracking
- **ProductLedger** - Stock movement history and audit trail
- **Report** - Generated manufacturing reports
- **MOPresets** - Manufacturing order templates

### User Roles
- **admin** - Full system access and user management
- **manager** - Manufacturing operations and data management
- **user** - Read-only access to manufacturing data

## 📈 Report Types

The system generates comprehensive PDF reports with the following types:

1. **Daily Reports** - New MOs, work order activity, stock movements, exceptions
2. **Weekly Reports** - MO status summary, completion rates, work center utilization
3. **Monthly Reports** - Lead times, productivity metrics, cost analysis
4. **Quarterly Reports** - Performance trends, capacity analysis, BOM variances
5. **Yearly Reports** - Total output, efficiency, strategic KPIs

## 🔧 Development

### Available Scripts
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database setup (push schema, generate client, seed data)
npm run prisma:setup
```

### Database Commands
```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with initial data
node prisma/seed.js

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Role-Based Access Control** - Different permission levels
- **Input Validation** - Request validation and sanitization
- **CORS Configuration** - Cross-origin request handling

## 📝 API Usage Examples

### Create a Product
```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Intel Core i9 Processor',
    description: 'High-performance gaming processor',
    unit: 'pieces'
  })
});
```

### Create Manufacturing Order
```javascript
const response = await fetch('/api/mo/new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    productId: 1,
    quantity: 100,
    scheduleStartDate: '2025-10-01T08:00:00.000Z',
    deadline: '2025-10-15T17:00:00.000Z'
  })
});
```

### Generate Report
```javascript
const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    reportType: 'daily',
    userId: 1
  })
});
```

## 🚀 Deployment

### Production Environment Variables
```env
# Database
POSTGRES_URL="postgresql://username:password@host:port/database"

# JWT Secret (use a strong, unique secret)
JWT_SECRET="your-production-secret-key-minimum-32-characters"

# Server
PORT=3000
NODE_ENV=production
```

### Build and Deploy
```bash
# Install dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation in the `/docs` folder
- Review the comprehensive API guides in the project root

## 🔗 Related Documentation

- [Complete API Routes](./COMPLETE_API_ROUTES.md)
- [Authentication Usage](./AUTHENTICATION_USAGE.md)
- [BOM API Documentation](./BOM_API_DOCUMENTATION.md)
- [Manufacturing Orders API](./MANUFACTURING_ORDERS_API.md)
- [Reports API Documentation](./REPORTS_API_DOCUMENTATION.md)
- [Stock API Documentation](./STOCK_API_DOCUMENTATION.md)

