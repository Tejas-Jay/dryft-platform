# 🚀 DRYFT Deployment Guide

## Local Development Setup

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Turso CLI (optional)

### 2. Environment Setup

```bash
# Clone repository
git clone <repo-url>
cd dryft

# Copy environment variables
cp .env.example .env

# Edit .env with your Turso credentials
```

### 3. Database Initialization

```bash
# Install dependencies
npm install

# Push schema to Turso
npx drizzle-kit push

# Seed database with sample data
npm run db:seed
```

### 4. Run Application

#### Option A: Docker Compose (Recommended)
```bash
# Start all services
docker-compose up --build

# Access application at http://localhost:3000
```

#### Option B: Local Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Redis
redis-server

# Terminal 3: Queue Server
cd services && python queue_server.py

# Terminal 4: Matchmaker
cd services && python matchmaker.py

# Terminal 5: Simulator
cd services && python simulator.py
```

## Production Deployment

### Vercel Deployment (Frontend)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
- Visit [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables:
  - `TURSO_CONNECTION_URL`
  - `TURSO_AUTH_TOKEN`
- Deploy!

### Python Services Deployment

#### Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Deploy services
cd services
railway up
```

#### Render.com
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python queue_server.py` (repeat for each service)
5. Add environment variables

### Redis Deployment

#### Upstash Redis (Recommended)
- Visit [upstash.com](https://upstash.com)
- Create Redis database
- Copy connection string
- Update `REDIS_HOST` and `REDIS_PORT` in services

#### Redis Cloud
- Visit [redis.com](https://redis.com)
- Create free database
- Use connection details in services

## Environment Variables by Service

### Frontend (Next.js)
```env
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=...
NODE_ENV=production
```

### Python Services
```env
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
API_BASE_URL=https://your-app.vercel.app
```

## Health Checks

### Frontend
```bash
curl http://localhost:3000/api/drivers/available
```

### Redis
```bash
redis-cli ping
```

### Services
```bash
docker-compose logs queue-server
docker-compose logs matchmaker
docker-compose logs simulator
```

## Monitoring

### Logs
```bash
# Docker logs
docker-compose logs -f

# Service-specific logs
docker-compose logs -f matchmaker
```

### Redis Queue Stats
```bash
redis-cli
> ZCARD pending_rides
> ZCARD pending_parcels
```

## Troubleshooting

### Frontend won't start
- Check Turso credentials in `.env`
- Run `npm install` to install dependencies
- Clear `.next` folder: `rm -rf .next`

### Python services connection errors
- Verify Redis is running: `docker-compose ps`
- Check Redis connection: `redis-cli ping`
- Verify API_BASE_URL is correct

### Database connection issues
- Verify Turso credentials
- Check internet connection
- Run `npx drizzle-kit push` to ensure schema is synced

## Scaling

### Horizontal Scaling
- Run multiple instances of matchmaker workers
- Load balance frontend with Vercel
- Use Redis Cluster for high availability

### Vertical Scaling
- Increase Docker container resources
- Upgrade Turso plan for more concurrent connections
- Use Redis with more memory

## Backup & Recovery

### Database Backup
```bash
# Export from Turso
turso db shell <db-name> .dump > backup.sql
```

### Redis Backup
```bash
# Save Redis data
redis-cli BGSAVE
```

## Security Checklist

- [ ] Add authentication (e.g., NextAuth.js)
- [ ] Implement rate limiting
- [ ] Use HTTPS in production
- [ ] Secure Redis with password
- [ ] Add CORS restrictions
- [ ] Validate all API inputs
- [ ] Use environment variables for secrets
- [ ] Enable Vercel security headers

## Performance Optimization

- [ ] Enable Next.js Image Optimization
- [ ] Implement caching strategies
- [ ] Use Redis for session storage
- [ ] Add CDN for static assets
- [ ] Optimize database queries
- [ ] Implement request batching

---

For more information, see the main [README.md](README.md)
