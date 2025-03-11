"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";

// Sample visitor data with timestamps
interface Visitor {
  id: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  timestamp: number;
  pageViews: number;
  duration: number;
}

// Country data with ISO codes for mapping
const countryData = [
  { country: "United States", code: "USA", cities: ["New York", "Los Angeles", "Chicago", "San Francisco"], lat: 37.0902, lng: -95.7129 },
  { country: "United Kingdom", code: "GBR", cities: ["London", "Manchester", "Birmingham"], lat: 55.3781, lng: -3.4360 },
  { country: "Germany", code: "DEU", cities: ["Berlin", "Munich", "Hamburg"], lat: 51.1657, lng: 10.4515 },
  { country: "Canada", code: "CAN", cities: ["Toronto", "Vancouver", "Montreal"], lat: 56.1304, lng: -106.3468 },
  { country: "France", code: "FRA", cities: ["Paris", "Lyon", "Marseille"], lat: 46.2276, lng: 2.2137 },
  { country: "Australia", code: "AUS", cities: ["Sydney", "Melbourne", "Brisbane"], lat: -25.2744, lng: 133.7751 },
  { country: "Japan", code: "JPN", cities: ["Tokyo", "Osaka", "Kyoto"], lat: 36.2048, lng: 138.2529 },
  { country: "Brazil", code: "BRA", cities: ["Rio de Janeiro", "São Paulo", "Brasília"], lat: -14.2350, lng: -51.9253 },
  { country: "India", code: "IND", cities: ["Mumbai", "Delhi", "Bangalore"], lat: 20.5937, lng: 78.9629 },
  { country: "South Africa", code: "ZAF", cities: ["Cape Town", "Johannesburg", "Durban"], lat: -30.5595, lng: 22.9375 },
  { country: "Spain", code: "ESP", cities: ["Madrid", "Barcelona", "Valencia"], lat: 40.4637, lng: -3.7492 },
  { country: "Italy", code: "ITA", cities: ["Rome", "Milan", "Venice"], lat: 41.8719, lng: 12.5674 },
  { country: "Netherlands", code: "NLD", cities: ["Amsterdam", "Rotterdam", "Utrecht"], lat: 52.1326, lng: 5.2913 },
  { country: "Sweden", code: "SWE", cities: ["Stockholm", "Gothenburg", "Malmö"], lat: 60.1282, lng: 18.6435 },
  { country: "Singapore", code: "SGP", cities: ["Singapore"], lat: 1.3521, lng: 103.8198 },
  { country: "China", code: "CHN", cities: ["Beijing", "Shanghai", "Guangzhou"], lat: 35.8617, lng: 104.1954 },
  { country: "Mexico", code: "MEX", cities: ["Mexico City", "Guadalajara", "Monterrey"], lat: 23.6345, lng: -102.5528 },
  { country: "Russia", code: "RUS", cities: ["Moscow", "Saint Petersburg", "Novosibirsk"], lat: 61.5240, lng: 105.3188 },
  { country: "South Korea", code: "KOR", cities: ["Seoul", "Busan", "Incheon"], lat: 35.9078, lng: 127.7669 },
  { country: "Indonesia", code: "IDN", cities: ["Jakarta", "Surabaya", "Bandung"], lat: -0.7893, lng: 113.9213 },
];

// Generate random visitors
const generateRandomVisitors = (count: number): Visitor[] => {
  // Add small random variation to lat/lng to avoid overlapping points
  const addJitter = (value: number) => value + (Math.random() - 0.5) * 5;

  return Array.from({ length: count }, (_, i) => {
    const countryInfo = countryData[Math.floor(Math.random() * countryData.length)];
    const city = countryInfo.cities[Math.floor(Math.random() * countryInfo.cities.length)];
    
    // Generate a timestamp within the last 24 hours
    const timestamp = Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    
    return {
      id: `visitor-${i}`,
      country: countryInfo.country,
      countryCode: countryInfo.code,
      city,
      lat: addJitter(countryInfo.lat),
      lng: addJitter(countryInfo.lng),
      timestamp,
      pageViews: Math.floor(Math.random() * 10) + 1,
      duration: Math.floor(Math.random() * 600) + 30, // 30 seconds to 10 minutes
    };
  });
};

// Dynamically import the Globe component to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-900/50 rounded-md">
      <div className="text-white text-lg">Loading Global Visitor Map...</div>
    </div>
  ),
});

