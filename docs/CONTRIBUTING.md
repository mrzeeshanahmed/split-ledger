# Contributing to Split-Ledger

Thank you for your interest in contributing!

## Branch Naming

- `feature/ZEE-XX-description` - New features
- `fix/ZEE-XX-description` - Bug fixes
- `chore/ZEE-XX-description` - Maintenance tasks
- `docs/ZEE-XX-description` - Documentation updates

## Commit Format

We follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(auth): add JWT refresh token rotation
```

## Pull Request Process

1. Create a branch from `main`
2. Make your changes
3. Ensure tests pass and coverage meets threshold
4. Submit PR using the PR template
5. Request review from maintainers
6. Address review feedback
7. Squash and merge when approved

## Code Style

- Run `npm run lint` before committing
- Run `npm run typecheck` to catch type errors
- Write tests for new functionality
- Update documentation as needed
