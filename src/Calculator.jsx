import { useState, useMemo } from "react";
import "./Calculator.css";

// ---------------------------------------------------------------------------
// Safe arithmetic evaluator (no eval())
// ---------------------------------------------------------------------------
function safeEvaluate(expression) {
  if (!expression) return "";
  if (!/^[0-9+\-*/.%\s]+$/.test(expression)) return "";
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expression})`)();
    if (typeof value !== "number" || !isFinite(value)) return "";
    return String(Math.round(value * 1e10) / 1e10);
  } catch {
    return "";
  }
}

const OPERATORS = ["/", "*", "-", "+", "%"];
const OPERATOR_SYMBOL = { "/": "÷", "*": "×", "-": "−", "+": "+", "%": "%" };

const trimTrailingOperators = (expr) => expr.replace(/[+\-*/%]+$/, "");

function formatNumberToken(token) {
  const [intPart, decPart] = token.split(".");
  const grouped = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart !== undefined ? `${grouped},${decPart}` : grouped;
}

function formatExpression(expr) {
  if (!expr) return "";
  const tokens = expr.match(/\d+\.?\d*|\.\d+|[+\-*/%]/g) || [];
  return tokens
    .map((tok) => (/^[+\-*/%]$/.test(tok) ? OPERATOR_SYMBOL[tok] : formatNumberToken(tok)))
    .join(" ");
}

// "=" spans the last two rows, matching the reference layout.
const PAD = [
  { label: "C", type: "util" },
  { label: "/", type: "op" },
  { label: "*", type: "op" },
  { label: "back", type: "util" },
  { label: "7", type: "digit" },
  { label: "8", type: "digit" },
  { label: "9", type: "digit" },
  { label: "-", type: "op" },
  { label: "4", type: "digit" },
  { label: "5", type: "digit" },
  { label: "6", type: "digit" },
  { label: "+", type: "op" },
  { label: "1", type: "digit" },
  { label: "2", type: "digit" },
  { label: "3", type: "digit" },
  { label: "=", type: "equals", tall: true },
  { label: "%", type: "op" },
  { label: "0", type: "digit" },
  { label: ",", type: "digit" },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12 2.5v2.2" />
        <path d="M12 19.3v2.2" />
        <path d="M4.4 4.4l1.5 1.5" />
        <path d="M18.1 18.1l1.5 1.5" />
        <path d="M2.5 12h2.2" />
        <path d="M19.3 12h2.2" />
        <path d="M4.4 19.6l1.5-1.5" />
        <path d="M18.1 5.9l1.5-1.5" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
      <path
        d="M21 13.2A9 9 0 1 1 10.8 3a7.2 7.2 0 0 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackspaceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <path
        d="M8.5 5.5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-10L3 12.5v-1L8.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M11 10l5 5M16 10l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Calculator() {
  const [expression, setExpression] = useState("");
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const preview = useMemo(() => {
    if (justEvaluated || !expression || !/[+\-*/%]/.test(expression)) return "";
    const trimmed = trimTrailingOperators(expression);
    if (!trimmed) return "";
    const result = safeEvaluate(trimmed);
    return result ? formatExpression(result) : "";
  }, [expression, justEvaluated]);

  const handlePress = (value) => {
    const isDigit = /^[0-9]$/.test(value);
    const isOperator = OPERATORS.includes(value);

    if (isDigit) {
      setExpression((prev) => (justEvaluated ? value : prev + value));
      setJustEvaluated(false);
      return;
    }

    if (value === ",") {
      setExpression((prev) => {
        const base = justEvaluated ? "" : prev;
        const lastSegment = base.split(/[+\-*/%]/).pop();
        return lastSegment.includes(".") ? base : base + (lastSegment ? "." : "0.");
      });
      setJustEvaluated(false);
      return;
    }

    if (isOperator) {
      setExpression((prev) => {
        if (justEvaluated) return prev + value;
        if (!prev) return value === "-" ? "-" : prev;
        return /[+\-*/%]$/.test(prev) ? prev.slice(0, -1) + value : prev + value;
      });
      setJustEvaluated(false);
      return;
    }

    switch (value) {
      case "C":
        setExpression("");
        setJustEvaluated(false);
        break;
      case "back":
        setExpression((prev) => prev.slice(0, -1));
        setJustEvaluated(false);
        break;
      case "=": {
        const trimmed = trimTrailingOperators(expression);
        const result = safeEvaluate(trimmed);
        if (result) {
          setExpression(result);
          setJustEvaluated(true);
        }
        break;
      }
      default:
        break;
    }
  };

  const themeClass = isDark ? "dark" : "light";

  return (
    <div className={`calc-page ${themeClass}`}>
      <div className={`calc-shell ${themeClass}`}>
        <div className="calc-switch-row">
          <div className="calc-switch-track">
            <button
              aria-label="Light mode"
              onClick={() => setIsDark(false)}
              className={`calc-switch-btn ${!isDark ? "active" : ""}`}
            >
              <SunIcon />
            </button>
            <button
              aria-label="Dark mode"
              onClick={() => setIsDark(true)}
              className={`calc-switch-btn ${isDark ? "active" : ""}`}
            >
              <MoonIcon />
            </button>
          </div>
        </div>

        <div className="calc-display">
          <div className="calc-display-main">{formatExpression(expression) || "0"}</div>
          <div className="calc-display-preview">{preview}</div>
        </div>

        <div className="calc-grid">
          {PAD.map(({ label, type, tall }) => {
            const cls =
              type === "equals" ? "equals" : type === "op" ? "op" : type === "util" ? "util" : "num";
            return (
              <button
                key={label}
                onClick={() => handlePress(label)}
                className={`calc-key ${cls} ${tall ? "tall" : ""}`}
              >
                {label === "back" ? (
                  <BackspaceIcon />
                ) : label === "=" ? (
                  "="
                ) : OPERATORS.includes(label) ? (
                  OPERATOR_SYMBOL[label]
                ) : (
                  label
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}