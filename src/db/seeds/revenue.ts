import { db } from '@/db';
import { revenue } from '@/db/schema';

async function main() {
    const today = new Date();
    const sampleRevenue = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const rideRevenue = parseFloat((Math.random() * (8000 - 2000) + 2000).toFixed(2));
        const courierRevenue = parseFloat((Math.random() * (5000 - 1500) + 1500).toFixed(2));
        const totalRevenue = parseFloat((rideRevenue + courierRevenue).toFixed(2));
        const rideCount = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
        const parcelCount = Math.floor(Math.random() * (200 - 80 + 1)) + 80;

        sampleRevenue.push({
            date: dateStr,
            rideRevenue,
            courierRevenue,
            totalRevenue,
            rideCount,
            parcelCount,
            createdAt: new Date(dateStr + 'T00:00:00.000Z').toISOString(),
        });
    }

    await db.insert(revenue).values(sampleRevenue);

    console.log('✅ Revenue seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});