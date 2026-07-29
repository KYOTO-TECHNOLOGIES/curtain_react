# Curtain Master API README

This project is a Django + DRF + JWT CRM backend.

Base URL examples below assume:

```text
http://localhost:8000/api/
```

## Auth Overview

- JWT access token is accepted from:
  - `Authorization: Bearer <token>`
  - `access_token` cookie
- Refresh token is accepted from:
  - request body field `refresh`
  - `refresh_token` cookie
- Login stores both JWT tokens in `HttpOnly` cookies
- Logout clears both cookies and blacklists the refresh token when present

## Default Admin User

Created during the first migration:

```text
email: admin@kyotosoftware.com
password: Abcd@123
```

## Auth Endpoints

### 1. Login

**Endpoint**

```text
POST /api/auth/login/
```

**Request**

```json
{
  "email": "admin@kyotosoftware.com",
  "password": "Abcd@123"
}
```

**Success Response**

```json
{
  "user": {
    "id": 1,
    "email": "admin@kyotosoftware.com",
    "full_name": "Curtain Master Admin",
    "role": {
      "id": 1,
      "name": "Administrator",
      "description": "Default system administrator role.",
      "is_active": true,
      "permissions": [],
      "created_at": "2026-07-18T10:30:00Z",
      "updated_at": "2026-07-18T10:30:00Z"
    },
    "is_active": true,
    "is_staff": true,
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  },
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

**Error Response**

```json
{
  "detail": "Invalid email or password."
}
```

### 2. Refresh Token

**Endpoint**

```text
POST /api/auth/refresh/
```

**Request**

```json
{
  "refresh": "<jwt_refresh_token>"
}
```

You can also call this without body if the `refresh_token` cookie exists.

**Success Response**

```json
{
  "access": "<new_jwt_access_token>",
  "refresh": "<same_jwt_refresh_token>",
  "user": {
    "id": 1,
    "email": "admin@kyotosoftware.com",
    "full_name": "Curtain Master Admin",
    "role": {
      "id": 1,
      "name": "Administrator",
      "description": "Default system administrator role.",
      "is_active": true,
      "permissions": [],
      "created_at": "2026-07-18T10:30:00Z",
      "updated_at": "2026-07-18T10:30:00Z"
    },
    "is_active": true,
    "is_staff": true,
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  }
}
```

**Missing Refresh Response**

```json
{
  "detail": "Refresh token is required."
}
```

**Invalid Refresh Response**

```json
{
  "detail": "Invalid or expired refresh token."
}
```

### 3. Logout

**Endpoint**

```text
POST /api/auth/logout/
```

**Request**

```json
{
  "refresh": "<jwt_refresh_token>"
}
```

You can also call this using only the `refresh_token` cookie.

**Success Response**

```json
{
  "detail": "Logged out successfully."
}
```

### 4. Current Logged-In User

**Endpoint**

```text
GET /api/auth/me/
```

**Headers**

```text
Authorization: Bearer <jwt_access_token>
```

**Success Response**

```json
{
  "id": 1,
  "email": "admin@kyotosoftware.com",
  "full_name": "Curtain Master Admin",
  "role": {
    "id": 1,
    "name": "Administrator",
    "description": "Default system administrator role.",
    "is_active": true,
    "permissions": [],
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  },
  "is_active": true,
  "is_staff": true,
  "created_at": "2026-07-18T10:30:00Z",
  "updated_at": "2026-07-18T10:30:00Z"
}
```

## User APIs

Users can be created only by admin.

### 5. List Users

**Endpoint**

```text
GET /api/users/
```

**Auth**

- Admin only

**Response**

```json
[
  {
    "id": 1,
    "email": "admin@kyotosoftware.com",
    "full_name": "Curtain Master Admin",
    "role": {
      "id": 1,
      "name": "Administrator",
      "description": "Default system administrator role.",
      "is_active": true,
      "permissions": [],
      "created_at": "2026-07-18T10:30:00Z",
      "updated_at": "2026-07-18T10:30:00Z"
    },
    "is_active": true,
    "is_staff": true,
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  }
]
```

### 6. Create User

**Endpoint**

```text
POST /api/users/
```

**Auth**

- Admin only

**Request**

```json
{
  "email": "manager@curtainmaster.com",
  "full_name": "Sales Manager",
  "password": "StrongPass123",
  "role_id": 1
}
```

**Success Response**

```json
{
  "id": 2,
  "email": "manager@curtainmaster.com",
  "full_name": "Sales Manager",
  "role": {
    "id": 1,
    "name": "Administrator",
    "description": "Default system administrator role.",
    "is_active": true,
    "permissions": [],
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  },
  "is_active": true,
  "is_staff": false,
  "created_at": "2026-07-18T10:45:00Z",
  "updated_at": "2026-07-18T10:45:00Z"
}
```

### 7. Get Single User

**Endpoint**

```text
GET /api/users/{id}/
```

**Auth**

- Admin can view any user
- Normal user can view only their own record

**Success Response**

```json
{
  "id": 2,
  "email": "manager@curtainmaster.com",
  "full_name": "Sales Manager",
  "role": {
    "id": 1,
    "name": "Administrator",
    "description": "Default system administrator role.",
    "is_active": true,
    "permissions": [],
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  },
  "is_active": true,
  "is_staff": false,
  "created_at": "2026-07-18T10:45:00Z",
  "updated_at": "2026-07-18T10:45:00Z"
}
```

### 8. Update User

**Endpoint**

```text
PATCH /api/users/{id}/
```

**Request**

```json
{
  "full_name": "Updated Sales Manager",
  "role_id": 1,
  "is_active": true
}
```

**Success Response**

```json
{
  "id": 2,
  "email": "manager@curtainmaster.com",
  "full_name": "Updated Sales Manager",
  "role": {
    "id": 1,
    "name": "Administrator",
    "description": "Default system administrator role.",
    "is_active": true,
    "permissions": [],
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  },
  "is_active": true,
  "is_staff": false,
  "created_at": "2026-07-18T10:45:00Z",
  "updated_at": "2026-07-18T10:50:00Z"
}
```

### 9. Delete User

**Endpoint**

```text
DELETE /api/users/{id}/
```

**Success Response**

```text
204 No Content
```

## Role APIs

### 10. List Roles

**Endpoint**

```text
GET /api/roles/
```

**Auth**

- Admin only

**Response**

```json
[
  {
    "id": 1,
    "name": "Administrator",
    "description": "Default system administrator role.",
    "is_active": true,
    "permissions": [],
    "created_at": "2026-07-18T10:30:00Z",
    "updated_at": "2026-07-18T10:30:00Z"
  }
]
```

### 11. Create Role

**Endpoint**

```text
POST /api/roles/
```

**Request**

```json
{
  "name": "Sales",
  "description": "Sales team role",
  "permission_ids": [1, 2]
}
```

**Success Response**

```json
{
  "id": 2,
  "name": "Sales",
  "description": "Sales team role",
  "is_active": true,
  "permissions": [
    {
      "id": 1,
      "name": "manage_customers",
      "description": "Can manage customers",
      "is_active": true,
      "created_at": "2026-07-18T11:00:00Z",
      "updated_at": "2026-07-18T11:00:00Z"
    },
    {
      "id": 2,
      "name": "view_reports",
      "description": "Can view reports",
      "is_active": true,
      "created_at": "2026-07-18T11:00:00Z",
      "updated_at": "2026-07-18T11:00:00Z"
    }
  ],
  "created_at": "2026-07-18T11:05:00Z",
  "updated_at": "2026-07-18T11:05:00Z"
}
```

### 12. Get Role

**Endpoint**

```text
GET /api/roles/{id}/
```

**Success Response**

```json
{
  "id": 2,
  "name": "Sales",
  "description": "Sales team role",
  "is_active": true,
  "permissions": [
    {
      "id": 1,
      "name": "manage_customers",
      "description": "Can manage customers",
      "is_active": true,
      "created_at": "2026-07-18T11:00:00Z",
      "updated_at": "2026-07-18T11:00:00Z"
    }
  ],
  "created_at": "2026-07-18T11:05:00Z",
  "updated_at": "2026-07-18T11:05:00Z"
}
```

### 13. Update Role

**Endpoint**

```text
PATCH /api/roles/{id}/
```

**Request**

```json
{
  "description": "Updated sales role",
  "permission_ids": [1]
}
```

**Success Response**

```json
{
  "id": 2,
  "name": "Sales",
  "description": "Updated sales role",
  "is_active": true,
  "permissions": [
    {
      "id": 1,
      "name": "manage_customers",
      "description": "Can manage customers",
      "is_active": true,
      "created_at": "2026-07-18T11:00:00Z",
      "updated_at": "2026-07-18T11:00:00Z"
    }
  ],
  "created_at": "2026-07-18T11:05:00Z",
  "updated_at": "2026-07-18T11:10:00Z"
}
```

### 14. Delete Role

**Endpoint**

```text
DELETE /api/roles/{id}/
```

**Success Response**

```text
204 No Content
```

## Permission APIs

### 15. List Permissions

**Endpoint**

```text
GET /api/permissions/
```

**Response**

```json
[
  {
    "id": 1,
    "name": "manage_customers",
    "description": "Can manage customers",
    "is_active": true,
    "created_at": "2026-07-18T11:00:00Z",
    "updated_at": "2026-07-18T11:00:00Z"
  }
]
```

### 16. Create Permission

**Endpoint**

```text
POST /api/permissions/
```

**Request**

```json
{
  "name": "manage_customers",
  "description": "Can manage customers"
}
```

**Success Response**

```json
{
  "id": 1,
  "name": "manage_customers",
  "description": "Can manage customers",
  "is_active": true,
  "created_at": "2026-07-18T11:00:00Z",
  "updated_at": "2026-07-18T11:00:00Z"
}
```

### 17. Get Permission

**Endpoint**

```text
GET /api/permissions/{id}/
```

**Success Response**

```json
{
  "id": 1,
  "name": "manage_customers",
  "description": "Can manage customers",
  "is_active": true,
  "created_at": "2026-07-18T11:00:00Z",
  "updated_at": "2026-07-18T11:00:00Z"
}
```

### 18. Update Permission

**Endpoint**

```text
PATCH /api/permissions/{id}/
```

**Request**

```json
{
  "description": "Updated permission description"
}
```

**Success Response**

```json
{
  "id": 1,
  "name": "manage_customers",
  "description": "Updated permission description",
  "is_active": true,
  "created_at": "2026-07-18T11:00:00Z",
  "updated_at": "2026-07-18T11:10:00Z"
}
```

### 19. Delete Permission

**Endpoint**

```text
DELETE /api/permissions/{id}/
```

**Success Response**

```text
204 No Content
```

## Customer APIs

Customers do not have login access. They are only CRM records.

### 20. List Customers

**Endpoint**

```text
GET /api/customers/
```

**Auth**

- Admin only

**Response**

```json
[
  {
    "id": 1,
    "first_name": "Ali",
    "last_name": "Khan",
    "full_name": "Ali Khan",
    "email": "ali@example.com",
    "phone_number": "+971500000000",
    "company_name": "Ali Curtains",
    "address_line_1": "Office 10",
    "address_line_2": "",
    "city": "Dubai",
    "state": "Dubai",
    "postal_code": "00000",
    "country": "UAE",
    "notes": "High priority customer",
    "is_active": true,
    "created_at": "2026-07-18T11:15:00Z",
    "updated_at": "2026-07-18T11:15:00Z"
  }
]
```

### 21. Create Customer

**Endpoint**

```text
POST /api/customers/
```

**Request**

```json
{
  "first_name": "Ali",
  "last_name": "Khan",
  "email": "ali@example.com",
  "phone_number": "+971500000000",
  "company_name": "Ali Curtains",
  "address_line_1": "Office 10",
  "address_line_2": "",
  "city": "Dubai",
  "state": "Dubai",
  "postal_code": "00000",
  "country": "UAE",
  "notes": "High priority customer",
  "is_active": true
}
```

**Success Response**

```json
{
  "id": 1,
  "first_name": "Ali",
  "last_name": "Khan",
  "full_name": "Ali Khan",
  "email": "ali@example.com",
  "phone_number": "+971500000000",
  "company_name": "Ali Curtains",
  "address_line_1": "Office 10",
  "address_line_2": "",
  "city": "Dubai",
  "state": "Dubai",
  "postal_code": "00000",
  "country": "UAE",
  "notes": "High priority customer",
  "is_active": true,
  "created_at": "2026-07-18T11:15:00Z",
  "updated_at": "2026-07-18T11:15:00Z"
}
```

### 22. Get Customer

**Endpoint**

```text
GET /api/customers/{id}/
```

**Success Response**

```json
{
  "id": 1,
  "first_name": "Ali",
  "last_name": "Khan",
  "full_name": "Ali Khan",
  "email": "ali@example.com",
  "phone_number": "+971500000000",
  "company_name": "Ali Curtains",
  "address_line_1": "Office 10",
  "address_line_2": "",
  "city": "Dubai",
  "state": "Dubai",
  "postal_code": "00000",
  "country": "UAE",
  "notes": "High priority customer",
  "is_active": true,
  "created_at": "2026-07-18T11:15:00Z",
  "updated_at": "2026-07-18T11:15:00Z"
}
```

### 23. Update Customer

**Endpoint**

```text
PATCH /api/customers/{id}/
```

**Request**

```json
{
  "phone_number": "+971511111111",
  "notes": "Updated note"
}
```

**Success Response**

```json
{
  "id": 1,
  "first_name": "Ali",
  "last_name": "Khan",
  "full_name": "Ali Khan",
  "email": "ali@example.com",
  "phone_number": "+971511111111",
  "company_name": "Ali Curtains",
  "address_line_1": "Office 10",
  "address_line_2": "",
  "city": "Dubai",
  "state": "Dubai",
  "postal_code": "00000",
  "country": "UAE",
  "notes": "Updated note",
  "is_active": true,
  "created_at": "2026-07-18T11:15:00Z",
  "updated_at": "2026-07-18T11:20:00Z"
}
```

### 24. Delete Customer

**Endpoint**

```text
DELETE /api/customers/{id}/
```

**Success Response**

```text
204 No Content
```

## Common Status Codes

- `200 OK`
- `201 Created`
- `204 No Content`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

## Notes

- There is no public user registration endpoint.
- User creation is admin-only.
- Customers are CRM records only and cannot log in.
- Role and permission assignment currently exists at the data level; custom per-endpoint role-permission enforcement can be added later.


auth/change-password/


api for passwror change

request{old_password and new_password}

# Customers & Appointments API

## Base URL

`http://localhost:8111/api/`

