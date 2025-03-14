import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import StartScene from './scenes/StartScene';
import LeaderboardScene from './scenes/LeaderboardScene';
// Import the font to ensure it's included in the bundle
import './assets/fonts/Micro5-Regular.ttf';

// Global font style configuration
export const FontStyles = {
    // Title text (large headers)
    title: {
        fontFamily: '"Micro 5", monospace',
        fontSize: '64px',
        fill: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: { blur: 8, fill: true, offsetX: 2, offsetY: 2 }
    },
    // Medium sized text (buttons, headers)
    medium: {
        fontFamily: '"Micro 5", monospace',
        fontSize: '36px',
        fill: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { blur: 4, fill: true, offsetX: 1, offsetY: 1 }
    },
    // Standard text (regular UI elements)
    standard: {
        fontFamily: '"Micro 5", monospace',
        fontSize: '28px',
        fill: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3
    },
    // HUD text (score, player name)
    hud: {
        fontFamily: '"Micro 5", monospace',
        fontSize: '32px',
        fill: '#ffffff',
        padding: { x: 10, y: 10 },
        stroke: '#000000',
        strokeThickness: 4
    },
    // Game over text
    gameOver: {
        fontFamily: '"Micro 5", monospace',
        fontSize: '120px',
        fill: '#ff0000',
        align: 'center',
        padding: { x: 40, y: 40 },
        stroke: '#000000',
        strokeThickness: 16
    }
};

// Add console logs for debugging
console.log('Game initialization started');

// Font loading check
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up font loader');
    // Create a font loader
    const fontLoader = document.createElement('div');
    fontLoader.style.fontFamily = 'Micro 5';
    fontLoader.style.position = 'absolute';
    fontLoader.style.visibility = 'hidden';
    fontLoader.textContent = '.';
    document.body.appendChild(fontLoader);
    
    console.log('Font loader added to DOM');
});

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: window.innerWidth,
        height: window.innerHeight,
        min: {
            width: 320,
            height: 480
        },
        max: {
            width: 2048,
            height: 2048
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [StartScene, GameScene, LeaderboardScene]
};

console.log('Creating game instance with config:', config);

// Create game instance
const game = new Phaser.Game(config);

console.log('Game instance created');

// Handle mobile touch controls
if ('ontouchstart' in window) {
    console.log('Setting up mobile touch controls');
    let touchX = null;
    const touchThreshold = 50;

    window.addEventListener('touchstart', (e) => {
        touchX = e.touches[0].clientX;
    });

    window.addEventListener('touchmove', (e) => {
        if (touchX === null) return;
        
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchX;
        
        if (Math.abs(diff) > touchThreshold) {
            // Get the active game scene
            const gameScene = game.scene.getScene('GameScene');
            
            // Only control player if game scene is active and player exists
            if (gameScene && gameScene.scene.isActive() && gameScene.player) {
                if (diff > 0) {
                    gameScene.player.setAccelerationX(500);
                } else {
                    gameScene.player.setAccelerationX(-500);
                }
            }
        }
        
        touchX = currentX;
    });

    window.addEventListener('touchend', () => {
        // Get the active game scene
        const gameScene = game.scene.getScene('GameScene');
        
        // Only control player if game scene is active and player exists
        if (gameScene && gameScene.scene.isActive() && gameScene.player) {
            gameScene.player.setAccelerationX(0);
        }
        
        touchX = null;
    });
} 