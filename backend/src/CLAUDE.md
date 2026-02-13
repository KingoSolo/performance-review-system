# Backend - NestJS

## Critical Pattern: Multi-Tenancy

EVERY query must filter by company_id:
```typescript
async findUsers(companyId: string) {
  return prisma.user.findMany({
    where: { company_id: companyId }
  });
}
```

## Modules

- auth/ → Supabase integration
- users/ → User management
- review-cycles/ → Cycle configuration
- reviews/ → Review submission
- scoring/ → Score calculation