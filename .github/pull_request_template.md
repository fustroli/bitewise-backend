## Summary

<!-- What does this PR change, and why? -->

## Related issue

<!-- e.g. Closes #123 -->

## Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Docs / chore
- [ ] Build / deploy

## How to test

<!-- Steps, requests, or commands a reviewer can use to verify. -->

## Checklist

- [ ] `npm run lint` and `npm run build` pass
- [ ] Tests added/updated; `npm run test` failures (if any) also fail on `main`
- [ ] Relative imports use explicit `.js` extensions (ESM)
- [ ] New entity relations wrapped in `Relation<T>`
- [ ] Ownership checks on mutating/deleting endpoints
- [ ] Responses go through serializers, not raw entities
- [ ] Env values read via `src/config`, not `process.env`
- [ ] Swagger decorators updated for new/changed endpoints
- [ ] DB schema changes noted below (deploy impact)

## Deploy notes

<!-- Schema changes, new env vars, infra changes. Delete if none. -->
