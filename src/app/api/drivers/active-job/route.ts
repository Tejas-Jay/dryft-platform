import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rides, parcels, drivers } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

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

    // Check for active ride (assigned or in_progress)
    const activeRide = await db.select()
      .from(rides)
      .where(
        and(
          eq(rides.driverId, parsedDriverId),
          or(
            eq(rides.status, 'assigned'),
            eq(rides.status, 'in_progress')
          )
        )
      )
      .limit(1);

    if (activeRide.length > 0) {
      const ride = activeRide[0];
      return NextResponse.json({
        success: true,
        hasActiveJob: true,
        job: {
          id: ride.id,
          type: 'ride',
          jobType: 'Standard Ride',
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
          driverPayout: (ride.fare || 0) * 0.75,
          assignedAt: ride.assignedAt,
        }
      }, { status: 200 });
    }

    // No active job found
    return NextResponse.json({
      success: true,
      hasActiveJob: false,
      job: null
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