const GlobeVisualizer = () => {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState({ features: [] });
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [countryVisits, setCountryVisits] = useState<Record<string, number>>({});
  const [activeCountry, setActiveCountry] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  // Load country data
  useEffect(() => {
    fetch('/globe.json')
      .then(res => res.json())
      .then(data => {
        setCountries(data);
      });
  }, []);

  // Initialize with random visitors
  useEffect(() => {
    const initialVisitors = generateRandomVisitors(300);
    setVisitors(initialVisitors);
    
    // Calculate country visit counts
    const visitCounts: Record<string, number> = {};
    initialVisitors.forEach(visitor => {
      visitCounts[visitor.countryCode] = (visitCounts[visitor.countryCode] || 0) + 1;
    });
    setCountryVisits(visitCounts);
  }, []);

  // Add new visitors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newVisitor = generateRandomVisitors(1)[0];
      
      setVisitors(prev => [...prev.slice(-299), newVisitor]); // Keep last 300 visitors
      
      // Update country visit count
      setCountryVisits(prev => ({
        ...prev,
        [newVisitor.countryCode]: (prev[newVisitor.countryCode] || 0) + 1
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateDimensions = () => {
        const container = document.getElementById('globe-container');
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
        }
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  // Set up globe when it's ready
  useEffect(() => {
    if (globeEl.current) {
      // Configure globe
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = true;
      globeEl.current.controls().enablePan = true;
      globeEl.current.controls().update();

      // Set initial position
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  // Calculate total visits
  const totalVisits = useMemo(() => {
    return Object.values(countryVisits).reduce((sum, count) => sum + count, 0);
  }, [countryVisits]);

  // Get country color based on percentage of visits
  const getCountryColor = (country: any) => {
    if (!country.properties) return 'rgba(30, 41, 59, 0.2)';
    
    const iso = country.properties.ISO_A3;
    const visits = countryVisits[iso] || 0;
    const percentage = totalVisits > 0 ? visits / totalVisits : 0;
    
    // Grayscale with intensity based on percentage
    // Higher percentage = lighter color (more visible)
    const intensity = Math.min(0.9, 0.2 + percentage * 5);
    return `rgba(255, 255, 255, ${intensity})`;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Get country name from ISO code
  const getCountryName = (iso: string) => {
    const country = countryData.find(c => c.code === iso);
    return country ? country.country : iso;
  };

  // Get percentage of visits for a country
  const getCountryPercentage = (iso: string) => {
    const visits = countryVisits[iso] || 0;
    return totalVisits > 0 ? (visits / totalVisits * 100).toFixed(1) : '0.0';
  };

  // Custom layer for the globe
  const globeLayer = useMemo(() => {
    if (!countries.features.length) return null;
    
    return (
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        
        // Use grayscale globe
        globeImageUrl="/earth-night.jpg"
        
        // Country polygons
        polygonsData={countries.features}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => 'rgba(30, 41, 59, 0.8)'}
        polygonStrokeColor={() => 'rgba(120, 120, 120, 0.3)'}
        polygonAltitude={0.06}
        onPolygonClick={(polygon, event) => {
          setActiveCountry(polygon);
        }}
        onPolygonHover={(polygon) => {
          if (polygon) {
            document.body.style.cursor = 'pointer';
          } else {
            document.body.style.cursor = 'default';
          }
        }}
        
        // Rings for new visitors
        ringsData={visitors.filter(v => (Date.now() - v.timestamp) < 10000)} // Only show rings for visitors in the last 10 seconds
        ringLat="lat"
        ringLng="lng"
        ringColor={() => "rgba(255, 255, 255, 0.8)"}
        ringMaxRadius={2}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1000}
        
        // Atmosphere
        atmosphereColor="rgba(120, 120, 120, 0.2)"
        atmosphereAltitude={0.15}
        
        // Background
        backgroundColor="rgba(15, 23, 42, 0)"
      />
    );
  }, [visitors, countries, dimensions, countryVisits, totalVisits, activeCountry]);

  // Get top countries by visits
  const topCountries = useMemo(() => {
    return Object.entries(countryVisits)
      .map(([code, visits]) => ({ code, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
  }, [countryVisits]);

  return (
    <div className="w-full relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900 to-transparent h-20 pointer-events-none"></div>
      
      <div 
        id="globe-container"
        className="h-[600px] w-full relative overflow-hidden bg-slate-900/20 backdrop-blur-sm rounded-lg"
      >
        {globeLayer}
        
        {/* Stats overlay */}
        <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm text-white p-4 rounded-md border border-slate-700/50 shadow-lg z-10">
          <h3 className="text-lg font-medium mb-2">Top Visitor Locations</h3>
          <div className="space-y-2">
            {topCountries.map(({ code, visits }) => (
              <div key={code} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{getCountryName(code)}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-white rounded-full" style={{ 
                    width: `${Math.min(100, visits / (totalVisits * 0.01))}px`,
                    opacity: Math.min(0.9, 0.3 + (visits / totalVisits) * 5)
                  }}></div>
                  <span className="text-sm text-slate-300">{getCountryPercentage(code)}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400">
            Total visitors tracked: {totalVisits}
          </div>
        </div>
        
        {/* Selected country details */}
        {activeCountry && (
          <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm text-white p-4 rounded-md border border-slate-700/50 shadow-lg z-10 max-w-xs">
            <h3 className="text-lg font-medium mb-2">Country Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400">Country:</span>
                <span className="ml-2 text-white font-medium">{getCountryName(activeCountry.properties.ISO_A3)}</span>
              </div>
              <div>
                <span className="text-slate-400">Visitors:</span>
                <span className="ml-2">{countryVisits[activeCountry.properties.ISO_A3] || 0}</span>
              </div>
              <div>
                <span className="text-slate-400">Percentage:</span>
                <span className="ml-2">{getCountryPercentage(activeCountry.properties.ISO_A3)}%</span>
              </div>
              <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full" 
                  style={{ 
                    width: `${getCountryPercentage(activeCountry.properties.ISO_A3)}%`,
                    maxWidth: '100%'
                  }}
                ></div>
              </div>
            </div>
            <button 
              className="mt-3 w-full py-1 px-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
              onClick={() => setActiveCountry(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-slate-900 to-transparent h-20 pointer-events-none"></div>
    </div>
  );
};

export default GlobeVisualizer; 