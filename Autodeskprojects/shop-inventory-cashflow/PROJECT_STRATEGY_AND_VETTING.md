# PROJECT_STRATEGY_AND_VETTING.md

> **Note:** This document should be reviewed in conjunction with `DECISIONS.md`, which contains the authoritative architectural and design decisions for this project.

## Part 1: Strategic Implementation Plan

This document outlines the strategic roadmap for developing the Shop Inventory & Cashflow Management web application, now incorporating SBP compliance and security hardening.

### 1.1 Phased Breakdown

| Phase | Duration | Deliverables |
| :--- | :--- | :--- |
| **Discovery** | 1 Week | Requirement spec, architecture review, database design. |
| **Architecture** | 1 Week | API design, database schema, UI mockups, security model. |
| **MVP Dev** | 4 Weeks | Core inventory features, cashflow tracking, user authentication, responsive UI. |
| **Testing & SBP Hardening** | 2 Weeks | Functional testing, security audit (SBP compliance), edge case validation. |
| **Deployment** | 1 Week | PM2 process management setup, environment configuration, final deployment. |

**Total Estimated Timeline:** 9 Weeks.

### 1.2 Resource Requirements

*   **Tech Stack:** React, Vite, TypeScript, Express, Prisma, SQLite, PM2.
*   **Infrastructure:** Node.js runtime, SQLite database file, PM2 for process management.
*   **Headcount:** 
    *   1x Full-stack Developer (React/Express/TypeScript/Prisma/SQLite proficiency)
    *   Security Consultant (for SBP compliance audit)

### 1.3 Key Technical Risks & Mitigation

*   **Risk:** Concurrency issues with SQLite. **Mitigation:** Use Prisma transactions and SQLite's `IMMEDIATE` or `EXCLUSIVE` transaction modes.
*   **Risk:** Security vulnerabilities. **Mitigation:** Adhere to SBP compliance guidelines, implement httpOnly cookies, audit logging, and encryption.

---

## Part 2: SBP Compliance and Security Hardening

To ensure the Shop-Inventory-Cashflow system meets the requirements for financial data handling and security, the following measures are implemented:

### 2.1 Compliance Strategy
The application adheres to the security principles set forth by the State Bank of Pakistan (SBP) for electronic financial transactions, focusing on data integrity, accountability, and secure access management.

### 2.2 Security Hardening Measures
*   **Secure Authentication**: Migration of authentication tokens from `localStorage` to `httpOnly` secure cookies to prevent XSS-based token theft.
*   **Encryption at Rest**: AES-256-CBC encryption for sensitive API credentials.
*   **Data Integrity**: Use of relational database (SQLite) with transactional guarantees (Prisma) to ensure consistent state.

### 2.3 Immutable Audit Logging
To ensure accountability, an `AuditLog` system is implemented:
*   **Middleware**: Every financial transaction (sale, deposit, withdrawal) is intercepted by the `AuditLog` middleware.
*   **Immutability**: Logs are stored in an `AuditLog` database table, capturing the transaction details, timestamp, and actor, ensuring a traceable history of all financial movements.

---

## Part 3: Consultant Vetting Framework

This framework provides a structured approach for external technical consultants to conduct an architectural audit and validation of the system, with a specific focus on SBP compliance.

### 3.1 Evaluation Criteria

Consultants are expected to assess the project against the following pillars:

1.  **Code Quality & Architecture**: Modular design, TypeScript/React/Express best practices.
2.  **Architectural Scalability**: Ability to handle projected data volumes.
3.  **Security Compliance (SBP)**: Verification of SBP compliance guidelines, secure session management, audit log implementation, and data protection.
4.  **Maintainability & Extensibility**: Documentation clarity and ease of onboarding.

### 3.2 Technical Validation Questions

1.  **SBP Compliance**: Does the current implementation meet the SBP requirements for audit trails and secure transaction handling?
2.  **SQLite Concurrency**: How do Prisma transactions manage data consistency during high-frequency writes?
3.  **Data Security**: How does the AES-256-CBC encryption strategy ensure protection of sensitive data at rest?
4.  **Authentication**: How do `httpOnly` cookies prevent XSS-based session hijacking?
5.  **Audit Integrity**: Is the `AuditLog` mechanism robust enough to prevent unauthorized modification of transaction logs?
6.  **Testability**: How does the project structure facilitate comprehensive testing (unit, integration, end-to-end)?

### 3.3 Consultant Submission Guidelines

The consultant’s report should be structured as follows:

*   **Architectural Gap Analysis**: Identification of discrepancies with industry best practices and SBP compliance.
*   **Feasibility Assessment**: Confidence score (1–10) for technical feasibility.
*   **Strategic Recommendations**: Prioritized, actionable suggestions for security hardening and structural improvements.
