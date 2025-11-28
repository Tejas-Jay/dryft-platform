import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { drivers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Query drivers with status='available' ordered by rating descending
    const availableDrivers = await db.select()
      .from(drivers)
      .where(eq(drivers.status, 'available'))
      .orderBy(desc(drivers.rating));

    // Return all available drivers (empty array if none found)
    return NextResponse.json(availableDrivers, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}