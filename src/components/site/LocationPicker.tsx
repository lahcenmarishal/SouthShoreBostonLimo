import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Loader2, LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Fix Leaflet default marker icons (Vite bundler-safe URLs)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const UA_HEADER = { "Accept-Language": "en" };
const BOSTON_CENTER: [number, number] = [42.3601, -71.0589];

type LatLng = { lat: number; lon: number };

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

async function search(q: string): Promise<NominatimResult[]> {
  if (q.trim().length < 3) return [];
  // Bias toward the Boston metro area
  const params = new URLSearchParams({
    format: "json",
    limit: "6",
    addressdetails: "0",
    q,
    viewbox: "-71.30,42.55,-70.80,42.15", // west,north,east,south
    bounded: "0",
    countrycodes: "us",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: UA_HEADER,
  });
  if (!res.ok) return [];
  return res.json();
}

async function reverse(lat: number, lon: number): Promise<string | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    { headers: UA_HEADER },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.display_name === "string" ? data.display_name : null;
}

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 14), { animate: true });
  }, [position, map]);
  return null;
}

export interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (address: string, coords?: LatLng) => void;
  placeholder?: string;
  className?: string;
}

export function LocationPicker({ label, value, onChange, placeholder, className }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => setQuery(value), [value]);

  // Debounced autocomplete
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const r = await search(query);
        setResults(r);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const pickResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    setPosition([lat, lon]);
    setQuery(r.display_name);
    onChange(r.display_name, { lat, lon });
  };

  const pickCoords = async (p: LatLng) => {
    setPosition([p.lat, p.lon]);
    setReverseLoading(true);
    try {
      const addr = await reverse(p.lat, p.lon);
      const finalAddr = addr ?? `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
      setQuery(finalAddr);
      onChange(finalAddr, p);
    } finally {
      setReverseLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => pickCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const initialCenter = useMemo<[number, number]>(() => position ?? BOSTON_CENTER, [position]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs uppercase tracking-wider text-silver">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
        <Input
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder ?? "Search or pick on map"}
          className="pl-9 pr-24"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-silver"
        >
          {open ? "Close map" : "Pick on map"}
        </button>
      </div>

      {open && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Autocomplete results (search input is the main field above) */}
          {(searching || results.length > 0) && (
            <div className="p-3 border-b border-border bg-background/40">
              {searching && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 pb-2">
                  <Loader2 className="size-3 animate-spin" /> Searching…
                </div>
              )}
              {results.length > 0 && (
                <ul className="max-h-48 overflow-auto rounded-md border border-border divide-y divide-border bg-card">
                  {results.map((r) => (
                    <li key={r.place_id}>
                      <button
                        type="button"
                        onClick={() => pickResult(r)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex gap-2 items-start"
                      >
                        <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{r.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}


          <div className="relative h-72 w-full">
            <MapContainer
              center={initialCenter}
              zoom={12}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickHandler onPick={pickCoords} />
              <Recenter position={position} />
              {position && (
                <Marker
                  position={position}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const m = e.target as L.Marker;
                      const ll = m.getLatLng();
                      pickCoords({ lat: ll.lat, lon: ll.lng });
                    },
                  }}
                />
              )}
            </MapContainer>
            {reverseLoading && (
              <div className="absolute top-2 right-2 bg-card/90 border border-border rounded-md px-2 py-1 text-xs flex items-center gap-1 z-[1000]">
                <Loader2 className="size-3 animate-spin" /> Locating…
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 p-2 border-t border-border bg-background/40">
            <p className="text-[11px] text-muted-foreground pl-1">
              Click on the map or drag the pin to set an exact location.
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={useMyLocation}>
                <LocateFixed className="size-3.5 mr-1" /> My location
              </Button>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
