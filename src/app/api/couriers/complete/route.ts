import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parcels, couriers, revenue } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parcelId } = body;

    // Validate parcelId
    if (!parcelId) {
      return NextResponse.json(
        { error: 'parcelId is required', code: 'MISSING_PARCEL_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(parcelId.toString()))) {
      return NextResponse.json(
        { error: 'Valid parcelId is required', code: 'INVALID_PARCEL_ID' },
        { status: 400 }
      );
    }

    const parcelIdInt = parseInt(parcelId.toString());

    // Fetch parcel with courier information
    const existingParcel = await db
      .select()
      .from(parcels)
      .where(eq(parcels.id, parcelIdInt))
      .limit(1);

    if (existingParcel.length === 0) {
      return NextResponse.json(
        { error: 'Parcel not found', code: 'PARCEL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const parcel = existingParcel[0];

    // Verify parcel status
    const validStatuses = ['in_transit', 'picked_up', 'assigned'];
    if (!validStatuses.includes(parcel.status)) {
      return NextResponse.json(
        { 
          error: 'Parcel is not in an active delivery state', 
          code: 'INVALID_PARCEL_STATUS',
          currentStatus: parcel.status
        },
        { status: 400 }
      );
    }

    // Verify courier exists
    if (!parcel.courierId) {
      return NextResponse.json(
        { error: 'Parcel has no assigned courier', code: 'NO_COURIER_ASSIGNED' },
        { status: 400 }
      );
    }

    const existingCourier = await db
      .select()
      .from(couriers)
      .where(eq(couriers.id, parcel.courierId))
      .limit(1);

    if (existingCourier.length === 0) {
      return NextResponse.json(
        { error: 'Assigned courier not found', code: 'COURIER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const courier = existingCourier[0];
    const now = new Date().toISOString();

    // Update parcel status to delivered
    const completedParcel = await db
      .update(parcels)
      .set({
        status: 'delivered',
        deliveredAt: now,
      })
      .where(eq(parcels.id, parcelIdInt))
      .returning();

    // Update courier status and increment totalDeliveries
    await db
      .update(couriers)
      .set({
        status: 'available',
        totalDeliveries: courier.totalDeliveries + 1,
      })
      .where(eq(couriers.id, parcel.courierId))
      .returning();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Check if revenue record exists for today
    const existingRevenue = await db
      .select()
      .from(revenue)
      .where(eq(revenue.date, today))
      .limit(1);

    if (existingRevenue.length > 0) {
      // Update existing revenue record
      const currentRevenue = existingRevenue[0];
      await db
        .update(revenue)
        .set({
          courierRevenue: currentRevenue.courierRevenue + (parcel.fee || 0),
          totalRevenue: currentRevenue.totalRevenue + (parcel.fee || 0),
          parcelCount: currentRevenue.parcelCount + 1,
        })
        .where(eq(revenue.date, today));
    } else {
      // Create new revenue record for today
      await db
        .insert(revenue)
        .values({
          date: today,
          courierRevenue: parcel.fee || 0,
          rideRevenue: 0,
          totalRevenue: parcel.fee || 0,
          parcelCount: 1,
          rideCount: 0,
          createdAt: now,
        });
    }

    return NextResponse.json(
      {
        success: true,
        parcel: completedParcel[0],
        revenueUpdated: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}