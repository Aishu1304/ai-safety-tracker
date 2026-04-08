import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import type { Alert } from "./backend.d";
import BottomNav from "./components/BottomNav";
import EmergencyAlarm from "./components/EmergencyAlarm";
import InstallPrompt from "./components/InstallPrompt";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useAlerts } from "./hooks/useQueries";
import AlertsPage from "./pages/AlertsPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import SettingsPage from "./pages/SettingsPage";

export type Tab = "dashboard" | "map" | "history" | "alerts" | "settings";

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [alarmAlert, setAlarmAlert] = useState<Alert | null>(null);
  const { data: alerts } = useAlerts();
  const seenAlertCountRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Detect new unresolved alerts and trigger alarm
  useEffect(() => {
    if (!alerts) return;
    const unresolvedAlerts = alerts.filter((a) => !a.resolved);
    if (!initializedRef.current) {
      initializedRef.current = true;
      seenAlertCountRef.current = unresolvedAlerts.length;
      return;
    }
    if (unresolvedAlerts.length > seenAlertCountRef.current) {
      const newest = unresolvedAlerts[unresolvedAlerts.length - 1];
      setAlarmAlert(newest);
    }
    seenAlertCountRef.current = unresolvedAlerts.length;
  }, [alerts]);

  const unresolvedCount = alerts?.filter((a) => !a.resolved).length ?? 0;

  return (
    <div className="mobile-container bg-background">
      <main className="bottom-safe">
        {activeTab === "dashboard" && (
          <DashboardPage onNavigate={setActiveTab} />
        )}
        {activeTab === "map" && <MapPage />}
        {activeTab === "history" && (
          <HistoryPage onViewRoute={() => setActiveTab("map")} />
        )}
        {activeTab === "alerts" && (
          <AlertsPage onTriggerAlarm={(alert) => setAlarmAlert(alert)} />
        )}
        {activeTab === "settings" && <SettingsPage />}
      </main>
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unresolvedAlerts={unresolvedCount}
      />
      {alarmAlert && (
        <EmergencyAlarm
          alert={alarmAlert}
          onClose={() => setAlarmAlert(null)}
        />
      )}
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const isLoggedIn = !!identity && loginStatus !== "initializing";

  if (isInitializing) {
    return (
      <div className="mobile-container bg-background flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-body">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? <MainApp /> : <LoginPage />}
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.13 0.025 240)",
            border: "1px solid oklch(0.22 0.04 240)",
            color: "oklch(0.94 0.01 240)",
          },
        }}
      />
    </>
  );
}
