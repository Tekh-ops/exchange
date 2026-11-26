import { useEffect, useState } from 'react';
import { useCombatStore } from '../stores/combatStore';
import { PETTY_BANTER } from '../dialogue/banterData';
import { soundEngine } from '../voice/soundEngine';
import { MessageSquare, ChevronRight, X } from 'lucide-react';

export function DialogueBox() {
  const { dialogueOpen, closeDialogue } = useCombatStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');

  const currentDialogue = PETTY_BANTER[currentIndex];

  // Reset dialogue index on mount
  useEffect(() => {
    setCurrentIndex(0);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!dialogueOpen || !currentDialogue) return;

    setDisplayedText('');
    let charIndex = 0;
    const fullText = currentDialogue.text;

    const timer = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        // Trigger voice sound every 2 characters
        if (charIndex % 2 === 0) {
          soundEngine.playWizardVoice(currentDialogue.speaker);
        }
        charIndex++;
      } else {
        clearInterval(timer);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [currentIndex, dialogueOpen, currentDialogue]);

  // Keyboard support: Enter, Space, or Escape to advance/close dialogue
  useEffect(() => {
    if (!dialogueOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dialogueOpen, currentIndex]);

  if (!dialogueOpen || !currentDialogue) return null;

  const handleNext = () => {
    soundEngine.playClick();
    if (currentIndex < PETTY_BANTER.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      closeDialogue();
    }
  };

  const isPlayer = currentDialogue.speaker === 'player';

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[820px] max-w-[94%] z-50 pointer-events-auto">
      <div className={`pixel-box p-4 border-2 ${isPlayer ? 'border-purple-500/80' : 'border-emerald-600/80'} shadow-2xl relative bg-[#130d22]/95 backdrop-blur-sm`}>
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/50 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isPlayer ? '🧙‍♂️' : '💀'}</span>
            <span className={`font-pixel text-xs tracking-wider ${isPlayer ? 'text-amber-300' : 'text-emerald-400'}`}>
              {currentDialogue.speakerName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              closeDialogue();
            }}
            className="text-gray-400 hover:text-white transition p-1 cursor-pointer"
            title="Dismiss Banter"
          >
            <X size={16} />
          </button>
        </div>

        {/* Text Content */}
        <p className="font-lore text-base sm:text-lg text-gray-200 min-h-[50px] leading-relaxed">
          "{displayedText}"
        </p>

        {/* Bottom controls */}
        <div className="flex items-center justify-between pt-2 border-t border-purple-950 mt-3">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-pixel">
            <MessageSquare size={12} className="text-purple-400" />
            <span>EXCHANGE {currentIndex + 1}/{PETTY_BANTER.length}</span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="pixel-btn px-4 py-1.5 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>{currentIndex < PETTY_BANTER.length - 1 ? 'CONTINUE' : 'ENGAGE IN COMBAT'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
