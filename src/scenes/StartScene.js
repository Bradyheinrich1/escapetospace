import Phaser from 'phaser';

export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
        this.playerName = '';
    }

    create() {
        // Simple black background
        this.background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0);
        
        // Add some text to confirm the scene is working
        this.titleText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.2,
            'ESCAPE TO SPACE',
            {
                fontFamily: 'monospace', // Use a system font first to test
                fontSize: '64px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Add a simple input field
        this.inputFieldBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.5,
            300,
            50,
            0x333333
        ).setOrigin(0.5);
        
        this.inputText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.5,
            'Click to enter name',
            {
                fontFamily: 'monospace',
                fontSize: '24px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Make input field interactive
        this.inputFieldBg.setInteractive();
        this.inputFieldBg.on('pointerdown', () => {
            // Prompt for name
            const name = prompt('Enter your name:', 'Player');
            if (name && name.trim() !== '') {
                this.playerName = name.trim();
                this.inputText.setText(this.playerName);
                
                // Enable start button
                this.startButton.setFillStyle(0x00aa00);
                this.startText.setFill('#ffffff');
                this.startButton.setInteractive();
            }
        });
        
        // Start button
        this.startButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.7,
            200,
            50,
            0x444444
        ).setOrigin(0.5);
        
        this.startText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.7,
            'START',
            {
                fontFamily: 'monospace',
                fontSize: '24px',
                fill: '#aaaaaa',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Make start button interactive
        this.startButton.on('pointerdown', () => {
            if (this.playerName) {
                localStorage.setItem('playerName', this.playerName);
                this.scene.start('GameScene');
            }
        });
        
        // Debug info
        this.debugText = this.add.text(10, 10, 'StartScene loaded', { fontFamily: 'monospace', fontSize: '16px', fill: '#ffffff' });
        
        // Handle window resize
        this.scale.on('resize', this.handleResize, this);
    }
    
    handleResize() {
        // Update positions of UI elements on resize
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Update background
        if (this.background) {
            this.background.setSize(width, height);
        }
        
        // Update title position
        if (this.titleText) {
            this.titleText.setPosition(width / 2, height * 0.2);
        }
        
        // Update input field
        if (this.inputFieldBg) {
            this.inputFieldBg.setPosition(width / 2, height * 0.5);
        }
        
        if (this.inputText) {
            this.inputText.setPosition(width / 2, height * 0.5);
        }
        
        // Update start button
        if (this.startButton) {
            this.startButton.setPosition(width / 2, height * 0.7);
        }
        
        if (this.startText) {
            this.startText.setPosition(width / 2, height * 0.7);
        }
        
        // Update debug text
        if (this.debugText) {
            this.debugText.setPosition(10, 10);
        }
    }
} 