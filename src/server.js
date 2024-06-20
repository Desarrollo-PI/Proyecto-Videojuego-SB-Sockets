"use strict"

const { Server, Socket } = require("socket.io")
const localURL = "http://localhost:3000"
const clientURL = "https://proyecto-videojuego-sb.vercel.app"
const port = 5000
const io = new Server({
	cors: {
		origin: [localURL, clientURL]
	}
})

let players = []
let enemies = []
let ivys = []

io.on('connection', (socket) => {
	console.log(
		'Player joined with ID' +
		socket.id +
		'. There are ' +
		io.engine.clientsCount +
		' players connected'
	)

	socket.on('player-connected', () => {
		const sizePlayers = players.length
		const haveLeviosaOtherPlayer = players.find(player => player.haveLeviosa === true)

		players.push({
			id: socket.id,
			leader: players.length === 0 ? true : false,
			position: null,
			rotation: null,
			animation: "Idle",
			haveLeviosa: sizePlayers === 0 ? true : haveLeviosaOtherPlayer ? false : true
		})
		console.log(
			'Player entered game with ID' +
			socket.id +
			'. There are ' +
			players.length +
			' players in game'
		)
	})

	socket.on('leader', () => {
		io.emit('status-leader', players)
	})

	socket.on('create-enemies', (initialEnemies) => {
		const player = players.find(player => player.id === socket.id)
		if (player.leader) {
			enemies = initialEnemies
		}
	})

	socket.on('values-enemy', (valuesEnemy) => {
		const enemy = enemies.find(enemy => enemy.id === valuesEnemy.id)
		if (enemy) {
			if (valuesEnemy.position && valuesEnemy.rotation) {
				enemy.position = valuesEnemy.position
				enemy.rotation = valuesEnemy.rotation
				enemy.life = valuesEnemy.life
			}
			socket.broadcast.emit('updates-values-enemy', enemy)
		}
	})

	socket.on('moving-player', (valuesTransformPlayer) => {
		const player = players.find(player => player.id === socket.id)
		if (player) {
			if (valuesTransformPlayer.position && valuesTransformPlayer.rotation) {
				player.position = valuesTransformPlayer.position
				player.rotation = valuesTransformPlayer.rotation
			}
			socket.broadcast.emit('updates-values-transform-player', player)
		}
	})

	socket.on('change-animation', (animation) => {
		const player = players.find(player => player.id === socket.id)
		if (player) {
			player.animation = animation
			socket.broadcast.emit('updates-animation', player)
		}
	})

	socket.on('hit-second-player', () => {
		const player = players.find(player => player.id !== socket.id)
		if (player) {
			socket.to(player.id).emit('hit-player')
		}
	})

	socket.on('hit-enemy', (values) => {
		socket.broadcast.emit('enemy-damaged', values)
	})

	socket.on('hit-leviosa', () => {
		const player = players.find(player => player.id !== socket.id)
		console.log(player)
		if (player) {
			socket.broadcast.emit('updates-values-leviosa', player)
		}
	})

	socket.on('player-dead', () => {
		const player = players.find(player => player.id !== socket.id)
		if (player) {
			socket.broadcast.emit('updates-player-dead', player)
		}
	})

	socket.on('player-disconnected', () => {
		players = players.filter(player => player.id !== socket.id)
		if (players.length !== 0) {
			const leader = players.find(player => player.leader === true)
			if (!leader) {
				const player = players.find(() => true)
				player.leader = true
				io.emit('status-leader', players)
			}
		}
		console.log(
			'Player leave the game with ID' +
			socket.id +
			'. There are ' +
			players.length +
			' players in game'
		)
	})

	socket.on('disconnect', () => {
		players = players.filter(player => player.id !== socket.id)
		if (players.length !== 0) {
			const leader = players.find(player => player.leader === true)
			if (!leader) {
				const player = players.find(() => true)
				player.leader = true
				io.emit('status-leader', players)
			}
		}
		console.log(
			'Player disconnected with ID' +
			socket.id +
			'. There are ' +
			io.engine.clientsCount +
			' players connected'
		)
	})

	socket.on('create-ivys', (initialsIvy) => {
		const player = players.find(player => player.id === socket.id)
		if (player.leader) {
			ivys = initialsIvy
		}
	})

	socket.on('values-ivys', () => {
		socket.emit('updates-values-ivys', ivys)
	})

	socket.on('hit-incendio-in-ivy', (auxIvy) => {
		const ivy = ivys.find(ivy => ivy.id === auxIvy.id)
		if (ivy) {
			io.emit('fire-ivy', ivy)
		}
	})

	socket.on('burn-ivy', (auxIvy) => {
		const ivy = ivys.find(ivy => ivy.id === auxIvy.id)
		if (ivy) {
			ivy.isBurned = true
		}
	})
})

io.listen(port)