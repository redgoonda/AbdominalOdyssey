// sprites.js — Programmatic pixel-art sprite generation for Abdominal Odyssey
// Each sprite is drawn using Phaser's Graphics API at pixel scale P,
// then baked into a reusable texture via generateTexture().

const P = 4; // 1 "design pixel" = 4×4 screen pixels

// ── Colour palette ────────────────────────────────────────────────────────────
const COL = {
  SKIN_LIGHT:  0xffd5b4,
  SKIN_MED:    0xc68642,
  SKIN_DARK:   0x8d5524,
  SKIN_DEEP:   0x5c3317,

  HAIR_BLACK:  0x111111,
  HAIR_BROWN:  0x3b2006,
  HAIR_GRAY:   0x888888,
  HAIR_BALD:   0xd4956c, // same as skin for bald

  EYE:         0x111122,
  MOUTH:       0xcc5533,

  COAT:        0xf0f0f0,
  COAT_SH:     0xcccccc,
  LAPEL:       0xe0e0e0,
  STETHOSCOPE: 0xaaaaaa,

  PANTS_NAVY:  0x1e3050,
  PANTS_KHAKI: 0x8b7355,
  PANTS_SCRUB: 0x2e5f84,

  SHOE:        0x111111,
  SHOE_BROWN:  0x3b2006,

  // Attending-specific
  HIJAB_BLUE:  0x2c5f8a,
  HIJAB_SH:    0x1a3d5c,
  SUIT_DARK:   0x1c2a3a,
  SUIT_LIGHT:  0x2c3e50,
  TIE_RED:     0xcc2222,
  TIE_BLUE:    0x2255cc,

  GOLD:        0xffd700,
  PURPLE:      0x9b59b6,
  RED_GLOW:    0xcc2222,
  CYAN:        0x00e5ff,
  GREEN:       0x27ae60,

  // Environment
  FLOOR_DARK:  0x1a1a2e,
  FLOOR_MED:   0x16213e,
  WALL_TOP:    0x0f3460,
  DESK:        0x1e3a5f,
  DESK_SH:     0x162d4a,
  MONITOR_FR:  0x0d1b2a,
  MONITOR_SCR: 0x00e5ff,
  MONITOR_SCR2:0x4fc3f7,
  CHAIR:       0x2d3561,
  CHAIR_SH:    0x1e2548,
};

// ── Helper: draw a pixel block ────────────────────────────────────────────────
function px(g, col, dx, dy, w = 1, h = 1) {
  g.fillStyle(col, 1);
  g.fillRect(dx * P, dy * P, w * P, h * P);
}

// ── Player sprite (16 × 28 design pixels = 64 × 112 screen pixels) ───────────
// Facing direction: 'down' | 'left' | 'right' | 'up'
// Options: { skinTone, hairStyle, clothStyle, gender }
function createPlayerSprites(scene, opts = {}) {
  const {
    skinTone   = 0,
    hairStyle  = 0,
    clothStyle = 0,
    gender     = 'male'
  } = opts;

  const skinColor = [COL.SKIN_LIGHT, COL.SKIN_MED, COL.SKIN_DARK, COL.SKIN_DEEP][skinTone] || COL.SKIN_LIGHT;
  const pantsColor = [COL.PANTS_NAVY, COL.PANTS_KHAKI, COL.PANTS_SCRUB][clothStyle] || COL.PANTS_NAVY;

  const maleHairs = [
    { col: COL.HAIR_BLACK, style: 'short' },
    { col: COL.HAIR_BROWN, style: 'short' },
    { col: COL.HAIR_BALD,  style: 'bald'  },
    { col: COL.HAIR_BLACK, style: 'curly' },
  ];
  const femaleHairs = [
    { col: COL.HAIR_BLACK, style: 'bob'       },
    { col: COL.HAIR_BROWN, style: 'ponytail'  },
    { col: COL.HAIR_BLACK, style: 'curly'     },
    { col: COL.HIJAB_BLUE, style: 'hijab'     },
  ];

  const hair = gender === 'female'
    ? femaleHairs[hairStyle % 4]
    : maleHairs[hairStyle % 4];

  ['down', 'left', 'right', 'up'].forEach(dir => {
    const key = `player_${dir}`;
    const g = scene.add.graphics();
    _drawPlayer(g, skinColor, hair, pantsColor, dir);
    g.generateTexture(key, 16 * P, 28 * P);
    g.destroy();
  });

  // Walk frames (slightly different leg positions)
  ['down', 'left', 'right', 'up'].forEach(dir => {
    const key = `player_${dir}_walk`;
    const g = scene.add.graphics();
    _drawPlayer(g, skinColor, hair, pantsColor, dir, true);
    g.generateTexture(key, 16 * P, 28 * P);
    g.destroy();
  });
}

