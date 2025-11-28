"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Package, BarChart3, MapPin, Truck } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  
  const links = [
    { href: "/", label: "Ride", icon: Car },
    { href: "/courier", label: "Courier", icon: Package },
    { href: "/driver", label: "Driver", icon: Truck },
    { href: "/track", label: "Track", icon: MapPin },
    { href: "/admin", label: "Admin", icon: BarChart3 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold gradient-text">
          DRYFT
        </Link>
        
        <div className="flex items-center gap-6">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}