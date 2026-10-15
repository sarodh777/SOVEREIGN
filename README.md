# VAULTCHAIN - Institutional Banking & Blockchain Platform

VAULTCHAIN is an enterprise-grade institutional banking and decentralized ledger platform. It pairs a modern React frontend with a Spring Boot REST backend, MySQL persistence, and Ethereum/Hardhat smart contracts for immutable transaction logging and governance.

---

## 🚀 Quick Start (Local Non-Docker)

Ensure prerequisites are installed: **Node.js 18+**, **Java 17 JDK**, and **MySQL 8.0+**.

### 1. Run via Quick Start Script
- **Windows**: Run `quickstart.bat`
- **Linux/macOS**: Run `./quickstart.sh`

### 2. Or Start Services Manually

```bash
# Terminal 1: Backend (Spring Boot on port 8080)
cd backend
./mvnw.cmd spring-boot:run     # On Windows (or ./mvnw spring-boot:run on Unix)

# Terminal 2: Frontend (Vite on port 5173)
npm install
npm run dev

# Terminal 3: Blockchain (Optional Hardhat node on port 8545)
cd blockchain
npm install
npm run node
# In another terminal: npm run deploy-local
```

Access the frontend application at: **http://localhost:5173**

---

## 🏗 Architecture & Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS v3, React Router v7, Lucide React, Recharts, Ethers.js v6.
* **Backend**: Spring Boot 4.0.5, Java 17, Spring Security 6, OAuth2 Client, Spring Data JPA, JavaMailSender.
* **Database**: MySQL 8.0 with automated entity schema management (`vaultchain`).
* **Blockchain**: Hardhat, Solidity 0.8.24 (`BankLedger.sol`, `SovereignGovernance.sol`), Ethers.js.
* **Security & Crypto**: ECDSA P-256 on-device digital signatures, SHA-256 canonical hashing, transaction PINs, and automated fraud scoring.

---

## 🌟 Key Functional Modules

### 1. Institutional Banking Operations
- **Account Management**: Checking, savings, and institutional tier balances with real-time balance calculations.
- **Transfers & Money Movement**: Fund transfers with 0.5% fee calculation, transaction PIN verification, and digital receipt generation.
- **Deposits**: Instant credit deposits with balance updates.
- **Transaction History**: Searchable and filterable history with PDF statement export via jsPDF.

### 2. Security & Compliance
- **Authentication**: Email + password login, Gmail SMTP One-Time Password (2FA), and Google OAuth2 SSO.
- **Client-Side Digital Signatures**: On-device ECDSA keypair generation and transaction signature generation ensuring end-to-end non-repudiation.
- **Anti-Tamper Verification**: Interactive verification modal demonstrating tamper detection if amounts or recipients are modified in transit.
- **KYC/AML Compliance**: Customer identity document submission and administrative review workflow.
- **AI Fraud Detection**: Automated risk evaluation flagging suspicious velocity, high-amount anomalies, or unverified recipients.

### 3. Separated Administration Portal (`/admin/*`)
- **Admin Dashboard**: System-wide liquidity metrics, transaction velocity charts, and user count indicators.
- **User Management**: Lock/unlock accounts, inspect KYC verification states, and adjust account limits.
- **Transaction Monitoring**: Global ledger audit with custom PDF report generation.
- **Fraud Operations**: Review flagged transactions with approve/reject administrative controls.

### 4. Blockchain Ledger & Governance
- **Dual Ledger Architecture**: High-throughput MySQL transactional ledger paired with Hardhat EVM smart contract anchor for immutable transaction logs and governance voting.

---



- [SETUP.md](./SETUP.md) — Comprehensive local prerequisites, database setup, and configuration guide.
- [API.md](./API.md) — Complete REST API reference covering authentication, banking, KYC, and security endpoints.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production non-Docker deployment guide (systemd, Windows service, PM2, Nginx).
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Common developer issues, database errors, and debugging solutions.
- [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) — Deep technical architecture, component catalog, and data model guide.
