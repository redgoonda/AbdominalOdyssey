// GameOverScene.js — Win / Lose screen

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this._won = data && data.won;
  }

  create() {
    const W = 960, H = 640;
    const gs = window.GameState;

    const bg = this.add.graphics();
    bg.fillStyle(this._won ? 0x0a1a0a : 0x1a0a0a, 1);
    bg.fillRect(0, 0, W, H);

    // Starfield / particle effect
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      bg.fillStyle(this._won ? 0xffd700 : 0xff4444, Phaser.Math.FloatBetween(0.05, 0.3));
      bg.fillRect(x, y, Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3));
    }

    if (this._won) {
      this._showVictory(W, H, gs);
    } else {
      this._showGameOver(W, H, gs);
    }
  }

  _showVictory(W, H, gs) {
    // Confetti-style particles
    for (let i = 0; i < 60; i++) {
      const g = this.add.graphics();
      const col = [0xffd700, 0x00e5ff, 0x2ecc71, 0xff6699, 0xffffff][i % 5];
      g.fillStyle(col, 1);
      g.fillRect(0, 0, Phaser.Math.Between(4, 12), Phaser.Math.Between(4, 12));
      g.x = Phaser.Math.Between(0, W);
      g.y = Phaser.Math.Between(-50, H);
      this.tweens.add({
        targets: g,
        y: H + 20,
        x: g.x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-360, 360),
        alpha: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(3000, 7000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1
      });
    }

    this.add.text(W / 2, 120, '🏆  VICTORY!  🏆', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#ffd700', blur: 40, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, 200, 'YOU HAVE CONQUERED ABDOMINAL ODYSSEY!', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 250, `Dr. ${gs.playerName} — Chief Resident of Abdominal Imaging`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#4fc3f7'
    }).setOrigin(0.5);

    // Score breakdown
    const breakdown = this.add.text(W / 2, 320,
      `FINAL SCORE: ${gs.score}\n\nAll 5 Gods of Abdominal Imaging — Defeated!\n\n` +
      `Dr. Mohamed      — Education God    ✓\n` +
      `Dr. Kasprzak     — Business God     ✓\n` +
      `Dr. Kayat        — Prostate God     ✓\n` +
      `Dr. Ramaiya      — Cancer God       ✓\n` +
      `Dr. Tirumani     — Clinical God     ✓`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#aaccaa',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    this._addButtons(W, H, '#ffd700', '#004400', '#27ae60');
  }

  _showGameOver(W, H, gs) {
    this.add.text(W / 2, 120, 'GAME OVER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '52px',
      color: '#ff2222',
      stroke: '#000000',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 40, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, 210, `Dr. ${gs.playerName} has been defeated by the Reading Room...`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#aaaaaa',
      wordWrap: { width: 700 }
    }).setOrigin(0.5);

    this.add.text(W / 2, 280, `FINAL SCORE: ${gs.score}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '16px',
      color: '#ff8800'
    }).setOrigin(0.5);

    const defeated = gs.clearedAttending.size;
    const total    = 5;
    const pct      = Math.round((defeated / total) * 100);
    this.add.text(W / 2, 350,
      `Progress: ${defeated}/${total} Attendings cleared (${pct}%)\n\n` +
      `The Reading Room awaits your return, Resident.`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#cc8888',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    this._addButtons(W, H, '#ff4444', '#1a0000', '#cc2222');
  }

  _addButtons(W, H, textColor, bgColor, borderColor) {
    const btns = [
      { label: '↺  PLAY AGAIN', x: W / 2 - 200, action: () => this._playAgain() },
      { label: '⌂  MAIN MENU',  x: W / 2 + 200, action: () => this._mainMenu()  },
    ];

    btns.forEach(btn => {
      const g = this.add.graphics();
      g.fillStyle(parseInt(bgColor.replace('#', '0x')), 1);
      g.fillRoundedRect(btn.x - 140, H - 140, 280, 54, 10);
      g.lineStyle(2, parseInt(borderColor.replace('#', '0x')), 1);
      g.strokeRoundedRect(btn.x - 140, H - 140, 280, 54, 10);

      const txt = this.add.text(btn.x, H - 113, btn.label, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '12px',
        color: textColor
      }).setOrigin(0.5);

      const zone = this.add.zone(btn.x - 140, H - 140, 280, 54).setOrigin(0);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => txt.setAlpha(0.7));
      zone.on('pointerout',  () => txt.setAlpha(1.0));
      zone.on('pointerdown', btn.action);
    });

    // Keyboard shortcut: Enter = play again
    this.input.keyboard.once('keydown-ENTER', () => this._playAgain());
    this.input.keyboard.once('keydown-SPACE', () => this._playAgain());
  }

  _playAgain() {
    window.GameState.reset();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CharacterCreatorScene');
    });
  }

  _mainMenu() {
    window.GameState.reset();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('BootScene');
    });
  }
}
