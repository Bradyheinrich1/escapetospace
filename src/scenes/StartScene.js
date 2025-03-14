import Phaser from 'phaser';
import { FontStyles } from '../index';

export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
        this.playerName = '';
        this.fontLoaded = false;
    }

    preload() {
        // Load background image
        this.load.image('background', 'assets/takemyhandanon.jpg');
        
        // Add load complete event
        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
        });

        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading asset:', fileObj.src);
        });

        // Load custom font using FontFace API
        const customFont = new FontFace('Micro 5', 'url(src/assets/fonts/Micro5-Regular.ttf)');
        customFont.load().then((font) => {
            document.fonts.add(font);
            this.fontLoaded = true;
            
            // Update text styles if they exist
            if (this.titleText) this.titleText.setStyle(FontStyles.title);
            if (this.namePrompt) this.namePrompt.setStyle(FontStyles.medium);
            if (this.startText) this.startText.setStyle(FontStyles.medium);
            if (this.debugText) this.debugText.setStyle(FontStyles.standard);
        }).catch((error) => {
            console.error('Font loading failed:', error);
        });
    }

    create() {
        // Add background image
        this.background = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background')
            .setOrigin(0.5);
        
        console.log('Background image dimensions:', {
            width: this.background.width,
            height: this.background.height,
            displayWidth: this.background.displayWidth,
            displayHeight: this.background.displayHeight
        });
        
        // Scale the background to cover the screen while maintaining aspect ratio
        const scaleX = this.cameras.main.width / this.background.width;
        const scaleY = this.cameras.main.height / this.background.height;
        const scale = Math.max(scaleX, scaleY);
        this.background.setScale(scale);
        
        console.log('Screen dimensions:', {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            scale: scale
        });
        
        // Add title text with proper font size
        const titleText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.3,
            'ESCAPE TO SPACE',
            FontStyles.title
        ).setOrigin(0.5);
        
        // Add name input prompt with proper font size
        const namePrompt = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.45,
            'Click to enter name',
            FontStyles.medium
        ).setOrigin(0.5);
        
        // Start button with proper font size
        const startButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.7,
            300, // Increased button width for better visibility
            80,  // Increased button height for better touch targets
            0x00aa00
        ).setInteractive();
        
        const startText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.7,
            'START',
            FontStyles.medium
        ).setOrigin(0.5);
        
        // Store references for resize handling
        this.titleText = titleText;
        this.namePrompt = namePrompt;
        this.startButton = startButton;
        this.startText = startText;
        
        // Add input field background
        const inputFieldBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height * 0.55,
            400, // Increased width for better visibility
            80,  // Increased height for better touch targets
            0x333333,
            0.8
        ).setOrigin(0.5).setInteractive();

        // Store the input field reference
        this.inputFieldBg = inputFieldBg;
        this.inputText = namePrompt; // Reuse the namePrompt as inputText

        // Make input field interactive
        inputFieldBg.on('pointerdown', () => {
            // Prompt for name
            const name = prompt('Enter your name:', 'Player');
            if (name && name.trim() !== '') {
                this.playerName = name.trim();
                namePrompt.setText(this.playerName);
                
                // Enable start button
                startButton.setFillStyle(0x00aa00);
                startText.setFill('#ffffff');
            }
        });

        // Make start button interactive
        startButton.on('pointerdown', () => {
            if (this.playerName) {
                localStorage.setItem('playerName', this.playerName);
                this.scene.start('GameScene');
            } else {
                // If no name entered, prompt user
                namePrompt.setText('Please enter a name first!');
                namePrompt.setFill('#ff0000');
            }
        });

        // Initially disable start button until name is entered
        startButton.setFillStyle(0x444444);
        startText.setFill('#aaaaaa');
        
        // Debug info
        this.debugText = this.add.text(10, 10, 'StartScene loaded', FontStyles.standard);
        
        // Handle window resize
        this.scale.on('resize', this.handleResize, this);
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update title position
        if (this.titleText) {
            this.titleText.setPosition(width / 2, height * 0.3);
        }
        
        // Update input field
        if (this.namePrompt) {
            this.namePrompt.setPosition(width / 2, height * 0.45);
        }
        
        // Update input field background
        if (this.inputFieldBg) {
            this.inputFieldBg.setPosition(width / 2, height * 0.55);
        }
        
        // Update start button - add null check before calling setSize
        if (this.startButton) {
            this.startButton.setPosition(width / 2, height * 0.7);
            // Ensure button size is appropriate for the screen
            if (this.startButton.setSize) {
                this.startButton.setSize(
                    Math.min(300, width * 0.8), 
                    80
                );
            }
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