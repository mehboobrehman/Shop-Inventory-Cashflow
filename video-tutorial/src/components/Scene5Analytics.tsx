import React from "react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export const Scene5Analytics: React.FC = () => {
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

  // KPI cards entrance stagger
  const kpi1Progress = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const kpi2Progress = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const kpi3Progress = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Bar chart growth animation (frames 45 - 90)
  const barGrowth = interpolate(frame, [45, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Exit transition
  const exitOpacity = interpolate(frame, [135, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chartData = [
    { day: "Mon", val: 45, amount: "$4.5k" },
    { day: "Tue", val: 62, amount: "$6.2k" },
    { day: "Wed", val: 58, amount: "$5.8k" },
    { day: "Thu", val: 78, amount: "$7.8k" },
    { day: "Fri", val: 92, amount: "$9.2k" },
    { day: "Sat", val: 100, amount: "$12.5k" },
    { day: "Sun", val: 85, amount: "$10.1k" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "100px 100px 40px 100px",
        opacity: sceneOpacity * exitOpacity,
        scale: sceneScale,
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#f8fafc",
            margin: "0 0 12px 0",
          }}
        >
          Real-Time Analytics & Revenue Trends
        </h2>
        <p style={{ fontSize: "24px", color: "#94a3b8", margin: 0 }}>
          Executive metrics, weekly sales distribution, and automated performance tracking
        </p>
      </div>

      {/* Main Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          width: "100%",
          maxWidth: "1600px",
        }}
      >
        {/* KPI Cards Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          {/* Card 1: Total Revenue */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "20px",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 15px 30px rgba(0, 0, 0, 0.3)",
              opacity: kpi1Progress,
              scale: kpi1Progress,
            }}
          >
            <div>
              <span style={{ color: "#94a3b8", fontSize: "16px", fontWeight: 600 }}>Total Revenue</span>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#f8fafc", margin: "6px 0" }}>
                $45,280.00
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "14px", fontWeight: 700 }}>
                <ArrowUpRight size={16} />
                <span>+18.4% vs last week</span>
              </div>
            </div>
            <div
              style={{
                padding: "16px",
                borderRadius: "16px",
                backgroundColor: "rgba(99, 102, 241, 0.2)",
              }}
            >
              <DollarSign size={36} color="#818cf8" />
            </div>
          </div>

          {/* Card 2: Sales Transactions */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              borderRadius: "20px",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 15px 30px rgba(0, 0, 0, 0.3)",
              opacity: kpi2Progress,
              scale: kpi2Progress,
            }}
          >
            <div>
              <span style={{ color: "#94a3b8", fontSize: "16px", fontWeight: 600 }}>Total Transactions</span>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#f8fafc", margin: "6px 0" }}>
                1,420 Orders
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "14px", fontWeight: 700 }}>
                <ArrowUpRight size={16} />
                <span>+12.5% volume</span>
              </div>
            </div>
            <div
              style={{
                padding: "16px",
                borderRadius: "16px",
                backgroundColor: "rgba(139, 92, 246, 0.2)",
              }}
            >
              <ShoppingBag size={36} color="#c084fc" />
            </div>
          </div>

          {/* Card 3: Catalog Health */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "20px",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 15px 30px rgba(0, 0, 0, 0.3)",
              opacity: kpi3Progress,
              scale: kpi3Progress,
            }}
          >
            <div>
              <span style={{ color: "#94a3b8", fontSize: "16px", fontWeight: 600 }}>Active Catalog SKUs</span>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#f8fafc", margin: "6px 0" }}>
                850 Items
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#34d399", fontSize: "14px", fontWeight: 700 }}>
                <span>98.2% Optimal Stock Level</span>
              </div>
            </div>
            <div
              style={{
                padding: "16px",
                borderRadius: "16px",
                backgroundColor: "rgba(16, 185, 129, 0.2)",
              }}
            >
              <Layers size={36} color="#34d399" />
            </div>
          </div>
        </div>

        {/* Interactive Revenue Chart Area */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <TrendingUp size={28} color="#6366f1" />
              <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                Weekly Sales Revenue ($USD)
              </h3>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <span
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  color: "#a5b4fc",
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                7-Day Overview
              </span>
            </div>
          </div>

          {/* Bar Chart Graphics */}
          <div
            style={{
              height: "220px",
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "24px",
              alignItems: "flex-end",
              paddingTop: "20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "16px",
            }}
          >
            {chartData.map((item, index) => {
              const currentHeight = item.val * barGrowth;
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <span
                    style={{
                      color: "#38bdf8",
                      fontWeight: 700,
                      fontSize: "14px",
                      opacity: barGrowth,
                    }}
                  >
                    {item.amount}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "64px",
                      height: `${currentHeight}%`,
                      background: "linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)",
                      borderRadius: "12px 12px 4px 4px",
                      boxShadow: "0 10px 20px rgba(99, 102, 241, 0.3)",
                    }}
                  />
                  <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: "16px" }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
