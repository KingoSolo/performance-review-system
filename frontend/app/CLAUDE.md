# Frontend - Next.js App Router

## Server Components (Default)
```tsx
// app/admin/page.tsx
export default async function AdminPage() {
  const data = await fetch(...);
  return <Dashboard data={data} />;
}
```

## Client Components (When Needed)
```tsx
'use client';

export default function Form() {
  const [state, setState] = useState();
  // Interactive features
}
```