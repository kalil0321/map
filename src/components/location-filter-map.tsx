'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Map, MapControls, useMap, MapMarker, MarkerContent } from '@/components/ui/map';
import { CONTINENTS, COUNTRIES, getCountriesByContinent } from '@/utils/geo-boundaries';
import type { GeoFilter } from '@/utils/geo-filter';

interface LocationFilterMapProps {
  onFilterChange: (filter: GeoFilter) => void;
  currentFilter: GeoFilter;
}

type FilterMode = 'continent' | 'country' | 'radius';

// Country centers for marker placement
const COUNTRY_CENTERS: Record<string, [number, number]> = {
  'US': [-98, 39],
  'CA': [-106, 56],
  'MX': [-102, 23],
  'GB': [-2, 54],
  'DE': [10, 51],
  'FR': [2, 46],
  'NL': [5, 52],
  'IE': [-8, 53],
  'ES': [-4, 40],
  'IT': [12, 42],
  'SE': [15, 62],
  'CH': [8, 47],
  'PL': [19, 52],
  'PT': [-8, 39],
  'BE': [4, 50],
  'AT': [14, 47],
  'DK': [10, 56],
  'FI': [26, 64],
  'NO': [10, 62],
  'JP': [138, 36],
  'SG': [104, 1],
  'IN': [78, 22],
  'CN': [105, 35],
  'KR': [128, 36],
  'IL': [35, 31],
  'AE': [54, 24],
  'HK': [114, 22],
  'TW': [121, 24],
  'AU': [134, -25],
  'NZ': [172, -41],
  'BR': [-53, -10],
  'AR': [-64, -34],
  'CL': [-71, -33],
  'CO': [-74, 4],
  'ZA': [25, -29],
  'NG': [8, 9],
  'EG': [30, 27],
  'KE': [38, 1],
};

// Radius circle component
function RadiusCircle({ center, radiusKm }: { center: { lat: number; lng: number }; radiusKm: number }) {
  const { map, isLoaded } = useMap();
  const sourceId = 'radius-circle-source';
  const layerId = 'radius-circle-layer';
  const outlineLayerId = 'radius-circle-outline';

  useEffect(() => {
    if (!map || !isLoaded) return;

    const points = 64;
    const coordinates: [number, number][] = [];
    const km = radiusKm;
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const latOffset = (km / 111) * Math.cos(angle);
      const lngOffset = (km / (111 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
      coordinates.push([center.lng + lngOffset, center.lat + latOffset]);
    }

    const circleGeoJSON: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coordinates] }
    };

    const source = map.getSource(sourceId);
    if (source) {
      (source as maplibregl.GeoJSONSource).setData(circleGeoJSON);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: circleGeoJSON });
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 }
      });
      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-opacity': 0.8 }
      });
    }

    return () => {
      try {
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
  }, [map, isLoaded, center.lat, center.lng, radiusKm]);

  return null;
}

// Map click handler for radius mode
function MapClickHandler({ onMapClick }: { onMapClick: (lngLat: { lng: number; lat: number }) => void }) {
  const { map, isLoaded } = useMap();
  
  useEffect(() => {
    if (!map || !isLoaded) return;
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };
    map.on('click', handleClick);
    map.getCanvas().style.cursor = 'crosshair';
    return () => {
      map.off('click', handleClick);
      map.getCanvas().style.cursor = '';
    };
  }, [map, isLoaded, onMapClick]);

  return null;
}

