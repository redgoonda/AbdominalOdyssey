// FinalBossScene.js — Dr. Sree Harsha Tirumani: The Clinical God (FINAL BOSS)
// Golden throne room, hardest questions, epic entrance

class FinalBossScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalBossScene' });
  }

  create() {
    const W = 960, H = 640;
    const gs = window.GameState;
    this._dialogOpen = false;
    this._bossCleared = false;
    this._bossInteractable = false;
    this._entranceDone = false;

    if (!this.textures.exists('player_down')) {
      createAllSprites(this, { gender: gs.gender, headStyle: gs.headStyle, clothStyle: gs.clothStyle, skinTone: gs.skinTone });
    }

    this.physics.world.setBounds(0, 80, W, 480);
    this._drawFinalBossRoom();

    this._enemies    = this.physics.add.group();
    this._projectiles = this.physics.add.group();
    this._spawnFinalEnemies();

    // Player enters from right
    this._player = this.physics.add.sprite(880, H / 2, 'player_left');
    this._player.setCollideWorldBounds(true);
    this._player.setDepth(10);
    this._player.facing = 'left';
    this._player.body.setSize(40, 50);

    this.physics.add.overlap(this._player, this._enemies, (player, enemy) => {
      if (enemy._stunned) return;
      this._takeDamage();
      enemy._stunned = true;
      enemy.setAlpha(0.4);
      this.time.delayedCall(3000, () => { if (enemy && enemy.active) { enemy._stunned = false; enemy.setAlpha(1); } });
    });

    this.physics.add.overlap(this._projectiles, this._enemies, (probe, enemy) => {
      if (enemy._stunned) return;
      probe.destroy();
      enemy._stunned = true;
      enemy._hp = (enemy._hp || 5) - 1;
      this.tweens.add({ targets: enemy, alpha: 0.2, yoyo: true, duration: 200 });
      window.GameState.addScore(20);
      this._updateHUD();
      if (enemy._hp <= 0) {
        this.tweens.add({ targets: enemy, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, onComplete: () => enemy.destroy() });
      } else {
        this.time.delayedCall(2500, () => { if (enemy && enemy.active) { enemy._stunned = false; enemy.setAlpha(1); } });
      }
    });

    // Dr. Tirumani — FINAL BOSS at center-left, enthroned
    this._bossSprite = this.add.image(160, H / 2, 'attending_tirumani').setDepth(8).setScale(1.6);
    // Golden throne effect
    const throneGfx = this.add.graphics().setDepth(3);
    throneGfx.fillStyle(0x8b6914, 1);
    throneGfx.fillRect(100, H / 2 - 80, 140, 160);
    throneGfx.lineStyle(4, 0xffd700, 1);
    throneGfx.strokeRect(100, H / 2 - 80, 140, 160);
    // Gold glow
    throneGfx.fillStyle(0xffd700, 0.08);
    throneGfx.fillCircle(160, H / 2, 130);

    // Boss labels (hidden until entrance)
    this._bossLabel = this.add.text(160, H / 2 - 130, 'The Clinical God', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#ffd700',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffd700', blur: 24, fill: true }
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this._bossSubLabel = this.add.text(160, H / 2 - 108, '👑  DIVISION CHIEF  ·  THE CLINICAL GOD', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this._bossPrompt = this.add.text(160, H / 2 + 120, '[ E ] FACE THE CHIEF',
      { fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#ffd700', backgroundColor: '#000000cc', padding: { x: 6, y: 3 } }
    ).setOrigin(0.5).setDepth(10).setVisible(false);

    this._buildBossHPBar();
    this._buildHUD();

    this._cursors   = this.input.keyboard.createCursorKeys();
    this._wasd      = this.input.keyboard.addKeys('W,A,S,D');
    this._spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._eKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._probeCooldown = 0;

    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.time.delayedCall(400, () => this._playFinalBossEntrance());
  }

  _drawFinalBossRoom() {
    const W = 960, H = 640;
    const g = this.add.graphics();

    // Regal dark background
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(0, 0, W, H);

    // Floor: deep purple/gold patterned
    g.fillStyle(0x100818, 1);
    g.fillRect(0, 80, W, 480);

    // Gold diamond floor pattern
    g.lineStyle(1, 0x3a2800, 0.5);
    for (let x = 0; x < W; x += 64) {
      for (let y = 80; y < 560; y += 64) {
        g.strokeRect(x, y, 64, 64);
      }
    }
    g.lineStyle(1, 0x5a3800, 0.25);
    for (let x = -32; x < W; x += 64) {
      g.lineBetween(x, 80, x + 240, 560);
    }

    // Top wall — ornate
    g.fillStyle(0x1a0d00, 1);
    g.fillRect(0, 0, W, 80);
    g.lineStyle(4, 0xffd700, 0.7);
    g.lineBetween(0, 80, W, 80);
    g.lineStyle(1, 0xffd700, 0.3);
    g.lineBetween(0, 75, W, 75);

    // Bottom wall
    g.fillStyle(0x1a0d00, 1);
    g.fillRect(0, 560, W, 80);
    g.lineStyle(4, 0xffd700, 0.7);
    g.lineBetween(0, 560, W, 560);

    // Gold spotlights
    g.fillStyle(0xffd700, 0.06);
    g.fillCircle(160, 320, 200);
    g.fillStyle(0xffd700, 0.03);
    g.fillCircle(160, 320, 320);

    // Crown banners on top wall
    for (let bx = 200; bx < W; bx += 180) {
      g.fillStyle(0x8b0000, 1);
      g.fillRect(bx, 8, 40, 65);
      g.fillStyle(0xffd700, 1);
      g.fillTriangle(bx, 8, bx + 40, 8, bx + 20, 0);
      g.fillTriangle(bx, 73, bx + 40, 73, bx + 20, 85);
      // Gold trim
      g.lineStyle(1, 0xffd700, 1);
      g.strokeRect(bx + 4, 12, 32, 55);
    }

    // "DIVISION CHIEF" on wall
    this.add.text(W / 2 + 100, H / 2, 'DIVISION\nCHIEF', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '72px',
      color: '#ffd70008',
      align: 'center'
    }).setOrigin(0.5).setDepth(0);

    // Wall plaques
    const plaqueTexts = ['RESEARCH', 'INNOVATION', 'EXCELLENCE'];
    plaqueTexts.forEach((txt, i) => {
      const px = 400 + i * 180;
      g.fillStyle(0x3a2800, 1);
      g.fillRect(px, 10, 120, 55);
      g.lineStyle(2, 0xffd700, 1);
      g.strokeRect(px, 10, 120, 55);
      this.add.text(px + 60, 37, txt, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '6px',
        color: '#ffd700'
      }).setOrigin(0.5).setDepth(1);
    });
  }

  _playFinalBossEntrance() {
    const W = 960, H = 640;

    const flashBg = this.add.graphics().setDepth(200);
    flashBg.fillStyle(0x000000, 0.97);
    flashBg.fillRect(0, 0, W, H);

    // Animated title sequence
    const lines = [
      { text: '👑  FINAL BOSS  👑', size: '32px', color: '#ffd700', y: H / 2 - 80 },
      { text: 'THE CLINICAL GOD', size: '18px', color: '#ffffff', y: H / 2 - 20 },
      { text: 'DIVISION CHIEF OF ABDOMINAL IMAGING', size: '9px', color: '#aaaaaa', y: H / 2 + 30 },
      { text: '⭐  THE CLINICAL GOD  ⭐', size: '13px', color: '#ffd700', y: H / 2 + 70 },
    ];

    const textObjs = lines.map(l => this.add.text(W / 2, l.y, l.text, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: l.size,
      color: l.color,
      shadow: { offsetX: 0, offsetY: 0, color: l.color, blur: 30, fill: true },
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(201).setAlpha(0));

    // Staggered text reveal
    textObjs.forEach((obj, i) => {
      this.tweens.add({ targets: obj, alpha: 1, delay: i * 400, duration: 300 });
    });

    this.cameras.main.shake(1000, 0.012);

    this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets: [flashBg, ...textObjs],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          flashBg.destroy();
          textObjs.forEach(o => o.destroy());
          this._bossLabel.setVisible(true);
          this._bossSubLabel.setVisible(true);
          this._entranceDone = true;
          this._bossInteractable = true;
          this._bossHPGroup.setVisible(true);
          // Regal pulse on boss
          this.tweens.add({
            targets: this._bossSprite,
            scaleX: 1.7, scaleY: 1.7,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          // Golden particle ring
          this._spawnGoldParticles();
        }
      });
    });
  }

  _spawnGoldParticles() {
    const cx = 160, cy = 320;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 100;
      const g = this.add.graphics().setDepth(4);
      g.fillStyle(0xffd700, 0.8);
      g.fillRect(0, 0, 6, 6);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      this.tweens.add({
        targets: g,
        x: px - cx,
        y: py - cy,
        alpha: { from: 0.8, to: 0.2 },
        duration: 2000 + i * 100,
        yoyo: true,
        repeat: -1,
        delay: i * 120
      });
    }
  }

  _spawnFinalEnemies() {
    for (let i = 0; i < 6; i++) {
      const tx = Phaser.Math.Between(450, 920);
      const ty = Phaser.Math.Between(120, 520);
      const type = i % 3 === 0 ? 'med_student' : 'tech';
      const enemy = this._enemies.create(tx, ty, type);
      enemy._type = type; enemy._stunned = false; enemy._hp = 5;
      enemy._dir = i % 2 ? 1 : -1;
      enemy._patrolX1 = Math.max(380, tx - 220);
      enemy._patrolX2 = Math.min(940, tx + 220);
      enemy.setDepth(8);
      // Boss's minions are faster
      enemy._speed = 110 + i * 10;
    }
  }

  _buildBossHPBar() {
    this._bossHP = 3;
    this._bossHPGroup = this.add.container(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1a1000, 1);
    barBg.fillRect(280, 8, 400, 28);
    barBg.lineStyle(3, 0xffd700, 1);
    barBg.strokeRect(280, 8, 400, 28);
    this._bossHPGroup.add(barBg);

    this._bossHPLabel = this.add.text(480, 22, '👑 CLINICAL GOD  HP: ███', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#ffd700'
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0.5);
    this._bossHPGroup.add(this._bossHPLabel);
  }

  _updateBossHP() {
    const bars = '█'.repeat(this._bossHP);
    const empty = '░'.repeat(3 - this._bossHP);
    this._bossHPLabel.setText(`👑 CLINICAL GOD  HP: ${bars}${empty}`);
    if (this._bossHP <= 0) this._bossHPLabel.setColor('#444444');
  }

  _buildHUD() {
    this._hearts = [];
    for (let i = 0; i < window.GameState.maxHealth; i++) {
      this._hearts.push(
        this.add.image(28 + i * 36, 620, 'heart_full').setScale(0.85).setScrollFactor(0).setDepth(100)
      );
    }
    this._nameHUD = this.add.text(28, 600, `Dr. ${window.GameState.playerName}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#ffd700'
    }).setScrollFactor(0).setDepth(100);
    this._scoreHUD = this.add.text(930, 620, `SCORE: ${window.GameState.score}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#ffd700'
    }).setScrollFactor(0).setDepth(100).setOrigin(1, 0.5);
    this._updateHUD();
  }

  _updateHUD() {
    const gs = window.GameState;
    this._hearts.forEach((h, i) => h.setTexture(i < gs.health ? 'heart_full' : 'heart_empty'));
    this._scoreHUD.setText(`SCORE: ${gs.score}`);
  }

  _takeDamage() {
    if (this._dialogOpen) return;
    const dead = window.GameState.takeDamage();
    this._updateHUD();
    this.cameras.main.flash(300, 180, 0, 0);
    this.cameras.main.shake(250, 0.01);
    if (dead) {
      this._dialogOpen = true;
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameOverScene', { won: false }));
    }
  }

  _startFinalBattle() {
    if (!this._bossInteractable || this._dialogOpen || this._bossCleared) return;
    this._dialogOpen = true;
    this._player.setVelocity(0);

    DialogSystem.show('tirumani', 'final-boss', ({ cleared, dead }) => {
      this._dialogOpen = false;
      this._updateHUD();
      if (dead) {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameOverScene', { won: false }));
        return;
      }
      if (cleared) {
        this._bossHP = 0;
        this._updateBossHP();
        this._bossCleared = true;
        this._bossInteractable = false;
        this._bossPrompt.setVisible(false);

        window.GameState.addScore(1000);
        this._updateHUD();

        // Epic victory sequence
        this.cameras.main.shake(600, 0.025);
        this.tweens.add({ targets: this._bossSprite, alpha: 0, scaleX: 0, scaleY: 0, duration: 1000 });

        const victoryMsg = this.add.text(480, 280,
          '👑 DIVISION CHIEF DEFEATED!\n+1000 POINTS!\n\nYOU HAVE CONQUERED\nABDOMINAL ODYSSEY!', {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '14px',
          color: '#ffd700',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 6,
          shadow: { offsetX: 0, offsetY: 0, color: '#ffd700', blur: 30, fill: true }
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(4000, () => {
          this.cameras.main.fadeOut(1000, 255, 215, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameOverScene', { won: true });
          });
        });
      } else {
        this._bossHP = Math.max(0, this._bossHP - 1);
        this._updateBossHP();
      }
    });
  }

  _fireProbe() {
    if (this._probeCooldown > 0 || this._dialogOpen) return;
    this._probeCooldown = 500;
    const probe = this._projectiles.create(this._player.x, this._player.y, 'probe');
    probe.setDepth(9);
    probe.body.allowGravity = false;
    const speed = 680;
    switch (this._player.facing) {
      case 'left':  probe.setVelocityX(-speed); break;
      case 'right': probe.setVelocityX(speed);  probe.setFlipX(true); break;
      case 'up':    probe.setVelocityY(-speed);  probe.setAngle(-90); break;
      case 'down':  probe.setVelocityY(speed);   probe.setAngle(90);  break;
      default:      probe.setVelocityX(-speed);
    }
    this.time.delayedCall(1500, () => { if (probe && probe.active) probe.destroy(); });
    this.time.delayedCall(this._probeCooldown, () => { this._probeCooldown = 0; });
  }

  update(time, delta) {
    if (this._dialogOpen) { this._player.setVelocity(0); return; }
    if (!this._entranceDone) return;

    const cursors = this._cursors;
    const wasd    = this._wasd;
    const player  = this._player;
    const speed   = 200;
    let vx = 0, vy = 0;
    const tc = window.TouchControls;

    if (cursors.left.isDown  || wasd.A.isDown || (tc && tc.dx < -0.3)) { vx = -speed; player.facing = 'left'; }
    if (cursors.right.isDown || wasd.D.isDown || (tc && tc.dx >  0.3)) { vx =  speed; player.facing = 'right'; }
    if (cursors.up.isDown    || wasd.W.isDown || (tc && tc.dy < -0.3)) { vy = -speed; player.facing = 'up'; }
    if (cursors.down.isDown  || wasd.S.isDown || (tc && tc.dy >  0.3)) { vy =  speed; player.facing = 'down'; }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    player.setVelocity(vx, vy);
    player.setFlipX(player.facing === 'right');
    const moving = vx !== 0 || vy !== 0;
    const fk = `player_${player.facing}${moving ? '_walk' : ''}`;
    if (this.textures.exists(fk)) player.setTexture(fk);

    if (Phaser.Input.Keyboard.JustDown(this._spaceKey) || (tc && tc.fireJustDown)) this._fireProbe();
    this._probeCooldown = Math.max(0, this._probeCooldown - delta);

    // Final boss minions — aggressive full directional chase
    this._enemies.getChildren().forEach(enemy => {
      if (enemy._stunned) { enemy.setVelocity(0); return; }
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      if (dist < 400) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        const sp = enemy._speed || 110;
        enemy.setVelocityX(Math.cos(angle) * sp);
        enemy.setVelocityY(Math.sin(angle) * sp);
      } else {
        enemy.setVelocityX(enemy._dir * (enemy._speed || 110));
        enemy.setVelocityY(0);
        if (enemy.x >= enemy._patrolX2) enemy._dir = -1;
        if (enemy.x <= enemy._patrolX1) enemy._dir = 1;
      }
    });

    if (this._bossInteractable && !this._bossCleared) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, 160, 320);
      this._bossPrompt.setVisible(dist < 220);
      if (dist < 220 && (Phaser.Input.Keyboard.JustDown(this._eKey) || (tc && tc.interactJustDown))) {
        this._startFinalBattle();
      }
    }
  }
}
