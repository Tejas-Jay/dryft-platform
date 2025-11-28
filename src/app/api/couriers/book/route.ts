import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parcels } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      senderName,
      senderPhone,
      senderAddress,
      senderLat,
      senderLng,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientLat,
      recipientLng,
      weightKg,
      size,
      fragile
    } = body;

    // Validate all required fields are present
    if (
      !senderName ||
      !senderPhone ||
      !senderAddress ||
      senderLat === undefined ||
      senderLng === undefined ||
      !recipientName ||
      !recipientPhone ||
      !recipientAddress ||
      recipientLat === undefined ||
      recipientLng === undefined ||
      weightKg === undefined ||
      !size
    ) {
      return NextResponse.json(
        {
          error: 'All required fields must be provided',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate size
    const validSizes = ['small', 'medium', 'large'];
    if (!validSizes.includes(size.toLowerCase())) {
      return NextResponse.json(
        {
          error: 'Invalid size. Must be small, medium, or large',
          code: 'INVALID_SIZE'
        },
        { status: 400 }
      );
    }

    // Calculate distance using Haversine formula
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    
    const lat1Rad = toRadians(senderLat);
    const lat2Rad = toRadians(recipientLat);
    const lng1Rad = toRadians(senderLng);
    const lng2Rad = toRadians(recipientLng);

    const distanceKm = 6371 * Math.acos(
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lng2Rad - lng1Rad) +
      Math.sin(lat1Rad) * Math.sin(lat2Rad)
    );

    // Calculate fee based on distance and size
    const baseFee = 3;
    const distanceCharge = distanceKm * 1.5;
    
    const sizeMultipliers: { [key: string]: number } = {
      small: 1.0,
      medium: 1.5,
      large: 2.0
    };
    
    const sizeMultiplier = sizeMultipliers[size.toLowerCase()];
    const fee = (baseFee + distanceCharge) * sizeMultiplier;

    // Create parcel record
    const newParcel = await db.insert(parcels)
      .values({
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        senderAddress: senderAddress.trim(),
        senderLat,
        senderLng,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientAddress: recipientAddress.trim(),
        recipientLat,
        recipientLng,
        weightKg,
        size: size.toLowerCase(),
        fragile: fragile ?? false,
        status: 'pending',
        fee: Math.round(fee * 100) / 100,
        distanceKm: Math.round(distanceKm * 100) / 100,
        requestedAt: new Date().toISOString(),
        courierId: null,
        assignedAt: null,
        pickedUpAt: null,
        deliveredAt: null
      })
      .returning();

    return NextResponse.json(
      {
        parcelId: newParcel[0].id,
        fee: newParcel[0].fee,
        distanceKm: newParcel[0].distanceKm,
        status: newParcel[0].status
      },
      { status: 201 }
    );

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