## Authentication

All API endpoints except login, refresh, and logout require authentication.

### Headers

`Authorization: Bearer <access_token>`

If cookie-based auth is enabled, the following cookies may be used:

- `access_token` - JWT access token (HTTP-only cookie)
- `refresh_token` - JWT refresh token (HTTP-only cookie)

---

## 1. Authentication Endpoints

### 1.1 Login

- Endpoint: `POST /api/auth/login/`
- Request body:

```json
{
  "email": "admin@example.com",
  "password": "adminpass123"
}
```

- Response:

```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": {
      "id": 1,
      "name": "Admin",
      "description": "Administrator role with full permissions"
    },
    "role_name": "Admin",
    "is_active": true,
    "is_staff": true,
    "is_superuser": true,
    "created_at": "2024-07-22T10:00:00Z",
    "updated_at": "2024-07-22T10:00:00Z"
  },
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 1.2 Refresh Token

- Endpoint: `POST /api/auth/refresh/`
- Request body:

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

- Response:

```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin User"
  }
}
```

### 1.3 Logout

- Endpoint: `POST /api/auth/logout/`
- Request body:

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

- Response:

```json
{
  "detail": "Logged out successfully."
}
```

### 1.4 Get Current User

- Endpoint: `GET /api/auth/me/`
- Response:

```json
{
  "id": 1,
  "email": "admin@example.com",
  "full_name": "Admin User",
  "role": {
    "id": 1,
    "name": "Admin",
    "description": "Administrator role with full permissions"
  },
  "role_name": "Admin",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true
}
```

### 1.5 Change Password

- Endpoint: `POST /api/auth/change-password/`
- Request body:

```json
{
  "old_password": "oldpass123",
  "new_password": "newpass123"
}
```

- Response:

```json
{
  "detail": "Password changed successfully."
}
```

---

## 2. Customers API

### 2.1 List Customers

- Endpoint: `GET /api/customers/`
- Query parameters:
  - `search` (string): Search by first name, last name, phone, or email.

Example:

```http
GET /api/customers/?search=John
```

Response:

```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+971501234567",
    "email": "john.doe@example.com",
    "address_line_1": "123 Main St",
    "address_line_2": "Apt 4B",
    "city": "Dubai",
    "state": "Dubai",
    "postal_code": "12345",
    "country": "UAE",
    "company_name": "",
    "notes": "Test customer",
    "created_by": 1,
    "created_at": "2024-07-22T10:00:00Z",
    "updated_at": "2024-07-22T10:00:00Z"
  }
]
```

### 2.2 Create Customer

- Endpoint: `POST /api/customers/`
- Request body:

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+9715087654321",
  "email": "jane.smith@example.com",
  "address_line_1": "456 Park Ave",
  "address_line_2": "Suite 100",
  "city": "Abu Dhabi",
  "state": "Abu Dhabi",
  "postal_code": "54321",
  "country": "UAE",
  "company_name": "Smith Interiors",
  "notes": "Preferred client"
}
```

- Response (201 Created):

```json
{
  "id": 2,
  "first_name": "Jane",
  "last_name": "Smith",
  "full_name": "Jane Smith",
  "phone": "+9715087654321",
  "email": "jane.smith@example.com",
  "address_line_1": "456 Park Ave",
  "address_line_2": "Suite 100",
  "city": "Abu Dhabi",
  "state": "Abu Dhabi",
  "postal_code": "54321",
  "country": "UAE",
  "company_name": "Smith Interiors",
  "notes": "Preferred client",
  "created_by": 1,
  "created_at": "2024-07-22T10:05:00Z",
  "updated_at": "2024-07-22T10:05:00Z"
}
```

- Error response (duplicate phone/email):

```json
{
  "phone": ["A customer with this phone already exists."]
}
```

### 2.3 Get Customer

- Endpoint: `GET /api/customers/{id}/`

Example:

```http
GET /api/customers/1/
```

Response:

```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "phone": "+971501234567",
  "email": "john.doe@example.com",
  "address_line_1": "123 Main St",
  "address_line_2": "Apt 4B",
  "city": "Dubai",
  "state": "Dubai",
  "postal_code": "12345",
  "country": "UAE",
  "company_name": "",
  "notes": "Test customer",
  "created_by": 1,
  "created_at": "2024-07-22T10:00:00Z",
  "updated_at": "2024-07-22T10:00:00Z"
}
```

### 2.4 Update Customer

- Endpoint: `PUT /api/customers/{id}/` (full update)
- Endpoint: `PATCH /api/customers/{id}/` (partial update)

Example PATCH request:

```json
{
  "first_name": "Jonathan",
  "phone": "+9715098765432"
}
```

Example response:

```json
{
  "id": 1,
  "first_name": "Jonathan",
  "last_name": "Doe",
  "full_name": "Jonathan Doe",
  "phone": "+9715098765432",
  "email": "john.doe@example.com",
  "address_line_1": "123 Main St",
  "address_line_2": "Apt 4B",
  "city": "Dubai",
  "state": "Dubai",
  "postal_code": "12345",
  "country": "UAE",
  "company_name": "",
  "notes": "Test customer",
  "created_by": 1,
  "created_at": "2024-07-22T10:00:00Z",
  "updated_at": "2024-07-22T10:10:00Z"
}
```

### 2.5 Delete Customer

- Endpoint: `DELETE /api/customers/{id}/`
- Response: `204 No Content`

### 2.6 Lookup Customer

- Endpoint: `GET /api/customers/lookup/`
- Query parameters:
  - `phone` (string)
  - `email` (string)

Examples:

```http
GET /api/customers/lookup/?phone=+971501234567
GET /api/customers/lookup/?email=john.doe@example.com
```

Response (found):

```json
{
  "found": true,
  "customer": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+971501234567",
    "email": "john.doe@example.com"
  }
}
```

Response (not found):

```json
{
  "found": false,
  "message": "Customer not found."
}
```

### 2.7 Create or Get Customer

- Endpoint: `POST /api/customers/create-or-get/`
- Request body includes at least one of `phone` or `email`.

Example request:

```json
{
  "first_name": "Sara",
  "last_name": "Ali",
  "phone": "+971501112233",
  "email": "sara.ali@example.com"
}
```

