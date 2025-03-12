import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%',
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
    scene: GameScene
};

// Create game instance
const game = new Phaser.Game(config);

// Handle mobile touch controls
if ('ontouchstart' in window) {
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
            const scene = game.scene.scenes[0];
            if (scene && scene.player) {
                if (diff > 0) {
                    scene.player.setAccelerationX(500);
                } else {
                    scene.player.setAccelerationX(-500);
                }
            }
        }
        
        touchX = currentX;
    });

    window.addEventListener('touchend', () => {
        const scene = game.scene.scenes[0];
        if (scene && scene.player) {
            scene.player.setAccelerationX(0);
        }
        touchX = null;
    });
} 