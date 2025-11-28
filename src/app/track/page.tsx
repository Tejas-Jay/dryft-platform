"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Package, Car, Clock, Phone, User, Navigation as NavigationIcon } from "lucide-react";
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

function TrackingContent() {
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams?.get("ride") || searchParams?.get("parcel") || "");
  const [trackingType, setTrackingType] = useState<"ride" | "parcel">(searchParams?.get("ride") ? "ride" : "parcel");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackingId) return;
    
    setLoading(true);
    try {
      const endpoint = trackingType === "ride" 
        ? `/api/rides/tracking?id=${trackingId}`
        : `/api/parcels/tracking?id=${trackingId}`;
      
      const response = await fetch(endpoint);
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Tracking error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingId) {
      handleTrack();
    }
  }, []);

  // Poll for updates every 5 seconds if tracking is active
  useEffect(() => {
    if (data && (data.ride?.status === "in_progress" || data.parcel?.status === "in_transit")) {
      const interval = setInterval(handleTrack, 5000);
      return () => clearInterval(interval);
    }
  }, [data]);

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    assigned: "text-blue-400",
    in_progress: "text-primary",
    picked_up: "text-primary",
    in_transit: "text-primary",
    completed: "text-green-400",
    delivered: "text-green-400",
    cancelled: "text-destructive",
  };

  // Map markers
  const mapMarkers = [];
  let polyline: [number, number][] | undefined;

  if (data) {
    const item = trackingType === "ride" ? data.ride : data.parcel;
    const person = trackingType === "ride" ? data.driver : data.courier;

    // Add pickup marker
    if (item?.pickupLat && item?.pickupLng) {
      mapMarkers.push({
        position: [item.pickupLat, item.pickupLng] as [number, number],
        label: trackingType === "ride" ? "Pickup Location" : "Sender Location",
        color: "green" as const,
        icon: "📍",
      });
    }

    // Add dropoff marker
    if (item?.dropoffLat && item?.dropoffLng) {
      mapMarkers.push({
        position: [item.dropoffLat, item.dropoffLng] as [number, number],
        label: trackingType === "ride" ? "Drop-off Location" : "Recipient Location",
        color: "red" as const,
        icon: "🎯",
      });
    }

    // Add driver/courier current location
    if (person?.currentLat && person?.currentLng) {
      mapMarkers.push({
        position: [person.currentLat, person.currentLng] as [number, number],
        label: `${person.name} - Current Location`,
        color: "cyan" as const,
        icon: trackingType === "ride" ? "🚗" : "📦",
      });
    }

    // Create route polyline
    if (item?.pickupLat && item?.dropoffLat && person?.currentLat) {
      polyline = [
        [item.pickupLat, item.pickupLng],
        [person.currentLat, person.currentLng],
        [item.dropoffLat, item.dropoffLng],
      ];
    } else if (item?.pickupLat && item?.dropoffLat) {
      polyline = [
        [item.pickupLat, item.pickupLng],
        [item.dropoffLat, item.dropoffLng],
      ];
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            Track Your Journey
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time updates on your ride or delivery
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tracking Input */}
          <Card className="glass-card p-6">
            <div className="flex gap-4">
              <div className="flex gap-2">
                <Button
                  variant={trackingType === "ride" ? "default" : "outline"}
                  onClick={() => setTrackingType("ride")}
                  className={trackingType === "ride" ? "bg-primary" : ""}
                >
                  <Car className="w-4 h-4 mr-2" />
                  Ride
                </Button>
                <Button
                  variant={trackingType === "parcel" ? "default" : "outline"}
                  onClick={() => setTrackingType("parcel")}
                  className={trackingType === "parcel" ? "bg-accent" : ""}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Parcel
                </Button>
              </div>
              
              <Input
                placeholder={`Enter ${trackingType} ID`}
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1 bg-secondary/50 border-white/10"
              />
              
              <Button onClick={handleTrack} disabled={loading}>
                {loading ? "Tracking..." : "Track"}
              </Button>
            </div>
          </Card>

          {/* Tracking Results */}
          {data && (
            <>
              {/* Live Map */}
              <Card className="glass-card p-4 aspect-video relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    data[trackingType]?.status === "in_progress" || data[trackingType]?.status === "in_transit"
                      ? "bg-green-400"
                      : "bg-blue-400"
                  }`} />
                  Live Tracking
                </div>
                <Map
                  center={mapMarkers[0]?.position || [40.7489, -73.9680]}
                  markers={mapMarkers}
                  polyline={polyline}
                  zoom={13}
                  className="h-full"
                />
              </Card>

              {/* Status Card */}
              <Card className="glass-card p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    {trackingType === "ride" ? (
                      <Car className="w-6 h-6 text-primary" />
                    ) : (
                      <Package className="w-6 h-6 text-accent" />
                    )}
                    {trackingType === "ride" ? "Ride Details" : "Parcel Details"}
                  </h2>
                  
                  <div className={`px-4 py-2 rounded-full bg-secondary/50 font-semibold ${statusColors[data[trackingType]?.status]}`}>
                    {data[trackingType]?.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {trackingType === "ride" ? (
                    <>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Passenger</div>
                        <div className="font-semibold">{data.ride?.passengerName}</div>
                        <div className="text-sm text-muted-foreground">{data.ride?.passengerPhone}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Vehicle Type</div>
                        <div className="font-semibold capitalize">{data.ride?.vehicleType}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Pickup</div>
                        <div className="font-semibold text-sm">{data.ride?.pickupAddress}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Drop-off</div>
                        <div className="font-semibold text-sm">{data.ride?.dropoffAddress}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Fare</div>
                        <div className="text-2xl font-bold text-primary">${data.ride?.fare}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Distance</div>
                        <div className="text-xl font-semibold">{data.ride?.distanceKm} km</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Sender</div>
                        <div className="font-semibold">{data.parcel?.senderName}</div>
                        <div className="text-sm text-muted-foreground">{data.parcel?.senderPhone}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Recipient</div>
                        <div className="font-semibold">{data.parcel?.recipientName}</div>
                        <div className="text-sm text-muted-foreground">{data.parcel?.recipientPhone}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">From</div>
                        <div className="font-semibold text-sm">{data.parcel?.senderAddress}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">To</div>
                        <div className="font-semibold text-sm">{data.parcel?.recipientAddress}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Delivery Fee</div>
                        <div className="text-2xl font-bold text-accent">${data.parcel?.fee}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Package Details</div>
                        <div className="text-xl font-semibold capitalize">{data.parcel?.size}, {data.parcel?.weightKg}kg</div>
                        {data.parcel?.fragile && (
                          <div className="text-xs text-destructive">⚠️ Fragile</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Driver/Courier Info */}
              {(data.driver || data.courier) && (
                <Card className="glass-card p-8">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {trackingType === "ride" ? "Your Driver" : "Your Courier"}
                  </h3>

                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold">
                      {(data.driver?.name || data.courier?.name)?.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-lg">{data.driver?.name || data.courier?.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {data.driver?.phone || data.courier?.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {(data.driver?.vehicleType || data.courier?.vehicleType)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        ⭐ Rating: {data.driver?.rating || data.courier?.rating}/5.0
                      </div>
                    </div>

                    {(data.driver?.currentLat || data.courier?.currentLat) && (
                      <div className="text-right">
                        <MapPin className="w-8 h-8 text-primary animate-pulse mx-auto" />
                        <div className="text-xs text-muted-foreground mt-1">Live Location</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackingContent />
    </Suspense>
  );
}