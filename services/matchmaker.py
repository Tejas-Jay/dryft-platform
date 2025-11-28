#!/usr/bin/env python3
"""
Matchmaker Worker for DRYFT Platform
Assigns drivers to rides and couriers to parcels based on proximity and availability
"""

import redis
import json
import time
import logging
import requests
import math
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Matchmaker:
    def __init__(self, redis_host='redis', redis_port=6379, api_base_url='http://frontend:3000'):
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
        self.api_base_url = api_base_url
        logger.info(f"Matchmaker initialized with Redis at {redis_host}:{redis_port}")
        logger.info(f"API base URL: {api_base_url}")
    
    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two points using Haversine formula"""
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def get_available_drivers(self):
        """Fetch available drivers from API"""
        try:
            response = requests.get(f"{self.api_base_url}/api/drivers/available", timeout=5)
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.error(f"Error fetching drivers: {e}")
            return []
    
    def get_available_couriers(self):
        """Fetch available couriers from API"""
        try:
            response = requests.get(f"{self.api_base_url}/api/couriers/available", timeout=5)
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.error(f"Error fetching couriers: {e}")
            return []
    
    def find_nearest_driver(self, pickup_lat, pickup_lng, drivers):
        """Find nearest available driver to pickup location"""
        if not drivers:
            return None
        
        nearest_driver = None
        min_distance = float('inf')
        
        for driver in drivers:
            if driver.get('currentLat') and driver.get('currentLng'):
                distance = self.calculate_distance(
                    pickup_lat, pickup_lng,
                    driver['currentLat'], driver['currentLng']
                )
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_driver = driver
        
        return nearest_driver
    
    def find_nearest_courier(self, pickup_lat, pickup_lng, couriers):
        """Find nearest available courier to pickup location"""
        if not couriers:
            return None
        
        nearest_courier = None
        min_distance = float('inf')
        
        for courier in couriers:
            if courier.get('currentLat') and courier.get('currentLng'):
                distance = self.calculate_distance(
                    pickup_lat, pickup_lng,
                    courier['currentLat'], courier['currentLng']
                )
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_courier = courier
        
        return nearest_courier
    
    def assign_ride(self, ride_data, driver):
        """Assign a ride to a driver via API"""
        try:
            response = requests.post(
                f"{self.api_base_url}/api/rides/assign",
                json={
                    'rideId': ride_data['id'],
                    'driverId': driver['id']
                },
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully assigned ride {ride_data['id']} to driver {driver['id']}")
                return True
            else:
                logger.error(f"Failed to assign ride: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error assigning ride: {e}")
            return False
    
    def assign_parcel(self, parcel_data, courier):
        """Assign a parcel to a courier via API"""
        try:
            response = requests.post(
                f"{self.api_base_url}/api/couriers/assign",
                json={
                    'parcelId': parcel_data['id'],
                    'courierId': courier['id']
                },
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully assigned parcel {parcel_data['id']} to courier {courier['id']}")
                return True
            else:
                logger.error(f"Failed to assign parcel: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error assigning parcel: {e}")
            return False
    
    def process_pending_rides(self):
        """Process pending ride requests and assign drivers"""
        pending_rides = self.redis_client.zrange('pending_rides', 0, -1)
        
        if not pending_rides:
            return
        
        drivers = self.get_available_drivers()
        
        if not drivers:
            logger.warning("No available drivers found")
            return
        
        for ride_json in pending_rides:
            ride_data = json.loads(ride_json)
            
            nearest_driver = self.find_nearest_driver(
                ride_data['pickupLat'],
                ride_data['pickupLng'],
                drivers
            )
            
            if nearest_driver:
                if self.assign_ride(ride_data, nearest_driver):
                    # Remove from queue after successful assignment
                    self.redis_client.zrem('pending_rides', ride_json)
                    # Remove assigned driver from available list
                    drivers = [d for d in drivers if d['id'] != nearest_driver['id']]
    
    def process_pending_parcels(self):
        """Process pending parcel requests and assign couriers"""
        pending_parcels = self.redis_client.zrange('pending_parcels', 0, -1)
        
        if not pending_parcels:
            return
        
        couriers = self.get_available_couriers()
        
        if not couriers:
            logger.warning("No available couriers found")
            return
        
        for parcel_json in pending_parcels:
            parcel_data = json.loads(parcel_json)
            
            nearest_courier = self.find_nearest_courier(
                parcel_data['senderLat'],
                parcel_data['senderLng'],
                couriers
            )
            
            if nearest_courier:
                if self.assign_parcel(parcel_data, nearest_courier):
                    # Remove from queue after successful assignment
                    self.redis_client.zrem('pending_parcels', parcel_json)
                    # Remove assigned courier from available list
                    couriers = [c for c in couriers if c['id'] != nearest_courier['id']]
    
    def run(self):
        """Main matchmaker loop"""
        logger.info("Matchmaker worker started")
        
        while True:
            try:
                # Process pending rides
                self.process_pending_rides()
                
                # Process pending parcels
                self.process_pending_parcels()
                
                # Wait before next iteration
                time.sleep(5)
                
            except KeyboardInterrupt:
                logger.info("Shutting down matchmaker")
                break
            except Exception as e:
                logger.error(f"Error in matchmaker: {e}")
                time.sleep(5)

if __name__ == "__main__":
    matchmaker = Matchmaker()
    matchmaker.run()
