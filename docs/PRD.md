Performance Review System - Product Requirements Document

Scope 
A platform where companies can run performance reviews with custom questions and flexible workflows.



1. WHO USES THE SYSTEM
There are three Users:

Admin
- Sets up the company
- Creates review questions
- Starts review cycles
- Assigns who reviews who
- Sees everything in their company

Manager
- Reviews their team members
- Sees their team's scores
- Does their own self-review

Employee
- Does self-review
- Reviews peers (if assigned)
- Sees their own scores



2. HOW IT WORKS (THE FLOW)

Step 1: Admin sets up the company
1. Create company account
2. Add employees (manually or via Excel upload)
3. Create teams (optional)

Step 2: Admin creates review questions
Important: Different questions for different review types:
- Self-review questions (employee answers about themselves)
- Manager-review questions (manager answers about employee)
- Peer-review questions (peers answer about employee)

Step 3: Admin starts a review cycle
What they configure:
- Cycle name: "Q1 2024 Performance Review"
- Dates: March 1 - March 31
- Workflow steps (flexible):
  - Option A: Self first (March 1-15), then Manager (March 16-31)
  - Option B: Self + Manager + Peer all at once (March 1-31)
  - Option C: Manager first (March 1-15), then Self (March 16-31)
  - Any combination they want!

Step 4: Admin assigns reviewers
For each employee, assign:
- 1 or more managers (can have multiple!)
- 3-5 peers from the company

Example:
Aaron will be reviewed by:
- Managers: Jane Smith, Bob Williams
- Peers: Alice, Charlie, David

Step 5: Reviews happen
1. Self-Review: John fills out his self-review questions
2. Manager Reviews: Jane AND Bob each review John separately
3. Peer Reviews: Alice, Charlie, and David each review John
4. Everyone submits their reviews

Step 6: System calculates final score
Formula
Final Score = (Self Score + Average of Manager Scores + Average of Peer Scores) / 3

Example:
- John's self-rating: 4/5
- Jane's rating: 5/5
- Bob's rating: 4/5
- Manager average: 4.5/5
- Peer ratings: 4, 5, 4 → Average: 4.33/5

Final Score = (4 + 4.5 + 4.33) / 3 = 4.28/5


Step 7: Everyone sees results
- John sees his score and all the feedback
- Managers see their team's scores
- Admin sees company-wide analytics



3. KEY FEATURES

Multi-Company (Each company is isolated)
- Company A cannot see Company B's data
- Every table has `company_id` to separate data
- Users can only access their own company

Flexible Workflows
Admin decides:
- Which review types happen first
- Can multiple types happen at the same time?
- Start and end dates for each step

Example workflows:
Traditional:

Step 1: Self Review (March 1-15)
Step 2: Manager Review (March 16-25)
Step 3: Peer Review (March 26-31)


All at once:

Step 1: Self + Manager + Peer (March 1-31, all parallel)


Manager first:

Step 1: Manager Review (March 1-15)
Step 2: Self + Peer (March 16-31)


Multiple Managers
- An employee can have 2+ managers
- Each manager reviews independently
- System averages all manager scores

