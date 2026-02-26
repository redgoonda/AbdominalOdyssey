// CorridorScene.js — Main reading room: Dr. Mohamed, Kasprzak, Kayat
// World: 4096 × 640. Player enters from right door, walks LEFT.

const WORLD_W   = 4096;
const WORLD_H   = 640;
const WALL_H    = 80;   // top/bottom wall thickness
const FLOOR_Y   = WALL_H;
const FLOOR_BOT = WORLD_H - WALL_H;

const ATTENDINGS_DEF = [
  {
    id: 'mohamed',
    x: 3200,
    y: FLOOR_Y + 10,       // against top wall
    wall: 'top',
    label: 'Education God',
    subLabel: '⭐ The Reading Room Oracle'
  },
  {
    id: 'kasprzak',
    x: 1800,
    y: FLOOR_Y + 10,       // against top wall
    wall: 'top',
    label: 'Business God',
    subLabel: '💰 Lord of the Spreadsheet'
  },
  {
    id: 'kayat',
    x: 1800,
    y: FLOOR_BOT - 80,     // against bottom wall
    wall: 'bottom',
    label: 'Prostate God',
    subLabel: '🔬 Master of the Gland'
  }
];

class CorridorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CorridorScene' });
  }

  create() {
    const gs = window.GameState;

    // ── Generate sprites ─────────────────────────────────────────────────
    createAllSprites(this, {
      gender:    gs.gender,
      headStyle: gs.headStyle,
      clothStyle: gs.clothStyle,
      skinTone:  gs.skinTone
    });

    // ── Physics world & camera ────────────────────────────────────────────
    this.physics.world.setBounds(0, FLOOR_Y, WORLD_W, FLOOR_BOT - FLOOR_Y);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── Draw room ─────────────────────────────────────────────────────────
    this._drawRoom();

    // ── Attendings ────────────────────────────────────────────────────────
    this._attendings = [];
    ATTENDINGS_DEF.forEach(def => this._addAttending(def));

    // ── Exit portal (locked until all 3 cleared) ──────────────────────────
    this._exitPortal = this.add.image(120, WORLD_H / 2, 'exit_portal').setAlpha(0.3);
    this._exitPortalActive = false;

    this._exitLabel = this.add.text(120, WORLD_H / 2 + 68, 'CLEAR ALL\nDOCTORS FIRST', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px',
      color: '#9b59b6',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.6);

    // ── Obstacles (med students + techs) ──────────────────────────────────
    this._enemies    = this.physics.add.group();
    this._projectiles = this.physics.add.group();
    this._spawnEnemies();

    // ── Player ───────────────────────────────────────────────────────────
    this._player = this.physics.add.sprite(3850, WORLD_H / 2, 'player_down');
    this._player.setCollideWorldBounds(true);
    this._player.setDepth(10);
    this._player.facing = 'left';
    this._player.body.setSize(40, 50);

    // Physics collider: enemies hurt player
    this.physics.add.overlap(this._player, this._enemies, (player, enemy) => {
      if (enemy._stunned) return;
      this._takeDamage();
      enemy._stunned = true;
      enemy.setAlpha(0.4);
      this.time.delayedCall(2000, () => {
        if (enemy && enemy.active) {
          enemy._stunned = false;
          enemy.setAlpha(1);
        }
      });
    });

    // Physics overlap: probe hits enemies
    this.physics.add.overlap(this._projectiles, this._enemies, (probe, enemy) => {
      if (enemy._stunned) return;
      probe.destroy();
      enemy._stunned = true;
      enemy._hp = (enemy._hp || 3) - 1;
      this.tweens.add({ targets: enemy, alpha: 0.2, yoyo: true, duration: 200 });
      window.GameState.addScore(10);
      this._updateHUD();
      if (enemy._hp <= 0) {
        this.tweens.add({
          targets: enemy,
          alpha: 0,
          scaleX: 2, scaleY: 2,
          duration: 400,
          onComplete: () => enemy.destroy()
        });
      } else {
        this.time.delayedCall(1500, () => {
          if (enemy && enemy.active) {
            enemy._stunned = false;
            enemy.setAlpha(1);
          }
        });
      }
    });

    // ── Camera follow ─────────────────────────────────────────────────────
    this.cameras.main.startFollow(this._player, true, 0.1, 0.1);

    // ── Input ─────────────────────────────────────────────────────────────
    this._cursors   = this.input.keyboard.createCursorKeys();
    this._wasd      = this.input.keyboard.addKeys('W,A,S,D');
    this._spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._eKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._probeCooldown = 0;

    // ── HUD (fixed to camera) ─────────────────────────────────────────────
    this._buildHUD();

    // ── Intro text ────────────────────────────────────────────────────────
    const introMsg = this.add.text(WORLD_W / 2, WORLD_H / 2 - 120,
      `Welcome, Dr. ${gs.playerName}!\nFace the Gods of Abdominal Imaging.\nArrow/WASD to move  ·  SPACE to fire probe  ·  E to interact`,
      {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '9px',
        color: '#00e5ff',
        align: 'center',
        backgroundColor: '#0d1b2acc',
        padding: { x: 16, y: 12 }
      }
    ).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: introMsg,
      alpha: 0,
      delay: 4000,
      duration: 1000,
      onComplete: () => introMsg.destroy()
    });

    // ── Spawn more enemies periodically ───────────────────────────────────
    this._enemyTimer = this.time.addEvent({
      delay: 12000,
      loop: true,
      callback: () => {
        if (this._enemies.getLength() < 10) this._spawnEnemies(2);
      }
    });

    this.cameras.main.fadeIn(600, 0, 0, 0);
    this._dialogOpen = false;
  }

  // ── Room drawing ─────────────────────────────────────────────────────────
  _drawRoom() {
    const g = this.add.graphics();

    // Floor (dark reading room)
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(0, FLOOR_Y, WORLD_W, FLOOR_BOT - FLOOR_Y);

    // Subtle floor grid
    g.lineStyle(1, 0x22304a, 0.3);
    for (let x = 0; x < WORLD_W; x += 96) {
      g.lineBetween(x, FLOOR_Y, x, FLOOR_BOT);
    }
    for (let y = FLOOR_Y; y < FLOOR_BOT; y += 96) {
      g.lineBetween(0, y, WORLD_W, y);
    }

    // Top wall
    g.fillStyle(0x0f3460, 1);
    g.fillRect(0, 0, WORLD_W, FLOOR_Y);
    g.lineStyle(2, 0x1a5276, 1);
    g.lineBetween(0, FLOOR_Y, WORLD_W, FLOOR_Y);

    // Bottom wall
    g.fillStyle(0x0f3460, 1);
    g.fillRect(0, FLOOR_BOT, WORLD_W, WALL_H);
    g.lineStyle(2, 0x1a5276, 1);
    g.lineBetween(0, FLOOR_BOT, WORLD_W, FLOOR_BOT);

    // Ceiling lights (periodic)
    for (let lx = 200; lx < WORLD_W; lx += 320) {
      // Light fixture
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(lx - 30, 2, 60, 16);
      // Light glow
      g.fillStyle(0xfff9c4, 0.15);
      g.fillEllipse(lx, FLOOR_Y + 60, 120, 100);
      // Light beam on floor
      g.fillStyle(0xffffff, 0.02);
      g.fillTriangle(lx - 60, FLOOR_Y, lx + 60, FLOOR_Y, lx, FLOOR_Y + 200);
    }

    // Door frame on right side
    g.fillStyle(0x2c3e50, 1);
    g.fillRect(WORLD_W - 100, FLOOR_Y - 10, 100, 200);
    g.fillStyle(0x3d5166, 1);
    g.fillRect(WORLD_W - 96, FLOOR_Y - 6, 92, 192);
    // Door handle
    g.fillStyle(0xf0c040, 1);
    g.fillRect(WORLD_W - 52, FLOOR_Y + 90, 14, 8);

    // Radiology sign above door
    const signTxt = this.add.text(WORLD_W - 60, FLOOR_Y - 26, '⚕ READING ROOM', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px',
      color: '#00e5ff',
      backgroundColor: '#0f3460',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5, 1);

    // Workstations for each attending
    ATTENDINGS_DEF.forEach(def => {
      drawWorkstation(g, def.x - 90, def.y, def.wall);
    });

    // ── Kayat's Star Wars merch & football ───────────────────────────────────
    {
      // Kayat bottom-wall desk: drawWorkstation(g, 1710, 480, 'bottom')
      // baseY = 480 + 60 = 540, desk top edge at y=540
      const kDeskY = FLOOR_BOT - 80 + 60; // = 540

      // Football (brown oval with white laces — sitting on desk)
      g.fillStyle(0x8b4513, 1);
      g.fillEllipse(1862, kDeskY + 14, 42, 26);
      g.fillStyle(0xffffff, 1);
      g.fillRect(1860, kDeskY + 3,  4, 22); // vertical stitch
      g.fillRect(1852, kDeskY + 7,  18, 2); // lace 1
      g.fillRect(1852, kDeskY + 12, 18, 2); // lace 2
      g.fillRect(1852, kDeskY + 17, 18, 2); // lace 3
      g.fillStyle(0x5a2a06, 1);             // dark seam
      g.fillRect(1851, kDeskY + 14,  4, 1);
      g.fillRect(1871, kDeskY + 14,  4, 1);

      // Lightsaber (standing upright beside desk — blue blade)
      const lbX = 1732, lbTop = kDeskY - 58;
      // Glow halo
      g.fillStyle(0x0044cc, 0.3);
      g.fillRect(lbX - 5, lbTop, 15, 62);
      // Blade
      g.fillStyle(0x3399ff, 1);
      g.fillRect(lbX, lbTop, 6, 58);
      g.fillStyle(0xaaddff, 1);
      g.fillRect(lbX + 1, lbTop, 3, 58);  // highlight stripe
      // Emitter cap
      g.fillStyle(0x666666, 1);
      g.fillRect(lbX - 1, lbTop + 56, 8, 4);
      // Handle / hilt
      g.fillStyle(0x888888, 1);
      g.fillRect(lbX - 2, kDeskY, 10, 22);
      g.fillStyle(0x444444, 1);
      g.fillRect(lbX - 1, kDeskY + 5,  8, 3);  // grip band 1
      g.fillRect(lbX - 1, kDeskY + 13, 8, 3);  // grip band 2
      // Activation button
      g.fillStyle(0xff2222, 1);
      g.fillCircle(lbX + 3, kDeskY + 3, 3);

      // Darth Vader helmet figurine (sitting on desk)
      const dvX = 1757, dvTop = kDeskY + 2;
      // Main dome
      g.fillStyle(0x111111, 1);
      g.fillEllipse(dvX, dvTop + 14, 26, 28);
      // Visor bar
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(dvX - 13, dvTop + 8, 26, 14);
      g.fillStyle(0x333333, 0.85);
      g.fillRect(dvX - 11, dvTop + 10, 22, 10);
      // Lower face / grille
      g.fillStyle(0x222222, 1);
      g.fillRect(dvX - 9, dvTop + 22, 18, 11);
      for (let di = 0; di < 5; di++) {
        g.fillStyle(0x444444, 1);
        g.fillRect(dvX - 8 + di * 4, dvTop + 24, 2, 8);
      }
      // Dome shine
      g.fillStyle(0x555555, 0.4);
      g.fillEllipse(dvX - 5, dvTop + 6, 9, 10);
    }

    // ── Additional wall decorations ───────────────────────────────────────────
    for (let wx = 400; wx < WORLD_W - 200; wx += 600) {
      // Wall-mounted displays (looks like PACS viewer thumbnails)
      g.fillStyle(0x0d1b2a, 1);
      g.fillRect(wx, 8, 80, 60);
      g.fillStyle(0x003355, 1);
      g.fillRect(wx + 4, 12, 72, 50);
      g.fillStyle(0x4fc3f7, 0.3);
      for (let i = 0; i < 50; i += 6) {
        g.fillRect(wx + 4, 12 + i, Phaser.Math.Between(20, 72), 3);
      }
    }

    // Exit sign on left
    g.fillStyle(0xcc2222, 1);
    g.fillRect(40, 30, 80, 30);
    g.fillStyle(0xffffff, 1);
    this.add.text(80, 44, 'EXIT', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  _addAttending(def) {
    const yOffset = def.wall === 'top' ? 120 : -20;
    const sprKey  = `attending_${def.id}`;
    const sprite  = this.add.image(def.x, def.y + yOffset, sprKey).setDepth(5);

    // Name label
    const nameLabel = this.add.text(def.x, def.y + yOffset - 60, def.label, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#00e5ff',
      backgroundColor: '#0d1b2a99',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(6);

    const subLabel = this.add.text(def.x, def.y + yOffset - 40, def.subLabel, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '6px',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(6);

    // Interaction prompt (hidden initially)
    const prompt = this.add.text(def.x, def.y + yOffset + 70, '[ E ] to consult',
      { fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#ffd700', backgroundColor: '#000000aa', padding: { x: 6, y: 3 } }
    ).setOrigin(0.5).setDepth(7).setVisible(false);

    // Cleared glow (hidden initially)
    const glowGfx = this.add.graphics().setDepth(4);
    glowGfx.fillStyle(0x27ae60, 0.15);
    glowGfx.fillCircle(def.x, def.y + yOffset, 70);
    glowGfx.setVisible(false);

    // Cleared stamp
    const clearedStamp = this.add.text(def.x, def.y + yOffset, '✓ CLEARED', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#2ecc71',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8).setVisible(false).setAngle(-15);

    this._attendings.push({
      ...def,
      sprite, nameLabel, subLabel, prompt, glowGfx, clearedStamp,
      screenY: def.y + yOffset,
      interactRadius: 180
    });

    // If already cleared from a previous attempt
    if (window.GameState.isCleared(def.id)) {
      this._showCleared(this._attendings[this._attendings.length - 1]);
    }
  }

  _showCleared(att) {
    att.glowGfx.setVisible(true);
    att.clearedStamp.setVisible(true);
    att.prompt.setVisible(false);
    att.sprite.setTint(0x2ecc71);
  }

  // ── Enemy spawning ────────────────────────────────────────────────────────
  _spawnEnemies(count = 6) {
    const types = ['med_student', 'tech'];
    for (let i = 0; i < count; i++) {
      const tx = Phaser.Math.Between(300, WORLD_W - 300);
      const ty = Phaser.Math.Between(FLOOR_Y + 60, FLOOR_BOT - 60);
      const type = Phaser.Utils.Array.GetRandom(types);
      const enemy = this._enemies.create(tx, ty, type);
      enemy._type     = type;
      enemy._stunned  = false;
      enemy._hp       = 3;
      enemy._dir      = Phaser.Math.Between(0, 1) ? 1 : -1;
      enemy._patrolX1 = Math.max(100, tx - Phaser.Math.Between(150, 350));
      enemy._patrolX2 = Math.min(WORLD_W - 100, tx + Phaser.Math.Between(150, 350));
      enemy._patrolY  = ty;
      enemy.setDepth(8);
    }
  }

  // ── Probe firing ───────────────────────────────────────────────────────────
  _fireProbe() {
    if (this._probeCooldown > 0 || this._dialogOpen) return;
    this._probeCooldown = 500; // ms

    const px = this._player.x;
    const py = this._player.y;
    const facing = this._player.facing;

    const probe = this._projectiles.create(px, py, 'probe');
    probe.setDepth(9);
    probe.body.allowGravity = false;

    const speed = 600;
    switch (facing) {
      case 'left':  probe.setVelocityX(-speed); break;
      case 'right': probe.setVelocityX(speed);  probe.setFlipX(true); break;
      case 'up':    probe.setVelocityY(-speed);  probe.setAngle(-90); break;
      case 'down':  probe.setVelocityY(speed);   probe.setAngle(90);  break;
      default:      probe.setVelocityX(-speed);
    }

    // Auto-destroy after leaving screen
    this.time.delayedCall(1500, () => { if (probe && probe.active) probe.destroy(); });

    // Cooldown
    this.time.delayedCall(this._probeCooldown, () => { this._probeCooldown = 0; });
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  _buildHUD() {
    const cam = this.cameras.main;

    this._hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // Health hearts
    this._hearts = [];
    for (let i = 0; i < window.GameState.maxHealth; i++) {
      const h = this.add.image(28 + i * 36, 22, 'heart_full').setScale(0.85);
      this._hearts.push(h);
      this._hudContainer.add(h);
    }

    // Player name
    this._nameHUD = this.add.text(28, 50,
      `Dr. ${window.GameState.playerName}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#4fc3f7'
    }).setScrollFactor(0).setDepth(100);

    // Score
    this._scoreHUD = this.add.text(900, 22,
      `SCORE: ${window.GameState.score}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#ffd700'
    }).setScrollFactor(0).setDepth(100).setOrigin(1, 0.5);

    // Progress: attendings cleared
    this._progressHUD = this.add.text(900, 46,
      this._progressText(), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px',
      color: '#aabbcc'
    }).setScrollFactor(0).setDepth(100).setOrigin(1, 0.5);

    // Controls reminder (fades after 10s)
    this._controlHint = this.add.text(480, 620,
      'ARROW/WASD: Move   SPACE: Fire Probe   E: Interact', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '6px',
      color: '#445566'
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 1);

    this.time.delayedCall(10000, () => {
      this.tweens.add({ targets: this._controlHint, alpha: 0, duration: 1000 });
    });
  }

  _progressText() {
    const gs = window.GameState;
    return `Cleared: ${gs.clearedAttending.size}/3 Doctors`;
  }

  _updateHUD() {
    const gs = window.GameState;
    // Hearts
    this._hearts.forEach((h, i) => {
      h.setTexture(i < gs.health ? 'heart_full' : 'heart_empty');
    });
    this._scoreHUD.setText(`SCORE: ${gs.score}`);
    this._progressHUD.setText(this._progressText());
  }

  _takeDamage() {
    if (this._dialogOpen) return;
    const dead = window.GameState.takeDamage();
    this._updateHUD();
    // Flash red
    this.cameras.main.flash(300, 180, 0, 0);
    if (dead) this._gameOver();
  }

  _gameOver() {
    this._dialogOpen = true;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOverScene', { won: false });
    });
  }

  // ── Interaction check ────────────────────────────────────────────────────
  _checkAttendingProximity() {
    const px = this._player.x;
    const py = this._player.y;

    this._attendings.forEach(att => {
      if (window.GameState.isCleared(att.id)) return;
      const dist = Phaser.Math.Distance.Between(px, py, att.x, att.screenY);
      const near = dist < att.interactRadius;
      att.prompt.setVisible(near);

      if (near && (Phaser.Input.Keyboard.JustDown(this._eKey) || (tc && tc.interactJustDown)) && !this._dialogOpen) {
        this._startInteraction(att);
      }
    });
  }

  _startInteraction(att) {
    this._dialogOpen = true;
    this._player.setVelocity(0);

    DialogSystem.show(att.id, 'normal', ({ cleared, dead }) => {
      this._dialogOpen = false;
      if (dead) { this._gameOver(); return; }
      if (cleared) {
        window.GameState.clearAttending(att.id);
        this._showCleared(att);
        this._updateHUD();
        this._checkAllCleared();
      }
    });
  }

  _checkAllCleared() {
    if (!window.GameState.allCorridorCleared()) return;
    // Activate exit portal
    this._exitPortalActive = true;
    this._exitPortal.setAlpha(1);
    this._exitLabel.setText('ENTER\nMINI BOSS\nROOM').setColor('#ff4444');
    this.tweens.add({
      targets: this._exitPortal,
      angle: 360,
      duration: 3000,
      repeat: -1
    });
    // Pulse exit portal
    this.tweens.add({
      targets: this._exitPortal,
      scaleX: 1.2, scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    // Announcement
    const msg = this.add.text(WORLD_W / 2, WORLD_H / 2,
      '⚡ ALL DOCTORS CONSULTED!\nProceed to the Mini Boss Room!', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ff4444',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: msg, alpha: 0, delay: 3500, duration: 1000, onComplete: () => msg.destroy() });
  }

  _checkTransition() {
    if (!this._exitPortalActive) return;
    const dist = Phaser.Math.Distance.Between(this._player.x, this._player.y, 120, WORLD_H / 2);
    if (dist < 80) {
      this._dialogOpen = true;
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MiniBossScene');
      });
    }
  }

  // ── Update loop ───────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._dialogOpen) {
      this._player.setVelocity(0);
      return;
    }

    const cursors = this._cursors;
    const wasd    = this._wasd;
    const player  = this._player;
    const speed   = 200;

    let vx = 0, vy = 0;
    const tc = window.TouchControls;

    if (cursors.left.isDown  || wasd.A.isDown || (tc && tc.dx < -0.3)) { vx = -speed; player.facing = 'left';  }
    if (cursors.right.isDown || wasd.D.isDown || (tc && tc.dx >  0.3)) { vx =  speed; player.facing = 'right'; }
    if (cursors.up.isDown    || wasd.W.isDown || (tc && tc.dy < -0.3)) { vy = -speed; player.facing = 'up';    }
    if (cursors.down.isDown  || wasd.S.isDown || (tc && tc.dy >  0.3)) { vy =  speed; player.facing = 'down';  }

    // Diagonal normalisation
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }
    player.setVelocity(vx, vy);

    // Animate sprite based on movement
    const moving = vx !== 0 || vy !== 0;
    const frameKey = moving
      ? `player_${player.facing}_walk`
      : `player_${player.facing}`;
    if (this.textures.exists(frameKey)) player.setTexture(frameKey);

    // Flip sprite for right movement
    player.setFlipX(player.facing === 'right');

    // Fire probe
    if (Phaser.Input.Keyboard.JustDown(this._spaceKey) || (tc && tc.fireJustDown)) {
      this._fireProbe();
    }
    this._probeCooldown = Math.max(0, this._probeCooldown - delta);

    // Enemy AI — chase player when nearby, patrol otherwise
    this._enemies.getChildren().forEach(enemy => {
      if (enemy._stunned) { enemy.setVelocity(0); return; }
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      if (dist < 280) {
        // Chase mode
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        enemy.setVelocityX(Math.cos(angle) * 65);
        enemy.setVelocityY(Math.sin(angle) * 65);
      } else {
        // Patrol mode
        enemy.setVelocityX(enemy._dir * 80);
        enemy.setVelocityY(0);
        if (enemy.x >= enemy._patrolX2) enemy._dir = -1;
        if (enemy.x <= enemy._patrolX1) enemy._dir = 1;
      }
    });

    // Attending proximity & interaction
    this._checkAttendingProximity();

    // Exit transition
    this._checkTransition();
  }
}
