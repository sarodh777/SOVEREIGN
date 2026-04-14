# Sovereign Ledger - Deployment Guide

## Deployment Options

### 1. Local Development (Recommended for Testing)

#### Prerequisites
- MySQL 8.0+ running locally
- Java 17 JDK
- Node.js 18+
- Git

#### Steps

```bash
# 1. Clone/Navigate to project
cd frontend_p1

# 2. Setup backend
cd backend
./mvnw clean install

# 3. Run MySQL
# Ensure MySQL is running and database is created:
# CREATE DATABASE sovereign_ledger;

# 4. Start backend
./mvnw spring-boot:run

# 5. In another terminal, setup frontend
npm install
npm run dev

# 6. Open http://localhost:5173
```

---

### 2. Docker Deployment (Recommended for Production)

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

#### Setup

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- MySQL: localhost:3306
- Database: sovereign_ledger

---

### 3. Cloud Deployment

#### AWS Elastic Beanstalk (Backend + Frontend)

```bash
# Prerequisites: AWS CLI, EB CLI

# Initialize
eb init -p java-17 sovereign-backend
eb init -p node.js sovereign-frontend --region us-east-1

# Create environment
eb create production

# Deploy backend
cd backend
./mvnw clean package
eb deploy

# Deploy frontend
cd ..
npm run build
eb deploy
```

#### Azure App Service

```bash
# Prerequisites: Azure CLI

# Create resource group
az group create --name sovereign-rg --location eastus

# Create MySQL database
az mysql server create \
  --resource-group sovereign-rg \
  --name sovereign-db \
  --admin-user admin \
  --admin-password Password123!

# Create App Service Plan
az appservice plan create \
  --name sovereign-plan \
  --resource-group sovereign-rg \
  --sku B2 --is-linux

# Deploy backend
az webapp create \
  --resource-group sovereign-rg \
  --plan sovereign-plan \
  --name sovereign-backend \
  --runtime "JAVA|17-java17"

# Deploy frontend
az webapp create \
  --resource-group sovereign-rg \
  --plan sovereign-plan \
  --name sovereign-frontend \
  --runtime "NODE|18-lts"
```

#### Google Cloud Run

```bash
# Prerequisites: gcloud CLI

# Build and push backend
gcloud builds submit backend/ \
  --tag gcr.io/PROJECT_ID/sovereign-backend

# Deploy backend
gcloud run deploy sovereign-backend \
  --image gcr.io/PROJECT_ID/sovereign-backend \
  --platform managed \
  --memory 1Gi

# Build and push frontend
gcloud builds submit . \
  --tag gcr.io/PROJECT_ID/sovereign-frontend

# Deploy frontend
gcloud run deploy sovereign-frontend \
  --image gcr.io/PROJECT_ID/sovereign-frontend \
  --platform managed
```

---

### 4. Kubernetes Deployment

#### Prerequisites
- kubectl
- Kubernetes cluster (Minikube, EKS, AKS, GKE)

#### Create manifests

**sovereign-backend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sovereign-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sovereign-backend
  template:
    metadata:
      labels:
        app: sovereign-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/PROJECT_ID/sovereign-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_DATASOURCE_URL
          value: "jdbc:mysql://mysql:3306/sovereign_ledger"
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
---
apiVersion: v1
kind: Service
metadata:
  name: sovereign-backend
spec:
  selector:
    app: sovereign-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: LoadBalancer
```

**sovereign-frontend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sovereign-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sovereign-frontend
  template:
    metadata:
      labels:
        app: sovereign-frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/PROJECT_ID/sovereign-frontend:latest
        ports:
        - containerPort: 5173
---
apiVersion: v1
kind: Service
metadata:
  name: sovereign-frontend
spec:
  selector:
    app: sovereign-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5173
  type: LoadBalancer
```

#### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f sovereign-backend-deployment.yaml
kubectl apply -f sovereign-frontend-deployment.yaml

