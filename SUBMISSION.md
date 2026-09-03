# Submission

## Links

- **GitHub repository:** <public repo URL>
- **Live application:** <deployed URL>

## Notes for the reviewer

The application is a role-based Property Rental & Maintenance system with
separate workflows for managers and maintenance contractors.

For the best evaluation experience, start with the manager account to explore
the full application. The contractor account demonstrates the restricted
maintenance workflow and server-side access controls.

The application uses session-based authentication through an HTTP-only cookie.
The frontend and backend are separate applications and may be hosted
independently.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | <manager demo email> | <manager demo password> |
| Contractor | <contractor demo email> | <contractor demo password> |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React, TypeScript, Vite, Lucide React | Component-based UI with type safety and fast development |
| Backend | Node.js, Express, Knex | Lightweight API server with modular business logic and database access |
| Database | PostgreSQL | Relational data model, constraints, transactions, and reliable persistence |
| Hosting | <hosting platform(s)> | Simple deployment of the frontend, backend, and database |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Manager and contractor authentication with server-side role enforcement |
| 2 | Units and rent | Done | Unit CRUD, archive/restore, monthly rent, tenant information, and rent recording |
| 3 | Maintenance requests | Done | Request creation/editing, priorities, unit association, and contractor assignments |
| 4 | Maintenance lifecycle | Done | Server-enforced `REPORTED → TRIAGED → SCHEDULED → RESOLVED` lifecycle with reopening support |
| 5 | Contractor assignment | Done | Multiple contractors can be assigned to a request; contractors only access assigned requests |
| 6 | Finding requests | Done | Server-side search, filters, sorting, pagination, and total match count |
| 7 | Bulk rent | Done | Individual and bulk rent recording with matched, underpaid, overpaid, and unmatched results |
| 8 | Dashboard | Done | Open maintenance, overdue rent, resolved-this-week, collection metrics, and maintenance/reporting views |
| 9 | Immutable maintenance history | Done | Request creation, status changes, assignments, unassignments, and notes are recorded as timeline events |
| 10 | Rent alerts | Done | Grace-period-based overdue alerts, manager dismissal, navigation count, and month-specific alert handling |

## How much time did you actually spend?

<Add the actual total development time here.>

The time included implementation, debugging, integration testing, role-based
security verification, UI refinement, and final documentation.

## What would you do next, with another 12 hours?

With another 12 hours, I would focus primarily on production hardening and
additional polish rather than adding unrelated features.

- Add a more comprehensive automated integration/API test suite.
- Add stronger automated validation around maintenance lifecycle edge cases.
- Improve observability with structured server logging and error monitoring.
- Add more detailed loading, empty, and error states across the application.
- Optimize database queries and indexes based on realistic larger datasets.
- Improve deployment configuration and production environment validation.
- Add more comprehensive documentation and API examples.

## What are you least happy with in this codebase, and why?

The area I would improve first is the automated test coverage.

The core business rules are implemented and were manually verified, including
role restrictions, maintenance lifecycle transitions, contractor isolation,
rent calculations, and rent alerts. However, a larger automated test suite
would provide stronger protection against regressions as the application
evolves.

I would also spend more time on production-level observability and performance
testing if this were moving beyond the scope of the take-home assignment.