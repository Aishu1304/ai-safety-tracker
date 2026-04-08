import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Satellite,
  Save,
  Shield,
  WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGeoLinker } from "../hooks/useGeoLinker";
import { useGeoLinkerConfig } from "../hooks/useGeoLinkerConfig";
import {
  useSaveProfile,
  useSaveSettings,
  useSettings,
  useUserProfile,
} from "../hooks/useQueries";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
      {children}
    </h2>
  );
}

export default function SettingsPage() {
  const { data: settings } = useSettings();
  const { data: profile } = useUserProfile();
  const saveSettings = useSaveSettings();
  const saveProfile = useSaveProfile();

  // GeoLinker
  const { apiKey, deviceId, setApiKey, setDeviceId, isConfigured } =
    useGeoLinkerConfig();
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [deviceIdInput, setDeviceIdInput] = useState(deviceId);
  const [showApiKey, setShowApiKey] = useState(false);
  const {
    fetchLatestLocation,
    isFetching: geoFetching,
    error: geoError,
    latestData,
  } = useGeoLinker();
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );

  // Existing settings
  const [radius, setRadius] = useState("500");
  const [alertHour, setAlertHour] = useState("22");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [alarmSound, setAlarmSound] = useState(true);
  const [centerLat, setCenterLat] = useState("17.3850");
  const [centerLng, setCenterLng] = useState("78.4867");

  useEffect(() => {
    if (settings) {
      setRadius(String(Number(settings.safeZoneRadius)));
      setAlertHour(String(Number(settings.alertStartHour)));
      setAlarmSound(settings.alarmSoundEnabled);
      setCenterLat(String(settings.safeZoneCenterLat));
      setCenterLng(String(settings.safeZoneCenterLng));
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setEmergencyContact(profile.emergencyContact);
    }
  }, [profile]);

  const handleSaveGeoLinker = () => {
    setApiKey(apiKeyInput.trim());
    setDeviceId(deviceIdInput.trim());
    toast.success("GeoLinker credentials saved");
  };

  const handleTestConnection = async () => {
    setApiKey(apiKeyInput.trim());
    setDeviceId(deviceIdInput.trim());
    setTestResult(null);
    const data = await fetchLatestLocation();
    if (data) {
      setTestResult("success");
      toast.success(`Connected! Lat: ${data.latitude}, Lng: ${data.longitude}`);
    } else {
      setTestResult("error");
    }
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        saveSettings.mutateAsync({
          safeZoneRadius: BigInt(Number(radius) || 500),
          alertStartHour: BigInt(Number(alertHour) || 22),
          alarmSoundEnabled: alarmSound,
          safeZoneCenterLat: Number(centerLat) || 17.385,
          safeZoneCenterLng: Number(centerLng) || 78.4867,
        }),
        saveProfile.mutateAsync({
          username: profile?.username ?? "",
          email: profile?.email ?? "",
          emergencyContact,
        }),
      ]);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const isSaving = saveSettings.isPending || saveProfile.isPending;

  return (
    <div className="flex flex-col min-h-full bg-background">
      <header className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(0.72 0.18 195 / 0.1)",
              border: "1px solid oklch(0.72 0.18 195 / 0.25)",
            }}
          >
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Settings
            </h1>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              GeoTracker · ESP32-S3 Config
            </p>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 px-4 pb-6 space-y-4"
      >
        {/* ── Hardware Connection ── */}
        <div
          className="rounded-xl p-4 space-y-4"
          style={{
            background: "oklch(0.72 0.18 195 / 0.04)",
            border: "1px solid oklch(0.72 0.18 195 / 0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-primary" />
            <SectionTitle>Hardware Connection</SectionTitle>
          </div>

          <p className="text-xs font-body text-muted-foreground">
            Enter your GeoLinker API key and device ID from{" "}
            <a
              href="https://circuitdigest.cloud"
              target="_blank"
              rel="noreferrer"
              className="text-primary/80 hover:text-primary"
            >
              circuitdigest.cloud
            </a>
            . Your ESP32 automatically sends GPS data there every 15 seconds.
          </p>

          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground">
              GEOLINKER API KEY
            </Label>
            <div className="relative">
              <Input
                data-ocid="settings.input"
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="gl_xxxxxxxxxxxxxxxx"
                className="bg-input border-border font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground">
              DEVICE ID
            </Label>
            <Input
              type="text"
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              placeholder="ESP32_TRACKER_01"
              className="bg-input border-border font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              data-ocid="settings.secondary_button"
              onClick={handleSaveGeoLinker}
              variant="outline"
              size="sm"
              className="flex-1 font-mono text-xs border-primary/30 text-primary hover:bg-primary/10 h-9"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
            <Button
              data-ocid="settings.primary_button"
              onClick={handleTestConnection}
              disabled={
                geoFetching || !apiKeyInput.trim() || !deviceIdInput.trim()
              }
              variant="outline"
              size="sm"
              className="flex-1 font-mono text-xs border-primary/30 text-primary hover:bg-primary/10 h-9"
            >
              {geoFetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : testResult === "success" ? (
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
              ) : testResult === "error" ? (
                <WifiOff className="w-3.5 h-3.5 mr-1.5 text-destructive" />
              ) : (
                <Satellite className="w-3.5 h-3.5 mr-1.5" />
              )}
              Test Connection
            </Button>
          </div>

          {geoError && (
            <p
              data-ocid="settings.error_state"
              className="text-xs font-body text-destructive"
            >
              {geoError}
            </p>
          )}
          {testResult === "success" && latestData && (
            <p
              data-ocid="settings.success_state"
              className="text-xs font-mono text-success"
            >
              ✓ Connected · {latestData.latitude.toFixed(5)},{" "}
              {latestData.longitude.toFixed(5)}
            </p>
          )}
          {isConfigured && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-[10px] font-mono text-success">
                Hardware connected
              </span>
            </div>
          )}
        </div>

        {/* ── Safe Zone ── */}
        <div className="card-surface p-4 space-y-4">
          <SectionTitle>Safe Zone</SectionTitle>

          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground">
              RADIUS (METERS)
            </Label>
            <Input
              data-ocid="settings.radius.input"
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="500"
              min="50"
              max="5000"
              className="bg-input border-border font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-mono text-muted-foreground">
                LATITUDE
              </Label>
              <Input
                type="number"
                value={centerLat}
                onChange={(e) => setCenterLat(e.target.value)}
                step="0.0001"
                className="bg-input border-border font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono text-muted-foreground">
                LONGITUDE
              </Label>
              <Input
                type="number"
                value={centerLng}
                onChange={(e) => setCenterLng(e.target.value)}
                step="0.0001"
                className="bg-input border-border font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* ── Alert Settings ── */}
        <div className="card-surface p-4 space-y-4">
          <SectionTitle>Alert Settings</SectionTitle>

          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground">
              ALERT START HOUR
            </Label>
            <Select value={alertHour} onValueChange={setAlertHour}>
              <SelectTrigger
                data-ocid="settings.hour.select"
                className="bg-input border-border font-mono text-sm"
              >
                <SelectValue placeholder="Select hour">
                  {formatHour(Number(alertHour))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {HOURS.map((h) => (
                  <SelectItem
                    key={`hour-${h}`}
                    value={String(h)}
                    className="font-mono text-sm"
                  >
                    {formatHour(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body text-foreground">Alarm Sound</p>
              <p className="text-xs text-muted-foreground font-body">
                Play loud alarm on breach
              </p>
            </div>
            <Switch
              data-ocid="settings.alarm.switch"
              checked={alarmSound}
              onCheckedChange={setAlarmSound}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* ── Emergency Contact ── */}
        <div className="card-surface p-4 space-y-4">
          <SectionTitle>Emergency Contact</SectionTitle>
          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground">
              PHONE NUMBER
            </Label>
            <Input
              data-ocid="settings.contact.input"
              type="tel"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="+91 98765 43210"
              className="bg-input border-border font-mono"
            />
          </div>
        </div>

        <Button
          data-ocid="settings.save.button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 bg-primary text-primary-foreground font-mono font-semibold text-sm rounded-xl glow-cyan hover:opacity-90 transition-opacity"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {isSaving ? "SAVING..." : "SAVE SETTINGS"}
        </Button>

        <footer className="text-center pt-2 text-xs text-muted-foreground/40 font-body">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary/50 hover:text-primary/80 transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </footer>
      </motion.div>
    </div>
  );
}
