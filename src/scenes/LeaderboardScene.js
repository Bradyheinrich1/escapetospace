import Phaser from 'phaser';
import { FontStyles } from '../index';

export default class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
        this.highScores = [];
        this.currentScore = 0;
        this.playerName = '';
        this.fontLoaded = false;
        console.log('LeaderboardScene constructor called');
    }

    init(data) {
        console.log('LeaderboardScene init called with data:', data);
        
        // Get data passed from GameScene
        this.currentScore = data.score || 0;
        this.playerName = data.playerName || localStorage.getItem('playerName') || 'Unknown';
        
        console.log('Current score:', this.currentScore);
        console.log('Player name:', this.playerName);
        
        // Load high scores from localStorage
        this.loadHighScores();
        
        // Add current score to high scores
        this.addScore(this.playerName, this.currentScore);
        
        // Save updated high scores
        this.saveHighScores();
    }

    preload() {
        // Load custom font using FontFace API
        const customFont = new FontFace('Micro 5', 'url(src/assets/fonts/Micro5-Regular.ttf)');
        customFont.load().then((font) => {
            document.fonts.add(font);
            this.fontLoaded = true;
            
            // Update text styles if they exist
            if (this.titleText) this.titleText.setStyle(FontStyles.title);
            if (this.playerScoreText) this.playerScoreText.setStyle(FontStyles.medium);
            if (this.playAgainText) this.playAgainText.setStyle(FontStyles.medium);
            if (this.newPlayerText) this.newPlayerText.setStyle(FontStyles.medium);
            if (this.debugText) this.debugText.setStyle(FontStyles.standard);
            
            // Update leaderboard entries if they exist
            if (this.leaderboardEntries) {
                this.leaderboardEntries.forEach(entry => {
                    entry.setStyle(FontStyles.standard);
                });
            }
        }).catch((error) => {
            console.error('Font loading failed:', error);
        });
    }

    create() {
        console.log('LeaderboardScene create called');
        
        // Simple black background
        this.background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0);
        
        // Add title text with proper font size
        this.titleText = this.add.text(
            this.cameras.main.width / 2,
            50,
            'HIGH SCORES',
            FontStyles.title
        ).setOrigin(0.5);
        
        // Display player score with proper font size
        this.playerScoreText = this.add.text(
            this.cameras.main.width / 2,
            100,
            `Player: ${this.currentScore}`,
            FontStyles.medium
        ).setOrigin(0.5);
        
        // Create column headers with proper font size
        this.rankHeaderText = this.add.text(
            this.cameras.main.width * 0.2,
            150,
            'RANK',
            FontStyles.standard
        ).setOrigin(0.5);
        
        this.nameHeaderText = this.add.text(
            this.cameras.main.width * 0.5,
            150,
            'NAME',
            FontStyles.standard
        ).setOrigin(0.5);
        
        this.scoreHeaderText = this.add.text(
            this.cameras.main.width * 0.8,
            150,
            'SCORE',
            FontStyles.standard
        ).setOrigin(0.5);
        
        // Display high scores in a simple format
        this.displayLeaderboard();
        
        // Play again button
        this.playAgainButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height - 150,
            300, // Increased button width for better visibility
            80,  // Increased button height for better touch targets
            0x00aa00
        ).setInteractive();
        
        this.playAgainText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 150,
            'PLAY AGAIN',
            FontStyles.medium
        ).setOrigin(0.5);
        
        // New player button
        this.newPlayerButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height - 80,
            300, // Increased button width for better visibility
            80,  // Increased button height for better touch targets
            0x0000aa
        ).setInteractive();
        
        this.newPlayerText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 80,
            'NEW PLAYER',
            FontStyles.medium
        ).setOrigin(0.5);
        
        // Debug info
        this.debugText = this.add.text(10, 10, 'LeaderboardScene loaded', FontStyles.standard);
        
        // Add button event handlers
        this.playAgainButton.on('pointerdown', () => {
            console.log('Play again button clicked');
            this.scene.start('GameScene');
        });

        this.newPlayerButton.on('pointerdown', () => {
            console.log('New player button clicked');
            this.scene.start('StartScene');
        });
        
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
            this.titleText.setPosition(width / 2, 50);
        }
        
        // Update score text
        if (this.playerScoreText) {
            this.playerScoreText.setPosition(width / 2, 100);
        }
        
        // Update column headers
        if (this.rankHeaderText) {
            this.rankHeaderText.setPosition(width * 0.2, 150);
        }
        
        if (this.nameHeaderText) {
            this.nameHeaderText.setPosition(width * 0.5, 150);
        }
        
        if (this.scoreHeaderText) {
            this.scoreHeaderText.setPosition(width * 0.8, 150);
        }
        
        // Update buttons
        if (this.playAgainButton) {
            this.playAgainButton.setPosition(width / 2, height - 150);
            // Ensure button size is appropriate for the screen
            if (this.playAgainButton.setSize) {
                this.playAgainButton.setSize(
                    Math.min(300, width * 0.8), 
                    80
                );
            }
        }
        
        if (this.playAgainText) {
            this.playAgainText.setPosition(width / 2, height - 150);
        }
        
        if (this.newPlayerButton) {
            this.newPlayerButton.setPosition(width / 2, height - 80);
            // Ensure button size is appropriate for the screen
            if (this.newPlayerButton.setSize) {
                this.newPlayerButton.setSize(
                    Math.min(300, width * 0.8), 
                    80
                );
            }
        }
        
        if (this.newPlayerText) {
            this.newPlayerText.setPosition(width / 2, height - 80);
        }
        
        // Update debug text
        if (this.debugText) {
            this.debugText.setPosition(10, 10);
        }
        
        // Update leaderboard entries
        this.displayLeaderboard();
    }
    
    loadHighScores() {
        const savedScores = localStorage.getItem('highScores');
        this.highScores = savedScores ? JSON.parse(savedScores) : [];
        console.log('Loaded high scores:', this.highScores);
    }
    
    saveHighScores() {
        localStorage.setItem('highScores', JSON.stringify(this.highScores));
        console.log('Saved high scores:', this.highScores);
    }
    
    addScore(name, score) {
        // Add score to high scores
        this.highScores.push({ name, score });
        
        // Sort high scores in descending order
        this.highScores.sort((a, b) => b.score - a.score);
        
        // Limit to top 10 scores
        if (this.highScores.length > 10) {
            this.highScores = this.highScores.slice(0, 10);
        }
    }
    
    displayLeaderboard() {
        // Clear any existing leaderboard entries
        if (this.leaderboardEntries) {
            this.leaderboardEntries.forEach(entry => entry.destroy());
        }
        
        this.leaderboardEntries = [];
        
        // Display top 10 scores
        const startY = 200;
        const spacing = 50; // Increased spacing for better readability
        
        for (let i = 0; i < Math.min(this.highScores.length, 10); i++) {
            const entry = this.highScores[i];
            
            // Rank
            const rankText = this.add.text(
                this.cameras.main.width * 0.2,
                startY + (i * spacing),
                `${i + 1}`,
                FontStyles.standard
            ).setOrigin(0.5);
            
            // Name
            const nameText = this.add.text(
                this.cameras.main.width * 0.5,
                startY + (i * spacing),
                entry.name,
                FontStyles.standard
            ).setOrigin(0.5);
            
            // Score
            const scoreText = this.add.text(
                this.cameras.main.width * 0.8,
                startY + (i * spacing),
                `${entry.score}`,
                FontStyles.standard
            ).setOrigin(0.5);
            
            // Highlight the player's score
            if (entry.name === this.playerName && entry.score === this.currentScore) {
                rankText.setFill('#ffff00');
                nameText.setFill('#ffff00');
                scoreText.setFill('#ffff00');
            }
            
            this.leaderboardEntries.push(rankText, nameText, scoreText);
        }
    }
} 