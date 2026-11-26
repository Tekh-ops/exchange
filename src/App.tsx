import { useEffect } from 'react';
import { useGameStore } from './stores/gameStore';
import { MainMenu } from './ui/MainMenu';
import { GameViewport } from './engine/GameViewport';
import { setupPixiEngine } from './engine/pixiSetup';

export default function App() {
  const { currentScene } = useGameStore();

  useEffect(() => {
    // Register PixiJS 8 extensions & texture cache on bootstrap
    setupPixiEngine();
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#07050d]">
      {currentScene === 'main_menu' && <MainMenu />}
      {(currentScene === 'battle' || currentScene === 'victory' || currentScene === 'defeat') && (
        <GameViewport />
      )}
    </main>
  );
}
