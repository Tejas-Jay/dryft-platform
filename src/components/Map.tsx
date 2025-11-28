"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapProps {
  center?: [number, number];
  markers?: Array<{
    position: [number, number];
    label: string;
    color?: "blue" | "red" | "green" | "cyan";
    icon?: string;
  }>;
  polyline?: [number, number][];
  className?: string;
  zoom?: number;
}

export const Map = ({ center = [40.7489, -73.9680], markers = [], polyline, className = "", zoom = 13 }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Add dark theme tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Create layer group for markers
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Cleanup only on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersLayerRef.current = null;
      polylineLayerRef.current = null;
    };
  }, []); // Empty deps - only run once

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    // Clear existing markers
    markersLayer.clearLayers();

    // Add new markers
    markers.forEach((marker) => {
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background: ${marker.color === "red" ? "#ef4444" : marker.color === "green" ? "#22c55e" : marker.color === "cyan" ? "#00d9ff" : "#3b82f6"};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 16px;
              color: white;
            ">${marker.icon || "📍"}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker(marker.position, { icon: customIcon })
        .bindPopup(marker.label)
        .addTo(markersLayer);
    });

    // Fit bounds if we have markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers]);

  // Update polyline when it changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove old polyline
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    // Add new polyline if provided
    if (polyline && polyline.length > 1) {
      polylineLayerRef.current = L.polyline(polyline, {
        color: "#00d9ff",
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 10",
      }).addTo(map);
    }
  }, [polyline]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
};