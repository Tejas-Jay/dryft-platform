import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rides, parcels, drivers } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, jobId, jobType } = body;

    if (!driverId || !jobId || !jobType) {
      return NextResponse.json(
        { error: 'driverId, jobId, and jobType are required' },
        { status: 400 }
      );
    }

    if (!['ride', 'courier'].includes(jobType)) {
      return NextResponse.json(
        { error: 'jobType must be "ride" or "courier"' },
        { status: 400 }
      );
    }

    const parsedDriverId = parseInt(driverId);
    const parsedJobId = parseInt(jobId);

    if (isNaN(parsedDriverId) || isNaN(parsedJobId)) {
      return NextResponse.json(
        { error: 'Invalid driverId or jobId' },
        { status: 400 }
      );
    }

    // Check driver exists and is available
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

    if (driver[0].status !== 'available') {
      return NextResponse.json(
        { error: 'Driver is not available' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (jobType === 'ride') {
      // Check ride exists and is pending
      const ride = await db.select()
        .from(rides)
        .where(and(
          eq(rides.id, parsedJobId),
          eq(rides.status, 'pending'),
          isNull(rides.driverId)
        ))
        .limit(1);

      if (ride.length === 0) {
        return NextResponse.json(
          { error: 'Ride not available' },
          { status: 404 }
        );
      }

      // Assign ride to driver
      const updatedRide = await db.update(rides)
        .set({
          driverId: parsedDriverId,
          status: 'assigned',
          assignedAt: now
        })
        .where(eq(rides.id, parsedJobId))
        .returning();

      // Update driver status to busy
      await db.update(drivers)
        .set({ status: 'busy' })
        .where(eq(drivers.id, parsedDriverId));

      return NextResponse.json({
        success: true,
        jobType: 'ride',
        job: updatedRide[0]
      }, { status: 200 });

    } else if (jobType === 'courier') {
      // Check parcel exists and is pending
      const parcel = await db.select()
        .from(parcels)
        .where(and(
          eq(parcels.id, parsedJobId),
          eq(parcels.status, 'pending'),
          isNull(parcels.courierId)
        ))
        .limit(1);

      if (parcel.length === 0) {
        return NextResponse.json(
          { error: 'Parcel not available' },
          { status: 404 }
        );
      }

      // Assign parcel to driver (using courierId field)
      const updatedParcel = await db.update(parcels)
        .set({
          courierId: parsedDriverId, // Using driver as courier for first-mile
          status: 'assigned',
          assignedAt: now
        })
        .where(eq(parcels.id, parsedJobId))
        .returning();

      // Update driver status to busy
      await db.update(drivers)
        .set({ status: 'busy' })
        .where(eq(drivers.id, parsedDriverId));

      return NextResponse.json({
        success: true,
        jobType: 'courier',
        job: updatedParcel[0]
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid job type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
