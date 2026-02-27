// MiniBossScene.js — Dr. Nikhil Ramaiya: The Cancer God (Mini Boss)
// Ominous entrance, 3-question Q&A battle, harder enemies

class MiniBossScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MiniBossScene' });
  }

  create() {
    const W = 960;
    const H = 640;
    const gs = window.GameState;

    this._dialogOpen = false;
    this._bossCleared = false;
    this._bossInteractable = false;
    this._entranceDone = false;

    // Ensure sprites exist (re-create if scene was restarted)
    if (!this.textures.exists('player_down')) {
      createAllSprites(this, {
        gender:    gs.gender,
        headStyle: gs.headStyle,
        clothStyle: gs.clothStyle,
        skinTone:  gs.skinTone
      });
    }

    // ── Ominous background ────────────────────────────────────────────────
    this._drawBossRoom();

    // ── Enemies ────────────────────────────────────────────────────────────
    this._enemies    = this.physics.add.group();
    this._projectiles = this.physics.add.group();
    this._healthDrops = this.physics.add.group();
    this._spawnBossEnemies();

    // ── Player (enters from right) ────────────────────────────────────────
    this.physics.world.setBounds(0, 80, W, 480);
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
      this.time.delayedCall(2500, () => {
        if (enemy && enemy.active) { enemy._stunned = false; enemy.setAlpha(1); }
      });
    });

    this.physics.add.overlap(this._projectiles, this._enemies, (probe, enemy) => {
      if (enemy._stunned) return;
      probe.destroy();
      enemy._stunned = true;
      enemy._hp = (enemy._hp || 4) - 1;
      this.tweens.add({ targets: enemy, alpha: 0.2, yoyo: true, duration: 200 });
      window.GameState.addScore(15);
      this._updateHUD();
      if (enemy._hp <= 0) {
        const ex = enemy.x, ey = enemy.y;
        this.tweens.add({ targets: enemy, alpha: 0, scaleX: 2, scaleY: 2, duration: 400,
          onComplete: () => { enemy.destroy(); this._tryDropHealth(ex, ey); } });
      } else {
        this.time.delayedCall(2000, () => { if (enemy && enemy.active) { enemy._stunned = false; enemy.setAlpha(1); } });
      }
    });

    this.physics.add.overlap(this._player, this._healthDrops, (player, drop) => {
      drop.destroy();
      window.GameState.heal(1);
      this._updateHUD();
      this._floatText(drop.x, drop.y, '+1 HP', '#2ecc71');
    });

    // ── Dr. Ramaiya at desk ───────────────────────────────────────────────
    const bossX = 200;
    const bossY = H / 2;
    this._bossSprite = this.add.image(bossX, bossY, 'attending_ramaiya').setDepth(8).setScale(1.3);
    drawWorkstation(this.add.graphics().setDepth(3), bossX - 90, H / 2 - 40, 'top');
    this._drawBossDecorations();

    this._bossLabel = this.add.text(bossX, bossY - 100, 'The Cancer God', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '10px',
      color: '#ff4444',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 20, fill: true }
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this._bossSubLabel = this.add.text(bossX, bossY - 78, '☠  Mini Boss  ·  Lord of RECIST', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#ff8800'
    }).setOrigin(0.5).setDepth(9).setVisible(false);

    this._bossPrompt = this.add.text(bossX, bossY + 90, '[ E ] to CHALLENGE',
      { fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#ff4444', backgroundColor: '#000000cc', padding: { x: 6, y: 3 } }
    ).setOrigin(0.5).setDepth(10).setVisible(false);

    // Boss HP bar (3 questions = 3 segments)
    this._bossHP = 3;
    this._buildBossHPBar();

    // ── HUD ───────────────────────────────────────────────────────────────
    this._buildHUD();

    // ── Input ─────────────────────────────────────────────────────────────
    this._cursors   = this.input.keyboard.createCursorKeys();
    this._wasd      = this.input.keyboard.addKeys('W,A,S,D');
    this._spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._eKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._probeCooldown = 0;

    // ── MINI BOSS ENTRANCE SEQUENCE ───────────────────────────────────────
    this.cameras.main.fadeIn(200, 0, 0, 0);
    // Thunder intro stinger → then mini boss track
    window.MusicSystem.playBossIntro('miniboss');
    this.time.delayedCall(400, () => this._playBossEntrance());
  }

  _drawBossRoom() {
    const W = 960, H = 640;
    const g = this.add.graphics();

    // Very dark, ominous background
    g.fillStyle(0x0a0a12, 1);
    g.fillRect(0, 0, W, H);

    // Floor (dark red tint)
    g.fillStyle(0x1a0808, 1);
    g.fillRect(0, 80, W, 480);

    // Subtle ominous grid
    g.lineStyle(1, 0x330000, 0.4);
    for (let x = 0; x < W; x += 80) g.lineBetween(x, 80, x, 560);
    for (let y = 80; y < 560; y += 80) g.lineBetween(0, y, W, y);

    // Top wall
    g.fillStyle(0x1a0a0a, 1);
    g.fillRect(0, 0, W, 80);
    g.lineStyle(3, 0xcc2222, 0.7);
    g.lineBetween(0, 80, W, 80);

    // Bottom wall
    g.fillStyle(0x1a0a0a, 1);
    g.fillRect(0, 560, W, 80);
    g.lineStyle(3, 0xcc2222, 0.7);
    g.lineBetween(0, 560, W, 560);

    // Red spotlights on boss area
    g.fillStyle(0xff2222, 0.06);
    g.fillCircle(200, 320, 180);
    g.fillStyle(0xff2222, 0.03);
    g.fillCircle(200, 320, 280);

    // DNA / cancer cell decorations on walls
    for (let i = 0; i < 8; i++) {
      const cx = 300 + i * 90;
      g.lineStyle(1, 0x660000, 0.5);
      g.strokeCircle(cx, 30, 14);
      g.strokeCircle(cx + 8, 42, 10);
    }

    // "ONCOLOGY" watermark
    g.fillStyle(0x1a0000, 1);
    this.add.text(W / 2, H / 2, 'ONCOLOGY', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '80px',
      color: '#cc000011',
      alpha: 0.08
    }).setOrigin(0.5).setDepth(0);
  }

  _playBossEntrance() {
    const W = 960, H = 640;

    // Flash ominous text
    const flashBg = this.add.graphics().setDepth(200);
    flashBg.fillStyle(0x000000, 0.95);
    flashBg.fillRect(0, 0, W, H);

    const bossTitle = this.add.text(W / 2, H / 2 - 60, '⚡  MINI BOSS  ⚡', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '36px',
      color: '#ff2222',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 40, fill: true }
    }).setOrigin(0.5).setDepth(201);

    const bossName = this.add.text(W / 2, H / 2 + 20, 'THE CANCER GOD', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '20px',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(201);

    const bossTitle2 = this.add.text(W / 2, H / 2 + 60, '☠  THE CANCER GOD  ☠', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(201);

    // Screen shake
    this.cameras.main.shake(800, 0.015);

    // Flash in
    this.tweens.add({ targets: [flashBg, bossTitle, bossName, bossTitle2], alpha: { from: 0, to: 1 }, duration: 200 });

    // Fade out after 2.5s
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: [flashBg, bossTitle, bossName, bossTitle2],
        alpha: 0,
        duration: 600,
        onComplete: () => {
          flashBg.destroy(); bossTitle.destroy(); bossName.destroy(); bossTitle2.destroy();
          // Reveal boss
          this._bossLabel.setVisible(true);
          this._bossSubLabel.setVisible(true);
          this._entranceDone = true;
          this._bossInteractable = true;
          this._bossHPGroup.setVisible(true);
          // Pulse boss sprite
          this.tweens.add({
            targets: this._bossSprite,
            scaleX: 1.4, scaleY: 1.4,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    });
  }

  _drawBossDecorations() {
    const H   = 640;
    const g   = this.add.graphics().setDepth(6);
    // Boss desk: drawWorkstation(g, 110, 280, 'top') → baseY=280, desk at (110,280,180,50)
    const deskX = 112, deskY = 283; // slightly inside desk top-left

    // ── Cancer textbooks stacked on left of desk ──────────────────────────
    const bookColors = [0x880000, 0xaa1100, 0xcc2200, 0x991133, 0x660022];
    bookColors.forEach((col, i) => {
      // Each book is slightly offset — fanned out
      const bx = deskX + i * 14;
      const by = deskY - i * 3;
      g.fillStyle(col, 1);
      g.fillRect(bx, by, 13, 38);
      // Spine binding
      g.fillStyle(0x000000, 0.4);
      g.fillRect(bx, by, 2, 38);
      // Title lines on cover
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(bx + 3, by + 5,  8, 1);
      g.fillRect(bx + 3, by + 8,  6, 1);
      g.fillRect(bx + 3, by + 11, 7, 1);
      // Skull icon on top book
      if (i === 0) {
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(bx + 6, by + 22, 4);
        g.fillStyle(col, 1);
        g.fillRect(bx + 4, by + 23, 2, 2);
        g.fillRect(bx + 7, by + 23, 2, 2);
      }
    });

    // ── 3 Rolex watches on velvet display stand ───────────────────────────
    const velX = 208, velY = 286;
    // Velvet cushion
    g.fillStyle(0x1a0a1a, 1);
    g.fillRect(velX, velY, 94, 38);
    g.lineStyle(2, 0xffd700, 0.9);
    g.strokeRect(velX, velY, 94, 38);
    g.lineStyle(1, 0xffd700, 0.3);
    g.strokeRect(velX + 2, velY + 2, 90, 34);

    [velX + 14, velX + 47, velX + 80].forEach((wx, wi) => {
      const wy = velY + 19;
      // Watch bracelet/strap
      g.fillStyle(0x777777, 1);
      g.fillRect(wx - 6, wy - 20, 12, 8);   // top strap
      g.fillRect(wx - 6, wy + 12, 12, 8);   // bottom strap
      // Gold case (outer)
      g.fillStyle(0xffd700, 1);
      g.fillCircle(wx, wy, 12);
      // Bezel (slightly darker gold ring)
      g.fillStyle(0xd4a800, 1);
      g.fillCircle(wx, wy, 11);
      // Watch face (dark dial)
      g.fillStyle(0x050510, 1);
      g.fillCircle(wx, wy, 9);
      // Hour markers (tiny gold dots at 12,3,6,9)
      g.fillStyle(0xffd700, 1);
      g.fillRect(wx - 1, wy - 8, 2, 2); // 12
      g.fillRect(wx + 6, wy - 1, 2, 2); // 3
      g.fillRect(wx - 1, wy + 6, 2, 2); // 6
      g.fillRect(wx - 8, wy - 1, 2, 2); // 9
      // Rolex crown at 12
      g.fillStyle(0xffd700, 1);
      g.fillRect(wx - 2, wy - 13, 4, 5);
      g.fillRect(wx - 3, wy - 13, 1, 3);
      g.fillRect(wx + 2, wy - 13, 1, 3);
      // Hands
      g.lineStyle(2, 0xffd700, 1);
      g.lineBetween(wx, wy, wx, wy - 7);        // hour hand (12)
      g.lineStyle(1, 0xffffff, 1);
      g.lineBetween(wx, wy, wx + 5 - wi, wy + 3 + wi); // min hand (varies per watch)
    });
  }

  _floatText(x, y, msg, color = '#ffffff') {
    const t = this.add.text(x, y, msg, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px', color,
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
  }

  _tryDropHealth(x, y) {
    if (Math.random() > 0.30) return;
    const drop = this._healthDrops.create(x, y, 'heart_full');
    drop.setScale(0.7).setDepth(9);
    drop.body.setAllowGravity(false);
    drop.body.setVelocity(0, 0);
    this.tweens.add({ targets: drop, y: y - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.delayedCall(10000, () => { if (drop && drop.active) drop.destroy(); });
  }

  _spawnBossEnemies() {
    const types = ['med_student', 'tech', 'tech'];
    // Player spawns at x=880 (right side) — keep enemies on the left half
    // and at least 300px away horizontally so they don't surround the player immediately
    const PLAYER_X = 880;
    const MIN_DIST = 300;
    for (let i = 0; i < 5; i++) {
      let tx, ty, attempts = 0;
      do {
        tx = Phaser.Math.Between(80, 600);
        ty = Phaser.Math.Between(120, 520);
        attempts++;
      } while (Math.abs(tx - PLAYER_X) < MIN_DIST && attempts < 20);
      const type = Phaser.Utils.Array.GetRandom(types);
      const enemy = this._enemies.create(tx, ty, type);
      enemy._type = type; enemy._stunned = false; enemy._hp = 4;
      enemy._dir = Phaser.Math.Between(0, 1) ? 1 : -1;
      enemy._patrolX1 = Math.max(60, tx - 200);
      enemy._patrolX2 = Math.min(620, tx + 200);
      enemy.setDepth(8);
    }
  }

  _buildBossHPBar() {
    const W = 960;
    this._bossHPGroup = this.add.container(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    const barBg = this.add.graphics();
    barBg.fillStyle(0x0a0000, 1);
    barBg.fillRect(280, 8, 400, 28);
    barBg.lineStyle(2, 0xcc2222, 1);
    barBg.strokeRect(280, 8, 400, 28);
    this._bossHPGroup.add(barBg);

    this._bossHPLabel = this.add.text(W / 2, 22, '☠ CANCER GOD  HP: ███', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#ff4444'
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0.5);
    this._bossHPGroup.add(this._bossHPLabel);
  }

  _updateBossHP() {
    const bars = '█'.repeat(this._bossHP);
    const empty = '░'.repeat(3 - this._bossHP);
    this._bossHPLabel.setText(`☠ CANCER GOD  HP: ${bars}${empty}`);
    if (this._bossHP <= 0) {
      this._bossHPLabel.setColor('#444444');
    }
  }

  _buildHUD() {
    this._hearts = [];
    for (let i = 0; i < window.GameState.maxHealth; i++) {
      const h = this.add.image(28 + i * 36, 620, 'heart_full')
        .setScale(0.85).setScrollFactor(0).setDepth(100);
      this._hearts.push(h);
    }
    this._nameHUD = this.add.text(28, 600, `Dr. ${window.GameState.playerName}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#4fc3f7'
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
    this.cameras.main.shake(200, 0.008);
    if (dead) {
      this._dialogOpen = true;
      window.MusicSystem.stop();
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOverScene', { won: false });
      });
    }
  }

  _startBossInteraction() {
    if (!this._bossInteractable || this._dialogOpen || this._bossCleared) return;
    this._dialogOpen = true;
    this._player.setVelocity(0);

    DialogSystem.show('ramaiya', 'boss', ({ cleared, dead }) => {
      this._dialogOpen = false;
      this._updateHUD();
      if (dead) {
        window.MusicSystem.stop();
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

        // Dismiss remaining enemies
        this._enemies.getChildren().slice().forEach(enemy => {
          this.tweens.add({ targets: enemy, alpha: 0, scaleX: 2, scaleY: 2, duration: 600,
            onComplete: () => { if (enemy.active) enemy.destroy(); } });
        });

        // Boss defeated animation
        window.MusicSystem.stop();
        this.tweens.add({ targets: this._bossSprite, alpha: 0, scaleX: 0, scaleY: 0, duration: 800 });
        this.cameras.main.shake(400, 0.02);
        window.GameState.addScore(500);

        const victoryMsg = this.add.text(480, 320,
          '💥 CANCER GOD DEFEATED!\n+500 POINTS\n\nProceeding to Final Boss...', {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '13px',
          color: '#ffd700',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 5
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(3000, () => {
          this.cameras.main.fadeOut(800, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('FinalBossScene');
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
    const facing = this._player.facing;
    const speed = 650;
    switch (facing) {
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
    const frameKey = `player_${player.facing}${moving ? '_walk' : ''}`;
    if (this.textures.exists(frameKey)) player.setTexture(frameKey);

    if (Phaser.Input.Keyboard.JustDown(this._spaceKey) || (tc && tc.fireJustDown)) this._fireProbe();
    this._probeCooldown = Math.max(0, this._probeCooldown - delta);

    // Mini boss enemies — chase player within range, patrol otherwise
    this._enemies.getChildren().forEach(enemy => {
      if (enemy._stunned) { enemy.setVelocity(0); return; }
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      if (dist < 320) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        enemy.setVelocityX(Math.cos(angle) * 80);
        enemy.setVelocityY(Math.sin(angle) * 80);
      } else {
        enemy.setVelocityX(enemy._dir * 100);
        enemy.setVelocityY(0);
        if (enemy.x >= enemy._patrolX2) enemy._dir = -1;
        if (enemy.x <= enemy._patrolX1) enemy._dir = 1;
      }
    });

    // Check proximity to boss
    if (this._bossInteractable && !this._bossCleared) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, 200, 320);
      this._bossPrompt.setVisible(dist < 200);
      if (dist < 200 && (Phaser.Input.Keyboard.JustDown(this._eKey) || (tc && tc.interactJustDown))) {
        this._startBossInteraction();
      }
    }
  }
}
