import { useEffect, useState } from "react";
import logo from "@/assets/logo-trammos.png";

/**
 * One-shot entrance animation shown when the CRM layout mounts.
 * Subtle: brand-gradient veil + logo bloom + light sweep, then fades out.
 */
export function CrmIntro() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="crm-intro-veil pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, oklch(0.98 0.01 215) 0%, oklch(0.96 0.02 215) 45%, oklch(0.93 0.04 215) 100%)",
      }}
    >
      {/* Brand gradient sweep */}
      <div
        className="crm-intro-sweep absolute inset-y-0 w-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.85 0.18 125 / 0.18) 40%, oklch(0.72 0.14 215 / 0.22) 60%, transparent 100%)",
          filter: "blur(20px)",
        }}
      />

      {/* Expanding ring */}
      <div
        className="crm-intro-ring absolute h-40 w-40 rounded-full"
        style={{
          border: "2px solid oklch(0.72 0.14 215 / 0.45)",
        }}
      />

      {/* Logo */}
      <div className="crm-intro-logo relative flex flex-col items-center gap-3">
        <img
          src={logo}
          alt=""
          className="h-20 w-20 rounded-2xl object-contain bg-white p-2 shadow-lg"
          style={{
            boxShadow:
              "0 10px 40px -10px oklch(0.72 0.14 215 / 0.45), 0 0 0 1px oklch(0.72 0.14 215 / 0.15)",
          }}
        />
        <div
          className="text-xs font-medium tracking-[0.25em] uppercase"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.72 0.14 215), oklch(0.85 0.18 125))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          TRAMMOS CRM
        </div>
      </div>
    </div>
  );
}
