# Enterprise Banking System - Implementation Guide

## Overview
This document describes the complete banking system implementation for the Sovereign Ledger platform. The system includes account management, money transfers, deposits, withdrawals, KYC/AML compliance, and audit logging.

## Architecture

### Database Models

#### 1. BankAccount Entity
Location: `backend/src/main/java/com/sovereign/ledger/model/BankAccount.java`

- Represents a user's bank account
- Fields:
  - `accountNumber`: Unique account identifier
  - `accountType`: CHECKING, SAVINGS, or BUSINESS
  - `balance`: Current account balance (BigDecimal, 4 decimal places)
  - `overdraftLimit`: Allowed overdraft amount
  - `currency`: Account currency (default: USD)
  - `status`: ACTIVE, FROZEN, or CLOSED
  - `iban`: International Bank Account Number
  - `lastTransactionAt`: Timestamp of last transaction

#### 2. TransactionLog Entity
Location: `backend/src/main/java/com/sovereign/ledger/model/TransactionLog.java`

- Records all banking transactions
- Fields:
  - `transactionId`: Unique transaction identifier
  - `fromAccount` / `toAccount`: Source and destination accounts
  - `amount`: Transaction amount
  - `type`: TRANSFER, DEPOSIT, WITHDRAWAL, PAYMENT, FEE
  - `status`: PENDING, COMPLETED, FAILED, REVERSED
  - `fee`: Associated fees (computed as 0.5% for transfers, $0.50 for withdrawals)
  - `reference`: Transaction reference number
  - `blockchainHash`: Future blockchain recording field
  - `metadata`: Additional JSON data

#### 3. AuditLog Entity
Location: `backend/src/main/java/com/sovereign/ledger/model/AuditLog.java`

- Tracks all user actions for compliance
- Fields:
  - `action`: LOGIN, TRANSFER, WITHDRAW, DEPOSIT, ACCOUNT_CHANGE, etc.
  - `entityType`: Type of entity affected (ACCOUNT, TRANSACTION, USER)
  - `status`: SUCCESS or FAILURE
  - `ipAddress`: Client IP address
  - `userAgent`: Browser/client information
  - `details`: JSON with additional context

#### 4. Dispute Entity
Location: `backend/src/main/java/com/sovereign/ledger/model/Dispute.java`

- Manages dispute resolution
- Fields:
  - `transaction`: Reference to disputed transaction
  - `raisedBy`: User who raised the dispute
  - `reason`: UNAUTHORIZED, DUPLICATE, INCORRECT_AMOUNT, OTHER
  - `status`: OPEN, INVESTIGATING, RESOLVED, REJECTED
  - `resolution`: Resolution description
  - `resolvedBy`: User who resolved the dispute

### Repositories

All repositories extend `JpaRepository`:

- `BankAccountRepository`: Query accounts by number, user, type, status
- `TransactionLogRepository`: Query transactions by account, type, date range
- `AuditLogRepository`: Query audit logs by user, action, date range
- `DisputeRepository`: Query disputes by status and user

### Services

#### BankingService
Location: `backend/src/main/java/com/sovereign/ledger/service/BankingService.java`

Core banking operations:

- **transferMoney(fromAccountId, toAccountId, amount, reference)**: Transfer money between accounts with 0.5% fee
- **deposit(accountId, amount, reference)**: Add funds to account
- **withdraw(accountId, amount, reference)**: Withdraw funds with $0.50 fee
- **getBalance(accountId)**: Retrieve current balance
- **getTransactionHistory(accountId)**: Get list of recent transactions
- **createBankAccount(user, accountType)**: Create new account with auto-generated account number and IBAN

All operations are transactional and include:
- Balance validation
- Fee calculation
- Status checking
- Audit logging

#### EncryptionService
Location: `backend/src/main/java/com/sovereign/ledger/service/EncryptionService.java`

Data security:

- **encrypt(data)**: AES encryption for sensitive information
- **decrypt(encryptedData)**: AES decryption
- **hashData(data)**: SHA-256 hashing for verification

#### AuditService
Location: `backend/src/main/java/com/sovereign/ledger/service/AuditService.java`

Compliance logging:

- **logAction(user, action, entityType, entityId, status)**: Record successful action
- **logFailure(user, action, entityType, reason)**: Record failed action

#### KYCService
Location: `backend/src/main/java/com/sovereign/ledger/service/KYCService.java`

Compliance checks:

- **verifyKYC(userEmail, fullName, documentId)**: Verify Know Your Customer requirements
- **checkAML(transactionAmount, destinationCountry)**: Check Anti-Money Laundering compliance

### REST API Endpoints

Base URL: `http://localhost:8080/api/banking`

#### Account Management

```
POST /account/create
- Request: { email, accountType }
- Response: { success, accountId, accountNumber, accountType, iban }
```

```
GET /accounts/{email}
- Response: { success, accounts: [{ id, accountNumber, balance, accountType, ... }] }
```

```
GET /balance/{accountId}
- Response: { success, accountNumber, balance, currency, accountType, status, overdraftLimit }
```

#### Transactions

```
POST /transfer
- Request: { fromAccountId, toAccountId, amount, reference }
- Response: { success, message, transactionId, fromBalance, toBalance, fee }
```

```
POST /deposit
- Request: { accountId, amount, reference }
- Response: { success, message, transactionId, newBalance }
```

```
POST /withdraw
- Request: { accountId, amount, reference }
- Response: { success, message, transactionId, newBalance, fee }
```

```
GET /transactions/{accountId}
- Response: { success, transactions: [{ id, transactionId, type, amount, fee, status, date, reference, direction, counterparty }] }
```