function _drawPlayer(g, skin, hair, pants, dir, walkFrame = false) {
  // HEAD (rows 0–7)
  // Hair
  if (hair.style === 'bald') {
    px(g, skin, 3, 0, 10, 6);
  } else if (hair.style === 'hijab') {
    px(g, hair.col, 1, 0, 14, 7);
    px(g, hair.col, 0, 2, 16, 5);
    // Face window in hijab
    px(g, skin, 3, 1, 10, 5);
  } else if (hair.style === 'curly') {
    px(g, hair.col, 2, 0, 12, 3);
    px(g, hair.col, 1, 1, 14, 4);
    px(g, hair.col, 2, 3, 2, 3);   // left sideburn
    px(g, hair.col, 12, 3, 2, 3);  // right sideburn
  } else if (hair.style === 'ponytail') {
    px(g, hair.col, 3, 0, 10, 4);
    px(g, hair.col, 2, 1, 12, 3);
    px(g, hair.col, 12, 2, 3, 6);  // ponytail right side
  } else if (hair.style === 'bob') {
    px(g, hair.col, 2, 0, 12, 5);
    px(g, hair.col, 1, 2, 14, 4);
    px(g, hair.col, 1, 5, 14, 2);  // bob length
  } else {
    // short / default
    px(g, hair.col, 3, 0, 10, 2);
    px(g, hair.col, 2, 1, 12, 4);
    px(g, hair.col, 2, 3, 2, 3);   // left sideburn
    px(g, hair.col, 12, 3, 2, 3);  // right sideburn
  }

  // Face
  if (hair.style !== 'hijab') {
    px(g, skin, 3, 1, 10, 6);
  }
  // Eyes
  if (dir !== 'up') {
    px(g, COL.EYE, 4, 3, 2, 2);
    px(g, COL.EYE, 10, 3, 2, 2);
    // Nose dot
    px(g, COL.MOUTH, 7, 5, 2, 1);
    // Mouth
    px(g, COL.MOUTH, 5, 6, 6, 1);
  }

  // NECK (rows 7–8)
  px(g, skin, 6, 7, 4, 2);

  // WHITE COAT body (rows 8–18)
  px(g, COL.COAT, 1, 9, 14, 10);
  // Lapels
  px(g, COL.COAT_SH, 4, 9, 4, 6);
  px(g, COL.COAT_SH, 8, 9, 4, 6);
  // Coat buttons
  px(g, COL.COAT_SH, 7, 12, 2, 1);
  px(g, COL.COAT_SH, 7, 14, 2, 1);
  px(g, COL.COAT_SH, 7, 16, 2, 1);
  // Stethoscope (around neck, over shoulders)
  px(g, COL.STETHOSCOPE, 3, 9, 1, 4);
  px(g, COL.STETHOSCOPE, 3, 12, 4, 1);
  px(g, COL.STETHOSCOPE, 12, 9, 1, 4);
  px(g, COL.STETHOSCOPE, 9, 12, 4, 1);

  // Arms
  const armY = 9;
  // Left arm holding ultrasound probe
  px(g, COL.COAT, 0, armY, 2, 8);
  px(g, skin, 0, armY + 6, 2, 2);
  // US probe (left hand)
  px(g, 0x333333, 0, armY + 8, 2, 5);
  px(g, 0x0088ff, 0, armY + 11, 2, 2);

  // Right arm holding x-ray
  px(g, COL.COAT, 14, armY, 2, 8);
  px(g, skin, 14, armY + 6, 2, 2);
  // X-ray plate (right hand)
  px(g, 0xbbbbbb, 14, armY + 8, 3, 5);
  px(g, 0x88aacc, 15, armY + 9, 1, 3);

  // PANTS (rows 19–24)
  const legShift = walkFrame ? 1 : 0;
  px(g, pants, 3, 19, 4, 6);                   // left leg
  px(g, pants, 9, 19 + legShift, 4, 6);         // right leg (shifted for walk)
  // Shoes
  px(g, COL.SHOE, 2, 24, 5, 2);
  px(g, COL.SHOE, 9, 24 + legShift, 5, 2);
}

