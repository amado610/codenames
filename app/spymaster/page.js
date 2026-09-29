'use client'
import { useState } from 'react'
import { useGame, TEAM, Board, other, assassinHit } from '../shared'

export default function Spymaster() {
  const { state, error, socket } = useGame(() => {
    const p = new URLSearchParams(location.search)
    return { role: 'spy', team: p.get('team'), token: p.get('token') }
  })
  const [pick, setPick] = useState(null)

  if (!state) return <main className="phone center"><p className="typed">{error ?? 'A estabelecer ligação…'}</p></main>

  const { team } = state
  const myTurn = state.started && !state.winner && state.turn === team

  const confirm = () => {
    socket.emit('guess', pick)
    setPick(null)
  }

  let status
  if (!state.started) status = 'À espera do outro líder…'
  else if (state.winner === team) status = 'Missão cumprida. A tua equipa venceu!'
  else if (state.winner) status = assassinHit(state) && state.winner === other(team) ? 'Contactaram o assassino. Missão falhada.' : 'Missão falhada.'
  else if (myTurn) status = 'É a vossa vez. Dá a pista em voz alta e toca na palavra que a equipa escolher.'
  else status = `A Equipa ${TEAM[state.turn]} está em campo.`

  return (
    <main className={`phone ${team} ${myTurn ? 'my-turn' : ''}`}>
      <header className="phone-head">
        <div>
          <p className="typed small">Dossiê do líder</p>
          <h1 className={`team-name ${team}`}>Equipa {TEAM[team]}</h1>
        </div>
        <div className="mini-tally" aria-label="Agentes por encontrar">
          <span className="red">{state.remaining.red}</span>
          <span className="blue">{state.remaining.blue}</span>
        </div>
      </header>

      <p className={`status ${myTurn ? 'live' : ''}`}>{status}</p>

      {state.started && <Board state={state} spymaster onPick={myTurn ? setPick : null} />}

      {state.started && (
        <ul className="legend typed small">
          <li><i className="red" /> Vermelha</li>
          <li><i className="blue" /> Azul</li>
          <li><i className="neutral" /> Civil</li>
          <li><i className="assassin" /> Assassino</li>
        </ul>
      )}

      {myTurn && (
        <button className="primary pass" disabled={state.guessesThisTurn === 0} onClick={() => socket.emit('pass')}>
          {state.guessesThisTurn === 0 ? 'Escolham pelo menos uma palavra' : 'Terminar turno'}
        </button>
      )}

      {pick !== null && (
        <div className="sheet-backdrop" onClick={() => setPick(null)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className="typed small">Confirmar alvo</p>
            <h2>{state.words[pick]}</h2>
            <div className="row">
              <button className="ghost" onClick={() => setPick(null)}>Cancelar</button>
              <button className="primary" onClick={confirm} autoFocus>Revelar</button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="toast" role="alert">{error}</div>}
    </main>
  )
}
