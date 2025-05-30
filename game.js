class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null; // Player reference
        this.cursors = null; // Cursor keys reference
        this.attackKey = null; // Attack key (Spacebar)
        this.socket = null; // Socket.IO client instance
        this.otherPlayers = null; // Group for other players' sprites
        this.localPlayerHealthText = null; // UI Text for local player's health
    }

    preload() {
        // Load tileset image (user needs to provide this file)
        this.load.image('officeTiles', 'assets/office_tileset.png');
        
        // Load tilemap data
        this.load.tilemapTiledJSON('officeMap', 'assets/office_map.json');

        // Player placeholder texture is generated in Player.js constructor if needed
        // No specific preload needed here for it unless Player.js changes that logic
    }

    create() {
        // Initialize Socket.IO client connection
        this.socket = io('http://localhost:3000'); // Ensure this matches your server address

        // Group to hold other players' sprites
        this.otherPlayers = this.physics.add.group();

        // Create the map
        const map = this.make.tilemap({ key: 'officeMap' });

        // Add the tileset to the map
        // The first parameter is the name of the tileset in Tiled (or the tileset name in the JSON if embedded)
        // The second parameter is the key of the loaded image in Phaser's cache
        const tileset = map.addTilesetImage('office_tileset', 'officeTiles'); // Assuming 'office_tileset' is the name used in Tiled for the tileset image.
                                                                            // If office_map.json has a different name for the tileset, it should be used here.
                                                                            // Let's check office_map.json again. It refers to office_tileset.tsx
                                                                            // Phaser might be able to infer the name if the tileset is embedded or if only one is used.
                                                                            // For robustness, it's better if the JSON `tilesets[0].name` matches what's used in Tiled.
                                                                            // Since I created the JSON, I'll assume the tileset name within Tiled would be 'office_tileset'

        // Create layers
        const floorLayer = map.createLayer('Floor', tileset, 0, 0);
        const wallsLayer = map.createLayer('Walls', tileset, 0, 0);
        const objectsLayer = map.createLayer('Objects', tileset, 0, 0);
        if (objectsLayer) objectsLayer.setCollisionByExclusion([-1]);

        // Example: Set collision for walls if needed (optional for now)
        // wallsLayer.setCollisionByExclusion([-1]); // Assuming -1 means no tile, or use specific tile indices

        // Adjust camera if map is larger than game size
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        // this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels); // If using physics

        // Set up physics bounds to match the map dimensions
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Instantiate Player
        // Place player at a specific tile position (e.g., tile 2,2), converting to pixels
        const playerStartX = map.tileToWorldX(2); 
        const playerStartY = map.tileToWorldY(2);
        this.player = new Player(this, playerStartX, playerStartY);

        // Setup camera to follow player
        this.cameras.main.startFollow(this.player);
        // Ensure camera does not go outside map boundaries
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Create cursor keys for input
        this.cursors = this.input.keyboard.createCursorKeys();
        // Create attack key
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // --- Local Player Health UI ---
        this.localPlayerHealthText = this.add.text(20, 20, `Health: ${this.player ? this.player.health : 'N/A'}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial' // Or a pixel font if available
        });
        this.localPlayerHealthText.setScrollFactor(0); // Keep it fixed on screen
        this.localPlayerHealthText.setDepth(100); // Ensure it's on top of other elements


        // Add collision between player and walls layer (optional, but good for a tilemap)
        // Need to set collision properties on the wallsLayer first
        // For example, if tile index 2 in 'officeTiles' is a wall:
        // wallsLayer.setCollisionByExclusion([-1]); // or map.setCollision(2, true, true, 'Walls');
        // this.physics.add.collider(this.player, wallsLayer);
        // For now, let's assume wallsLayer.setCollisionByProperty({ collides: true }) was set in Tiled
        // or use wallsLayer.setCollisionBetween(startIndex, endIndex) if you know tile IDs for walls
        // For simplicity, if 'Walls' layer exists and has tiles, let's try generic collision:
        if (wallsLayer) {
            wallsLayer.setCollisionByExclusion([-1]); // Collide with all tiles in 'Walls' layer
            this.physics.add.collider(this.player, wallsLayer);
            this.physics.add.collider(this.otherPlayers, wallsLayer); // Other players also collide with walls
        }

        // Add collision with Objects layer
        if (objectsLayer) { // Check if objectsLayer exists
            this.physics.add.collider(this.player, objectsLayer);
            this.physics.add.collider(this.otherPlayers, objectsLayer);
        }

        // --- Socket.IO Event Handlers ---
        this.socket.on('currentPlayers', (players) => {
            Object.keys(players).forEach((id) => {
                if (players[id].playerId === this.socket.id) {
                    // This is the current client's player, server data might be more up-to-date for initial pos
                    // Or rely on Player.js constructor for initial placement, then server updates
                    // For now, we let Player.js handle its own creation, but could sync initial pos from server here.
                    // If player object already exists, update its position if needed.
                    // Also update health if server has it (e.g. on reconnect)
                    if(this.player) {
                        this.player.setPosition(players[id].x, players[id].y);
                        this.player.setAngle(players[id].angle);
                        if (players[id].health !== undefined) {
                            this.player.health = players[id].health;
                        }
                        if (players[id].isKO) {
                            this.player.setKO();
                        }
                    }
                } else {
                    // Add other players
                    this.addOtherPlayer(players[id]);
                }
            });
        });

        this.socket.on('newPlayer', (playerInfo) => {
            this.addOtherPlayer(playerInfo);
        });

        this.socket.on('playerDisconnected', (playerId) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerId === otherPlayer.playerId) {
                    // Fix: Explicitly destroy the health text associated with the otherPlayer
                    if (otherPlayer.healthText) {
                        otherPlayer.healthText.destroy();
                        otherPlayer.healthText = null; // Good practice
                    }
                    otherPlayer.destroy(); // Destroy the player sprite itself
                }
            });
        });

        this.socket.on('playerMoved', (playerInfo) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                    // No longer relying on angle for direct visual rotation of a generic sprite for remotes
                    // otherPlayer.setAngle(playerInfo.angle); 
                    if (otherPlayer.isKO) return;

                    // Update texture based on facing direction for remote player
                    let newTextureKey = otherPlayer.texture.key;
                    if (playerInfo.facing === 'up') newTextureKey = otherPlayer.dirTextureKeys.up;
                    else if (playerInfo.facing === 'down') newTextureKey = otherPlayer.dirTextureKeys.down;
                    else if (playerInfo.facing === 'left') newTextureKey = otherPlayer.dirTextureKeys.left;
                    else if (playerInfo.facing === 'right') newTextureKey = otherPlayer.dirTextureKeys.right;

                    if (otherPlayer.texture.key !== newTextureKey) {
                        otherPlayer.setTexture(newTextureKey);
                    }
                    otherPlayer.setAngle(0); // Ensure angle is reset for directional textures

                    // Visual cue for movement (tinting the base directional sprite)
                    otherPlayer.setTint(playerInfo.color); // Apply their assigned color
                    this.time.delayedCall(100, () => { 
                        if (!otherPlayer.isKO) otherPlayer.clearTint(); // Clear tint if not KO'd
                        else otherPlayer.setTint(0x808080); // Re-apply KO tint if KO'd during this brief period
                    });
                }
            });
        });

        // Listen for attack broadcasts from server
        this.socket.on('playerAttacked', ({ playerId }) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerId === otherPlayer.playerId && !otherPlayer.isKO) {
                    // Visual cue for other player attacking
                    otherPlayer.setTint(0xffaa00); // Orange tint for attack
                    this.time.delayedCall(100, () => { otherPlayer.clearTint(); });
                }
            });
        });

        this.socket.on('playerHealthUpdate', ({ playerId, health }) => {
            if (this.socket.id === playerId) {
                if (this.player) { // Ensure player is initialized
                    this.player.health = health;
                    console.log(`My health updated to: ${this.player.health}`);
                    if (this.localPlayerHealthText) {
                        this.localPlayerHealthText.setText(`Health: ${this.player.health}`);
                    }
                    // If player took damage, Player.js takeDamage method handles local tint
                }
            } else {
                this.otherPlayers.getChildren().forEach((otherPlayer) => {
                    if (playerId === otherPlayer.playerId) {
                        otherPlayer.health = health; // Store health on sprite
                        console.log(`Player ${otherPlayer.playerId} health updated to: ${health}`);
                        if (otherPlayer.healthText) {
                            otherPlayer.healthText.setText(health > 0 ? `${health}` : 'KO');
                        }
                        if (!otherPlayer.isKO && health > 0) { // Don't tint if already KO'd and gray, or if health is 0
                           otherPlayer.setTint(0xff0000); // Red tint for damage taken
                           this.time.delayedCall(100, () => { otherPlayer.clearTint(); });
                        }
                    }
                });
            }
        });

        this.socket.on('playerKO', ({ playerId }) => {
            if (this.socket.id === playerId) {
                if (this.player) { // Ensure player is initialized
                    this.player.setKO();
                    if (this.localPlayerHealthText) {
                        this.localPlayerHealthText.setText('Health: KO');
                    }
                    // Could show a "You are KO'd" message on screen
                }
            } else {
                this.otherPlayers.getChildren().forEach((otherPlayer) => {
                    if (playerId === otherPlayer.playerId) {
                        otherPlayer.isKO = true; // Mark as KO
                        otherPlayer.setTint(0x808080); // Gray tint
                        if (otherPlayer.body) otherPlayer.body.enable = false; // Disable physics
                        if (otherPlayer.healthText) {
                            otherPlayer.healthText.setText('KO');
                        }
                        // Could also make them disappear: otherPlayer.destroy(); 
                        // or play KO animation
                    }
                });
            }
        });
    }

    addOtherPlayer(playerInfo) {
        const remotePlayerTextureBaseKey = 'remote_player_placeholder';
        const remoteDirTextureKeys = {
            down: `${remotePlayerTextureBaseKey}_down`,
            up: `${remotePlayerTextureBaseKey}_up`,
            left: `${remotePlayerTextureBaseKey}_left`,
            right: `${remotePlayerTextureBaseKey}_right`
        };

        // Generate standardized directional textures for remote players if they don't exist
        // These will be gray with a white indicator. They will then be tinted by playerInfo.color.
        if (!this.textures.exists(remoteDirTextureKeys.down)) {
            const w = 32, h = 48; // Player dimensions
            const indicatorSize = 8;
            const mainColor = 0x808080; // Gray base for remote players
            const indicatorColor = 0xffffff; // White indicator

            let gfx = this.make.graphics();
            // Down
            gfx.fillStyle(mainColor); gfx.fillRect(0, 0, w, h);
            gfx.fillStyle(indicatorColor); gfx.fillRect((w - indicatorSize) / 2, h - indicatorSize, indicatorSize, indicatorSize);
            gfx.generateTexture(remoteDirTextureKeys.down, w, h); gfx.clear();
            // Up
            gfx.fillStyle(mainColor); gfx.fillRect(0, 0, w, h);
            gfx.fillStyle(indicatorColor); gfx.fillRect((w - indicatorSize) / 2, 0, indicatorSize, indicatorSize);
            gfx.generateTexture(remoteDirTextureKeys.up, w, h); gfx.clear();
            // Left
            gfx.fillStyle(mainColor); gfx.fillRect(0, 0, w, h);
            gfx.fillStyle(indicatorColor); gfx.fillRect(0, (h - indicatorSize) / 2, indicatorSize, indicatorSize);
            gfx.generateTexture(remoteDirTextureKeys.left, w, h); gfx.clear();
            // Right
            gfx.fillStyle(mainColor); gfx.fillRect(0, 0, w, h);
            gfx.fillStyle(indicatorColor); gfx.fillRect(w - indicatorSize, (h - indicatorSize) / 2, indicatorSize, indicatorSize);
            gfx.generateTexture(remoteDirTextureKeys.right, w, h);
            gfx.destroy();
        }
        
        // Determine initial texture based on facing direction
        let initialTextureKey = remoteDirTextureKeys.down;
        if (playerInfo.facing === 'up') initialTextureKey = remoteDirTextureKeys.up;
        else if (playerInfo.facing === 'left') initialTextureKey = remoteDirTextureKeys.left;
        else if (playerInfo.facing === 'right') initialTextureKey = remoteDirTextureKeys.right;

        const otherPlayer = this.physics.add.sprite(playerInfo.x, playerInfo.y, initialTextureKey);
        otherPlayer.dirTextureKeys = remoteDirTextureKeys; // Store for updates
        otherPlayer.playerId = playerInfo.playerId;
        otherPlayer.setCollideWorldBounds(true);
        otherPlayer.health = playerInfo.health === undefined ? 3 : playerInfo.health;
        otherPlayer.isKO = playerInfo.isKO || false;
        otherPlayer.setTint(playerInfo.color); // Tint the gray base sprite with their assigned color

        // Add health text above the other player
        const healthText = this.add.text(otherPlayer.x, otherPlayer.y - 30, `${otherPlayer.health}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5, 1);
        otherPlayer.healthText = healthText; // Attach to sprite for easy access

        if (otherPlayer.isKO) {
            otherPlayer.setTint(0x808080);
            if (otherPlayer.body) otherPlayer.body.enable = false;
            otherPlayer.healthText.setText('KO');
        }
        // Potentially set body size/offset if different from default or if using different sprites later
        // otherPlayer.body.setSize(16, 16); 
        // otherPlayer.body.setOffset(8, 32);
        this.otherPlayers.add(otherPlayer);
    }

    update(time, delta) { // Phaser scenes pass time and delta to update
        // Game logic here
        const attackKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.attackKey);

        if (this.player && this.socket) { // Ensure player and socket exist
            this.player.update(this.cursors, attackKeyJustPressed); // Pass attack key state
            
            // Update local player health UI if player just got initialized by server
            // (or if health was somehow changed outside of normal event flow)
            if (this.localPlayerHealthText && this.player.health !== undefined) {
                 const currentUIText = this.localPlayerHealthText.text.split(': ')[1];
                 const playerHealthStr = this.player.isKO ? 'KO' : `${this.player.health}`;
                 if (currentUIText !== playerHealthStr) {
                    this.localPlayerHealthText.setText(`Health: ${playerHealthStr}`);
                 }
            }

            // Emit player movement
            const movementData = { 
                x: this.player.x, 
                y: this.player.y, 
                angle: this.player.angle, // Keep angle for now, might be useful for other things
                facing: this.player.facing // Add facing direction
            };
            this.socket.emit('playerMovement', movementData);
        }

        // Update other players' health text positions
        this.otherPlayers.getChildren().forEach(otherPlayerSprite => {
            if (otherPlayerSprite.healthText && otherPlayerSprite.active) {
                otherPlayerSprite.healthText.setPosition(otherPlayerSprite.x, otherPlayerSprite.y - 30); // Adjust offset as needed
                 if (otherPlayerSprite.isKO && otherPlayerSprite.healthText.text !== 'KO') {
                    otherPlayerSprite.healthText.setText('KO');
                }
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800, // Adjust as needed
    height: 600, // Adjust as needed
    physics: { // Need to enable arcade physics
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down game, so no global gravity
            debug: false // Set to true for physics debugging
        }
    },
    scene: MainScene,
    parent: 'game-container',
    pixelArt: true // Good for pixel art tilemaps
};

const game = new Phaser.Game(config);
