# Property Rental & Maintenance System — Submission

## Links

- **GitHub repository:** https://github.com/lavanya-jain13/takehome-07-property-rental
- **Live application:** https://takehome-07-property-rental.vercel.app
- **Backend API:** https://takehome-07-property-rental.onrender.com

## Notes for the reviewer

The application is a role-based Property Rental & Maintenance system with
separate workflows for managers and maintenance contractors.

For the best evaluation experience, start with the manager account to explore
the full application. The contractor accounts demonstrate the restricted
maintenance workflow and server-side access controls.

The application uses session-based authentication through an HTTP-only cookie.
The frontend and backend are deployed as separate applications, with the
frontend hosted on Vercel and the backend hosted on Render.

The production database is PostgreSQL hosted on Supabase.

### Demo Credentials

All demo accounts use the password:

`Password123!`

**Manager**
- Email: `manager@example.com`
- Password: `Password123!`

**Contractors**
- Email: `contractor@example.com`
- Password: `Password123!`
- Email: `priya.contractor@example.com`
- Password: `Password123!`
- Email: `rahul.contractor@example.com`
- Password: `Password123!`

The demo data includes maintenance requests assigned to different contractors, including requests with multiple contractors assigned.

> These credentials are provided specifically for evaluation of the deployed
> application.

### Rent Alerts Demo Note

Rent Alerts follow the configured rent policy: rent is due on the 1st of each month with a 5-day grace period. Therefore, for the September 2026 rent cycle, overdue alerts become visible starting September 7, 2026.

The demo data includes:
- DEMO-102: partial September rent payment (underpaid)
- DEMO-104: no September rent payment (unpaid)

These units will appear in Rent Alerts once the September grace period expires.

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React, TypeScript, Vite, Lucide React | Component-based UI with type safety and fast development |
| Backend | Node.js, Express, Knex | Lightweight API server with modular business logic and database access |
| Database | PostgreSQL, Supabase | Relational data model, constraints, transactions, and reliable persistence |
| Authentication | HTTP-only cookies, JWT | Secure session handling without exposing authentication tokens to client-side JavaScript |
| Frontend Hosting | Vercel | Simple and reliable deployment for the React/Vite application |
| Backend Hosting | Render | Simple deployment for the Node.js/Express API |
| Database Hosting | Supabase | Managed PostgreSQL database suitable for the application's relational workload |

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

## Security and authorization

Authorization is enforced on the backend rather than relying only on
frontend route visibility.

Managers can:

- Manage units
- Archive and restore units
- Create and manage maintenance requests
- Assign and remove contractors
- Record individual and bulk rent payments
- View rent information
- View rent alerts
- Access dashboard and reporting data

Contractors can:

- View maintenance requests assigned to them
- Create maintenance requests
- Edit maintenance request descriptions and priorities
- Update the lifecycle status of requests they are assigned to

Contractors cannot:

- Create, edit, archive, or restore units
- View rent information
- Record rent payments
- Assign or remove contractors
- Access manager-only dashboard and rent functionality

These restrictions are also enforced server-side, so directly calling protected
API endpoints does not bypass authorization.

## Maintenance workflow

Maintenance requests follow an explicit server-enforced lifecycle:

`REPORTED → TRIAGED → SCHEDULED → RESOLVED`

A request can also be reopened:

`RESOLVED → TRIAGED`

The backend rejects invalid state transitions and prevents a request from being
moved to `SCHEDULED` unless at least one contractor is assigned.

Maintenance history is append-only at the application level and records:

- Request creation
- Status changes with old and new status
- Contractor assignments
- Contractor removals
- Notes
- Acting user
- Timestamp

## Rent management

The rent module supports:

- Individual rent payment recording
- Bulk rent recording for a month
- Matched payments
- Underpaid payments
- Overpaid payments
- Unmatched payments
- Rent payment history
- Current rent roll
- CSV rent-roll export
- Grace-period-based rent alerts
- Manager dismissal of alerts

Rent alerts are associated with a specific `unit + rent_month`, allowing the
same unit to generate a new alert in a later month if the rent remains
unmatched.

## Search, filtering and pagination

Maintenance requests support server-side:

- Text search over request descriptions
- Unit filtering
- Status filtering
- Priority filtering
- Contractor filtering
- Sorting by creation time, priority, or status
- Pagination
- Total match count

Contractor results are additionally restricted server-side to requests assigned
to the authenticated contractor.

## Production deployment

The application is deployed as three separate components:

```text
                    ┌──────────────────────────┐
                    │          Vercel          │
                    │     React + TypeScript   │
                    │        Frontend          │
                    └────────────┬─────────────┘
                                 │
                              HTTPS
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │          Render          │
                    │      Node + Express      │
                    │        Backend API       │
                    └────────────┬─────────────┘
                                 │
                              PostgreSQL
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │         Supabase         │
                    │       PostgreSQL DB      │
                    └──────────────────────────┘


## How much time did you actually spend?

I did not track development time precisely, so I do not want to provide
an inaccurate number.

The time included implementation, debugging, integration testing, role-based
security verification, UI refinement, deployment, production configuration,
and final documentation.

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