#### Compliance

```
POST /kyc/verify
- Request: { email, fullName, documentId }
- Response: { verified, kycStatus, verificationLevel, verifiedAt }
```

```
POST /aml/check
- Request: { amount, destinationCountry }
- Response: { flagged, approved, amlStatus, requiresApproval }
```

### Frontend Pages

#### BankingDashboard (`src/pages/BankingDashboard.jsx`)
- Displays all user accounts with balances
- Shows account details (account number, balance, currency, type, status)
- Lists recent transactions (10 most recent)
- Quick links to Transfer, Deposit, Withdraw, Statements
- "Create Account" button for new accounts
- Account selector to switch between accounts

#### Transfer (`src/pages/Transfer.jsx`)
- Form to transfer money between user's accounts
- Dropdown selection for from/to accounts
- Amount input with fee disclosure (0.5%)
- Optional reference field
- Real-time success/error messages

#### Deposit (`src/pages/Deposit.jsx`)
- Simple deposit form
- Select account and amount
- Optional reference (e.g., cheque number)
- Displays new balance after deposit

#### Withdraw (`src/pages/Withdraw.jsx`)
- Withdrawal form with fee disclosure ($0.50)
- Account and amount selection
- Optional reference field
- Shows new balance after withdrawal

#### Navigation
- Sidebar component updated with banking navigation items
- Links to Banking, Transfer, Deposit, Withdraw
- Active route highlighting

## Fee Structure

- **Transfer Fee**: 0.5% of transfer amount
- **Withdrawal Fee**: $0.50 flat fee
- **Deposits**: No fee

## Transaction Status States

- **PENDING**: Transaction created, awaiting processing
- **COMPLETED**: Transaction successfully processed
- **FAILED**: Transaction failed to complete
- **REVERSED**: Transaction reversed after completion

## Account Types

- **CHECKING**: Regular checking account, full transaction access
- **SAVINGS**: Savings account, limited transactions
- **BUSINESS**: Business account, higher limits

## Building and Running

### Backend

```bash
cd backend

# Clean build (first time)
mvnw.cmd clean package -DskipTests

# Run Spring Boot application
mvnw.cmd spring-boot:run

# Or run directly
java -jar target/SovereignLedger-0.0.1-SNAPSHOT.jar
```

Backend will start on `http://localhost:8080`

### Database

Ensure MySQL is running:
```bash
mysql -u root -pSQL123
```

Database: `sovereign_ledger`

The application will auto-create tables from JPA entities on startup.

### Frontend

```bash
# Install dependencies (first time)
npm install

# Start development server
npm run dev
```

Frontend will start on `http://localhost:5173`

## Testing

### Create Account
```bash
curl -X POST http://localhost:8080/api/banking/account/create \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "accountType": "CHECKING"}'
```

### Transfer Money
```bash
curl -X POST http://localhost:8080/api/banking/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId": 1, "toAccountId": 2, "amount": "100.00", "reference": "Test transfer"}'
```

### Get Balance
```bash
curl http://localhost:8080/api/banking/balance/1
```

### Get Transaction History
```bash
curl http://localhost:8080/api/banking/transactions/1
```

## Security Considerations

1. **Encryption**: Sensitive data encrypted with AES-256
2. **Audit Logging**: All actions logged with user, IP, timestamp
3. **Input Validation**: All amounts and IDs validated
4. **Transaction Atomicity**: All transaction updates are atomic
5. **KYC/AML**: Compliance checks integrated
6. **JWT Authentication**: Existing JWT token validation applied

## Future Enhancements

1. **Blockchain Integration**: Link transaction hashes when blockchain field populated
2. **Multi-currency Support**: Currently US dollars, extensible to other currencies
3. **Advanced Reporting**: Custom reports and statements
4. **Recurring Transfers**: Scheduled automatic transfers
5. **Dispute Resolution**: Enhanced dispute management UI
6. **Transaction Limits**: Configurable per-user transaction limits
7. **Mobile App**: React Native mobile banking app
8. **Payment Gateway**: Integration with external payment providers
9. **Interest Calculation**: Auto-calculate interest on savings accounts
10. **Notifications**: Email/SMS transaction confirmations

## File Structure

```
backend/src/main/java/com/sovereign/ledger/
├── model/
│   ├── BankAccount.java
│   ├── TransactionLog.java
│   ├── AuditLog.java
│   └── Dispute.java
├── repository/
│   ├── BankAccountRepository.java
│   ├── TransactionLogRepository.java
│   ├── AuditLogRepository.java
│   └── DisputeRepository.java
├── service/
│   ├── BankingService.java
│   ├── EncryptionService.java
│   ├── AuditService.java
│   └── KYCService.java
└── controller/
    └── BankingController.java

frontend/src/
├── pages/
│   ├── BankingDashboard.jsx
│   ├── Transfer.jsx
│   ├── Deposit.jsx
│   └── Withdraw.jsx
├── components/
│   └── Sidebar.jsx
└── App.jsx
```

## API Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Schema

The application uses Hibernate JPA to automatically create:

- `bank_accounts` table
- `transaction_logs` table
- `audit_logs` table
- `disputes` table

And maintains foreign key relationships to existing `users` table.

## Notes

- All monetary values use BigDecimal for precision
- Timestamps stored in `LocalDateTime` (UTC)
- Account numbers auto-generated with format: `ACC-{UUID-12-chars}`
- IBANs generated with format: `US{timestamp}{account-id}`
- No transaction requires blockchain integration (blockchain implementation deferred)
- Fee calculations are automatic and transparent to users
