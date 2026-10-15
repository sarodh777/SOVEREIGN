# VAULTCHAIN - Comprehensive REST API Documentation

## Base URL
- **Development**: `http://localhost:8080`
- **Frontend Client Proxy**: `http://localhost:5173/api`

## Authentication & Headers
VAULTCHAIN supports three authentication modes:
1. **Public Endpoints**: `/api/auth/**`, no credentials required.
2. **Bearer JWT Token**: Authenticated endpoints require an `Authorization` header:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```
3. **OAuth2 SSO**: Google OAuth2 redirect flow via `http://localhost:8080/oauth2/authorization/google`.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register New User
Create an institutional or customer account.
* **Method**: `POST /api/auth/register`
* **Content-Type**: `application/json`
* **Request**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@vaultchain.bank",
    "password": "Password123!",
    "role": "ROLE_USER"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "userId": 1
  }
  ```

### 1.2 User Login (Password)
* **Method**: `POST /api/auth/login`
* **Content-Type**: `application/json`
* **Request**:
  ```json
  {
    "email": "jane@vaultchain.bank",
    "password": "Password123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "email": "jane@vaultchain.bank",
      "name": "Jane Doe",
      "role": "ROLE_USER"
    }
  }
  ```

### 1.3 Request Email OTP (Two-Factor Authentication)
* **Method**: `POST /api/auth/request-otp`
* **Request**:
  ```json
  { "email": "operator@institution.com" }
  ```
* **Response (200 OK)**:
  ```json
  { "success": true, "message": "OTP sent successfully" }
  ```

### 1.4 Verify OTP
* **Method**: `POST /api/auth/verify-otp`
* **Request**:
  ```json
  {
    "email": "operator@institution.com",
    "otp": "482910"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "email": "operator@institution.com", "role": "ROLE_USER" }
  }
  ```

### 1.5 Get User Profile
* **Method**: `GET /api/auth/profile`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@vaultchain.bank",
      "role": "ROLE_USER",
      "createdAt": "2026-03-15T10:00:00Z"
    }
  }
  ```

---

## 2. Core Banking Endpoints (`/api/banking`)

### 2.1 Get User Accounts
Retrieve all checking, savings, and institutional accounts associated with the authenticated user.
* **Method**: `GET /api/banking/accounts`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "accounts": [
      {
        "id": 101,
        "accountNumber": "VC-1001-9281",
        "accountType": "CHECKING",
        "balance": 15420.50,
        "currency": "INR",
        "status": "ACTIVE",
        "overdraftLimit": 5000.00
      }
    ]
  }
  ```

### 2.2 Transfer Funds
Execute a money transfer with fee calculation and risk evaluation.
* **Method**: `POST /api/banking/transfer`
* **Headers**: `Authorization: Bearer <token>`
* **Request**:
  ```json
  {
    "fromAccountId": 101,
    "recipientEmail": "bob@vaultchain.bank",
    "amount": 2500.00,
    "reference": "Consulting Invoice #410",
    "pin": "1234",
    "signature": "3045022100..."
  }
  ```
* **Fee Structure**:
  - Transfer fee: 0.5% of principal
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transfer processed successfully",
    "transactionId": "TXN-20261010-8912",
    "fee": 12.50,
    "newBalance": 12908.00,
    "status": "COMPLETED"
  }
  ```

### 2.3 Deposit Funds
* **Method**: `POST /api/banking/deposit`
* **Request**:
  ```json
  {
    "accountId": 101,
    "amount": 5000.00,
    "reference": "Initial Funding"
  }
  ```
* **Fee**: No fee ($0.00 / ₹0.00)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Deposit credited successfully",
    "transactionId": "DEP-20261010-1102",
    "newBalance": 20420.50
  }
  ```

### 2.4 Get Transaction History
* **Method**: `GET /api/banking/transactions/{accountId}`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "transactions": [
      {
        "id": 901,
        "transactionId": "TXN-20261010-8912",
        "type": "TRANSFER",
        "amount": 2500.00,
        "fee": 12.50,
        "direction": "OUT",
        "status": "COMPLETED",
        "date": "2026-10-10T14:32:00Z",
        "reference": "Consulting Invoice #410",
        "blockchainHash": "0x4b78e2..."
      }
    ]
  }
  ```

---

## 3. Cryptographic Digital Signatures (`/api/security/signature`)

### 3.1 Fetch User Signatures
* **Method**: `GET /api/security/signature/my-signatures`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "signatures": [
      {
        "transactionId": "TXN-20261010-8912",
        "publicKeyHex": "04a29c...",
        "canonicalPayloadHash": "e3b0c44298fc...",
        "signatureDerHex": "3045022100...",
        "signatureVerified": true,
        "timestamp": 1791642720
      }
    ]
  }
  ```

### 3.2 Verify / Tamper Test Simulation
* **Method**: `POST /api/security/signature/test-tamper`
* **Request**:
  ```json
  {
    "transactionId": "TXN-DEMO-001",
    "fromAccount": "1001-XXXX-001",
    "toAccount": "1002-XXXX-002",
    "originalAmount": "1500.00",
    "tamperedAmount": "95000.00"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "verified": false,
    "status": "TAMPERED",
    "reason": "Cryptographic signature does not match tampered payload hash"
  }
  ```

---

## 4. AI Fraud Detection & Compliance (`/api/admin/fraud` & `/api/kyc`)

### 4.1 Submit KYC Document
* **Method**: `POST /api/kyc/submit`
* **Request**:
  ```json
  {
    "fullName": "Jane Doe",
    "documentType": "PASSPORT",
    "documentNumber": "P12984920",
    "country": "India"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "PENDING_VERIFICATION",
    "message": "KYC submission received for compliance review"
  }
  ```

### 4.2 Admin Fraud Alerts
* **Method**: `GET /api/admin/fraud/alerts`
* **Query Params**: `riskLevel=HIGH|MEDIUM|LOW`, `status=NEW|REVIEWED|RESOLVED`
* **Headers**: `Authorization: Bearer <token>` (Admin role required)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "alerts": [
      {
        "id": 12,
        "transactionId": "TXN-88192",
        "riskLevel": "HIGH",
        "riskScore": 88,
        "flaggedReason": "Rapid succession high-value transfer",
        "status": "UNDER_REVIEW"
      }
    ]
  }
  ```

---

## 5. Blockchain Governance (`/api/governance`)

### 5.1 Submit Governance Vote
* **Method**: `POST /api/governance/vote`
* **Content-Type**: `application/json`
* **Request**:
  ```json
  {
    "proposalId": "SLP-0824",
    "voteDirection": "SUPPORT",
    "hsmKey": "securekey"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Vote recorded on institutional blockchain ledger",
    "transactionHash": "0x1234567890abcdef1234567890abcdef12345678",
    "proposalId": "SLP-0824",
    "voteDirection": "SUPPORT"
  }
  ```
