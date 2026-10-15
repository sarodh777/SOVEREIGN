# VAULTCHAIN - Non-Docker Production Deployment Guide

This guide details how to deploy the VAULTCHAIN banking platform in production environments without Docker, using standard system services, reverse proxies, and cloud VMs.

---

## 1. Architecture Overview

In a production non-Docker topology:
* **Frontend**: React application built to static assets (`dist/`) and served via high-performance web servers (Nginx, Caddy, or Apache).
* **Backend**: Spring Boot standalone JAR executed via Java 17 runtime and supervised with `systemd` (Linux) or Windows Service (`NSSM`).
* **Database**: Managed or self-hosted MySQL 8.0 instance.
* **Blockchain (Optional)**: Node.js Hardhat or public EVM RPC node.

---

## 2. Step 1: Building Artifacts

### 2.1 Backend Build
```bash
cd backend
./mvnw clean package -DskipTests
# The packaged artifact will be generated at target/ledger-0.0.1-SNAPSHOT.jar
```

### 2.2 Frontend Build
```bash
npm install
npm run build
# The optimized production build is generated in the dist/ directory
```

---

## 3. Step 2: Linux Production Deployment (Ubuntu/Debian)

### 3.1 Setup System User & Directories
```bash
sudo useradd -r -s /bin/false vaultchain
sudo mkdir -p /opt/vaultchain /var/log/vaultchain
sudo cp backend/target/ledger-0.0.1-SNAPSHOT.jar /opt/vaultchain/vaultchain-backend.jar
sudo chown -R vaultchain:vaultchain /opt/vaultchain /var/log/vaultchain
```

### 3.2 Configure systemd Service for Spring Boot
Create `/etc/systemd/system/vaultchain.service`:
```ini
[Unit]
Description=VAULTCHAIN Core Banking Backend
After=network.target mysql.service

[Service]
Type=simple
User=vaultchain
Group=vaultchain
WorkingDirectory=/opt/vaultchain
ExecStart=/usr/bin/java -Xms512m -Xmx2048m -jar /opt/vaultchain/vaultchain-backend.jar
Restart=always
RestartSec=10
StandardOutput=append:/var/log/vaultchain/backend.log
StandardError=append:/var/log/vaultchain/backend-error.log

# Environment variables
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="SERVER_PORT=8080"

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable vaultchain
sudo systemctl start vaultchain
sudo systemctl status vaultchain
```

---

## 4. Step 3: Nginx Web Server & Reverse Proxy

Install Nginx and copy the built frontend static files:
```bash
sudo apt update && sudo apt install -y nginx
sudo mkdir -p /var/www/vaultchain
sudo cp -r dist/* /var/www/vaultchain/
```

Configure `/etc/nginx/sites-available/vaultchain`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/vaultchain;
    index index.html;

    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Reverse Proxy to Spring Boot Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OAuth2 authentication redirects
    location /oauth2/ {
        proxy_pass http://127.0.0.1:8080/oauth2/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/vaultchain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Step 4: Windows Server Deployment

If hosting on Windows Server without Docker:
1. **Spring Boot as a Windows Service**:
   Use NSSM (Non-Sucking Service Manager):
   ```cmd
   nssm.exe install VaultChainBackend "C:\Program Files\Java\jdk-17\bin\java.exe" "-jar C:\vaultchain\vaultchain-backend.jar"
   nssm.exe start VaultChainBackend
   ```
2. **Frontend on IIS**:
   - Install IIS URL Rewrite module.
   - Point your IIS website to `C:\vaultchain\dist`.
   - Add a `web.config` with URL rewrite rules redirecting all routes to `index.html`.
   - Configure reverse proxy rule mapping `/api/*` to `http://localhost:8080/api/*`.

---

## 6. Security Hardening Checklist

- [ ] Obtain SSL certificates via Let's Encrypt (`certbot --nginx`).
- [ ] Configure `server.ssl.enabled=true` or let Nginx terminate SSL.
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate` in production MySQL.
- [ ] Keep JWT secret keys and SMTP passwords in externalized environment variables.
- [ ] Ensure MySQL database user has restricted privileges to only the `vaultchain` database.
