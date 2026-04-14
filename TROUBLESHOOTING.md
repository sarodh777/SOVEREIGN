# Sovereign Ledger - Troubleshooting Guide

## Common Issues & Solutions

### Backend Issues

#### ❌ "Cannot resolve com.sovereign.ledger package"

**Cause**: Source files not found or build not completed

**Solution**:
```bash
cd backend
./mvnw clean install
./mvnw compile
```

---

#### ❌ "Connection refused: 3306" or "No database selected"

**Cause**: MySQL not running or database not created

**Solution**:
```bash
# Start MySQL
# macOS
brew services start mysql-server

# Windows (with MySQL installed)
net start MySQL80

# Linux
sudo systemctl start mysql

# Create database
mysql -u root -p
mysql> CREATE DATABASE sovereign_ledger;
mysql> exit;

# Verify connection in application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/sovereign_ledger
```

---

#### ❌ "Failed to load OAuth2 config" or "client-id is invalid"

**Cause**: Google OAuth2 credentials missing or incorrect

**Solution**:
1. Go to Google Cloud Console
2. Create OAuth2 credentials
3. Update `application.properties`:
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
```

---

#### ❌ "SMTPAuthenticationException" or "Failed to send OTP"

**Cause**: Email configuration incorrect

**Solution**:
```bash
# Test email endpoint
curl http://localhost:8080/api/auth/test-email

# Generate Gmail App Password (not regular password)
# Go to myaccount.google.com → Security → 2FA must be enabled → App passwords

# Update application.properties
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
spring.mail.from=YOUR_EMAIL@gmail.com
```

---

#### ❌ "Port 8080 already in use"

**Cause**: Another service using port 8080

**Solution**:
```bash
# Find what's using port 8080
# macOS/Linux
lsof -i :8080

# Windows
netstat -ano | findstr :8080

# Kill the process or change port in application.properties
server.port=9080
```

---

#### ❌ "NullPointerException in OtpService"

**Cause**: OtpService not properly autowired

**Solution**:
Ensure `@Service` annotation is present:
```java
@Service
public class OtpService {
    // ...
}
```

---

### Frontend Issues

#### ❌ "Cannot find module 'ethers'"

**Cause**: Dependencies not installed

**Solution**:
```bash
npm install
# or
npm install ethers@^6.11.0
```

---

#### ❌ "Tailwind styles not applying" or "brand-cyan undefined"

**Cause**: Tailwind config not loaded properly

**Solution**:
```bash
# Rebuild CSS
npm run dev

# Clear cache
rm -rf node_modules/.vite
npm install

# Check tailwind.config.js has colors defined
grep "brand:" tailwind.config.js
```

---

#### ❌ "Cannot connect to backend" or "CORS error"

**Cause**: Backend not running or CORS not configured

**Solution**:
```bash
# Check backend is running
curl http://localhost:8080/api/auth/test-email

# Verify CORS in SecurityConfig
# Should allow: http://localhost:5173

# Temporary fix - change API URL in code
// In pages/Login.jsx
axios.post('http://localhost:8080/api/auth/request-otp', { email })
```

---

#### ❌ "Port 5173 already in use"

**Solution**:
```bash
# Change port in vite.config.js
export default defineConfig({
  server: {
    port: 3000  // Change to available port
  }
})

# Or kill process using port
# macOS/Linux
lsof -i :5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

#### ❌ "OTP not being sent" (Frontend shows success but no email)

**Cause**: Email service not properly configured

**Solution**:
1. Test email endpoint first:
```bash
curl -X GET http://localhost:8080/api/auth/test-email
```

2. Check backend logs for SMTP errors
3. Verify credentials in `application.properties`
4. Check spam folder
5. Wait a few seconds (emails can be slow)

---

#### ❌ "Dashboard shows blank page or errors"

**Cause**: MetaMask or ethers.js issue

**Solution**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Install MetaMask extension
4. Ensure you're on correct network
5. Comment out Web3 code temporarily to test UI:
```javascript
// Temporarily disable Web3 for testing
// const provider = new ethers.BrowserProvider(window.ethereum);
```

---

### Blockchain Issues

#### ❌ "Cannot find hardhat" or "hardhat: command not found"

**Cause**: Dependencies not installed in blockchain folder

**Solution**:
```bash
cd blockchain
npm install
npm list hardhat
```

---

#### ❌ "Contract address changed on each deploy"

**Cause**: Normal behavior - each deploy creates new contract

