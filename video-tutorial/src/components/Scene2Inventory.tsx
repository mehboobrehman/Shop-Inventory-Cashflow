import React from "react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import {
  Barcode,
  Package,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

export const Scene2Inventory: React.FC = () => {
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

  // Barcode Laser scan line moving back and forth (frames 15 - 60)
  const laserY = interpolate(frame % 60, [0, 30, 60], [10, 90, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Alert entrance (frame 40)
  const alertProgress = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Restock action trigger (frame 80 - 110)
  const isRestocked = frame > 85;
  const stockNumber = Math.floor(
    interpolate(frame, [85, 110], [3, 50], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    })
  );

  const restockBadgeOpacity = interpolate(frame, [85, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit transition
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
        padding: "100px 100px 40px 100px",
        opacity: sceneOpacity * exitOpacity,
        scale: sceneScale,
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h2
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#f8fafc",
            margin: "0 0 12px 0",
          }}
        >
          Smart Inventory & Barcode Scanning
        </h2>
        <p style={{ fontSize: "24px", color: "#94a3b8", margin: 0 }}>
          Real-time barcode parsing, low-stock threshold triggers, and instant batch restocking
        </p>
      </div>

      {/* Main Grid: Barcode Scanner Left, Product Table Right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: "32px",
          width: "100%",
          maxWidth: "1600px",
        }}
      >
        {/* Left Card: Barcode Scanner UI */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "24px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
              alignSelf: "flex-start",
            }}
          >
            <Barcode size={32} color="#6366f1" />
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#f8fafc",
                margin: 0,
              }}
            >
              Barcode Terminal
            </h3>
          </div>

          {/* Scanner Window with Laser */}
          <div
            style={{
              width: "100%",
              height: "180px",
              backgroundColor: "rgba(30, 41, 59, 0.6)",
              borderRadius: "16px",
              border: "2px dashed rgba(99, 102, 241, 0.5)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
              marginBottom: "24px",
            }}
          >
            <Barcode size={100} color="#cbd5e1" />
            {/* Animated Laser Line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${laserY}%`,
                height: "3px",
                backgroundColor: "#ef4444",
                boxShadow: "0 0 12px #ef4444, 0 0 4px #ef4444",
              }}
            />
          </div>

          <div
            style={{
              width: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "16px" }}>Scanned SKU:</span>
            <span
              style={{
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "18px",
                fontFamily: "monospace",
              }}
            >
              890123456789
            </span>
          </div>
        </div>

        {/* Right Card: Product Catalog Table & Threshold Alert */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Table Header Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={28} color="#8b5cf6" />
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#f8fafc",
                  margin: 0,
                }}
              >
                Catalog & Stock Thresholds
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94a3b8",
                fontSize: "15px",
              }}
            >
              <Search size={16} />
              <span>Search SKU or Name...</span>
            </div>
          </div>

          {/* Product Items Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr",
                padding: "10px 16px",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <span>Product</span>
              <span>SKU</span>
              <span>Price</span>
              <span>Stock Level</span>
              <span>Status</span>
            </div>

            {/* Item 1: Jasmine Rice (Low Stock -> Restocked) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr",
                alignItems: "center",
                padding: "16px",
                backgroundColor: isRestocked
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.12)",
                border: isRestocked
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#f8fafc",
                    fontWeight: 700,
                    fontSize: "18px",
                    display: "block",
                  }}
                >
                  Jasmine Rice 5kg
                </span>
                <span style={{ color: "#94a3b8", fontSize: "14px" }}>
                  Min Threshold: 10 units
                </span>
              </div>
              <span
                style={{
                  color: "#cbd5e1",
                  fontFamily: "monospace",
                  fontSize: "16px",
                }}
              >
                SKU-890123
              </span>
              <span
                style={{
                  color: "#f8fafc",
                  fontWeight: 700,
                  fontSize: "18px",
                }}
              >
                $18.50
              </span>

              {/* Live Animated Stock Level Counter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: isRestocked ? "#10b981" : "#ef4444",
                  }}
                >
                  {stockNumber} units
                </span>
              </div>

              {/* Status Pill */}
              <div>
                {isRestocked ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid #10b981",
                      padding: "6px 12px",
                      borderRadius: "9999px",
                      color: "#34d399",
                      fontSize: "14px",
                      fontWeight: 700,
                      opacity: restockBadgeOpacity,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>In Stock</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid #ef4444",
                      padding: "6px 12px",
                      borderRadius: "9999px",
                      color: "#f87171",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>Low Stock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Item 2: Organic Olive Oil */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr",
                alignItems: "center",
                padding: "16px",
                backgroundColor: "rgba(30, 41, 59, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#f8fafc",
                    fontWeight: 600,
                    fontSize: "18px",
                    display: "block",
                  }}
                >
                  Organic Olive Oil 1L
                </span>
                <span style={{ color: "#64748b", fontSize: "14px" }}>
                  Min Threshold: 5 units
                </span>
              </div>
              <span
                style={{
                  color: "#94a3b8",
                  fontFamily: "monospace",
                  fontSize: "16px",
                }}
              >
                SKU-772109
              </span>
              <span
                style={{
                  color: "#f8fafc",
                  fontWeight: 700,
                  fontSize: "18px",
                }}
              >
                $14.20
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc" }}>
                34 units
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  color: "#34d399",
                  fontSize: "14px",
                  fontWeight: 600,
                  width: "fit-content",
                }}
              >
                <CheckCircle2 size={16} />
                <span>Normal</span>
              </div>
            </div>
          </div>

          {/* Low-Stock Alert Pop-up Notification */}
          <div
            style={{
              marginTop: "24px",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.5)",
              borderRadius: "14px",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: alertProgress,
              transform: `translateY(${interpolate(alertProgress, [0, 1], [20, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <AlertTriangle size={28} color="#f59e0b" />
              <div>
                <h4
                  style={{
                    color: "#fbbf24",
                    fontSize: "18px",
                    fontWeight: 700,
                    margin: "0 0 2px 0",
                  }}
                >
                  Automated Threshold Triggered
                </h4>
                <p style={{ color: "#cbd5e1", fontSize: "15px", margin: 0 }}>
                  Jasmine Rice fallen below threshold (3 remaining &lt; 10 min threshold).
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: isRestocked ? "#10b981" : "#6366f1",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
              }}
            >
              {isRestocked ? (
                <>
                  <RefreshCw size={18} />
                  <span>+47 Restocked!</span>
                </>
              ) : (
                <>
                  <PlusCircle size={18} />
                  <span>Click to Restock</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
