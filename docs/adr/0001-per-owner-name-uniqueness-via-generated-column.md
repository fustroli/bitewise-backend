---
status: accepted
---

# Per-Owner name uniqueness via a generated `activeName` column

Owned resources (Ingredient, Meal, Meal plan) must have unique names among their Owner's non-deleted resources, but they are soft-deleted, and MySQL has no partial indexes. We enforce it in the database with a stored generated column `activeName = IF(deleteTimeStamp IS NULL, name, NULL)` and a unique index on `(user_id, activeName)`; MySQL treats NULLs as distinct, so soft-deleted rows never collide and their names become reusable. Duplicate-key errors are mapped to 409 by a global exception filter.

## Considered Options

- **Unique index on `(user_id, name)`**: blocks reusing the name of a soft-deleted resource.
- **Unique index on `(user_id, name, deleteTimeStamp)`**: active rows all have NULL `deleteTimeStamp`, and NULLs are distinct, so active duplicates slip through.
- **App-level check-then-insert** (the previous approach): races under concurrent writes and must be repeated on every write path. Remains the fallback if TypeORM `synchronize` can't keep the generated column stable (it has a history of re-diffing generated columns); an integration test guards this.

The same pattern enforces User sign-in email uniqueness (`activeEmail`), so a deleted account's email can sign up again.

See fustroli/bitewise-backend#18.
