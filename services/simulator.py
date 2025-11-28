#!/usr/bin/env python3
"""
Driver and Courier Simulator for DRYFT Platform
Simulates driver/courier movement and updates locations in real-time
"""

import redis
import json
import time
import logging
import random
import requests
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Simulator:
    def __init__(self, redis_host='redis', redis_port=6379, api_base_url='http://frontend:3000'):
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
        self.api_base_url = api_base_url
        
        # NYC boundaries
        self.nyc_bounds = {
            'min_lat': 40.70,
            'max_lat': 40.80,
            'min_lng': -74.00,
            'max_lng': -73.90
        }
        
        logger.info("Simulator initialized")
    
    def get_drivers(self):
        """Fetch all drivers from API"""
        try:
            response = requests.get(f"{self.api_base_url}/api/drivers/available", timeout=5)
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.error(f"Error fetching drivers: {e}")
            return []
    
    def get_couriers(self):
        """Fetch all couriers from API"""
        try:
            response = requests.get(f"{self.api_base_url}/api/couriers/available", timeout=5)
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.error(f"Error fetching couriers: {e}")
            return []
    
    def simulate_movement(self, current_lat, current_lng):
        """Simulate small random movement (approximately 100-500 meters)"""
        # Small random movement in degrees (roughly 100-500 meters)
        lat_change = random.uniform(-0.005, 0.005)
        lng_change = random.uniform(-0.005, 0.005)
        
        new_lat = current_lat + lat_change
        new_lng = current_lng + lng_change
        
        # Keep within NYC bounds
        new_lat = max(self.nyc_bounds['min_lat'], min(self.nyc_bounds['max_lat'], new_lat))
        new_lng = max(self.nyc_bounds['min_lng'], min(self.nyc_bounds['max_lng'], new_lng))
        
        return new_lat, new_lng
    
    def update_driver_locations(self):
        """Update all driver locations with simulated movement"""
        drivers = self.get_drivers()
        
        for driver in drivers:
            if driver.get('currentLat') and driver.get('currentLng'):
                new_lat, new_lng = self.simulate_movement(
                    driver['currentLat'],
                    driver['currentLng']
                )
                
                # Store in Redis for real-time tracking
                location_data = {
                    'id': driver['id'],
                    'name': driver['name'],
                    'lat': new_lat,
                    'lng': new_lng,
                    'status': driver.get('status', 'available'),
                    'vehicleType': driver.get('vehicleType'),
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                self.redis_client.set(
                    f"driver:{driver['id']}:location",
                    json.dumps(location_data),
                    ex=60  # Expire after 60 seconds
                )
                
                logger.debug(f"Updated driver {driver['id']} location to ({new_lat:.4f}, {new_lng:.4f})")
    
    def update_courier_locations(self):
        """Update all courier locations with simulated movement"""
        couriers = self.get_couriers()
        
        for courier in couriers:
            if courier.get('currentLat') and courier.get('currentLng'):
                new_lat, new_lng = self.simulate_movement(
                    courier['currentLat'],
                    courier['currentLng']
                )
                
                # Store in Redis for real-time tracking
                location_data = {
                    'id': courier['id'],
                    'name': courier['name'],
                    'lat': new_lat,
                    'lng': new_lng,
                    'status': courier.get('status', 'available'),
                    'vehicleType': courier.get('vehicleType'),
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                self.redis_client.set(
                    f"courier:{courier['id']}:location",
                    json.dumps(location_data),
                    ex=60  # Expire after 60 seconds
                )
                
                logger.debug(f"Updated courier {courier['id']} location to ({new_lat:.4f}, {new_lng:.4f})")
    
    def check_for_assignments(self):
        """Check for new ride/parcel assignments and add to queue"""
        # This would normally poll the database for new pending requests
        # For now, this is a placeholder for the polling mechanism
        pass
    
    def run(self):
        """Main simulator loop"""
        logger.info("Simulator started")
        
        iteration = 0
        while True:
            try:
                iteration += 1
                
                # Update driver locations every iteration (10 seconds)
                self.update_driver_locations()
                
                # Update courier locations every iteration (10 seconds)
                self.update_courier_locations()
                
                if iteration % 6 == 0:  # Every minute
                    logger.info("Location updates cycle completed")
                
                # Wait before next update
                time.sleep(10)
                
            except KeyboardInterrupt:
                logger.info("Shutting down simulator")
                break
            except Exception as e:
                logger.error(f"Error in simulator: {e}")
                time.sleep(10)

if __name__ == "__main__":
    simulator = Simulator()
    simulator.run()
