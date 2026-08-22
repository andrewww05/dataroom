## Purpose

Ensures the Data Room MVP is robust by executing comprehensive end-to-end tests across the core user flows on a real running instance.

## ADDED Requirements

### Requirement: E2E Test Coverage for Core Flows
The system SHALL provide an automated end-to-end test suite that verifies the happy paths and critical failure paths of the core MVP flows.

#### Scenario: FR-TEST-010 E2E Core Flow (Upload to Revoke)
- **WHEN** the E2E test suite executes the core user flow
- **THEN** it successfully uploads a file, lists the directory, moves the file, shares the file, and revokes the share.

#### Scenario: BR-020 e2e prevents duplicate file uploads
- **WHEN** the E2E test suite attempts to upload a file with the same name as an existing file
- **THEN** the system successfully appends a suffix to the file name and avoids a conflict.

#### Scenario: BR-060 e2e verifies transactional operations
- **WHEN** the E2E test suite attempts to write a node but fails
- **THEN** the associated blob is not stored.

#### Scenario: BR-070 e2e checks capability-based authorization
- **WHEN** a principal attempts an action without the proper capability
- **THEN** the request fails with a 404 NOT_FOUND.