Peer Reviews
- Can be anonymous (employee doesn't see who wrote it)
- Or named (employee sees peer's name)
- Admin decides per company

Auto-Save
- Reviews save as drafts automatically
- Users can come back later to finish
- No data loss
4. REQUIREMENTS

FUNCTIONAL REQUIREMENTS
Multi-Tenant Company System
The system should support multiple companies operating independently within isolated environments.
Companies can self-register.
All company data is logically separated.
Admins manage users within their company only.
Role-based access control should support Admin, Manager, and Employee roles.


User & Team Management
Admins should be able to:
Create, edit, and deactivate employees.
Assign one or multiple managers to employees.
Assign multiple peer reviewers.
Upload bulk reviewer assignments via Excel.
Organize employees into teams.


Managers should be able to view their direct reports.
Employees should only see their own review data.
Review Cycle Engine
The system should support configurable performance review cycles.
Each cycle should store:
Start date
End date
Status (upcoming, active, completed)
Workflow configuration
Admins should be able to:
Create quarterly, half-yearly, annual, or custom cycles.
Control when each review phase opens and closes.
Define how review types flow (sequential or parallel).


Workflow should be flexible enough to support:
Self → Manager → Peer
Manager → Self
Self + Manager simultaneously
Any configurable order


Question Builder
Admins should be able to:
Create custom questions.
Choose question type (rating or text).
Assign questions to review types (self, manager, peer).
Reorder or edit questions.
Reuse questions across review cycles.

Review Submission Flow
When a review cycle is active:
Employees can complete self-reviews.
Managers can review assigned employees.
Peers can review assigned employees.
Reviews can be saved as draft before submission.
Admins can reopen submitted reviews.
Review status should track:Not started,Draft,Submitted
Scoring System
The system should:
Automatically calculate final scores when required reviews are completed.
Provide score breakdown by Review type or Question
Support configurable weighting if required.
Allow admin manual overrides with audit logs.


Reporting
Employees should be able to:
Track review progress
View final scores
Download their performance report
Managers should be able to:
View team performance
Export team-level reports
Admins should be able to:
View company-wide analytics
Track review completion progress
Export full review data


Notifications
The system should send email notifications for:
Review cycle start
Phase transitions
Submission reminders
Completion









NON-FUNCTIONAL REQUIREMENTS

Performance
- Page load time should remain under 2 seconds under typical load.
- Review submission latency should be under 500ms.
- Queries for analytics and scoring should be optimized for large datasets.

Scalability

-System architecture should support horizontal scaling.
-System should handle concurrent review submissions without data race conditions.
- Database indexing should support efficient filtering by:

Reliability 

- The system should provide high availability during active review cycles.
- Automated backups should run daily.
- Failure recovery time should be minimal.


Security

- Role-based access control enforced at API level.
- Users can only access data within their company.
- Sensitive data should be encrypted at rest and in transit.
- Authentication should follow industry standards (JWT/session-based).


Data Integrity

- Score calculations should be consistent and reproducible.
- Review submissions should be atomic.
- The system should prevent duplicate submissions.

Maintainability

- Codebase should follow modular architecture.
- Configuration should be externalized.
- The system should support adding new review types without schema redesign.

Usability
- UI should be easy -to-use for non-technical users.
- Core actions (submit review, configure cycle) should require minimal steps.
- Accessibility best practices should be considered.


5. WHO CAN SEE WHAT 

What Admins can see:
✅ All employees in their company
✅ All review questions
✅ All reviews (self, manager, peer)
✅ All scores
✅ Analytics for whole company
❌ Other companies' data

What Managers can see:
✅ Their own self-review
✅ Reviews they wrote about their team
✅ Their team members' final scores
✅ Team analytics
❌ Other teams' reviews
❌ Admin settings
❌ Who their peers are (for anonymous reviews)

What Employees can see:
✅ Their own self-review
✅ Their own final score
✅ Feedback from managers and peers
✅ Peer reviews (anonymized if setting is ON)
❌ Other employees' reviews
❌ Other employees' scores
❌ Raw data about who reviewed them (if anonymous)

Peer Review Privacy:
If Anonymous Mode = ON
- Employee sees: "Anonymous Teammate said: Great work!"
- Peers can't see each other's reviews
- Admin can see who wrote what

If Anonymous Mode = OFF:
- Employee sees: "Alice said: Great work!"
- Peers still can't see each other's reviews
- Admin can see everything



6. THE DATABASE 
Tables we need:

companies
- id, name, created_at

users
- id, company_id, name, email, password, role (admin/manager/employee), manager_id

teams (optional grouping)
- id, company_id, name

review_cycles
- id, company_id, name, start_date, end_date, status (draft/active/completed)

review_configs (the flexible workflow steps)
- id, review_cycle_id, step_number, review_type (self/manager/peer), start_date, end_date

questions
- id, company_id, review_type (self/manager/peer), text, max_chars

**reviews (each individual review)
- id, review_cycle_id, employee_id, reviewer_id, review_type (self/manager/peer), status (draft/submitted)

answers (answers to each question)
- id, review_id, question_id, rating (1-5 or null), text_answer

reviewer_assignments (NEW - who reviews who)
- id, review_cycle_id, employee_id, reviewer_id, reviewer_type (manager/peer)

7. USER STORIES

Admin Stories:
1. "As an admin, I want to add 50 employees via Excel so I don't have to type each one"
2. "As an admin, I want to create custom questions for my company values"
3. "As an admin, I want to configure the review workflow to start with manager reviews instead of self-reviews"
4. "As an admin, I want to assign 2 managers to John because he reports to both Jane and Bob"
5. "As an admin, I want to assign 4 peers to review John"
6. "As an admin, I want to see who hasn't submitted their reviews yet"
7. "As an admin, I want to export all review data to Excel"

Manager Stories:
1. "As a manager, I want to see all my direct reports who need reviews"
2. "As a manager, I want to see what John said in his self-review while I'm reviewing him"
3. "As a manager, I want to save my review as a draft and finish it tomorrow"
4. "As a manager, I want to see my team's average score"

Employee Stories:
1. "As an employee, I want to complete my self-review by answering custom questions"
2. "As an employee, I want to review my peers (Alice, Bob, Charlie)"
3. "As an employee, I want to see my final score and breakdown (self, manager, peer)"
4. "As an employee, I want to read the feedback my manager and peers gave me"
5. "As an employee, I want to download my performance report as PDF"

8. TECH STACK 

Frontend:
-NEXT js 
-Typescript


Backend:
- NestJS 
- PostgreSQL
- Prisma

Auth:
- Supabase Auth (handles login/signup)





9. VALIDATION RULES

When creating a review cycle:
-  Start date should be before end date
-  Step dates should fall within cycle dates
-  Can't have overlapping active cycles

When assigning reviewers:
-  Reviewer should be in the same company
-  Employee cannot review themselves
-  Can't assign the same person twice as peer

When submitting a review:
-  All required questions should be answered
-  Ratings should be 1-5
-  Text answers must respect max_chars limit

















notes:
Build Order:
1. Auth + multi-tenancy
2. Admin setup (employees, questions)
3. Review cycles + workflows
4. Review forms (self, manager, peer)
5. Scoring
6. Dashboards
7. Notifications
8. Polish


