# Changelog

## [2.0.0] - 2026-02-08

### Added

- Health check methods: `isConnected()` and `healthCheck()`
- `SequelizeHealthCheckResult` interface for detailed health status
- Specific error classes from `@storehouse/core` (`ManagerNotFoundError`, `InvalidManagerConfigError`, `ModelNotFoundError`)
- Comprehensive JSDoc documentation for all public APIs
- Instance check for `getConnection()` to ensure returned connection is a Sequelize instance

### Updated

- Dependencies updated to their latest versions
- README documentation

[Unreleased]: https://github.com/kisiwu/storehouse-sequelize/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/kisiwu/storehouse-sequelize/releases/tag/v2.0.0