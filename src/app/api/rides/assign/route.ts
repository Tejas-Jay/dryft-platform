import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rides, drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rideId, driverId } = body;

    // Validate required fields
    if (!rideId || !driverId) {
      return NextResponse.json(
        { 
          error: 'rideId and driverId are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate IDs are valid integers
    const parsedRideId = parseInt(rideId);
    const parsedDriverId = parseInt(driverId);

    if (isNaN(parsedRideId) || isNaN(parsedDriverId)) {
      return NextResponse.json(
        { 
          error: 'rideId and driverId must be valid integers',
          code: 'INVALID_ID_FORMAT'
        },
        { status: 400 }
      );
    }

    // Check if ride exists and status is 'pending'
    const existingRide = await db.select()
      .from(rides)
      .where(eq(rides.id, parsedRideId))
      .limit(1);

    if (existingRide.length === 0 || existingRide[0].status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Ride not found or not available for assignment',
          code: 'RIDE_NOT_AVAILABLE'
        },
        { status: 404 }
      );
    }

    // Check if driver exists and status is 'available'
    const existingDriver = await db.select()
      .from(drivers)
      .where(eq(drivers.id, parsedDriverId))
      .limit(1);

    if (existingDriver.length === 0 || existingDriver[0].status !== 'available') {
      return NextResponse.json(
        { 
          error: 'Driver not found or not available',
          code: 'DRIVER_NOT_AVAILABLE'
        },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Update ride: set driverId, status='assigned', assignedAt
    const updatedRide = await db.update(rides)
      .set({
        driverId: parsedDriverId,
        status: 'assigned',
        assignedAt: now
      })
      .where(eq(rides.id, parsedRideId))
      .returning();

    // Update driver: set status='busy'
    const updatedDriver = await db.update(drivers)
      .set({
        status: 'busy'
      })
      .where(eq(drivers.id, parsedDriverId))
      .returning();

    // Return success response with formatted driver data
    return NextResponse.json({
      success: true,
      ride: updatedRide[0],
      driver: {
        id: updatedDriver[0].id,
        name: updatedDriver[0].name,
        phone: updatedDriver[0].phone,
        vehicleType: updatedDriver[0].vehicleType,
        rating: updatedDriver[0].rating
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}