Response if customer exists:

```json
{
  "created": false,
  "customer": {
    "id": 5,
    "first_name": "Sara",
    "last_name": "Ali",
    "full_name": "Sara Ali",
    "phone": "+971501112233",
    "email": "sara.ali@example.com",
    "address_line_1": "",
    "address_line_2": "",
    "city": "",
    "state": "",
    "postal_code": "",
    "country": "",
    "company_name": "",
    "notes": "",
    "created_by": 1,
    "created_at": "2024-07-22T10:15:00Z",
    "updated_at": "2024-07-22T10:15:00Z"
  }
}
```

Response if created:

```json
{
  "created": true,
  "customer": {
    "id": 6,
    "first_name": "Sara",
    "last_name": "Ali",
    "full_name": "Sara Ali",
    "phone": "+971501112233",
    "email": "sara.ali@example.com",
    "address_line_1": "",
    "address_line_2": "",
    "city": "",
    "state": "",
    "postal_code": "",
    "country": "",
    "company_name": "",
    "notes": "",
    "created_by": 1,
    "created_at": "2024-07-22T10:16:00Z",
    "updated_at": "2024-07-22T10:16:00Z"
  }
}
```

---

## 3. Appointments API

### 3.1 List Appointments

- Endpoint: `GET /api/appointments/`
- Query parameters:
  - `status` (string)
  - `assigned_to` (integer)
  - `date_from` (YYYY-MM-DD)
  - `date_to` (YYYY-MM-DD)
  - `customer` (integer customer ID)

Example:

```http
GET /api/appointments/?status=pending&customer=1
```

Response:

```json
[
  {
    "id": 1,
    "customer": 1,
    "customer_name": "John Doe",
    "customer_phone": "+971501234567",
    "title": "Window installation",
    "description": "Install curtain tracks and blinds.",
    "appointment_date": "2026-07-22",
    "appointment_time": "09:00:00",
    "end_time": "11:00:00",
    "job_type": "installation",
    "status": "scheduled",
    "assigned_to": 3,
    "assigned_to_name": "Sales Rep",
    "assigned_to_username": "sales@example.com",
    "location_full_address": "123 Main St, Dubai",
    "created_at": "2026-07-20T14:00:00Z",
    "updated_at": "2026-07-20T14:00:00Z"
  }
]
```

### 3.2 Create Appointment

- Endpoint: `POST /api/appointments/`
- Required fields are determined by the serializer.
- Customer may be created by passing `customer_first_name`, `customer_last_name`, `customer_phone`, and/or `customer_email`.

Example request with existing customer:

```json
{
  "customer": 1,
  "title": "Window installation",
  "description": "Install curtain tracks and blinds.",
  "appointment_date": "2026-07-22",
  "appointment_time": "09:00:00",
  "end_time": "11:00:00",
  "job_type": "installation",
  "status": "scheduled",
  "assigned_to": 3,
  "location_building": "Tower A",
  "location_unit": "402",
  "location_full_address": "123 Main St, Dubai",
  "location_coordinates": {"lat": 25.2048, "lng": 55.2708},
  "location_instructions": "Use rear entrance"
}
```

Example request creating a new customer:

```json
{
  "customer_first_name": "Ahmed",
  "customer_last_name": "Mohammed",
  "customer_phone": "+9715098765432",
  "customer_email": "ahmed@example.com",
  "customer_address": "Business Bay",
  "customer_city": "Dubai",
  "customer_source": "website",
  "title": "Curtain repair",
  "description": "Repair curtain motor",
  "appointment_date": "2026-07-22",
  "appointment_time": "13:00:00",
  "end_time": "14:00:00",
  "job_type": "repair",
  "status": "pending",
  "assigned_to": 4,
  "location_building": "Building 5",
  "location_unit": "12",
  "location_full_address": "Business Bay, Dubai",
  "location_coordinates": {"lat": 25.1950, "lng": 55.2760},
  "location_instructions": "Call on arrival"
}
```

- Response (201 Created):

```json
{
  "id": 10,
  "customer": 2,
  "title": "Curtain repair",
  "description": "Repair curtain motor",
  "appointment_date": "2026-07-22",
  "appointment_time": "13:00:00",
  "end_time": "14:00:00",
  "job_type": "repair",
  "status": "pending",
  "assigned_to": 4,
  "location": 5,
  "created_at": "2026-07-20T15:00:00Z",
  "updated_at": "2026-07-20T15:00:00Z"
}
```

### 3.3 Get Appointment

- Endpoint: `GET /api/appointments/{id}/`

Example response:

```json
{
  "id": 10,
  "customer": {
    "id": 2,
    "first_name": "Ahmed",
    "last_name": "Mohammed",
    "full_name": "Ahmed Mohammed",
    "phone": "+9715098765432",
    "email": "ahmed@example.com",
    "address_line_1": "Business Bay",
    "address_line_2": "",
    "city": "Dubai",
    "state": "",
    "postal_code": "",
    "country": "UAE",
    "company_name": "",
    "notes": "",
    "created_by": 1,
    "created_at": "2026-07-20T15:00:00Z",
    "updated_at": "2026-07-20T15:00:00Z"
  },
  "title": "Curtain repair",
  "description": "Repair curtain motor",
  "appointment_date": "2026-07-22",
  "appointment_time": "13:00:00",
  "end_time": "14:00:00",
  "job_type": "repair",
  "status": "pending",
  "assigned_to": 4,
  "assigned_to_name": "Sales Rep",
  "assigned_to_username": "sales@example.com",
  "created_by": 1,
  "created_by_name": "Admin User",
  "created_by_username": "admin@example.com",
  "created_at": "2026-07-20T15:00:00Z",
  "updated_at": "2026-07-20T15:00:00Z",
  "cancellation_reason": "",
  "cancelled_at": null,
  "cancelled_by": null,
  "cancelled_by_name": null,
  "location": {
    "id": 5,
    "building_name": "Building 5",
    "unit_number": "12",
    "full_address": "Business Bay, Dubai",
    "coordinates": {"lat": 25.1950, "lng": 55.2760},
    "additional_instructions": "Call on arrival",
    "location_status": "not_set"
  }
}
```

### 3.4 Update Appointment

- Endpoint: `PUT /api/appointments/{id}/` (full update)
- Endpoint: `PATCH /api/appointments/{id}/` (partial update)

Request body can include any appointment fields and optional customer/location creation fields.

Example PATCH request:

```json
{
  "title": "Curtain motor replacement",
  "status": "scheduled",
  "location_full_address": "Mall area, Dubai"
}
```

- Response:

```json
{
  "id": 10,
  "customer": 2,
  "title": "Curtain motor replacement",
  "description": "Repair curtain motor",
  "appointment_date": "2026-07-22",
  "appointment_time": "13:00:00",
  "end_time": "14:00:00",
  "job_type": "repair",
  "status": "scheduled",
  "assigned_to": 4,
  "location": 5,
  "created_at": "2026-07-20T15:00:00Z",
  "updated_at": "2026-07-20T15:10:00Z"
}
```

### 3.5 Cancel/Delete Appointment

- Endpoint: `DELETE /api/appointments/{id}/`
- Response:

```json
{
  "message": "Appointment 10 has been cancelled.",
  "appointment": {
    "id": 10,
    "customer": {
      "id": 2,
      "first_name": "Ahmed",
      "last_name": "Mohammed",
      "full_name": "Ahmed Mohammed",
      "phone": "+9715098765432",
      "email": "ahmed@example.com",
      "address_line_1": "Business Bay",
      "address_line_2": "",
      "city": "Dubai",
      "state": "",
      "postal_code": "",
      "country": "UAE",
      "company_name": "",
      "notes": "",
      "created_by": 1,
      "created_at": "2026-07-20T15:00:00Z",
      "updated_at": "2026-07-20T15:10:00Z"
    },
    "title": "Curtain motor replacement",
    "description": "Repair curtain motor",
    "appointment_date": "2026-07-22",
    "appointment_time": "13:00:00",
    "end_time": "14:00:00",
    "job_type": "repair",
    "status": "cancelled",
    "assigned_to": 4,
    "assigned_to_name": "Sales Rep",
    "assigned_to_username": "sales@example.com",
    "created_by": 1,
    "created_by_name": "Admin User",
    "created_by_username": "admin@example.com",
    "created_at": "2026-07-20T15:00:00Z",
    "updated_at": "2026-07-20T15:15:00Z",
    "cancellation_reason": "Deleted by user",
    "cancelled_at": "2026-07-20T15:15:00Z",
    "cancelled_by": 1,
    "cancelled_by_name": "Admin User",
    "location": {
      "id": 5,
      "building_name": "Building 5",
      "unit_number": "12",
      "full_address": "Business Bay, Dubai",
      "coordinates": {"lat": 25.1950, "lng": 55.2760},
      "additional_instructions": "Call on arrival",
      "location_status": "not_set"
    }
  }
}
```

### 3.6 Update Appointment Status

- Endpoint: `PATCH /api/appointments/{id}/status/`
- Request body:

```json
{
  "status": "cancelled",
  "cancellation_reason": "Customer requested cancellation"
}
```

- Response:

```json
{
  "id": 10,
  "customer": {
    "id": 2,
    "first_name": "Ahmed",
    "last_name": "Mohammed",
    "full_name": "Ahmed Mohammed",
    "phone": "+9715098765432",
    "email": "ahmed@example.com"
  },
  "title": "Curtain motor replacement",
  "description": "Repair curtain motor",
  "appointment_date": "2026-07-22",
  "appointment_time": "13:00:00",
  "end_time": "14:00:00",
  "job_type": "repair",
  "status": "cancelled",
  "assigned_to": 4,
  "assigned_to_name": "Sales Rep",
  "assigned_to_username": "sales@example.com",
  "created_by": 1,
  "created_by_name": "Admin User",
  "created_by_username": "admin@example.com",
  "created_at": "2026-07-20T15:00:00Z",
  "updated_at": "2026-07-20T15:15:00Z",
  "cancellation_reason": "Customer requested cancellation",
  "cancelled_at": "2026-07-20T15:15:00Z",
  "cancelled_by": 1,
  "cancelled_by_name": "Admin User",
  "location": {
    "id": 5,
    "building_name": "Building 5",
    "unit_number": "12",
    "full_address": "Business Bay, Dubai",
    "coordinates": {"lat": 25.1950, "lng": 55.2760},
    "additional_instructions": "Call on arrival",
    "location_status": "not_set"
  }
}
```

