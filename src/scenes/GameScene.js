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
import { FontStyles } from '../index';

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
        this.backgroundPlanets = [];
        this.gameWidth = window.innerWidth;
        this.gameHeight = window.innerHeight;
        
        // Player movement speed
        this.playerSpeed = 300;
        
        // Difficulty scaling properties
        this.baseAsteroidSpeed = 80;
        this.baseSpawnDelay = 500;
        this.difficultyInterval = 500; // Height interval for increasing difficulty
        
        // Object pooling properties
        this.maxPoolSize = 50; // Maximum number of asteroids to keep in the pool
        this.asteroidPool = []; // Pool for regular asteroids
        
        // Mega asteroid properties
        this.megaAsteroidPool = []; // Pool for mega asteroids
        this.baseMegaAsteroidSpeed = 20; // Much slower than regular asteroids
        this.megaAsteroidSpawnChance = 0.15; // 15% chance when spawning
        this.maxMegaPoolSize = 2; // Start with max 2 mega asteroids
        this.megaAsteroidScale = 0.4; // Increased from 0.25 for larger visual size
        
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
        this.load.image('player', starship);
        this.load.image('halfEarth', halfEarth);
        this.load.image('mega-asteroid', greyPlanet);

        // Load custom font using FontFace API
        const customFont = new FontFace('Micro 5', 'url(src/assets/fonts/Micro5-Regular.ttf)');
        customFont.load().then((font) => {
            document.fonts.add(font);
            this.fontLoaded = true;
            
            // Update text styles if they exist
            if (this.scoreText) this.scoreText.setStyle(FontStyles.hud);
            if (this.playerNameText) this.playerNameText.setStyle(FontStyles.hud);
            if (this.gameOverText) this.gameOverText.setStyle(FontStyles.gameOver);
            if (this.finalScoreText) this.finalScoreText.setStyle(FontStyles.medium);
            if (this.debugText) this.debugText.setStyle(FontStyles.standard);
            if (this.fpsText) this.fpsText.setStyle(FontStyles.standard);
        }).catch((error) => {
            console.error('Font loading failed:', error);
        });

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
        
        // Determine if we're on mobile for responsive UI
        this.isMobile = this.game.device.os.android || this.game.device.os.iOS || 
                         this.game.device.os.iPad || this.game.device.os.iPhone || 
                         (window.innerWidth < 1024) ||
                         ('ontouchstart' in window);
        
        // Create score text with proper font handling
        this.scoreText = this.add.text(16, 16, 'HEIGHT: 0', FontStyles.hud)
            .setScrollFactor(0)
            .setDepth(1000); // Ensure it's above other elements
        
        // Add player name text
        this.playerNameText = this.add.text(
            16, 
            60, // Position lower for better spacing
            `PLAYER: ${this.playerName}`, 
            FontStyles.hud
        )
        .setScrollFactor(0)
        .setDepth(1000); // Ensure it's above other elements
        
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Set up mobile touch controls
        this.setupMobileControls();
        
        // Calculate initial spawn delay based on height
        const initialSpawnDelay = this.calculateSpawnDelay(0);
        
        // Set up asteroid spawning with dynamic delay
        this.spawnTimer = this.time.addEvent({
            delay: initialSpawnDelay,
            callback: () => {
                this.spawnAsteroid();
                // Update spawn delay based on current height
                const newDelay = this.calculateSpawnDelay(this.score);
                this.spawnTimer.delay = newDelay;
                this.spawnTimer.reset({
                    delay: newDelay,
                    callback: this.spawnAsteroid,
                    callbackScope: this,
                    loop: true
                });
            },
            callbackScope: this,
            loop: true
        });
        
        // Initialize object pools
        this.initializeObjectPools();
        
        // Set up debug mode if needed
        if (this.debugMode) {
            this.setupDebugMode();
        }
        
        // Update culling bounds
        this.updateCullingBounds();
        
        // Handle window resize
        this.scale.on('resize', this.handleResize, this);
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
        
        // Show game over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'GAME OVER',
            FontStyles.gameOver
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000); // Ensure it's above everything
        
        // Scale to fit screen
        const scale = Math.min(
            this.cameras.main.width / (gameOverText.width * 1.2),
            this.cameras.main.height / (gameOverText.height * 1.2)
        );
        gameOverText.setScale(scale);
        
        // Store reference to game over text
        this.gameOverText = gameOverText;
        
        // Show final score
        const finalScoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 150, // Position lower
            `FINAL HEIGHT: ${this.score}`,
            FontStyles.medium
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000); // Ensure it's above everything
        
        // Store reference to final score text
        this.finalScoreText = finalScoreText;
        
        // Stop asteroid spawning
        this.spawnTimer.remove();
        
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
                // Get player collision radius
                const playerRadius = this.player.width * this.player.scale * 0.3;
                
                // Get object collision radius (larger for mega asteroids)
                let objRadius;
                if (obj.isMega) {
                    // For mega asteroids, use a radius about 1x the visual size
                    objRadius = obj.width * obj.scale * 0.51; // 0.51 is half of 1.02 (radius vs diameter)
                } else {
                    // For regular asteroids, use the standard radius
                    objRadius = obj.width * obj.scale * 0.3;
                }
                
                // Calculate distance between centers
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    obj.x, obj.y
                );
                
                // Check if distance is less than sum of radii (with a small buffer)
                const collision = (distance < (playerRadius + objRadius) * 0.9);
                
                // Add debug visualization if in debug mode
                if (collision && this.debugMode && this.showCollisionDebug) {
                    this.debugGraphics.lineStyle(2, 0xff0000, 1);
                    this.debugGraphics.strokeCircle(this.player.x, this.player.y, playerRadius);
                    this.debugGraphics.strokeCircle(obj.x, obj.y, objRadius);
                    this.debugGraphics.lineBetween(this.player.x, this.player.y, obj.x, obj.y);
                }
                
                if (collision) {
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

        // Create initial pool of mega asteroids
        for (let i = 0; i < this.maxMegaPoolSize; i++) {
            const megaAsteroid = this.physics.add.sprite(0, 0, 'mega-asteroid');
            megaAsteroid.setScale(this.megaAsteroidScale);
            
            // Use a circular collision body that's about 1x the visual size (reduced by 15% from 1.2x)
            const baseRadius = megaAsteroid.width / 2;
            const scaledRadius = baseRadius * this.megaAsteroidScale * 1.02; // 1.2 * 0.85 = 1.02
            
            // We need to convert back to the unscaled radius for setCircle
            const unscaledRadius = scaledRadius / this.megaAsteroidScale;
            
            megaAsteroid.body.setCircle(unscaledRadius, 
                (megaAsteroid.width - unscaledRadius * 2) / 2,
                (megaAsteroid.height - unscaledRadius * 2) / 2);
            
            // Add to mega pool and disable
            this.megaAsteroidPool.push(megaAsteroid);
            megaAsteroid.setActive(false);
            megaAsteroid.setVisible(false);
            megaAsteroid.isMega = true; // Flag to identify mega asteroids
        }
    }
    
    getPooledAsteroid() {
        // Try to find an inactive asteroid in the pool
        let asteroid = this.asteroidPool.find(a => !a.active);
        
        if (!asteroid) {
            // If pool is full, create a new one
            asteroid = this.physics.add.sprite(0, 0, 'asteroid');
            
            // Set appropriate scale
            asteroid.setScale(0.08);
            
            // Set circular physics body
            const radius = asteroid.width * 0.35;
            asteroid.setCircle(radius,
                (asteroid.width - radius * 2) / 2,
                (asteroid.height - radius * 2) / 2);
                
            // Add to pool
            this.asteroidPool.push(asteroid);
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
    
    getPooledMegaAsteroid() {
        // Try to find an inactive mega asteroid in the pool
        let megaAsteroid = this.megaAsteroidPool.find(a => !a.active);
        
        // Only create new mega asteroid if below max pool size
        if (!megaAsteroid && this.megaAsteroidPool.length < this.getMaxMegaPoolSize()) {
            megaAsteroid = this.physics.add.sprite(0, 0, 'mega-asteroid');
            megaAsteroid.setScale(this.megaAsteroidScale);
            
            // Use a circular collision body that's about 1x the visual size (reduced by 15% from 1.2x)
            const baseRadius = megaAsteroid.width / 2;
            const scaledRadius = baseRadius * this.megaAsteroidScale * 1.02; // 1.2 * 0.85 = 1.02
            
            // We need to convert back to the unscaled radius for setCircle
            const unscaledRadius = scaledRadius / this.megaAsteroidScale;
            
            megaAsteroid.body.setCircle(unscaledRadius, 
                (megaAsteroid.width - unscaledRadius * 2) / 2,
                (megaAsteroid.height - unscaledRadius * 2) / 2);
            
            megaAsteroid.isMega = true;
            this.megaAsteroidPool.push(megaAsteroid);
        }
        
        if (megaAsteroid) {
            // Activate the mega asteroid
            megaAsteroid.setActive(true);
            megaAsteroid.setVisible(true);
            
            // Add to the asteroids group for collision detection
            this.asteroids.add(megaAsteroid);
            
            // Add to spatial grid
            this.spatialGrid.addObject(megaAsteroid, this.gridCellSize);
        }
        
        return megaAsteroid;
    }

    // Calculate spawn delay based on height
    calculateSpawnDelay(score) {
        const heightLevel = Math.floor(score / this.difficultyInterval);
        // Reduce delay by 10% for each height level, but never below 100ms
        return Math.max(100, this.baseSpawnDelay * Math.pow(0.9, heightLevel));
    }

    // Calculate asteroid speed based on height
    calculateAsteroidSpeed(score) {
        const heightLevel = Math.floor(score / this.difficultyInterval);
        // Increase speed by 10% for each height level
        return this.baseAsteroidSpeed * (1 + (heightLevel * 0.1));
    }

    spawnAsteroid() {
        if (this.gameOver) return;

        const cameraY = this.cameras.main.scrollY;
        
        // Spawn regular asteroids 100px off-screen, mega asteroids 300px off-screen
        const regularOffset = 100;
        const megaOffset = 300;

        if (cameraY < 0) return;

        // Adjust X position range based on screen width
        const x = Phaser.Math.Between(50, this.gameWidth - 50);
        
        // Determine if we should spawn a mega asteroid
        const shouldSpawnMega = Math.random() < this.megaAsteroidSpawnChance;
        
        // Get appropriate asteroid from pool
        const asteroid = shouldSpawnMega ? 
            this.getPooledMegaAsteroid() : 
            this.getPooledAsteroid();
        
        // If we couldn't get an asteroid (pool full), just return
        if (!asteroid) return;
        
        // Position the asteroid - use different offsets based on type
        const offset = asteroid.isMega ? megaOffset : regularOffset;
        asteroid.setPosition(x, cameraY - offset);
        
        // Calculate speed based on current height and type
        const speed = asteroid.isMega ? 
            this.calculateMegaAsteroidSpeed(this.score) : 
            this.calculateAsteroidSpeed(this.score);
        
        // Set diagonal velocity with additional downward component
        const angle = Phaser.Math.Between(30, 150); // Angle in degrees (avoiding pure vertical)
        const velocityX = speed * Math.cos(Phaser.Math.DegToRad(angle));
        const velocityY = -speed * Math.sin(Phaser.Math.DegToRad(angle)) + 200; // Add downward velocity component
        asteroid.setVelocity(velocityX, velocityY);
        
        // Add rotation (slower for mega asteroids)
        const rotationSpeed = asteroid.isMega ? 
            Phaser.Math.Between(-25, 25) : 
            Phaser.Math.Between(-50, 50);
        asteroid.setAngularVelocity(rotationSpeed);
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
        
        // Detect if we're on a mobile device
        const isMobile = this.game.device.os.android || 
                         this.game.device.os.iOS || 
                         this.game.device.os.iPad || 
                         this.game.device.os.iPhone || 
                         (window.innerWidth < 1024) ||
                         ('ontouchstart' in window);
        
        // Adjust UI elements
        if (this.scoreText) {
            this.scoreText.setPosition(16, 16);
            // Always use larger font size from FontStyles.hud
            this.scoreText.setStyle(FontStyles.hud);
        }
        
        if (this.playerNameText) {
            this.playerNameText.setPosition(16, 60);
            // Always use larger font size from FontStyles.hud
            this.playerNameText.setStyle(FontStyles.hud);
        }
        
        if (this.gameOverText) {
            this.gameOverText.setPosition(this.gameWidth / 2, this.gameHeight / 2);
            // Scale to fit screen
            const scale = Math.min(
                this.gameWidth / (this.gameOverText.width * 1.2),
                this.gameHeight / (this.gameOverText.height * 1.2)
            );
            this.gameOverText.setScale(scale);
        }
        
        if (this.finalScoreText) {
            this.finalScoreText.setPosition(this.gameWidth / 2, this.gameHeight / 2 + 150);
            this.finalScoreText.setStyle(FontStyles.medium);
        }
        
        // Update debug text position if it exists
        if (this.debugText) {
            this.debugText.setPosition(10, 10);
            this.debugText.setStyle(FontStyles.standard);
        }
        
        // Update FPS text position if it exists
        if (this.fpsText) {
            this.fpsText.setPosition(10, this.gameHeight - 30);
            this.fpsText.setStyle(FontStyles.standard);
        }
        
        // Update mobile controls if they exist
        if (this.leftButton && this.rightButton) {
            // Position controls higher on the screen for better visibility
            const controlY = this.gameHeight * 0.75;
            
            // Use consistent large button scale
            const buttonScale = 0.35;
            
            // Position buttons wider apart
            const margin = this.gameWidth * 0.2;
            const leftX = margin;
            const rightX = this.gameWidth - margin;
            
            // Update button positions
            this.leftButton.setPosition(leftX, controlY);
            this.rightButton.setPosition(rightX, controlY);
            
            // Update text positions
            if (this.leftText) {
                this.leftText.setPosition(leftX, controlY);
            }
            
            if (this.rightText) {
                this.rightText.setPosition(rightX, controlY);
            }
            
            // Maintain visibility settings based on device type
            const shouldShowControls = isMobile;
            this.leftButton.setVisible(shouldShowControls);
            this.rightButton.setVisible(shouldShowControls);
            
            if (this.leftText) {
                this.leftText.setVisible(shouldShowControls);
            }
            
            if (this.rightText) {
                this.rightText.setVisible(shouldShowControls);
            }
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
        // Create debug graphics
        this.debugGraphics = this.add.graphics();
        
        // Create debug text
        this.debugText = this.add.text(10, 10, '', FontStyles.standard)
            .setScrollFactor(0)
            .setDepth(1000);
        
        // Create FPS counter
        this.fpsText = this.add.text(10, this.gameHeight - 30, '', FontStyles.standard)
            .setScrollFactor(0)
            .setDepth(1000);
        
        // Add key to toggle collision debug
        this.input.keyboard.on('keydown-C', () => {
            this.showCollisionDebug = !this.showCollisionDebug;
        });
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
        
        // Count active asteroids
        let activeCount = 0;
        let activeMegaCount = 0;
        
        this.asteroids.getChildren().forEach(asteroid => {
            activeCount++;
            if (asteroid.isMega) activeMegaCount++;
            
            // Draw asteroid collision radius if collision debug is enabled
            if (this.showCollisionDebug) {
                const asteroidCollisionRadius = asteroid.width * asteroid.scale * 0.5;
                this.debugGraphics.lineStyle(1, 0xff0000, 0.5);
                this.debugGraphics.strokeCircle(asteroid.x, asteroid.y, asteroidCollisionRadius);
            }
        });
        
        // Draw player collision radius if collision debug is enabled
        if (this.showCollisionDebug) {
            const playerCollisionRadius = this.player.width * this.player.scale * 0.3;
            this.debugGraphics.lineStyle(1, 0xffff00, 0.5);
            this.debugGraphics.strokeCircle(this.player.x, this.player.y, playerCollisionRadius);
        }
        
        // Update debug text
        this.debugText.setText([
            `Active Asteroids: ${activeCount} (${activeMegaCount} mega)`,
            `Regular Pool Size: ${this.asteroidPool.length}`,
            `Mega Pool Size: ${this.megaAsteroidPool.length}/${this.getMaxMegaPoolSize()}`,
            `Player Position: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`,
            `Score: ${this.score}`,
            `World Progress: ${Math.floor((this.worldHeight - this.player.y) / this.worldHeight * 100)}%`,
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
        this.megaAsteroidPool = [];
        
        // Clear spatial grid
        if (this.spatialGrid) {
            this.spatialGrid.clear();
        }
        
        // Remove all event listeners
        this.input.keyboard.removeAllKeys(true);
        
        // Remove global touch event listeners
        this.input.off('pointerdown');
        this.input.off('pointerup');
        
        // Clean up mobile controls
        if (this.leftButton) {
            this.leftButton.removeAllListeners();
            this.leftButton.destroy();
        }
        if (this.rightButton) {
            this.rightButton.removeAllListeners();
            this.rightButton.destroy();
        }
        if (this.leftText) this.leftText.destroy();
        if (this.rightText) this.rightText.destroy();
        
        // Stop all timers
        if (this.spawnTimer) this.spawnTimer.remove();
        
        // Clear all tweens
        this.tweens.killAll();
    }

    // Calculate max mega pool size based on score
    getMaxMegaPoolSize() {
        const heightLevel = Math.floor(this.score / this.difficultyInterval);
        return Math.min(4, this.maxMegaPoolSize + Math.floor(heightLevel / 3));
    }

    // Calculate mega asteroid speed based on height
    calculateMegaAsteroidSpeed(score) {
        const heightLevel = Math.floor(score / this.difficultyInterval);
        // Increase speed by 5% for each height level (slower progression than regular asteroids)
        return this.baseMegaAsteroidSpeed * (1 + (heightLevel * 0.05));
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

    setupMobileControls() {
        // Initialize movement flags
        this.moveLeft = false;
        this.moveRight = false;
        
        // Detect if we're on a mobile device
        const isMobile = this.game.device.os.android || 
                         this.game.device.os.iOS || 
                         this.game.device.os.iPad || 
                         this.game.device.os.iPhone || 
                         (window.innerWidth < 1024) ||
                         ('ontouchstart' in window);
        
        // Position controls higher on the screen for better visibility
        const controlY = this.gameHeight * 0.75;
        
        // MUCH larger buttons for better visibility and touch targets
        const buttonScale = 0.35; // Significantly larger than before
        
        // Position buttons wider apart
        const margin = this.gameWidth * 0.2;
        const leftX = margin;
        const rightX = this.gameWidth - margin;
        
        // Create left control button with better visibility
        this.leftButton = this.add.image(leftX, controlY, 'asteroid')
            .setScrollFactor(0)
            .setAlpha(0.9) // More visible
            .setScale(buttonScale)
            .setTint(0x0000ff)
            .setInteractive()
            .setDepth(100); // Ensure it's above other elements
            
        // Create right control button with better visibility
        this.rightButton = this.add.image(rightX, controlY, 'asteroid')
            .setScrollFactor(0)
            .setAlpha(0.9) // More visible
            .setScale(buttonScale)
            .setTint(0xff0000)
            .setInteractive()
            .setDepth(100); // Ensure it's above other elements
            
        // MUCH larger text for better visibility
        const buttonTextStyle = {
            fontFamily: '"Micro 5", monospace',
            fontSize: '64px', // Significantly larger
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6 // Thicker stroke for better visibility
        };
        
        this.leftText = this.add.text(leftX, controlY, '←', buttonTextStyle)
            .setScrollFactor(0)
            .setOrigin(0.5)
            .setDepth(101); // Ensure text is above button
            
        this.rightText = this.add.text(rightX, controlY, '→', buttonTextStyle)
            .setScrollFactor(0)
            .setOrigin(0.5)
            .setDepth(101); // Ensure text is above button
        
        // Set up event listeners for the left button with more dramatic feedback
        this.leftButton.on('pointerdown', () => {
            this.moveLeft = true;
            this.leftButton.setAlpha(1.0);
            this.leftButton.setScale(buttonScale * 1.2); // More dramatic growth
        });
        
        this.leftButton.on('pointerout', () => {
            this.moveLeft = false;
            this.leftButton.setAlpha(0.9);
            this.leftButton.setScale(buttonScale);
        });
        
        this.leftButton.on('pointerup', () => {
            this.moveLeft = false;
            this.leftButton.setAlpha(0.9);
            this.leftButton.setScale(buttonScale);
        });
        
        // Set up event listeners for the right button with more dramatic feedback
        this.rightButton.on('pointerdown', () => {
            this.moveRight = true;
            this.rightButton.setAlpha(1.0);
            this.rightButton.setScale(buttonScale * 1.2); // More dramatic growth
        });
        
        this.rightButton.on('pointerout', () => {
            this.moveRight = false;
            this.rightButton.setAlpha(0.9);
            this.rightButton.setScale(buttonScale);
        });
        
        this.rightButton.on('pointerup', () => {
            this.moveRight = false;
            this.rightButton.setAlpha(0.9);
            this.rightButton.setScale(buttonScale);
        });
        
        // Also handle general screen touches for mobile - larger touch area
        this.input.on('pointerdown', (pointer) => {
            // Only process touch events on mobile
            if (isMobile) {
                // Check if touch is in the lower 2/3 of the screen for easier control
                if (pointer.y > this.gameHeight * 0.33) {
                    if (pointer.x < this.gameWidth / 2) {
                        this.moveLeft = true;
                        this.leftButton.setAlpha(1.0);
                        this.leftButton.setScale(buttonScale * 1.2);
                    } else {
                        this.moveRight = true;
                        this.rightButton.setAlpha(1.0);
                        this.rightButton.setScale(buttonScale * 1.2);
                    }
                }
            }
        });
        
        this.input.on('pointerup', () => {
            // Only process touch events on mobile
            if (isMobile) {
                this.moveLeft = false;
                this.moveRight = false;
                this.leftButton.setAlpha(0.9);
                this.rightButton.setAlpha(0.9);
                this.leftButton.setScale(buttonScale);
                this.rightButton.setScale(buttonScale);
            }
        });
        
        // Hide controls on desktop
        if (!isMobile) {
            this.leftButton.setVisible(false);
            this.rightButton.setVisible(false);
            this.leftText.setVisible(false);
            this.rightText.setVisible(false);
        }
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

        // Handle keyboard input
        if (this.cursors.left.isDown || this.moveLeft) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (this.cursors.right.isDown || this.moveRight) {
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