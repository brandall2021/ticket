"use client"

import { useState, useCallback, useEffect } from "react"
import { Delete } from "lucide-react"

interface CalcState {
  display: string
  previousValue: number | null
  operation: string | null
  waitingForOperand: boolean
  memory: number
  history: string
}

const INITIAL: CalcState = {
  display: "0",
  previousValue: null,
  operation: null,
  waitingForOperand: false,
  memory: 0,
  history: "",
}

export function Calculator() {
  const [state, setState] = useState<CalcState>(INITIAL)

  const inputDigit = useCallback((digit: string) => {
    setState(s => {
      if (s.waitingForOperand) {
        return { ...s, display: digit, waitingForOperand: false }
      }
      const newDisplay = s.display === "0" ? digit : s.display + digit
      return { ...s, display: newDisplay }
    })
  }, [])

  const inputDot = useCallback(() => {
    setState(s => {
      if (s.waitingForOperand) {
        return { ...s, display: "0.", waitingForOperand: false }
      }
      if (s.display.includes(".")) return s
      return { ...s, display: s.display + "." }
    })
  }, [])

  const inputDoubleZero = useCallback(() => {
    setState(s => {
      if (s.waitingForOperand) {
        return { ...s, display: "0", waitingForOperand: false }
      }
      const newDisplay = s.display === "0" ? "0" : s.display + "00"
      return { ...s, display: newDisplay }
    })
  }, [])

  const backspace = useCallback(() => {
    setState(s => {
      if (s.waitingForOperand) return s
      const newDisplay = s.display.length > 1 ? s.display.slice(0, -1) : "0"
      return { ...s, display: newDisplay }
    })
  }, [])

  const toggleSign = useCallback(() => {
    setState(s => {
      const val = parseFloat(s.display)
      return { ...s, display: String(-val) }
    })
  }, [])

  const calculate = (left: number, right: number, op: string): number => {
    switch (op) {
      case "+": return left + right
      case "-": return left - right
      case "×": return left * right
      case "÷": return right !== 0 ? left / right : NaN
      case "^": return Math.pow(left, right)
      default: return right
    }
  }

  const performOperation = useCallback((nextOp: string) => {
    setState(s => {
      const current = parseFloat(s.display)
      const opSymbols: Record<string, string> = { "+": "+", "-": "-", "×": "×", "÷": "÷", "^": "^", "=": "=" }

      if (s.previousValue !== null && s.operation && !s.waitingForOperand) {
        const result = calculate(s.previousValue, current, s.operation)
        const resultStr = isNaN(result) ? "Error" : formatNumber(result)
        const historyStr = `${formatNumber(s.previousValue)} ${opSymbols[s.operation]} ${formatNumber(current)}`
        return {
          ...s,
          display: resultStr,
          previousValue: isNaN(result) ? null : result,
          operation: nextOp === "=" ? null : nextOp,
          waitingForOperand: nextOp !== "=",
          history: nextOp === "=" ? `${historyStr} =` : "",
        }
      }

      return {
        ...s,
        previousValue: current,
        operation: nextOp === "=" ? null : nextOp,
        waitingForOperand: true,
        history: nextOp === "=" ? "" : `${formatNumber(current)} ${opSymbols[nextOp] || nextOp}`,
      }
    })
  }, [])

  const percentage = useCallback(() => {
    setState(s => {
      const current = parseFloat(s.display)
      if (s.previousValue !== null) {
        const result = (s.previousValue * current) / 100
        return { ...s, display: formatNumber(result) }
      }
      return { ...s, display: formatNumber(current / 100) }
    })
  }, [])

  const squareRoot = useCallback(() => {
    setState(s => {
      const val = parseFloat(s.display)
      if (val < 0) return { ...s, display: "Error" }
      return { ...s, display: formatNumber(Math.sqrt(val)) }
    })
  }, [])

  const memoryAdd = useCallback(() => {
    setState(s => ({ ...s, memory: s.memory + parseFloat(s.display) }))
  }, [])

  const memorySubtract = useCallback(() => {
    setState(s => ({ ...s, memory: s.memory - parseFloat(s.display) }))
  }, [])

  const memoryRecall = useCallback(() => {
    setState(s => ({ ...s, display: formatNumber(s.memory), waitingForOperand: false }))
  }, [])

  const memoryClear = useCallback(() => {
    setState(s => ({ ...s, memory: 0 }))
  }, [])

  const allClear = useCallback(() => {
    setState({ ...INITIAL, memory: state.memory })
  }, [state.memory])

  const clearEntry = useCallback(() => {
    setState(s => ({ ...INITIAL, memory: s.memory }))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key)
      else if (e.key === ".") inputDot()
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); performOperation("=") }
      else if (e.key === "Backspace") backspace()
      else if (e.key === "Escape" || e.key === "Delete" || e.key === "End") allClear()
      else if (e.key === "+") performOperation("+")
      else if (e.key === "-") performOperation("-")
      else if (e.key === "*") performOperation("×")
      else if (e.key === "/") { e.preventDefault(); performOperation("÷") }
      else if (e.key === "%") percentage()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [inputDigit, inputDot, performOperation, backspace, allClear, percentage])

  function formatNumber(n: number): string {
    if (!isFinite(n)) return isNaN(n) ? "Error" : "∞"
    const str = String(n)
    if (str.length > 15) return n.toPrecision(10)
    return str
  }

  const opLabel: Record<string, string> = { "+": "+", "-": "−", "×": "×", "÷": "÷", "^": "^" }

  const buttons: { label: string; action: () => void; className?: string; active?: boolean }[] = [
    { label: "AC", action: allClear, className: "calc-func" },
    { label: "C", action: clearEntry, className: "calc-func" },
    { label: "MC", action: memoryClear, className: "calc-mem" },
    { label: "MR", action: memoryRecall, className: "calc-mem" },
    { label: "←", action: backspace, className: "calc-func" },
    { label: "%", action: percentage, className: "calc-op-light" },
    { label: "√", action: squareRoot, className: "calc-op-light" },
    { label: "÷", action: () => performOperation("÷"), className: "calc-op", active: state.operation === "÷" && state.waitingForOperand },

    { label: "7", action: () => inputDigit("7") },
    { label: "8", action: () => inputDigit("8") },
    { label: "9", action: () => inputDigit("9") },
    { label: "×", action: () => performOperation("×"), className: "calc-op", active: state.operation === "×" && state.waitingForOperand },

    { label: "4", action: () => inputDigit("4") },
    { label: "5", action: () => inputDigit("5") },
    { label: "6", action: () => inputDigit("6") },
    { label: "−", action: () => performOperation("-"), className: "calc-op", active: state.operation === "-" && state.waitingForOperand },

    { label: "1", action: () => inputDigit("1") },
    { label: "2", action: () => inputDigit("2") },
    { label: "3", action: () => inputDigit("3") },
    { label: "+", action: () => performOperation("+"), className: "calc-op", active: state.operation === "+" && state.waitingForOperand },

    { label: "00", action: inputDoubleZero, className: "calc-zero" },
    { label: "0", action: () => inputDigit("0") },
    { label: ".", action: inputDot },
    { label: "=", action: () => performOperation("="), className: "calc-equals" },

    { label: "+/−", action: toggleSign, className: "calc-func" },
    { label: "xʸ", action: () => performOperation("^"), className: "calc-op-light" },
    { label: "M+", action: memoryAdd, className: "calc-mem" },
    { label: "M−", action: memorySubtract, className: "calc-mem" },
  ]

  const displayFontSize = state.display.length > 12 ? "text-2xl" : state.display.length > 8 ? "text-3xl" : "text-4xl"

  return (
    <div className="calc-container">
      <div className="calc-display">
        {state.history && (
          <div className="calc-history">{state.history}</div>
        )}
        {state.memory !== 0 && (
          <div className="calc-memory-indicator">M = {formatNumber(state.memory)}</div>
        )}
        <div className={`calc-value ${displayFontSize}`}>
          {state.display}
        </div>
      </div>
      <div className="calc-grid">
        {buttons.map(b => (
          <button
            key={b.label}
            onClick={b.action}
            className={`calc-btn ${b.className || "calc-num"} ${b.active ? "calc-active" : ""}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}