### 3.7 Assign Salesman

- Endpoint: `PATCH /api/appointments/{id}/assign/`
- Request body:

```json
{
  "assigned_to": 4
}
```

- Response:

```json
{
  "id": 10,
  "customer": {
    "id": 2,
    "first_name": "Ahmed",
    "last_name": "Mohammed",
    "full_name": "Ahmed Mohammed",
    "phone": "+9715098765432",
    "email": "ahmed@example.com"
  },
  "title": "Curtain motor replacement",
  "description": "Repair curtain motor",
  "appointment_date": "2026-07-22",
  "appointment_time": "13:00:00",
  "end_time": "14:00:00",
  "job_type": "repair",
  "status": "cancelled",
  "assigned_to": 4,
  "assigned_to_name": "Sales Rep",
  "assigned_to_username": "sales@example.com",
  "created_by": 1,
  "created_by_name": "Admin User",
  "created_by_username": "admin@example.com",
  "created_at": "2026-07-20T15:00:00Z",
  "updated_at": "2026-07-20T15:15:00Z",
  "cancellation_reason": "Deleted by user",
  "cancelled_at": "2026-07-20T15:15:00Z",
  "cancelled_by": 1,
  "cancelled_by_name": "Admin User",
  "location": {
    "id": 5,
    "building_name": "Building 5",
    "unit_number": "12",
    "full_address": "Business Bay, Dubai",
    "coordinates": {"lat": 25.1950, "lng": 55.2760},
    "additional_instructions": "Call on arrival",
    "location_status": "not_set"
  }
}
```

### 3.8 My Appointments

- Endpoint: `GET /api/appointments/my/`
- Returns appointments assigned to the current user.

### 3.9 Appointment Stats

- Endpoint: `GET /api/appointments/stats/`
- Response:

```json
{
  "total": 5,
  "by_status": {
    "scheduled": 2,
    "pending": 1,
    "cancelled": 1,
    "rescheduled": 1
  },
  "today": 1,
  "upcoming": 3
}
```

### 3.10 Reschedule Appointment

- Endpoint: `POST /api/appointments/{id}/reschedule/`
- Request body:

```json
{
  "appointment_date": "2026-07-25",
  "appointment_time": "15:00:00",
  "end_time": "16:00:00"
}
```

- Response: updated appointment detail object.

---

## 4. Notes

- Customer phone and email are unique within the system.
- Appointments can be filtered by `status`, `assigned_to`, `date_from`, `date_to`, and `customer`.
- Appointment deletion marks the record as cancelled rather than permanently removing it.
- Use `create-or-get` to avoid duplicate customers when a phone or email already exists.


This endpoint either creates a new customer or returns an existing one based on phone/email.

Request Body:

json
{
  "phone": "+971501234567",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "address_line_1": "123 Main St",
  "city": "Dubai",
  "country": "UAE"
}
Response (Existing):

json
{
  "created": false,
  "customer": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+971501234567",
    "email": "john.doe@example.com"
  }
}
Response (New):

json
{
  "created": true,
  "customer": {
    "id": 3,
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+971501234567",
    "email": "john.doe@example.com"
  }
}
3. Appointments API
3.1 List Appointments
Endpoint: GET /api/appointments/

Query Parameters:

Parameter	Type	Description
status	string	Filter by status
assigned_to	integer	Filter by assigned user ID
date_from	date	Filter appointments from this date
date_to	date	Filter appointments up to this date
customer	integer	Filter by customer ID
Status Values:

pending

scheduled

in_progress

completed

cancelled

rescheduled

Job Types:

measurement

installation

consultation

repair

Examples:

text
GET /api/appointments/?status=scheduled
GET /api/appointments/?assigned_to=2
GET /api/appointments/?date_from=2024-07-01&date_to=2024-07-31
Response:

json
[
  {
    "id": "APT-1001",
    "customer": 1,
    "customer_name": "Fatima Al Hashimi",
    "customer_phone": "+971501234567",
    "title": "Window Measurement",
    "description": "Client needs measurements for blackout curtains",
    "appointment_date": "2024-07-25",
    "appointment_time": "09:30:00",
    "end_time": "10:30:00",
    "job_type": "measurement",
    "status": "scheduled",
    "assigned_to": 2,
    "assigned_to_name": "James Doe",
    "assigned_to_username": "salesman@example.com",
    "location_full_address": "Al Marsa St, Dubai Marina",
    "created_at": "2024-07-22T10:00:00Z",
    "updated_at": "2024-07-22T10:00:00Z"
  }
]
3.2 Create Appointment
Endpoint: POST /api/appointments/

This endpoint automatically handles customer creation/lookup.

Request Body:

json
{
  "customer_first_name": "Ahmed",
  "customer_last_name": "Mohammed",
  "customer_phone": "+9715098765432",
  "customer_email": "ahmed.m@example.com",
  "customer_address": "Business Bay",
  "customer_city": "Dubai",
  "customer_source": "website",
  
  "title": "Installation Consultation",
  "description": "Client needs consultation for new curtains",
  "appointment_date": "2024-07-26",
  "appointment_time": "14:00:00",
  "end_time": "15:00:00",
  "job_type": "consultation",
  "status": "pending",
  "assigned_to": 2,
  
  "location_building": "Business Bay Tower",
  "location_unit": "Office 1001",
  "location_full_address": "Business Bay, Dubai",
  "location_coordinates": {"lat": 25.1900, "lng": 55.2700},
  "location_instructions": "Parking available in basement"
}
Response (201 Created):

json
{
  "id": "APT-1002",
  "customer": {
    "id": 2,
    "first_name": "Ahmed",
    "last_name": "Mohammed",
    "full_name": "Ahmed Mohammed",
    "phone": "+9715098765432",
    "email": "ahmed.m@example.com",
    "address_line_1": "Business Bay",
    "city": "Dubai",
    "country": "UAE"
  },
  "title": "Installation Consultation",
  "description": "Client needs consultation for new curtains",
  "appointment_date": "2024-07-26",
  "appointment_time": "14:00:00",
  "end_time": "15:00:00",
  "job_type": "consultation",
  "status": "pending",
  "assigned_to": 2,
  "assigned_to_name": "James Doe",
  "assigned_to_username": "salesman@example.com",
  "created_by": 1,
  "created_by_name": "Admin User",
  "created_by_username": "admin@example.com",
  "created_at": "2024-07-22T10:05:00Z",
  "updated_at": "2024-07-22T10:05:00Z",
  "cancellation_reason": "",
  "cancelled_at": null,
  "cancelled_by": null,
  "cancelled_by_name": null,
  "location": {
    "id": 1,
    "building_name": "Business Bay Tower",
    "unit_number": "Office 1001",
    "full_address": "Business Bay, Dubai",
    "coordinates": {"lat": 25.1900, "lng": 55.2700},
    "additional_instructions": "Parking available in basement",
    "location_status": "not_set"
  }
}
Creating with Existing Customer:

json
{
  "customer_phone": "+971501234567",
  "customer_first_name": "Fatima",
  "customer_last_name": "Al Hashimi",
  "title": "Follow-up Measurement",
  "appointment_date": "2024-07-27",
  "appointment_time": "11:00:00",
  "job_type": "measurement",
  "location_full_address": "Al Marsa St, Dubai Marina"
}
3.3 Get Appointment Details
Endpoint: GET /api/appointments/{id}/

Example:

text
GET /api/appointments/APT-1001/
Response:

json
{
  "id": "APT-1001",
  "customer": {
    "id": 1,
    "first_name": "Fatima",
    "last_name": "Al Hashimi",
    "full_name": "Fatima Al Hashimi",
    "phone": "+971501234567",
    "email": "fatima.h@example.com",
    "address_line_1": "Al Marsa St",
    "city": "Dubai",
    "country": "UAE"
  },
  "title": "Window Measurement",
  "description": "Client needs measurements for blackout curtains",
  "appointment_date": "2024-07-25",
  "appointment_time": "09:30:00",
  "end_time": "10:30:00",
  "job_type": "measurement",
  "status": "scheduled",
  "assigned_to": 2,
  "assigned_to_name": "James Doe",
  "assigned_to_username": "salesman@example.com",
  "created_by": 1,
  "created_by_name": "Admin User",
  "created_by_username": "admin@example.com",
  "created_at": "2024-07-22T10:00:00Z",
  "updated_at": "2024-07-22T10:00:00Z",
  "cancellation_reason": "",
  "cancelled_at": null,
  "cancelled_by": null,
  "cancelled_by_name": null,
  "location": {
    "id": 1,
    "building_name": "Marina Heights",
    "unit_number": "Flat 1204",
    "full_address": "Al Marsa St, Dubai Marina",
    "coordinates": {"lat": 25.0805, "lng": 55.1403},
    "additional_instructions": "",
    "location_status": "not_set"
  }
}
3.4 Update Appointment
Endpoint: PATCH /api/appointments/{id}/

Request Body:

json
{
  "title": "Updated Measurement",
  "description": "Updated description",
  "job_type": "installation",
  "appointment_date": "2024-07-28",
  "appointment_time": "15:00:00",
  "end_time": "16:00:00",
  "location_building": "New Building",
  "location_unit": "New Unit",
  "location_full_address": "New Address"
}
Response: Updated appointment details (same structure as GET)

3.5 Update Appointment Status
Endpoint: PATCH /api/appointments/{id}/status/

Request Body:

json
{
  "status": "in_progress"
}
Or for cancellation:

json
{
  "status": "cancelled",
  "cancellation_reason": "Client requested reschedule"
}
Status Flow:

text
pending → scheduled → in_progress → completed
                     ↘ cancelled
                     ↘ rescheduled
Response: Updated appointment details

3.6 Assign Salesman
Endpoint: PATCH /api/appointments/{id}/assign/

Request Body:

json
{
  "assigned_to": 3
}
Response: Updated appointment details

3.7 Reschedule Appointment
Endpoint: POST /api/appointments/{id}/reschedule/

Request Body:

json
{
  "appointment_date": "2024-07-30",
  "appointment_time": "10:00:00",
  "end_time": "11:00:00"
}
Response: Updated appointment details with status set to "rescheduled"

3.8 Get My Appointments (For Salesmen)
Endpoint: GET /api/appointments/my/

Query Parameters:

Parameter	Type	Description
status	string	Filter by status
Example:

