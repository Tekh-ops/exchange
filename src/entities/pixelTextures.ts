import { Texture } from 'pixi.js';

/**
 * Generates procedural pixel art textures using HTML5 Canvas
 * with nearest-neighbour scaling so pixels remain razor sharp.
 */

// Helper to create a canvas and draw pixel matrix
function createPixelTexture(
  width: number,
  height: number,
  pixelDrawer: (ctx: CanvasRenderingContext2D) => void
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    pixelDrawer(ctx);
  }
  return Texture.from(canvas);
}

// Procedural texture cache
export const TextureCache: Record<string, Texture> = {};

export function initPixelTextures(): void {
  if (TextureCache['player_sorcerer']) return;

  // 1. The Petty Sorcerer (Player Sprite, 64x64)
  TextureCache['player_sorcerer'] = createPixelTexture(64, 64, (ctx) => {
    // Robes (deep purple & charcoal)
    ctx.fillStyle = '#241734';
    ctx.fillRect(20, 28, 24, 30);
    ctx.fillStyle = '#30145c';
    ctx.fillRect(24, 26, 16, 26);
    // Gold trim
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(28, 28, 4, 28);
    ctx.fillRect(20, 56, 24, 2);

    // Face / skin
    ctx.fillStyle = '#f6d8ae';
    ctx.fillRect(24, 20, 16, 10);
    // Smug / petty eyes
    ctx.fillStyle = '#171224';
    ctx.fillRect(26, 23, 3, 2);
    ctx.fillRect(35, 23, 3, 2);
    // Wizard beard
    ctx.fillStyle = '#e0dbec';
    ctx.fillRect(24, 27, 16, 8);
    ctx.fillRect(27, 34, 10, 5);
    ctx.fillRect(30, 39, 4, 3);

    // Pointed Wizard Hat
    ctx.fillStyle = '#1f0d3d';
    ctx.fillRect(16, 18, 32, 4); // Hat brim
    ctx.fillRect(22, 12, 20, 6);
    ctx.fillRect(26, 6, 12, 6);
    ctx.fillRect(32, 2, 8, 4); // Bent tip
    ctx.fillRect(38, 4, 4, 4);
    // Hat Gold Buckle
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(28, 14, 8, 4);
    ctx.fillStyle = '#241734';
    ctx.fillRect(30, 15, 4, 2);

    // Wand hand & Petty crooked staff
    ctx.fillStyle = '#f6d8ae';
    ctx.fillRect(44, 32, 4, 4); // Hand
    ctx.fillStyle = '#654321';
    ctx.fillRect(47, 18, 3, 36); // Staff shaft
    // Staff crystal top (pulsing violet orb)
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(45, 12, 7, 7);
    ctx.fillStyle = '#f3e8ff';
    ctx.fillRect(47, 14, 3, 3);
  });

  // 2. Arch-Mage Malakor the Pretentious (Enemy Sprite, 64x64)
  TextureCache['enemy_malakor'] = createPixelTexture(64, 64, (ctx) => {
    // Dark Obsidian Robes
    ctx.fillStyle = '#110e1b';
    ctx.fillRect(18, 28, 28, 32);
    ctx.fillStyle = '#1b1528';
    ctx.fillRect(22, 26, 20, 30);
    // Toxic rune etchings on robe
    ctx.fillStyle = '#065f46';
    ctx.fillRect(24, 34, 4, 18);
    ctx.fillRect(36, 34, 4, 18);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(25, 38, 2, 8);
    ctx.fillRect(37, 38, 2, 8);

    // Shadowy Cowl / Hood
    ctx.fillStyle = '#09070f';
    ctx.fillRect(20, 14, 24, 16);
    ctx.fillRect(24, 10, 16, 6);
    // Horn-like cowl peaks
    ctx.fillRect(18, 8, 5, 8);
    ctx.fillRect(41, 8, 5, 8);

    // Glowing menacing emerald eyes
    ctx.fillStyle = '#34d399';
    ctx.fillRect(25, 20, 4, 2);
    ctx.fillRect(35, 20, 4, 2);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(26, 20, 2, 1);
    ctx.fillRect(36, 20, 2, 1);

    // Dread Skull Staff
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(12, 16, 3, 42); // Staff shaft
    // Skull ornament on staff
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(9, 8, 9, 8);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(10, 11, 2, 2); // Eye holes
    ctx.fillRect(15, 11, 2, 2);
    // Glowing emerald aura on skull
    ctx.fillStyle = '#10b981';
    ctx.fillRect(12, 6, 3, 3);
  });

  // 2b. Vorath — The Eternal Arcanist (Legendary Boss Sprite, 80x80)
  TextureCache['enemy_vorath'] = createPixelTexture(80, 80, (ctx) => {
    ctx.fillStyle = '#1e0b36';
    ctx.fillRect(20, 30, 40, 44);
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(25, 28, 30, 40);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(16, 28, 10, 8);
    ctx.fillRect(54, 28, 10, 8);
    ctx.fillRect(36, 32, 8, 36);
    ctx.fillRect(20, 72, 40, 3);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(28, 10, 24, 4);
    ctx.fillRect(26, 4, 4, 8);
    ctx.fillRect(38, 2, 4, 10);
    ctx.fillRect(50, 4, 4, 8);

    ctx.fillStyle = '#090414';
    ctx.fillRect(28, 14, 24, 16);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(32, 20, 5, 3);
    ctx.fillRect(43, 20, 5, 3);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(10, 18, 4, 4);
    ctx.fillRect(66, 20, 4, 4);
    ctx.fillRect(12, 48, 3, 3);
    ctx.fillRect(65, 50, 3, 3);

    ctx.fillStyle = '#581c87';
    ctx.fillRect(10, 14, 4, 58);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(7, 6, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 9, 4, 4);
  });

  // 3. Projectile - Arcane Bolt
  TextureCache['proj_arcane'] = createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(2, 6, 12, 4);
    ctx.fillRect(6, 2, 4, 12);
    ctx.fillStyle = '#f3e8ff';
    ctx.fillRect(5, 5, 6, 6);
  });

  // 4. Projectile - Fireball / Pyro
  TextureCache['proj_fire'] = createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(3, 3, 10, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(5, 5, 6, 6);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(7, 7, 3, 3);
  });

  // 5. Projectile - Void Skull
  TextureCache['proj_void'] = createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(3, 2, 10, 9);
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillRect(9, 5, 2, 2);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(5, 11, 6, 3);
  });

  // 5b. Projectile - Ice Shard
  TextureCache['proj_ice'] = createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, 2, 8, 12);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(6, 4, 4, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 5, 2, 6);
  });

  // 6. Shield Barrier Dome
  TextureCache['shield_barrier'] = createPixelTexture(64, 64, (ctx) => {
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 56, 56);
    ctx.fillStyle = 'rgba(96, 165, 250, 0.2)';
    ctx.fillRect(4, 4, 56, 56);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(2, 2, 6, 6);
    ctx.fillRect(56, 2, 6, 6);
    ctx.fillRect(2, 56, 6, 6);
    ctx.fillRect(56, 56, 6, 6);
  });

  // 7. Castle Torch / Brazier
  TextureCache['torch_brazier'] = createPixelTexture(16, 32, (ctx) => {
    // Iron bracket
    ctx.fillStyle = '#262626';
    ctx.fillRect(6, 14, 4, 18);
    ctx.fillRect(4, 14, 8, 4);
    // Purple mystical flame
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(5, 8, 6, 6);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(6, 4, 4, 6);
    ctx.fillStyle = '#f3e8ff';
    ctx.fillRect(7, 2, 2, 4);
  });
}
