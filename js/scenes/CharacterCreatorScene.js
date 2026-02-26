// CharacterCreatorScene.js — Character customisation before the game starts

class CharacterCreatorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterCreatorScene' });
    this._previewGfx = null;
    this._selections = { gender: 'male', head: 0, cloth: 0, skin: 0 };
    this._nameInput = null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Reset game state for a fresh run
    window.GameState.reset();

    // ── Background ────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a, 1);
    bg.fillRect(0, 0, W, H);
    // Decorative border
    bg.lineStyle(3, 0x00e5ff, 0.5);
    bg.strokeRect(20, 20, W - 40, H - 40);
    bg.lineStyle(1, 0x00e5ff, 0.2);
    bg.strokeRect(28, 28, W - 56, H - 56);

    // ── Title ─────────────────────────────────────────────────────────────
    this.add.text(W / 2, 52, 'CHARACTER CREATOR', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '18px',
      color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 16, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, 84, 'Forge your Radiology Resident', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#667788'
    }).setOrigin(0.5);

    // ── Divider ───────────────────────────────────────────────────────────
    const div = this.add.graphics();
    div.lineStyle(1, 0x00e5ff, 0.3);
    div.lineBetween(60, 102, W - 60, 102);

    // ── Preview pane (left) ───────────────────────────────────────────────
    this._previewBg = this.add.graphics();
    this._previewBg.fillStyle(0x162d4a, 1);
    this._previewBg.fillRoundedRect(60, 118, 200, 360, 10);
    this._previewBg.lineStyle(2, 0x00e5ff, 0.4);
    this._previewBg.strokeRoundedRect(60, 118, 200, 360, 10);

    this.add.text(160, 136, 'PREVIEW', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px',
      color: '#4fc3f7'
    }).setOrigin(0.5);

    // Preview sprite container
    this._previewSprite = null;
    this._renderPreview();

    // Equipment labels
    this.add.text(90, 390, '🔬 Portable US', {
      fontSize: '9px', color: '#4fc3f7'
    });
    this.add.text(90, 410, '📋 X-ray viewer', {
      fontSize: '9px', color: '#4fc3f7'
    });
    this.add.text(90, 430, '🩺 Stethoscope', {
      fontSize: '9px', color: '#4fc3f7'
    });

    // ── Options pane (right) ──────────────────────────────────────────────
    const rx = 300; // right pane x start

    // ─ Gender ─────────────────────────────────────────────────────────────
    this._addSectionLabel(rx, 118, 'GENDER');
    this._genderBtns = [];
    ['Male', 'Female'].forEach((label, i) => {
      const btn = this._makeButton(rx + i * 150, 148, label, () => {
        this._selections.gender = label.toLowerCase();
        this._highlightGroup(this._genderBtns, i);
        this._renderPreview();
      });
      this._genderBtns.push(btn);
    });
    this._highlightGroup(this._genderBtns, 0);

    // ─ Skin tone ──────────────────────────────────────────────────────────
    this._addSectionLabel(rx, 198, 'SKIN TONE');
    this._skinBtns = [];
    const skinColors = [0xffd5b4, 0xc68642, 0x8d5524, 0x5c3317];
    const skinLabels = ['Light', 'Medium', 'Brown', 'Deep'];
    skinColors.forEach((col, i) => {
      const btn = this._makeColorButton(rx + i * 150, 228, col, skinLabels[i], () => {
        this._selections.skin = i;
        this._highlightGroup(this._skinBtns, i);
        this._renderPreview();
      });
      this._skinBtns.push(btn);
    });
    this._highlightGroup(this._skinBtns, 0);

    // ─ Head style ─────────────────────────────────────────────────────────
    this._addSectionLabel(rx, 288, 'HEAD STYLE');
    this._headLabels_m = ['Short Dark', 'Light Hair', 'Bald+Beard', 'Curly'];
    this._headLabels_f = ['Short Bob', 'Ponytail', 'Curly', 'Hijab'];
    this._headBtns = [];
    for (let i = 0; i < 4; i++) {
      const lbl = this._selections.gender === 'female'
        ? this._headLabels_f[i] : this._headLabels_m[i];
      const btn = this._makeSmallButton(rx + (i % 2) * 200, 318 + Math.floor(i / 2) * 44, lbl, () => {
        this._selections.head = i;
        this._highlightGroup(this._headBtns, i);
        this._renderPreview();
      });
      this._headBtns.push(btn);
    }
    this._highlightGroup(this._headBtns, 0);

    // ─ Coat style ─────────────────────────────────────────────────────────
    this._addSectionLabel(rx, 418, 'COAT STYLE');
    this._clothBtns = [];
    const clothLabels = ['Classic (Navy)', 'Modern (Khaki)', 'Scrubs Style'];
    clothLabels.forEach((label, i) => {
      const btn = this._makeSmallButton(rx + (i % 2) * 200, 448 + Math.floor(i / 2) * 44, label, () => {
        this._selections.cloth = i;
        this._highlightGroup(this._clothBtns, i);
        this._renderPreview();
      });
      this._clothBtns.push(btn);
    });
    this._highlightGroup(this._clothBtns, 0);

    // ─ Name input ─────────────────────────────────────────────────────────
    this._addSectionLabel(rx, 490, 'YOUR NAME');
    this._nameEl = this.add.dom(rx + 160, 526, 'input', `
      background: #162d4a;
      border: 2px solid #2255cc;
      border-radius: 6px;
      color: #ffffff;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      padding: 8px 12px;
      width: 300px;
      outline: none;
    `);
    this._nameEl.node.placeholder = 'Enter your name...';
    this._nameEl.node.maxLength = 20;
    this._nameEl.node.addEventListener('focus', () => {
      this._nameEl.node.style.borderColor = '#00e5ff';
    });
    this._nameEl.node.addEventListener('blur', () => {
      this._nameEl.node.style.borderColor = '#2255cc';
    });

    // ── Begin Button ──────────────────────────────────────────────────────
    this._beginBtn = this._makeBeginButton(W / 2, H - 52);

    // ── Keyboard shortcut hint ────────────────────────────────────────────
    this.add.text(W / 2, H - 28, 'WASD / Arrow keys to move  •  SPACE to fire US probe  •  E to interact', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '6px',
      color: '#445566'
    }).setOrigin(0.5);
  }

  _addSectionLabel(x, y, label) {
    this.add.text(x, y, label, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#ffd700',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffd700', blur: 8, fill: true }
    });
    const g = this.add.graphics();
    g.lineStyle(1, 0xffd700, 0.3);
    g.lineBetween(x, y + 14, x + 620 - 300, y + 14);
  }

  _makeButton(x, y, label, onClick) {
    const g = this.add.graphics();
    g.fillStyle(0x162d4a, 1);
    g.fillRoundedRect(x, y, 130, 36, 6);
    g.lineStyle(2, 0x2255cc, 1);
    g.strokeRoundedRect(x, y, 130, 36, 6);
    const txt = this.add.text(x + 65, y + 18, label, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: '#aabbcc'
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, 130, 36).setOrigin(0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { g.clear(); g.fillStyle(0x1e3a5f, 1); g.fillRoundedRect(x, y, 130, 36, 6); g.lineStyle(2, 0x00e5ff, 1); g.strokeRoundedRect(x, y, 130, 36, 6); txt.setColor('#ffffff'); });
    zone.on('pointerout', () => {
      if (!zone._selected) {
        g.clear(); g.fillStyle(0x162d4a, 1); g.fillRoundedRect(x, y, 130, 36, 6); g.lineStyle(2, 0x2255cc, 1); g.strokeRoundedRect(x, y, 130, 36, 6); txt.setColor('#aabbcc');
      }
    });
    zone.on('pointerdown', onClick);
    return { g, txt, zone, x, y, w: 130, h: 36 };
  }

  _makeColorButton(x, y, color, label, onClick) {
    const g = this.add.graphics();
    g.fillStyle(0x162d4a, 1);
    g.fillRoundedRect(x, y, 130, 44, 6);
    g.lineStyle(2, 0x2255cc, 1);
    g.strokeRoundedRect(x, y, 130, 44, 6);
    // Color swatch
    g.fillStyle(color, 1);
    g.fillCircle(x + 22, y + 22, 12);
    const txt = this.add.text(x + 38, y + 22, label, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#aabbcc'
    }).setOrigin(0, 0.5);
    const zone = this.add.zone(x, y, 130, 44).setOrigin(0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    return { g, txt, zone, x, y, w: 130, h: 44, color };
  }

  _makeSmallButton(x, y, label, onClick) {
    const g = this.add.graphics();
    g.fillStyle(0x162d4a, 1);
    g.fillRoundedRect(x, y, 185, 34, 5);
    g.lineStyle(2, 0x2255cc, 1);
    g.strokeRoundedRect(x, y, 185, 34, 5);
    const txt = this.add.text(x + 92, y + 17, label, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#aabbcc'
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, 185, 34).setOrigin(0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { txt.setColor('#ffffff'); });
    zone.on('pointerout', () => { if (!zone._selected) txt.setColor('#aabbcc'); });
    zone.on('pointerdown', onClick);
    return { g, txt, zone, x, y, w: 185, h: 34 };
  }

  _highlightGroup(group, selectedIdx) {
    group.forEach((item, i) => {
      const selected = i === selectedIdx;
      item.zone._selected = selected;
      item.g.clear();
      item.g.fillStyle(selected ? 0x0d3a6a : 0x162d4a, 1);
      item.g.fillRoundedRect(item.x, item.y, item.w, item.h, item.h > 40 ? 6 : 5);
      item.g.lineStyle(2, selected ? 0x00e5ff : 0x2255cc, 1);
      item.g.strokeRoundedRect(item.x, item.y, item.w, item.h, item.h > 40 ? 6 : 5);
      // Re-draw color swatch if present
      if (item.color !== undefined) {
        item.g.fillStyle(item.color, 1);
        item.g.fillCircle(item.x + 22, item.y + 22, 12);
      }
      item.txt.setColor(selected ? '#00e5ff' : '#aabbcc');
    });
  }

  _makeBeginButton(cx, cy) {
    const w = 280, h = 52;
    const g = this.add.graphics();
    g.fillStyle(0x004400, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    g.lineStyle(3, 0x27ae60, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    const txt = this.add.text(cx, cy, '▶  BEGIN YOUR ODYSSEY', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#2ecc71',
      shadow: { offsetX: 0, offsetY: 0, color: '#2ecc71', blur: 14, fill: true }
    }).setOrigin(0.5);

    const zone = this.add.zone(cx - w / 2, cy - h / 2, w, h).setOrigin(0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      g.clear();
      g.fillStyle(0x006600, 1);
      g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
      g.lineStyle(3, 0x2ecc71, 1);
      g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    });
    zone.on('pointerout', () => {
      g.clear();
      g.fillStyle(0x004400, 1);
      g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
      g.lineStyle(3, 0x27ae60, 1);
      g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    });
    zone.on('pointerdown', () => this._startGame());

    this.input.keyboard.on('keydown-ENTER', () => this._startGame());
    return { g, txt, zone };
  }

  _renderPreview() {
    // Clear previous preview sprites
    if (this._previewSprite) {
      this._previewSprite.destroy();
      this._previewSprite = null;
    }
    if (this._previewKeys) {
      this._previewKeys.forEach(k => {
        if (this.textures.exists(k)) this.textures.remove(k);
      });
    }

    const tempKey = `preview_player_${Date.now()}`;
    const g = this.add.graphics();

    const skin  = [0xffd5b4, 0xc68642, 0x8d5524, 0x5c3317][this._selections.skin];
    const pants = [0x1e3050, 0x8b7355, 0x2e5f84][this._selections.cloth];

    const maleHairs = [
      { col: 0x111111, style: 'short' },
      { col: 0x3b2006, style: 'short' },
      { col: skin,     style: 'bald'  },
      { col: 0x111111, style: 'curly' }
    ];
    const femaleHairs = [
      { col: 0x111111, style: 'bob'      },
      { col: 0x3b2006, style: 'ponytail' },
      { col: 0x111111, style: 'curly'    },
      { col: 0x2c5f8a, style: 'hijab'    }
    ];
    const hair = this._selections.gender === 'female'
      ? femaleHairs[this._selections.head]
      : maleHairs[this._selections.head];

    _drawPlayer(g, skin, hair, pants, 'down');
    g.generateTexture(tempKey, 64, 112);
    g.destroy();

    this._previewSprite = this.add.image(160, 280, tempKey).setScale(1.6);
    this._previewKeys = [tempKey];

    // Update head button labels on gender change
    if (this._headBtns) {
      const labels = this._selections.gender === 'female'
        ? this._headLabels_f : this._headLabels_m;
      this._headBtns.forEach((btn, i) => {
        btn.txt.setText(labels[i]);
      });
    }
  }

  _startGame() {
    const name = this._nameEl ? this._nameEl.node.value.trim() : '';
    window.GameState.playerName = name || 'Resident';
    window.GameState.gender     = this._selections.gender;
    window.GameState.headStyle  = this._selections.head;
    window.GameState.clothStyle = this._selections.cloth;
    window.GameState.skinTone   = this._selections.skin;

    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CorridorScene');
    });
  }
}
