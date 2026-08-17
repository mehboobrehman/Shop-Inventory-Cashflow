import React from "react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import {
  Package,
  CheckCircle2,
  Laptop,
  Server,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const Scene6Outro: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance
  const sceneOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sceneScale = interpolate(frame, [0, 25], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Feature checklist entrance stagger
  const check1 = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const check2 = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const check3 = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const check4 = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Call to Action Card animation
  const ctaProgress = interpolate(frame, [65, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Glow pulse for button
  const pulseScale = interpolate(frame % 30, [0, 15, 30], [1, 1.04, 1]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 120px 40px 120px",
        opacity: sceneOpacity,
        scale: sceneScale,
      }}
    >
      {/* Central Outro Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "1100px",
        }}
      >
        {/* Portable Icon Badge */}
        <div style={{ position: "relative", marginBottom: "28px" }}>
          <div
            style={{
              position: "absolute",
              inset: "-14px",
              borderRadius: "32px",
              background: "linear-gradient(135deg, #10b981, #6366f1, #8b5cf6)",
              filter: "blur(24px)",
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: "relative",
              width: "90px",
              height: "90px",
              borderRadius: "26px",
              background: "linear-gradient(135deg, #064e3b, #047857)",
              border: "2px solid rgba(52, 211, 153, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            <Package size={48} color="#a7f3d0" />
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "64px",
            fontWeight: 900,
            lineHeight: 1.1,
            margin: "0 0 16px 0",
            letterSpacing: "-1px",
            background: "linear-gradient(135deg, #ffffff 0%, #a7f3d0 50%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Portable & Production Ready
        </h2>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            color: "#94a3b8",
            margin: "0 0 40px 0",
            lineHeight: 1.4,
          }}
        >
          Zero-configuration deployment. Run locally, across your LAN, or in the cloud.
        </p>

        {/* 2x2 Feature Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            width: "100%",
            marginBottom: "44px",
          }}
        >
          {/* Item 1 */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "18px",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              opacity: check1,
              transform: `translateY(${interpolate(check1, [0, 1], [20, 0])}px)`,
            }}
          >
            <CheckCircle2 size={28} color="#10b981" />
            <div style={{ textAlign: "left" }}>
              <h4 style={{ color: "#f8fafc", fontSize: "18px", fontWeight: 700, margin: "0 0 2px 0" }}>
                Standalone Portable Package
              </h4>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>
                Bundled script `ShopInventory-Portable`
              </span>
            </div>
          </div>

          {/* Item 2 */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "18px",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              opacity: check2,
              transform: `translateY(${interpolate(check2, [0, 1], [20, 0])}px)`,
            }}
          >
            <Server size={28} color="#6366f1" />
            <div style={{ textAlign: "left" }}>
              <h4 style={{ color: "#f8fafc", fontSize: "18px", fontWeight: 700, margin: "0 0 2px 0" }}>
                PM2 Process Manager Integrated
              </h4>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>
                Automatic background restarts & logs
              </span>
            </div>
          </div>

          {/* Item 3 */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "18px",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              opacity: check3,
              transform: `translateY(${interpolate(check3, [0, 1], [20, 0])}px)`,
            }}
          >
            <Laptop size={28} color="#8b5cf6" />
            <div style={{ textAlign: "left" }}>
              <h4 style={{ color: "#f8fafc", fontSize: "18px", fontWeight: 700, margin: "0 0 2px 0" }}>
                LAN & Multi-Device Ready
              </h4>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>
                Access from mobile, tablets & desktop PCs
              </span>
            </div>
          </div>

          {/* Item 4 */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "18px",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              opacity: check4,
              transform: `translateY(${interpolate(check4, [0, 1], [20, 0])}px)`,
            }}
          >
            <ShieldCheck size={28} color="#38bdf8" />
            <div style={{ textAlign: "left" }}>
              <h4 style={{ color: "#f8fafc", fontSize: "18px", fontWeight: 700, margin: "0 0 2px 0" }}>
                Type-Safe Monorepo Architecture
              </h4>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>
                React, Express, Prisma, & PostgreSQL
              </span>
            </div>
          </div>
        </div>

        {/* CTA Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            opacity: ctaProgress,
            scale: ctaProgress,
          }}
        >
          {/* GitHub CTA Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #10b981)",
              padding: "18px 40px",
              borderRadius: "9999px",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "22px",
              boxShadow: "0 15px 35px rgba(99, 102, 241, 0.4)",
              scale: pulseScale,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "#ffffff" }}
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Explore the GitHub Repository</span>
            <ArrowRight size={24} />
          </div>

          <span
            style={{
              color: "#94a3b8",
              fontFamily: "monospace",
              fontSize: "18px",
              letterSpacing: "0.5px",
            }}
          >
            github.com/mehboobrehman/Shop-Inventory-Cashflow
          </span>
        </div>
      </div>
    </div>
  );
};