**Solution**:
1. Save the address after deployment
2. Update in Dashboard.jsx manually:
```javascript
const contractAddress = "0x YOUR_NEW_ADDRESS";
```

3. Or implement contract address registration

---

#### ❌ "Cannot connect to local Hardhat node"

**Cause**: Hardhat node not running on port 8545

**Solution**:
```bash
# Start Hardhat node
cd blockchain
npm run node

# Should show:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545

# Verify in another terminal
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

#### ❌ "Contract compilation failed"

**Solution**:
```bash
cd blockchain
npx hardhat clean    # Clean previous builds
npm run compile      # Recompile
```

---

### Docker Issues

#### ❌ "docker-compose: command not found"

**Cause**: Docker Compose not installed

**Solution**:
```bash
# Install Docker Desktop (includes compose)
# Or install separately
docker-compose --version

# If using Docker V2 syntax
docker compose up -d
```

---

#### ❌ "Cannot connect to MySQL from container"

**Cause**: Network or host name issue

**Solution**:
```yaml
# In docker-compose.yml
services:
  backend:
    environment:
      SPRING_DATASOURCE_URL: "jdbc:mysql://mysql:3306/sovereign_ledger"
      # Note: use service name 'mysql', not localhost
```

---

#### ❌ "Port already allocated"

**Solution**:
```bash
# Check what's using ports
docker ps
docker port CONTAINER_NAME

# Stop conflicting containers
docker stop CONTAINER_NAME

# Or change ports in docker-compose.yml
ports:
  - "9080:8080"  # Change from 8080
```

---

### General Issues

#### ❌ "Cannot find file" or "File not found"

**Solution**:
```bash
# Verify file paths
ls -la backend/src/main/java/com/sovereign/ledger/

# Use absolute paths for imports
# Avoid relative paths like ../../../
```

---

#### ❌ "Out of memory" errors

**Solution**:
```bash
# Increase heap size for Java
export MAVEN_OPTS=-Xmx1024m
./mvnw spring-boot:run

# For Docker containers
docker-compose down
# Edit docker-compose.yml
environment:
  JAVA_OPTS: "-Xmx1G -Xms512m"
docker-compose up -d
```

---

#### ❌ "Long startup time" (Backend takes 30+ seconds)

**Cause**: Normal for Spring Boot on first run

**Solution**:
- Wait for full startup message
- Check logs: `docker-compose logs backend | grep "Started"`
- Improve startup with:
```properties
# application.properties
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
logging.level.root=WARN
```

---

## Debug Tips

### 1. Enable Verbose Logging

**Backend** (`application.properties`):
```properties
logging.level.com.sovereign.ledger=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.springframework.mail=DEBUG
```

**Frontend** (console.log everywhere):
```javascript
console.log('Email:', email);
console.log('Response:', response);
console.error('Error:', error);
```

### 2. Monitor Network Requests

**Frontend DevTools**:
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. Check request/response details

**Backend logs**:
```bash
docker-compose logs -f backend | grep "POST\|GET"
```

### 3. Database Inspection

```bash
# Connect to MySQL
mysql -u root -p sovereign_ledger

# Check tables
SHOW TABLES;
DESC users;
SELECT * FROM users;

# Check for OTP data (debug)
# Note: OTP is in-memory, not in DB
```

### 4. Health Checks

```bash
# Backend health
curl http://localhost:8080/api/auth/test-email

# Frontend accessibility
curl http://localhost:5173

# MySQL connectivity
mysql -h localhost -u root -p < /dev/null && echo "MySQL OK"
```

---

## Getting Help

1. **Check logs**: Always check application logs first
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Review error messages**: Errors usually contain the solution

3. **Search documentation**:
   - [SETUP.md](./SETUP.md) - Installation
   - [API.md](./API.md) - API reference
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment

4. **Test components individually**:
   - Test backend with curl
   - Test frontend without Web3
   - Test database separately

5. **Create minimal reproduction**:
   - Isolate the problem
   - Test with curl/Postman
   - Add console.log statements

---

## Performance Optimization

### Frontend
```javascript
// Use lazy loading for components
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Memoize expensive operations
const memoizedValue = useMemo(() => computeExpensiveValue(), [deps]);
```

### Backend
```properties
# application.properties
spring.datasource.hikari.maximum-pool-size=20
spring.session.timeout=30m
```

### Database
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_proposal ON votes(proposal_id);
```

---

**Last Updated**: 2026-04-12  
**Version**: 1.0