// ── Attending sprites (12 × 16 pixels — sitting at desk) ─────────────────────
function createAttendingSprites(scene) {
  _createMohamedSprite(scene);
  _createKasprzakSprite(scene);
  _createKayatSprite(scene);
  _createRamaiyaSprite(scene);
  _createTirumaniSprite(scene);
}

function _createMohamedSprite(scene) {
  const g = scene.add.graphics();
  const skin = COL.SKIN_MED;
  // Hijab
  px(g, COL.HIJAB_BLUE, 0, 0, 12, 8);
  px(g, COL.HIJAB_SH,   0, 6, 12, 3);
  // Face window
  px(g, skin, 2, 1, 8, 6);
  // Eyes
  px(g, COL.EYE, 3, 3, 2, 1);
  px(g, COL.EYE, 7, 3, 2, 1);
  // Glasses
  px(g, 0x555555, 2, 2, 4, 1);
  px(g, 0x555555, 6, 2, 4, 1);
  px(g, 0x555555, 6, 2, 1, 2); // bridge
  // Smile
  px(g, COL.MOUTH, 4, 5, 4, 1);
  // White coat
  px(g, COL.COAT, 1, 9, 10, 8);
  px(g, COL.COAT_SH, 3, 9, 3, 5);
  px(g, COL.COAT_SH, 6, 9, 3, 5);
  // Stethoscope
  px(g, COL.STETHOSCOPE, 2, 9, 1, 4);
  px(g, COL.STETHOSCOPE, 2, 12, 3, 1);
  px(g, COL.STETHOSCOPE, 9, 9, 1, 4);
  px(g, COL.STETHOSCOPE, 7, 12, 3, 1);
  // Gold star badge (Education God)
  px(g, COL.GOLD, 8, 14, 3, 2);
  g.generateTexture('attending_mohamed', 12 * P, 17 * P);
  g.destroy();
}

function _createKasprzakSprite(scene) {
  const g = scene.add.graphics();
  const skin = COL.SKIN_LIGHT;
  // Hair (short, dark)
  px(g, COL.HAIR_BLACK, 2, 0, 8, 3);
  px(g, COL.HAIR_BLACK, 1, 1, 10, 3);
  // Face
  px(g, skin, 2, 1, 8, 7);
  // Eyes
  px(g, COL.EYE, 3, 3, 2, 1);
  px(g, COL.EYE, 7, 3, 2, 1);
  // Slight smirk
  px(g, COL.MOUTH, 5, 6, 4, 1);
  // BUSINESS SUIT (dark)
  px(g, COL.SUIT_DARK, 1, 9, 10, 8);
  // Tie
  px(g, COL.TIE_RED, 5, 9, 2, 6);
  px(g, COL.TIE_RED, 4, 9, 4, 2);
  // Suit lapels (lighter)
  px(g, COL.SUIT_LIGHT, 1, 9, 3, 8);
  px(g, COL.SUIT_LIGHT, 8, 9, 3, 8);
  // Pocket square (white)
  px(g, 0xf0f0f0, 9, 10, 2, 2);
  // Dollar sign badge
  px(g, COL.GOLD, 2, 13, 3, 3);
  g.generateTexture('attending_kasprzak', 12 * P, 17 * P);
  g.destroy();
}

