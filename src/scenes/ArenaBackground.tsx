import { useCallback, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';

export function ArenaBackground() {
  const timeRef = useRef(0);
  const flameGraphicRef = useRef<PixiGraphics | null>(null);
  const runesGraphicRef = useRef<PixiGraphics | null>(null);

  // Animate torch flames and glowing floor runes
  useTick((ticker) => {
    timeRef.current += ticker.deltaTime * 0.05;

    // Redraw animated torch flame
    if (flameGraphicRef.current) {
      const g = flameGraphicRef.current;
      g.clear();

      // Left Torch (x: 160, y: 220)
      const flickerLeft = Math.sin(timeRef.current * 4) * 2;
      g.ellipse(160, 215 + flickerLeft, 8, 14 + flickerLeft);
      g.fill({ color: 0x9333ea, alpha: 0.8 });
      g.ellipse(160, 216 + flickerLeft, 4, 8);
      g.fill({ color: 0xf3e8ff, alpha: 0.95 });

      // Right Torch (x: 800, y: 220)
      const flickerRight = Math.cos(timeRef.current * 4.5) * 2;
      g.ellipse(800, 215 + flickerRight, 8, 14 + flickerRight);
      g.fill({ color: 0x10b981, alpha: 0.8 });
      g.ellipse(800, 216 + flickerRight, 4, 8);
      g.fill({ color: 0xa7f3d0, alpha: 0.95 });
    }

    // Pulse floor runes
    if (runesGraphicRef.current) {
      const g = runesGraphicRef.current;
      const alphaPulse = 0.4 + Math.sin(timeRef.current * 2) * 0.2;
      g.alpha = alphaPulse;
    }
  });

  const drawStaticScene = useCallback((g: PixiGraphics) => {
    g.clear();

    // 1. Deep Void Sky (Gradient top)
    g.rect(0, 0, 960, 540);
    g.fill({ color: 0x09070f });

    // Distant Star Cluster (crisp pixel stars)
    const starCoords = [
      [80, 45], [140, 90], [220, 30], [310, 70], [450, 40],
      [520, 80], [610, 35], [740, 60], [830, 40], [900, 85],
      [110, 140], [260, 110], [680, 115], [860, 130]
    ];
    starCoords.forEach(([sx, sy]) => {
      g.rect(sx, sy, 2, 2);
      g.fill({ color: 0xe9d5ff, alpha: 0.7 });
    });

    // 2. Twin Moons
    // Pale Violet Moon (Left background)
    g.circle(180, 90, 38);
    g.fill({ color: 0x581c87, alpha: 0.6 });
    g.circle(180, 90, 34);
    g.fill({ color: 0xc084fc, alpha: 0.85 });
    g.circle(192, 85, 28);
    g.fill({ color: 0x09070f }); // Crescent cutout

    // Blood Moon (Right background)
    g.circle(780, 110, 26);
    g.fill({ color: 0x7f1d1d, alpha: 0.7 });
    g.circle(780, 110, 22);
    g.fill({ color: 0xef4444, alpha: 0.85 });

    // 3. Distant Gothic Spires & Castle Silhouette (y: 120 to 280)
    g.poly([
      0, 280,
      60, 160,
      80, 120,
      100, 160,
      140, 240,
      220, 180,
      240, 130,
      260, 180,
      320, 270,
      440, 220,
      480, 150,
      520, 220,
      640, 260,
      700, 170,
      720, 120,
      740, 170,
      820, 240,
      890, 160,
      910, 110,
      930, 160,
      960, 280,
      960, 540,
      0, 540
    ]);
    g.fill({ color: 0x110c1c });

    // 4. Grand Castle Battlements & Stone Arches
    // Back wall masonry
    g.rect(80, 180, 800, 180);
    g.fill({ color: 0x181226 });

    // Castle Columns / Pillars
    const pillars = [120, 320, 600, 800];
    pillars.forEach((px) => {
      // Pillar shaft
      g.rect(px - 18, 160, 36, 200);
      g.fill({ color: 0x241d35 });
      // Pillar highlights
      g.rect(px - 14, 160, 8, 200);
      g.fill({ color: 0x302747 });
      // Pillar capitals and bases
      g.rect(px - 26, 150, 52, 14);
      g.fill({ color: 0x3d325a });
      g.rect(px - 24, 350, 48, 14);
      g.fill({ color: 0x3d325a });
    });

    // Central Gothic Stained Glass Window
    g.rect(420, 160, 120, 160);
    g.fill({ color: 0x0f0b18 });
    g.arc(480, 170, 50, Math.PI, 0);
    g.fill({ color: 0x3b0764, alpha: 0.8 });
    g.circle(480, 200, 36);
    g.fill({ color: 0x6b21a8, alpha: 0.9 });
    g.circle(480, 200, 24);
    g.fill({ color: 0xd4af37, alpha: 0.8 }); // Golden emblem in window
    g.circle(480, 200, 14);
    g.fill({ color: 0x09070f });

    // Torch brackets on pillars
    g.rect(156, 226, 8, 22);
    g.fill({ color: 0x0a0711 });
    g.rect(152, 224, 16, 6);
    g.fill({ color: 0x475569 });

    g.rect(796, 226, 8, 22);
    g.fill({ color: 0x0a0711 });
    g.rect(792, 224, 16, 6);
    g.fill({ color: 0x475569 });

    // 5. Arena Floor / Platform (y: 350 to 540)
    g.rect(0, 360, 960, 180);
    g.fill({ color: 0x130e1f });

    // Stone flagstone grid
    g.stroke({ width: 2, color: 0x221a36 });
    for (let x = 0; x <= 960; x += 60) {
      g.moveTo(x, 360);
      g.lineTo(x, 540);
    }
    for (let y = 360; y <= 540; y += 30) {
      g.moveTo(0, y);
      g.lineTo(960, y);
    }

    // Platform upper edge highlight
    g.rect(0, 356, 960, 4);
    g.fill({ color: 0x582b80 });
  }, []);

  const drawRunes = useCallback((g: PixiGraphics) => {
    g.clear();
    // Central Arcane Ritual Ring on Floor
    g.ellipse(480, 440, 320, 60);
    g.stroke({ width: 3, color: 0xd4af37 });

    g.ellipse(480, 440, 260, 48);
    g.stroke({ width: 2, color: 0x9333ea });

    // Runic dots along ring
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const rx = 480 + Math.cos(a) * 290;
      const ry = 440 + Math.sin(a) * 54;
      g.rect(rx - 3, ry - 3, 6, 6);
      g.fill({ color: 0xf5e08e });
    }

    // Player duel spot rune circle
    g.ellipse(260, 420, 70, 20);
    g.stroke({ width: 2, color: 0xa855f7 });

    // Enemy duel spot rune circle
    g.ellipse(700, 420, 70, 20);
    g.stroke({ width: 2, color: 0x10b981 });
  }, []);

  return (
    <pixiContainer>
      {/* Static Arena Geometry */}
      <pixiGraphics draw={drawStaticScene} />

      {/* Pulsing Magic Runes */}
      <pixiGraphics ref={runesGraphicRef} draw={drawRunes} />

      {/* Dynamic Animated Torch Flames */}
      <pixiGraphics ref={flameGraphicRef} draw={() => {}} />
    </pixiContainer>
  );
}
