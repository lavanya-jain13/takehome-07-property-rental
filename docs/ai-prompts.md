# AI prompts

AI was used as an engineering assistant throughout the implementation. I used it
for architecture discussions, implementation guidance, debugging, security
review, test-case generation, and UI improvements. I did not treat generated
code as automatically correct; generated changes were reviewed against the
assignment requirements and tested before being kept.

## Project architecture and implementation planning

### Prompt

"Help me design the architecture for a property rental and maintenance system
with manager and maintenance contractor roles. The backend should use
Express, Knex and PostgreSQL, and the frontend should use React and TypeScript.
Break the system into logical modules and explain where authentication,
authorization, units, maintenance, rent, dashboard, and history should live."

### What I got

The response proposed a modular monolith with separate domain-oriented
backend modules and a React frontend communicating with the backend through
HTTP APIs. It also suggested separating business logic from database access
through service and repository layers.

### What I corrected

I kept the modular-monolith approach but adapted the structure to the existing
codebase instead of following the suggested structure blindly. The final
implementation was kept intentionally simple because the assignment did not
justify microservices, Redis, or a message broker.

## Authentication and role-based authorization

### Prompt

"Review the manager and contractor requirements and design server-side
authorization rules. Contractors must only access requests assigned to them,
cannot create units, cannot assign contractors, and cannot access rent
information. Make sure the restrictions cannot be bypassed by directly calling
the API."

### What I got

The response identified the need for authentication middleware followed by
role-based authorization middleware and recommended enforcing permissions at
the API level rather than relying only on frontend visibility.

### What I corrected

I applied the rules to the actual API routes and also added frontend route and
navigation restrictions for a better user experience. I then tested the
restricted endpoints directly to verify that hiding a UI action was not the
only protection.

## Maintenance lifecycle and business rules

### Prompt

"Implement a server-side maintenance request lifecycle:
REPORTED -> TRIAGED -> SCHEDULED -> RESOLVED, with RESOLVED allowed to reopen
to TRIAGED. Reject every other transition and return an explanatory error.
SCHEDULED must require at least one assigned contractor."

### What I got

The response provided a transition-based approach where valid states are
explicitly defined instead of allowing arbitrary status updates.

### What I corrected

I integrated the transition rules with the actual assignment model and
authorization rules. I also verified that an unassigned request cannot move
to SCHEDULED and that contractors cannot change statuses for requests that are
not assigned to them.

This resulted in server-side lifecycle enforcement rather than relying on
the frontend status controls.

## Maintenance search, filtering and pagination

### Prompt

"Design server-side search, filtering, sorting and pagination for maintenance
requests. Search should match request descriptions, filters should support
unit, status, contractor and priority, sorting should support created date,
priority and status, and the response should include total matching records."

### What I got

The response suggested constructing the database query from validated query
parameters and returning the requested page together with the total count.

### What I corrected

I restricted the accepted sort fields and sort directions instead of passing
arbitrary client input directly into the query. I also made the sorting
deterministic by adding a stable tie-breaker and ensured contractor queries
remain limited to requests assigned to that contractor.

## Immutable maintenance history

### Prompt

"Design an immutable maintenance history/timeline for request creation,
status changes, contractor assignment and unassignment, and notes. Every
event should record the actor and timestamp, and historical events should not
be editable or deletable."

### What I got

The response recommended an append-only event/timeline model instead of
overwriting previous history.

### What I corrected

I mapped the suggested event model to the application's actual database and
API structure. The final implementation records request creation, status
changes with old/new values, contractor assignments/unassignments, and notes.
There is intentionally no update or delete operation for history records.

## Rent management and bulk processing

### Prompt

"Design rent payment handling for individual and bulk payments. Each unit has
monthly rent, payments belong to a unit and month, and bulk processing should
classify each row as matched, underpaid, overpaid, or unmatched. Prevent
duplicate monthly payments."

### What I got

The response proposed validating each row against the unit's monthly rent and
using a transaction for the bulk operation.

### What I corrected

I adapted the classification and duplicate handling to the actual database
constraints and API response format. The final rent workflow also exposes the
result for each submitted unit so the manager can see which rows matched,
were underpaid, overpaid, or could not be matched.

## Rent alerts and grace-period logic

### Prompt

"Implement manager-only rent alerts after the configured rent grace period.
An alert should appear when the current month's rent is still unpaid or
underpaid. Managers should be able to dismiss an alert, and it should appear
again for a later month if the rent is still unmatched."

### What I got

The response implemented grace-period calculation and derived overdue alerts
from the current month's rent and payment state. It also introduced a
unit/month dismissal record.

### What I corrected

The first implementation treated dismissal as temporary and hid a dismissed
alert only for a limited period. This did not match the intended behavior.

I changed the logic so that dismissal is permanent for the specific
`unit + rent_month`. A later month is evaluated independently, so dismissing
one month's alert does not suppress a future month's alert.

**Later correction:** This was an important example of why generated code was
reviewed against the actual requirement instead of being accepted unchanged.

## AI-generated code error caught during implementation

### Prompt

"Improve the login page with a polished split-screen design, feature
highlights, icons and responsive mobile layout."

### What I got

The generated implementation introduced the desired visual structure, but one
of the generated imports incorrectly treated `FormEvent` as if it came from
`lucide-react`.

### What I corrected

I corrected the import so that `FormEvent` comes from React while the visual
icons continue to come from `lucide-react`. I then ran the frontend build to
verify that the corrected implementation compiled successfully.

This was a useful example of treating AI output as a draft that still needs
normal TypeScript/compiler validation.

## Debugging and iterative UI refinement

### Prompt

"The login page has an unwanted white block/background in the blue showcase
area after adding the new branding. Identify the likely CSS issue and suggest
the smallest safe fix without changing the existing layout."

### What I got

The response identified that the recently added experimental layout overrides
were affecting the showcase container and suggested simplifying the
overrides.

### What I corrected

Rather than continuously adding more CSS overrides, I removed the experimental
rules and retained only the required logo sizing styles. This restored the
original layout while keeping the new branding.

## Final security and functionality review

### Prompt

"Review the implemented property rental system against the assignment
requirements. Create a verification checklist covering manager permissions,
contractor isolation, maintenance lifecycle transitions, immutable history,
rent calculations, bulk rent, dashboard metrics, rent alerts, and session
persistence. Focus on server-side enforcement and edge cases."

### What I got

The response produced a requirement-oriented verification checklist and
highlighted cases that should be tested directly through the API rather than
only through the UI.

### What I corrected

I used the checklist as a final QA pass and tested both normal workflows and
negative cases. Temporary test data created during API verification was also
identified for cleanup before submission.

## How AI was used overall

AI was primarily used to accelerate development rather than replace
engineering decisions. The workflow was iterative:

1. Define the requirement and constraints.
2. Ask AI for an implementation/design approach.
3. Adapt the suggestion to the existing codebase.
4. Implement the change.
5. Run the application, build, or API tests.
6. Review failures and edge cases.
7. Correct the generated implementation where necessary.
8. Keep only changes that matched the assignment requirements.

The most useful role of AI was therefore not simply generating code, but helping
break complex requirements into implementable pieces, identifying edge cases,
reviewing authorization boundaries, and speeding up debugging and verification.