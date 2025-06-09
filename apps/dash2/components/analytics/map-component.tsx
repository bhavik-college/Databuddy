"use client";

import { scalePow } from "d3-scale";
import type { Feature, GeoJsonObject } from "geojson";
import type { Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState, useRef } from "react";
import { GeoJSON, MapContainer } from "react-leaflet";
import { useCountries, useSubdivisions } from "@/lib/geo";
import { CountryFlag } from "./icons/CountryFlag";
import { getCountryPopulation } from "@/lib/data";

interface TooltipContent {
  name: string;
  code: string;
  count: number;
  percentage: number;
  perCapita?: number;
}

interface TooltipPosition {
  x: number;
  y: number;
}

const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export function MapComponent({
  height,
  mode = "total",
  locationData,
  isLoading: passedIsLoading = false,
}: {
  height: string;
  mode?: "total" | "perCapita";
  locationData?: any;
  isLoading?: boolean;
}) {
  const locationsData = locationData;

  // Process country data from locations data
  const countryData = useMemo(() => {
    if (!locationsData?.countries) return null;
    
    // Filter out empty country codes and ensure proper formatting
    const validCountries = locationsData.countries.filter((country: any) => 
      country.country && country.country.trim() !== ""
    );
    
    const totalVisitors = validCountries.reduce((sum: number, c: any) => sum + c.visitors, 0) || 1;
    
    return {
      data: validCountries.map((country: any) => ({
        value: country.country.toUpperCase(), // Ensure uppercase for ISO matching
        count: country.visitors,
        percentage: (country.visitors / totalVisitors) * 100,
      })),
    };
  }, [locationsData?.countries]);

  const subdivisionData = useMemo(() => {
    if (!locationsData?.cities) return null;
    
    // Group cities by region
    const regions: Record<string, { visitors: number; pageviews: number }> = {};
    
    for (const city of locationsData.cities) {
      const regionKey = `${city.country}-${city.region}`;
      if (!regions[regionKey]) {
        regions[regionKey] = { visitors: 0, pageviews: 0 };
      }
      regions[regionKey].visitors += city.visitors;
      regions[regionKey].pageviews += city.pageviews;
    }
    
    return {
      data: Object.entries(regions).map(([key, data]) => ({
        value: key,
        count: data.visitors,
        percentage: (data.visitors / (locationsData.cities.reduce((sum: number, c: any) => sum + c.visitors, 0) || 1)) * 100,
      })),
    };
  }, [locationsData?.cities]);

  const [dataVersion, setDataVersion] = useState<number>(0);

  useEffect(() => {
    if (countryData || subdivisionData) {
      setDataVersion((prev) => prev + 1);
    }
  }, [countryData, subdivisionData]);

  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  });
  const [mapView] = useState<"countries" | "subdivisions">("countries");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Process data to include per capita metrics
  const processedCountryData = useMemo(() => {
    if (!countryData?.data) return null;

    return countryData.data.map((item: any) => {
      const population = getCountryPopulation(item.value);
      const perCapitaValue = population > 0 ? item.count / population : 0;
      return {
        ...item,
        perCapita: perCapitaValue,
      };
    });
  }, [countryData?.data]);

  const colorScale = useMemo(() => {
    if (!processedCountryData) return () => "#e5e7eb";

    // Get the range of values
    const metricToUse = mode === "perCapita" ? "perCapita" : "count";
    const values = processedCountryData?.map((d: any) => d[metricToUse]) || [0];
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values.filter(v => v > 0));

    // Better blue color scheme with improved contrast
    const baseBlue = "59, 130, 246"; // Blue-500 RGB values
    const lightBlue = "147, 197, 253"; // Blue-300 RGB values
    
    // Use a square root scale (exponent 0.5) for better visual distribution
    const scale = scalePow<number>()
      .exponent(0.5)
      .domain([minValue || 0, maxValue])
      .range([0.1, 1]);

    return (value: number) => {
      if (value === 0) return `rgba(229, 231, 235, 0.3)`; // Gray-200 for no data
      
      const intensity = scale(value);
      
      // Use a gradient from light blue to dark blue based on intensity
      if (intensity < 0.3) {
        return `rgba(${lightBlue}, ${0.2 + intensity * 0.4})`;
      } else if (intensity < 0.7) {
        return `rgba(${baseBlue}, ${0.4 + intensity * 0.4})`;
      } else {
        return `rgba(${baseBlue}, ${0.7 + intensity * 0.3})`;
      }
    };
  }, [processedCountryData, mode]);

  const { data: subdivisionsGeoData } = useSubdivisions();
  const { data: countriesGeoData } = useCountries();

  const handleStyle = (feature: Feature<any>) => {
    const dataKey = feature?.properties?.ISO_A2;
    const foundData = processedCountryData?.find(({ value }: any) => value === dataKey);

    const metricValue = mode === "perCapita" ? foundData?.perCapita || 0 : foundData?.count || 0;
    const fillColor = colorScale(metricValue);
    
    // Enhanced border styling based on data and hover state
    const isHovered = hoveredId === dataKey?.toString();
    const hasData = metricValue > 0;
    
    // Dynamic border color and weight for better visual hierarchy
    const borderColor = hasData 
      ? (isHovered ? "rgba(59, 130, 246, 0.9)" : "rgba(59, 130, 246, 0.4)")
      : "rgba(156, 163, 175, 0.3)"; // Gray-400 for no data
      
    const borderWeight = hasData 
      ? (isHovered ? 2.5 : 1.2)
      : 0.8;
    
    // Enhanced fill opacity with better contrast
    const fillOpacity = hasData 
      ? (isHovered ? 0.95 : 0.8)
      : 0.2;

    return {
      color: borderColor,
      weight: borderWeight,
      fill: true,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
      opacity: 1,
      // Smooth transitions for better UX
      transition: "all 0.2s ease-in-out",
      // Add slight shadow effect for hovered countries
      ...(isHovered && hasData && {
        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
      })
    };
  };

  const handleEachFeature = (feature: Feature<any>, layer: Layer) => {
    layer.on({
      mouseover: () => {
        const code = feature.properties?.ISO_A2;
        setHoveredId(code);

        const name = feature.properties?.ADMIN;
        const foundData = processedCountryData?.find(({ value }: any) => value === code);
        const count = foundData?.count || 0;
        const percentage = foundData?.percentage || 0;
        const perCapita = foundData?.perCapita || 0;

        setTooltipContent({
          name,
          code,
          count,
          percentage,
          perCapita,
        });
      },
      mouseout: () => {
        setHoveredId(null);
        setTooltipContent(null);
      },
      click: () => {
        // Functionality removed
      },
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedHeight, setResolvedHeight] = useState<number>(0);
  
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setResolvedHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const zoom = resolvedHeight ? Math.log2(resolvedHeight / 400) + 1 : 1;

  return (
    <div
      onMouseMove={(e) => {
        if (tooltipContent) {
          setTooltipPosition({
            x: e.clientX,
            y: e.clientY,
          });
        }
      }}
      style={{
        height: height,
      }}
      ref={containerRef}
      className="relative"
    >
      {passedIsLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loading map data...
            </span>
          </div>
        </div>
      )}
      
      {(countriesGeoData || subdivisionsGeoData) && (
        <MapContainer
          preferCanvas={true}
          attributionControl={false}
          zoomControl={false}
          center={[40, 3]}
          zoom={zoom}
          style={{
            height: "100%",
            background: "none",
            cursor: "default",
            outline: "none",
            zIndex: "1",
          }}
        >
          {mapView === "countries" && countriesGeoData && (
            <GeoJSON
              key={`countries-${dataVersion}-${mode}`}
              data={countriesGeoData as GeoJsonObject}
              style={handleStyle as any}
              onEachFeature={handleEachFeature}
            />
          )}
        </MapContainer>
      )}
      {tooltipContent && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700 text-sm pointer-events-none backdrop-blur-sm"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 10,
            transform: "translate(-50%, -100%)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          }}
        >
          <div className="font-medium flex items-center gap-2 mb-1">
            {tooltipContent.code && (
              <CountryFlag country={tooltipContent.code.slice(0, 2)} />
            )}
            <span className="text-gray-900 dark:text-white">
              {tooltipContent.name}
            </span>
          </div>
          <div className="space-y-1">
            <div>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {tooltipContent.count.toLocaleString()}
              </span>{" "}
              <span className="text-gray-600 dark:text-gray-400">
                ({tooltipContent.percentage.toFixed(1)}%) visitors
              </span>
            </div>
            {mode === "perCapita" && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {roundToTwo(tooltipContent.perCapita ?? 0)}
                </span>{" "}
                per million people
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 