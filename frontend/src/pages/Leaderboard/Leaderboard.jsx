import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../machine/endpoints";

const MEDAL = ["🥇", "🥈", "🥉"];

function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem.toString().padStart(2, "0")}s` : `${rem}s`;
}

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.DAILY_LEADERBOARD);
      if (!res.ok) throw new Error("Failed to load leaderboard");
      const data = await res.json();
      setEntries(data.entries || []);
      setDate(data.date || "");
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const ghostBtnStyle = {
    background: "rgba(255,255,255,0.07)",
    color: "#94a3b8",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "0.5rem 1rem",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a1a",
        color: "#f1f5f9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem 3rem",
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        position: "relative",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "fixed",
          top: "-15%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-10%",
          left: "-10%",
          width: "45%",
          height: "45%",
          background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top nav */}
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <button onClick={() => navigate("/")} style={ghostBtnStyle}>
          ← Home
        </button>
        <button
          onClick={() => navigate("/daily")}
          style={{ ...ghostBtnStyle, color: "#fbbf24" }}
        >
          ⚡ Play Today
        </button>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            margin: "0 0 0.25rem",
            background: "linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          🏆 Daily Leaderboard
        </h1>
        {date && (
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.88rem" }}>
            {formatDate(date)}
          </p>
        )}
      </div>

      {/* Leaderboard card */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          width: "100%",
          maxWidth: 560,
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Card header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
            {entries.length} {entries.length === 1 ? "player" : "players"} completed today
          </span>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            style={{
              ...ghostBtnStyle,
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "#ef4444", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && entries.length === 0 && (
          <div
            style={{
              padding: "3rem 1.5rem",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🎯</div>
            <p style={{ margin: 0, fontWeight: 600, color: "#94a3b8" }}>
              No completions yet!
            </p>
            <p style={{ margin: "6px 0 1.5rem", fontSize: "0.88rem" }}>
              Be the first to solve today's challenge.
            </p>
            <button
              onClick={() => navigate("/daily")}
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "0.7rem 1.8rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Play Now
            </button>
          </div>
        )}

        {/* Entries */}
        {!error && entries.length > 0 && (
          <div>
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr 80px 80px",
                gap: 8,
                padding: "0.6rem 1.5rem",
                color: "#64748b",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span>Rank</span>
              <span>Name</span>
              <span style={{ textAlign: "center" }}>Guesses</span>
              <span style={{ textAlign: "right" }}>Time</span>
            </div>

            {/* Rows */}
            {entries.map((entry, i) => {
              const isTop3 = entry.rank <= 3;
              const rankColors = ["#fbbf24", "#94a3b8", "#cd7c2e"];
              const rowColor = isTop3 ? rankColors[entry.rank - 1] : "#64748b";

              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr 80px 80px",
                    gap: 8,
                    padding: "0.85rem 1.5rem",
                    borderBottom:
                      i < entries.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    background: isTop3 ? `rgba(${entry.rank === 1 ? "251,191,36" : entry.rank === 2 ? "148,163,184" : "205,124,46"},0.04)` : "transparent",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Rank */}
                  <span
                    style={{
                      fontSize: isTop3 ? "1.3rem" : "0.95rem",
                      color: rowColor,
                      fontWeight: 700,
                    }}
                  >
                    {isTop3 ? MEDAL[entry.rank - 1] : `#${entry.rank}`}
                  </span>

                  {/* Name */}
                  <span
                    style={{
                      fontWeight: isTop3 ? 700 : 500,
                      color: isTop3 ? "#f1f5f9" : "#94a3b8",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.name}
                  </span>

                  {/* Guesses */}
                  <span
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: isTop3 ? rowColor : "#64748b",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {entry.guesses}
                  </span>

                  {/* Time */}
                  <span
                    style={{
                      textAlign: "right",
                      color: isTop3 ? "#a78bfa" : "#64748b",
                      fontWeight: isTop3 ? 700 : 500,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "0.9rem",
                    }}
                  >
                    {formatTime(entry.time_seconds)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {lastRefreshed && (
        <p
          style={{
            color: "#334155",
            fontSize: "0.75rem",
            marginTop: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          Last updated {lastRefreshed.toLocaleTimeString()} · Auto-refreshes every 30s
        </p>
      )}
    </div>
  );
}
