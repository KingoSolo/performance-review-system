# Testing Session – Review Cycles Module

## Issue 1 – Incorrect Cycle Status Counters

### Scenario
Created 1 new review cycle.
Cycle status = DRAFT.

### Observed Behavior
- Top summary shows:
  - 1 Draft
  - 1 Active
  - 1 Completed
- But only 1 cycle exists and it is still in Draft.

### When Clicking Filters
- Clicking "Active" → shows 0 cycles.
- Clicking "Completed" → shows 0 cycles.
- Clicking "Draft" → shows the 1 correct cycle.

### Expected Behavior
- Counters should reflect actual counts.
- With 1 draft cycle:
  - Draft: 1
  - Active: 0
  - Completed: 0

---

## Issue 2 – Active Filter Inconsistency

When clicking "Active":
- Summary counters still show incorrect numbers.
- List shows 0 cycles.

This suggests:
- Either the counter logic is wrong
- Or frontend state is not synced with backend
- Or backend query for counts is incorrect

---

## Issue 3 – View and Edit Buttons Do Same Thing

### Observed
- "View" opens editable form
- "Edit" opens same editable form
- No read-only mode

### Expected
- View → read-only
- Edit → editable

Or remove one of them.

---

## Issue 4 – No Assign Reviewers Button

After creating a cycle:
- No obvious UI action to assign reviewers
- Workflow requires reviewer assignment
- Feature appears missing from UI

Expected:
- Either:
  - Button: "Assign Reviewers"
  - Or step-based flow guiding admin



``
# Issues Found – Post Seed (Employees + Dashboard + Navigation)

## Context
- Seeding test users was successful (users exist in DB).
- After seeding, multiple dashboard + auth/navigation issues appear.
- Stack: Next.js App Router frontend + Supabase Auth + NestJS/Prisma backend (multi-tenant company_id).

---

## 1) Dashboard KPIs Not Loading (shows "-")
**Where**
- Admin dashboard home (overview cards)

**Symptoms**
- "Total Employees" displays `-` (not a number).
- "Active Review Cycle" section is empty.

**Expected**
- Total Employees should show count of users in current company.
- Active Review Cycle should show the currently ACTIVE cycle (if exists) or clear empty-state message.

**Suspected Cause**
- Dashboard data fetch failing due to auth/session missing/expired.
- API call failing (401/403) and UI falls back to `-`.
- company_id not available / not being sent to backend.
- Wrong endpoint route or caching issue in App Router.

**To Verify**
- Check network requests on dashboard load:
  - Which endpoint is called for employee count?
  - Which endpoint is called for active cycle?
  - Response status codes (401/403/500?) and payload.

---

## 2) "Manage Employees" Signs Me Out
**Where**
- Admin dashboard → "Manage Employees" button/link

**Steps**
1. Login as admin
2. Click "Manage Employees"
3. App logs out (session cleared / redirected to login)

**Expected**
- Should navigate to employees/users management page without changing auth state.

**Suspected Cause**
- Route triggers an auth guard that fails and forces sign out.
- Client-side code calling signOut() unexpectedly on navigation error.
- Middleware/JWT verification failing on that route only.
- Dashboard links using wrong path (e.g., protected route mismatch).

**To Verify**
- Inspect Next.js middleware logs / console error on navigation.
- Confirm the route exists and is included in protected route matcher.
- Check if any `signOut()` runs on 401 handler globally.

---

## 3) Navigation Bug: "Create Review Cycles" and "View Analytics" go to the same page
**Where**
- Admin dashboard quick actions / navigation links

**Symptoms**
- "Create Review Cycles" and "View Analytics" navigate to the same route/page.

**Expected**
- Create Review Cycles → review cycle creation page (or list with "Create" CTA).
- View Analytics → analytics page (different route).

**Suspected Cause**
- Both buttons share the same href or handler.
- Sidebar config / dashboard quick actions map has duplicated route.

**To Verify**
- Check the component that renders these buttons and confirm hrefs.
- Search for "View Analytics" in frontend to locate route mapping.

---

## 4) Signup → Auto Sign-in → Then Forced Logout
**Where**
- Auth flow on signup

**Symptoms**
- After signup, user is automatically signed in briefly, then gets logged out.
- This also sometimes happens on normal sign in after some navigations.

**Expected**
- After signup: remain signed in and routed to correct dashboard.
- No unexpected logout unless token truly invalid/expired.

**Suspected Cause**
- Supabase session not persisted properly (storage / cookie issue).
- JWT verification middleware rejecting token (wrong audience/issuer, stale JWKS, wrong key, mismatch between frontend token and backend verification).
- Frontend auth state listener detects mismatch and triggers signOut.
- Multi-tenant user/company creation timing race: DB user not found immediately → app treats as invalid and logs out.
- Global API client interceptor signs out on 401 (even for non-auth-critical endpoints).

**To Verify**
- Check backend response on first `/me` or profile fetch right after signup:
  - Is it 404/401? Does it say user not found?
- Check token expiry and whether refresh token flow works.
- Confirm whether cookies/localStorage is being used (Next App Router + middleware can be tricky).

---

## Priority
P0: Unexpected logout (Manage Employees logs out + signup logs out)
P1: Dashboard KPIs showing "-" and active cycle empty
P2: Navigation routes wrong (Create Review Cycles vs Analytics)

---

## Fix Strategy (Important)
- Diagnose root cause before patching.
- Fix auth/session stability first (P0), then data fetching, then navigation.
- Do not change backend business logic for review cycles.
``

# EMAIL AND UI ISSUES
We have issues in Notifications + Dashboard UI navigation.

P0: Emails are not being sent at all
- No emails in admin inbox
- Resend dashboard shows NO emails sent
- Preferences are toggled ON and saved successfully on /settings
- Activating a review cycle should trigger "Cycle Started" emails

Investigate first, do NOT patch blindly:
1) When activating a cycle, confirm notification trigger runs (add/verify logs).
2) Confirm EMAIL_SERVICE_KEY and EMAIL_FROM are loaded at runtime.
3) Confirm recipient query returns users (same company_id, not empty, not excluding everyone).
4) Confirm preference keys match between UI saved data and backend checks.
5) Ensure resend send errors are logged and surfaced.

Deliverable:
- A short diagnosis report with the exact reason emails aren’t sent.
- Then implement the smallest fix to get "Cycle Started" emails showing in Resend dashboard.

P1: UI navigation gaps
- No Settings icon/link anywhere to reach /settings
- On /settings page there is no obvious way back to dashboard
- On /admin/review-cycles page there is no way back to dashboard

Fix:
- Add a Settings link (gear icon) to dashboard navbar/sidebar
- Ensure /settings and /admin/review-cycles use the same dashboard layout and navigation
- Add breadcrumb or "Back to Dashboard" button

P2: Workflow builder validation
- Review cycle workflow allows more than 3 steps
- Multiple steps can be "Self Review" simultaneously
Decide rules:
- Enforce max steps (if required)
- Prevent duplicate "Self Review" steps (recommended)
Implement UI validation + backend validation (if needed) but keep minimal.

Do fixes in order: P0 -> P1 -> P2
``