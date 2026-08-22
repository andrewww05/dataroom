## ADDED Requirements

### Requirement: Sign-in and Sign-up UI
The client application must provide forms for users to authenticate or create new accounts.

#### Scenario: FR-AUTH-010 Sign-in validation and feedback
- **WHEN** the user submits the sign-in form with invalid credentials
- **THEN** the UI displays an appropriate error message and retains the inputted email.

#### Scenario: FR-AUTH-020 Sign-up validation and feedback
- **WHEN** the user submits the sign-up form with an existing email or invalid password
- **THEN** the UI displays the respective validation errors.

#### Scenario: FR-AUTH-030 Client-side session persistence
- **WHEN** the user successfully authenticates
- **THEN** the client stores the JWT securely (in a token file/memory) and redirects the user to the application home.
