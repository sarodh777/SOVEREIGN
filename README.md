# Sovereign Ledger - Institutional Governance Node

A comprehensive full-stack blockchain governance system featuring institutional voting, email-based 2FA, and Web3 integration.

## Quick Start

See [SETUP.md](./SETUP.md) for complete installation and setup instructions.

### TL;DR (Quick Start)

```bash
# Terminal 1: Backend (Spring Boot on port 8080)
cd backend
./mvnw spring-boot:run

# Terminal 2: Frontend (Vite on port 5173)  
npm install
npm run dev

# Terminal 3: Blockchain (Hardhat Node on port 8545 - Optional)
cd blockchain
npm install
npm run node
# In another terminal: npm run deploy-local
```

Then open http://localhost:5173

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v3, Ethers.js v6, Lucide React
- **Backend**: Spring Boot 4.0.5, Java 17, Spring Security, OAuth2
- **Blockchain**: Hardhat, Solidity 0.8.24, ethers.js
- **Database**: MySQL 8.0

## Key Features
- ✅ Email + OTP Two-Factor Authentication
- ✅ Google OAuth2 Integration  
- ✅ Blockchain-based Governance Voting
- ✅ JWT Token Management
- ✅ Institutional User Management
- ✅ Transaction & Block Ledger

## Security & Authentication Workflow

The Sovereign Ledger frontend is designed to communicate securely with the Spring Boot backend. Here is how the authentication flow works:

### 1. Google OAuth2 Login
The `Login.jsx` screen uses a placeholder button for Google OAuth2. 
- *Frontend Action:* When a user clicks the "Login with Google Auth" button, it should redirect them to the Spring Boot backend's OAuth2 authorization endpoint (typically `http://localhost:8080/oauth2/authorization/google`).
- *Backend Action:* The backend handles the Google OAuth callback, verifies the user using the `GOOGLE_OAUTH_CLIENT_ID`, and creates a secure session.

### 2. OTP Request via JavaMailSender
If the user attempts a "Secure Login" or requires two-factor authentication, an OTP is generated.
- *Frontend Action:* The React app uses `axios` to send an HTTP POST request to `http://localhost:8080/api/auth/request-otp` containing the user's email.
- *Backend Action:* Spring Boot uses the configured `JavaMailSender` (using the APP PASSWORD stored securely in `.env`) to dispatch the email.

### 3. OTP Verification
- *Frontend Action:* The user enters the numeric code into the `OTPVerification.jsx` component. An HTTP POST request is sent to `http://localhost:8080/api/auth/verify-otp` with the code.
- *Backend Action:* If valid, the backend issues an HttpOnly cookie containing a JWT for subsequent sensitive dashboard requests, or returns a secure short-lived token.

### 4. Secure Signing Workflow (Dashboard)
The dashboard features an HSM (Hardware Security Module) simulated workflow to cast votes on proposals.
- Signed votes are sent via `axios.post('/api/governance/vote')` with specific headers containing authentication credentials to the backend.

See `backend_templates/` for the environment variables configuration regarding the Google Client ID and Email App Password.
