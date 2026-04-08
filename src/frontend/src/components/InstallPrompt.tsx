import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(standalone);

    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setDeferredPrompt(null);
  };

  return (
    <>
      <div
        data-ocid="install.toast"
        className="fixed bottom-20 left-4 right-4 z-50 rounded-xl border border-blue-500/30 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl shadow-blue-900/30"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Install AI Safety Tracker
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Add to home screen for a real app experience
            </p>
          </div>
          <button
            type="button"
            data-ocid="install.close_button"
            onClick={() => setDismissed(true)}
            className="text-slate-500 hover:text-slate-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <Button
          data-ocid="install.primary_button"
          onClick={handleInstall}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          size="sm"
        >
          Install App
        </Button>
      </div>

      {showIOSInstructions && (
        <div
          data-ocid="install.dialog"
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-end pb-6 px-4"
        >
          {/* Backdrop close area */}
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 w-full h-full cursor-default"
            onClick={() => setShowIOSInstructions(false)}
          />
          <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <h3 className="text-white font-bold text-lg">Install on iPhone</h3>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </span>
                Tap the <span className="font-semibold text-white">Share</span>{" "}
                button at the bottom of Safari (box with arrow up)
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </span>
                Scroll down and tap{" "}
                <span className="font-semibold text-white">
                  "Add to Home Screen"
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </span>
                Tap <span className="font-semibold text-white">"Add"</span> --
                the icon will appear on your home screen
              </li>
            </ol>
            <Button
              data-ocid="install.confirm_button"
              onClick={() => {
                setShowIOSInstructions(false);
                setDismissed(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
