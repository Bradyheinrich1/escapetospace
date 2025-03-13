// Import assets
import redPlanet from '../assets/red-rocky-planet.png';
import greyPlanet from '../assets/grey-rocky-planet.png';
import starship from '../assets/starship flames.png';
import bluePlanetOne from '../assets/blue-planet-one.png';
import bluePlanetTwo from '../assets/blue-planet-two.png';
import brownPlanetTwo from '../assets/brown-planet-two.png';
import brownRockyPlanet from '../assets/brown-rocky-planet.png';
import dunRockyPlanet from '../assets/dun-rocky-planet.png';
import earthLikePlanet from '../assets/earth-like-planet.png';
import fieryPlanet from '../assets/firery-planet.png';
import greenPlanetOne from '../assets/green-planet-one.png';
import greenPlanetTwo from '../assets/green-planet-two.png';
import purplePlanetOne from '../assets/gpurple-planet-one.png';
import iceRingPlanet from '../assets/ice-ring-planet.png';
import marsLikePlanet from '../assets/mars-like-planet.png';
import pinkPlanetOne from '../assets/pink-planet-one.png';
import pinkPlanetTwo from '../assets/pink-planet-two.png';
import ringPlanetBlue from '../assets/ring-planet-blue.png';
import ringPlanetGreen from '../assets/ring-planet-green.png';
import ringedPlanetBrown from '../assets/ringed-planet-brown.png';
import yellowPlanetOne from '../assets/yellow-planet-one.png';
import halfEarth from '../assets/halfearth.png';

const textStyle = {
    fontFamily: 'Micro 5',
    fontSize: '24px',
    fill: '#fff',
    padding: { x: 10, y: 10 }
};

