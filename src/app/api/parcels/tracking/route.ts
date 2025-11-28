import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parcels, couriers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate id parameter
    if (!id) {
      return NextResponse.json(
        { error: 'Parcel ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const parcelId = parseInt(id);
    if (isNaN(parcelId)) {
      return NextResponse.json(
        { error: 'Invalid parcel ID', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Query parcel by ID
    const parcelResult = await db
      .select()
      .from(parcels)
      .where(eq(parcels.id, parcelId))
      .limit(1);

    if (parcelResult.length === 0) {
      return NextResponse.json(
        { error: 'Parcel not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const parcel = parcelResult[0];

    // Initialize response object
    let courierData = null;

    // If parcel has a courierId, fetch courier details
    if (parcel.courierId) {
      const courierResult = await db
        .select({
          id: couriers.id,
          name: couriers.name,
          phone: couriers.phone,
          vehicleType: couriers.vehicleType,
          currentLat: couriers.currentLat,
          currentLng: couriers.currentLng,
          rating: couriers.rating,
        })
        .from(couriers)
        .where(eq(couriers.id, parcel.courierId))
        .limit(1);

      if (courierResult.length > 0) {
        courierData = courierResult[0];
      }
    }

    // Return parcel with courier information
    return NextResponse.json(
      {
        parcel: {
          id: parcel.id,
          senderName: parcel.senderName,
          senderPhone: parcel.senderPhone,
          senderAddress: parcel.senderAddress,
          senderLat: parcel.senderLat,
          senderLng: parcel.senderLng,
          recipientName: parcel.recipientName,
          recipientPhone: parcel.recipientPhone,
          recipientAddress: parcel.recipientAddress,
          recipientLat: parcel.recipientLat,
          recipientLng: parcel.recipientLng,
          weightKg: parcel.weightKg,
          size: parcel.size,
          fragile: parcel.fragile,
          status: parcel.status,
          fee: parcel.fee,
          distanceKm: parcel.distanceKm,
          requestedAt: parcel.requestedAt,
          assignedAt: parcel.assignedAt,
          pickedUpAt: parcel.pickedUpAt,
          deliveredAt: parcel.deliveredAt,
        },
        courier: courierData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}