function _createKayatSprite(scene) {
  const g = scene.add.graphics();
  const skin = COL.SKIN_LIGHT;
  // Dark hair
  px(g, COL.HAIR_BLACK, 2, 0, 8, 4);
  px(g, COL.HAIR_BLACK, 1, 1, 10, 4);
  px(g, COL.HAIR_BLACK, 1, 3, 2, 4); // sideburns
  px(g, COL.HAIR_BLACK, 9, 3, 2, 4);
  // Face
  px(g, skin, 2, 1, 8, 7);
  // Eyes (expressive)
  px(g, COL.EYE, 3, 3, 2, 2);
  px(g, COL.EYE, 7, 3, 2, 2);
  // Light beard stubble (fair-skinned)
  px(g, 0x888888, 2, 6, 8, 2);
  // White coat
  px(g, COL.COAT, 1, 9, 10, 8);
  px(g, COL.COAT_SH, 3, 9, 3, 5);
  px(g, COL.COAT_SH, 6, 9, 3, 5);
  // Stethoscope
  px(g, COL.STETHOSCOPE, 2, 9, 1, 4);
  px(g, COL.STETHOSCOPE, 2, 12, 3, 1);
  px(g, COL.STETHOSCOPE, 9, 9, 1, 4);
  px(g, COL.STETHOSCOPE, 7, 12, 3, 1);
  // Prostate symbol badge (purple)
  px(g, COL.PURPLE, 8, 13, 3, 3);
  g.generateTexture('attending_kayat', 12 * P, 17 * P);
  g.destroy();
}

function _createRamaiyaSprite(scene) {
  const g = scene.add.graphics();
  const skin = COL.SKIN_DARK;
  // Hair — dark with gray temples
  px(g, COL.HAIR_BLACK, 2, 0, 8, 4);
  px(g, COL.HAIR_BLACK, 1, 1, 10, 3);
  px(g, COL.HAIR_GRAY,  1, 3, 2, 3);
  px(g, COL.HAIR_GRAY,  9, 3, 2, 3);
  // Face
  px(g, skin, 2, 1, 8, 7);
  // Intense eyes with red glow (mini boss!)
  px(g, COL.EYE, 3, 3, 2, 2);
  px(g, COL.EYE, 7, 3, 2, 2);
  px(g, 0xff2222, 3, 3, 1, 1);
  px(g, 0xff2222, 7, 3, 1, 1);
  // Confident smirk
  px(g, COL.MOUTH, 4, 6, 5, 1);
  // TRUCKER / DENIM JACKET with sherpa collar
  const DENIM      = 0x3a5f8a;
  const DENIM_DARK = 0x2a4a6a;
  const DENIM_LT   = 0x4a7aaa;
  const SHERPA     = 0xe8dcc8;  // off-white fleece
  // Sherpa collar (fluffy off-white band)
  px(g, SHERPA,     1, 8, 10, 3);
  px(g, 0xd4c4a8,   2, 10, 8, 1); // collar shadow edge
  // Denim jacket body
  px(g, DENIM,      1, 11, 10, 6);
  // Chest pockets (darker denim rectangles)
  px(g, DENIM_DARK, 2, 12, 3, 3);
  px(g, DENIM_DARK, 7, 12, 3, 3);
  // Pocket flaps (lighter highlight)
  px(g, DENIM_LT,   2, 12, 3, 1);
  px(g, DENIM_LT,   7, 12, 3, 1);
  // Center button placket
  px(g, DENIM_DARK, 5, 11, 2, 6);
  // Jacket side seams
  px(g, DENIM_DARK, 1, 11, 1, 6);
  px(g, DENIM_DARK, 10, 11, 1, 6);
  // Horizontal stitch lines (trucker jacket detail)
  px(g, DENIM_DARK, 1, 14, 10, 1);
  // Cancer God skull badge (red/ominous)
  px(g, 0xcc2222,  8, 15, 3, 2);
  px(g, 0xffffff,  9, 15, 1, 1);
  // COWBOY BOOTS — peeking below desk line (rows 17–19)
  const BOOT_BR   = 0x8b4513;
  const BOOT_DARK = 0x5a2d0c;
  const BOOT_HI   = 0xcc8855;
  px(g, BOOT_BR,   1, 17, 5, 3);   // left boot shaft
  px(g, BOOT_BR,   6, 17, 5, 3);   // right boot shaft
  px(g, BOOT_DARK, 1, 19, 4, 1);   // left pointed toe
  px(g, BOOT_DARK, 7, 19, 4, 1);   // right pointed toe
  px(g, BOOT_HI,   2, 17, 1, 2);   // left shine
  px(g, BOOT_HI,   7, 17, 1, 2);   // right shine
  // Boot stitching detail
  px(g, BOOT_HI,   1, 18, 1, 1);
  px(g, BOOT_HI,   6, 18, 1, 1);
  g.generateTexture('attending_ramaiya', 12 * P, 20 * P);
  g.destroy();
}

