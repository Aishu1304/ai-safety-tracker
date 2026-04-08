import { Button } from "@/components/ui/button";
import { Loader2, Satellite } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isLoginError } = useInternetIdentity();

  return (
    <div className="mobile-container bg-background min-h-dvh flex flex-col">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.72 0.18 195 / 0.04) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.72 0.18 195 / 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.72 0.18 195 / 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-12"
        >
          {/* Animated satellite icon */}
          <div className="relative mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center glow-cyan"
              style={{
                background: "oklch(0.72 0.18 195 / 0.12)",
                border: "1px solid oklch(0.72 0.18 195 / 0.35)",
              }}
            >
              <Satellite className="w-10 h-10 text-primary" />
            </div>
            {/* Signal rings */}
            <div
              className="absolute inset-0 rounded-2xl animate-ping"
              style={{
                border: "1px solid oklch(0.72 0.18 195 / 0.2)",
                animationDuration: "2s",
              }}
            />
          </div>

          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            GeoTracker
          </h1>
          <p className="text-sm font-mono text-primary mt-1">
            ESP32-S3 Hardware Tracker
          </p>
          <p className="text-xs text-muted-foreground mt-3 font-body">
            Connect once. Track anywhere.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full max-w-xs space-y-4"
        >
          {/* Device status indicator */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{
              background: "oklch(0.12 0.018 240)",
              border: "1px solid oklch(0.20 0.025 240)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">
                XIAO ESP32-S3
              </span>
            </div>
            <div className="ml-auto text-xs font-mono text-primary">
              NEO-6M GPS
            </div>
          </div>

          <Button
            data-ocid="login.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-12 bg-primary text-primary-foreground font-display font-semibold text-base rounded-xl glow-cyan hover:opacity-90 transition-opacity"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Satellite className="w-5 h-5 mr-2" />
            )}
            {isLoggingIn
              ? "Authenticating..."
              : "Sign In with Internet Identity"}
          </Button>

          {isLoginError && (
            <p
              data-ocid="login.error_state"
              className="text-destructive text-sm text-center font-body"
            >
              Authentication failed. Please try again.
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground font-body">
            Secured with Internet Identity · Decentralized
          </p>
        </motion.div>
      </div>

      <footer className="text-center py-4 text-xs text-muted-foreground/40 font-body relative z-10">
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
    </div>
  );
}
