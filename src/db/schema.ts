import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Drivers table
export const drivers = sqliteTable('drivers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull().unique(),
  vehicleType: text('vehicle_type').notNull(), // sedan/suv/van
  licensePlate: text('license_plate').notNull(),
  status: text('status').notNull().default('available'), // available/busy/offline
  currentLat: real('current_lat'),
  currentLng: real('current_lng'),
  rating: real('rating').default(5.0),
  totalRides: integer('total_rides').default(0),
  createdAt: text('created_at').notNull(),
});

// Rides table
export const rides = sqliteTable('rides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  passengerName: text('passenger_name').notNull(),
  passengerPhone: text('passenger_phone').notNull(),
  pickupAddress: text('pickup_address').notNull(),
  pickupLat: real('pickup_lat').notNull(),
  pickupLng: real('pickup_lng').notNull(),
  dropoffAddress: text('dropoff_address').notNull(),
  dropoffLat: real('dropoff_lat').notNull(),
  dropoffLng: real('dropoff_lng').notNull(),
  vehicleType: text('vehicle_type').notNull(),
  status: text('status').notNull().default('pending'), // pending/assigned/in_progress/completed/cancelled
  driverId: integer('driver_id').references(() => drivers.id),
  fare: real('fare'),
  distanceKm: real('distance_km'),
  durationMin: integer('duration_min'),
  requestedAt: text('requested_at').notNull(),
  assignedAt: text('assigned_at'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});

// Couriers table
export const couriers = sqliteTable('couriers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull().unique(),
  vehicleType: text('vehicle_type').notNull(), // bike/scooter/car
  status: text('status').notNull().default('available'), // available/busy/offline
  currentLat: real('current_lat'),
  currentLng: real('current_lng'),
  rating: real('rating').default(5.0),
  totalDeliveries: integer('total_deliveries').default(0),
  createdAt: text('created_at').notNull(),
});

// Parcels table
export const parcels = sqliteTable('parcels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderName: text('sender_name').notNull(),
  senderPhone: text('sender_phone').notNull(),
  senderAddress: text('sender_address').notNull(),
  senderLat: real('sender_lat').notNull(),
  senderLng: real('sender_lng').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientPhone: text('recipient_phone').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  recipientLat: real('recipient_lat').notNull(),
  recipientLng: real('recipient_lng').notNull(),
  weightKg: real('weight_kg').notNull(),
  size: text('size').notNull(), // small/medium/large
  fragile: integer('fragile', { mode: 'boolean' }).default(false),
  status: text('status').notNull().default('pending'), // pending/assigned/picked_up/in_transit/delivered/cancelled
  courierId: integer('courier_id').references(() => couriers.id),
  fee: real('fee'),
  distanceKm: real('distance_km'),
  requestedAt: text('requested_at').notNull(),
  assignedAt: text('assigned_at'),
  pickedUpAt: text('picked_up_at'),
  deliveredAt: text('delivered_at'),
});

// Hubs table
export const hubs = sqliteTable('hubs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  capacity: integer('capacity').notNull(),
  currentParcels: integer('current_parcels').default(0),
  type: text('type').notNull(), // distribution/fulfillment
  createdAt: text('created_at').notNull(),
});

// Revenue table
export const revenue = sqliteTable('revenue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(),
  rideRevenue: real('ride_revenue').default(0),
  courierRevenue: real('courier_revenue').default(0),
  totalRevenue: real('total_revenue').default(0),
  rideCount: integer('ride_count').default(0),
  parcelCount: integer('parcel_count').default(0),
  createdAt: text('created_at').notNull(),
});