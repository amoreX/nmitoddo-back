# Postman Guide: Update User & Login with Email

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Login with Email
**POST** `/auth/loginWithEmail`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "alice@example.com",
  "pwd": "alice"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "alice@example.com",
    "name": "Alice Admin",
    "loginId": "alice@example.com",
    "role": "user",
    "createdAt": "2025-09-21T03:00:00.000Z",
    "updatedAt": "2025-09-21T03:00:00.000Z"
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

---

### 2. Update User
**PUT** `/auth/user`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

#### Update Name Only:
**Body (JSON):**
```json
{
  "name": "Updated Name"
}
```

#### Update Email Only:
**Body (JSON):**
```json
{
  "email": "newemail@example.com"
}
```

#### Update Both Name and Email:
**Body (JSON):**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "email": "john.updated@example.com",
    "name": "John Doe Updated",
    "loginId": "alice@example.com",
    "role": "user",
    "createdAt": "2025-09-21T03:00:00.000Z",
    "updatedAt": "2025-09-21T03:55:00.000Z"
  }
}
```

**Error Responses:**

**401 - No Authentication:**
```json
{
  "success": false,
  "message": "Authentication required - User ID not found in token"
}
```

**400 - No Fields Provided:**
```json
{
  "success": false,
  "message": "At least one field (name or email) must be provided"
}
```

**400 - Invalid Email Format:**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

**400 - Email Already Exists:**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

## Step-by-Step Testing Guide

### Step 1: Login with Email
1. Open Postman
2. Create a new **POST** request
3. Set URL: `http://localhost:3000/api/auth/loginWithEmail`
4. Set Headers:
   - `Content-Type: application/json`
5. Set Body (raw JSON):
   ```json
   {
     "email": "alice@example.com",
     "pwd": "alice"
   }
   ```
6. Send the request
7. **Copy the token** from the response for the next step

### Step 2: Update User Information
1. Create a new **PUT** request
2. Set URL: `http://localhost:3000/api/auth/user`
3. Set Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <paste-token-here>`
4. Set Body (raw JSON) - choose one:
   
   **Option A - Update Name:**
   ```json
   {
     "name": "New Name"
   }
   ```
   
   **Option B - Update Email:**
   ```json
   {
     "email": "new@example.com"
   }
   ```
   
   **Option C - Update Both:**
   ```json
   {
     "name": "Complete New Name",
     "email": "completenew@example.com"
   }
   ```
5. Send the request

### Step 3: Verify Update
You can login again with the new email (if you updated it) to verify the changes were applied.

---

## Environment Variables (Optional)

You can set up Postman environment variables:

1. **baseUrl**: `http://localhost:3000/api`
2. **authToken**: `<empty initially, will be set after login>`

Then use:
- URL: `{{baseUrl}}/auth/loginWithEmail`
- Authorization: `Bearer {{authToken}}`

## Troubleshooting

**Issue**: "Authentication required - User ID not found in token"
- **Solution**: Make sure you're including the `Authorization: Bearer <token>` header

**Issue**: "Invalid email format"
- **Solution**: Ensure the email follows the format: `user@domain.com`

**Issue**: "Email already exists"
- **Solution**: Try a different email address that doesn't exist in the database

**Issue**: "At least one field must be provided"
- **Solution**: Include either `name`, `email`, or both in the request body