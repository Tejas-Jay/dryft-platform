import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { couriers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const availableCouriers = await db.select()
      .from(couriers)
      .where(eq(couriers.status, 'available'))
      .orderBy(desc(couriers.rating));

    return NextResponse.json(availableCouriers, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}