import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useLocationHistory, useSettings } from "../hooks/useQueries";

function calcDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTimestamp(ts: bigint): string {
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
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
}

interface Props {
  onViewRoute: () => void;
}

export default function HistoryPage({ onViewRoute }: Props) {
  const { data: history, isLoading } = useLocationHistory();
  const { data: settings } = useSettings();

  const safeZoneLat = settings?.safeZoneCenterLat ?? 17.385;
  const safeZoneLng = settings?.safeZoneCenterLng ?? 78.4867;
  const safeZoneRadius = Number(settings?.safeZoneRadius ?? 500);

  const sorted = history
    ? [...history].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];

  return (
    <div className="flex flex-col min-h-full bg-background">
      <header className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              History
            </h1>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {sorted.length} GPS fixes recorded
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onViewRoute}
            className="border-primary/30 text-primary hover:bg-primary/10 font-mono text-xs h-8"
          >
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Route
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 pb-4">
        {isLoading ? (
          <div data-ocid="history.loading_state" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-surface p-4">
                <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse mb-2" />
                <div className="h-2.5 w-3/4 bg-muted/40 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="history.empty_state"
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.22 0.02 240)",
                border: "1px solid oklch(0.20 0.025 240)",
              }}
            >
              <Clock className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-display font-semibold text-foreground">
              No location history
            </p>
            <p className="text-xs text-muted-foreground font-body text-center">
              Start your ESP32 tracker to see GPS history here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2 pb-4">
              {sorted.map((loc, index) => {
                const dist = calcDistanceMeters(
                  loc.latitude,
                  loc.longitude,
                  safeZoneLat,
                  safeZoneLng,
                );
                const inside = dist <= safeZoneRadius;
                return (
                  <motion.div
                    key={`${Number(loc.timestamp)}-${index}`}
                    data-ocid={`history.item.${index + 1}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(index * 0.04, 0.3),
                    }}
                    className="card-surface p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background:
                              index === 0
                                ? "oklch(0.72 0.18 195 / 0.15)"
                                : "oklch(0.22 0.02 240)",
                            border: `1px solid ${index === 0 ? "oklch(0.72 0.18 195 / 0.3)" : "oklch(0.20 0.025 240)"}`,
                          }}
                        >
                          <MapPin
                            className="w-3.5 h-3.5"
                            style={{
                              color:
                                index === 0
                                  ? "oklch(0.72 0.18 195)"
                                  : "oklch(0.52 0.05 240)",
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-display font-semibold text-foreground truncate">
                            {loc.locationName || "Unknown"}
                          </p>
                          <p className="text-[11px] font-mono text-primary mt-0.5">
                            {loc.latitude.toFixed(5)},{" "}
                            {loc.longitude.toFixed(5)}
                          </p>
                          <span
                            className={`text-[10px] font-mono mt-1 inline-block ${
                              inside ? "text-success" : "text-destructive"
                            }`}
                          >
                            {Math.round(dist)}m · {inside ? "SAFE" : "OUTSIDE"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {formatTimestamp(loc.timestamp)}
                        </p>
                        <a
                          href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] font-mono text-primary/60 hover:text-primary transition-colors mt-1"
                        >
                          Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