text
GET /api/appointments/my/?status=in_progress
Response:

json
[
  {
    "id": "APT-1001",
    "customer": 1,
    "customer_name": "Fatima Al Hashimi",
    "customer_phone": "+971501234567",
    "title": "Window Measurement",
    "appointment_date": "2024-07-25",
    "appointment_time": "09:30:00",
    "job_type": "measurement",
    "status": "in_progress",
    "location_full_address": "Al Marsa St, Dubai Marina"
  }
]
3.9 Get Appointment Statistics
Endpoint: GET /api/appointments/stats/

Response:

json
{
  "total": 24,
  "by_status": {
    "scheduled": 18,
    "in_progress": 3,
    "completed": 2,
    "cancelled": 1
  },
  "today": 5,
  "upcoming": 21
}
3.10 Delete/Cancel Appointment
Endpoint: DELETE /api/appointments/{id}/

This performs a soft delete - the appointment status is set to "cancelled".

Response:

json
{
  "message": "Appointment APT-1001 has been cancelled.",
  "appointment": {
    "id": "APT-1001",
    "status": "cancelled",
    "cancellation_reason": "Deleted by user",
    // ... rest of appointment data
  }
}
4. Error Responses
4.1 Validation Error (400 Bad Request)
json
{
  "end_time": ["End time must be after start time."]
}
4.2 Authentication Error (401 Unauthorized)
json
{
  "detail": "Authentication credentials were not provided."
}
4.3 Permission Error (403 Forbidden)
json
{
  "error": "You can only update status for appointments assigned to you."
}
4.4 Not Found (404 Not Found)
json
{
  "detail": "Not found."
}
5. Status Codes Summary
Status Code	Description
200	Success (GET, PUT, PATCH)
201	Created (POST)
204	No Content (DELETE)
400	Bad Request (Validation error)
401	Unauthorized (Authentication required)
403	Forbidden (Permission denied)
404	Not Found
409	Conflict (Duplicate customer)
6. User Roles & Permissions
Role	Permissions
Admin	Full access to all endpoints
Salesman	Can view/update appointments assigned to them, view customers
Receptionist	Can create appointments, view customers
Accountant	Can view financial data
Production Manager	Can manage production
7. Test Credentials
json
{
  "admin": {
    "email": "admin@example.com",
    "password": "adminpass123"
  },
  "salesman": {
    "email": "salesman@example.com",
    "password": "salesmanpass123"
  },
  "receptionist": {
    "email": "receptionist@example.com",
    "password": "receptionpass123"
  }
}
8. Quick Reference - curl Examples
Login
bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "adminpass123"}'
List Customers
bash
curl -X GET http://localhost:8000/api/customers/ \
  -H "Authorization: Bearer YOUR_TOKEN"
Create Appointment
bash
curl -X POST http://localhost:8000/api/appointments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_first_name": "Test",
    "customer_last_name": "User",
    "customer_phone": "+971501234568",
    "title": "Test Appointment",
    "appointment_date": "2024-07-25",
    "appointment_time": "10:00:00",
    "job_type": "measurement",
    "location_full_address": "Test Address"
  }'
Update Status
bash
curl -X PATCH http://localhost:8000/api/appointments/APT-1001/status/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
Get My Appointments
bash
curl -X GET http://localhost:8000/api/appointments/my/ \
  -H "Authorization: Bearer YOUR_TOKEN"
9. Frontend Integration Tips
9.1 Managing Tokens
Store tokens securely (preferably in HTTP-only cookies). If using localStorage:

javascript
// Store tokens
localStorage.setItem('access_token', response.access);
localStorage.setItem('refresh_token', response.refresh);

// Use in requests
const token = localStorage.getItem('access_token');
fetch('/api/customers/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
9.2 Error Handling
javascript
try {
  const response = await fetch('/api/appointments/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired - refresh or redirect to login
    await refreshToken();
  } else if (response.status === 403) {
    // Permission denied
    showError('You don\'t have permission to perform this action');
  } else if (response.status === 400) {
    const errors = await response.json();
    // Handle validation errors
    Object.keys(errors).forEach(field => {
      showFieldError(field, errors[field][0]);
    });
  }
} catch (error) {
  console.error('API Error:', error);
}
9.3 Auto-refresh Token
javascript
async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  const response = await fetch('/api/auth/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } else {
    // Redirect to login
    window.location.href = '/login';
  }
}
10. Changelog
Version	Date	Changes
1.0.0	2024-07-22	Initial API release
Customers CRUD with duplicate prevention
Appointments with status management
Location support for appointments
Role-based permissions
For questions or support, contact the development team.

# Catalog and Activities API Reference

This document describes the REST API endpoints for the catalog and activities apps in the Curtain Master project.

## Base URLs

- Catalog API: `/api/catalog/`
- Activities API: `/api/activities/`

## Authentication

- Catalog endpoints use `IsAuthenticatedOrReadOnly`.
  - `GET` requests are allowed without authentication.
  - `POST`, `PUT`, `PATCH`, and `DELETE` require an authenticated user.
- Activities endpoints are read-only (`GET` only) and use `IsAuthenticatedOrReadOnly`.

---

## 1) Catalog API

### 1.1 Work Types

Base path: `/api/catalog/work-types/`

#### List work types
- Method: `GET`
- Description: Returns all work types.

Example request
```http
GET /api/catalog/work-types/
```

Example response
```json
[
  {
    "id": 1,
    "name": "Roller",
    "pricing_unit": "m2",
    "features": {
      "motor": true,
      "charges": true,
      "images": true
    }
  }
]
```

#### Create a work type
- Method: `POST`
- Required fields: `name`

Example request body
```json
{
  "name": "Roman",
  "pricing_unit": "m2",
  "features": {
    "motor": false,
    "charges": true
  }
}
```

Example response
```json
{
  "id": 2,
  "name": "Roman",
  "pricing_unit": "m2",
  "features": {
    "motor": false,
    "charges": true
  }
}
```

### 1.2 Fabric Types

Base path: `/api/catalog/fabric-types/`

#### List fabric types
- Method: `GET`

Example response
```json
[
  {
    "id": 1,
    "work_type": 1,
    "work_type_name": "Roller",
    "name": "Blackout"
  }
]
```

### 1.3 Models

Base path: `/api/catalog/models/`

#### List models
- Method: `GET`

Example response
```json
[
  {
    "id": 1,
    "fabric_type": 1,
    "fabric_type_name": "Blackout",
    "name": "Classic"
  }
]
```

### 1.4 Catalog Items

Base path: `/api/catalog/items/`

#### List catalog items
- Method: `GET`

Example response
```json
[
  {
    "id": 1,
    "model": 1,
    "model_name": "Classic",
    "name": "Premium Shade",
    "price_per_unit": "150.00",
    "image": null
  }
]
```

#### Create a catalog item
- Method: `POST`
- Required fields: `model`, `name`, `price_per_unit`

Example request body
```json
{
  "model": 1,
  "name": "Premium Shade",
  "price_per_unit": "150.00"
}
```

### 1.5 Motor Types

Base path: `/api/catalog/motors/`

#### List motor types
- Method: `GET`

Example response
```json
[
  {
    "id": 1,
    "name": "Tubular",
    "price_per_m2": "120.00"
  }
]
```

### 1.6 Charge Templates

Base path: `/api/catalog/charges/`

#### List charge templates
- Method: `GET`

Example response
```json
[
  {
    "id": 1,
    "name": "Manual Control",
    "price": "50.00",
    "unit": "flat"
  }
]
```

---

## 2) Activities API

### 2.1 Activity Logs

Base path: `/api/activities/activity-logs/`

#### List activity logs
- Method: `GET`
- Description: Returns recent activity log entries.

Example request
```http
GET /api/activities/activity-logs/
```

Example response
```json
[
  {
    "id": 1,
    "action": "created",
    "details": {
      "source": "test"
    },
    "content_type": 16,
    "object_id": 3,
    "target_type": "worktype",
    "target_id": 3,
    "user": 1,
    "user_email": "activity@example.com",
    "created_at": "2026-07-27T10:00:00Z"
  }
]
```

#### Filter by target model
- Method: `GET`
- Query parameter: `content_type`

Example request
```http
GET /api/activities/activity-logs/?content_type=worktype
```

---

## 3) Common Response Notes

- Successful `GET` requests return `200 OK`.
- Successful `POST`/`PUT`/`PATCH` requests return `200 OK` or `201 Created` depending on the action.
- Invalid input returns `400 Bad Request`.
- Unauthorized write requests return `401 Unauthorized` or `403 Forbidden`.

---

## 4) Example Curl Commands

### Catalog list
```bash
curl http://localhost:8000/api/catalog/work-types/
```

### Create catalog item
```bash
curl -X POST http://localhost:8000/api/catalog/items/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"model": 1, "name": "Premium Shade", "price_per_unit": "150.00"}'
```

### Activities list
```bash
curl http://localhost:8000/api/activities/activity-logs/
```

# CurtainMaster Quotations API

This README documents the quotations API for the Curtain Master backend.

## Base URL

```text
http://localhost:8000/api/quotations/
```

## Authentication

All endpoints require a valid JWT access token.

```http
Authorization: Bearer <access_token>
```

---

## 1. List Quotations

### Endpoint
```http
GET /api/quotations/
```

### Query Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| status | string | Filter by status: `draft`, `pending`, `sent`, `accepted`, `cancelled` |
| customer | integer | Filter by customer ID |
| work_type | integer | Filter by work type ID |
| quote_type | string | Filter by quote type: `b2c`, `b2b` |
| date_from | date | Filter from issued date |
| date_to | date | Filter to issued date |
| search | string | Search by quotation ID or customer name |

### Example Response
```json
[
  {
    "id": "QT-90214",
    "customer": 1,
    "customer_name": "Mariam Al Mansouri",
    "customer_phone": "+971501234567",
    "appointment": 1,
    "appointment_id": "APT-1001",
    "status": "accepted",
    "quote_type": "b2c",
    "work_type": 1,
    "work_type_name": "Curtain&Blinds",
    "subtotal": "11857.14",
    "vat": "592.86",
    "total": "12450.00",
    "discount_percentage": "0.00",
    "discount_amount": "0.00",
    "valid_until": "2024-08-22",
    "issued_date": "2024-07-22",
    "sent_date": "2024-07-22T14:30:00Z",
    "sent_via": "email",
    "prepared_by": 1,
    "prepared_by_name": "Basheer",
    "accepted_date": "2024-07-22T15:00:00Z",
    "created_at": "2024-07-22T10:00:00Z",
    "updated_at": "2024-07-22T15:00:00Z"
  }
]
```

