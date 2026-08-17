import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // Floating ambient glow coordinates
  const glow1X = interpolate(frame, [0, 900], [20, 80]);
  const glow1Y = interpolate(frame, [0, 900], [20, 40]);
  const glow2X = interpolate(frame, [0, 900], [80, 20]);
  const glow2Y = interpolate(frame, [0, 900], [70, 80]);

  // Subtle grid movement
  const gridOffsetY = (frame * 0.5) % 40;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080c14",
        overflow: "hidden",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Animated Radial Light Leaks / Gradients */}
      <div
        style={{
          position: "absolute",
          width: "900px",
          height: "900px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0) 70%)",
          left: `${glow1X}%`,
          top: `${glow1Y}%`,
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 70%)",
          left: `${glow2X}%`,
          top: `${glow2Y}%`,
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)",
          left: "50%",
          bottom: "-10%",
          transform: "translateX(-50%)",
          filter: "blur(70px)",
        }}
      />

      {/* Tech Grid Background Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: `0px ${gridOffsetY}px`,
          opacity: 0.8,
        }}
      />

      {/* Vignette Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(5, 8, 15, 0.85) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
