import React from "react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import { Store, ShieldCheck, BarChart3, Zap, PackageCheck } from "lucide-react";

export const Scene1Hero: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance animations (0 - 45 frames)
  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const titleScale = interpolate(frame, [5, 45], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const subtitleOpacity = interpolate(frame, [25, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleTranslateY = interpolate(frame, [25, 55], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Feature pills stagger animation
  const pill1Progress = interpolate(frame, [45, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const pill2Progress = interpolate(frame, [55, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const pill3Progress = interpolate(frame, [65, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const pill4Progress = interpolate(frame, [75, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Exit transition out (135 - 150)
  const exitOpacity = interpolate(frame, [135, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 120px",
        opacity: exitOpacity,
      }}
    >
      {/* Central Hero Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          opacity: titleOpacity,
          scale: titleScale,
        }}
      >
        {/* Animated Badge Icon */}
        <div
          style={{
            position: "relative",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-12px",
              borderRadius: "32px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #10b981)",
              filter: "blur(20px)",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "relative",
              width: "100px",
              height: "100px",
              borderRadius: "28px",
              background: "linear-gradient(135deg, #1e1b4b, #312e81)",
              border: "2px solid rgba(165, 180, 252, 0.4)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            <Store size={52} color="#a5b4fc" />
          </div>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: "76px",
            fontWeight: 900,
            lineHeight: 1.1,
            margin: "0 0 16px 0",
            letterSpacing: "-1px",
            background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
          }}
        >
          Shop Inventory & Cashflow
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "32px",
            fontWeight: 500,
            color: "#94a3b8",
            maxWidth: "960px",
            margin: "0 0 48px 0",
            lineHeight: 1.4,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleTranslateY}px)`,
          }}
        >
          An Enterprise-Grade Retail Platform for Inventory Control, Real-Time POS, & Cashflow Ledgers
        </p>

        {/* Dynamic Feature Pills Grid */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Pill 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              backdropFilter: "blur(10px)",
              padding: "14px 28px",
              borderRadius: "9999px",
              color: "#f8fafc",
              fontSize: "20px",
              fontWeight: 600,
              opacity: pill1Progress,
              scale: pill1Progress,
              boxShadow: "0 10px 20px rgba(99, 102, 241, 0.15)",
            }}
          >
            <Zap size={24} color="#6366f1" />
            <span>Barcode & POS Engine</span>
          </div>

          {/* Pill 2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              backdropFilter: "blur(10px)",
              padding: "14px 28px",
              borderRadius: "9999px",
              color: "#f8fafc",
              fontSize: "20px",
              fontWeight: 600,
              opacity: pill2Progress,
              scale: pill2Progress,
              boxShadow: "0 10px 20px rgba(139, 92, 246, 0.15)",
            }}
          >
            <ShieldCheck size={24} color="#8b5cf6" />
            <span>AES-256 Account Security</span>
          </div>

          {/* Pill 3 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              backdropFilter: "blur(10px)",
              padding: "14px 28px",
              borderRadius: "9999px",
              color: "#f8fafc",
              fontSize: "20px",
              fontWeight: 600,
              opacity: pill3Progress,
              scale: pill3Progress,
              boxShadow: "0 10px 20px rgba(16, 185, 129, 0.15)",
            }}
          >
            <BarChart3 size={24} color="#10b981" />
            <span>Real-Time Analytics</span>
          </div>

          {/* Pill 4 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              backdropFilter: "blur(10px)",
              padding: "14px 28px",
              borderRadius: "9999px",
              color: "#f8fafc",
              fontSize: "20px",
              fontWeight: 600,
              opacity: pill4Progress,
              scale: pill4Progress,
              boxShadow: "0 10px 20px rgba(56, 189, 248, 0.15)",
            }}
          >
            <PackageCheck size={24} color="#38bdf8" />
            <span>Standalone Portable</span>
          </div>
        </div>
      </div>
    </div>
  );
};
