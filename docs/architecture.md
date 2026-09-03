# Architecture

## What are the moving pieces, and how do they talk to each other?

The application is built as a modular monolith with three main pieces:

- **React + TypeScript frontend** — provides the user interface and handles
  user interactions.
- **Node.js + Express backend** — exposes HTTP/JSON APIs and contains
  authentication, authorization, validation, and business logic.
- **PostgreSQL database** — stores persistent application data such as users,
  units, maintenance requests, contractor assignments, rent payments,
  timeline events, and rent-alert dismissals.

The frontend communicates with the backend through HTTP/JSON API requests.
Authentication is handled using an HTTP-only cookie. The backend authenticates
the request, checks the user's role and permissions, applies the relevant
business rules, and then reads or writes data through the database access
layer.

The backend is organized into domain-oriented modules such as authentication,
users, units, maintenance, rent, dashboard, and rent alerts. Within these
modules, services handle business rules while repositories/data-access code
handles database operations.

---

## Where does each piece run?

The **React frontend** runs as the client-side application in the user's
browser. It is responsible for rendering pages, forms, navigation, and
displaying API results.

The **Node.js/Express backend** runs as the server-side application. It
provides the API endpoints and is responsible for authentication,
authorization, validation, and enforcement of business rules.

The **PostgreSQL database** runs as the persistent data store. It maintains
the relational data and enforces structural constraints such as primary keys,
foreign keys, unique constraints, required fields, and valid values.

For the current application, these pieces are intentionally kept simple.
The backend is a single deployable application rather than multiple
microservices. Redis, a message broker, and a separate caching layer are not
required for the current scale and scope.

---

## What is the request path for one representative user action, end to end?

A representative example is a **manager recording a rent payment**.

1. The manager enters the unit, month, and payment amount in the React
   frontend.

2. The frontend sends an authenticated HTTP request to the rent API.

3. The backend authenticates the request using the HTTP-only authentication
   cookie.

4. The backend verifies that the authenticated user has the `MANAGER` role.

5. The rent service validates the supplied unit, payment month, and amount
   and applies the relevant rent business rules.

6. The service calls the repository/data-access layer to interact with
   PostgreSQL.

7. PostgreSQL enforces database-level constraints such as foreign keys,
   unique `(unit_id, payment_month)` records, and valid numeric values.

8. The backend returns the result of the operation as a JSON response.

9. The React frontend receives the response and updates the rent view.

For bulk rent recording, the same request path is used, but the backend
processes the submitted rows as a transactional operation and returns a
result for each row, including classifications such as matched, underpaid,
overpaid, or unmatched.

---

## What did you decide not to build, and why?

We deliberately chose not to build several components that were not necessary
for the required application:

- **Microservices** — the application is small enough that separate services
  would add deployment and communication complexity without providing a
  meaningful benefit.
- **Redis or a caching layer** — the current data volume and request patterns
  do not require caching infrastructure.
- **Message broker/background processing** — the required workflows can be
  handled synchronously by the backend.
- **Tenant portal** — tenants do not authenticate or perform actions in the
  required system, so a separate tenant-facing application was unnecessary.
- **Payment gateway** — the requirement is to record rent payments, not to
  process real financial transactions.
- **Full lease-management module** — lease lifecycle management is outside the
  required scope.
- **External notification service** — rent alerts are derived from rent and
  payment state and displayed inside the application.

We also chose not to store derived rent-alert records. Instead, overdue
alerts are calculated from the unit's rent, payment state, current rent
month, and grace period. A separate dismissal record is stored only when a
manager dismisses an alert for a particular unit and month.

These decisions kept the system focused on the required workflows while
avoiding infrastructure that would add complexity without being needed for
the assignment.