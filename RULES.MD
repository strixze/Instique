# AI DEVELOPMENT RULES

## 1. NEVER DELETE EXISTING CODE

- AI must NEVER delete existing files, components, functions, APIs, routes, database models, features, or logic.
- Existing code must be preserved unless the user explicitly gives permission to delete it.
- Do not "clean up" or remove code just because it appears unused.
- Do not remove old implementations when creating a new implementation.
- If something appears incorrect, keep it and report the issue instead of deleting it.

## 2. AI CAN CREATE

AI is allowed to create:

- New files
- New folders
- New components
- New APIs
- New services
- New models
- New database fields
- New utilities
- New tests
- New documentation

New code must follow the existing project architecture and conventions.

## 3. NEVER OVERWRITE WITHOUT PERMISSION

- Do not replace an existing file completely.
- Do not rewrite an existing component from scratch.
- Do not replace existing functionality with a new implementation.
- Modify existing code minimally when necessary.
- Preserve all existing functionality while adding the requested functionality.

## 4. NEVER REMOVE FEATURES

- Do not remove existing features.
- Do not disable existing functionality.
- Do not remove routes.
- Do not remove API endpoints.
- Do not remove database fields or models.
- Do not remove UI elements.

If a feature needs to change, add the new behavior while preserving the existing behavior unless the user explicitly requests removal.

## 5. NEVER CHANGE UNRELATED CODE

Only modify files and code directly related to the requested task.

Do not make unrelated:
- Refactors
- UI redesigns
- Dependency changes
- Database changes
- Architecture changes
- Naming changes

## 6. PRESERVE EXISTING DATA

- Never delete database data.
- Never drop collections/tables.
- Never truncate databases.
- Never remove production records.
- Never write destructive migrations.
- Never reset the database unless explicitly instructed by the user.

## 7. NO DESTRUCTIVE COMMANDS

AI must NOT execute destructive commands such as:

```bash
rm -rf
git reset --hard
git clean -fd
DROP DATABASE
DROP TABLE
DROP COLLECTION
TRUNCATE