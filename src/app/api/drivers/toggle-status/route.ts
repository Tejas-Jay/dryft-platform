import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, status } = body;

    if (!driverId || !status) {
      return NextResponse.json(
        { error: 'driverId and status are required' },
        { status: 400 }
      );
    }

    if (!['available', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "available" or "offline"' },
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

    // Update driver status
    const updatedDriver = await db.update(drivers)
      .set({ status })
      .where(eq(drivers.id, parsedDriverId))
      .returning();

    if (updatedDriver.length === 0) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      driver: updatedDriver[0]
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
