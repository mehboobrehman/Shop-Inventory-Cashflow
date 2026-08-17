import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SceneHeaderProps {
  currentSceneNumber: number;
  totalScenes: number;
  moduleName: string;
}

export const SceneHeader: React.FC<SceneHeaderProps> = ({
  currentSceneNumber,
  totalScenes,
  moduleName,
}) => {
  const frame = useCurrentFrame();
  const totalFrames = 900; // 30s * 30fps

  const progress = interpolate(frame, [0, totalFrames], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "36px 80px 0 80px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Brand Title Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "9999px",
          padding: "10px 24px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            boxShadow: "0 0 10px #10b981",
          }}
        />
        <span
          style={{
            color: "#f8fafc",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "0.5px",
          }}
        >
          Shop Inventory & Cashflow
        </span>
        <span
          style={{
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          |
        </span>
        <span
          style={{
            color: "#a5b4fc",
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          {moduleName}
        </span>
      </div>

      {/* Scene Indicator & Progress Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "9999px",
            padding: "8px 20px",
            color: "#94a3b8",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          Module <span style={{ color: "#38bdf8" }}>{currentSceneNumber}</span> / {totalScenes}
        </div>

        {/* Global Progress Bar */}
        <div
          style={{
            width: "180px",
            height: "8px",
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            borderRadius: "9999px",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)",
              borderRadius: "9999px",
            }}
          />
        </div>
      </div>
    </div>
  );
};