---

## 2. Create Quotation

### Endpoint
```http
POST /api/quotations/
```

### Request Body
```json
{
  "customer": 1,
  "appointment": 1,
  "work_type": 1,
  "status": "draft",
  "quote_type": "b2c",
  "valid_until": "2024-08-22",
  "discount_percentage": 0,
  "areas_data": [
    {
      "area_type": "Living Room",
      "display_name": "Room of Mariam",
      "sort_order": 0,
      "surfaces": [
        {
          "surface_name": "Window 01",
          "surface_type": "window_curtain_path",
          "width_cm": 240,
          "height_cm": 310,
          "opening_direction": "one_way",
          "special_requirements": "Blackout required",
          "sort_order": 0,
          "spec": {
            "fabric_type": 1,
            "model": 1,
            "catalog_item": 1,
            "fabric_code": "LX-2044",
            "unit_price_per_m2": 120.0,
            "motor_control_type": "motorized",
            "motor_type": 1,
            "motor_price_per_unit": 180.0,
            "smart_integration": true,
            "alexa_quantity": 1,
            "alexa_unit_price": 200.0,
            "pelmet_enabled": true,
            "pelmet_width_cm": 240,
            "pelmet_price_per_metre": 90.0,
            "addon_label": "Customization Charge",
            "addon_amount": 50.0
          }
        }
      ]
    }
  ]
}
```

### Example Response
```json
{
  "id": "QT-90215",
  "customer": 1,
  "appointment": 1,
  "status": "draft",
  "quote_type": "b2c",
  "work_type": 1,
  "valid_until": "2024-08-22",
  "discount_percentage": "0.00",
  "areas": [
    {
      "id": 2,
      "quotation": "QT-90215",
      "area_type": "Living Room",
      "display_name": "Room of Mariam",
      "sort_order": 0,
      "surfaces": [
        {
          "id": 2,
          "surface_name": "Window 01",
          "surface_type": "window_curtain_path",
          "width_cm": "240.00",
          "height_cm": "310.00",
          "calculated_area_m2": "7.4400",
          "opening_direction": "one_way",
          "special_requirements": "Blackout required",
          "sort_order": 0,
          "spec": {
            "id": 2,
            "fabric_type": 1,
            "fabric_type_name": "Curtains",
            "model": 1,
            "model_name": "American",
            "catalog_item": 1,
            "catalog_item_name": "Blackout",
            "fabric_code": "LX-2044",
            "unit_price_per_m2": "120.00",
            "fabric_total": "892.80",
            "motor_control_type": "motorized",
            "motor_type": 1,
            "motor_type_name": "American Battery Motor",
            "motor_price_per_unit": "180.00",
            "motor_charge_total": "1339.20",
            "manual_control_total": "0.00",
            "smart_integration": true,
            "alexa_quantity": 1,
            "alexa_unit_price": "200.00",
            "alexa_total": "200.00",
            "pelmet_enabled": true,
            "pelmet_width_cm": "240.00",
            "pelmet_price_per_metre": "90.00",
            "pelmet_total": "216.00",
            "addon_label": "Customization Charge",
            "addon_amount": "50.00",
            "line_item_total": "2698.00"
          }
        }
      ]
    }
  ]
}
```

---

## 3. Get Quotation Details

### Endpoint
```http
GET /api/quotations/{id}/
```

### Example Response
```json
{
  "id": "QT-90214",
  "customer": 1,
  "customer_name": "Mariam Al Mansouri",
  "customer_phone": "+971501234567",
  "customer_email": "mariam.m@example.com",
  "appointment": 1,
  "appointment_id": "APT-1001",
  "status": "accepted",
  "quote_type": "b2c",
  "work_type": 1,
  "work_type_name": "Curtain&Blinds",
  "subtotal": "11857.14",
  "vat": "592.86",
  "total": "12450.00",
  "discount_percentage": "0.00",
  "discount_amount": "0.00",
  "valid_until": "2024-08-22",
  "issued_date": "2024-07-22",
  "sent_date": "2024-07-22T14:30:00Z",
  "sent_via": "email",
  "prepared_by": 1,
  "prepared_by_name": "Basheer",
  "prepared_by_email": "admin@example.com",
  "accepted_date": "2024-07-22T15:00:00Z",
  "created_at": "2024-07-22T10:00:00Z",
  "updated_at": "2024-07-22T15:00:00Z",
  "areas": [
    {
      "id": 1,
      "quotation": "QT-90214",
      "area_type": "Master Bedroom",
      "display_name": "Room of Mariam",
      "sort_order": 0,
      "surfaces": [
        {
          "id": 1,
          "surface_name": "Window 01",
          "surface_type": "window_curtain_path",
          "width_cm": "240.00",
          "height_cm": "310.00",
          "calculated_area_m2": "7.4400",
          "opening_direction": "one_way",
          "special_requirements": "Blackout required",
          "sort_order": 0,
          "spec": {
            "id": 1,
            "fabric_type": 1,
            "fabric_type_name": "Curtains",
            "model": 1,
            "model_name": "American",
            "catalog_item": 1,
            "catalog_item_name": "Blackout",
            "fabric_code": "LX-2044",
            "unit_price_per_m2": "120.00",
            "fabric_total": "892.80",
            "motor_control_type": "motorized",
            "motor_type": 1,
            "motor_type_name": "American Battery Motor",
            "motor_price_per_unit": "180.00",
            "motor_charge_total": "1339.20",
            "manual_control_total": "0.00",
            "smart_integration": true,
            "alexa_quantity": 1,
            "alexa_unit_price": "200.00",
            "alexa_total": "200.00",
            "pelmet_enabled": true,
            "pelmet_width_cm": "240.00",
            "pelmet_price_per_metre": "90.00",
            "pelmet_total": "216.00",
            "addon_label": "Customization Charge",
            "addon_amount": "50.00",
            "line_item_total": "2698.00"
          }
        }
      ]
    }
  ]
}
```

---

## 4. Update Quotation

### Endpoint
```http
PATCH /api/quotations/{id}/
```

### Request Body Example
```json
{
  "status": "pending",
  "discount_percentage": 10,
  "areas_data": [
    {
      "area_type": "New Room",
      "display_name": "New Room Name",
      "sort_order": 0,
      "surfaces": [
        {
          "surface_name": "New Window",
          "surface_type": "window_curtain_path",
          "width_cm": 300,
          "height_cm": 250,
          "opening_direction": "two_way",
          "sort_order": 0,
          "spec": {
            "fabric_type": 1,
            "model": 1,
            "catalog_item": 1,
            "fabric_code": "NEW-001",
            "unit_price_per_m2": 150.0,
            "motor_control_type": "manual",
            "smart_integration": false,
            "pelmet_enabled": false,
            "pelmet_price_per_metre": 0,
            "addon_amount": 0
          }
        }
      ]
    }
  ]
}
```

### Example Response
```json
{
  "id": "QT-90214",
  "status": "pending",
  "discount_percentage": "10.00",
  "areas": [
    {
      "id": 3,
      "quotation": "QT-90214",
      "area_type": "New Room",
      "display_name": "New Room Name",
      "sort_order": 0,
      "surfaces": [
        {
          "id": 3,
          "surface_name": "New Window",
          "surface_type": "window_curtain_path",
          "width_cm": "300.00",
          "height_cm": "250.00",
          "calculated_area_m2": "7.5000",
          "opening_direction": "two_way",
          "special_requirements": "",
          "sort_order": 0,
          "spec": {
            "id": 3,
            "fabric_type": 1,
            "fabric_type_name": "Curtains",
            "model": 1,
            "model_name": "American",
            "catalog_item": 1,
            "catalog_item_name": "Blackout",
            "fabric_code": "NEW-001",
            "unit_price_per_m2": "150.00",
            "fabric_total": "1125.00",
            "motor_control_type": "manual",
            "motor_type": null,
            "motor_type_name": null,
            "motor_price_per_unit": "0.00",
            "motor_charge_total": "0.00",
            "manual_control_total": "0.00",
            "smart_integration": false,
            "alexa_quantity": 0,
            "alexa_unit_price": "0.00",
            "alexa_total": "0.00",
            "pelmet_enabled": false,
            "pelmet_width_cm": "0.00",
            "pelmet_price_per_metre": "0.00",
            "pelmet_total": "0.00",
            "addon_label": "",
            "addon_amount": "0.00",
            "line_item_total": "1125.00"
          }
        }
      ]
    }
  ]
}
```

---

## 5. Update Quotation Status

### Endpoint
```http
PATCH /api/quotations/{id}/status/
```

### Request Body
```json
{
  "status": "sent",
  "sent_via": "email"
}
```

### Status Flow
```text
draft → pending → sent → accepted
                  ↘ cancelled
```

### Example Response
```json
{
  "id": "QT-90214",
  "status": "sent",
  "sent_date": "2024-07-22T14:30:00Z",
  "sent_via": "email",
  "updated_at": "2024-07-22T14:30:00Z"
}
```

---

## 6. Send Quotation

### Endpoint
```http
PATCH /api/quotations/{id}/send/
```

### Request Body
```json
{
  "sent_via": "whatsapp"
}
```

### Example Response
```json
{
  "id": "QT-90214",
  "status": "sent",
  "sent_via": "whatsapp",
  "sent_date": "2024-07-22T14:30:00Z"
}
```

---

## 7. Accept Quotation

### Endpoint
```http
PATCH /api/quotations/{id}/accept/
```

### Request Body
```json
{}
```

Response
json
{
  "id": "QT-90214",
  "status": "accepted",
  "accepted_date": "2024-07-22T15:00:00Z"
}
8. Cancel Quotation
Endpoint: PATCH /api/quotations/{id}/cancel/

Request Body
json
{
  "cancellation_reason": "Client changed mind"
}
Response
json
{
  "id": "QT-90214",
  "status": "cancelled"
}
9. Duplicate Quotation
Endpoint: POST /api/quotations/{id}/duplicate/

