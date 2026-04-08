import { Bell, Clock, Map as MapIcon, Satellite, Settings } from "lucide-react";
import type { Tab } from "../App";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unresolvedAlerts: number;
}

const tabs: {
  id: Tab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: Satellite },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "history", label: "History", icon: Clock },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BottomNav({
  activeTab,
  onTabChange,
  unresolvedAlerts,
}: Props) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{
        background: "oklch(0.10 0.018 240 / 0.96)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid oklch(0.20 0.025 240)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === "alerts" && unresolvedAlerts > 0;

          return (
            <button
              key={tab.id}
              type="button"
              data-ocid={`nav.${tab.id}.tab`}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-[18px] h-[18px] transition-transform duration-200 ${
                    isActive ? "scale-110" : "scale-100"
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse-red">
                    {unresolvedAlerts > 9 ? "9+" : unresolvedAlerts}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-mono leading-none ${
                  isActive ? "text-primary" : ""
                }`}
              >
                {tab.label.toUpperCase()}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.18 195)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
