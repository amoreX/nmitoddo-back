# Authentication System Usage Examples

This document provides comprehensive examples of how to use the JWT-based authentication system.

## Environment Setup

Make sure to set the JWT_SECRET environment variable:

```bash
# In your .env file
JWT_SECRET=your-very-secure-secret-key-here-min-32-chars
```

## API Endpoints

### 1. User Registration

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
 * Input JSON example:
 * {
 *   "loginId": "alice@example.com",
 *   "pwd": "alice"
 * }
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "alice@example.com",
    "name": "Alice Admin",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "loginId": "alice@example.com",
  "pwd": "alice"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "alice@example.com",
    "name": "Alice Admin",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 3. Protected Route Example - Get Profile

**Endpoint:** `GET /api/profile`

**Headers Required:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "alice@example.com",
    "name": "Alice Admin",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (401) - No Token:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Error Response (401) - Invalid Token:**
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

## Frontend JavaScript Examples

### 1. Registration
```javascript
const signup = async (loginId, pwd, name) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loginId, pwd, name }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store the token in localStorage
      localStorage.setItem('authToken', data.token);
      console.log('Signup successful:', data.user);
      return data;
    } else {
      console.error('Signup failed:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};
```

### 2. Login
```javascript
const login = async (loginId, pwd) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loginId, pwd }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store the token in localStorage
      localStorage.setItem('authToken', data.token);
      console.log('Login successful:', data.user);
      return data;
    } else {
      console.error('Login failed:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### 3. Making Authenticated Requests
```javascript
const getProfile = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Profile data:', data.user);
      return data.user;
    } else {
      console.error('Get profile failed:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};
```

### 4. Logout
```javascript
const logout = () => {
  localStorage.removeItem('authToken');
  console.log('Logged out successfully');
  // Redirect to login page or update UI
};
```

## Backend Implementation Examples

### Protecting Additional Routes

```typescript
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";

const protectedRoutes = Router();

// Example: Get user's orders
protectedRoutes.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!; // Available after authMiddleware
    
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
});

export default protectedRoutes;
```

### Optional Authentication

```typescript
import { optionalAuthMiddleware } from "../middleware/authMiddleware";

// Route that behaves differently for authenticated vs anonymous users
router.get("/public-data", optionalAuthMiddleware, async (req, res) => {
  const userId = req.userId; // May be undefined
  
  if (userId) {
    // User is authenticated, return personalized data
    const personalizedData = await getPersonalizedData(userId);
    res.json({ data: personalizedData, personalized: true });
  } else {
    // Anonymous user, return general data
    const generalData = await getGeneralData();
    res.json({ data: generalData, personalized: false });
  }
});
```

## Testing with cURL

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "alice@example.com",
    "pwd": "alice",
    "name": "Alice Admin"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "alice@example.com",
    "pwd": "alice"
  }'
```

### 3. Access protected route
```bash
# Replace YOUR_JWT_TOKEN with the actual token from login response
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Expiration**: Tokens expire after 7 days
3. **Input Validation**: Email format and password length validation
4. **Error Handling**: Consistent error responses without exposing sensitive information
5. **Token Verification**: Proper JWT signature verification
6. **CORS Ready**: Can be easily configured for cross-origin requests

## Common Error Codes

- **400**: Bad Request (validation errors, missing fields)
- **401**: Unauthorized (invalid credentials, missing/invalid token)
- **404**: Not Found (user not found)
- **409**: Conflict (email already exists)
- **500**: Internal Server Error

## Best Practices

1. Always store JWT tokens securely (httpOnly cookies in production)
2. Implement token refresh mechanism for better UX
3. Use HTTPS in production
4. Set appropriate CORS policies
5. Implement rate limiting for auth endpoints
6. Log authentication attempts for security monitoring
7. Consider implementing password reset functionality
8. Add email verification for new accounts