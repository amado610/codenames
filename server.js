const { createServer } = require('node:http')
const os = require('node:os')
const next = require('next')
const { Server } = require('socket.io')
const { newGame, guess, pass, view } = require('./lib/game')

const port = Number(process.env.PORT) || 4000
const dev = process.env.NODE_ENV !== 'production'

// phones must reach the TV's machine over Wi-Fi, so the QR needs the LAN IP, not localhost
const lanIp =
  Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i.family === 'IPv4' && !i.internal)?.address ?? 'localhost'
const baseUrl = process.env.PUBLIC_URL || `http://${lanIp}:${port}`

// ponytail: one game per server, it's a living-room TV; add rooms if you ever host it publicly
let game = newGame()

const app = next({ dev, hostname: lanIp, port }) // hostname lets phones load dev assets (Next blocks other origins)
app.prepare().then(() => {
  const server = createServer(app.getRequestHandler())
  const io = new Server(server)

  const spyCount = (team) => io.sockets.adapter.rooms.get(team)?.size ?? 0

  function broadcast() {
    const connected = { red: spyCount('red') > 0, blue: spyCount('blue') > 0 }
    if (connected.red && connected.blue) game.started = true
    io.to('tv').emit('state', {
      ...view(game, false),
      connected,
      links: {
        red: `${baseUrl}/spymaster?team=red&token=${game.tokens.red}`,
        blue: `${baseUrl}/spymaster?team=blue&token=${game.tokens.blue}`,
      },
    })
    for (const team of ['red', 'blue']) io.to(team).emit('state', { ...view(game, true), connected, team })
  }

  io.on('connection', (socket) => {
    const { role, team, token } = socket.handshake.query

    if (role === 'tv') {
      socket.join('tv')
      socket.on('new', () => {
        game = newGame(game.tokens)
        broadcast()
      })
    } else if (role === 'spy' && (team === 'red' || team === 'blue') && token === game.tokens[team]) {
      socket.join(team)
      const reply = (err) => (err ? socket.emit('error-msg', err) : broadcast())
      socket.on('guess', (i) => reply(guess(game, team, i)))
      socket.on('pass', () => reply(pass(game, team)))
    } else {
      socket.emit('error-msg', 'Link inválido. Lê o QR code na TV outra vez.')
      return socket.disconnect()
    }

    socket.on('disconnect', broadcast)
    broadcast()
  })

  server.on('error', (e) => {
    if (e.code !== 'EADDRINUSE') throw e
    console.error(`\nA porta ${port} já está ocupada. Usa outra: PORT=4001 npm run dev\n`)
    process.exit(1)
  })
  server.listen(port, '0.0.0.0', () => {
    console.log(`TV:  http://localhost:${port}`)
    console.log(`LAN: ${baseUrl}`)
  })
})
