import { useEffect, useRef, useState } from 'react'
import './App.css'
import {
  computeReal,
  formatReal,
  makeBogus,
  opSymbol,
  rollResult,
  type Op,
} from './calc'

type Phase = 'idle' | 'calculating' | 'revealing'

// 演出のタイミング（ms）
const SHAKE_DURATION = 1200 // ブルブル震える時間
const FLICKER_INTERVAL = 60 // 計算中のチカチカ更新間隔
const REVEAL_INTERVAL = 200 // 一桁ずつ出す間隔

const OPS: Op[] = ['/', '*', '-', '+']

function App() {
  const [display, setDisplay] = useState('0')
  const [current, setCurrent] = useState('0')
  const [previous, setPrevious] = useState<number | null>(null)
  const [operator, setOperator] = useState<Op | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [justEvaluated, setJustEvaluated] = useState(false)

  // 進行中のタイマーをまとめて管理して、アンマウント時に破棄する
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const flicker = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
      if (flicker.current) clearInterval(flicker.current)
    }
  }, [])

  const busy = phase !== 'idle'

  const track = (t: ReturnType<typeof setTimeout>) => {
    timers.current.push(t)
    return t
  }

  // ---- 入力ハンドラ ----

  const inputDigit = (d: string) => {
    if (busy) return
    if (justEvaluated) {
      // = の直後に数字 → 新規計算として開始
      setPrevious(null)
      setOperator(null)
      setCurrent(d)
      setDisplay(d)
      setJustEvaluated(false)
      return
    }
    const next = current === '0' ? d : current + d
    setCurrent(next)
    setDisplay(next)
  }

  const inputDot = () => {
    if (busy) return
    if (justEvaluated) {
      setPrevious(null)
      setOperator(null)
      setCurrent('0.')
      setDisplay('0.')
      setJustEvaluated(false)
      return
    }
    if (current.includes('.')) return
    const next = current + '.'
    setCurrent(next)
    setDisplay(next)
  }

  const chooseOperator = (op: Op) => {
    if (busy) return
    // 連続計算: 直前の表示値を左辺として引き継ぐ
    const value = justEvaluated ? Number(display) : Number(current)
    setPrevious(value)
    setOperator(op)
    setCurrent('0')
    setJustEvaluated(false)
    setDisplay(`${formatReal(value)} ${opSymbol(op)}`)
  }

  const clearAll = () => {
    // 進行中でもリセットは効かせる
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (flicker.current) {
      clearInterval(flicker.current)
      flicker.current = null
    }
    setDisplay('0')
    setCurrent('0')
    setPrevious(null)
    setOperator(null)
    setPhase('idle')
    setJustEvaluated(false)
  }

  const evaluate = () => {
    if (busy) return
    if (operator === null || previous === null) return

    const real = computeReal(previous, operator, Number(current))
    const resultStr = rollResult(real)

    // --- フェーズ1: 計算中（ブルブル＆チカチカ） ---
    setPhase('calculating')
    setJustEvaluated(false)
    flicker.current = setInterval(() => {
      setDisplay(makeBogus())
    }, FLICKER_INTERVAL)

    track(
      setTimeout(() => {
        if (flicker.current) {
          clearInterval(flicker.current)
          flicker.current = null
        }
        // --- フェーズ2: 一桁ずつ表示 ---
        setPhase('revealing')
        revealDigits(resultStr)
      }, SHAKE_DURATION),
    )
  }

  const revealDigits = (result: string) => {
    setDisplay('')
    const chars = [...result]
    chars.forEach((_, i) => {
      track(
        setTimeout(() => {
          setDisplay(result.slice(0, i + 1))
          if (i === chars.length - 1) {
            // 出し切ったら確定。連続計算のため previous に結果を積む
            const numeric = Number(result)
            setPrevious(Number.isFinite(numeric) ? numeric : null)
            setOperator(null)
            setCurrent(result)
            setPhase('idle')
            setJustEvaluated(true)
          }
        }, REVEAL_INTERVAL * (i + 1)),
      )
    })
  }

  // ---- レンダリング ----

  return (
    <div className="stage">
      <h1 className="title">おバカ電卓</h1>
      <div
        className={`calculator ${phase === 'calculating' ? 'calculating' : ''}`}
      >
        <div className={`indicator phase-${phase}`}>
          <span className="indicator-text" key={display}>
            {display || ' '}
          </span>
        </div>

        <div className="keys">
          <button className="key key-fn" onClick={clearAll}>
            AC
          </button>
          {OPS.map((op) => (
            <button
              key={op}
              className={`key key-op ${operator === op ? 'active' : ''}`}
              onClick={() => chooseOperator(op)}
              disabled={busy}
            >
              {opSymbol(op)}
            </button>
          ))}

          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => (
            <button
              key={d}
              className="key key-num"
              onClick={() => inputDigit(d)}
              disabled={busy}
            >
              {d}
            </button>
          ))}

          <button
            className="key key-num key-zero"
            onClick={() => inputDigit('0')}
            disabled={busy}
          >
            0
          </button>
          <button className="key key-num" onClick={inputDot} disabled={busy}>
            .
          </button>
          <button className="key key-eq" onClick={evaluate} disabled={busy}>
            =
          </button>
        </div>
      </div>
      <p className="hint">※ この電卓は 30% くらいしか正しくありません</p>
    </div>
  )
}

export default App