Request Body (Optional)
json
{
  "customer": 2,
  "status": "draft"
}
Response
json
{
  "id": "QT-90215",
  "customer": 2,
  "status": "draft",
  "work_type": 1,
  "quote_type": "b2c",
  "valid_until": "2024-08-22",
  "areas": [
    {
      "id": 4,
      "quotation": "QT-90215",
      "area_type": "Master Bedroom",
      "display_name": "Room of Test",
      "sort_order": 0,
      "surfaces": [
        {
          "id": 4,
          "area": 4,
          "area_name": "Room of Test",
          "surface_name": "Window 01",
          "surface_type": "window_curtain_path",
          "width_cm": "240.00",
          "height_cm": "310.00",
          "calculated_area_m2": "7.4400",
          "opening_direction": "one_way",
          "special_requirements": "",
          "sort_order": 0,
          "spec": {
            "id": 4,
            "surface": 4,
            "fabric_type": 1,
            "fabric_type_name": "Curtains",
            "model": 1,
            "model_name": "American",
            "catalog_item": 1,
            "catalog_item_name": "Blackout",
            "fabric_code": "TEST-001",
            "unit_price_per_m2": "120.00",
            "fabric_total": "892.80",
            "motor_control_type": "motorized",
            "motor_type": 1,
            "motor_type_name": "American Battery Motor",
            "motor_price_per_unit": "180.00",
            "motor_charge_total": "1339.20",
            "manual_control_total": "0.00",
            "smart_integration": true,
            "alexa_quantity": 1,
            "alexa_unit_price": "200.00",
            "alexa_total": "200.00",
            "pelmet_enabled": true,
            "pelmet_width_cm": "240.00",
            "pelmet_price_per_metre": "90.00",
            "pelmet_total": "216.00",
            "addon_label": "Customization",
            "addon_amount": "50.00",
            "line_item_total": "2698.00"
          }
        }
      ]
    }
  ]
}
10. Get Quotation Statistics
Endpoint: GET /api/quotations/stats/

Response
json
{
  "total": 24,
  "by_status": {
    "draft": 3,
    "pending": 5,
    "sent": 8,
    "accepted": 6,
    "cancelled": 2
  },
  "total_value": "1245000.00",
  "accepted_value": "892000.00",
  "pending_value": "235000.00",
  "this_month": 12
}
11. Delete Quotation (Soft Delete)
Endpoint: DELETE /api/quotations/{id}/

This performs a soft delete - sets status to "cancelled".

Response
json
{
  "message": "Quotation QT-90214 has been cancelled.",
  "quotation": {
    "id": "QT-90214",
    "status": "cancelled"
  }
}
Status Codes
Status Code	Description
200	Success (GET, PATCH, DELETE)
201	Created (POST)
400	Bad Request (Validation error)
401	Unauthorized (Authentication required)
403	Forbidden (Permission denied)
404	Not Found
Error Responses
Validation Error (400)
json
{
  "discount_percentage": ["Discount cannot exceed 100%."]
}
Authentication Error (401)
json
{
  "detail": "Authentication credentials were not provided."
}
Permission Error (403)
json
{
  "error": "You don't have permission to perform this action."
}
Not Found (404)
json
{
  "detail": "Not found."
}
Field Descriptions
Quotation Fields
Field	Type	Description
id	string	Auto-generated ID (e.g., QT-90214)
customer	integer	Customer ID
appointment	integer	Appointment ID
status	string	draft, pending, sent, accepted, cancelled
quote_type	string	b2c (Retail), b2b (Business)
work_type	integer	Work type ID from catalog
subtotal	decimal	Total before VAT and discount
vat	decimal	VAT amount (5%)
total	decimal	Grand total
discount_percentage	decimal	Discount percentage (0-100)
discount_amount	decimal	Discount amount
valid_until	date	Quotation validity date
issued_date	date	Date issued
sent_date	datetime	When sent to customer
sent_via	string	email, whatsapp, sms
prepared_by	integer	User ID who prepared the quote
accepted_date	datetime	When accepted by customer
Area Fields
Field	Type	Description
area_type	string	Room type (e.g., "Living Room")
display_name	string	Display name for the area
sort_order	integer	Order in the quotation
Surface Fields
Field	Type	Description
surface_name	string	Name of the surface
surface_type	string	window_curtain_path, wall_to_wall_track, bay_window, sliding_door
width_cm	decimal	Width in centimeters
height_cm	decimal	Height in centimeters
calculated_area_m2	decimal	Auto-calculated area in m²
opening_direction	string	one_way, two_way
special_requirements	text	Special instructions
Surface Spec Fields
Field	Type	Description
fabric_type	integer	Fabric type ID from catalog
model	integer	Model ID from catalog
catalog_item	integer	Catalog item ID
fabric_code	string	Custom fabric code
unit_price_per_m2	decimal	Price per square metre
fabric_total	decimal	Auto-calculated fabric total
motor_control_type	string	manual, motorized
motor_type	integer	Motor type ID from catalog
motor_price_per_unit	decimal	Motor price per unit
motor_charge_total	decimal	Auto-calculated motor charge
manual_control_total	decimal	Manual control charge
smart_integration	boolean	With Alexa integration
alexa_quantity	integer	Number of Alexa units
alexa_unit_price	decimal	Price per Alexa unit
alexa_total	decimal	Auto-calculated Alexa total
pelmet_enabled	boolean	Pelmet included
pelmet_width_cm	decimal	Pelmet width in cm
pelmet_price_per_metre	decimal	Price per metre
pelmet_total	decimal	Auto-calculated pelmet total
addon_label	string	Label for custom add-on
addon_amount	decimal	Custom add-on amount
line_item_total	decimal	Auto-calculated total for this spec
Quick Reference - cURL Examples
Create Quotation
bash
curl -X POST http://localhost:8000/api/quotations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": 1,
    "appointment": 1,
    "work_type": 1,
    "status": "draft",
    "quote_type": "b2c",
    "valid_until": "2024-08-22",
    "discount_percentage": 0,
    "areas_data": []
  }'
List Quotations
bash
curl -X GET "http://localhost:8000/api/quotations/?status=draft&search=Mariam" \
  -H "Authorization: Bearer YOUR_TOKEN"
Update Status
bash
curl -X PATCH http://localhost:8000/api/quotations/QT-90214/status/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "sent", "sent_via": "email"}'
Duplicate Quotation
bash
curl -X POST http://localhost:8000/api/quotations/QT-90214/duplicate/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer": 2}'
Get Statistics
bash
curl -X GET http://localhost:8000/api/quotations/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
Test Credentials
json
{
  "admin": {
    "email": "admin@example.com",
    "password": "adminpass123"
  },
  "salesman": {
    "email": "salesman@example.com",
    "password": "salesmanpass123"
  }
}

# CurtainMaster Orders API

This document describes the Orders, Invoices, and Payments API endpoints for the Curtain Master backend.

## Base URL

```text
http://localhost:8000/api/
```

## Authentication

All API endpoints require authentication using a JWT token.

```http
Authorization: Bearer <access_token>
```

---

## 1. Orders API

### 1.1 List Orders

**Endpoint**
```http
GET /api/orders/
```

**Query Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| status | string | Filter by order status |
| customer | integer | Filter by customer ID |
| quotation | string | Filter by quotation ID |
| search | string | Search by ID or customer |

**Example Response**
```json
[
  {
    "id": 1,
    "quotation": "QT-90214",
    "quotation_id": "QT-90214",
    "customer": 1,
    "customer_name": "Mariam Al Mansouri",
    "customer_phone": "+971501234567",
    "order_status": "pending_production",
    "estimated_production_days": 21,
    "invoice": "INV-2041",
    "invoice_id": "INV-2041",
    "invoice_status": "sent",
    "created_at": "2024-07-22T10:00:00Z",
    "updated_at": "2024-07-22T10:00:00Z"
  }
]
```

### 1.2 Create Order

**Endpoint**
```http
POST /api/orders/
```

**Request Body**
```json
{
  "quotation": "QT-90214",
  "customer": 1,
  "order_status": "pending_production",
  "estimated_production_days": 21
}
```

**Validation Rules**
- Quotation must be in accepted status
- Only one order per quotation
- Customer must exist

**Example Response**
```json
{
  "id": 2,
  "quotation": "QT-90215",
  "customer": 1,
  "order_status": "pending_production",
  "estimated_production_days": 21,
  "created_at": "2024-07-22T10:00:00Z",
  "updated_at": "2024-07-22T10:00:00Z"
}
```

### 1.3 Get Order Details

**Endpoint**
```http
GET /api/orders/{id}/
```

**Example Response**
```json
{
  "id": 1,
  "quotation": "QT-90214",
  "quotation_id": "QT-90214",
  "customer": 1,
  "customer_name": "Mariam Al Mansouri",
  "customer_phone": "+971501234567",
  "order_status": "pending_production",
  "estimated_production_days": 21,
  "invoice": "INV-2041",
  "invoice_id": "INV-2041",
  "invoice_status": "sent",
  "created_at": "2024-07-22T10:00:00Z",
  "updated_at": "2024-07-22T10:00:00Z"
}
```

### 1.4 Update Order Status

**Endpoint**
```http
PATCH /api/orders/{id}/status/
```

**Request Body**
```json
{
  "order_status": "in_production"
}
```

**Status Flow**
```text
pending_production → in_production → shipped → installed → closed
```

**Example Response**
```json
{
  "id": 1,
  "order_status": "in_production",
  "updated_at": "2024-07-22T10:30:00Z"
}
```

### 1.5 Generate Invoice from Order

**Endpoint**
```http
POST /api/orders/{id}/generate-invoice/
```

**Request Body**
```json
{}
```

**Example Response**
```json
{
  "id": "INV-2042",
  "order": 1,
  "customer": 1,
  "status": "draft",
  "total_amount": "12450.00",
  "amount_paid": "0.00",
  "balance_due": "12450.00",
  "due_date": "2024-08-05",
  "issued_date": "2024-07-22",
  "payment_terms": "Full payment on invoice",
  "payment_url": "",
  "sent_date": null,
  "sent_via": "",
  "quotation_id": "QT-90214",
  "payments": []
}
```

### 1.6 Order Statistics

**Endpoint**
```http
GET /api/orders/stats/
```

**Example Response**
```json
{
  "total": 24,
  "by_status": {
    "pending_production": 8,
    "in_production": 6,
    "shipped": 4,
    "installed": 4,
    "closed": 2
  },
  "pending_production": 8,
  "in_production": 6,
  "shipped": 4,
  "installed": 4,
  "closed": 2
}
```

### 1.7 Delete Order (Soft Delete)

