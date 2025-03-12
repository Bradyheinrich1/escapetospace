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
        this.worldHeight = 20000; // Height of our game world
        this.asteroids = null;
        this.gameOver = false;
        this.spawnTimer = null;
        this.bigAsteroidTimer = null;
        this.backgroundPlanets = [];
        this.gameWidth = window.innerWidth;
        this.gameHeight = window.innerHeight;
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
    }

    create() {
        // Reset game state
        this.gameOver = false;
        this.score = 0;
        
        // Set world bounds (0 to worldHeight for Y, and use full screen width)
        this.physics.world.setBounds(0, 0, this.gameWidth, this.worldHeight);
        
        // Create background
        this.createStarfield();
        
        // Add Earth at the bottom of the screen
        const earth = this.add.image(this.gameWidth / 2, this.worldHeight - 50, 'halfEarth');
        const earthScale = this.gameWidth / earth.width * 0.5; // Make it half screen width instead of 2x
        earth.setScale(earthScale);
        earth.setAlpha(1); // Full opacity
        earth.setDepth(-2); // Put it behind everything else
        earth.y = this.worldHeight - (earth.height * earthScale * 0.5); // Position to show half of it

        // Add fullscreen button
        const fullscreenButton = this.add.text(this.gameWidth - 20, 20, '⛶', {
            fontFamily: 'Micro 5',
            fontSize: '32px',
            fill: '#fff',
            padding: { x: 10, y: 10 }
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerup', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });

        // Handle resize events
        this.scale.on('resize', this.handleResize, this);
        
        // List of all background planet types
        const planetTypes = [
            'bluePlanetOne', 'bluePlanetTwo', 'brownPlanetTwo',
            'brownRockyPlanet', 'dunRockyPlanet', 'earthLikePlanet',
            'fieryPlanet', 'greenPlanetOne', 'greenPlanetTwo',
            'purplePlanetOne', 'iceRingPlanet', 'marsLikePlanet',
            'pinkPlanetOne', 'pinkPlanetTwo', 'ringPlanetBlue',
            'ringPlanetGreen', 'ringedPlanetBrown', 'yellowPlanetOne'
        ];
        
        // Create background planets
        for (let i = 0; i < 6; i++) {  // Increased from 2 to 6 planets
            const planetType = Phaser.Math.RND.pick(planetTypes);
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, this.worldHeight);
            const planet = this.add.image(x, y, planetType);
            
            // Make planets visible but still distant-looking
            const scale = Phaser.Math.FloatBetween(0.04, 0.06);
            planet.setScale(scale);
            planet.setAlpha(0.25);
            planet.setDepth(-1);
            
            // Add slow rotation
            planet.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
            planet.rotationSpeed = Phaser.Math.FloatBetween(-0.0005, 0.0005);
            
            // Add to our tracking array
            this.backgroundPlanets.push(planet);
        }

        // When planets wrap around, give them a new random type
        const updatePlanet = (planet) => {
            const newType = Phaser.Math.RND.pick(planetTypes);
            planet.setTexture(newType);
        };
        
        // Update the update method to change planet types when wrapping
        const originalUpdate = this.update;
        this.update = function() {
            if (this.gameOver) return;

            // Update background planets
            this.backgroundPlanets.forEach(planet => {
                // Move down extremely slowly relative to player speed (parallax effect)
                planet.y -= this.gameSpeed * 0.0005 * planet.scale;  // Twice as slow
                planet.rotation += planet.rotationSpeed;
                
                // Wrap around when off screen and change to a new random planet type
                if (planet.y > this.cameras.main.scrollY + 900) {
                    planet.y = this.cameras.main.scrollY - 100;
                    planet.x = Phaser.Math.Between(0, 800);
                    updatePlanet(planet);
                }
            });

            // Call the rest of the original update method
            originalUpdate.call(this);
        };
        
        // Create asteroid groups
        this.asteroids = this.physics.add.group();
        
        // Create player sprite
        this.player = this.physics.add.sprite(this.gameWidth / 2, this.worldHeight - 100, 'player');
        this.player.setCollideWorldBounds(false);
        
        // Set player size to 150px height
        const targetHeight = 150;
        const scale = targetHeight / this.player.height;
        this.player.setScale(scale);
        
        // Set circular physics body to match just the ship's body (not flames)
        const radius = targetHeight * 0.25;
        this.player.setCircle(radius / scale,
            (this.player.width / 2) - (radius / scale),
            (this.player.height / 2) - (radius / scale) - (targetHeight * 0.2));
        
        // Set player properties and ensure proper physics state
        this.player.setMaxVelocity(300, 400);
        this.player.setDragX(500);
        this.player.setGravityY(0);
        this.player.body.enable = true;
        
        // Ensure the player starts with the correct upward velocity
        this.player.setVelocity(0, this.gameSpeed);
        
        // Setup camera
        this.cameras.main.setBounds(0, 0, 800, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0, 1); // Smooth vertical following
        this.cameras.main.setLerp(0.1, 0.1); // Add smooth camera movement
        // Set camera follow offset to position player lower on screen
        this.cameras.main.setFollowOffset(0, 200); // Positive Y offset moves player down
        
        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Add score text (make it stick to the camera)
        this.scoreText = this.add.text(16, 16, 'HEIGHT: 0', {
            fontFamily: 'Micro 5',
            fontSize: '24px',
            fill: '#fff',
            padding: { x: 10, y: 10 }
        }).setScrollFactor(0); // This makes it stick to the camera
        
        // Add game over text (hidden initially)
        this.gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, 'GAME OVER', {
            fontFamily: 'Micro 5',
            fontSize: this.gameWidth / 10,
            fill: '#ff0000',
            align: 'center',
            padding: { x: 40, y: 40 },
            stroke: '#000000',
            strokeThickness: 16
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setVisible(false)
        .setDepth(1000); // Ensure it appears above everything else

        // Add restart text below (smaller)
        this.restartText = this.add.text(this.gameWidth / 2, this.gameHeight * 0.75, 'CLICK TO RESTART', {
            fontFamily: 'Micro 5',
            fontSize: this.gameWidth / 15,
            fill: '#ff0000',
            align: 'center',
            padding: { x: 20, y: 20 },
            stroke: '#000000',
            strokeThickness: 8
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setVisible(false)
        .setDepth(1000);

        // Setup collision between player and asteroids
        this.physics.add.collider(this.player, this.asteroids, this.handleCollision, null, this);

        // Start spawning regular asteroids - start slow, speed up based on score
        this.spawnTimer = this.time.addEvent({
            delay: 2500, // Start with 2.5 seconds between spawns
            callback: () => {
                this.spawnAsteroid();
                // Gradually decrease delay as score increases, minimum 800ms
                const newDelay = Math.max(2500 - (this.score * 10), 800);
                this.spawnTimer.delay = newDelay;
            },
            callbackScope: this,
            loop: true
        });

        // Start spawning big asteroids (only when score is high enough)
        this.bigAsteroidTimer = this.time.addEvent({
            delay: 8000, // Every 8 seconds initially
            callback: () => {
                this.spawnBigAsteroid();
                // Gradually decrease delay as score increases, minimum 4 seconds
                const newDelay = Math.max(8000 - (this.score * 20), 4000);
                this.bigAsteroidTimer.delay = newDelay;
            },
            callbackScope: this,
            loop: true
        });

        // Remove any existing pointerdown listeners
        this.input.removeAllListeners('pointerdown');
        
        // Add click handler for restart
        this.input.on('pointerdown', () => {
            if (this.gameOver) {
                // Don't resume physics here, let the new scene handle it
                this.scene.restart();
            }
        });
    }

    handleCollision() {
        if (!this.gameOver) {
            this.gameOver = true;
            
            // Stop all physics objects
            this.physics.pause();
            
            // Stop the player
            this.player.body.enable = false;
            this.player.setTint(0xff0000);
            
            // Stop all asteroids
            this.asteroids.children.iterate(function(asteroid) {
                if (asteroid && asteroid.body) {
                    asteroid.body.enable = false;
                }
            });
            
            // Clear timers
            this.spawnTimer.remove();
            this.bigAsteroidTimer.remove();
            
            // Show game over text
            this.gameOverText.setVisible(true);
            this.restartText.setVisible(true);
        }
    }

    spawnAsteroid() {
        if (this.gameOver) return;

        const cameraY = this.cameras.main.scrollY;
        const spawnY = cameraY - 50;

        if (spawnY < 0) return;

        // Adjust X position range based on screen width
        const x = Phaser.Math.Between(50, this.gameWidth - 50);
        
        // Create asteroid
        const asteroid = this.asteroids.create(x, spawnY, 'asteroid');
        
        // Set size for better collision - much smaller now
        asteroid.setScale(0.08);
        
        // Set constant diagonal velocity with additional downward component
        const angle = Phaser.Math.Between(30, 150); // Angle in degrees (avoiding pure vertical)
        const speed = 80; // Constant speed
        const velocityX = speed * Math.cos(Phaser.Math.DegToRad(angle));
        const velocityY = -speed * Math.sin(Phaser.Math.DegToRad(angle)) + 200; // Add downward velocity component
        asteroid.setVelocity(velocityX, velocityY);
        
        // Add rotation
        asteroid.setAngularVelocity(Phaser.Math.Between(-50, 50));
        
        // Set circular physics body
        const radius = asteroid.width * 0.35;
        asteroid.setCircle(radius, 
            (asteroid.width - radius * 2) / 2,
            (asteroid.height - radius * 2) / 2);
        
        // Destroy asteroid when it goes off screen
        asteroid.checkWorldBounds = true;
        asteroid.outOfBoundsKill = true;
    }

    spawnBigAsteroid() {
        if (this.gameOver) return;
        
        if (this.score < 500) return;

        const cameraY = this.cameras.main.scrollY;
        const spawnY = cameraY - 500;

        if (spawnY < 0) return;

        // Adjust X position range based on screen width
        const x = Phaser.Math.Between(this.gameWidth * 0.3, this.gameWidth * 0.7);
        
        // Create big asteroid
        const asteroid = this.asteroids.create(x, spawnY, 'bigAsteroid');
        
        // Much smaller start size and very gradual growth
        const baseScale = 0.08;
        const growthScore = Math.max(0, this.score - 1000);
        const scoreScale = growthScore / 500;
        const scale = Math.min(baseScale + scoreScale, 2.0);
        asteroid.setScale(scale);
        
        // Set downward velocity (faster than before to compensate for no gravity)
        const speed = 150; // Increased from 3 to make it more challenging
        asteroid.setVelocityY(speed);
        
        // Very slow rotation for more menacing feel
        asteroid.setAngularVelocity(Phaser.Math.Between(-0.5, 0.5));
        
        // Set circular physics body
        const radius = asteroid.width * 0.35;
        asteroid.setCircle(radius,
            (asteroid.width - radius * 2) / 2,
            (asteroid.height - radius * 2) / 2);
        
        // Destroy when off screen
        asteroid.checkWorldBounds = true;
        asteroid.outOfBoundsKill = true;
    }

    createStarfield() {
        // Adjust star count based on screen size
        const starCount = Math.floor((this.gameWidth * this.worldHeight) / 20000);
        
        for (let i = 0; i < starCount; i++) {
            const x = Phaser.Math.Between(0, this.gameWidth);
            const y = Phaser.Math.Between(0, this.worldHeight);
            const size = Phaser.Math.FloatBetween(1, 2.5);
            const star = this.add.circle(x, y, size, 0xffffff);
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
        }
    }

    handleResize(gameSize) {
        this.gameWidth = gameSize.width;
        this.gameHeight = gameSize.height;
        
        // Update world bounds
        this.physics.world.setBounds(0, 0, this.gameWidth, this.worldHeight);
        
        // Update camera bounds
        this.cameras.main.setBounds(0, 0, this.gameWidth, this.worldHeight);
        
        // Adjust UI elements
        if (this.scoreText) {
            this.scoreText.setPosition(16, 16);
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

    update() {
        if (this.gameOver) {
            return;
        }

        // Update background planets
        this.backgroundPlanets.forEach(planet => {
            // Move down extremely slowly relative to player speed (parallax effect)
            planet.y -= this.gameSpeed * 0.0005 * planet.scale;  // Twice as slow
            planet.rotation += planet.rotationSpeed;
            
            // Wrap around when off screen
            if (planet.y > this.cameras.main.scrollY + 900) {
                planet.y = this.cameras.main.scrollY - 100;
                planet.x = Phaser.Math.Between(0, 800);
            }
        });

        // Handle horizontal movement
        if (this.cursors.left.isDown) {
            this.player.setAccelerationX(-500);
        } else if (this.cursors.right.isDown) {
            this.player.setAccelerationX(500);
        } else {
            this.player.setAccelerationX(0);
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
        
        // Reset if player goes too far down
        if (this.player.y > this.worldHeight - 50) {
            this.scene.restart();
        }

        // Clean up off-screen asteroids
        this.asteroids.children.iterate(function(asteroid) {
            if (asteroid && (
                asteroid.x < -350 || 
                asteroid.x > 1150 || 
                asteroid.y > asteroid.scene.cameras.main.scrollY + 800
            )) {
                asteroid.destroy();
            }
        });
    }
} 