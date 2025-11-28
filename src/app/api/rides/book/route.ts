import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rides, drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Haversine distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      passengerName,
      passengerPhone,
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      vehicleType
    } = body;

    // Validate all required fields are present
    if (
      !passengerName ||
      !passengerPhone ||
      !pickupAddress ||
      pickupLat === undefined ||
      pickupLng === undefined ||
      !dropoffAddress ||
      dropoffLat === undefined ||
      dropoffLng === undefined ||
      !vehicleType
    ) {
      return NextResponse.json(
        { 
          error: 'All fields are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate vehicleType
    const validVehicleTypes = ['sedan', 'suv', 'van'];
    if (!validVehicleTypes.includes(vehicleType.toLowerCase())) {
      return NextResponse.json(
        { 
          error: 'Invalid vehicle type. Must be sedan, suv, or van',
          code: 'INVALID_VEHICLE_TYPE'
        },
        { status: 400 }
      );
    }

    // Calculate distance using Haversine formula
    const distanceKm = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);

    // Calculate fare: base $5 + $2 per km
    const fare = 5 + (distanceKm * 2);

    // Calculate duration: assume average speed of 30 km/h
    const durationMin = Math.round((distanceKm / 30) * 60);

    // Create ride record
    const newRide = await db.insert(rides).values({
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      pickupAddress: pickupAddress.trim(),
      pickupLat,
      pickupLng,
      dropoffAddress: dropoffAddress.trim(),
      dropoffLat,
      dropoffLng,
      vehicleType: vehicleType.toLowerCase(),
      status: 'pending',
      fare: Math.round(fare * 100) / 100, // Round to 2 decimal places
      distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
      durationMin,
      requestedAt: new Date().toISOString(),
      driverId: null,
      assignedAt: null,
      startedAt: null,
      completedAt: null
    }).returning();

    // Find nearest available driver and auto-assign
    const availableDrivers = await db.select()
      .from(drivers)
      .where(eq(drivers.status, 'available'));

    let assignedDriver = null;

    if (availableDrivers.length > 0) {
      // Find the nearest driver to pickup location
      let nearestDriver = availableDrivers[0];
      let minDistance = Infinity;

      for (const driver of availableDrivers) {
        if (driver.currentLat && driver.currentLng) {
          const distance = calculateDistance(
            pickupLat,
            pickupLng,
            driver.currentLat,
            driver.currentLng
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestDriver = driver;
          }
        }
      }

      // Assign the nearest driver
      const now = new Date().toISOString();
      
      await db.update(rides)
        .set({
          driverId: nearestDriver.id,
          status: 'assigned',
          assignedAt: now
        })
        .where(eq(rides.id, newRide[0].id));

      await db.update(drivers)
        .set({
          status: 'busy'
        })
        .where(eq(drivers.id, nearestDriver.id));

      assignedDriver = {
        id: nearestDriver.id,
        name: nearestDriver.name,
        phone: nearestDriver.phone,
        vehicleType: nearestDriver.vehicleType,
        rating: nearestDriver.rating
      };
    }

    return NextResponse.json(
      {
        rideId: newRide[0].id,
        fare: newRide[0].fare,
        distanceKm: newRide[0].distanceKm,
        durationMin: newRide[0].durationMin,
        status: assignedDriver ? 'assigned' : 'pending',
        driver: assignedDriver
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}