// Continent marker component
function ContinentMarker({ 
  continent, 
  isSelected, 
  onClick 
}: { 
  continent: typeof CONTINENTS[number];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <MapMarker 
      longitude={continent.center[0]} 
      latitude={continent.center[1]}
      onClick={onClick}
    >
      <MarkerContent>
        <div 
          className={clsx(
            'px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all',
            'shadow-lg backdrop-blur-sm whitespace-nowrap',
            isSelected 
              ? 'bg-blue-500 text-white border border-blue-400 scale-110' 
              : 'bg-black/70 text-white/80 border border-white/20 hover:bg-black/90 hover:scale-105'
          )}
        >
          {continent.name}
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

// Country marker component
function CountryMarker({ 
  country, 
  isSelected, 
  onClick 
}: { 
  country: typeof COUNTRIES[number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const center = COUNTRY_CENTERS[country.code];
  if (!center) return null;

  return (
    <MapMarker 
      longitude={center[0]} 
      latitude={center[1]}
      onClick={onClick}
    >
      <MarkerContent>
        <div 
          className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all',
            'text-[8px] font-bold shadow-md',
            isSelected 
              ? 'bg-blue-500 text-white border-2 border-blue-300 scale-125' 
              : 'bg-black/60 text-white/70 border border-white/30 hover:bg-black/80 hover:scale-110'
          )}
          title={country.name}
        >
          {country.code}
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

export function LocationFilterMap({ onFilterChange, currentFilter }: LocationFilterMapProps) {
  const [mode, setMode] = useState<FilterMode>(() => {
    if (currentFilter.type === 'continent') return 'continent';
    if (currentFilter.type === 'country') return 'country';
    if (currentFilter.type === 'radius') return 'radius';
    return 'continent';
  });
  
  const [radiusKm, setRadiusKm] = useState(() => currentFilter.radius?.radiusKm ?? 100);
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number } | null>(
    () => currentFilter.radius?.center ?? null
  );
  const [selectedContinents, setSelectedContinents] = useState<Set<string>>(
    () => new Set(currentFilter.continents ?? [])
  );
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(
    () => new Set(currentFilter.countries ?? [])
  );

  const hasMountedRef = useRef(false);

  // Sync filter changes to parent
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    let filter: GeoFilter;
    if (mode === 'continent') {
      filter = {
        type: selectedContinents.size > 0 ? 'continent' : 'none',
        continents: Array.from(selectedContinents)
      };
    } else if (mode === 'country') {
      filter = {
        type: selectedCountries.size > 0 ? 'country' : 'none',
        countries: Array.from(selectedCountries)
      };
    } else if (mode === 'radius' && clickedPoint) {
      filter = { type: 'radius', radius: { center: clickedPoint, radiusKm } };
    } else {
      filter = { type: 'none' };
    }
    onFilterChange(filter);
  }, [mode, selectedContinents, selectedCountries, clickedPoint, radiusKm, onFilterChange]);

  const handleMapClick = useCallback((lngLat: { lng: number; lat: number }) => {
    if (mode === 'radius') {
      setClickedPoint({ lat: lngLat.lat, lng: lngLat.lng });
    }
  }, [mode]);

  const handleContinentToggle = useCallback((continentId: string) => {
    setSelectedContinents(prev => {
      const updated = new Set(prev);
      if (updated.has(continentId)) updated.delete(continentId);
      else updated.add(continentId);
      return updated;
    });
  }, []);

  const handleCountryToggle = useCallback((countryCode: string) => {
    setSelectedCountries(prev => {
      const updated = new Set(prev);
      if (updated.has(countryCode)) updated.delete(countryCode);
      else updated.add(countryCode);
      return updated;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedContinents(new Set());
    setSelectedCountries(new Set());
    setClickedPoint(null);
  }, []);

  const getSelectionSummary = () => {
    if (mode === 'continent' && selectedContinents.size > 0) {
      return `${selectedContinents.size} continent${selectedContinents.size > 1 ? 's' : ''}`;
    }
    if (mode === 'country' && selectedCountries.size > 0) {
      return `${selectedCountries.size} countr${selectedCountries.size > 1 ? 'ies' : 'y'}`;
    }
    if (mode === 'radius' && clickedPoint) {
      return `${radiusKm}km radius`;
    }
    return null;
  };

  const selectionSummary = getSelectionSummary();

  // Get map center and zoom based on mode
  const getMapSettings = () => {
    if (mode === 'continent') return { center: [0, 20] as [number, number], zoom: 1 };
    if (mode === 'country') return { center: [0, 30] as [number, number], zoom: 1.5 };
    return { center: [0, 20] as [number, number], zoom: 1 };
  };

  const mapSettings = getMapSettings();

  return (
    <div className="space-y-3">
      {/* Mode Tabs */}
      <div className="flex gap-2">
        {(['continent', 'country', 'radius'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              'px-[10px] py-1 rounded-full text-[11px] font-medium',
              'transition-[border-color,background-color] duration-200 ease-in-out cursor-pointer',
              mode === m
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                : 'bg-white/8 border border-white/12 text-white/70 hover:bg-white/12 hover:border-white/20'
            )}
          >
            {m === 'continent' ? 'Continents' : m === 'country' ? 'Countries' : 'Radius'}
          </button>
        ))}
        
        {selectionSummary && (
          <button
            onClick={handleClearAll}
            className="ml-auto px-[10px] py-1 rounded-full text-[11px] font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-[border-color,background-color] duration-200 ease-in-out cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Interactive Map */}
      <div className="h-[300px] rounded-xl overflow-hidden border border-white/12">
        <Map 
          center={mapSettings.center} 
          zoom={mapSettings.zoom}
          theme="dark"
        >
          <MapControls showZoom position="bottom-right" />
          
          {/* Continent markers */}
          {mode === 'continent' && CONTINENTS.map((continent) => (
            <ContinentMarker
              key={continent.id}
              continent={continent}
              isSelected={selectedContinents.has(continent.id)}
              onClick={() => handleContinentToggle(continent.id)}
            />
          ))}
          
          {/* Country markers */}
          {mode === 'country' && COUNTRIES.map((country) => (
            <CountryMarker
              key={country.code}
              country={country}
              isSelected={selectedCountries.has(country.code)}
              onClick={() => handleCountryToggle(country.code)}
            />
          ))}
          
          {/* Radius mode click handler */}
          {mode === 'radius' && (
            <MapClickHandler onMapClick={handleMapClick} />
          )}
          
          {/* Radius circle + center marker */}
          {mode === 'radius' && clickedPoint && (
            <>
              <RadiusCircle center={clickedPoint} radiusKm={radiusKm} />
              <MapMarker longitude={clickedPoint.lng} latitude={clickedPoint.lat}>
                <MarkerContent>
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                </MarkerContent>
              </MapMarker>
            </>
          )}
        </Map>
      </div>

      {/* Helper text */}
      <div className="text-[10px] text-white/40">
        {mode === 'continent' && 'Click on continent labels to select'}
        {mode === 'country' && 'Click on country markers to select'}
        {mode === 'radius' && (clickedPoint ? 'Adjust radius with the slider below' : 'Click anywhere on the map to set center')}
      </div>

      {/* Radius Slider */}
      {mode === 'radius' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[11px] text-white/50">Radius</label>
            <span className="text-[11px] text-white/70 font-medium">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            disabled={!clickedPoint}
            className={clsx(
              'w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/20',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500',
              '[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md',
              !clickedPoint && 'opacity-50 cursor-not-allowed'
            )}
          />
          <div className="flex justify-between text-[10px] text-white/40">
            <span>10 km</span>
            <span>500 km</span>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectionSummary && (
        <div className="text-[11px] text-white/50 pt-2 border-t border-white/8">
          Filtering by: <span className="text-blue-400 font-medium">{selectionSummary}</span>
        </div>
      )}
    </div>
  );
}
