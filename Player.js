class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) { // Removed textureKey default, will manage textures internally
        // Define directional texture keys
        const baseTextureKey = 'player_placeholder';
        const dirTextureKeys = {
            down: `${baseTextureKey}_down`,
            up: `${baseTextureKey}_up`,
            left: `${baseTextureKey}_left`,
            right: `${baseTextureKey}_right`
        };

        // Generate directional textures if they don't exist
        if (!scene.textures.exists(dirTextureKeys.down)) { // Check one, assume all need generating
            const w = 32, h = 48; // Player dimensions
            const indicatorSize = 8; // Size of the direction indicator
            const mainColor = 0xff0000; // Red
            const indicatorColor = 0x0000ff; // Blue

            // Down
            let graphics = scene.make.graphics();
            graphics.fillStyle(mainColor, 1);
            graphics.fillRect(0, 0, w, h);
            graphics.fillStyle(indicatorColor, 1);
            graphics.fillRect((w - indicatorSize) / 2, h - indicatorSize, indicatorSize, indicatorSize); // Bottom-middle
            graphics.generateTexture(dirTextureKeys.down, w, h);
            graphics.destroy();

            // Up
            graphics = scene.make.graphics();
            graphics.fillStyle(mainColor, 1);
            graphics.fillRect(0, 0, w, h);
            graphics.fillStyle(indicatorColor, 1);
            graphics.fillRect((w - indicatorSize) / 2, 0, indicatorSize, indicatorSize); // Top-middle
            graphics.generateTexture(dirTextureKeys.up, w, h);
            graphics.destroy();

            // Left
            graphics = scene.make.graphics();
            graphics.fillStyle(mainColor, 1);
            graphics.fillRect(0, 0, w, h);
            graphics.fillStyle(indicatorColor, 1);
            graphics.fillRect(0, (h - indicatorSize) / 2, indicatorSize, indicatorSize); // Left-middle
            graphics.generateTexture(dirTextureKeys.left, w, h);
            graphics.destroy();

            // Right
            graphics = scene.make.graphics();
            graphics.fillStyle(mainColor, 1);
            graphics.fillRect(0, 0, w, h);
            graphics.fillStyle(indicatorColor, 1);
            graphics.fillRect(w - indicatorSize, (h - indicatorSize) / 2, indicatorSize, indicatorSize); // Right-middle
            graphics.generateTexture(dirTextureKeys.right, w, h);
            graphics.destroy();
        }
        
        super(scene, x, y, dirTextureKeys.down); // Default to facing down

        this.dirTextureKeys = dirTextureKeys; // Store for later use

        this.scene = scene;
        this.health = 3;
        this.maxHealth = 3;
        this.isKO = false; // Player Knocked Out state
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        // Set some physics properties
        this.setCollideWorldBounds(true); // Don't let player go off screen (initially, will be map bounds)
        // Adjust hitbox size for better collision feel with tiles and other entities.
        // For a 32x48 sprite, a smaller hitbox centered towards the "feet" often works well.
        this.body.setSize(16, 16); 
        this.body.setOffset(8, 32); // Offset to align hitbox with bottom-middle of sprite.

        // Movement speed
        this.speed = 160; // Pixels per second

        // Animation keys (placeholders for spritesheet animations)
        this.animKeys = {
            idle: 'player_idle',
            walkDown: 'player_walk_down',
            walkUp: 'player_walk_up',
            walkLeft: 'player_walk_left',
            walkRight: 'player_walk_right'
        };
        this.currentAnim = this.animKeys.idle; // Current animation state key

        // Player's facing direction ('up', 'down', 'left', 'right')
        this.facing = 'down'; 
        
        // Attack timing variables
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // Milliseconds
    }

    /**
     * Main update loop for the player.
     * Handles input for movement and attacks.
     * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Cursor keys object.
     * @param {boolean} attackKeyJustPressed - True if the attack key was just pressed.
     */
    update(cursors, attackKeyJustPressed) { 
        if (this.isKO) {
            this.body.setVelocity(0); // Stop all movement if KO'd
            // this.setAlpha(0.5); // Example: make player semi-transparent when KO'd
            return; // Skip further processing if KO'd
        }

        this.body.setVelocity(0); // Reset velocity each frame for direct control

        let newFacing = this.facing;
        let newAnim = this.animKeys.idle; // Default to idle animation

        // Horizontal movement input
        if (cursors.left.isDown) {
            this.body.setVelocityX(-this.speed);
            newFacing = 'left';
            newAnim = this.animKeys.walkLeft;
        } else if (cursors.right.isDown) {
            this.body.setVelocityX(this.speed);
            newFacing = 'right';
            newAnim = this.animKeys.walkRight;
        }

        // Vertical movement input
        if (cursors.up.isDown) {
            this.body.setVelocityY(-this.speed);
            newFacing = 'up';
            newAnim = this.animKeys.walkUp;
        } else if (cursors.down.isDown) {
            this.body.setVelocityY(this.speed);
            newFacing = 'down';
            newAnim = this.animKeys.walkDown;
        }

        // Normalize velocity for consistent speed during diagonal movement
        this.body.velocity.normalize().scale(this.speed);
        
        // Update facing direction if moving
        if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
            this.facing = newFacing;
        } else {
            newAnim = this.animKeys.idle; // If no velocity, set to idle
        }
        
        // Update current animation state (used for spritesheet animations later)
        this.currentAnim = newAnim; 


        // --- Visual Updates ---
        // Update texture based on facing direction for placeholder sprites
        if (!this.isKO) {
            let newTextureKeyToSet = this.texture.key;
            if (this.facing === 'up') newTextureKeyToSet = this.dirTextureKeys.up;
            else if (this.facing === 'down') newTextureKeyToSet = this.dirTextureKeys.down;
            else if (this.facing === 'left') newTextureKeyToSet = this.dirTextureKeys.left;
            else if (this.facing === 'right') newTextureKeyToSet = this.dirTextureKeys.right;

            if (this.texture.key !== newTextureKeyToSet) {
                this.setTexture(newTextureKeyToSet);
            }
            this.setAngle(0); // Ensure angle is reset if using directional textures
        }
        // Note: Actual spritesheet animation playback (this.anims.play(...)) is commented out
        // as spritesheets are not yet implemented.

        // Di error no hace nada, pero si se implementan animaciones, se podría hacer algo como:
        // // Handle attack input
        // if (attackKeyJustPressed) {
        //         }
        //     }
        // }

        // Handle attack input
        if (attackKeyJustPressed) {
            this.tryAttack();
        }
    }

    tryAttack() {
        if (this.isKO) return;

        const now = this.scene.time.now;
        if (now - this.lastAttackTime > this.attackCooldown) {
            this.lastAttackTime = now;
            this.attack();
        }
    }

    attack() {
        if (this.isKO) return;

        console.log(`Player ${this.scene.socket.id} attacked.`); // Assuming socket ID is available on scene
        // Visual cue for attack
        this.setTint(0xffff00); // Yellow tint
        this.scene.time.delayedCall(100, () => {
            if (!this.isKO) this.clearTint(); // Clear tint unless KO'd
        });

        // Emit attack to server (Part 2.3)
        this.scene.socket.emit('playerAttack', { /* any relevant attack data */ });

        // Client-side hit detection (Part 2.2)
        // For simplicity, let's define an attack range
        const attackRange = 60; // pixels, adjust as needed
        const attackRect = new Phaser.Geom.Rectangle(this.x - attackRange/2, this.y - attackRange/2, attackRange, attackRange);
        // Adjust rect based on player facing direction if desired (more complex)
        // Example: if (this.facing === 'left') attackRect.x -= this.width / 2; 
        // For now, a simple circle around the player might be easier or a fixed rect.
        // Let's use a rectangle slightly in front based on facing.
        let hitArea = new Phaser.Geom.Rectangle(this.x, this.y, this.width, this.height); // Base area on player
        const offset = 30; // How far in front the attack area extends

        if (this.facing === 'left') {
            hitArea.x -= offset;
        } else if (this.facing === 'right') {
            hitArea.x += offset;
        } else if (this.facing === 'up') {
            hitArea.y -= offset;
        } else if (this.facing === 'down') {
            hitArea.y += offset;
        }
        // For simplicity, let's make the hitArea a bit larger than the player
        hitArea.setSize(this.width * 1.5, this.height * 1.5);
        hitArea.centerX = this.x + (this.facing === 'left' ? -offset : (this.facing === 'right' ? offset : 0));
        hitArea.centerY = this.y + (this.facing === 'up' ? -offset : (this.facing === 'down' ? offset : 0));


        this.scene.otherPlayers.getChildren().forEach(otherPlayerSprite => {
            if (otherPlayerSprite.active && Phaser.Geom.Intersects.RectangleToRectangle(hitArea, otherPlayerSprite.getBounds())) {
                console.log(`Client detected hit on ${otherPlayerSprite.playerId}`);
                this.scene.socket.emit('playerHit', { targetId: otherPlayerSprite.playerId });
            }
        });
    }

    takeDamage(amount) {
        if (this.isKO) return;

        this.health -= amount;
        console.log(`Player ${this.scene.socket.id} health: ${this.health}`);
        if (this.health <= 0) {
            this.health = 0;
            // this.setKO(); // Server will tell us if we are KO'd
        }
        // Add visual feedback for taking damage if desired (e.g., tint red)
        this.setTint(0xff0000); // Red tint
        this.scene.time.delayedCall(100, () => {
            if (!this.isKO) this.clearTint();
        });
    }

    setKO() {
        this.isKO = true;
        this.setTint(0x808080); // Gray tint
        this.body.setVelocity(0);
        this.body.enable = false; // Disable physics body
        console.log(`Player ${this.scene.socket.id} is KO'd.`);
        // Could also play a KO animation or make sprite disappear
    }
}

// If using modules, you might export the class:
// export default Player;
// For simplicity without a build step, Player will be a global if index.html includes Player.js before game.js
        
// It's good practice to ensure Player.js is loaded before game.js in index.html
// <script src="Player.js"></script>
// <script src="game.js"></script>
