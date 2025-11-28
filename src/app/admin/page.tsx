"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Package, Car, DollarSign, Clock, MapPin } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalParcels: 0,
    activeDrivers: 0,
    activeCouriers: 0,
    todayRevenue: 0,
  });
  const [rides, setRides] = useState<any[]>([]);
  const [parcels, setParcels] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversRes, couriersRes] = await Promise.all([
        fetch("/api/drivers/available"),
        fetch("/api/couriers/available"),
      ]);

      const driversData = await driversRes.json();
      const couriersData = await couriersRes.json();

      setDrivers(driversData);
      setCouriers(couriersData);

      setStats({
        totalRides: 15,
        totalParcels: 15,
        activeDrivers: driversData.length,
        activeCouriers: couriersData.length,
        todayRevenue: 12847.50,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const revenueData = [
    { day: "Mon", rides: 2400, courier: 1800 },
    { day: "Tue", rides: 2800, courier: 2100 },
    { day: "Wed", rides: 3200, courier: 2400 },
    { day: "Thu", rides: 2900, courier: 2200 },
    { day: "Fri", rides: 3500, courier: 2800 },
    { day: "Sat", rides: 4200, courier: 3400 },
    { day: "Sun", rides: 3800, courier: 3100 },
  ];

  const vehicleDistribution = [
    { name: "Sedan", value: 45, color: "#00d9ff" },
    { name: "SUV", value: 30, color: "#a855f7" },
    { name: "Van", value: 15, color: "#ec4899" },
    { name: "Bike", value: 10, color: "#3b82f6" },
  ];

  const statusColors: Record<string, string> = {
    available: "text-green-400",
    busy: "text-yellow-400",
    offline: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your DRYFT platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{stats.totalRides}</div>
            </div>
            <div className="text-sm text-muted-foreground">Total Rides</div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div className="text-2xl font-bold">{stats.totalParcels}</div>
            </div>
            <div className="text-sm text-muted-foreground">Total Parcels</div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-400/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{stats.activeDrivers}</div>
            </div>
            <div className="text-sm text-muted-foreground">Active Drivers</div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-400/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{stats.activeCouriers}</div>
            </div>
            <div className="text-sm text-muted-foreground">Active Couriers</div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold">${stats.todayRevenue.toLocaleString()}</div>
            </div>
            <div className="text-sm text-muted-foreground">Today's Revenue</div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Weekly Revenue
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(18, 18, 27, 0.9)", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px"
                  }} 
                />
                <Bar dataKey="rides" fill="#00d9ff" name="Rides" />
                <Bar dataKey="courier" fill="#a855f7" name="Courier" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Vehicle Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(18, 18, 27, 0.9)", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tabs for Drivers and Couriers */}
        <Tabs defaultValue="drivers" className="w-full">
          <TabsList className="glass mb-4">
            <TabsTrigger value="drivers">Drivers ({drivers.length})</TabsTrigger>
            <TabsTrigger value="couriers">Couriers ({couriers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers">
            <Card className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Active Drivers</h3>
              <div className="space-y-3">
                {drivers.map((driver) => (
                  <div 
                    key={driver.id} 
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{driver.name}</div>
                        <div className="text-sm text-muted-foreground">{driver.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Vehicle</div>
                        <div className="font-semibold capitalize">{driver.vehicleType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Rating</div>
                        <div className="font-semibold">⭐ {driver.rating}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Rides</div>
                        <div className="font-semibold">{driver.totalRides}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full bg-secondary text-sm ${statusColors[driver.status]}`}>
                        {driver.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="couriers">
            <Card className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Active Couriers</h3>
              <div className="space-y-3">
                {couriers.map((courier) => (
                  <div 
                    key={courier.id} 
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-lg font-bold">
                        {courier.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{courier.name}</div>
                        <div className="text-sm text-muted-foreground">{courier.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Vehicle</div>
                        <div className="font-semibold capitalize">{courier.vehicleType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Rating</div>
                        <div className="font-semibold">⭐ {courier.rating}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Deliveries</div>
                        <div className="font-semibold">{courier.totalDeliveries}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full bg-secondary text-sm ${statusColors[courier.status]}`}>
                        {courier.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Heat Map Placeholder */}
        <Card className="glass-card p-6 mt-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Live Activity Heat Map
          </h3>
          <div className="aspect-video relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-primary mx-auto mb-3 animate-pulse" />
                <p className="text-lg font-semibold">Real-time Activity Map</p>
                <p className="text-sm text-muted-foreground">Showing driver and courier locations</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
