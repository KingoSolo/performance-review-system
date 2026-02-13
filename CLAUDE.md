# Performance Review System

Multi-tenant SaaS platform for performance reviews.

## CRITICAL RULES

1. **Multi-Tenancy:** EVERY database query MUST filter by `company_id`
2. **Scoring Formula:** `(Self + Avg(Managers) + Avg(Peers)) / 3`
3. **Workflow:** Dynamic, configured via `review_configs` table

## Tech Stack

- Frontend: Next.js 14+ (App Router) + TypeScript
- Backend: NestJS + Prisma + PostgreSQL
- Auth: Supabase Auth

## Related Context

- Backend: `backend/CLAUDE.md`
- Frontend: `frontend/CLAUDE.md`
- Requirements: `docs/PRD.md`