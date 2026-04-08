import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  Satellite,
  Settings,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { type Variants, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Tab } from "../App";
import { useGeoLinker } from "../hooks/useGeoLinker";
import { useGeoLinkerConfig } from "../hooks/useGeoLinkerConfig";
import {
  useAddLocation,
  useDeviceStatus,
  useLocationHistory,
  useSettings,
} from "../hooks/useQueries";

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

function formatRelativeTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface Props {
  onNavigate: (tab: Tab) => void;
}

export default function DashboardPage({ onNavigate }: Props) {
  const { data: history, refetch: refetchHistory } = useLocationHistory();
  const { data: isOnline, refetch: refetchStatus } = useDeviceStatus();
  const { data: settings } = useSettings();
  const addLocation = useAddLocation();
  const { isConfigured, deviceId } = useGeoLinkerConfig();
  const {
    fetchLatestLocation,
    isFetching: geoFetching,
    error: geoError,
    lastSyncTime,
  } = useGeoLinker();
  const [syncing, setSyncing] = useState(false);
  const isOffline = !navigator.onLine;

  const latestLocation =
    history && history.length > 0
      ? history.reduce((a, b) => (a.timestamp > b.timestamp ? a : b))
      : null;

  const safeZoneLat = settings?.safeZoneCenterLat ?? 17.385;
  const safeZoneLng = settings?.safeZoneCenterLng ?? 78.4867;
  const safeZoneRadius = Number(settings?.safeZoneRadius ?? 500);

  const distanceFromSafeZone = latestLocation
    ? calcDistanceMeters(
        latestLocation.latitude,
        latestLocation.longitude,
        safeZoneLat,
        safeZoneLng,
      )
    : null;

  const isInsideSafeZone =
    distanceFromSafeZone !== null && distanceFromSafeZone <= safeZoneRadius;

  const handleSync = async () => {
    setSyncing(true);
    try {
      if (isConfigured) {
        const data = await fetchLatestLocation();
        if (data) {
          await addLocation.mutateAsync({
            latitude: data.latitude,
            longitude: data.longitude,
            locationName: data.locationName ?? "",
            timestamp: BigInt(Math.floor(Date.now() * 1_000_000)),
          });
          toast.success("Location synced from GeoLinker");
        } else if (geoError) {
          toast.error(geoError);
        }
      }
      await Promise.all([refetchHistory(), refetchStatus()]);
      if (!isConfigured) toast.success("Data refreshed");
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      {isOffline && (
        <div className="bg-destructive/20 border-b border-destructive/30 px-4 py-2 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-destructive" />
          <span className="text-destructive text-xs font-mono">
            OFFLINE — showing cached data
          </span>
        </div>
      )}

      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.18 195 / 0.12)",
                border: "1px solid oklch(0.72 0.18 195 / 0.3)",
              }}
            >
              <Satellite
                className="w-4.5 h-4.5 text-primary"
                style={{ width: 18, height: 18 }}
              />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground leading-none">
                GeoTracker
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                ESP32-S3 · NEO-6M GPS
              </p>
            </div>
          </div>
          <Badge
            data-ocid="dashboard.status.card"
            variant="outline"
            className={`gap-1.5 font-mono text-[10px] ${
              isOnline
                ? "border-success/40 text-success bg-success/10"
                : "border-muted/40 text-muted-foreground bg-muted/10"
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Badge>
        </div>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex-1 px-4 pb-4 space-y-3"
      >
        {/* GeoLinker connection card */}
        {!isConfigured ? (
          <motion.div variants={card}>
            <div
              className="rounded-xl p-4"
              style={{
                background: "oklch(0.72 0.18 195 / 0.05)",
                border: "1px solid oklch(0.72 0.18 195 / 0.25)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: "oklch(0.72 0.18 195 / 0.12)",
                    border: "1px solid oklch(0.72 0.18 195 / 0.25)",
                  }}
                >
                  <Satellite className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-foreground">
                    Connect your hardware
                  </p>
                  <p className="text-xs font-body text-muted-foreground mt-1">
                    Add your GeoLinker API key and Device ID in Settings to
                    receive live GPS data from your ESP32-S3.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("settings")}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    Configure in Settings →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={card}>
            <div className="card-surface p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-mono text-muted-foreground">
                    DEVICE
                  </span>
                  <span className="text-xs font-mono text-foreground truncate max-w-[120px]">
                    {deviceId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {lastSyncTime ? (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      synced{" "}
                      {formatRelativeTime(
                        BigInt(Math.floor(lastSyncTime.getTime() * 1_000_000)),
                      )}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      not synced
                    </span>
                  )}
                  {geoError && (
                    <AlertTriangle className="w-3 h-3 text-warning" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live position */}
        <motion.div variants={card}>
          <div
            data-ocid="dashboard.location.card"
            className="card-surface p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-display font-medium text-foreground">
                  Live Position
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("map")}
                className="text-[11px] font-mono text-primary/70 hover:text-primary transition-colors"
              >
                VIEW MAP →
              </button>
            </div>
            {latestLocation ? (
              <div className="space-y-1">
                <p className="text-base font-display font-semibold text-foreground">
                  {latestLocation.locationName || "Unknown Location"}
                </p>
                <p className="text-xs font-mono text-primary">
                  {latestLocation.latitude.toFixed(6)},&nbsp;
                  {latestLocation.longitude.toFixed(6)}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {formatRelativeTime(latestLocation.timestamp)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-body">
                No GPS fix yet. Start your ESP32 tracker.
              </p>
            )}
          </div>
        </motion.div>

        {/* Geofence status */}
        <motion.div variants={card}>
          <div className="card-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isInsideSafeZone ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : distanceFromSafeZone !== null ? (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-display font-medium text-foreground">
                  Geofence Status
                </span>
              </div>
              <Badge
                className={`font-mono text-[10px] ${
                  distanceFromSafeZone === null
                    ? "bg-muted/30 text-muted-foreground border-muted/30"
                    : isInsideSafeZone
                      ? "bg-success/15 text-success border-success/30"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                }`}
              >
                {distanceFromSafeZone === null
                  ? "NO DATA"
                  : isInsideSafeZone
                    ? "SAFE"
                    : "BREACH"}
              </Badge>
            </div>
            {distanceFromSafeZone !== null && (
              <p className="text-xs font-mono text-muted-foreground mt-2">
                {Math.round(distanceFromSafeZone)}m from safe zone center
                {" · "}radius {safeZoneRadius}m
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={card} className="grid grid-cols-3 gap-2">
          <div className="card-surface p-3 text-center">
            <p className="text-2xl font-display font-bold text-primary">
              {history?.length ?? 0}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              FIXES
            </p>
          </div>
          <div className="card-surface p-3 text-center">
            <p
              className={`text-sm font-mono font-bold mt-1 ${
                distanceFromSafeZone === null
                  ? "text-muted-foreground"
                  : isInsideSafeZone
                    ? "text-success"
                    : "text-destructive"
              }`}
            >
              {distanceFromSafeZone === null
                ? "—"
                : isInsideSafeZone
                  ? "SAFE"
                  : "BREACH"}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              ZONE
            </p>
          </div>
          <div className="card-surface p-3 text-center">
            <div className="flex items-center justify-center mt-1">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              DEVICE
            </p>
          </div>
        </motion.div>

        {/* Sync button */}
        <motion.div variants={card}>
          <Button
            data-ocid="dashboard.primary_button"
            onClick={handleSync}
            disabled={syncing || geoFetching}
            className="w-full h-12 font-mono font-semibold text-sm rounded-xl transition-all"
            style={{
              background: "oklch(0.72 0.18 195 / 0.12)",
              border: "1px solid oklch(0.72 0.18 195 / 0.3)",
              color: "oklch(0.72 0.18 195)",
            }}
            variant="outline"
          >
            {syncing || geoFetching ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            {isConfigured ? "SYNC FROM GEOLINKER" : "REFRESH DATA"}
          </Button>
        </motion.div>

        {geoError && (
          <motion.div variants={card}>
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{
                background: "oklch(0.78 0.16 85 / 0.08)",
                border: "1px solid oklch(0.78 0.16 85 / 0.2)",
              }}
            >
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs font-body text-warning/90">{geoError}</p>
            </div>
          </motion.div>
        )}

        <motion.div variants={card}>
          <div className="card-surface p-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
            <p className="text-[10px] font-mono text-muted-foreground/60">
              ESP32 sends GPS every 15s · Auto-detection enabled
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
