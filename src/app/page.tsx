"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation as NavigationIcon, DollarSign, Clock, Car, Users, Truck } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/Map").then((mod) => ({ default: mod.Map })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary/20 rounded-lg">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-primary mx-auto mb-2 animate-pulse" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerPhone: "",
    pickupAddress: "",
    dropoffAddress: "",
    vehicleType: "sedan",
  });
  const [loading, setLoading] = useState(false);
  const [rideData, setRideData] = useState<any>(null);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);

  const vehicleTypes = [
    { value: "sedan", label: "Sedan", icon: Car, capacity: "4 seats", price: "Base fare" },
    { value: "suv", label: "SUV", icon: Users, capacity: "6 seats", price: "Premium" },
    { value: "van", label: "Van", icon: Truck, capacity: "8 seats", price: "Group" },
  ];

  // Fetch available drivers on mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch("/api/drivers/available");
        const data = await response.json();
        if (response.ok) {
          setAvailableDrivers(data.drivers || []);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    fetchDrivers();
    // Poll for driver updates every 10 seconds
    const interval = setInterval(fetchDrivers, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBookRide = async () => {
    if (!formData.passengerName || !formData.passengerPhone || !formData.pickupAddress || !formData.dropoffAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Mock coordinates for NYC locations
      const pickup = { lat: 40.7489 + Math.random() * 0.05, lng: -73.9680 + Math.random() * 0.05 };
      const dropoff = { lat: 40.7489 + Math.random() * 0.05, lng: -73.9680 + Math.random() * 0.05 };

      setPickupCoords([pickup.lat, pickup.lng]);
      setDropoffCoords([dropoff.lat, dropoff.lng]);

      const response = await fetch("/api/rides/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setRideData(data);
        toast.success("Ride booked successfully!");
      } else {
        toast.error(data.error || "Failed to book ride");
      }
    } catch (error) {
      toast.error("An error occurred while booking");
    } finally {
      setLoading(false);
    }
  };

  // Map markers
  const mapMarkers = [];
  
  // Add available drivers
  availableDrivers.forEach((driver) => {
    if (driver.currentLat && driver.currentLng) {
      mapMarkers.push({
        position: [driver.currentLat, driver.currentLng] as [number, number],
        label: `${driver.name} - ${driver.vehicleType}`,
        color: "cyan" as const,
        icon: "🚗",
      });
    }
  });

  // Add pickup marker if ride is booked
  if (pickupCoords) {
    mapMarkers.push({
      position: pickupCoords,
      label: `Pickup: ${formData.pickupAddress}`,
      color: "green" as const,
      icon: "📍",
    });
  }

  // Add dropoff marker if ride is booked
  if (dropoffCoords) {
    mapMarkers.push({
      position: dropoffCoords,
      label: `Drop-off: ${formData.dropoffAddress}`,
      color: "red" as const,
      icon: "🎯",
    });
  }

  // Create polyline for route
  const polyline = pickupCoords && dropoffCoords ? [pickupCoords, dropoffCoords] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="relative">
        {/* Hero Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background pointer-events-none" />
        
        <div className="container mx-auto px-4 pt-24 pb-12 relative">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4 gradient-text">
              Go Anywhere with DRYFT
            </h1>
            <p className="text-xl text-muted-foreground">
              Premium rides at your fingertips. Book now and arrive in style.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Booking Form */}
            <Card className="glass-card p-8 space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Book Your Ride
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.passengerName}
                    onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                    className="bg-secondary/50 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1-212-555-0123"
                    value={formData.passengerPhone}
                    onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                    className="bg-secondary/50 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="pickup">Pickup Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-primary" />
                    <Input
                      id="pickup"
                      placeholder="Times Square, New York"
                      value={formData.pickupAddress}
                      onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                      className="pl-10 bg-secondary/50 border-white/10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dropoff">Drop-off Location</Label>
                  <div className="relative">
                    <NavigationIcon className="absolute left-3 top-3 w-4 h-4 text-accent" />
                    <Input
                      id="dropoff"
                      placeholder="Central Park, New York"
                      value={formData.dropoffAddress}
                      onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                      className="pl-10 bg-secondary/50 border-white/10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Select Vehicle</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {vehicleTypes.map((vehicle) => {
                      const Icon = vehicle.icon;
                      return (
                        <button
                          key={vehicle.value}
                          onClick={() => setFormData({ ...formData, vehicleType: vehicle.value })}
                          className={`p-4 rounded-lg border-2 transition-all text-center ${
                            formData.vehicleType === vehicle.value
                              ? "border-primary bg-primary/10"
                              : "border-white/10 hover:border-white/20 bg-secondary/30"
                          }`}
                        >
                          <Icon className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-semibold">{vehicle.label}</div>
                          <div className="text-xs text-muted-foreground">{vehicle.capacity}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={handleBookRide}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6"
                >
                  {loading ? "Booking..." : "Book Ride Now"}
                </Button>
              </div>
            </Card>

            {/* Ride Info / Results */}
            <div className="space-y-6">
              {rideData ? (
                <Card className="glass-card p-8">
                  <h3 className="text-2xl font-semibold mb-6 text-primary">Ride Confirmed!</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">Estimated Fare</div>
                          <div className="text-2xl font-bold">${rideData.fare}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <NavigationIcon className="w-5 h-5 text-accent" />
                        <div>
                          <div className="text-sm text-muted-foreground">Distance</div>
                          <div className="text-xl font-bold">{rideData.distanceKm} km</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-sm text-muted-foreground">ETA</div>
                          <div className="text-xl font-bold">{rideData.durationMin} min</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="text-sm text-muted-foreground mb-2">Ride ID</div>
                      <div className="font-mono text-primary">#{rideData.rideId}</div>
                    </div>

                    <Button
                      onClick={() => window.location.href = `/track?ride=${rideData.rideId}`}
                      variant="outline"
                      className="w-full border-primary/30 hover:bg-primary/10"
                    >
                      Track Your Ride
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="glass-card p-8">
                  <h3 className="text-2xl font-semibold mb-6">Why Choose DRYFT?</h3>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Fast Pickup</h4>
                        <p className="text-sm text-muted-foreground">
                          Average wait time under 3 minutes
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Transparent Pricing</h4>
                        <p className="text-sm text-muted-foreground">
                          No hidden fees, see your fare upfront
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Real-time Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Track your driver's location in real-time
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Live Map */}
              <Card className="glass-card p-4 aspect-video relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  {availableDrivers.length} drivers nearby
                </div>
                <Map
                  center={[40.7489, -73.9680]}
                  markers={mapMarkers}
                  polyline={polyline}
                  zoom={13}
                  className="h-full"
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}