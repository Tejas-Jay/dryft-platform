import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rides, drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate id parameter
    if (!id) {
      return NextResponse.json(
        { error: 'Ride ID is required', code: 'MISSING_RIDE_ID' },
        { status: 400 }
      );
    }

    const rideId = parseInt(id);
    if (isNaN(rideId)) {
      return NextResponse.json(
        { error: 'Invalid ride ID', code: 'INVALID_RIDE_ID' },
        { status: 400 }
      );
    }

    // Query ride by ID
    const rideResult = await db
      .select()
      .from(rides)
      .where(eq(rides.id, rideId))
      .limit(1);

    if (rideResult.length === 0) {
      return NextResponse.json(
        { error: 'Ride not found', code: 'RIDE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const ride = rideResult[0];
    let driver = null;

    // If ride has a driver assigned, fetch driver details
    if (ride.driverId) {
      const driverResult = await db
        .select({
          id: drivers.id,
          name: drivers.name,
          phone: drivers.phone,
          vehicleType: drivers.vehicleType,
          currentLat: drivers.currentLat,
          currentLng: drivers.currentLng,
          rating: drivers.rating,
        })
        .from(drivers)
        .where(eq(drivers.id, ride.driverId))
        .limit(1);

      if (driverResult.length > 0) {
        driver = driverResult[0];
      }
    }

    // Return ride details with driver information
    return NextResponse.json(
      {
        ride: {
          id: ride.id,
          passengerName: ride.passengerName,
          passengerPhone: ride.passengerPhone,
          pickupAddress: ride.pickupAddress,
          pickupLat: ride.pickupLat,
          pickupLng: ride.pickupLng,
          dropoffAddress: ride.dropoffAddress,
          dropoffLat: ride.dropoffLat,
          dropoffLng: ride.dropoffLng,
          vehicleType: ride.vehicleType,
          status: ride.status,
          fare: ride.fare,
          distanceKm: ride.distanceKm,
          durationMin: ride.durationMin,
          requestedAt: ride.requestedAt,
          assignedAt: ride.assignedAt,
          startedAt: ride.startedAt,
          completedAt: ride.completedAt,
        },
        driver,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}