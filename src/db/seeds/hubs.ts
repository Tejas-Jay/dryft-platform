import { db } from '@/db';
import { hubs } from '@/db/schema';

async function main() {
    const sampleHubs = [
        {
            name: 'Manhattan Distribution Center',
            address: '450 W 33rd Street, New York, NY 10001',
            lat: 40.75,
            lng: -73.97,
            capacity: 350,
            currentParcels: 210,
            type: 'distribution',
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            name: 'Brooklyn Fulfillment Hub',
            address: '850 Third Avenue, Brooklyn, NY 11232',
            lat: 40.65,
            lng: -73.95,
            capacity: 420,
            currentParcels: 250,
            type: 'fulfillment',
            createdAt: new Date('2024-02-10').toISOString(),
        },
        {
            name: 'Queens Logistics Center',
            address: '47-40 32nd Place, Long Island City, NY 11101',
            lat: 40.72,
            lng: -73.82,
            capacity: 180,
            currentParcels: 95,
            type: 'distribution',
            createdAt: new Date('2024-03-05').toISOString(),
        },
        {
            name: 'Bronx Distribution Hub',
            address: '1220 Waters Place, Bronx, NY 10461',
            lat: 40.84,
            lng: -73.86,
            capacity: 250,
            currentParcels: 140,
            type: 'fulfillment',
            createdAt: new Date('2024-04-20').toISOString(),
        },
        {
            name: 'Staten Island Fulfillment Center',
            address: '2795 Veterans Road West, Staten Island, NY 10309',
            lat: 40.58,
            lng: -74.15,
            capacity: 300,
            currentParcels: 165,
            type: 'distribution',
            createdAt: new Date('2024-05-12').toISOString(),
        }
    ];

    await db.insert(hubs).values(sampleHubs);
    
    console.log('✅ Hubs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});