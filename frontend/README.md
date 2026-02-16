# Performance Review System - Frontend

Next.js 14 App Router frontend with Supabase authentication and role-based dashboards.

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

3. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
├── (auth)/
│   └── login/page.tsx          # Login & signup page
├── (dashboard)/
│   ├── layout.tsx              # Dashboard layout with nav
│   ├── admin/page.tsx          # Admin dashboard
│   ├── manager/page.tsx        # Manager dashboard
│   └── employee/page.tsx       # Employee dashboard
├── layout.tsx                  # Root layout
├── page.tsx                    # Home (redirects to dashboard)
└── globals.css                 # Global styles

lib/
├── supabase.ts                 # Supabase client
└── auth.ts                     # Auth utilities

components/
└── DashboardNav.tsx            # Dashboard navigation

middleware.ts                   # Auth protection
```

## 🔐 Authentication Flow

1. **Sign Up:** Creates company + admin user
2. **Sign In:** Authenticates and redirects to role-based dashboard
3. **Middleware:** Protects all routes except `/login`
4. **Role Routing:** Automatically redirects to correct dashboard

## 🎨 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth
- **State:** Server Components (default)

## 📄 Pages

### Login (`/login`)
- Sign in / sign up toggle
- Form validation
- Error handling
- Auto-redirect after auth

### Admin Dashboard (`/admin`)
- Company overview
- Employee management
- Review cycle creation
- Analytics

### Manager Dashboard (`/manager`)
- Team overview
- Pending reviews
- Team performance
- Self-review access

### Employee Dashboard (`/employee`)
- Personal stats
- Self-review
- Peer reviews
- Feedback history

## 🛡️ Route Protection

All routes except `/login` are protected by middleware:
- Checks for valid Supabase session
- Verifies user exists in backend
- Redirects unauthenticated users to `/login`
- Prevents authenticated users from accessing `/login`

## 🔄 Server vs Client Components

**Server Components (default):**
- All dashboard pages
- Layouts
- Data fetching

**Client Components ('use client'):**
- Login form (needs useState)
- DashboardNav (needs router, onClick)
- Interactive UI components

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## 🚧 TODO

- [ ] Add form validation library (zod)
- [ ] Implement actual data fetching
- [ ] Add loading states
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] More components (tables, modals, etc.)

## 📚 Documentation

See `/app/CLAUDE.md` for coding patterns and conventions.
