# Decisions

## Decision 1

- **Chose:** A modular monolith using Node.js/Express with domain-oriented backend modules.
- **Rejected:** Splitting the system into separate microservices for authentication, units, maintenance, rent, and dashboard functionality.
- **Why:** The application has a relatively small scope and a single backend is easier to develop, test, deploy, and maintain. Domain separation inside the monolith still keeps the code organized without introducing service-to-service communication, separate deployments, or additional infrastructure.

## Decision 2

- **Chose:** HTTP-only authentication cookies with the JWT stored in the cookie, with the frontend sending requests using credentials.
- **Rejected:** Storing the JWT in browser localStorage/sessionStorage and manually attaching it to API requests.
- **Why:** An HTTP-only cookie prevents client-side JavaScript from directly reading the token and gives the browser responsibility for sending it with authenticated requests. This also keeps authentication state separate from application state and avoids exposing the JWT through frontend storage APIs.

## Decision 3

- **Chose:** Enforce roles and permissions on the backend, in addition to hiding unauthorized UI actions in the frontend.
- **Rejected:** Relying only on frontend route protection and hiding buttons/actions for unauthorized users.
- **Why:** Frontend restrictions are only a user-interface concern and can be bypassed by calling the API directly. Server-side authorization ensures that contractor restrictions remain enforced even when requests are made outside the frontend. For example, contractors cannot create or modify units, assign other contractors, or access rent information through the API.

## Decision 4

- **Chose:** Model maintenance contractor assignments using a separate `maintenance_assignments` relationship, allowing multiple contractors per maintenance request.
- **Rejected:** Storing only one contractor ID directly on the maintenance request.
- **Why:** The requirements allow any number of contractors to work on the same request, while a contractor can also be assigned to many requests. A separate relationship table represents this many-to-many relationship cleanly and also makes adding and removing individual contractors straightforward.

## Decision 5

- **Chose:** Implement the maintenance lifecycle as explicit server-side state transitions:
  `REPORTED → TRIAGED → SCHEDULED → RESOLVED`, with `RESOLVED → TRIAGED` allowed for reopening.
- **Rejected:** Allowing users to freely change the status to any lifecycle state.
- **Why:** The workflow has business rules that depend on the current state. In particular, a request cannot become `SCHEDULED` without an assigned contractor, and invalid transitions must be rejected by the server. Centralizing these rules in the backend prevents the UI from becoming the only source of workflow enforcement.

## Decision 6

- **Chose:** Implement maintenance history as immutable timeline events rather than allowing users to edit historical records.
- **Rejected:** Updating a single "last modified" record or allowing maintenance history entries to be edited/deleted.
- **Why:** The assignment requires an immutable history of creation, status changes, contractor assignments/unassignments, and notes. Recording each action as a separate event preserves the audit trail and makes it possible to determine who performed an action and when.

## Decision 7

- **Chose:** Perform maintenance request search, filtering, sorting, and pagination on the server.
- **Rejected:** Loading all maintenance requests into the frontend and filtering/sorting them in React.
- **Why:** The backend can apply the filters and pagination directly to the database query, return only the required page, and calculate the total number of matching records. This keeps the frontend simpler and avoids transferring unnecessary data as the number of requests grows.

## Decision 8

- **Chose:** Represent rent alerts as derived from the current month's rent/payment state, while storing only dismissal records.
- **Rejected:** Creating a permanent alert record every time a unit becomes overdue.
- **Why:** Whether a unit is overdue can be calculated from its monthly rent, payment amount, current month, and grace period. Storing every generated alert would duplicate state that already exists in the rent data. A separate dismissal record is sufficient to remember that a manager dismissed a specific unit/month alert.

- **Later reversed:** The initial implementation treated a dismissal as temporary and hid the alert only for a limited period. We changed this to a permanent dismissal for that specific `unit + rent_month`.
- **Why the decision changed:** The requirement says the manager can dismiss an alert and that it should return in a later month if the rent is still unmatched. Permanent dismissal for the current `unit + rent_month` models this requirement more directly: dismissing September's alert does not cause September's alert to reappear, while October is evaluated independently.