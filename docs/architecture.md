<!-- # Architecture

Answer each of these, in your own words, once the system has taken real shape.

- What are the moving pieces, and how do they talk to each other?
- Where does each piece run?
- What is the request path for one representative user action, end to end?
- What did you decide *not* to build, and why? -->

# Architecture

The application uses a modular monolith architecture. The frontend, backend,
and database are separate pieces, but the backend is deployed as one
application rather than as multiple microservices.

## Moving pieces

The main pieces are:

- React frontend for the user interface.
- Node.js/Express backend for API endpoints and business logic.
- PostgreSQL database for persistent application data.

The frontend communicates with the backend through HTTP/JSON APIs. The
backend validates requests, performs authorization and business rules, and
uses the database layer to read and write PostgreSQL data.

Inside the backend, functionality is separated into domain-oriented modules
such as authentication, units, maintenance, rent, and dashboard/reporting.

The backend uses a service layer for business rules and a repository/data
access layer for database operations.

## Where each piece runs

The React frontend runs as the client application.

The Node.js/Express backend runs as the server-side application and exposes
the API.

PostgreSQL runs as the application's persistent database.

For the current version, these are intentionally kept simple and do not
require separate microservices, a message broker, Redis, or a caching layer.

## Representative request path

For example, when a manager records a rent payment:

1. The manager submits the payment from the React frontend.
2. The frontend sends an authenticated HTTP request to the backend.
3. The backend authenticates the user and verifies that the user has the
   manager role.
4. The rent service validates the unit, month, and amount.
5. The service uses the repository/data-access layer to write the payment to
   PostgreSQL.
6. PostgreSQL enforces database-level constraints and commits the transaction.
7. The backend returns the result to the frontend.
8. The frontend updates the rent view using the returned result.

Bulk rent recording follows the same path but processes the supplied units
and amounts within a transactional operation so that the result can report
the outcome for each unit.

## What we decided not to build

We deliberately chose not to use microservices, Redis/cache, or a message
broker. The application is small enough that introducing these components
would add operational and development complexity without solving a current
requirement.

We also do not have a separate tenant portal, payment gateway, notification
service, or lease-management module in the required scope.

Tenants are represented only by their current name on a unit, because they
do not authenticate or perform actions in the required application.

Rent alerts are derived from rent/payment state rather than being stored as
a separate alert entity.

The system records rent payments rather than processing the actual financial
transaction through a payment provider.