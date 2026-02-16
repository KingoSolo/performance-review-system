# Authentication Module

## Overview
This module handles authentication using Supabase Auth and implements multi-tenancy with company-level data isolation.

## Key Features

### 1. Multi-Tenancy
- Every user belongs to a company (tenant)
- `company_id` is automatically extracted from JWT and attached to requests
- All database queries MUST filter by `company_id`

### 2. Authentication Flow

**Sign Up:**
```typescript
POST /api/auth/signup
{
  "email": "admin@company.com",
  "password": "securepass",
  "name": "John Doe",
  "companyName": "Acme Corp"
}
```
- Creates company
- Creates Supabase auth user
- Creates user in database as ADMIN

**Sign In:**
```typescript
POST /api/auth/signin
{
  "email": "admin@company.com",
  "password": "securepass"
}
```
Returns JWT token with user info including `companyId`

**Get Current User:**
```typescript
GET /api/auth/me
Headers: {
  Authorization: "Bearer <token>"
}
```

### 3. Middleware & Guards

**TenantContextMiddleware:**
- Applied to all routes except `/auth/signin` and `/auth/signup`
- Extracts JWT from Authorization header
- Verifies token with Supabase
- Fetches user from database with `company_id`
- Attaches user to `request.user`

**Usage in Controllers:**
```typescript
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  // Only authenticated users
  @Get()
  findAll(@CurrentUser() user) {
    // user.companyId is available
    return this.service.findAll(user.companyId);
  }

  // Only ADMINs can access
  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  create(@CurrentUser() user, @Body() dto) {
    return this.service.create(user.companyId, dto);
  }
}
```

### 4. Environment Variables Required

```env
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Database
DATABASE_URL="postgresql://..." # Direct (migrations)
DATABASE_URL_POOLER="postgresql://..." # Pooler (runtime)
```

## Critical Pattern: Company Filtering

**ALWAYS filter by company_id:**
```typescript
// ✅ CORRECT
async findUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId }
  });
}

// ❌ WRONG - Leaks data across companies!
async findUsers() {
  return prisma.user.findMany();
}
```

## File Structure

```
auth/
├── auth.module.ts          # Module definition
├── auth.service.ts         # Supabase integration + user management
├── auth.controller.ts      # Auth endpoints
└── README.md               # This file

common/
├── middleware/
│   └── tenant-context.middleware.ts  # Extracts company_id from JWT
├── guards/
│   ├── auth.guard.ts       # Ensures user is authenticated
│   └── roles.guard.ts      # Ensures user has required role
├── decorators/
│   ├── current-user.decorator.ts  # Get current user in controller
│   └── roles.decorator.ts         # Define required roles
└── services/
    └── prisma.service.ts   # Prisma client singleton
```
