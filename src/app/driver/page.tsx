"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Power, 
  MapPin, 
  Package, 
  Car, 
  DollarSign, 
  Clock, 
  Navigation as NavigationIcon,
  AlertCircle,
  CheckCircle,
  Truck,
  User,
  Phone
} from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: number;
  type: 'ride' | 'courier';
  jobType: string;
  distanceToPickup?: number;
  driverPayout: number;
  requestedAt?: string;
  status?: string;
  assignedAt?: string;
  // Ride fields
  passengerName?: string;
  passengerPhone?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  vehicleType?: string;
  fare?: number;
  // Courier fields
  senderName?: string;
  depotName?: string;
  depotAddress?: string;
  weightKg?: number;
  size?: string;
  fragile?: boolean;
  localBaseFare?: number;
  firstMilePremium?: number;
  totalFare?: number;
}

export default function DriverDashboard() {
  const [driverId] = useState(1); // Mock driver ID - in production, get from auth
  const [driverStatus, setDriverStatus] = useState<'available' | 'offline' | 'busy'>('offline');
  const [driverName, setDriverName] = useState('');
  const [driverRating, setDriverRating] = useState(0);
  const [driverVehicle, setDriverVehicle] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptingJob, setAcceptingJob] = useState<number | null>(null);
  const [completingJob, setCompletingJob] = useState(false);

  // Fetch active job
  const fetchActiveJob = async () => {
    try {
      const response = await fetch(`/api/drivers/active-job?driverId=${driverId}`);
      const data = await response.json();

      if (response.ok && data.hasActiveJob) {
        setActiveJob(data.job);
        setDriverStatus('busy');
      } else {
        setActiveJob(null);
      }
    } catch (error) {
      console.error('Error fetching active job:', error);
    }
  };

  // Fetch pending jobs
  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/drivers/pending-jobs?driverId=${driverId}`);
      const data = await response.json();

      if (response.ok) {
        setDriverName(data.driver.name);
        if (!activeJob) {
          setDriverStatus(data.driver.status);
        }
        setDriverRating(data.driver.rating);
        setDriverVehicle(data.driver.vehicleType);
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  useEffect(() => {
    fetchActiveJob();
    fetchJobs();
    const interval = setInterval(() => {
      fetchActiveJob();
      fetchJobs();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [driverId]);

  // Toggle driver status
  const handleStatusToggle = async () => {
    if (activeJob) {
      toast.error("Complete your current job before going offline");
      return;
    }

    setLoading(true);
    try {
      const newStatus = driverStatus === 'available' ? 'offline' : 'available';
      const response = await fetch('/api/drivers/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setDriverStatus(newStatus);
        toast.success(`You are now ${newStatus === 'available' ? 'Online' : 'Offline'}`);
        if (newStatus === 'available') {
          fetchJobs();
        }
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Accept a job
  const handleAcceptJob = async (job: Job) => {
    setAcceptingJob(job.id);
    try {
      const response = await fetch('/api/drivers/accept-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          jobId: job.id,
          jobType: job.type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${job.jobType} accepted! Starting navigation...`);
        setActiveJob(job);
        setDriverStatus('busy');
        fetchActiveJob();
        fetchJobs();
      } else {
        toast.error(data.error || 'Failed to accept job');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setAcceptingJob(null);
    }
  };

  // Complete the active job
  const handleCompleteJob = async () => {
    if (!activeJob) return;

    setCompletingJob(true);
    try {
      const response = await fetch('/api/rides/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeJob.id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Ride completed successfully! You earned $' + activeJob.driverPayout.toFixed(2));
        setActiveJob(null);
        setDriverStatus('available');
        fetchActiveJob();
        fetchJobs();
      } else {
        toast.error(data.error || 'Failed to complete ride');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setCompletingJob(false);
    }
  };

  const isOnline = driverStatus === 'available';
  const isBusy = driverStatus === 'busy' || activeJob !== null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background pointer-events-none" />

        <div className="container mx-auto px-4 pt-24 pb-12 relative">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-2 gradient-text">
              Driver Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your availability and accept jobs
            </p>
          </div>

          {/* Driver Info Card */}
          <Card className="glass-card p-6 mb-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{driverName || 'Driver'}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="border-accent/50">
                      ⭐ {driverRating.toFixed(1)}
                    </Badge>
                    <Badge variant="outline" className="border-primary/50">
                      <Car className="w-3 h-3 mr-1" />
                      {driverVehicle}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status Toggle Button */}
              <Button
                onClick={handleStatusToggle}
                disabled={loading || isBusy}
                className={`
                  min-w-[180px] h-16 text-xl font-bold transition-all duration-300
                  ${isBusy
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/50'
                    : isOnline 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/50' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/50'
                  }
                `}
              >
                <Power className="w-6 h-6 mr-2" />
                {loading ? 'Updating...' : isBusy ? 'Busy' : isOnline ? 'Online' : 'Offline'}
              </Button>
            </div>

            {!isOnline && !isBusy && (
              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-muted">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Go online to start receiving job requests
                </p>
              </div>
            )}

            {isBusy && activeJob && (
              <div className="flex items-center gap-2 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <Clock className="w-5 h-5 text-amber-400" />
                <p className="text-sm text-amber-400">
                  You have an active job in progress
                </p>
              </div>
            )}
          </Card>

          {/* Active Job Section */}
          {activeJob && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Active Job</h2>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-lg px-4 py-1">
                  In Progress
                </Badge>
              </div>

              <Card className="glass-card p-6 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="text-sm px-3 py-1 bg-primary/20 text-primary border-primary/30">
                    <Car className="w-4 h-4 mr-1" /> {activeJob.jobType}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-muted-foreground">Passenger</div>
                      <div className="font-semibold">{activeJob.passengerName}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {activeJob.passengerPhone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-muted-foreground">Pickup</div>
                      <div className="font-medium">{activeJob.pickupAddress}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-muted-foreground">Dropoff</div>
                      <div className="font-medium">{activeJob.dropoffAddress}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Your Payout</div>
                      <div className="text-3xl font-bold text-emerald-400">
                        ${activeJob.driverPayout.toFixed(2)}
                      </div>
                    </div>

                    <Button
                      onClick={handleCompleteJob}
                      disabled={completingJob}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg shadow-lg shadow-emerald-500/30"
                    >
                      {completingJob ? (
                        'Completing...'
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Complete Ride
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Jobs Section */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Available Jobs</h2>
              <Badge variant="outline" className="border-primary/50 text-lg px-4 py-1">
                {jobs.length} available
              </Badge>
            </div>

            {!isOnline && !isBusy ? (
              <Card className="glass-card p-12 text-center">
                <Power className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">You're Offline</h3>
                <p className="text-muted-foreground">
                  Switch to Online to start accepting jobs
                </p>
              </Card>
            ) : isBusy ? (
              <Card className="glass-card p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-amber-400" />
                <h3 className="text-xl font-semibold mb-2">Complete Your Current Job</h3>
                <p className="text-muted-foreground">
                  Finish your active ride to see new job requests
                </p>
              </Card>
            ) : jobs.length === 0 ? (
              <Card className="glass-card p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Jobs Available</h3>
                <p className="text-muted-foreground">
                  Waiting for new ride and courier requests...
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card 
                    key={`${job.type}-${job.id}`}
                    className={`
                      glass-card p-6 transition-all duration-300 hover:shadow-xl
                      ${job.type === 'ride' 
                        ? 'border-l-4 border-l-primary' 
                        : 'border-l-4 border-l-accent'
                      }
                    `}
                  >
                    {/* Job Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        className={`
                          text-sm px-3 py-1
                          ${job.type === 'ride' 
                            ? 'bg-primary/20 text-primary border-primary/30' 
                            : 'bg-accent/20 text-accent border-accent/30'
                          }
                        `}
                      >
                        {job.type === 'ride' ? (
                          <><Car className="w-4 h-4 mr-1" /> {job.jobType}</>
                        ) : (
                          <><Package className="w-4 h-4 mr-1" /> {job.jobType}</>
                        )}
                      </Badge>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <NavigationIcon className="w-4 h-4" />
                        {job.distanceToPickup?.toFixed(1)} km away
                      </div>
                    </div>

                    {/* Job Details */}
                    {job.type === 'ride' ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-muted-foreground">Passenger</div>
                            <div className="font-semibold">{job.passengerName}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-muted-foreground">Pickup</div>
                            <div className="font-medium">{job.pickupAddress}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-muted-foreground">Dropoff</div>
                            <div className="font-medium">{job.dropoffAddress}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-muted-foreground">Sender</div>
                            <div className="font-semibold">{job.senderName}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-muted-foreground">Pickup</div>
                            <div className="font-medium">{job.pickupAddress}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Truck className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-muted-foreground">Final Destination (Bus Depot)</div>
                            <div className="font-medium">{job.depotName}</div>
                            <div className="text-sm text-muted-foreground">{job.depotAddress}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <Badge variant="outline" className="border-accent/30">
                            {job.weightKg} kg
                          </Badge>
                          <Badge variant="outline" className="border-accent/30">
                            {job.size}
                          </Badge>
                          {job.fragile && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Fragile
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payout Section */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Your Payout</div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold text-emerald-400">
                              ${job.driverPayout.toFixed(2)}
                            </div>
                            {job.type === 'courier' && (
                              <div className="text-xs text-muted-foreground">
                                (75% of ${job.totalFare?.toFixed(2)})
                              </div>
                            )}
                          </div>
                          {job.type === 'courier' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Base ${job.localBaseFare?.toFixed(2)} + First-Mile Premium ${job.firstMilePremium?.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleAcceptJob(job)}
                          disabled={acceptingJob === job.id}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg shadow-lg shadow-emerald-500/30"
                        >
                          {acceptingJob === job.id ? (
                            'Accepting...'
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Accept Job
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}