**Endpoint**
```http
DELETE /api/orders/{id}/
```

**Validation**
- Cannot delete closed orders
- Cannot delete orders with payments

**Example Response**
```json
{
  "message": "Order 1 has been cancelled.",
  "order": {
    "id": 1,
    "order_status": "cancelled"
  }
}
```

---

## 2. Invoices API

### 2.1 List Invoices

**Endpoint**
```http
GET /api/invoices/
```

**Query Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| status | string | Filter by status |
| customer | integer | Filter by customer ID |
| date_from | date | Filter from issued date |
| date_to | date | Filter to issued date |
| search | string | Search by ID or customer |

**Example Response**
```json
[
  {
    "id": "INV-2041",
    "order": 1,
    "order_id": 1,
    "customer": 1,
    "customer_name": "Mariam Al Mansouri",
    "customer_phone": "+971501234567",
    "customer_email": "mariam.m@example.com",
    "status": "sent",
    "status_display": "Sent",
    "total_amount": "12450.00",
    "amount_paid": "0.00",
    "balance_due": "12450.00",
    "due_date": "2024-08-05",
    "issued_date": "2024-07-22",
    "payment_terms": "Full payment on invoice",
    "payment_url": "",
    "sent_date": null,
    "sent_via": "",
    "quotation_id": "QT-90214",
    "payments": [],
    "created_at": "2024-07-22T10:00:00Z",
    "updated_at": "2024-07-22T10:00:00Z"
  }
]
```

### 2.2 Create Invoice

**Endpoint**
```http
POST /api/invoices/
```

**Request Body**
```json
{
  "order": 1,
  "customer": 1,
  "total_amount": 12450.0,
  "due_date": "2024-08-05",
  "payment_terms": "50% advance, balance on installation",
  "payment_url": "https://pay.curtainmaster.ae/i/INV-2041"
}
```

**Example Response**
```json
{
  "id": "INV-2041",
  "order": 1,
  "customer": 1,
  "status": "draft",
  "total_amount": "12450.00",
  "amount_paid": "0.00",
  "balance_due": "12450.00",
  "due_date": "2024-08-05",
  "issued_date": "2024-07-22",
  "payment_terms": "50% advance, balance on installation",
  "payment_url": "https://pay.curtainmaster.ae/i/INV-2041",
  "payments": []
}
```

### 2.3 Get Invoice Details

**Endpoint**
```http
GET /api/invoices/{id}/
```

**Response**
Full invoice details with payments.

### 2.4 Update Invoice Status

**Endpoint**
```http
PATCH /api/invoices/{id}/status/
```

**Request Body**
```json
{
  "status": "paid",
  "sent_via": "email"
}
```

**Status Values**
- `draft`
- `sent`
- `overdue`
- `paid`
- `partially_paid`

**Example Response**
```json
{
  "id": "INV-2041",
  "status": "paid",
  "amount_paid": "12450.00",
  "balance_due": "0.00"
}
```

### 2.5 Send Invoice

**Endpoint**
```http
PATCH /api/invoices/{id}/send/
```

**Request Body**
```json
{
  "sent_via": "whatsapp"
}
```

**Example Response**
```json
{
  "id": "INV-2041",
  "status": "sent",
  "sent_via": "whatsapp",
  "sent_date": "2024-07-22T10:30:00Z"
}
```

### 2.6 Add Payment to Invoice

**Endpoint**
```http
POST /api/invoices/{id}/add-payment/
```

**Request Body**
```json
{
  "amount": 6225.0,
  "method": "bank_transfer",
  "reference": "BNK-44821",
  "payment_date": "2024-07-22",
  "notes": "50% advance payment"
}
```

**Payment Methods**
- `cash`
- `card`
- `bank_transfer`
- `cheque`

**Example Response**
```json
{
  "id": "INV-2041",
  "status": "partially_paid",
  "amount_paid": "6225.00",
  "balance_due": "6225.00",
  "payments": [
    {
      "id": 1,
      "amount": "6225.00",
      "method": "bank_transfer",
      "reference": "BNK-44821",
      "payment_date": "2024-07-22",
      "notes": "50% advance payment",
      "created_by_name": "Basheer"
    }
  ]
}
```

### 2.7 Invoice Statistics

**Endpoint**
```http
GET /api/invoices/stats/
```

**Example Response**
```json
{
  "total": 24,
  "by_status": {
    "draft": 3,
    "sent": 8,
    "overdue": 2,
    "paid": 9,
    "partially_paid": 2
  },
  "total_amount": "1245000.00",
  "total_paid": "892000.00",
  "total_due": "353000.00",
  "overdue": 2
}
```

### 2.8 Delete Invoice (Soft Delete)

**Endpoint**
```http
DELETE /api/invoices/{id}/
```

**Validation**
- Cannot delete invoices with payments
- Cannot delete paid invoices

**Example Response**
```json
{
  "message": "Invoice INV-2041 has been cancelled.",
  "invoice": {
    "id": "INV-2041",
    "status": "cancelled"
  }
}
```

---

## 3. Payments API

### 3.1 List Payments

**Endpoint**
```http
GET /api/payments/
```

**Query Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| invoice | string | Filter by invoice ID |
| method | string | Filter by payment method |
| date_from | date | Filter from payment date |
| date_to | date | Filter to payment date |

Response:

json
[
  {
    "id": 1,
    "invoice": "INV-2041",
    "invoice_number": "INV-2041",
    "amount": "6225.00",
    "method": "bank_transfer",
    "reference": "BNK-44821",
    "payment_date": "2024-07-22",
    "notes": "50% advance payment",
    "created_by": 1,
    "created_by_name": "Basheer",
    "created_at": "2024-07-22T10:00:00Z"
  }
]
3.2 Create Payment
Endpoint: POST /api/payments/

Request Body:

json
{
  "invoice": "INV-2041",
  "amount": 6225.00,
  "method": "bank_transfer",
  "reference": "BNK-44821",
  "payment_date": "2024-07-22",
  "notes": "50% advance payment"
}
Response (201 Created):

json
{
  "id": 2,
  "invoice": "INV-2041",
  "invoice_number": "INV-2041",
  "amount": "6225.00",
  "method": "bank_transfer",
  "reference": "BNK-44821",
  "payment_date": "2024-07-22",
  "notes": "50% advance payment",
  "created_by": 1,
  "created_by_name": "Basheer",
  "created_at": "2024-07-22T10:05:00Z"
}
3.3 Delete Payment
Endpoint: DELETE /api/payments/{id}/

Response:

json
{
  "message": "Payment deleted successfully.",
  "invoice": {
    "id": "INV-2041",
    "status": "sent",
    "amount_paid": "0.00",
    "balance_due": "12450.00"
  }
}
4. Error Responses
Validation Error (400)
json
{
  "quotation": ["An order already exists for this quotation."]
}
Authentication Error (401)
json
{
  "detail": "Authentication credentials were not provided."
}
Permission Error (403)
json
{
  "error": "You don't have permission to perform this action."
}
Not Found (404)
json
{
  "detail": "Not found."
}
5. Field Descriptions
Order Fields
Field	Type	Description
id	integer	Auto-generated ID
quotation	string	Quotation ID
quotation_id	string	Quotation ID (readable)
customer	integer	Customer ID
customer_name	string	Customer full name
customer_phone	string	Customer phone number
order_status	string	pending_production, in_production, shipped, installed, closed, cancelled
estimated_production_days	integer	Estimated days for production
invoice	string	Invoice ID (if exists)
invoice_status	string	Invoice status
Invoice Fields
Field	Type	Description
id	string	Auto-generated ID (e.g., INV-2041)
order	integer	Order ID
customer	integer	Customer ID
status	string	draft, sent, overdue, paid, partially_paid
total_amount	decimal	Total invoice amount
amount_paid	decimal	Total paid amount
balance_due	decimal	Remaining balance
due_date	date	Payment due date
issued_date	date	Invoice issue date
payment_terms	string	Payment terms description
payment_url	string	Payment gateway link
sent_date	datetime	When invoice was sent
sent_via	string	email, whatsapp
Payment Fields
Field	Type	Description
id	integer	Auto-generated ID
invoice	string	Invoice ID
amount	decimal	Payment amount
method	string	cash, card, bank_transfer, cheque
reference	string	Bank reference, cheque number, etc.
payment_date	date	Payment date
notes	string	Additional notes
6. Workflow Summary
text
Quotation (accepted) 
    ↓
Order (pending_production) 
    ↓
Invoice (generated) → Invoice (sent) → Payment (received) → Invoice (paid)
    ↓
Order → in_production → shipped → installed → closed
Status Values
Order Status:

pending_production - Order created, awaiting production

in_production - In production

shipped - Shipped to customer

installed - Installed at customer site

closed - Order completed

cancelled - Order cancelled (soft delete)

Invoice Status:

draft - Invoice created but not sent

sent - Invoice sent to customer

overdue - Payment overdue

partially_paid - Partial payment received

paid - Fully paid

7. cURL Examples
Create Order
bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quotation": "QT-90214",
    "customer": 1,
    "order_status": "pending_production"
  }'
Generate Invoice
bash
curl -X POST http://localhost:8000/api/orders/1/generate-invoice/ \
  -H "Authorization: Bearer YOUR_TOKEN"
Add Payment to Invoice
bash
curl -X POST http://localhost:8000/api/invoices/INV-2041/add-payment/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 6225.00,
    "method": "bank_transfer",
    "reference": "BNK-44821",
    "payment_date": "2024-07-22"
  }'
Update Invoice Status
bash
curl -X PATCH http://localhost:8000/api/invoices/INV-2041/status/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}'
Update Order Status
bash
curl -X PATCH http://localhost:8000/api/orders/1/status/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_status": "in_production"}'
Get Statistics
bash
curl -X GET http://localhost:8000/api/orders/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
8. Test Credentials
json
{
  "admin": {
    "email": "admin@example.com",
    "password": "adminpass123"
  },
  "salesman": {
    "email": "salesman@example.com",
    "password": "salesmanpass123"
  }
}
9. Changelog

| Version | Date       | Changes                                |
|---------|------------|----------------------------------------|
| 1.0.0   | 2024-07-22 | Initial API release                    |

**Features Included:**
- ✅ Order management
- ✅ Invoice management
- ✅ Payment management
- ✅ Full CRUD operations
- ✅ Statistics endpoints

---

## Support

For issues or questions, contact the development team at support@curtainmaster.ae


