// Abdominal Odyssey — Phaser 3 Game Entry Point

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    CharacterCreatorScene,
    CorridorScene,
    MiniBossScene,
    FinalBossScene,
    GameOverScene
  ]
};

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});
