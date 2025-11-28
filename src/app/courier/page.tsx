"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, MapPin, Weight, Box, DollarSign, Navigation as NavigationIcon } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function CourierPage() {
  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    weightKg: "",
    size: "small",
    fragile: false,
  });
  const [loading, setLoading] = useState(false);
  const [parcelData, setParcelData] = useState<any>(null);

  const handleBookCourier = async () => {
    if (!formData.senderName || !formData.senderPhone || !formData.senderAddress || 
        !formData.recipientName || !formData.recipientPhone || !formData.recipientAddress || !formData.weightKg) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Mock coordinates
      const senderCoords = { lat: 40.7489 + Math.random() * 0.05, lng: -73.9680 + Math.random() * 0.05 };
      const recipientCoords = { lat: 40.7489 + Math.random() * 0.05, lng: -73.9680 + Math.random() * 0.05 };

      const response = await fetch("/api/couriers/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          weightKg: parseFloat(formData.weightKg),
          senderLat: senderCoords.lat,
          senderLng: senderCoords.lng,
          recipientLat: recipientCoords.lat,
          recipientLng: recipientCoords.lng,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setParcelData(data);
        toast.success("Courier delivery booked successfully!");
      } else {
        toast.error(data.error || "Failed to book courier");
      }
    } catch (error) {
      toast.error("An error occurred while booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-background pointer-events-none" />
        
        <div className="container mx-auto px-4 pt-24 pb-12 relative">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4 gradient-text">
              Fast & Reliable Delivery
            </h1>
            <p className="text-xl text-muted-foreground">
              Send parcels anywhere in the city with real-time tracking
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Booking Form */}
            <Card className="glass-card p-8 space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Package className="w-6 h-6 text-accent" />
                Book Courier Delivery
              </h2>

              <div className="space-y-4">
                <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                  <h3 className="font-semibold text-sm text-primary">Sender Details</h3>
                  
                  <div>
                    <Label htmlFor="sender-name">Sender Name</Label>
                    <Input
                      id="sender-name"
                      placeholder="John Doe"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sender-phone">Sender Phone</Label>
                    <Input
                      id="sender-phone"
                      placeholder="+1-212-555-0123"
                      value={formData.senderPhone}
                      onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sender-address">Pickup Address</Label>
                    <Input
                      id="sender-address"
                      placeholder="123 Broadway, New York"
                      value={formData.senderAddress}
                      onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                  <h3 className="font-semibold text-sm text-accent">Recipient Details</h3>
                  
                  <div>
                    <Label htmlFor="recipient-name">Recipient Name</Label>
                    <Input
                      id="recipient-name"
                      placeholder="Jane Smith"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipient-phone">Recipient Phone</Label>
                    <Input
                      id="recipient-phone"
                      placeholder="+1-212-555-0456"
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipient-address">Delivery Address</Label>
                    <Input
                      id="recipient-address"
                      placeholder="456 Fifth Ave, New York"
                      value={formData.recipientAddress}
                      onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                  <h3 className="font-semibold text-sm">Parcel Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          placeholder="2.5"
                          value={formData.weightKg}
                          onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                          className="pl-10 bg-secondary/50 border-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="size">Package Size</Label>
                      <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fragile" 
                      checked={formData.fragile}
                      onCheckedChange={(checked) => setFormData({ ...formData, fragile: checked as boolean })}
                    />
                    <Label htmlFor="fragile" className="cursor-pointer">
                      Fragile - Handle with care
                    </Label>
                  </div>
                </div>

                <Button
                  onClick={handleBookCourier}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-lg py-6"
                >
                  {loading ? "Booking..." : "Book Delivery Now"}
                </Button>
              </div>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {parcelData ? (
                <Card className="glass-card p-8">
                  <h3 className="text-2xl font-semibold mb-6 text-accent">Delivery Confirmed!</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-accent" />
                        <div>
                          <div className="text-sm text-muted-foreground">Delivery Fee</div>
                          <div className="text-2xl font-bold">${parcelData.fee}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <NavigationIcon className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">Distance</div>
                          <div className="text-xl font-bold">{parcelData.distanceKm} km</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="text-sm text-muted-foreground mb-2">Tracking ID</div>
                      <div className="font-mono text-accent">#{parcelData.parcelId}</div>
                    </div>

                    <Button
                      onClick={() => window.location.href = `/track?parcel=${parcelData.parcelId}`}
                      variant="outline"
                      className="w-full border-accent/30 hover:bg-accent/10"
                    >
                      Track Your Delivery
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="glass-card p-8">
                  <h3 className="text-2xl font-semibold mb-6">Delivery Features</h3>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Safe Handling</h4>
                        <p className="text-sm text-muted-foreground">
                          Professional couriers trained for fragile items
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Live Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Track your parcel every step of the way
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                        <Box className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">All Sizes Welcome</h4>
                        <p className="text-sm text-muted-foreground">
                          From small packages to large items
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="glass-card p-6">
                <h3 className="font-semibold mb-4">Pricing Guide</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fee</span>
                    <span className="font-semibold">$3.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per Kilometer</span>
                    <span className="font-semibold">$1.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Small (1x)</span>
                    <span className="font-semibold">Standard</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Medium (1.5x)</span>
                    <span className="font-semibold">+50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Large (2x)</span>
                    <span className="font-semibold">+100%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
