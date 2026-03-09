# Vector Research Papers - Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the Vector Research Papers Platform in production environments.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: 20GB+ available disk space
- **Network**: Static IP address or domain name
- **Ports**: 80, 443, and 8080 available

### Required Software
- Docker (20.10+)
- Docker Compose (2.0+)
- Git
- OpenSSL (for certificate management)

### Domain and DNS Setup
- Domain name pointing to your server IP
- DNS A record: `yourdomain.com` → `your.server.ip`
- DNS CNAME record (optional): `www.yourdomain.com` → `yourdomain.com`

## Installation Steps

### 1. Server Preparation

#### Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git curl wget unzip
```

#### Install Docker
```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

#### Configure Firewall
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (adjust port if needed)
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow Traefik dashboard (optional, restrict IP if needed)
sudo ufw allow 8080

# Check status
sudo ufw status
```

### 2. Application Setup

#### Clone Repository
```bash
# Clone the repository
git clone https://github.com/yourusername/vector-app.git
cd vector-app

# Or upload your application files
# rsync -avz --exclude 'node_modules' local-app/ user@server:/path/to/vector-app/
```

#### Configure Environment
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit environment file
nano .env.production
```

#### Required Environment Variables
```bash
# Database Configuration
POSTGRES_DB=vector_research
POSTGRES_USER=vector_user
POSTGRES_PASSWORD=your_secure_postgres_password_here

# Application Configuration  
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here

# Domain Configuration
DOMAIN=yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# SSL Configuration
ACME_EMAIL=admin@yourdomain.com
ACME_SERVER=https://acme-v02.api.letsencrypt.org/directory

# Traefik Configuration
TRAEFIK_LOG_LEVEL=INFO
TRAEFIK_DASHBOARD_PORT=8080
TRAEFIK_AUTH_USERS=admin:$$2y$$10$$your_bcrypt_hashed_password_here

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

#### Generate Secure Passwords
```bash
# Generate secure passwords
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 24  # For database password
openssl rand -base64 16  # For admin password

# Generate bcrypt hash for Traefik auth
htpasswd -nb admin your_traefik_password
```

### 3. Deployment Process

#### Make Scripts Executable
```bash
chmod +x scripts/deploy.sh
chmod +x scripts/health-check.sh
chmod +x scripts/backup.sh
```

#### Run Deployment
```bash
# Run the deployment script
./scripts/deploy.sh
```

The deployment script will:
1. Validate environment configuration
2. Build Docker images
3. Start all services
4. Wait for health checks to pass
5. Display deployment status

#### Manual Deployment (Alternative)
```bash
# Validate configuration
docker-compose config

# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 4. Verification

#### Run Health Checks
```bash
# Run comprehensive health check
./scripts/health-check.sh
```

#### Manual Verification
```bash
# Check container status
docker ps

# Test API endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/papers

# Check logs
docker-compose logs vector_app
docker-compose logs traefik
```

#### SSL Certificate Verification
```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test HTTPS redirect
curl -I http://yourdomain.com
```

## Post-Deployment Configuration

### 1. Admin Account Setup
1. Navigate to `https://yourdomain.com/admin/login`
2. Login with configured admin credentials
3. Change password immediately
4. Test paper creation and management

### 2. Backup Configuration
```bash
# Test backup functionality
./scripts/backup.sh

# Schedule automatic backups (add to crontab)
crontab -e
# Add line: 0 2 * * * /path/to/vector-app/scripts/backup.sh
```

### 3. Monitoring Setup
```bash
# Access Traefik dashboard
https://traefik.yourdomain.com:8080

# Monitor application logs
docker-compose logs -f vector_app

# Monitor resource usage
docker stats
```

## Maintenance and Updates

### Regular Maintenance Tasks

#### Weekly Tasks
- Check backup integrity
- Review security logs
- Monitor disk space usage
- Update system packages

#### Monthly Tasks
- Review SSL certificate expiry
- Analyze performance metrics
- Update Docker images
- Test disaster recovery procedures

### Updating the Application

#### Standard Update Process
```bash
# Backup current state
./scripts/backup.sh

# Pull latest changes
git pull origin main

# Rebuild and redeploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify deployment
./scripts/health-check.sh
```

#### Rollback Procedure
```bash
# Stop current deployment
docker-compose down

# Revert to previous version
git checkout previous-working-commit

# Restore database if needed
zcat backups/vector_backup_TIMESTAMP.sql.gz | \
  docker exec -i vector_postgres psql -U vector_user -d vector_research

# Start services
docker-compose up -d
```

## Security Hardening

### 1. Server Security
```bash
# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Set up fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 2. Application Security
- Use strong, unique passwords for all accounts
- Enable HTTPS everywhere (handled by Traefik)
- Configure rate limiting (included in docker-compose.yml)
- Regular security updates
- Monitor access logs

### 3. Docker Security
```bash
# Run containers as non-root users (configured in Dockerfile)
# Use minimal base images (Alpine Linux)
# Scan images for vulnerabilities
docker scout cves vector_app:latest
```

## Monitoring and Logging

### Log Locations
```bash
# Application logs
docker-compose logs vector_app

# Database logs  
docker-compose logs postgres

# Traefik logs
docker-compose logs traefik

# System logs
sudo journalctl -u docker
```

### Log Management
```bash
# Configure log rotation
sudo nano /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

sudo systemctl restart docker
```

### Performance Monitoring
```bash
# Monitor resource usage
htop
docker stats

# Check disk usage
df -h
du -sh /var/lib/docker/

# Monitor network connections
netstat -tlnp
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker-compose logs container_name

# Check resource usage
df -h
free -m

# Verify environment variables
docker-compose config
```

#### SSL Certificate Issues
```bash
# Check certificate status
docker-compose logs traefik | grep -i cert

# Manual certificate request
docker exec traefik traefik healthcheck

# Check Let's Encrypt rate limits
# https://letsencrypt.org/docs/rate-limits/
```

#### Database Connection Issues
```bash
# Test database connectivity
docker exec vector_postgres pg_isready -U vector_user

# Check database logs
docker-compose logs postgres

# Connect to database manually
docker exec -it vector_postgres psql -U vector_user -d vector_research
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Analyze slow queries (if applicable)
docker exec vector_postgres pg_stat_statements

# Monitor application performance
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/
```

### Getting Help
1. Check application logs first
2. Verify environment configuration  
3. Test individual components
4. Review Docker and system logs
5. Check network connectivity
6. Consult documentation and community resources

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups
- **Application Files**: Version control (Git)
- **Configuration**: Environment files backup
- **SSL Certificates**: Automatic renewal via Let's Encrypt

### Recovery Procedures
1. **Server Failure**: Deploy to new server using this guide
2. **Data Loss**: Restore from latest database backup
3. **Configuration Issues**: Restore from known-good configuration
4. **SSL Certificate Issues**: Force certificate renewal

### Recovery Testing
- Test backup restoration monthly
- Verify disaster recovery procedures
- Document recovery time objectives
- Train team on recovery procedures

---

For additional support or questions about deployment, please refer to the troubleshooting section or contact technical support.