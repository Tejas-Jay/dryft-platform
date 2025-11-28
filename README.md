# 🚗 DRYFT - Full-Stack Ride-Hailing & Courier Platform

A complete production-ready ride-hailing and courier delivery platform with real-time tracking, automated matchmaking, and comprehensive admin analytics.

## 🌟 Features

### Frontend (Next.js 15 + TypeScript)
- **Dark Mode UI** with custom neon color palette (cyan, purple, pink, blue)
- **Glassmorphism Design** with backdrop blur effects
- **Ride Booking** - Pickup/drop-off selection, vehicle type choice, fare estimation
- **Courier Booking** - Parcel details form with size, weight, and fragile options
- **Real-Time Tracking** - Track rides and parcels with live location updates
- **Admin Dashboard** - Monitor rides, parcels, drivers, couriers, and revenue analytics
- **Interactive Charts** - Revenue trends, vehicle distribution, and activity heatmaps

### Backend Services (Python + Redis)
- **Queue Server** - Manages pending ride and parcel assignment queues
- **Matchmaker Worker** - Automatically assigns nearest available drivers/couriers
- **Simulator** - Simulates real-time driver/courier movement and location updates
- **Distance Calculation** - Haversine formula for accurate distance and fare calculation

### Database (Turso - LibSQL)
- **Drivers Table** - Driver profiles, vehicle types, status, ratings, locations
- **Rides Table** - Ride requests, assignments, tracking, fare calculation
- **Couriers Table** - Courier profiles, vehicle types, delivery stats
- **Parcels Table** - Parcel details, sender/recipient info, delivery tracking
- **Hubs Table** - Distribution and fulfillment centers
- **Revenue Table** - Daily revenue tracking and analytics

## 🎨 Design System

### Color Palette (Dark Mode)
```css
--neon-cyan: oklch(0.70 0.25 195)    /* #00d9ff */
--neon-purple: oklch(0.68 0.24 280)  /* #a855f7 */
--neon-pink: oklch(0.70 0.27 320)    /* #ec4899 */
--neon-blue: oklch(0.72 0.23 240)    /* #3b82f6 */
--background: oklch(0.08 0 0)        /* #14141b */
--card: oklch(0.12 0.02 264)         /* #1a1a2e */
```

### UI Components
- **Glass Cards** - Semi-transparent with backdrop blur
- **Neon Borders** - Glowing borders with box shadows
- **Gradient Text** - Multi-color gradient text effects
- **Animated Icons** - Pulse animations for live tracking

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Turso database account

### 1. Database Setup

```bash
# Install dependencies
npm install

# Push schema to Turso
npx drizzle-kit push

# Run seed scripts
npm run db:seed
```

### 2. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Run Locally (Development)

```bash
# Start Next.js frontend
npm run dev

# In separate terminals, start Python services:
cd services
python queue_server.py
python matchmaker.py
python simulator.py
```

## 📦 Project Structure

```
dryft/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Ride booking homepage
│   │   ├── courier/page.tsx      # Courier booking page
│   │   ├── track/page.tsx        # Tracking page
│   │   ├── admin/page.tsx        # Admin dashboard
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── Navigation.tsx        # Main navigation
│   │   └── ui/                   # Shadcn/UI components
│   └── db/
│       ├── schema.ts             # Database schema
│       └── seeds/                # Seed data
├── services/
│   ├── queue_server.py           # Redis queue management
│   ├── matchmaker.py             # Assignment logic
│   ├── simulator.py              # Location simulator
│   └── Dockerfile                # Python services container
├── docker-compose.yml            # Service orchestration
├── Dockerfile                    # Frontend container
└── README.md                     # This file
```

## 🔌 API Endpoints

### Rides
- `POST /api/rides/book` - Book a new ride
- `POST /api/rides/assign` - Assign ride to driver
- `POST /api/rides/complete` - Complete ride
- `GET /api/rides/tracking?id={rideId}` - Track ride

### Couriers
- `POST /api/couriers/book` - Book courier delivery
- `POST /api/couriers/assign` - Assign parcel to courier
- `POST /api/couriers/complete` - Complete delivery
- `GET /api/parcels/tracking?id={parcelId}` - Track parcel

### Resources
- `GET /api/drivers/available` - List available drivers
- `GET /api/couriers/available` - List available couriers

## 🧪 Testing

Visit the application at http://localhost:3000 and explore:

- **/** - Book rides with vehicle selection and fare estimates
- **/courier** - Book courier deliveries with parcel details
- **/track** - Track rides and parcels in real-time
- **/admin** - View analytics, charts, and manage fleet

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js web application |
| redis | 6379 | Redis cache and queue |
| queue-server | - | Queue management service |
| matchmaker | - | Assignment worker |
| simulator | - | Location simulator |

## 📊 Pricing Model

### Rides
- Base fare: $5.00
- Per kilometer: $2.00
- Formula: `fare = 5 + (distance * 2)`

### Courier
- Base fee: $3.00
- Per kilometer: $1.50
- Size multipliers: Small (1x), Medium (1.5x), Large (2x)
- Formula: `fee = (3 + distance * 1.5) * size_multiplier`

## 🎯 Matchmaking Algorithm

1. Pending requests added to Redis sorted set
2. Calculate distance using Haversine formula
3. Find nearest available driver/courier
4. Assign and update database
5. Remove from pending queue

## 🔐 Security Notes

- Add authentication before production use
- Implement rate limiting
- Use HTTPS in production
- Secure Redis with password
- Validate all inputs

## 📝 License

MIT License

---

**Built with ❤️ using Next.js, TypeScript, Python, Redis, and Turso**