const gameOverStyle = {
    fontFamily: 'Micro 5',
    fontSize: '800px',
    fill: '#ff0000',
    align: 'center',
    padding: { x: 40, y: 40 },
    stroke: '#000000',
    strokeThickness: 16
};

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.cursors = null;
        this.gameSpeed = -200; // Negative because we're moving upward
        this.worldHeight = 100000; // Height of our game world (10x from 10,000)
        this.asteroids = null;
        this.gameOver = false;
        this.spawnTimer = null;
        this.bigAsteroidTimer = null;
        this.backgroundPlanets = [];
        this.gameWidth = window.innerWidth;
        this.gameHeight = window.innerHeight;
        
        // Player movement speed
        this.playerSpeed = 300;
        
        // Object pooling properties
        this.maxPoolSize = 50; // Maximum number of asteroids to keep in the pool
        this.asteroidPool = []; // Pool for regular asteroids
        this.bigAsteroidPool = []; // Pool for big asteroids
        
        // Culling zone properties
        this.cullingMargin = 400; // Extra margin beyond screen for culling
        this.cullingBounds = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };
        
        // Debug properties
        this.debugMode = false;
        this.debugGraphics = null;
        this.debugText = null;
        this.fpsText = null;
        this.showCollisionDebug = false;
        
        // Spatial partitioning properties
        this.spatialGrid = null;
        this.gridCellSize = 200; // Size of each grid cell
        
        // Font loading properties
        this.fontLoaded = false;
        
        // Player name
        this.playerName = '';
        
        console.log('GameScene constructor called');
    }

    init() {
        console.log('GameScene init called');
        // Get player name from localStorage
        this.playerName = localStorage.getItem('playerName') || 'Unknown';
        console.log('Player name:', this.playerName);
    }

    preload() {
        // Load asteroid sprites (for gameplay)
        this.load.image('asteroid', redPlanet);
        this.load.image('bigAsteroid', greyPlanet);
        this.load.image('player', starship);
        this.load.image('halfEarth', halfEarth);

        // Load all background planet variants
        this.load.image('bluePlanetOne', bluePlanetOne);
        this.load.image('bluePlanetTwo', bluePlanetTwo);
        this.load.image('brownPlanetTwo', brownPlanetTwo);
        this.load.image('brownRockyPlanet', brownRockyPlanet);
        this.load.image('dunRockyPlanet', dunRockyPlanet);
        this.load.image('earthLikePlanet', earthLikePlanet);
        this.load.image('fieryPlanet', fieryPlanet);
        this.load.image('greenPlanetOne', greenPlanetOne);
        this.load.image('greenPlanetTwo', greenPlanetTwo);
        this.load.image('purplePlanetOne', purplePlanetOne);
        this.load.image('iceRingPlanet', iceRingPlanet);
        this.load.image('marsLikePlanet', marsLikePlanet);
        this.load.image('pinkPlanetOne', pinkPlanetOne);
        this.load.image('pinkPlanetTwo', pinkPlanetTwo);
        this.load.image('ringPlanetBlue', ringPlanetBlue);
        this.load.image('ringPlanetGreen', ringPlanetGreen);
        this.load.image('ringedPlanetBrown', ringedPlanetBrown);
        this.load.image('yellowPlanetOne', yellowPlanetOne);
        
        // Ensure font is loaded
        this.fontLoaded = false;
        
        // Create a WebFont loader event
        document.fonts.ready.then(() => {
            this.fontLoaded = true;
        });
    }

    create() {
        console.log('GameScene create called');
        
        // Get player name from localStorage
        this.playerName = localStorage.getItem('playerName') || 'Unknown';
        console.log('Player name in create:', this.playerName);
        
        // Reset game state
        this.gameOver = false;
        this.score = 0;
        
        // Set world bounds (0 to worldHeight for Y, and use full screen width)
        this.physics.world.setBounds(0, 0, this.gameWidth, this.worldHeight);
        
        // Create background
        this.createStarfield();
        
        // Initialize spatial grid first
        this.initSpatialGrid();
        
        // Add Earth at the bottom of the screen
        this.earth = this.add.image(this.gameWidth / 2, this.worldHeight - 100, 'halfEarth');
        this.earth.setScale(0.5);
        
        // Create player
        this.player = this.physics.add.sprite(this.gameWidth / 2, this.worldHeight - 200, 'player');
        this.player.setScale(0.1);
        this.player.setCollideWorldBounds(true);
        
        // Set circular physics body for better collisions
        const playerRadius = this.player.width * 0.3;
        this.player.setCircle(
            playerRadius,
            (this.player.width - playerRadius * 2) / 2,
            (this.player.height - playerRadius * 2) / 2
        );
        
        // Create camera that follows player
        this.cameras.main.startFollow(this.player, true, 0, 1, 0, 200);
        this.cameras.main.setBounds(0, 0, this.gameWidth, this.worldHeight);
        
        // Create asteroids group
        this.asteroids = this.physics.add.group();
        
        // Set up collision detection
        this.setupCollisions();
        
        // Create score text with a fallback font until our custom font is loaded
        const initialTextStyle = {
            fontFamily: this.fontLoaded ? 'Micro 5' : 'monospace',
            fontSize: '24px',
            fill: '#fff',
            padding: { x: 10, y: 10 }
        };
        
        this.scoreText = this.add.text(10, 10, 'HEIGHT: 0', initialTextStyle).setScrollFactor(0);
        
        // Add player name text
        this.playerNameText = this.add.text(
            10, 
            40, 
            `PLAYER: ${this.playerName}`, 
            initialTextStyle
        ).setScrollFactor(0);
        
        // Check if font is loaded, if not, wait for it
        if (!this.fontLoaded) {
            const checkFontLoaded = () => {
                if (document.fonts.check('1em "Micro 5"')) {
                    this.fontLoaded = true;
                    this.scoreText.setStyle(textStyle);
                    this.playerNameText.setStyle(textStyle);
                    return;
                }
                setTimeout(checkFontLoaded, 100);
            };
            checkFontLoaded();
        }
        
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Set up asteroid spawning
        this.spawnTimer = this.time.addEvent({
            delay: 500,
            callback: this.spawnAsteroid,
            callbackScope: this,
            loop: true
        });
        
        // Set up big asteroid spawning (less frequent)
        this.bigAsteroidTimer = this.time.addEvent({
            delay: 5000,
            callback: this.spawnBigAsteroid,
            callbackScope: this,
            loop: true
        });
        
        // Initialize object pools
        this.initializeObjectPools();
        
        // Set up culling bounds
        this.updateCullingBounds();
        
        // Listen for resize events to update culling bounds
        this.scale.on('resize', this.handleResize, this);
        
        // Setup debug visualization
        this.setupDebugMode();
        
        // Add player to spatial grid
        this.spatialGrid.addObject(this.player, this.gridCellSize);
    }
    
    setupCollisions() {
        // We'll use our optimized collision detection instead of Phaser's built-in system
        // But we'll keep this method for organization and future expansion
        
        // DISABLE the built-in collision system to avoid double collision detection
        // this.physics.add.overlap(
        //     this.player,
        //     this.asteroids,
        //     this.handleCollision,
        //     null,
        //     this
        // );
    }
    
    handleCollision(player, asteroid) {
        // Only process if not already game over
        if (this.gameOver) return;
        
        console.log('Collision detected, game over');
        
        // Set game over flag
        this.gameOver = true;
        
        // Stop player movement
        player.setVelocity(0, 0);
        
        // Visual feedback - tint player red
        player.setTint(0xff0000);
        
        // Create explosion effect
        this.createExplosion(player.x, player.y);
        
        // Use a fallback font if our custom font isn't loaded yet
        const gameOverTextStyle = {
            fontFamily: this.fontLoaded ? 'Micro 5' : 'monospace',
            fontSize: '800px',
            fill: '#ff0000',
            align: 'center',
            padding: { x: 40, y: 40 },
            stroke: '#000000',
            strokeThickness: 16
        };
        
        // Show game over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'GAME OVER',
            gameOverTextStyle
        ).setOrigin(0.5).setScrollFactor(0);
        
        // Scale to fit screen
        const scale = Math.min(
            this.cameras.main.width / (gameOverText.width * 1.2),
            this.cameras.main.height / (gameOverText.height * 1.2)
        );
        gameOverText.setScale(scale);
        
        // Show final score with fallback font if needed
        const finalScoreTextStyle = {
            fontFamily: this.fontLoaded ? 'Micro 5' : 'monospace',
            fontSize: '32px',
            fill: '#ffffff',
            align: 'center'
        };
        
        const finalScoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            `FINAL HEIGHT: ${this.score}`,
            finalScoreTextStyle
        ).setOrigin(0.5).setScrollFactor(0);
        
        // Stop asteroid spawning
        this.spawnTimer.remove();
        this.bigAsteroidTimer.remove();
        
        console.log('Transitioning to LeaderboardScene in 3 seconds');
        
        // Show leaderboard after delay
        this.time.delayedCall(3000, () => {
            console.log('Cleaning up scene and starting LeaderboardScene');
            this.cleanupScene();
            this.scene.start('LeaderboardScene', { 
                score: this.score,
                playerName: this.playerName
            });
        });
    }
    
    createExplosion(x, y) {
        // Create particle emitter for explosion effect
        const particles = this.add.particles(x, y, 'asteroid', {
            scale: { start: 0.02, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 800,
            blendMode: 'ADD',
            frequency: -1, // Emit all particles at once
            quantity: 20,
            tint: 0xff0000
        });
        
        // Emit particles
        particles.explode();
        
        // Destroy emitter after animation completes
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }
    
    optimizedCollisionCheck() {
        if (this.gameOver) return;
        
        // Get objects near the player
        const nearbyObjects = this.spatialGrid.getNearbyObjects(
            this.player.x, 
            this.player.y, 
            this.gridCellSize
        );
        
        // Only check collisions with nearby objects
        for (const obj of nearbyObjects) {
            if (obj !== this.player && obj.active) {
                // Get accurate collision radii based on actual scaled size
                const playerRadius = this.player.width * this.player.scale * 0.3;
                const objRadius = obj.width * obj.scale * 0.3;
                
                // Calculate distance between centers
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    obj.x, obj.y
                );
                
                // Check if distance is less than sum of radii (with a small buffer)
                if (distance < (playerRadius + objRadius) * 0.9) {
                    // Add debug visualization of collision if in debug mode
                    if (this.debugMode && this.showCollisionDebug) {
                        this.debugGraphics.lineStyle(2, 0xff0000, 1);
                        this.debugGraphics.strokeCircle(this.player.x, this.player.y, playerRadius);
                        this.debugGraphics.strokeCircle(obj.x, obj.y, objRadius);
                        this.debugGraphics.lineBetween(this.player.x, this.player.y, obj.x, obj.y);
                    }
                    
                    this.handleCollision(this.player, obj);
                    break;
                }
            }
        }
    }

    initializeObjectPools() {
        // Create initial pool of regular asteroids
        for (let i = 0; i < 20; i++) {
            const asteroid = this.physics.add.sprite(0, 0, 'asteroid');
            asteroid.setScale(0.08);
            
            // Set circular physics body
            const radius = asteroid.width * 0.35;
            asteroid.setCircle(radius, 
                (asteroid.width - radius * 2) / 2,
                (asteroid.height - radius * 2) / 2);
                
            // Add to pool and disable
            this.asteroidPool.push(asteroid);
            asteroid.setActive(false);
            asteroid.setVisible(false);
        }
        
        // Create initial pool of big asteroids
        for (let i = 0; i < 5; i++) {
            const bigAsteroid = this.physics.add.sprite(0, 0, 'bigAsteroid');
            bigAsteroid.setScale(0.16);
            
            // Set circular physics body
            const radius = bigAsteroid.width * 0.35;
            bigAsteroid.setCircle(radius,
                (bigAsteroid.width - radius * 2) / 2,
                (bigAsteroid.height - radius * 2) / 2);
                
            // Add to pool and disable
            this.bigAsteroidPool.push(bigAsteroid);
            bigAsteroid.setActive(false);
            bigAsteroid.setVisible(false);
        }
    }
    
    getPooledAsteroid(isLarge = false) {
        // Get from the appropriate pool
        const pool = isLarge ? this.bigAsteroidPool : this.asteroidPool;
        
        // Try to find an inactive asteroid in the pool
        let asteroid = pool.find(a => !a.active);
        
        if (!asteroid) {
            // If pool is full, create a new one
            const texture = isLarge ? 'bigAsteroid' : 'asteroid';
            asteroid = this.physics.add.sprite(0, 0, texture);
            
            // Set appropriate scale
            asteroid.setScale(isLarge ? 0.16 : 0.08);
            
            // Set circular physics body
            const radius = asteroid.width * 0.35;
            asteroid.setCircle(radius,
                (asteroid.width - radius * 2) / 2,
                (asteroid.height - radius * 2) / 2);
                
            // Add to pool
            pool.push(asteroid);
        }
        
        // Activate the asteroid
        asteroid.setActive(true);
        asteroid.setVisible(true);
        
        // Add to the asteroids group for collision detection
        this.asteroids.add(asteroid);
        
        // Add to spatial grid
        this.spatialGrid.addObject(asteroid, this.gridCellSize);
        
        return asteroid;
    }
    
    recycleAsteroid(asteroid) {
        if (!asteroid) return;
        
        // Remove from spatial grid
        if (this.spatialGrid) {
            this.spatialGrid.removeObject(asteroid);
        }
        
        // Remove from physics group but keep in pool
        this.asteroids.remove(asteroid, false, false);
        
        // Deactivate the asteroid
        asteroid.setActive(false);
        asteroid.setVisible(false);
        
        // Reset physics
        asteroid.setVelocity(0, 0);
        asteroid.setAngularVelocity(0);
        asteroid.setPosition(0, 0);
        
        // Clear any other references or properties
        asteroid.cellKey = null;
        asteroid.skipUpdate = false;
    }

    spawnAsteroid() {
        if (this.gameOver) return;

        const cameraY = this.cameras.main.scrollY;
        const spawnY = cameraY - 50;

        if (spawnY < 0) return;

        // Adjust X position range based on screen width
        const x = Phaser.Math.Between(50, this.gameWidth - 50);
        
        // Get asteroid from pool instead of creating new one
        const asteroid = this.getPooledAsteroid(false);
        
        // Position the asteroid
        asteroid.setPosition(x, spawnY);
        
        // Reset scale in case it was modified
        asteroid.setScale(0.08);
        
        // Set constant diagonal velocity with additional downward component
        const angle = Phaser.Math.Between(30, 150); // Angle in degrees (avoiding pure vertical)
        const speed = 80; // Constant speed
        const velocityX = speed * Math.cos(Phaser.Math.DegToRad(angle));
        const velocityY = -speed * Math.sin(Phaser.Math.DegToRad(angle)) + 200; // Add downward velocity component
        asteroid.setVelocity(velocityX, velocityY);
        
        // Add rotation
        asteroid.setAngularVelocity(Phaser.Math.Between(-50, 50));
    }

    spawnBigAsteroid() {
        if (this.gameOver) return;
        
        if (this.score < 2500) return; // Adjusted from 250 to match new world height (10x)

        const cameraY = this.cameras.main.scrollY;
        const spawnY = cameraY - 500;

        if (spawnY < 0) return;

        // Adjust X position range based on screen width
        const x = Phaser.Math.Between(this.gameWidth * 0.3, this.gameWidth * 0.7);
        
        // Get big asteroid from pool
        const asteroid = this.getPooledAsteroid(true);
        
        // Position the asteroid
        asteroid.setPosition(x, spawnY);
        
        // Calculate maximum scale based on screen width (1/3 of screen width)
        const maxScale = (this.gameWidth / 3) / asteroid.width;
        
        // Regular asteroid base scale is 0.08, so we'll start at 2x that
        const baseScale = 0.16; // 2x regular asteroid size
        
        // Adjust growth rate to reach 5x regular size (0.4) more gradually
        const growthScore = Math.max(0, this.score - 2500); // Start growing immediately (adjusted from 250)
        const targetMaxScale = 0.4; // 5x the regular asteroid size (0.08 * 5)
        const scoreScale = (growthScore / 10000) * (targetMaxScale - baseScale); // Adjusted from 1000
        
        // Apply scale with both the score-based growth and the maximum cap
        const scale = Math.min(baseScale + scoreScale, maxScale);
        asteroid.setScale(scale);
        
        // Set downward velocity (faster than before to compensate for no gravity)
        const speed = 150; // Increased from 3 to make it more challenging
        asteroid.setVelocityY(speed);
        
        // Very slow rotation for more menacing feel
        asteroid.setAngularVelocity(Phaser.Math.Between(-0.5, 0.5));
    }

    createStarfield() {
        // Adjust star count based on screen size and world height
        const starCount = Math.floor((this.gameWidth * this.worldHeight) / 100000); // Adjusted from 10000
        
        for (let i = 0; i < starCount; i++) {
            const x = Phaser.Math.Between(0, this.gameWidth);
            const y = Phaser.Math.Between(0, this.worldHeight);
            const size = Phaser.Math.FloatBetween(1, 2.5);
            const star = this.add.circle(x, y, size, 0xffffff);
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
        }
    }

    handleResize() {
        // Update game dimensions
        this.gameWidth = window.innerWidth;
        this.gameHeight = window.innerHeight;
        
        // Update culling bounds
        this.updateCullingBounds();
        
        // Update world bounds
        this.physics.world.setBounds(0, 0, this.gameWidth, this.worldHeight);
        
        // Update camera bounds
        this.cameras.main.setBounds(0, 0, this.gameWidth, this.worldHeight);
        
        // Adjust UI elements
        if (this.scoreText) {
            this.scoreText.setPosition(16, 16);
        }
        
        if (this.playerNameText) {
            this.playerNameText.setPosition(16, 46);
        }
        
        if (this.gameOverText) {
            this.gameOverText.setPosition(this.gameWidth / 2, this.gameHeight / 2);
            this.gameOverText.setFontSize(this.gameWidth / 10);
        }
        if (this.restartText) {
            this.restartText.setPosition(this.gameWidth / 2, this.gameHeight * 0.75);
            this.restartText.setFontSize(this.gameWidth / 15);
        }
    }

    updateCullingBounds() {
        // Calculate culling bounds based on camera position and screen size
        const camera = this.cameras.main;
        this.cullingBounds = {
            left: -this.cullingMargin,
            right: this.gameWidth + this.cullingMargin,
            top: camera.scrollY - this.cullingMargin,
            bottom: camera.scrollY + this.gameHeight + this.cullingMargin
        };
    }
    
    isOutsideCullingBounds(object) {
        return (
            object.x < this.cullingBounds.left ||
            object.x > this.cullingBounds.right ||
            object.y < this.cullingBounds.top ||
            object.y > this.cullingBounds.bottom
        );
    }

    setupDebugMode() {
        // Create debug graphics object
        this.debugGraphics = this.add.graphics();
        
        // Create debug text with a fallback font
        const debugTextStyle = {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#00ff00'
        };
        
        this.debugText = this.add.text(10, 10, '', debugTextStyle)
            .setScrollFactor(0)
            .setDepth(1000);
        
        // Create FPS counter with a fallback font
        this.fpsText = this.add.text(10, 30, '', debugTextStyle)
            .setScrollFactor(0)
            .setDepth(1000);
        
        // Toggle debug mode with D key
        this.input.keyboard.on('keydown-D', () => {
            this.debugMode = !this.debugMode;
            this.debugText.setVisible(this.debugMode);
            this.fpsText.setVisible(this.debugMode);
            if (!this.debugMode) {
                this.debugGraphics.clear();
            }
        });
        
        // Toggle collision debug with C key
        this.input.keyboard.on('keydown-C', () => {
            this.showCollisionDebug = !this.showCollisionDebug;
        });
        
        // Initially hide debug elements
        this.debugText.setVisible(false);
        this.fpsText.setVisible(false);
    }
    
    initSpatialGrid() {
        // Create a spatial grid for collision optimization
        this.spatialGrid = {
            cells: {},
            
            // Get cell key from position
            getCellKey(x, y, cellSize) {
                const cellX = Math.floor(x / cellSize);
                const cellY = Math.floor(y / cellSize);
                return `${cellX},${cellY}`;
            },
            
            // Add object to grid
            addObject(obj, cellSize) {
                // Skip if object is not active
                if (!obj || !obj.active) return;
                
                const key = this.getCellKey(obj.x, obj.y, cellSize);
                
                if (!this.cells[key]) {
                    this.cells[key] = [];
                }
                
                // Add object to cell if not already there
                if (!this.cells[key].includes(obj)) {
                    this.cells[key].push(obj);
                }
                
                // Store the cell key on the object for quick removal
                obj.cellKey = key;
            },
            
            // Remove object from grid
            removeObject(obj) {
                if (!obj) return;
                
                if (obj.cellKey && this.cells[obj.cellKey]) {
                    const index = this.cells[obj.cellKey].indexOf(obj);
                    if (index !== -1) {
                        this.cells[obj.cellKey].splice(index, 1);
                    }
                    
                    // Clean up empty cells
                    if (this.cells[obj.cellKey].length === 0) {
                        delete this.cells[obj.cellKey];
                    }
                }
                
                // Clear the cell key from the object
                obj.cellKey = null;
            },
            
            // Update object position in grid
            updateObject(obj, cellSize) {
                // Skip if object is not active
                if (!obj || !obj.active) return;
                
                const newKey = this.getCellKey(obj.x, obj.y, cellSize);
                
                // If object has moved to a new cell
                if (obj.cellKey !== newKey) {
                    // Remove from old cell
                    this.removeObject(obj);
                    
                    // Add to new cell
                    this.addObject(obj, cellSize);
                }
            },
            
            // Get nearby objects
            getNearbyObjects(x, y, cellSize) {
                const cellKey = this.getCellKey(x, y, cellSize);
                const nearbyObjects = [];
                
                // Get objects in current cell and 8 surrounding cells
                for (let xOffset = -1; xOffset <= 1; xOffset++) {
                    for (let yOffset = -1; yOffset <= 1; yOffset++) {
                        const cellX = Math.floor(x / cellSize) + xOffset;
                        const cellY = Math.floor(y / cellSize) + yOffset;
                        const key = `${cellX},${cellY}`;
                        
                        if (this.cells[key]) {
                            // Only add active objects
                            const activeObjects = this.cells[key].filter(obj => obj && obj.active);
                            nearbyObjects.push(...activeObjects);
                        }
                    }
                }
                
                return nearbyObjects;
            },
            
            // Clear all cells
            clear() {
                this.cells = {};
            }
        };
    }
    
    updateSpatialGrid() {
        // Update player position in grid
        this.spatialGrid.updateObject(this.player, this.gridCellSize);
        
        // Update asteroid positions in grid
        this.asteroids.children.iterate((asteroid) => {
            if (asteroid && asteroid.active) {
                this.spatialGrid.updateObject(asteroid, this.gridCellSize);
            }
        });
    }
    
    updateDebugInfo() {
        if (!this.debugMode) return;
        
        // Clear previous debug graphics
        this.debugGraphics.clear();
        
        // Draw culling bounds
        this.debugGraphics.lineStyle(2, 0xff0000, 0.5);
        this.debugGraphics.strokeRect(
            this.cullingBounds.left,
            this.cullingBounds.top,
            this.cullingBounds.right - this.cullingBounds.left,
            this.cullingBounds.bottom - this.cullingBounds.top
        );
        
        // Draw active objects and their collision circles
        this.debugGraphics.lineStyle(1, 0x00ff00, 0.5);
        let activeCount = 0;
        this.asteroids.children.iterate((asteroid) => {
            if (asteroid && asteroid.active) {
                activeCount++;
                // Draw object
                this.debugGraphics.strokeCircle(asteroid.x, asteroid.y, 20);
                
                // Draw collision radius if collision debug is enabled
                if (this.showCollisionDebug) {
                    const collisionRadius = asteroid.width * asteroid.scale * 0.3;
                    this.debugGraphics.lineStyle(1, 0xffff00, 0.3);
                    this.debugGraphics.strokeCircle(asteroid.x, asteroid.y, collisionRadius);
                }
            }
        });
        
        // Draw player collision radius if collision debug is enabled
        if (this.showCollisionDebug) {
            const playerCollisionRadius = this.player.width * this.player.scale * 0.3;
            this.debugGraphics.lineStyle(1, 0xffff00, 0.5);
            this.debugGraphics.strokeCircle(this.player.x, this.player.y, playerCollisionRadius);
        }
        
        // Draw spatial grid (only visible cells)
        if (this.spatialGrid) {
            this.debugGraphics.lineStyle(1, 0x0000ff, 0.3);
            
            // Get visible area
            const visibleLeft = this.cameras.main.scrollX;
            const visibleTop = this.cameras.main.scrollY;
            const visibleRight = visibleLeft + this.cameras.main.width;
            const visibleBottom = visibleTop + this.cameras.main.height;
            
            // Draw grid lines
            for (let x = Math.floor(visibleLeft / this.gridCellSize) * this.gridCellSize; 
                 x <= visibleRight; 
                 x += this.gridCellSize) {
                this.debugGraphics.lineBetween(x, visibleTop, x, visibleBottom);
            }
            
            for (let y = Math.floor(visibleTop / this.gridCellSize) * this.gridCellSize; 
                 y <= visibleBottom; 
                 y += this.gridCellSize) {
                this.debugGraphics.lineBetween(visibleLeft, y, visibleRight, y);
            }
            
            // Highlight cells with objects
            this.debugGraphics.fillStyle(0x0000ff, 0.1);
            Object.keys(this.spatialGrid.cells).forEach(key => {
                const [cellX, cellY] = key.split(',').map(Number);
                const x = cellX * this.gridCellSize;
                const y = cellY * this.gridCellSize;
                
                // Only draw if cell is visible
                if (x + this.gridCellSize >= visibleLeft && 
                    x <= visibleRight && 
                    y + this.gridCellSize >= visibleTop && 
                    y <= visibleBottom) {
                    this.debugGraphics.fillRect(
                        x, y, this.gridCellSize, this.gridCellSize
                    );
                }
            });
        }
        
        // Calculate world progress percentage
        const worldProgress = ((this.worldHeight - this.player.y) / this.worldHeight * 100).toFixed(2);
        
        // Update debug text
        this.debugText.setText([
            `Active Asteroids: ${activeCount}`,
            `Regular Pool Size: ${this.asteroidPool.length}`,
            `Big Pool Size: ${this.bigAsteroidPool.length}`,
            `Player Position: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`,
            `Score: ${this.score}`,
            `World Progress: ${worldProgress}%`,
            `Grid Cells: ${Object.keys(this.spatialGrid.cells).length}`,
            `Collision Debug: ${this.showCollisionDebug ? 'ON' : 'OFF'} (Press C to toggle)`
        ]);
        
        // Update FPS counter
        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }

    cleanupScene() {
        // Clean up all asteroids
        this.asteroids.clear(true, true);
        
        // Clear object pools
        this.asteroidPool = [];
        this.bigAsteroidPool = [];
        
        // Clear spatial grid
        if (this.spatialGrid) {
            this.spatialGrid.clear();
        }
        
        // Remove all event listeners
        this.input.keyboard.removeAllKeys(true);
        
        // Stop all timers
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.bigAsteroidTimer) this.bigAsteroidTimer.remove();
        
        // Clear all tweens
        this.tweens.killAll();
    }

    update() {
        if (this.gameOver) {
            return;
        }

        // Only process updates if the scene is active
        if (!this.scene.isActive()) return;
        
        // Update culling bounds based on camera position
        this.updateCullingBounds();
        
        // Clean up off-screen asteroids - now recycle instead of destroy
        // Do this BEFORE updating the spatial grid to avoid ghost objects
        this.asteroids.children.iterate((asteroid) => {
            if (asteroid && asteroid.active && this.isOutsideCullingBounds(asteroid)) {
                this.recycleAsteroid(asteroid);
            }
        });
        
        // Update spatial grid
        this.updateSpatialGrid();
        
        // Use optimized collision detection
        this.optimizedCollisionCheck();
        
        // Update debug visualization
        this.updateDebugInfo();

        // Update background planets
        this.backgroundPlanets.forEach(planet => {
            if (!planet || !planet.scene) return;  // Skip if planet is invalid
            
            // Move down extremely slowly relative to player speed (parallax effect)
            planet.y -= this.gameSpeed * 0.0005 * planet.scale;  // Twice as slow
            planet.rotation += planet.rotationSpeed;
            
            // Wrap around when off screen and change to a new random planet type
            if (planet.y > this.cameras.main.scrollY + 900) {
                planet.y = this.cameras.main.scrollY - 100;
                planet.x = Phaser.Math.Between(0, 800);
            }
        });

        // Simple horizontal movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        } else {
            this.player.setVelocityX(0);
        }
        
        // Screen wrapping adjusted for screen width
        if (this.player.x < 0) {
            this.player.x = this.gameWidth;
        } else if (this.player.x > this.gameWidth) {
            this.player.x = 0;
        }
        
        // Force maintain upward velocity every frame
        this.player.setVelocityY(this.gameSpeed);
        
        // Update score (based on height from bottom)
        this.score = Math.floor((this.worldHeight - this.player.y) / 10);
        this.scoreText.setText('HEIGHT: ' + this.score);
        
        // Handle wrapping around to the bottom when player reaches the top
        if (this.player.y <= 50) {
            this.player.y = this.worldHeight - 200;
        }
        
        // Reset if player goes too far down
        if (this.player.y > this.worldHeight - 50) {
            this.cleanupScene();
            this.scene.restart();
        }
        
        // Performance optimization: Only update visible objects
        this.asteroids.children.iterate((asteroid) => {
            if (asteroid && asteroid.active) {
                // Skip physics updates for objects far from the player (optional)
                const distanceToPlayer = Phaser.Math.Distance.Between(
                    asteroid.x, asteroid.y,
                    this.player.x, this.player.y
                );
                
                // If very far away, reduce update frequency
                if (distanceToPlayer > this.gameHeight * 1.5) {
                    // Only update every other frame
                    if (this.time.frameCount % 2 === 0) {
                        asteroid.skipUpdate = true;
                        return;
                    }
                }
                
                asteroid.skipUpdate = false;
            }
        });
    }
} 