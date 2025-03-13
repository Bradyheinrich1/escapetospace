import Phaser from 'phaser';

export default class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
        this.highScores = [];
        this.currentScore = 0;
        this.playerName = '';
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

    create() {
        console.log('LeaderboardScene create called');
        
        // Simple black background
        this.background = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0);
        
        // Title
        this.titleText = this.add.text(
            this.cameras.main.width / 2,
            50,
            'HIGH SCORES',
            {
                fontFamily: 'monospace',
                fontSize: '48px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Your score
        this.scoreText = this.add.text(
            this.cameras.main.width / 2,
            120,
            `${this.playerName}: ${this.currentScore}`,
            {
                fontFamily: 'monospace',
                fontSize: '32px',
                fill: '#ffff00',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Display high scores in a simple format
        this.displaySimpleHighScores();
        
        // Play again button
        this.playAgainButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            250,
            50,
            0x00aa00
        ).setOrigin(0.5);
        
        this.playAgainText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'PLAY AGAIN',
            {
                fontFamily: 'monospace',
                fontSize: '24px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Make play again button interactive
        this.playAgainButton.setInteractive();
        this.playAgainButton.on('pointerdown', () => {
            console.log('Play again button clicked');
            this.scene.start('GameScene');
        });
        
        // New player button
        this.newPlayerButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height - 40,
            250,
            50,
            0x0066aa
        ).setOrigin(0.5);
        
        this.newPlayerText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 40,
            'NEW PLAYER',
            {
                fontFamily: 'monospace',
                fontSize: '24px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Make new player button interactive
        this.newPlayerButton.setInteractive();
        this.newPlayerButton.on('pointerdown', () => {
            console.log('New player button clicked');
            this.scene.start('StartScene');
        });
        
        // Debug info
        this.debugText = this.add.text(10, 10, 'LeaderboardScene loaded', { fontFamily: 'monospace', fontSize: '16px', fill: '#ffffff' });
        
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
        if (this.scoreText) {
            this.scoreText.setPosition(width / 2, 120);
        }
        
        // Update buttons
        if (this.playAgainButton) {
            this.playAgainButton.setPosition(width / 2, height - 100);
        }
        
        if (this.playAgainText) {
            this.playAgainText.setPosition(width / 2, height - 100);
        }
        
        if (this.newPlayerButton) {
            this.newPlayerButton.setPosition(width / 2, height - 40);
        }
        
        if (this.newPlayerText) {
            this.newPlayerText.setPosition(width / 2, height - 40);
        }
        
        // Update debug text
        if (this.debugText) {
            this.debugText.setPosition(10, 10);
        }
        
        // Redraw high scores
        this.displaySimpleHighScores();
    }
    
    loadHighScores() {
        try {
            const savedScores = localStorage.getItem('highScores');
            this.highScores = savedScores ? JSON.parse(savedScores) : [];
            console.log('Loaded high scores:', this.highScores);
        } catch (e) {
            console.error('Error loading high scores:', e);
            this.highScores = [];
        }
    }
    
    saveHighScores() {
        try {
            localStorage.setItem('highScores', JSON.stringify(this.highScores));
            console.log('Saved high scores:', this.highScores);
        } catch (e) {
            console.error('Error saving high scores:', e);
        }
    }
    
    addScore(name, score) {
        // Only add score if it's greater than 0
        if (score <= 0) return;
        
        // Add the new score
        this.highScores.push({ name, score });
        
        // Sort high scores (highest first)
        this.highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10 scores
        if (this.highScores.length > 10) {
            this.highScores = this.highScores.slice(0, 10);
        }
        
        console.log('Added score, new high scores:', this.highScores);
    }
    
    displaySimpleHighScores() {
        // Remove any existing score texts
        if (this.scoreTexts) {
            this.scoreTexts.forEach(text => text.destroy());
        }
        
        this.scoreTexts = [];
        
        // Display high scores in a simple format
        const startY = 200;
        const lineHeight = 30;
        
        // Header
        const headerText = this.add.text(
            this.cameras.main.width / 2,
            startY,
            'RANK  NAME                SCORE',
            {
                fontFamily: 'monospace',
                fontSize: '20px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        this.scoreTexts.push(headerText);
        
        // Scores
        for (let i = 0; i < Math.min(this.highScores.length, 10); i++) {
            const score = this.highScores[i];
            const isCurrentScore = score.name === this.playerName && score.score === this.currentScore;
            
            // Format the score line
            let rankText = `${i + 1}`.padEnd(6);
            let nameText = score.name.substring(0, 15).padEnd(20);
            let scoreText = `${score.score}`;
            
            const text = this.add.text(
                this.cameras.main.width / 2,
                startY + (i + 1) * lineHeight,
                `${rankText}${nameText}${scoreText}`,
                {
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fill: isCurrentScore ? '#ffff00' : '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);
            
            this.scoreTexts.push(text);
        }
        
        // If no scores, show a message
        if (this.highScores.length === 0) {
            const noScoresText = this.add.text(
                this.cameras.main.width / 2,
                startY + lineHeight,
                'No high scores yet!',
                {
                    fontFamily: 'monospace',
                    fontSize: '20px',
                    fill: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);
            
            this.scoreTexts.push(noScoresText);
        }
    }
} 