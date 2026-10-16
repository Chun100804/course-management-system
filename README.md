# course-management-system

Fullstack Course Management System | React, TypeScript, Node.js, Express, MongoDB, Mongoose, JWT Authentication &amp; Role-Based Access Control.

## Workspace

This repository uses npm workspaces. Install dependencies from the repository root with `npm install`, then use `npm run dev` to start the web and API workspaces.

- `apps/web`: React, TypeScript, Vite client.
- `apps/api`: Express, TypeScript, Mongoose API.
- `packages/shared`: browser- and Node-compatible shared types, constants, and schemas.
- `docs`: architecture, database, API, and screenshot artifacts.

Copy `apps/api/.env.example` to `apps/api/.env` and set `MONGODB_URI` before starting the API. The scaffold does not include implemented product features yet.
