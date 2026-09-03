# Plan

## How we broke the work into sessions

The work was divided into focused implementation sessions rather than trying to build the entire application at once.

The main sessions were:

1. **Project setup and architecture**
   - Set up the React frontend, Express backend, PostgreSQL database, and Knex.
   - Established the backend module structure and API communication.

2. **Authentication and role-based access**
   - Implemented login, logout/session handling, authentication middleware, and manager/contractor authorization.
   - Added frontend route and navigation restrictions.

3. **Units and rent foundation**
   - Built unit creation, editing, archiving, and restoration.
   - Added rent-related data structures and basic payment recording.

4. **Maintenance management**
   - Implemented maintenance request creation and editing.
   - Added priorities, contractor assignments, status lifecycle, and contractor-specific access.

5. **Maintenance search and audit history**
   - Added server-side search, filters, sorting, and pagination.
   - Added immutable maintenance timeline/history for status changes, assignments, notes, and request creation.

6. **Rent management**
   - Implemented individual payments, bulk rent recording, rent roll, payment status classification, payment history, and CSV export.

7. **Dashboard and rent alerts**
   - Added dashboard metrics and maintenance/rent reporting.
   - Implemented overdue rent alerts, grace-period logic, dismissal, and the navigation alert count.

8. **UI polish and final verification**
   - Improved the login page, navigation, rent pages, and overall presentation.
   - Tested manager and contractor permissions, lifecycle rules, session persistence, rent workflows, and alert behavior.
   - Cleaned up implementation issues found during testing.

## What order we built in, and why

We started with the application foundation before implementing individual business features. Authentication and authorization were implemented early because almost every major feature has role-specific permissions.

Units were built before maintenance because maintenance requests belong to units. Once the unit model and access rules were established, maintenance functionality could build on top of it.

Maintenance was then implemented in stages: first request creation and assignment, followed by the lifecycle rules, search/filtering, and immutable history. This order allowed the more complex workflow and audit requirements to be added on top of a working request model.

Rent functionality was implemented after the core unit and authorization flows because payments depend on units and monthly rent values. Bulk rent recording, rent-roll reporting, and CSV export were added after individual payment recording was working.

The dashboard and rent alerts were implemented after the underlying maintenance and rent data were available. This allowed both features to derive their information from the existing application state rather than creating duplicate data.

Finally, the UI was polished and the complete system was tested across both roles.

## What we estimated versus what it actually took

The initial expectation was that the basic CRUD functionality would take most of the implementation effort, with the remaining time used for UI polish and testing.

In practice, the core CRUD work was relatively straightforward. More time than initially expected went into the business rules and edge cases, particularly:

- Server-side role enforcement.
- Maintenance lifecycle validation.
- Contractor assignment restrictions.
- Server-side maintenance search, filtering, sorting, and pagination.
- Immutable maintenance history.
- Bulk rent classification and validation.
- Rent grace-period and alert behavior.
- Session persistence across page refreshes.
- Final UI and integration testing.

The project therefore took longer than a simple CRUD implementation would have, but this was mainly because the required business rules and security constraints needed to be enforced consistently on both the API and frontend.

## What we cut when we ran short

We prioritized the required functionality over optional infrastructure and stretch features.

We did not build:

- Microservices or a distributed backend.
- Redis or a separate caching layer.
- A message broker or background job system.
- A tenant-facing portal.
- Online payment gateway integration.
- A separate notification delivery service.
- Full lease-management functionality.

These were outside the core assignment requirements or would have added significant infrastructure without improving the required workflows.

The implementation instead focused on making the required manager and contractor workflows complete, enforcing authorization on the server, preserving maintenance history, and providing the required rent and dashboard reporting.