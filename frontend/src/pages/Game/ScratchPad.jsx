import React, { useState } from "react";
import "./ScratchPad.css";

// Status: null = unmarked, 'tick' = possible, 'cross' = not possible
const initialStatus = Array(10).fill(null);

function ScratchPad() {
  const [digitStatus, setDigitStatus] = useState(initialStatus);

  const handleClick = (idx) => {
    setDigitStatus((prev) => {
      const next = [...prev];
      // Cycle: null -> tick -> cross -> null
      if (next[idx] === null) next[idx] = "tick";
      else if (next[idx] === "tick") next[idx] = "cross";
      else next[idx] = null;
      return next;
    });
  };

  return (
    <div className="scratchpad-container">
      <div className="scratchpad-title">Scratch Pad</div>
      <div className="scratchpad-digits">
        {digitStatus.map((status, idx) => (
          <button
            key={idx}
            className={`scratchpad-digit ${status || ""}`}
            onClick={() => handleClick(idx)}
            aria-label={`Digit ${idx}`}
          >
            {idx}
            {/* {status === "tick" && <span className="tick">✔</span>}
            {status === "cross" && <span className="cross">✗</span>} */}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ScratchPad;
