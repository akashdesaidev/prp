# Organization Structure Module

This document summarizes the API endpoints, data models, and frontend routes that implement the Organization Structure feature.

## Backend

### Models
* **Department**: `{ _id, name, description, parent }`
* **Team**: `{ _id, name, description, department, lead }`
* **User** (extended): `{ department, team, manager }`

### Key Endpoints
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/org/tree` | Returns nested structure of departments → teams → users |
| POST | `/api/departments` | Create department |
| POST | `/api/teams` | Create team |
| POST | `/api/users/bulk` | Bulk user import |
| PATCH | `/api/users/:id/manager` | Update user’s manager / dept / team |

(Plus standard CRUD routes for departments, teams, users.)

## Frontend

| Route | Component | Notes |
| ----- | --------- | ----- |
| `/org` | `OrgChart` | ReactFlow visualization with click-through to details |
| `/departments` | `DepartmentTable` |
| `/teams` | `TeamTable` |
| `/import` | `BulkImport` CSV uploader |
| `/departments/[id]` | Department detail page |
| `/teams/[id]` | Team detail page |

Breadcrumb navigation connects pages; sidebar contains links to all.

## Tests
Integration tests under `backend/tests/*` cover:
1. CRUD for departments & teams.
2. Bulk user import and manager assignment.
3. `/api/org/tree` hierarchy.

Frontend unit tests in `frontend/__tests__/*` verify component behaviour.

Run all tests:
```bash
# backend
npm test --prefix backend
# frontend
npm test --prefix frontend
```

---
Last updated: 2025-06-14
