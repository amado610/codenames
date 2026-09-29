'use client'
import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

export function useGame(query) {
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const s = io({ query: query() })
    s.on('state', (st) => {
      setState(st)
      setError(null)
    })
    s.on('error-msg', (msg) => {
      setError(msg)
      setTimeout(() => setError(null), 2500)
    })
    setSocket(s)
    return () => s.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { state, error, socket }
}

export const TEAM = { red: 'Vermelha', blue: 'Azul' }
export const other = (team) => (team === 'red' ? 'blue' : 'red')

// true when the game ended because someone contacted the assassin
export const assassinHit = (state) => state.revealed[state.colors.indexOf('assassin')]

export function Board({ state, onPick, spymaster, deal }) {
  // each card lands at a random moment, from a random direction, like a dossier tipped onto the desk
  const throws = useMemo(
    () =>
      state.words.map(() => ({
        '--delay': `${(Math.random() * 1.1).toFixed(2)}s`,
        '--from-x': `${Math.round(Math.random() * 120 - 60)}vw`,
        '--from-y': `${Math.round(Math.random() * 80 - 40)}vh`,
        '--from-r': `${Math.round(Math.random() * 90 - 45)}deg`,
      })),
    [state.words.join()], // eslint-disable-line react-hooks/exhaustive-deps
  )
  return (
    <div className={`board ${state.winner ? 'over' : ''} ${deal ? 'deal' : ''}`}>
      {state.words.map((w, i) => {
        const c = state.colors[i]
        // pick one of the two art variants from the word itself, so it never changes mid-game
        const variant = ([...w].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 2) + 1
        const cls = state.revealed[i] ? `revealed ${c}` : spymaster || state.winner ? `hint ${c}` : ''
        return (
          <button
            key={i}
            className={`card ${cls} v${variant}`}
            style={deal ? throws[i] : undefined}
            disabled={!onPick || state.revealed[i]}
            onClick={() => onPick?.(i)}
          >
            <span className="serial">Nº {String(i + 1).padStart(2, '0')}</span>
            <span className={w.length > 9 ? 'word long' : 'word'}>{w}</span>
          </button>
        )
      })}
    </div>
  )
}