function _createTirumaniSprite(scene) {
  const g = scene.add.graphics();
  const skin = COL.SKIN_DARK;
  // Dark hair
  px(g, COL.HAIR_BLACK, 2, 0, 8, 4);
  px(g, COL.HAIR_BLACK, 1, 1, 10, 3);
  px(g, COL.HAIR_GRAY,  1, 3, 2, 3);
  px(g, COL.HAIR_GRAY,  9, 3, 2, 3);
  // Face
  px(g, skin, 2, 1, 8, 7);
  // Commanding eyes (gold tinted)
  px(g, COL.EYE, 3, 3, 2, 2);
  px(g, COL.EYE, 7, 3, 2, 2);
  px(g, COL.GOLD, 3, 3, 1, 1);  // gold fleck — DIVISION CHIEF
  px(g, COL.GOLD, 7, 3, 1, 1);
  // Beard/stubble
  px(g, COL.HAIR_BLACK, 3, 6, 6, 2);
  // White coat with GOLD trim (final boss!)
  px(g, COL.COAT, 1, 9, 10, 8);
  px(g, COL.GOLD, 1, 9, 1, 8);   // gold trim left
  px(g, COL.GOLD, 10, 9, 1, 8);  // gold trim right
  px(g, COL.GOLD, 1, 9, 10, 1);  // gold trim top
  px(g, COL.COAT_SH, 3, 10, 3, 5);
  px(g, COL.COAT_SH, 6, 10, 3, 5);
  // Stethoscope (gold)
  px(g, COL.GOLD, 2, 10, 1, 4);
  px(g, COL.GOLD, 2, 13, 3, 1);
  px(g, COL.GOLD, 9, 10, 1, 4);
  px(g, COL.GOLD, 7, 13, 3, 1);
  // CROWN (Division Chief!)
  px(g, COL.GOLD, 3, 0, 1, 2);
  px(g, COL.GOLD, 6, 0, 1, 3);
  px(g, COL.GOLD, 9, 0, 1, 2);
  px(g, COL.GOLD, 2, 1, 9, 1);
  // Division Chief badge
  px(g, COL.GOLD, 2, 13, 4, 3);
  px(g, 0x1a1a2e, 3, 14, 2, 1); // "DC" text suggestion
  g.generateTexture('attending_tirumani', 12 * P, 17 * P);
  g.destroy();
}

// ── Med Student obstacle sprite (10 × 20 pixels) ─────────────────────────────
function createMedStudentSprite(scene) {
  const g = scene.add.graphics();
  // Hair (varied)
  px(g, COL.HAIR_BROWN, 2, 0, 6, 3);
  px(g, COL.HAIR_BROWN, 1, 1, 8, 3);
  // Face
  px(g, COL.SKIN_LIGHT, 2, 1, 6, 5);
  px(g, COL.EYE, 3, 3, 1, 1);
  px(g, COL.EYE, 6, 3, 1, 1);
  px(g, COL.MOUTH, 3, 5, 4, 1);
  // Short white coat (3/4 length — med student!)
  px(g, 0xe8e8e8, 1, 7, 8, 7);  // slightly off-white
  px(g, 0xd0d0d0, 2, 7, 3, 4);
  px(g, 0xd0d0d0, 5, 7, 3, 4);
  // Name badge
  px(g, 0xffffff, 6, 10, 2, 2);
  px(g, 0x3366cc, 6, 10, 2, 1);  // badge
  // Backpack (left side)
  px(g, 0x2c3e50, 0, 7, 2, 7);
  // Pants
  px(g, COL.PANTS_NAVY, 2, 14, 3, 5);
  px(g, COL.PANTS_NAVY, 5, 14, 3, 5);
  // Shoes
  px(g, COL.SHOE, 1, 18, 4, 2);
  px(g, COL.SHOE, 5, 18, 4, 2);
  g.generateTexture('med_student', 10 * P, 20 * P);
  g.destroy();
}

