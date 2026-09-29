'use client'
import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useGame, TEAM, Board, other, assassinHit } from './shared'

export default function TV() {
  const { state, socket } = useGame(() => ({ role: 'tv' }))
  const [countdown, setCountdown] = useState(0)
  const [dealing, setDealing] = useState(false)
  const seen = useRef() // undefined until the first state: a refresh mid-game skips the intro

  const gameKey = state?.started ? state.words.join() : null
  useEffect(() => {
    if (!state) return
    if (gameKey && seen.current !== undefined && seen.current !== gameKey) setCountdown(3)
    seen.current = gameKey
  }, [gameKey, !state]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!countdown) return
    const t = setTimeout(() => {
      setCountdown(countdown - 1)
      if (countdown === 1) setDealing(true)
    }, 1000)
    return () => clearTimeout(t)
  }, [countdown])

  if (!state)
    return (
      <main className="desk center">
        <p className="typed">A estabelecer ligação…</p>
      </main>
    )

  if (!state.started || countdown) {
    return (
      <main className="desk lobby">
        <header className="lobby-head">
          <p className="classified">Confidencial · Só para agentes</p>
          <h1 className="logo">Codenames</h1>
          <p className="typed">Dois líderes. Vinte e cinco palavras. Um assassino.</p>
        </header>
        <div className="folders">
          {['red', 'blue'].map((team) => (
            <section key={team} className={`folder ${team}`}>
              <div className="folder-label">
                <span>Dossiê</span>
                <strong>Equipa {TEAM[team]}</strong>
              </div>
              <div className="qr-sheet">
                <QRCodeSVG
                  value={state.links[team]}
                  size={220}
                  marginSize={1}
                  bgColor="transparent"
                  fgColor="#1d1812"
                />
                {state.connected[team] && <span className="stamp ok">Líder ligado</span>}
              </div>
              <p className="typed small">
                {state.connected[team] ? (
                  'Agente identificado.'
                ) : (
                  <>
                    Líder, lê o código com o telemóvel
                    <span className="cursor" />
                  </>
                )}
              </p>
            </section>
          ))}
        </div>
        {['red', 'blue'].map((team) => (
          <div key={team} className={`leader ${team} ${state.connected[team] ? 'in' : ''}`} aria-hidden="true" />
        ))}
        {countdown > 0 && (
          <div className="countdown" role="status">
            <p className="typed">A missão começa em</p>
            <span key={countdown} className="stamp count">
              {countdown}
            </span>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className={`desk tv turn-${state.winner ?? state.turn}`}>
      <header className="tv-head">
        <Tally team="red" state={state} />
        <div className="turn">
          {state.winner ? (
            <div key="win" className={`stamp big ${state.winner}`}>
              <span>Missão cumprida</span>
              <strong>Equipa {TEAM[state.winner]}</strong>
            </div>
          ) : (
            <div key={state.turn} className={`stamp big ${state.turn}`}>
              <span>Em campo</span>
              <strong>Equipa {TEAM[state.turn]}</strong>
            </div>
          )}
          {state.winner && assassinHit(state) && (
            <p className="typed small">A Equipa {TEAM[other(state.winner)]} contactou o assassino.</p>
          )}
        </div>
        <Tally team="blue" state={state} />
      </header>

      <Board state={state} deal={dealing} />

      <footer className="tv-foot">
        <p className="typed small">
          {!state.connected.red && 'Líder vermelho desligado. '}
          {!state.connected.blue && 'Líder azul desligado. '}
        </p>
        <button className="ghost" onClick={() => socket.emit('new')}>
          Nova missão
        </button>
      </footer>
    </main>
  )
}

function Tally({ team, state }) {
  const active = (state.winner ?? state.turn) === team
  return (
    <div className={`tally ${team} ${active ? 'active' : ''}`}>
      <strong key={state.remaining[team]}>{state.remaining[team]}</strong>
      <span>
        Equipa {TEAM[team]}
        <br />
        {state.remaining[team] === 1 ? 'agente por encontrar' : 'agentes por encontrar'}
      </span>
    </div>
  )
}
