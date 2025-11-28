#!/usr/bin/env python3
"""
Redis Queue Server for DRYFT Platform
Manages ride and parcel assignment queues
"""

import redis
import json
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QueueServer:
    def __init__(self, redis_host='redis', redis_port=6379):
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
        logger.info(f"Connected to Redis at {redis_host}:{redis_port}")
    
    def add_ride_request(self, ride_data):
        """Add a ride request to the pending queue"""
        ride_id = ride_data.get('id')
        self.redis_client.zadd('pending_rides', {json.dumps(ride_data): time.time()})
        logger.info(f"Added ride {ride_id} to pending queue")
        return True
    
    def add_parcel_request(self, parcel_data):
        """Add a parcel request to the pending queue"""
        parcel_id = parcel_data.get('id')
        self.redis_client.zadd('pending_parcels', {json.dumps(parcel_data): time.time()})
        logger.info(f"Added parcel {parcel_id} to pending queue")
        return True
    
    def get_pending_rides(self, limit=10):
        """Get pending ride requests"""
        pending = self.redis_client.zrange('pending_rides', 0, limit-1)
        return [json.loads(item) for item in pending]
    
    def get_pending_parcels(self, limit=10):
        """Get pending parcel requests"""
        pending = self.redis_client.zrange('pending_parcels', 0, limit-1)
        return [json.loads(item) for item in pending]
    
    def remove_ride_from_queue(self, ride_data):
        """Remove a ride from pending queue after assignment"""
        self.redis_client.zrem('pending_rides', json.dumps(ride_data))
        logger.info(f"Removed ride {ride_data.get('id')} from pending queue")
    
    def remove_parcel_from_queue(self, parcel_data):
        """Remove a parcel from pending queue after assignment"""
        self.redis_client.zrem('pending_parcels', json.dumps(parcel_data))
        logger.info(f"Removed parcel {parcel_data.get('id')} from pending queue")
    
    def update_driver_location(self, driver_id, lat, lng):
        """Update driver location in Redis"""
        driver_key = f"driver:{driver_id}:location"
        self.redis_client.set(driver_key, json.dumps({
            'lat': lat,
            'lng': lng,
            'timestamp': datetime.utcnow().isoformat()
        }))
    
    def update_courier_location(self, courier_id, lat, lng):
        """Update courier location in Redis"""
        courier_key = f"courier:{courier_id}:location"
        self.redis_client.set(courier_key, json.dumps({
            'lat': lat,
            'lng': lng,
            'timestamp': datetime.utcnow().isoformat()
        }))
    
    def get_stats(self):
        """Get queue statistics"""
        return {
            'pending_rides': self.redis_client.zcard('pending_rides'),
            'pending_parcels': self.redis_client.zcard('pending_parcels'),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def run(self):
        """Main server loop"""
        logger.info("Queue server started")
        
        while True:
            try:
                stats = self.get_stats()
                logger.info(f"Queue stats: {stats}")
                
                # Health check - ensure Redis connection is alive
                self.redis_client.ping()
                
                time.sleep(10)
                
            except KeyboardInterrupt:
                logger.info("Shutting down queue server")
                break
            except Exception as e:
                logger.error(f"Error in queue server: {e}")
                time.sleep(5)

if __name__ == "__main__":
    server = QueueServer()
    server.run()