// ── Tech obstacle sprite (scrubs, 10 × 20 pixels) ────────────────────────────
function createTechSprite(scene) {
  const g = scene.add.graphics();
  // Hair
  px(g, COL.HAIR_BLACK, 2, 0, 6, 4);
  px(g, COL.HAIR_BLACK, 1, 1, 8, 3);
  // Face
  px(g, COL.SKIN_MED, 2, 1, 6, 5);
  px(g, COL.EYE, 3, 3, 1, 1);
  px(g, COL.EYE, 6, 3, 1, 1);
  // Scrubs top (teal/blue)
  px(g, 0x1a7a7a, 1, 7, 8, 8);
  px(g, 0x0d5c5c, 1, 7, 2, 8);  // shadow
  // ID badge
  px(g, 0xffffff, 6, 9, 2, 3);
  px(g, 0xff6600, 6, 9, 2, 1);  // tech badge orange
  // Scrubs pants
  px(g, 0x1a7a7a, 2, 15, 3, 5);
  px(g, 0x1a7a7a, 5, 15, 3, 5);
  px(g, 0x0d5c5c, 4, 15, 2, 5);  // crease
  // Shoes (clogs)
  px(g, 0x225522, 1, 19, 4, 2);
  px(g, 0x225522, 5, 19, 4, 2);
  g.generateTexture('tech', 10 * P, 20 * P);
  g.destroy();
}

// ── US Probe projectile sprite ────────────────────────────────────────────────
function createProbeSprite(scene) {
  const g = scene.add.graphics();
  // Probe body
  px(g, 0x222222, 0, 2, 8, 3);
  px(g, 0x444444, 0, 2, 2, 3);  // grip highlight
  // Probe tip (blue ultrasound glow)
  px(g, 0x0088ff, 7, 0, 3, 7);
  px(g, 0x66ccff, 8, 1, 1, 5);  // highlight
  g.generateTexture('probe', 10 * P, 7 * P);
  g.destroy();
}

// ── Workstation (desk + monitor + chair) ─────────────────────────────────────
// Drawn per-scene as graphics (not sprites) since they're static background elements
function drawWorkstation(g, wx, wy, orientation = 'top') {
  // orientation: 'top' = against top wall (facing down), 'bottom' = against bottom wall
  const flipY = orientation === 'bottom' ? -1 : 1;
  const baseY = orientation === 'bottom' ? wy + 60 : wy;

  // Chair (behind desk in 3/4 view)
  g.fillStyle(COL.CHAIR, 1);
  g.fillRect(wx + 40, baseY + (orientation === 'top' ? -10 : 10), 100, 20);
  g.fillStyle(COL.CHAIR_SH, 1);
  g.fillRect(wx + 40, baseY + (orientation === 'top' ? -10 : 30), 100, 8);

  // Desk
  g.fillStyle(COL.DESK, 1);
  g.fillRect(wx, baseY, 180, 50);
  g.fillStyle(COL.DESK_SH, 1);
  g.fillRect(wx, baseY, 180, 6);

  // Monitor frame
  g.fillStyle(COL.MONITOR_FR, 1);
  g.fillRect(wx + 30, baseY - (orientation === 'top' ? 70 : -60), 120, 70);
  // Monitor screen
  g.fillStyle(COL.MONITOR_SCR, 1);
  g.fillRect(wx + 36, baseY - (orientation === 'top' ? 64 : -66), 108, 58);
  // Monitor scan lines (gives PACS viewer feel)
  g.fillStyle(0x003355, 0.5);
  for (let i = 0; i < 58; i += 4) {
    g.fillRect(wx + 36, baseY - (orientation === 'top' ? 64 : -66) + i, 108, 1);
  }
  // Monitor stand
  g.fillStyle(COL.MONITOR_FR, 1);
  g.fillRect(wx + 80, baseY - (orientation === 'top' ? 2 : -52), 20, 8);

  // Keyboard
  g.fillStyle(0x1a2a3a, 1);
  g.fillRect(wx + 50, baseY + 10, 80, 15);
  // Mouse
  g.fillStyle(0x223344, 1);
  g.fillRect(wx + 145, baseY + 12, 20, 14);
}

