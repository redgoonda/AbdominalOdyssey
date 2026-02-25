// Global game state — shared across all Phaser scenes
window.GameState = {
  playerName: 'Resident',
  gender: 'male',
  headStyle: 0,
  clothStyle: 0,
  skinTone: 0,

  health: 5,
  maxHealth: 5,
  score: 0,

  // Track which attendings have been cleared
  clearedAttending: new Set(),

  // Questions loaded from server
  questions: null,

  // Track which question index each attending is on
  attendingQuestionIndex: {
    mohamed: 0,
    kasprzak: 0,
    kayat: 0,
    ramaiya: 0,
    tirumani: 0
  },

  reset() {
    this.health = this.maxHealth;
    this.score = 0;
    this.clearedAttending = new Set();
    this.attendingQuestionIndex = {
      mohamed: 0, kasprzak: 0, kayat: 0, ramaiya: 0, tirumani: 0
    };
  },

  addScore(pts) {
    this.score += pts;
  },

  takeDamage(amt = 1) {
    this.health = Math.max(0, this.health - amt);
    return this.health <= 0;
  },

  heal(amt = 1) {
    this.health = Math.min(this.maxHealth, this.health + amt);
  },

  clearAttending(id) {
    this.clearedAttending.add(id);
  },

  isCleared(id) {
    return this.clearedAttending.has(id);
  },

  allCorridorCleared() {
    return this.isCleared('mohamed') &&
           this.isCleared('kasprzak') &&
           this.isCleared('kayat');
  }
};
