import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rides, parcels, drivers, hubs } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { error: 'driverId is required' },
        { status: 400 }
      );
    }

    const parsedDriverId = parseInt(driverId);
    if (isNaN(parsedDriverId)) {
      return NextResponse.json(
        { error: 'Invalid driverId' },
        { status: 400 }
      );
    }

    // Get driver info
    const driver = await db.select()
      .from(drivers)
      .where(eq(drivers.id, parsedDriverId))
      .limit(1);

    if (driver.length === 0) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const driverData = driver[0];

    // Get pending rides (not assigned to anyone)
    const pendingRides = await db.select()
      .from(rides)
      .where(and(
        eq(rides.status, 'pending'),
        isNull(rides.driverId)
      ))
      .limit(20);

    // Get pending parcels (not assigned to any courier) - drivers can do first-mile courier runs
    const pendingParcels = await db.select()
      .from(parcels)
      .where(and(
        eq(parcels.status, 'pending'),
        isNull(parcels.courierId)
      ))
      .limit(20);

    // Get nearest hub for depot destination
    const allHubs = await db.select().from(hubs);

    // Format jobs with distance, payout, and job type
    const jobs = [];

    // Format rides as "Standard Ride" jobs
    for (const ride of pendingRides) {
      const distance = driverData.currentLat && driverData.currentLng
        ? haversineDistance(driverData.currentLat, driverData.currentLng, ride.pickupLat, ride.pickupLng)
        : 0;

      const baseFare = ride.fare || 0;
      const driverPayout = baseFare * 0.75; // 75% of fare

      jobs.push({
        id: ride.id,
        type: 'ride',
        jobType: 'Standard Ride',
        passengerName: ride.passengerName,
        pickupAddress: ride.pickupAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffAddress: ride.dropoffAddress,
        dropoffLat: ride.dropoffLat,
        dropoffLng: ride.dropoffLng,
        vehicleType: ride.vehicleType,
        distanceToPickup: Number(distance.toFixed(2)),
        fare: baseFare,
        driverPayout: Number(driverPayout.toFixed(2)),
        requestedAt: ride.requestedAt,
      });
    }

    // Format parcels as "First-Mile Courier Run" jobs
    for (const parcel of pendingParcels) {
      const distance = driverData.currentLat && driverData.currentLng
        ? haversineDistance(driverData.currentLat, driverData.currentLng, parcel.senderLat, parcel.senderLng)
        : 0;

      // Find nearest hub as depot destination
      let nearestHub = allHubs.length > 0 ? allHubs[0] : null;
      let minHubDistance = nearestHub
        ? haversineDistance(parcel.senderLat, parcel.senderLng, nearestHub.lat, nearestHub.lng)
        : Infinity;

      for (const hub of allHubs) {
        const hubDist = haversineDistance(parcel.senderLat, parcel.senderLng, hub.lat, hub.lng);
        if (hubDist < minHubDistance) {
          minHubDistance = hubDist;
          nearestHub = hub;
        }
      }

      // Calculate payout: 75% of (local base fare + ₹50 First Mile Premium)
      const localBaseFare = parcel.fee || 0;
      const firstMilePremium = 50; // ₹50 in INR (or $0.60 USD equivalent)
      const totalFare = localBaseFare + firstMilePremium;
      const driverPayout = totalFare * 0.75;

      jobs.push({
        id: parcel.id,
        type: 'courier',
        jobType: 'First-Mile Courier Run',
        senderName: parcel.senderName,
        pickupAddress: parcel.senderAddress,
        pickupLat: parcel.senderLat,
        pickupLng: parcel.senderLng,
        depotName: nearestHub?.name || 'Local Bus Depot',
        depotAddress: nearestHub?.address || 'Central Depot',
        depotLat: nearestHub?.lat || parcel.senderLat,
        depotLng: nearestHub?.lng || parcel.senderLng,
        weightKg: parcel.weightKg,
        size: parcel.size,
        fragile: parcel.fragile,
        distanceToPickup: Number(distance.toFixed(2)),
        localBaseFare,
        firstMilePremium,
        totalFare: Number(totalFare.toFixed(2)),
        driverPayout: Number(driverPayout.toFixed(2)),
        requestedAt: parcel.requestedAt,
      });
    }

    // Sort by distance to pickup (closest first)
    jobs.sort((a, b) => a.distanceToPickup - b.distanceToPickup);

    return NextResponse.json({
      success: true,
      driver: {
        id: driverData.id,
        name: driverData.name,
        status: driverData.status,
        vehicleType: driverData.vehicleType,
        rating: driverData.rating,
        totalRides: driverData.totalRides,
      },
      jobs: jobs.slice(0, 10), // Return top 10 closest jobs
      totalAvailable: jobs.length,
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
