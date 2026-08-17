import React from "react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import {
  ShoppingCart,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle2,
  Tag,
  Sparkles,
  Printer,
} from "lucide-react";

export const Scene3POS: React.FC = () => {
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

  // Cart item entrance timing
  const item1Progress = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const item2Progress = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const item3Progress = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Discount Applied Animation (frame 60)
  const discountProgress = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Payment Processing (frame 85 - 110)
  const isPaid = frame >= 100;
  const receiptProgress = interpolate(frame, [100, 125], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
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
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#f8fafc",
            margin: "0 0 12px 0",
          }}
        >
          High-Speed POS & Checkout Engine
        </h2>
        <p style={{ fontSize: "24px", color: "#94a3b8", margin: 0 }}>
          Real-time item subtotals, automatic promo discounts, multi-payment options & instant receipts
        </p>
      </div>

      {/* Main Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "36px",
          width: "100%",
          maxWidth: "1600px",
        }}
      >
        {/* Left Column: Live Cart & Calculation Breakdown */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "24px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Cart Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShoppingCart size={28} color="#8b5cf6" />
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#f8fafc",
                  margin: 0,
                }}
              >
                Active Order Cart
              </h3>
            </div>
            <span
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                color: "#c084fc",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              Order #ORD-2026-9841
            </span>
          </div>

          {/* Cart Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
            {/* Item 1 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(30, 41, 59, 0.6)",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                opacity: item1Progress,
                transform: `translateX(${interpolate(item1Progress, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div>
                <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "18px" }}>
                  Premium Dark Roast Coffee 500g
                </span>
                <span style={{ color: "#94a3b8", fontSize: "14px", display: "block" }}>
                  1 x $12.99
                </span>
              </div>
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "20px" }}>$12.99</span>
            </div>

            {/* Item 2 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(30, 41, 59, 0.6)",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                opacity: item2Progress,
                transform: `translateX(${interpolate(item2Progress, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div>
                <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "18px" }}>
                  Raw Organic Honey Jar
                </span>
                <span style={{ color: "#94a3b8", fontSize: "14px", display: "block" }}>
                  1 x $8.50
                </span>
              </div>
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "20px" }}>$8.50</span>
            </div>

            {/* Item 3 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(30, 41, 59, 0.6)",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                opacity: item3Progress,
                transform: `translateX(${interpolate(item3Progress, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div>
                <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "18px" }}>
                  Artisan Sourdough Loaf
                </span>
                <span style={{ color: "#94a3b8", fontSize: "14px", display: "block" }}>
                  1 x $4.20
                </span>
              </div>
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "20px" }}>$4.20</span>
            </div>
          </div>

          {/* Subtotal & Discount Calculation Card */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "16px" }}>
              <span>Subtotal:</span>
              <span style={{ color: "#f8fafc", fontWeight: 600 }}>$25.69</span>
            </div>

            {/* Discount Badge Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#10b981",
                fontSize: "16px",
                opacity: discountProgress,
                transform: `scale(${discountProgress})`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Tag size={16} />
                <span style={{ fontWeight: 600 }}>Promo Discount (10% OFF):</span>
              </div>
              <span style={{ fontWeight: 700 }}>-$2.57</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "16px" }}>
              <span>Tax (5%):</span>
              <span style={{ color: "#f8fafc", fontWeight: 600 }}>+$1.16</span>
            </div>

            <div
              style={{
                height: "1px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                margin: "4px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc" }}>
                Total Payable:
              </span>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#10b981",
                  textShadow: "0 0 16px rgba(16, 185, 129, 0.4)",
                }}
              >
                $24.28
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Selector & Live Receipt Preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Payment Method Selector Card */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            <h4
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#f8fafc",
                margin: "0 0 20px 0",
              }}
            >
              Select Payment Method
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Card Option (Selected) */}
              <div
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  border: "2px solid #6366f1",
                  borderRadius: "16px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
                }}
              >
                <CreditCard size={32} color="#818cf8" />
                <span style={{ fontWeight: 700, fontSize: "16px" }}>Credit / Card</span>
              </div>

              {/* Cash Option */}
              <div
                style={{
                  backgroundColor: "rgba(30, 41, 59, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  color: "#94a3b8",
                }}
              >
                <Banknote size={32} color="#64748b" />
                <span style={{ fontWeight: 600, fontSize: "16px" }}>Cash Drawer</span>
              </div>
            </div>

            {/* Pay Action Button */}
            <div
              style={{
                marginTop: "20px",
                backgroundColor: isPaid ? "#10b981" : "#6366f1",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "20px",
                boxShadow: isPaid
                  ? "0 10px 25px rgba(16, 185, 129, 0.4)"
                  : "0 10px 25px rgba(99, 102, 241, 0.4)",
              }}
            >
              {isPaid ? (
                <>
                  <CheckCircle2 size={24} />
                  <span>Payment Approved!</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>Complete Checkout ($24.28)</span>
                </>
              )}
            </div>
          </div>

          {/* Generated Digital Receipt Preview */}
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
              opacity: receiptProgress,
              transform: `scale(${receiptProgress}) translateY(${interpolate(
                receiptProgress,
                [0, 1],
                [20, 0]
              )}px)`,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontFamily: "monospace",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Receipt size={22} color="#0f172a" />
                <span style={{ fontWeight: 800, fontSize: "16px" }}>DIGITAL RECEIPT</span>
              </div>
              <Printer size={18} color="#64748b" />
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Date: 2026-08-12 | Auth: #APPROVED-984</div>
            <div style={{ borderBottom: "1px dashed #cbd5e1", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span>Items (3)</span>
              <span>$25.69</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#059669" }}>
              <span>Discount</span>
              <span>-$2.57</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800 }}>
              <span>TOTAL PAID</span>
              <span>$24.28</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
