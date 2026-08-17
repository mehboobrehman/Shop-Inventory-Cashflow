import React from "react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import {
  Wallet,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  Building2,
  Landmark,
} from "lucide-react";

export const Scene4Cashflow: React.FC = () => {
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

  // Account cards stagger
  const card1Progress = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const card2Progress = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const card3Progress = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Security Lock pulse & AES Encryption Badge entrance (frame 65)
  const securityProgress = interpolate(frame, [65, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Transaction Ledger Log items
  const tx1Progress = interpolate(frame, [85, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tx2Progress = interpolate(frame, [100, 120], [0, 1], {
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
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#f8fafc",
            margin: "0 0 12px 0",
          }}
        >
          Multi-Account Cashflow & AES-256 Security
        </h2>
        <p style={{ fontSize: "24px", color: "#94a3b8", margin: 0 }}>
          Atomic transaction locking, AES-256 encrypted secrets, and real-time account ledger sync
        </p>
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: "36px",
          width: "100%",
          maxWidth: "1600px",
        }}
      >
        {/* Left Side: Multi-Account Ledger Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#cbd5e1",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Wallet size={24} color="#6366f1" />
            <span>Active Financial Accounts</span>
          </h3>

          {/* Account Card 1: Main Operating Bank */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "20px",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
              opacity: card1Progress,
              scale: card1Progress,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Landmark size={30} color="#818cf8" />
              </div>
              <div>
                <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Primary Business Checking
                </h4>
                <span style={{ fontSize: "14px", color: "#94a3b8" }}>Account #9842-ACC-01</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#10b981" }}>$18,320.50</div>
              <span style={{ fontSize: "13px", color: "#34d399", fontWeight: 600 }}>Active Sync</span>
            </div>
          </div>

          {/* Account Card 2: Cash Register Drawer */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              borderRadius: "20px",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
              opacity: card2Progress,
              scale: card2Progress,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Building2 size={30} color="#c084fc" />
              </div>
              <div>
                <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Store POS Cash Drawer
                </h4>
                <span style={{ fontSize: "14px", color: "#94a3b8" }}>Terminal #POS-REGISTER-1</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#38bdf8" }}>$1,450.00</div>
              <span style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 600 }}>Balanced</span>
            </div>
          </div>

          {/* Account Card 3: Digital Payments Wallet */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "20px",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
              opacity: card3Progress,
              scale: card3Progress,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Wallet size={30} color="#34d399" />
              </div>
              <div>
                <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Digital Merchant Wallet
                </h4>
                <span style={{ fontSize: "14px", color: "#94a3b8" }}>Stripe / NFC Gateway</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#a7f3d0" }}>$3,890.00</div>
              <span style={{ fontSize: "13px", color: "#34d399", fontWeight: 600 }}>Instant Settled</span>
            </div>
          </div>
        </div>

        {/* Right Side: Security Engine & Live Ledger Logs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Security & Concurrency Lock Card */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(16, 185, 129, 0.5)",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              opacity: securityProgress,
              transform: `translateY(${interpolate(securityProgress, [0, 1], [30, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                }}
              >
                <ShieldCheck size={28} color="#10b981" />
              </div>
              <div>
                <h4 style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc", margin: "0 0 2px 0" }}>
                  AES-256 & Balance Locks
                </h4>
                <span style={{ color: "#34d399", fontSize: "14px", fontWeight: 600 }}>
                  Bank-Grade Data Protection
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <KeyRound size={20} color="#a5b4fc" />
                <div>
                  <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "15px", display: "block" }}>
                    AES-256-CBC Secret Encryption
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                    API Credentials & Key Storage Sealed
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Lock size={20} color="#f59e0b" />
                <div>
                  <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "15px", display: "block" }}>
                    FOR UPDATE Row-Level Locks
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                    Zero double-spending race conditions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Transaction Ledger Entries */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "15px", fontWeight: 700 }}>
              Live Ledger Audit Stream:
            </span>

            {/* Entry 1 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "12px 16px",
                borderRadius: "12px",
                opacity: tx1Progress,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ArrowUpRight size={20} color="#10b981" />
                <div>
                  <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "15px", display: "block" }}>
                    Sale POS #ORD-9841
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>Account: Store Cash Drawer</span>
                </div>
              </div>
              <span style={{ color: "#10b981", fontWeight: 800, fontSize: "18px" }}>+$24.28</span>
            </div>

            {/* Entry 2 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "12px 16px",
                borderRadius: "12px",
                opacity: tx2Progress,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ArrowDownLeft size={20} color="#ef4444" />
                <div>
                  <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "15px", display: "block" }}>
                    Restock Invoice Payment
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>Account: Checking #9842</span>
                </div>
              </div>
              <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "18px" }}>-$150.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
