CREATE TABLE `couriers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`current_lat` real,
	`current_lng` real,
	`rating` real DEFAULT 5,
	`total_deliveries` integer DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `couriers_email_unique` ON `couriers` (`email`);--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`license_plate` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`current_lat` real,
	`current_lng` real,
	`rating` real DEFAULT 5,
	`total_rides` integer DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_email_unique` ON `drivers` (`email`);--> statement-breakpoint
CREATE TABLE `hubs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`capacity` integer NOT NULL,
	`current_parcels` integer DEFAULT 0,
	`type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parcels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender_name` text NOT NULL,
	`sender_phone` text NOT NULL,
	`sender_address` text NOT NULL,
	`sender_lat` real NOT NULL,
	`sender_lng` real NOT NULL,
	`recipient_name` text NOT NULL,
	`recipient_phone` text NOT NULL,
	`recipient_address` text NOT NULL,
	`recipient_lat` real NOT NULL,
	`recipient_lng` real NOT NULL,
	`weight_kg` real NOT NULL,
	`size` text NOT NULL,
	`fragile` integer DEFAULT false,
	`status` text DEFAULT 'pending' NOT NULL,
	`courier_id` integer,
	`fee` real,
	`distance_km` real,
	`requested_at` text NOT NULL,
	`assigned_at` text,
	`picked_up_at` text,
	`delivered_at` text,
	FOREIGN KEY (`courier_id`) REFERENCES `couriers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `revenue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`ride_revenue` real DEFAULT 0,
	`courier_revenue` real DEFAULT 0,
	`total_revenue` real DEFAULT 0,
	`ride_count` integer DEFAULT 0,
	`parcel_count` integer DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `revenue_date_unique` ON `revenue` (`date`);--> statement-breakpoint
CREATE TABLE `rides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`passenger_name` text NOT NULL,
	`passenger_phone` text NOT NULL,
	`pickup_address` text NOT NULL,
	`pickup_lat` real NOT NULL,
	`pickup_lng` real NOT NULL,
	`dropoff_address` text NOT NULL,
	`dropoff_lat` real NOT NULL,
	`dropoff_lng` real NOT NULL,
	`vehicle_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`driver_id` integer,
	`fare` real,
	`distance_km` real,
	`duration_min` integer,
	`requested_at` text NOT NULL,
	`assigned_at` text,
	`started_at` text,
	`completed_at` text,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action
);
