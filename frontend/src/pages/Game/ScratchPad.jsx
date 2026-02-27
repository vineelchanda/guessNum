import { useState, useEffect } from "react";
import "./ScratchPad.css";

const initialStatus = Array(10).fill(null);
const ORDINALS = ["1st", "2nd", "3rd", "4th"];

function ScratchPad({ onFillGuess }) {
  const [digitStatus, setDigitStatus] = useState(initialStatus);
  // grid[digitIdx][posIdx] = true (possible) | false (eliminated)
  const [grid, setGrid] = useState(null);

  const greenDigits = digitStatus
    .map((s, i) => (s === "tick" ? i : null))
    .filter((d) => d !== null);

  const showHelper = greenDigits.length === 4;
  const greenKey = greenDigits.join(",");

  // Reset grid whenever the set of green digits changes
  useEffect(() => {
    if (greenDigits.length === 4) {
      setGrid(Array(4).fill(null).map(() => Array(4).fill(true)));
    } else {
      setGrid(null);
    }
  }, [greenKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigitClick = (idx) => {
    setDigitStatus((prev) => {
      const next = [...prev];
      if (next[idx] === null) next[idx] = "tick";
      else if (next[idx] === "tick") next[idx] = "cross";
      else next[idx] = null;
      return next;
    });
  };

  const handleCellToggle = (dIdx, pIdx) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[dIdx][pIdx] = !next[dIdx][pIdx];
      return next;
    });
  };

  // For each position (column), find confirmed digit (only 1 possible left)
  const confirmedDigits =
    showHelper && grid
      ? [0, 1, 2, 3].map((pIdx) => {
          const possible = greenDigits.filter((_, dIdx) => grid[dIdx][pIdx]);
          return possible.length === 1 ? possible[0] : null;
        })
      : [null, null, null, null];

  const allConfirmed = confirmedDigits.every((d) => d !== null);
  const uniqueConfirmed = new Set(confirmedDigits.filter((d) => d !== null));
  const canUseGuess =
    allConfirmed && uniqueConfirmed.size === 4;

  return (
    <div
      className="scratchpad-container"
      style={showHelper ? { maxWidth: 700 } : {}}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {/* ── Left: digit scratchpad ── */}
        <div style={{ flex: "0 0 auto" }}>
          <div className="scratchpad-title">Scratch Pad</div>
          <div className="scratchpad-digits">
            {digitStatus.map((status, idx) => (
              <button
                key={idx}
                className={`scratchpad-digit ${status || ""}`}
                onClick={() => handleDigitClick(idx)}
                aria-label={`Digit ${idx}`}
              >
                {idx}
              </button>
            ))}
          </div>
          {showHelper && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "#bfa100",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              4 digits found →
            </div>
          )}
        </div>

        {/* ── Right: elimination grid ── */}
        {showHelper && grid && (
          <div style={{ flex: "0 0 auto" }}>
            <div className="scratchpad-title">Position Helper</div>

            <table
              style={{
                borderCollapse: "separate",
                borderSpacing: 6,
                margin: "0 auto",
              }}
            >
              <thead>
                <tr>
                  {/* empty corner */}
                  <th style={{ width: 24 }} />
                  {ORDINALS.map((o, pIdx) => {
                    const confirmed = confirmedDigits[pIdx] !== null;
                    return (
                      <th
                        key={pIdx}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: confirmed ? "#388e3c" : "#bfa100",
                          textAlign: "center",
                          width: 44,
                          paddingBottom: 4,
                        }}
                      >
                        {confirmed ? `✓ ${o}` : o}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {greenDigits.map((digit, dIdx) => (
                  <tr key={digit}>
                    {/* row label */}
                    <td
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#555",
                        textAlign: "center",
                        paddingRight: 2,
                      }}
                    >
                      {digit}
                    </td>

                    {[0, 1, 2, 3].map((pIdx) => {
                      const possible = grid[dIdx][pIdx];
                      const isConfirmedHere =
                        confirmedDigits[pIdx] === digit;

                      return (
                        <td key={pIdx}>
                          <button
                            onClick={() => handleCellToggle(dIdx, pIdx)}
                            title={
                              possible
                                ? `Eliminate: ${digit} cannot be in position ${pIdx + 1}`
                                : `Restore: ${digit} might be in position ${pIdx + 1}`
                            }
                            style={{
                              width: 40,
                              height: 38,
                              borderRadius: 7,
                              border: isConfirmedHere
                                ? "2px solid #43a047"
                                : possible
                                ? "2px solid #ffe066"
                                : "2px solid #e57373",
                              background: isConfirmedHere
                                ? "#c8f5c8"
                                : possible
                                ? "#fffde7"
                                : "#ffeaea",
                              color: possible ? "#333" : "#e57373",
                              fontSize: 16,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              textDecoration: possible
                                ? "none"
                                : "line-through",
                              opacity: possible ? 1 : 0.45,
                            }}
                          >
                            {digit}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Confirmed guess preview + button */}
            <div style={{ textAlign: "center", marginTop: 12 }}>
              {canUseGuess && (
                <div
                  style={{
                    marginBottom: 6,
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: 6,
                    color: "#388e3c",
                  }}
                >
                  {confirmedDigits.join("")}
                </div>
              )}
              <button
                onClick={() => {
                  if (canUseGuess && onFillGuess) {
                    onFillGuess(confirmedDigits.map(String).join(""));
                  }
                }}
                disabled={!canUseGuess}
                style={{
                  fontSize: 14,
                  padding: "7px 20px",
                  borderRadius: 8,
                  background: canUseGuess ? "#4caf50" : "#ccc",
                  color: "white",
                  border: "none",
                  fontWeight: 600,
                  cursor: canUseGuess ? "pointer" : "not-allowed",
                  transition: "background 0.2s",
                }}
              >
                {canUseGuess ? "Use as Guess ✓" : "Narrow down positions…"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScratchPad;
