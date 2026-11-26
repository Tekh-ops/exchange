import { useEffect } from 'react';
import { Application } from '@pixi/react';
import { BattleScene } from '../scenes/BattleScene';
import { BattleHUD } from '../ui/BattleHUD';
import { useGameStore } from '../stores/gameStore';
import { setupPixiEngine } from './pixiSetup';
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './types';

export function GameViewport() {
  const { settings } = useGameStore();

  useEffect(() => {
    // Ensure PixiJS components and nearest-neighbor texture styles are registered
    setupPixiEngine();
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#07050d] p-0 sm:p-2 md:p-4 overflow-hidden select-none">
      {/* 960x540 Virtual Aspect Container with Nearest-Neighbor Scaling */}
      <div
        className={`relative aspect-[16/9] w-full max-h-full max-w-[calc(100vh*16/9)] bg-[#09070f] border-2 border-[#241734] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden ${
          settings.crtOverlay ? 'crt-overlay' : ''
        }`}
        style={{
          imageRendering: 'pixelated',
        }}
      >
        {/* PixiJS 8 Application (The Game World) */}
        <Application
          width={VIRTUAL_WIDTH}
          height={VIRTUAL_HEIGHT}
          background="#09070f"
          className="w-full h-full block"
          roundPixels={true}
          antialias={false}
          autoDensity={false}
        >
          <BattleScene />
        </Application>

        {/* React Layer (Menus and UI Overlays) */}
        <BattleHUD />
      </div>
    </div>
  );
}
