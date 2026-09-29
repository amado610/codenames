const { randomBytes, randomInt } = require('node:crypto')
const WORDS = require('./words.json')

const other = (team) => (team === 'red' ? 'blue' : 'red')

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// tokens stay the same across rounds so the phones keep working after "Novo jogo"
function newGame(tokens) {
  const starter = randomInt(2) ? 'red' : 'blue'
  const colors = shuffle([
    ...Array(9).fill(starter),
    ...Array(8).fill(other(starter)),
    ...Array(7).fill('neutral'),
    'assassin',
  ])
  return {
    tokens: tokens ?? { red: randomBytes(8).toString('hex'), blue: randomBytes(8).toString('hex') },
    words: shuffle(WORDS).slice(0, 25),
    colors,
    revealed: Array(25).fill(false),
    starter,
    turn: starter,
    guessesThisTurn: 0,
    started: false,
    winner: null,
  }
}

const remaining = (g, team) => g.colors.filter((c, i) => c === team && !g.revealed[i]).length

// returns an error string or null
function guess(g, team, i) {
  if (!g.started || g.winner) return 'O jogo não está a decorrer'
  if (team !== g.turn) return 'Não é a vez da tua equipa'
  if (!Number.isInteger(i) || i < 0 || i > 24 || g.revealed[i]) return 'Palavra inválida'

  g.revealed[i] = true
  g.guessesThisTurn++
  const c = g.colors[i]

  if (c === 'assassin') g.winner = other(team)
  else if (remaining(g, 'red') === 0) g.winner = 'red'
  else if (remaining(g, 'blue') === 0) g.winner = 'blue'
  else if (c !== team) endTurn(g)
  return null
}

function pass(g, team) {
  if (!g.started || g.winner) return 'O jogo não está a decorrer'
  if (team !== g.turn) return 'Não é a vez da tua equipa'
  if (g.guessesThisTurn === 0) return 'Tens de tentar pelo menos uma palavra'
  endTurn(g)
  return null
}

function endTurn(g) {
  g.turn = other(g.turn)
  g.guessesThisTurn = 0
}

// what each screen is allowed to see: the TV never gets unrevealed colors
function view(g, spymaster) {
  const showAll = spymaster || g.winner
  return {
    started: g.started,
    words: g.started ? g.words : [],
    colors: g.started ? g.colors.map((c, i) => (showAll || g.revealed[i] ? c : null)) : [],
    revealed: g.revealed,
    turn: g.turn,
    guessesThisTurn: g.guessesThisTurn,
    winner: g.winner,
    remaining: { red: remaining(g, 'red'), blue: remaining(g, 'blue') },
  }
}

module.exports = { newGame, guess, pass, view }

if (require.main === module) {
  const assert = require('node:assert')
  const g = newGame()
  assert.equal(new Set(g.words).size, 25)
  assert.equal(g.colors.filter((c) => c === g.starter).length, 9)
  assert.equal(g.colors.filter((c) => c === 'assassin').length, 1)
  assert.ok(guess(g, g.turn, 0), 'no guessing before start')
  g.started = true
  assert.ok(view(g, false).colors.every((c) => c === null), 'TV sees no colors')
  assert.ok(guess(g, other(g.turn), 0), 'wrong team cannot guess')
  assert.ok(pass(g, g.turn), 'cannot pass without guessing')
  const t = g.turn
  const neutral = g.colors.indexOf('neutral')
  assert.equal(guess(g, t, neutral), null)
  assert.equal(g.turn, other(t), 'neutral ends turn')
  assert.ok(guess(g, g.turn, neutral), 'cannot re-guess revealed')
  const t2 = g.turn
  assert.equal(guess(g, t2, g.colors.indexOf('assassin')), null)
  assert.equal(g.winner, other(t2), 'assassin loses')
  console.log('ok')
}