# Check status
kubectl get pods
kubectl get services

# Get frontend URL
kubectl get service sovereign-frontend --watch
```

---

## Environment Configuration

### Development (.env.development)
```
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WEB3_RPC=http://localhost:8545
```

### Production (.env.production)
```
REACT_APP_API_URL=https://api.sovereign-ledger.com
REACT_APP_WEB3_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### Backend (application-prod.properties)
```properties
spring.datasource.url=jdbc:mysql://prod-db.aws.amazon.com:3306/sovereign_ledger
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}

app.jwt.secret=${JWT_SECRET}
```

---

## Database Migration

### Initial Setup
```bash
# Hibernate auto-creates tables (ddl-auto=update)
# Tables automatically created:
# - users
# - blocks
# - transactions
```

### Backup
```bash
# MySQL dump
mysqldump -u root -p sovereign_ledger > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
mysql -u root -p sovereign_ledger < backup_YYYYMMDD_HHMMSS.sql
```

---

## Monitoring & Logging

### Application Logs
```bash
# Backend logs
docker-compose logs backend

# Frontend logs (browser console)
# Open DevTools: F12

# View all logs
docker-compose logs -f
```

### Health Checks
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Enable in application.properties
# management.endpoints.web.exposure.include=health,info,metrics
```

### Performance Monitoring
```bash
# Docker stats
docker stats

# Compose metrics
docker-compose ps
```

---

## CI/CD Pipeline

### GitHub Actions Example

**.github/workflows/deploy.yml**
```yaml
name: Deploy Sovereign Ledger

on:
  push:
    branches: [main, develop]

jobs:
  test-build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build backend
        run: |
          cd backend
          ./mvnw clean package
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build frontend
        run: |
          npm install
          npm run build
      
      - name: Deploy to Docker Hub
        run: |
          docker build -t myregistry/sovereign-backend:latest ./backend
          docker push myregistry/sovereign-backend:latest
          
          docker build -t myregistry/sovereign-frontend:latest .
          docker push myregistry/sovereign-frontend:latest
```

---

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml - add replicas
services:
  backend:
    deploy:
      replicas: 3
  frontend:
    deploy:
      replicas: 2
```

### Database Connection Pooling
```properties
# application.properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
```

### Caching
```java
// Add to SecurityConfig
@Bean
public CacheManager cacheManager() {
    return new ConcurrentMapCacheManager("users", "proposals");
}
```

---

## Security Hardening

1. **Use HTTPS/TLS**
   ```bash
   # Generate self-signed cert
   keytool -genkey -alias sovereign -storetype PKCS12 \
     -keyalg RSA -keysize 2048 -keystore sovereign.p12
   
   # Add to application.properties
   server.ssl.key-store=sovereign.p12
   server.ssl.key-store-password=changeme
   ```

2. **Enable HSTS**
   ```java
   http.headers().httpStrictTransportSecurity().includeSubDomains(true)
   ```

3. **Rate Limiting**
   ```java
   @Configuration
   public class RateLimitConfig {
       @Bean
       public RateLimiter rateLimiter() {
           return RateLimiter.create(10); // 10 requests per second
       }
   }
   ```

4. **API Key Authentication**
   ```java
   @Component
   public class ApiKeyAuthFilter extends OncePerRequestFilter {
       // Implement API key validation
   }
   ```

---

## Rollback

```bash
# Docker rollback to previous image
docker-compose down
git checkout [previous-commit]
docker-compose up -d

# Kubernetes rollback
kubectl rollout undo deployment/sovereign-backend
kubectl rollout undo deployment/sovereign-frontend
```

---

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify ports: `netstat -an | grep LISTEN`
3. Test connectivity: `curl http://localhost:8080`
4. Review API documentation: [API.md](./API.md)

---

**Last Updated**: 2026-04-12
**Deployment Version**: 1.0
**Status**: Production Ready
