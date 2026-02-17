# Project State - Performance Review System

**Last Updated:** February 17, 2026

## 📊 Current Status

### ✅ Completed Modules

#### 1. Authentication & Multi-Tenancy
- Supabase Auth integration
- JWT-based authentication with guards
- Multi-tenancy middleware
- Company-scoped data isolation
- Auth decorators: `@CurrentUser`, `@CompanyId`, `@Roles`

#### 2. User Management Module
- **Backend:** Full CRUD for users with company_id filtering
- **Frontend:** Employee management UI (`/admin/employees`)
- **Features:**
  - Create/edit/delete employees
  - Manager assignment (including multiple managers per employee)
  - Excel bulk import
  - Role-based access control (Admin/Manager/Employee)
  - Statistics dashboard
- **Reference:** See [USER_MANAGEMENT_COMPLETE.md](./USER_MANAGEMENT_COMPLETE.md) for detailed documentation

#### 3. Questions Module
- **Backend:** Questions CRUD with multi-tenancy
- **Frontend:** Questions management UI (`/admin/questions`)
- **Features:**
  - Create custom review questions
  - Question types: RATING, TEXT, TASK_LIST
  - Review type assignment (Self/Manager/Peer)
  - Question ordering
  - Recent migration: `add_question_type_and_order`

### ❌ Known Issues

**None currently reported**

### 🚧 In Progress

**Nothing actively in progress**

### ⏳ Not Started (Planned)

According to PRD build order:

1. **Review Cycles + Workflows** (Next Priority)
   - Create review cycles
   - Configure flexible workflows (sequential/parallel steps)
   - Review config management (steps, dates, review types)

2. **Review Forms**
   - Self-review submission
   - Manager review submission
   - Peer review submission
   - Auto-save drafts
   - Review status tracking

3. **Scoring Engine**
   - Calculate: `(Self + Avg(Managers) + Avg(Peers)) / 3`
   - Score breakdowns
   - Manual admin overrides with audit logs

4. **Dashboards & Reporting**
   - Employee: view own scores + feedback
   - Manager: team performance dashboard
   - Admin: company-wide analytics
   - Export functionality

5. **Notifications**
   - Email notifications for cycle events
   - Review reminders
   - Completion notifications

6. **Polish**
   - Search/filter improvements
   - Pagination
   - Excel export
   - PDF reports

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- PostgreSQL running
- Supabase account (for auth)

### Backend (NestJS)
```bash
cd backend

# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev

# Backend runs on: http://localhost:3001
```

### Frontend (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend runs on: http://localhost:3000
```

### Database Tools
```bash
# Open Prisma Studio (database GUI)
cd backend
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🔧 Environment Setup

### Backend: `backend/.env`
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/performance_review"
SUPABASE_URL="your-supabase-url"
SUPABASE_JWT_SECRET="your-jwt-secret"
```

### Frontend: `frontend/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

**Note:** Actual secrets are in `.env` files (gitignored)

## 📁 Key Backend Modules

```
backend/src/
├── auth/              # Supabase authentication
├── users/             # User/employee management
├── questions/         # Review questions CRUD
└── common/
    ├── decorators/    # @CurrentUser, @CompanyId, @Roles
    ├── guards/        # Auth & role guards
    ├── middleware/    # Tenant context
    └── services/      # Prisma service
```

## 📋 Database Schema Highlights

### Core Tables (Implemented)
- ✅ `Company` - Multi-tenant root
- ✅ `User` - Employees, managers, admins (with company_id)
- ✅ `Question` - Review questions (with company_id, type, order)

### Pending Tables
- ⏳ `ReviewCycle` - Performance review periods
- ⏳ `ReviewConfig` - Workflow step configuration
- ⏳ `Review` - Individual review submissions
- ⏳ `Answer` - Question responses
- ⏳ `ReviewerAssignment` - Who reviews whom
- ⏳ `Team` - Optional team groupings

## 🎯 Critical Patterns

### 1. Multi-Tenancy (MANDATORY)
**EVERY database query MUST filter by `company_id`:**

```typescript
// ✅ CORRECT
async findAll(companyId: string) {
  return this.prisma.user.findMany({
    where: { companyId },  // REQUIRED!
  });
}

// ❌ WRONG - Missing company_id filter
async findAll() {
  return this.prisma.user.findMany();  // SECURITY BREACH!
}
```

### 2. Scoring Formula
```
Final Score = (Self Score + Avg(Manager Scores) + Avg(Peer Scores)) / 3
```

### 3. Role-Based Access
- **Admin:** Full control within company
- **Manager:** Manage team, submit reviews
- **Employee:** Self-review, peer reviews (if assigned)

## 📚 Documentation References

- [CLAUDE.md](./CLAUDE.md) - Project-level instructions
- [backend/src/CLAUDE.md](./backend/src/CLAUDE.md) - Backend patterns
- [docs/PRD.md](./docs/PRD.md) - Full product requirements
- [USER_MANAGEMENT_COMPLETE.md](./USER_MANAGEMENT_COMPLETE.md) - User module docs

## 🎨 Frontend Pages (Current)

```
/                          → Landing/login
/admin/employees           → Employee management (✅ Complete)
/admin/questions           → Question management (✅ Complete)
/admin/review-cycles       → Review cycles (⏳ Not started)
/reviews/self              → Self-review form (⏳ Not started)
/reviews/manager           → Manager review form (⏳ Not started)
/reviews/peer              → Peer review form (⏳ Not started)
/dashboard                 → Role-specific dashboard (⏳ Not started)
```

## 🔐 Git Status Summary

**Current Branch:** `main`

**Recent Commits:**
- `b1b93c6` - Added user management module
- `e0ce810` - Initial commit: backend schema + auth + frontend scaffold
- `1f082e9` - Initial commit with intent layer

**Modified Files:**
- Backend: package files, schema, app.module
- Frontend: API client

**New Files (Untracked):**
- Questions module (backend + frontend)
- Company-id decorator
- Questions migration

## 📈 Next Immediate Steps

1. **Review Cycles Module** (Highest Priority)
   - Backend: Create review cycle CRUD with company_id filtering
   - Backend: Add review config (workflow steps) management
   - Frontend: Admin UI for creating/managing cycles
   - Database: Ensure `ReviewCycle` and `ReviewConfig` tables ready

2. **Reviewer Assignment**
   - Backend: Create assignment endpoints
   - Frontend: UI for assigning managers/peers per employee
   - Validation: Same company, no self-assignment

3. **Review Submission Flow**
   - Backend: Create review CRUD with status tracking
   - Frontend: Forms for self/manager/peer reviews
   - Auto-save drafts functionality

---

**Status:** Foundations complete. Ready to build core review functionality.