// ── Door sprite ───────────────────────────────────────────────────────────────
function drawDoor(g, dx, dy) {
  // Frame
  g.fillStyle(0x2c3e50, 1);
  g.fillRect(dx, dy, 80, 120);
  // Door panel
  g.fillStyle(0x3d5166, 1);
  g.fillRect(dx + 4, dy + 4, 72, 112);
  // Door handle
  g.fillStyle(0xf0c040, 1);
  g.fillRect(dx + 56, dy + 60, 12, 6);
  // Door window
  g.fillStyle(0x4fc3f7, 0.3);
  g.fillRect(dx + 16, dy + 20, 48, 30);
  // RADIOLOGY text above door
  g.fillStyle(0x00e5ff, 1);
}

// ── Room exit portal (transition zone) ───────────────────────────────────────
function createExitPortalSprite(scene) {
  const g = scene.add.graphics();
  // Portal ring
  for (let r = 50; r >= 30; r -= 4) {
    const alpha = (50 - r) / 20;
    g.fillStyle(0x9b59b6, alpha);
    g.fillCircle(50, 50, r);
  }
  g.fillStyle(0x1a0d2e, 1);
  g.fillCircle(50, 50, 28);
  g.fillStyle(0x9b59b6, 0.6);
  g.fillCircle(50, 50, 20);
  g.generateTexture('exit_portal', 100, 100);
  g.destroy();
}

// ── Health heart sprite ───────────────────────────────────────────────────────
function createHealthSprites(scene) {
  // Full heart
  const gf = scene.add.graphics();
  gf.fillStyle(0xee1155, 1);
  gf.fillCircle(8, 8, 8);
  gf.fillCircle(22, 8, 8);
  gf.fillTriangle(0, 10, 15, 30, 30, 10);
  gf.generateTexture('heart_full', 30, 30);
  gf.destroy();

  // Empty heart
  const ge = scene.add.graphics();
  ge.fillStyle(0x444455, 1);
  ge.fillCircle(8, 8, 8);
  ge.fillCircle(22, 8, 8);
  ge.fillTriangle(0, 10, 15, 30, 30, 10);
  ge.generateTexture('heart_empty', 30, 30);
  ge.destroy();
}

// ── Interaction prompt sprite (E to interact) ─────────────────────────────────
function createInteractPrompt(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xffd700, 1);
  g.fillRoundedRect(0, 0, 120, 36, 8);
  g.fillStyle(0x1a1a2e, 1);
  g.fillRoundedRect(2, 2, 116, 32, 7);
  g.generateTexture('interact_prompt_bg', 120, 36);
  g.destroy();
}

// ── Boss health bar ───────────────────────────────────────────────────────────
function createBossBarSprites(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xcc2222, 1);
  g.fillRect(0, 0, 400, 24);
  g.generateTexture('boss_bar_fill', 400, 24);
  g.destroy();
}

// ── All sprites bootstrap ─────────────────────────────────────────────────────
function createAllSprites(scene, playerOpts = {}) {
  createPlayerSprites(scene, playerOpts);
  createAttendingSprites(scene);
  createMedStudentSprite(scene);
  createTechSprite(scene);
  createProbeSprite(scene);
  createExitPortalSprite(scene);
  createHealthSprites(scene);
  createInteractPrompt(scene);
  createBossBarSprites(scene);
}
