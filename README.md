# Office Combat - Phaser & Socket.IO Game

## 1. Game Overview

Office Combat is a simple top-down multiplayer browser game where players control characters in an office setting and engage in combat. The last player standing wins (implicitly). 

Currently, the game uses placeholder graphics for the environment and characters. The player characters are represented by directional placeholder sprites to indicate their facing direction.

## 2. Features

*   **Real-time Multiplayer:** Uses Socket.IO for communication. While the server doesn't enforce a hard limit, it's designed for a small number of players (e.g., up to 4).
*   **Top-Down View:** Classic 2D top-down perspective.
*   **Player Movement:** Players can move using Arrow Keys or WASD.
*   **Combat System:**
    *   **Health:** Players have 3 health points.
    *   **Melee Attack:** Players can attack using the Spacebar.
    *   **Knock-Out (KO):** Players are KO'd when their health reaches 0. KO'd players cannot move or attack.
*   **Basic UI:**
    *   Local player's health is displayed on screen.
    *   Other players' health is displayed above their characters.
*   **Placeholder Pixel-Art Style:**
    *   The game aims for a pixel-art look.
    *   Player characters currently use dynamically generated directional placeholder sprites (a colored rectangle with an indicator for direction).
    *   The office environment requires a user-provided tileset.

## 3. Technologies Used

*   **Phaser 3:** A fast, free, and fun open-source HTML5 game framework.
*   **Node.js:** JavaScript runtime environment for the server.
*   **Socket.IO:** Library for real-time, bidirectional and event-based communication between web clients and servers.
*   **Express.js:** Minimalist web framework for Node.js (used to serve client files and integrate Socket.IO).
*   **HTML, CSS, JavaScript:** Core web technologies.

## 4. Prerequisites for Local Setup

*   **Node.js and npm:** Ensure you have Node.js installed, which includes npm (Node Package Manager). You can download it from [nodejs.org](https://nodejs.org/).

## 5. Setup and Running Locally

1.  **Clone/Download Code:**
    *   Clone this repository or download the source code files.
2.  **Install Dependencies:**
    *   Open your terminal or command prompt in the project's root directory.
    *   Run the command:
        ```bash
        npm install
        ```
        This will install Phaser, Socket.IO, Express, and any other necessary dependencies listed in `package.json`.
3.  **Run the Server:**
    *   In the terminal, from the project's root directory, run:
        ```bash
        node server.js
        ```
    *   You should see a message like `Server listening on port 3000`.
4.  **Play the Game:**
    *   Open your web browser (e.g., Chrome, Firefox).
    *   Navigate to `index.html` in your project directory (usually by opening the file directly or via `http://localhost:3000/index.html` if your server is set up to serve it from the root, which this one is).
    *   To simulate multiple players, open `index.html` in several browser tabs or windows. Each tab will connect as a new player.
    *   The client-side code in `game.js` connects to the server at `http://localhost:3000` by default.

## 6. Controls

*   **Arrow Keys** or **WASD Keys:** Move your character (Up, Down, Left, Right).
*   **Spacebar:** Perform an attack.

## 7. Gameplay

*   **Objective:** The implied objective is to be the last player standing by knocking out all other players.
*   **Health:** Each player starts with 3 health points.
*   **Attacking:** Pressing the attack key will make your character perform a melee attack in the direction they are facing. There's a short cooldown between attacks.
*   **Knock-Out (KO):** When a player's health drops to 0, they are KO'd. KO'd players cannot move or attack and will be visually indicated as such (e.g., tinted gray). Their health display will show "KO".

## 8. Missing Assets (Important Note)

This game project currently uses dynamically generated placeholder graphics for player characters and relies on the user to provide the main environment tileset.

*   **Required Tileset:** You **must** provide an `assets/office_tileset.png` file.
    *   This should be a 16x16 pixel art tileset.
    *   The tiles should be arranged in the following order (from first tile onwards) to match the `assets/office_map.json` data:
        1.  Floor tile
        2.  Wall tile
        3.  Desk tile
        4.  Chair tile
        5.  Computer tile
    *   Without this tileset, the game map will not render correctly (likely showing black or missing tiles).
*   **Player Character Spritesheets:**
    *   Currently, players are represented by simple colored rectangles with directional indicators.
    *   For proper animations (idle, walking, attacking in different directions), you would need to create or find pixel-art character spritesheets and integrate them into `Player.js` using Phaser's animation system.

## 9. Deployment to Free Hosting Services (General Guidelines)

This game consists of two main parts that need to be considered for deployment:

*   **Client (Static Files):** `index.html`, `game.js`, `Player.js`, and the `assets/` folder (including the `office_tileset.png` you provide).
*   **Server (Node.js & Socket.IO):** `server.js` and `package.json` (plus `node_modules` after installation).

### Client Deployment:

The client-side files can be hosted on any static web hosting service. Popular free options include:

*   **GitHub Pages:** Good for projects hosted on GitHub.
*   **Netlify:** Offers drag-and-drop deployment, CI/CD.
*   **Vercel:** Similar to Netlify, great for frontend projects.
*   **Glitch, Replit:** These platforms can host both static sites and Node.js servers (see below).

You would typically upload the client-side files and folders to these services.

### Server Deployment:

The Node.js server (for Socket.IO communication) needs a hosting environment that supports Node.js. Free tiers are available on several platforms:

*   **Glitch:** Allows you to remix (clone) Node.js projects and run them. Easy to get started.
*   **Replit:** Similar to Glitch, provides an online IDE and hosting for Node.js apps.
*   **Heroku (Free Tier - check current availability):** Historically popular, though free offerings may change. Requires using Git for deployment.
*   **Fly.io, Railway.app:** Other modern platforms with potential free tiers for small applications.
*   **Render:** Also offers free tiers for web services that might fit a Node.js server.

**Important:** When you deploy your server, it will have a public URL (e.g., `https://your-game-server.glitch.me`). You **must** update the client-side code in `game.js` to connect to this public URL:

```javascript
// In game.js, change this line in MainScene.create():
// From:
this.socket = io('http://localhost:3000'); 
// To (example):
this.socket = io('https://your-deployed-server-url.com'); 
```

### Considerations for Server Deployment:

*   **WebSockets:** Ensure your chosen hosting platform supports WebSockets, which Socket.IO relies on. Most Node.js hosting platforms do.
*   **Socket.IO Documentation:** For more advanced deployment scenarios or troubleshooting, refer to the [Socket.IO documentation on deployment](https://socket.io/docs/v4/hosting/).

### Alternative: Managed Multiplayer Services

For more scalable or production-ready multiplayer games, you might consider services that abstract away some of the server management, like:

*   **Colyseus Arena:** Offers a free tier and handles much of the server infrastructure for stateful multiplayer games. This project uses a custom Socket.IO server, so migrating would require adapting the server logic.

---

Enjoy the game!
