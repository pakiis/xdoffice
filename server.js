const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the project root directory (where index.html, game.js, etc. are)
app.use(express.static(__dirname));

// Object to store connected player data. Keyed by socket.id.
// Example player object: { x, y, angle, playerId, health, maxHealth, isKO, color }
let players = {}; 

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Initialize a new player object with default values
    players[socket.id] = {
        x: 160,         // Default starting x position (approx. tile 2,2 for 16x16 tiles, player center)
        y: 160,         // Default starting y position
        angle: 0,       // Initial angle (not used if facing is primary for direction)
        facing: 'down', // Default facing direction
        playerId: socket.id, // Player's unique ID
        health: 3,      // Current health
        maxHealth: 3,   // Maximum health
        isKO: false,    // Knocked-out state
        color: Math.random() * 0xffffff // Random color for client-side placeholder distinction
    };

    // Send the 'currentPlayers' event to the newly connected player.
    // This provides them with data for all players already in the game.
    socket.emit('currentPlayers', players);
    
    // Broadcast the 'newPlayer' event to all other connected clients.
    // This informs them about the new player that just joined.
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle 'disconnect' event for this socket
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        // Remove the player's data from the 'players' object
        delete players[socket.id];
        // Broadcast 'playerDisconnected' to all other clients so they can remove the sprite
        io.emit('playerDisconnected', socket.id);
    });

    // Handle 'playerMovement' event from a client
    socket.on('playerMovement', (movementData) => {
        // Update the player's data on the server if they exist
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // players[socket.id].angle = movementData.angle; // Angle might become secondary to 'facing'
            if (movementData.facing) {
                players[socket.id].facing = movementData.facing;
            }
            
            // Broadcast 'playerMoved' to all *other* clients with the updated data
            // Ensure 'facing' is included
            socket.broadcast.emit('playerMoved', {
                playerId: socket.id,
                x: players[socket.id].x,
                y: players[socket.id].y,
                angle: players[socket.id].angle, // Keep sending angle for now, client can decide
                facing: players[socket.id].facing
            });
        }
    });

    // Handle 'playerAttack' event from a client
    socket.on('playerAttack', (attackData) => {
        // Ignore attacks from non-existent or KO'd players
        if (!players[socket.id] || players[socket.id].isKO) return;

        console.log(`Player ${socket.id} is attacking.`);
        // Broadcast 'playerAttacked' to other clients so they can show a visual cue
        // (e.g., attack animation or tint) for the attacking player.
        socket.broadcast.emit('playerAttacked', { playerId: socket.id });
    });

    // Handle 'playerHit' event (client reports hitting another player)
    socket.on('playerHit', ({ targetId }) => {
        // Validate attacker and target states
        if (!players[socket.id] || players[socket.id].isKO) return; // Attacker invalid or KO'd
        if (!players[targetId] || players[targetId].isKO) return;   // Target invalid or already KO'd

        console.log(`Player ${socket.id} hit Player ${targetId}`);

        // Server-side hit validation (currently simplified: trusts client)
        // TODO: Implement more robust server-side validation in a real game:
        // - Check distance between attacker and target.
        // - Verify attacker is facing target (if applicable).
        // - Check for obstacles or walls.
        // - Potentially re-verify attack cooldown on server.

        // Apply damage to the target player
        players[targetId].health -= 1;
        console.log(`Player ${targetId} health is now ${players[targetId].health}`);

        // Broadcast the health update to all clients
        io.emit('playerHealthUpdate', { playerId: targetId, health: players[targetId].health });

        // Handle player Knock-Out (KO)
        if (players[targetId].health <= 0) {
            players[targetId].health = 0; // Prevent negative health
            players[targetId].isKO = true; // Set KO state
            console.log(`Player ${targetId} is KO'd.`);
            // Broadcast 'playerKO' event to all clients
            io.emit('playerKO', { playerId: targetId });
            
            // Additional KO logic could go here (e.g., respawn timer, disabling further actions server-side)
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
