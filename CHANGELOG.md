# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Multi-Tenant Architecture**: Base database isolation schema leveraging PostgreSQL connection pooling dynamic `search_path` assignments.
- **Tenant Provisioning**: Real-time tenant creation duplicating the `tenant_template` schema structure for isolated data management securely.
- **Auth Service**: User registration and login utilizing secure JWTs and generic token invalidation via Redis.
- **API Keys**: Implemented `requireAuthOrApiKey` middleware authorizing programmatical backend access based on tenant ID.
- **Webhooks**: Built Outgoing Webhooks Service for triggering programmatic callbacks including retry queues and delivery metrics tracing.
- **Analytics Service**: Track Monthly Recurring Revenue (MRR), Active Customer Subscriptions, Customer Churn Rate, and Endpoint request analytics metrics.
- **Security Checklists**: Configured API endpoint throttling limits and cookie injection vulnerabilities mitigations.

### Changed
- Refactored UI logic to implement a responsive analytics dashboard querying backend metrics reliably.
- Altered testing strategy (`vitest.config.ts`) dropping global parallel execution in favor of strict sequential runs mitigating database race condition teardowns.

### Fixed
- Fixed unhandled asynchronous promise rejections crashing middleware chains when verifying unrecognized API Keys.
- Restored testing suite consistency by rectifying Express payload schema validation expectation values across reset password actions.

## [1.0.0] - Planned Initial Architecture Release
- Foundation layers created and initial system architecture sketched out.
