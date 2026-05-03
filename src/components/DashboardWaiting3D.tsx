import { Link } from "@tanstack/react-router";

type Props = {
  /** Large banner vs small chart placeholder */
  variant: "hero" | "compact";
  /** API unreachable vs empty pipeline */
  reason: "api" | "empty";
};

/**
 * CSS 3D scene (no Three.js): neon wireframe cube + orbit + core.
 * Respects prefers-reduced-motion in global CSS.
 */
export function DashboardWaiting3D({ variant, reason }: Props) {
  const isHero = variant === "hero";
  const title = reason === "api" ? "UBID API offline" : "Waiting for data";
  const desc = !isHero
    ? "No pairs in queue — upload or refresh."
    : reason === "api"
      ? "Start uvicorn on port 8000, then refresh. CORS must allow this origin."
      : "Upload two department CSVs to run the resolution pipeline. This cube keeps spinning until records arrive.";

  return (
    <div
      className={`glass-card relative overflow-hidden border-primary/20 ${isHero ? "min-h-[300px] p-8 md:p-10" : "min-h-[200px] p-6"}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,oklch(0.72_0.2_50/0.12),transparent_55%)]" />
      <div className={`relative z-10 flex flex-col items-center gap-6 ${isHero ? "md:flex-row md:items-center md:justify-between md:gap-10" : ""}`}>
        <div
          className={`ubid-wait-stage flex shrink-0 items-center justify-center ${isHero ? "h-[220px] w-[220px]" : "ubid-wait-stage--compact h-[140px] w-full max-w-[200px]"}`}
        >
          <div className="ubid-wait-orbit" />
          <div className="ubid-wait-pivot">
            <div className="ubid-wait-cube">
              <div className="ubid-wait-face ubid-wait-face--front" />
              <div className="ubid-wait-face ubid-wait-face--back" />
              <div className="ubid-wait-face ubid-wait-face--right" />
              <div className="ubid-wait-face ubid-wait-face--left" />
              <div className="ubid-wait-face ubid-wait-face--top" />
              <div className="ubid-wait-face ubid-wait-face--bottom" />
            </div>
          </div>
          <div className="ubid-wait-core" />
        </div>

        <div className={`max-w-lg text-center ${isHero ? "md:text-left" : ""}`}>
          <h2 className={`font-bold tracking-tight text-glow-orange ${isHero ? "text-2xl md:text-3xl" : "text-lg"}`}>{title}</h2>
          <p className={`mt-2 text-muted-foreground ${isHero ? "text-sm md:text-base" : "text-xs"}`}>{desc}</p>
          {isHero && reason === "empty" && (
            <Link
              to="/upload"
              className="mt-5 inline-flex rounded-md bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background shadow-glow-orange transition hover:opacity-90"
            >
              Upload CSVs
            </Link>
          )}
          {isHero && reason === "api" && (
            <p className="mt-4 font-mono text-xs text-muted-foreground">uvicorn main:app --reload --port 8000</p>
          )}
        </div>
      </div>
    </div>
  );
}
