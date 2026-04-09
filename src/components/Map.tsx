"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useVisited } from "@/context/VisitedContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type ViewMode = "2d" | "3d";

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { visited, visitedCount } = useVisited();
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [hoveredCountry, setHoveredCountry] = useState<string>("");
  const [showVisited, setShowVisited] = useState(true);

  const initMap = useCallback(
    (projection: string) => {
      if (!mapContainer.current || !MAPBOX_TOKEN) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style:
          theme === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/light-v11",
        center: [10, 20],
        zoom: projection === "globe" ? 1.8 : 1.5,
        projection: projection as "globe" | "mercator",
      });

      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

      if (projection === "globe") {
        map.on("style.load", () => {
          map.setFog({
            color: theme === "dark" ? "rgb(10, 15, 30)" : "rgb(220, 230, 255)",
            "high-color": theme === "dark" ? "rgb(20, 30, 50)" : "rgb(150, 180, 255)",
            "horizon-blend": 0.04,
            "space-color": theme === "dark" ? "rgb(5, 8, 18)" : "rgb(15, 25, 60)",
            "star-intensity": theme === "dark" ? 0.6 : 0.15,
          });
        });
      }

      map.on("load", () => {
        map.addSource("countries", {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        });

        map.addLayer({
          id: "country-fills",
          type: "fill",
          source: "countries",
          "source-layer": "country_boundaries",
          paint: {
            "fill-color": theme === "dark" ? "#1a2235" : "#dbeafe",
            "fill-opacity": 0,
          },
        });

        // Visited countries layer
        map.addLayer({
          id: "country-visited",
          type: "fill",
          source: "countries",
          "source-layer": "country_boundaries",
          paint: {
            "fill-color": "#14b8a6",
            "fill-opacity": 0.35,
          },
          filter: ["in", "name_en", ""],
        });

        map.addLayer({
          id: "country-visited-border",
          type: "line",
          source: "countries",
          "source-layer": "country_boundaries",
          paint: {
            "line-color": "#14b8a6",
            "line-width": 1.5,
          },
          filter: ["in", "name_en", ""],
        });

        map.addLayer({
          id: "country-fills-hover",
          type: "fill",
          source: "countries",
          "source-layer": "country_boundaries",
          paint: {
            "fill-color": "#f0a500",
            "fill-opacity": 0.25,
          },
          filter: ["==", "name_en", ""],
        });

        map.addLayer({
          id: "country-borders-hover",
          type: "line",
          source: "countries",
          "source-layer": "country_boundaries",
          paint: {
            "line-color": "#f0a500",
            "line-width": 2,
          },
          filter: ["==", "name_en", ""],
        });

        map.on("mousemove", "country-fills", (e) => {
          if (e.features && e.features.length > 0) {
            map.getCanvas().style.cursor = "pointer";
            const name = e.features[0].properties?.name_en || "";
            map.setFilter("country-fills-hover", ["==", "name_en", name]);
            map.setFilter("country-borders-hover", ["==", "name_en", name]);
            setHoveredCountry(name);

            if (tooltipRef.current) {
              tooltipRef.current.style.left = `${e.point.x + 12}px`;
              tooltipRef.current.style.top = `${e.point.y - 10}px`;
            }
          }
        });

        map.on("mouseleave", "country-fills", () => {
          map.getCanvas().style.cursor = "";
          map.setFilter("country-fills-hover", ["==", "name_en", ""]);
          map.setFilter("country-borders-hover", ["==", "name_en", ""]);
          setHoveredCountry("");
        });

        map.on("click", "country-fills", (e) => {
          if (e.features && e.features.length > 0) {
            const name = e.features[0].properties?.name_en;
            if (name) {
              router.push(`/country/${encodeURIComponent(name)}`);
            }
          }
        });
      });

      mapRef.current = map;
    },
    [theme, router],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    try {
      if (showVisited && visited.length > 0) {
        const filter: mapboxgl.FilterSpecification = ["in", "name_en", ...visited];
        map.setFilter("country-visited", filter);
        map.setFilter("country-visited-border", filter);
      } else {
        map.setFilter("country-visited", ["in", "name_en", ""]);
        map.setFilter("country-visited-border", ["in", "name_en", ""]);
      }
    } catch {
      // Map layers may not be ready yet
    }
  }, [visited, showVisited]);

  useEffect(() => {
    initMap(viewMode === "3d" ? "globe" : "mercator");
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode, initMap]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="w-full h-[600px] rounded-2xl flex items-center justify-center atlas-card"
      >
        <div className="text-center p-8">
          <p className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}>
            {t.map.no_token_title}
          </p>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t.map.no_token_desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* 2D/3D Toggle */}
        <div className="glass-card flex overflow-hidden" style={{ borderRadius: "var(--radius-md)", padding: 0 }}>
          {(["2d", "3d"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-4 py-2 text-sm font-semibold transition-all"
              style={{
                background: viewMode === mode ? "var(--atlas-gold)" : "transparent",
                color: viewMode === mode ? "var(--text-inverse)" : "var(--text-secondary)",
              }}
            >
              {mode === "2d" ? t.map.map_2d : t.map.globe_3d}
            </button>
          ))}
        </div>

        {/* Visited toggle */}
        {visitedCount > 0 && (
          <button
            onClick={() => setShowVisited(!showVisited)}
            className="atlas-pill text-xs"
            style={{
              background: showVisited ? "rgba(20, 184, 166, 0.15)" : "var(--atlas-surface)",
              color: showVisited ? "var(--atlas-teal)" : "var(--text-secondary)",
              borderColor: showVisited ? "rgba(20, 184, 166, 0.3)" : "var(--atlas-border)",
            }}
          >
            <span>{showVisited ? "✓" : "○"}</span>
            {t.map.visited} ({visitedCount})
          </button>
        )}
      </div>

      {/* Country tooltip */}
      {hoveredCountry && (
        <div
          ref={tooltipRef}
          className="absolute z-20 pointer-events-none glass-card px-3 py-1.5 text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {hoveredCountry}
        </div>
      )}

      <div
        ref={mapContainer}
        className="w-full h-[600px] overflow-hidden"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--atlas-border)",
          boxShadow: "var(--shadow-card)",
        }}
      />
    </div>
  );
}
