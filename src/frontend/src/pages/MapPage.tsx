import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Circle, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useLocationHistory, useSettings } from "../hooks/useQueries";

function formatShortTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (isToday) return `Today ${timeStr}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${timeStr}`;
}

export default function MapPage() {
  const { data: history, refetch } = useLocationHistory();
  const { data: settings } = useSettings();
  const { actor } = useActor();

  const sorted = history
    ? [...history].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];
  const latestLocation = sorted.length > 0 ? sorted[0] : null;

  const centerLat = settings?.safeZoneCenterLat ?? 17.385;
  const centerLng = settings?.safeZoneCenterLng ?? 78.4867;
  const markerLat = latestLocation?.latitude ?? centerLat;
  const markerLng = latestLocation?.longitude ?? centerLng;

  const span = 0.018;
  const bbox = `${centerLng - span},${centerLat - span},${centerLng + span},${centerLat + span}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerLat},${markerLng}`;

  const handleRefresh = async () => {
    try {
      if (actor) await actor.updateDeviceStatus();
      await refetch();
      toast.success("Location refreshed");
    } catch {
      toast.error("Failed to refresh");
    }
  };

  const last10 = sorted.slice(0, 10);

  return (
    <div className="flex flex-col min-h-full bg-background">
      <header className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Live Map
            </h1>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              OpenStreetMap · Real-time
            </p>
          </div>
          <Button
            data-ocid="map.refresh.button"
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 font-mono text-xs h-8"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Sync
          </Button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 px-4 pb-4 space-y-3"
      >
        {/* Map */}
        <div
          className="card-surface overflow-hidden"
          style={{ height: "300px" }}
        >
          <iframe
            data-ocid="map.map_marker"
            src={osmUrl}
            title="Live location map"
            className="w-full h-full border-0"
            style={{ filter: "invert(0.88) hue-rotate(180deg) saturate(0.9)" }}
            loading="lazy"
          />
        </div>

        {/* Current position */}
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-display font-semibold text-foreground">
              Current Position
            </span>
          </div>
          {latestLocation ? (
            <div className="space-y-1.5">
              <p className="text-base font-display font-bold text-foreground">
                {latestLocation.locationName || "Unknown Location"}
              </p>
              <p className="text-xs font-mono text-primary">
                {latestLocation.latitude.toFixed(6)},{" "}
                {latestLocation.longitude.toFixed(6)}
              </p>
              <a
                data-ocid="map.link"
                href={`https://maps.google.com/?q=${latestLocation.latitude},${latestLocation.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-primary/70 hover:text-primary transition-colors mt-1"
              >
                Open in Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body">
              Awaiting GPS fix from ESP32
            </p>
          )}
        </div>

        {/* Geofence info */}
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-4 h-4 text-success" />
            <span className="text-sm font-display font-semibold text-foreground">
              Safe Zone
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground">
                CENTER
              </p>
              <p className="text-xs font-mono text-foreground">
                {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground">
                RADIUS
              </p>
              <p className="text-xs font-mono text-foreground">
                {Number(settings?.safeZoneRadius ?? 500)}m
              </p>
            </div>
          </div>
        </div>

        {/* Route history */}
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
              ROUTE HISTORY
            </span>
            <span className="text-[10px] font-mono text-primary ml-auto">
              {last10.length} points
            </span>
          </div>
          {last10.length === 0 ? (
            <p
              data-ocid="map.empty_state"
              className="text-xs text-muted-foreground font-body py-4 text-center"
            >
              No location points yet
            </p>
          ) : (
            <ScrollArea className="max-h-56">
              <div className="space-y-0">
                {last10.map((loc, i) => (
                  <div
                    key={`${Number(loc.timestamp)}-${i}`}
                    data-ocid={`map.item.${i + 1}`}
                    className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background:
                          i === 0
                            ? "oklch(0.72 0.18 195 / 0.2)"
                            : "oklch(0.22 0.02 240)",
                        border: `1px solid ${i === 0 ? "oklch(0.72 0.18 195 / 0.4)" : "oklch(0.20 0.025 240)"}`,
                      }}
                    >
                      <span
                        className="text-[8px] font-mono"
                        style={{
                          color:
                            i === 0
                              ? "oklch(0.72 0.18 195)"
                              : "oklch(0.52 0.05 240)",
                        }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">
                        {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {loc.locationName || "—"}
                      </p>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {formatShortTime(loc.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <p className="text-[10px] font-mono text-muted-foreground/40 text-center pb-1">
          Map data © OpenStreetMap contributors
        </p>
      </motion.div>
    </div>
  );
}
