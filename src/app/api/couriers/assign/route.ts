import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parcels, couriers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parcelId, courierId } = body;

    // Validate required fields
    if (!parcelId || !courierId) {
      return NextResponse.json(
        { 
          error: 'parcelId and courierId are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate fields are valid integers
    const parsedParcelId = parseInt(parcelId);
    const parsedCourierId = parseInt(courierId);

    if (isNaN(parsedParcelId) || isNaN(parsedCourierId)) {
      return NextResponse.json(
        { 
          error: 'parcelId and courierId must be valid integers',
          code: 'INVALID_ID_FORMAT'
        },
        { status: 400 }
      );
    }

    // Check if parcel exists and status is 'pending'
    const parcel = await db.select()
      .from(parcels)
      .where(and(
        eq(parcels.id, parsedParcelId),
        eq(parcels.status, 'pending')
      ))
      .limit(1);

    if (parcel.length === 0) {
      return NextResponse.json(
        { 
          error: 'Parcel not found or not available for assignment',
          code: 'PARCEL_NOT_AVAILABLE'
        },
        { status: 404 }
      );
    }

    // Check if courier exists and status is 'available'
    const courier = await db.select()
      .from(couriers)
      .where(and(
        eq(couriers.id, parsedCourierId),
        eq(couriers.status, 'available')
      ))
      .limit(1);

    if (courier.length === 0) {
      return NextResponse.json(
        { 
          error: 'Courier not found or not available',
          code: 'COURIER_NOT_AVAILABLE'
        },
        { status: 404 }
      );
    }

    // Update parcel: set courierId, status='assigned', assignedAt
    const updatedParcel = await db.update(parcels)
      .set({
        courierId: parsedCourierId,
        status: 'assigned',
        assignedAt: new Date().toISOString()
      })
      .where(eq(parcels.id, parsedParcelId))
      .returning();

    // Update courier: set status='busy'
    const updatedCourier = await db.update(couriers)
      .set({
        status: 'busy'
      })
      .where(eq(couriers.id, parsedCourierId))
      .returning();

    // Return success response with formatted courier data
    return NextResponse.json({
      success: true,
      parcel: updatedParcel[0],
      courier: {
        id: updatedCourier[0].id,
        name: updatedCourier[0].name,
        phone: updatedCourier[0].phone,
        vehicleType: updatedCourier[0].vehicleType,
        rating: updatedCourier[0].rating
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}