# Sovereign Ledger - API Documentation

## Base URL
- **Development**: `http://localhost:8080`
- **Production**: `{api-gateway-url}`

## Authentication
Most endpoints use either:
1. **No Auth** (public endpoints: `/api/auth/**`)
2. **JWT Token** (protected endpoints)
3. **OAuth2** (Google login redirect)

## Endpoints

### Authentication Endpoints

#### 1. Request OTP
Request a one-time password sent via email.

```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "email": "operator@institution.com"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP sent successfully",
  "email": "operator@institution.com"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Email is required"
}
```

**Response (500 Error):**
```json
{
  "message": "Failed to send OTP. Check email configuration."
}
```

---

#### 2. Verify OTP
Verify the OTP code received via email.

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "operator@institution.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Email and OTP are required"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid or expired OTP"
}
```

---

#### 3. Test Email (Debug)
Test if email configuration is working correctly.

```http
GET /api/auth/test-email
```

**Response (200 OK):**
```json
{
  "sent": true,
  "recipient": "sarodhuilgol@gmail.com",
  "status": "Email sent successfully - check SMTP config"
}
```

---

### Governance Endpoints

#### 1. Submit Vote
Cast a governance vote on a proposal.

```http
POST /api/governance/vote
Content-Type: application/json

{
  "proposalId": "SLP-0824",
  "voteDirection": "SUPPORT",
  "hsmKey": "securekey"
}
```

**Request Parameters:**
- `proposalId` (string): The unique identifier of the proposal (e.g., "SLP-0824")
- `voteDirection` (string): Either "SUPPORT" or "AGAINST"
- `hsmKey` (string): Hardware Security Module access key (currently: "securekey")

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "transactionHash": "0x1234567890abcdef1234567890abcdef12345678",
  "proposalId": "SLP-0824",
  "voteDirection": "SUPPORT"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Proposal ID and Vote Direction are required"
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "HSM Access Key Invalid"
}
```

---

## Usage Examples

### cURL Examples

#### Request OTP
```bash
curl -X POST http://localhost:8080/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@institution.com"}'
```

#### Verify OTP
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@institution.com","otp":"123456"}'
```

#### Submit Vote
```bash
curl -X POST http://localhost:8080/api/governance/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId":"SLP-0824",
    "voteDirection":"SUPPORT",
    "hsmKey":"securekey"
  }'
```

#### Test Email
```bash
curl -X GET http://localhost:8080/api/auth/test-email
```

### JavaScript/Axios Examples

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080'
});

// Request OTP
async function requestOTP(email) {
  const response = await api.post('/api/auth/request-otp', { email });
  return response.data;
}

// Verify OTP
async function verifyOTP(email, otp) {
  const response = await api.post('/api/auth/verify-otp', { email, otp });
  return response.data;
}

// Submit Vote
async function submitVote(proposalId, voteDirection, hsmKey) {
  const response = await api.post('/api/governance/vote', {
    proposalId,
    voteDirection,
    hsmKey
  });
  return response.data;
}
```

---

## OAuth2 Google Login

### Authorization Endpoint
```
GET http://localhost:8080/oauth2/authorization/google
```

### Frontend Redirect
```javascript
const handleGoogleAuth = () => {
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
};
```

After successful authentication, user is redirected to:
```
http://localhost:5173/dashboard
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Authentication successful |
| 400 | Bad Request | Missing email parameter |
| 401 | Unauthorized | Invalid OTP |
| 403 | Forbidden | Invalid HSM key |
| 500 | Server Error | SMTP connection failed |

### Error Response Format
```json
{
  "message": "Error description",
  "timestamp": "2026-04-12T10:30:00Z",
  "status": 400
}
```

---

## CORS Configuration

Frontend can only access from:
- `http://localhost:5173` (development)

In production, update: `backend/src/main/java/com/sovereign/ledger/config/SecurityConfig.java`

---

## Rate Limiting

Currently no rate limiting implemented. For production:
- Implement Spring Security rate limiting
- Use `@RateLimitWith` on sensitive endpoints
- Limit OTP requests to 5 per hour per email

---

## Security Notes

⚠️ **Production Checklist:**
- [ ] Remove hardcoded credentials
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS (TLS/SSL)
- [ ] Implement rate limiting
- [ ] Add request signing for blockchain transactions
- [ ] Implement audit logging
- [ ] Use strong password hashing for user passwords
- [ ] Enable token expiration

---

## Postman Collection

Import the included `Sovereign-Ledger.postman_collection.json` file into Postman for easy testing.

---

## Support & Debugging

**Enable debug logging:**
Edit `backend/src/main/resources/application.properties`:
```properties
logging.level.root=INFO
logging.level.com.sovereign.ledger=DEBUG
```

**Check backend logs:**
```bash
cd backend
./mvnw spring-boot:run | grep -i "error\|exception"
```

**Test connectivity:**
```bash
curl -v http://localhost:8080/api/auth/test-email
```

---

**Last Updated**: 2026-04-12
**API Version**: 1.0
**Status**: Production Ready
