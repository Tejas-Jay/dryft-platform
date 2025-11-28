# 🚀 DRYFT Quick Start Guide

## 🎯 What You've Built

A complete full-stack ride-hailing and courier platform with:

✅ **Next.js Frontend** - Dark mode UI with neon colors and glassmorphism  
✅ **Turso Database** - 6 tables with seed data (drivers, rides, couriers, parcels, hubs, revenue)  
✅ **Python Services** - Queue server, matchmaker, and simulator  
✅ **Redis** - Real-time queue management  
✅ **Docker** - Complete containerized setup  

## 📱 Pages Available

- **/** - Ride booking with vehicle selection
- **/courier** - Parcel delivery booking
- **/track** - Real-time tracking for rides/parcels
- **/admin** - Analytics dashboard with charts

## 🏃 Run in 3 Steps

### 1. Start the Database (Already Done!)
Your Turso database is configured with seed data for:
- 10 drivers (8 available)
- 10 couriers (8 available)
- 5 hubs across NYC
- 15 completed rides
- 15 completed parcels
- 7 days of revenue data

### 2. Start the Application

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Test the Features

#### Book a Ride
1. Go to homepage (/)
2. Fill in passenger name and phone
3. Enter pickup: "Times Square, New York"
4. Enter dropoff: "Central Park, New York"
5. Select vehicle type (Sedan/SUV/Van)
6. Click "Book Ride Now"
7. See fare estimate and ride confirmation

#### Book a Courier Delivery
1. Go to /courier
2. Fill in sender details
3. Fill in recipient details
4. Enter parcel weight and size
5. Check "Fragile" if needed
6. Click "Book Delivery Now"
7. Get tracking ID

#### Track Orders
1. Go to /track
2. Select "Ride" or "Parcel"
3. Enter ID (from previous booking)
4. View real-time status and details

#### View Admin Dashboard
1. Go to /admin
2. See statistics and charts
3. View active drivers and couriers
4. Monitor revenue trends

## 🐳 Docker Setup (Optional)

To run the complete stack with Python services:

```bash
# Start all services
docker-compose up --build

# Services running:
# - frontend:3000 (Next.js)
# - redis:6379 (Queue)
# - queue-server (Python)
# - matchmaker (Python)
# - simulator (Python)
```

## 📊 API Endpoints

Test the APIs directly:

```bash
# Get available drivers
curl http://localhost:3000/api/drivers/available

# Get available couriers
curl http://localhost:3000/api/couriers/available

# Track a ride
curl http://localhost:3000/api/rides/tracking?id=1

# Track a parcel
curl http://localhost:3000/api/parcels/tracking?id=1
```

## 🎨 UI Features

### Neon Color Palette
- **Cyan**: `#00d9ff` - Primary actions, drivers
- **Purple**: `#a855f7` - Secondary actions
- **Pink**: `#ec4899` - Accents, couriers
- **Blue**: `#3b82f6` - Information

### Glassmorphism Effects
- Semi-transparent cards with backdrop blur
- Neon borders with glow effects
- Gradient text animations
- Smooth transitions

## 🔧 Database Commands

```bash
# View database in browser
npm run db:studio

# Re-seed specific data
npm run db:seed:drivers
npm run db:seed:couriers
npm run db:seed:rides
npm run db:seed:parcels

# Re-seed everything
npm run db:seed
```

## 📈 Pricing

### Rides
- Base: $5.00
- Per km: $2.00
- Example: 10km ride = $25.00

### Courier
- Base: $3.00
- Per km: $1.50
- Size multipliers: Small (1x), Medium (1.5x), Large (2x)
- Example: 5km medium package = $13.50

## 🚨 Troubleshooting

### "Cannot find module..."
```bash
npm install
```

### Database connection error
Check `.env` file has valid Turso credentials

### Port 3000 already in use
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## 🎯 Next Steps

1. **Add Authentication** - Use NextAuth.js or Clerk
2. **Implement Real Maps** - Integrate Mapbox or Google Maps
3. **Add Payments** - Integrate Stripe or PayPal
4. **Enable Notifications** - Add push notifications
5. **Deploy to Production** - Use Vercel + Railway

## 📚 Documentation

- [README.md](README.md) - Full documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [Database Schema](src/db/schema.ts) - Table structures
- [API Routes](src/app/api/) - Backend endpoints

## 💡 Tips

- Use the admin dashboard to see all system activity
- The simulator automatically updates driver/courier locations
- The matchmaker assigns rides/parcels to nearest available drivers/couriers
- All coordinates are set for NYC (40.70-40.80 lat, -74.00 to -73.90 lng)

---

**Enjoy building with DRYFT! 🚗📦**
