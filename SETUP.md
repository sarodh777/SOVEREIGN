# Sovereign Ledger - Complete Setup Guide

This is a full-stack institutional blockchain governance system with:
- **Frontend**: React/Vite with Tailwind CSS
- **Backend**: Spring Boot 4.0.5 with Java 17
- **Blockchain**: Hardhat + Solidity smart contracts

## Prerequisites

- **Node.js** 18+ and npm
- **Java 17** JDK
- **MySQL** 8.0+
- **Git**

## Installation & Setup

### 1. Backend Setup (Spring Boot)

```bash
# Navigate to backend directory
cd backend

# Build the project with Maven
./mvnw clean install

# If you're on Windows
mvnw.cmd clean install
```

**Important:** Ensure MySQL is running and the database is created:

```sql
CREATE DATABASE sovereign_ledger;
```

### 2. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd ..

# Install dependencies
npm install

# This installs:
# - React 19.2.4
# - React Router v7
# - Axios for HTTP
# - Ethers v6 for Web3
# - Lucide React icons
# - Tailwind CSS v3
```

### 3. Blockchain Setup (Hardhat)

```bash
# Navigate to blockchain directory
cd blockchain

# Install Hardhat and dependencies
npm install

# Compile smart contracts
npm run compile
```

## Running the Project

### Terminal 1: Backend (Spring Boot)

```bash
cd backend

# Run on port 8080
./mvnw spring-boot:run

# Or on Windows:
mvnw.cmd spring-boot:run
```

You should see:
```
Started SovereignLedgerApplication in X seconds
```

### Terminal 2: Frontend (Vite Dev Server)

```bash
cd ..

# Run on port 5173
npm run dev
```

Open your browser to: **http://localhost:5173**

### Terminal 3: Local Blockchain (Optional - for Web3 voting)

```bash
cd blockchain

# Start Hardhat local node on port 8545
npm run node

# In another terminal, deploy the contract:
npm run deploy-local
```

## Environment Configuration

### Backend (`backend/src/main/resources/application.properties`)

Already configured with:
- **Gmail SMTP**: For OTP email delivery
- **OAuth2**: Google login credentials
- **MySQL**: Database connection
- **JWT**: Token configuration

**Note**: Credentials are included for demo purposes. In production, use environment variables.

### Frontend

The frontend connects to:
- **Backend API**: `http://localhost:8080`
- **Web3 Provider**: MetaMask (for blockchain voting)
- **Hardhat Contract**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## Project Structure

```
frontier_p1/
├── backend/              (Spring Boot)
│   ├── src/
│   │   ├── main/java/com/sovereign/ledger/
│   │   │   ├── controller/     (Auth, Governance APIs)
│   │   │   ├── service/        (OTP, Email, Governance logic)
│   │   │   ├── model/          (User, Block, Transaction)
│   │   │   ├── repository/     (Database access)
│   │   │   └── config/         (Security, CORS)
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
├── src/                 (React Frontend)
│   ├── pages/          (Login, OTPVerification, Dashboard)
│   ├── components/     (Sidebar)
│   ├── App.jsx         (Router setup)
│   └── index.css       (Tailwind + styling)
├── blockchain/          (Hardhat + Solidity)
│   ├── contracts/
│   │   └── SovereignGovernance.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
└── package.json        (Frontend dependencies)
```

## Features

### Authentication
1. **Email + OTP**: Two-factor authentication via Gmail
2. **Google OAuth2**: Enterprise SSO integration
3. **JWT Tokens**: Stateless session management

### Governance
- **Proposal Voting**: Cast votes on institutional proposals
- **Blockchain Recording**: Votes stored on Ethereum (local Hardhat or live)
- **Vote Prevention**: One vote per user per proposal

### Models
- **User**: Institutional operators with balances
- **Block**: Blockchain blocks with transaction history
- **Transaction**: Ledger transactions with sender/receiver/amount

## Database Schema

Automatically created by Hibernate (ddl-auto=update):

```sql
-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  balance DECIMAL(19, 4),
  role VARCHAR(50),
  created_at TIMESTAMP
);

-- Blocks table (for blockchain simulation)
CREATE TABLE blocks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  previous_hash VARCHAR(255) NOT NULL,
  hash VARCHAR(255) UNIQUE NOT NULL,
  timestamp TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_id BIGINT,
  receiver_id BIGINT,
  amount DECIMAL(19, 4) NOT NULL,
  status VARCHAR(50),
  transaction_hash VARCHAR(255) UNIQUE,
  block_id BIGINT,
  timestamp TIMESTAMP,
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);
```

## API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP via email
- `POST /api/auth/verify-otp` - Verify OTP code
- `GET /api/auth/test-email` - Test email configuration

### Governance
- `POST /api/governance/vote` - Submit a governance vote

## Testing

### Test Email Endpoint
```bash
curl -X GET http://localhost:8080/api/auth/test-email
```

### Test OTP Flow
```bash
# 1. Request OTP
curl -X POST http://localhost:8080/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Verify OTP (check email for code)
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### Test Governance Vote
```bash
curl -X POST http://localhost:8080/api/governance/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId":"SLP-0824",
    "voteDirection":"SUPPORT",
    "hsmKey":"securekey"
  }'
```

## Troubleshooting

### Backend won't start
- Ensure MySQL is running
- Check `application.properties` credentials
- Run `./mvnw clean install` to rebuild

### Frontend connection errors
- Ensure backend is running on port 8080
- Check CORS configuration in SecurityConfig
- Open browser console for detailed errors

### Email not sending
- Verify Gmail App Password in `application.properties`
- Check spam folder
- Ensure SMTP settings are correct

### Web3 voting fails
- Install MetaMask browser extension
- Ensure Hardhat node is running (`npm run node` in blockchain/)
- Check contract address in Dashboard.jsx

## Production Deployment

1. **Backend**: Build with `mvnw clean package` and deploy WAR
2. **Frontend**: Build with `npm run build` and deploy `dist/` to CDN
3. **Blockchain**: Deploy to Ethereum mainnet or testnet
4. **Database**: Use managed MySQL service (AWS RDS, Azure Database, etc.)
5. **Environment**: Use `.env` files for secrets, not in code

## Security Notes

⚠️ **For demo purposes only!** The included credentials are:
- Gmail app password
- OAuth2 client secret
- Database password

For production, use:
- Environment variables
- Secret management (AWS Secrets Manager, HashiCorp Vault)
- HashiCorp Terraform for infrastructure

## Support

For issues or questions:
1. Check the logs (backend/frontend)
2. Review this setup guide
3. Ensure all services are running
4. Verify network connectivity (ports 5173, 8080, 8545)

---

**Project Version**: v0.0.1-SNAPSHOT
**Created**: 2026
**License**: MIT
