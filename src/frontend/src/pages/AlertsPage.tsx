import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import type { Alert } from "../backend.d";
import { useAddAlert, useAlerts, useResolveAlert } from "../hooks/useQueries";

function formatAlertTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  });
}

interface Props {
  onTriggerAlarm: (alert: Alert) => void;
}

export default function AlertsPage({ onTriggerAlarm }: Props) {
  const { data: alerts, isLoading } = useAlerts();
  const resolveAlert = useResolveAlert();
  const addAlert = useAddAlert();

  const sorted = alerts
    ? [...alerts].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];

  const handleResolve = async (index: number) => {
    try {
      await resolveAlert.mutateAsync(BigInt(index));
      toast.success("Alert resolved");
    } catch {
      toast.error("Failed to resolve alert");
    }
  };

  const handleSimulateAlert = async () => {
    const coords = [
      { lat: 17.385, lng: 78.4867 },
      { lat: 17.391, lng: 78.493 },
      { lat: 17.378, lng: 78.48 },
    ];
    const coord = coords[Math.floor(Math.random() * coords.length)];
    const newAlert: Alert = {
      latitude: coord.lat,
      longitude: coord.lng,
      description: "Suspicious movement detected in unusual location",
      resolved: false,
      timestamp: BigInt(Math.floor(Date.now() * 1_000_000)),
    };
    try {
      await addAlert.mutateAsync(newAlert);
      toast.warning("⚠️ Test alert triggered");
    } catch {
      toast.error("Failed to create alert");
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <header className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Alerts
            </h1>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Suspicious movement detections
            </p>
          </div>
          <Button
            data-ocid="alerts.simulate.button"
            size="sm"
            variant="outline"
            onClick={handleSimulateAlert}
            disabled={addAlert.isPending}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 font-body text-xs"
          >
            {addAlert.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Plus className="w-3 h-3 mr-1" />
            )}
            Simulate Alert
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 pb-4">
        {isLoading ? (
          <div data-ocid="alerts.loading_state" className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card-surface p-4 space-y-2">
                <div className="h-4 w-2/3 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-muted/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="alerts.empty_state"
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
              <Bell className="w-8 h-8 text-success/60" />
            </div>
            <p className="text-foreground font-display font-semibold">
              All Clear
            </p>
            <p className="text-muted-foreground font-body text-sm text-center">
              No suspicious movement detected
            </p>
          </div>
        ) : (
          <ScrollArea>
            <AnimatePresence>
              <div className="space-y-3 pb-4">
                {sorted.map((alert, index) => {
                  const origIndex = alerts?.indexOf(alert) ?? index;
                  const ocidN = index < 2 ? index + 1 : index + 1;
                  return (
                    <motion.div
                      key={`${Number(alert.timestamp)}-${index}`}
                      data-ocid={`alerts.item.${ocidN}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`card-surface overflow-hidden transition-all ${
                        alert.resolved
                          ? "opacity-60 border-border"
                          : "border-destructive/30 glow-red"
                      }`}
                    >
                      {/* Alert header bar */}
                      <div
                        className={`px-4 py-2.5 flex items-center justify-between ${
                          alert.resolved ? "bg-muted/20" : "bg-destructive/15"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={`w-4 h-4 ${
                              alert.resolved
                                ? "text-muted-foreground"
                                : "text-destructive animate-pulse-red"
                            }`}
                          />
                          <span
                            className={`text-xs font-display font-bold tracking-wide ${
                              alert.resolved
                                ? "text-muted-foreground"
                                : "text-destructive"
                            }`}
                          >
                            {alert.resolved
                              ? "RESOLVED"
                              : "SUSPICIOUS MOVEMENT DETECTED"}
                          </span>
                        </div>
                        {alert.resolved ? (
                          <Badge className="bg-success/20 text-success border-success/30 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                        )}
                      </div>

                      {/* Alert body */}
                      <div className="p-4 space-y-3">
                        <p className="text-sm font-body text-muted-foreground">
                          {alert.description}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-body">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="text-foreground font-medium">
                            {formatAlertTime(alert.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-body">
                          <span className="text-muted-foreground">
                            Location:
                          </span>
                          <a
                            href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                          >
                            {alert.latitude.toFixed(4)},{" "}
                            {alert.longitude.toFixed(4)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {!alert.resolved && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-body text-xs h-8"
                              onClick={() => onTriggerAlarm(alert)}
                            >
                              Trigger Alarm
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-success/20 hover:bg-success/30 border border-success/30 text-success font-body text-xs h-8"
                              onClick={() => handleResolve(origIndex)}
                              disabled={resolveAlert.isPending}
                            >
                              {resolveAlert.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
