import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Alert } from "../backend.d";

interface Props {
  alert: Alert;
  onClose: () => void;
}

function formatAlarmTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  });
}

export default function EmergencyAlarm({ alert, onClose }: Props) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stopAlarmRef = useRef<() => void>(() => {});

  useEffect(() => {
    const stopAlarm = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
    stopAlarmRef.current = stopAlarm;

    const playBeep = (ctx: AudioContext) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    };

    try {
      const CtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new CtxClass();
      audioCtxRef.current = ctx;
      playBeep(ctx);
      intervalRef.current = window.setInterval(() => {
        if (audioCtxRef.current) playBeep(audioCtxRef.current);
      }, 800);
    } catch {
      // Audio not supported
    }
    return () => stopAlarm();
  }, []);

  const handleStop = () => {
    stopAlarmRef.current();
    onClose();
  };

  const mapsUrl = `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`;

  return (
    <AnimatePresence>
      <motion.div
        data-ocid="alarm.modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-alarm-pulse"
        style={{
          maxWidth: "430px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-6 py-10 text-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
            className="w-24 h-24 rounded-full border-4 border-white/40 flex items-center justify-center mb-6"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <AlertTriangle className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h1
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.7, repeat: Number.POSITIVE_INFINITY }}
            className="text-2xl font-display font-black text-white tracking-widest uppercase mb-2"
          >
            ⚠ SUSPICIOUS MOVEMENT
          </motion.h1>
          <motion.p
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{
              duration: 0.7,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0.35,
            }}
            className="text-lg font-display font-bold text-white/90 tracking-wide uppercase mb-6"
          >
            DETECTED
          </motion.p>

          <div
            className="w-full rounded-2xl p-4 mb-8 text-left space-y-2"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/60 font-body">Time:</span>
              <span className="text-white font-body font-medium">
                {formatAlarmTime(alert.timestamp)}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-white/60 font-body shrink-0">
                Location:
              </span>
              <span className="text-white font-mono font-medium">
                {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
              </span>
            </div>
            {alert.description && (
              <div className="text-sm text-white/80 font-body">
                {alert.description}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button
                data-ocid="alarm.open_map.button"
                className="w-full h-12 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-display font-bold text-base rounded-xl transition-all"
                variant="outline"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Open Map
              </Button>
            </a>
            <Button
              data-ocid="alarm.stop.button"
              onClick={handleStop}
              className="w-full h-12 bg-white text-destructive font-display font-black text-base rounded-xl hover:bg-white/90 transition-all"
            >
              <VolumeX className="w-5 h-5 mr-2" />
              STOP ALARM
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
