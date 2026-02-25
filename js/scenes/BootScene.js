// BootScene.js — Title screen, loads questions, transitions to CharacterCreator

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Nothing to preload from disk — all sprites generated programmatically
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Animated starfield background ────────────────────────────────────────
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, W),
        y: Phaser.Math.Between(0, H),
        speed: Phaser.Math.FloatBetween(0.2, 1.2),
        size: Phaser.Math.Between(1, 3),
        brightness: Phaser.Math.FloatBetween(0.3, 1.0)
      });
    }
    this.bg = this.add.graphics();

    // ── Title ─────────────────────────────────────────────────────────────────
    // Glow behind title
    const glowGraphic = this.add.graphics();
    glowGraphic.fillStyle(0x00e5ff, 0.05);
    glowGraphic.fillEllipse(W / 2, H / 2 - 80, 600, 180);

    this.add.text(W / 2, H / 2 - 140, 'ABDOMINAL', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '38px',
      color: '#00e5ff',
      stroke: '#003344',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 24, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 78, 'ODYSSEY', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '52px',
      color: '#ffffff',
      stroke: '#00e5ff',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 30, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 10, '— Abdominal Imaging Reading Room —', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#4fc3f7',
      alpha: 0.8
    }).setOrigin(0.5);

    // ── Subtitle: UH Cleveland ─────────────────────────────────────────────
    this.add.text(W / 2, H / 2 + 30, 'University Hospitals Cleveland Medical Center', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px',
      color: '#667788'
    }).setOrigin(0.5);

    // ── Blinking start prompt ─────────────────────────────────────────────
    this.startText = this.add.text(W / 2, H / 2 + 110, 'PRESS  ENTER  TO  BEGIN', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '14px',
      color: '#ffd700',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffd700', blur: 12, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── Characters preview (silhouettes) ──────────────────────────────────
    this.add.text(W / 2, H - 60, 'The Residents are coming... face the Gods of Abdominal Imaging', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '6px',
      color: '#445566',
      wordWrap: { width: 600 }
    }).setOrigin(0.5);

    // ── Load questions from API ───────────────────────────────────────────
    fetch('/api/questions')
      .then(r => r.json())
      .then(data => {
        window.GameState.questions = data;
        this._questionsLoaded = true;
      })
      .catch(() => {
        // Fallback: load from inline data if server not running
        this._questionsLoaded = true;
        this._showOfflineNotice();
      });

    // ── Input ─────────────────────────────────────────────────────────────
    this.input.keyboard.once('keydown-ENTER', () => this._start());
    this.input.on('pointerdown', () => this._start());

    // ── Init dialog system ────────────────────────────────────────────────
    DialogSystem.init();

    // ── Floating particles ─────────────────────────────────────────────────
    this._spawnParticles();
  }

  _showOfflineNotice() {
    this.add.text(this.scale.width / 2, this.scale.height - 30,
      '⚠ Offline mode — start server for full Q&A features', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '6px',
      color: '#ff8800'
    }).setOrigin(0.5);
  }

  _start() {
    if (!this._questionsLoaded) return; // wait for questions
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CharacterCreatorScene');
    });
  }

  _spawnParticles() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.particles = [];
    const icons = ['⚕', '+', '✦', '◈'];
    for (let i = 0; i < 12; i++) {
      const t = this.add.text(
        Phaser.Math.Between(60, W - 60),
        Phaser.Math.Between(H * 0.55, H - 70),
        Phaser.Utils.Array.GetRandom(icons),
        { fontSize: `${Phaser.Math.Between(12, 22)}px`, color: '#00e5ff', alpha: 0.15 }
      );
      this.tweens.add({
        targets: t,
        y: t.y - Phaser.Math.Between(40, 100),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        delay: Phaser.Math.Between(0, 4000),
        repeat: -1,
        onRepeat: () => {
          t.x = Phaser.Math.Between(60, W - 60);
          t.y = H - 70;
          t.alpha = 0.15;
        }
      });
    }
  }

  update() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.bg.clear();
    this.bg.fillStyle(0x1a1a2e, 1);
    this.bg.fillRect(0, 0, W, H);
    this.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) { s.y = 0; s.x = Phaser.Math.Between(0, W); }
      this.bg.fillStyle(0xffffff, s.brightness);
      this.bg.fillRect(s.x, s.y, s.size, s.size);
    });
  }
}
