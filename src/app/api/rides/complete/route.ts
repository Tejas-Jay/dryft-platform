import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rides, drivers, revenue } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rideId } = body;

    // Validate rideId
    if (!rideId) {
      return NextResponse.json({ 
        error: 'rideId is required',
        code: 'MISSING_RIDE_ID' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(rideId))) {
      return NextResponse.json({ 
        error: 'Valid rideId is required',
        code: 'INVALID_RIDE_ID' 
      }, { status: 400 });
    }

    const rideIdInt = parseInt(rideId);

    // Fetch ride with driver information
    const rideResult = await db.select()
      .from(rides)
      .where(eq(rides.id, rideIdInt))
      .limit(1);

    if (rideResult.length === 0) {
      return NextResponse.json({ 
        error: 'Ride not found',
        code: 'RIDE_NOT_FOUND' 
      }, { status: 404 });
    }

    const ride = rideResult[0];

    // Verify ride status
    if (ride.status !== 'in_progress' && ride.status !== 'assigned') {
      return NextResponse.json({ 
        error: 'Ride is not in progress or assigned',
        code: 'INVALID_RIDE_STATUS' 
      }, { status: 400 });
    }

    // Verify ride has a driver assigned
    if (!ride.driverId) {
      return NextResponse.json({ 
        error: 'Ride does not have a driver assigned',
        code: 'NO_DRIVER_ASSIGNED' 
      }, { status: 400 });
    }

    // Verify ride has fare
    if (!ride.fare || ride.fare <= 0) {
      return NextResponse.json({ 
        error: 'Ride does not have a valid fare',
        code: 'INVALID_FARE' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0]; // YYYY-MM-DD format

    // Update ride status to completed
    const completedRide = await db.update(rides)
      .set({
        status: 'completed',
        completedAt: now
      })
      .where(eq(rides.id, rideIdInt))
      .returning();

    if (completedRide.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update ride status',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    // Update driver status and increment total rides
    const driverResult = await db.select()
      .from(drivers)
      .where(eq(drivers.id, ride.driverId))
      .limit(1);

    if (driverResult.length > 0) {
      const driver = driverResult[0];
      await db.update(drivers)
        .set({
          status: 'available',
          totalRides: (driver.totalRides || 0) + 1
        })
        .where(eq(drivers.id, ride.driverId));
    }

    // Update or create revenue record for today
    const revenueResult = await db.select()
      .from(revenue)
      .where(eq(revenue.date, today))
      .limit(1);

    if (revenueResult.length > 0) {
      // Update existing revenue record
      const existingRevenue = revenueResult[0];
      await db.update(revenue)
        .set({
          rideRevenue: (existingRevenue.rideRevenue || 0) + ride.fare,
          totalRevenue: (existingRevenue.totalRevenue || 0) + ride.fare,
          rideCount: (existingRevenue.rideCount || 0) + 1
        })
        .where(eq(revenue.date, today));
    } else {
      // Create new revenue record
      await db.insert(revenue)
        .values({
          date: today,
          rideRevenue: ride.fare,
          courierRevenue: 0,
          totalRevenue: ride.fare,
          rideCount: 1,
          parcelCount: 0,
          createdAt: now
        });
    }

    return NextResponse.json({
      success: true,
      ride: completedRide[0],
      revenueUpdated: true
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}