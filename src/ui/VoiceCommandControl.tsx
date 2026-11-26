import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, XCircle } from 'lucide-react';
import { voiceCommandManager } from '../voice/VoiceCommandManager';
import { VoiceCommandParser, ParsedVoiceCommand } from '../voice/VoiceCommandParser';
import { loadVoiceSettings, speakFeedback } from '../voice/VoiceSettings';
import { useCombatStore } from '../stores/combatStore';
import { soundEngine } from '../voice/soundEngine';

export function VoiceCommandControl() {
  const {
    activeSpells,
    turnPhase,
    enemies,
    selectTarget,
    castSpell,
    performDodge,
    moveLane,
    addLog,
    battleRecorder,
  } = useCombatStore();

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewCommand, setPreviewCommand] = useState<ParsedVoiceCommand | null>(null);

  const settings = loadVoiceSettings();
  const supported = voiceCommandManager.isSupported();
  const latestTranscriptRef = useRef('');

  useEffect(() => {
    return () => {
      voiceCommandManager.cancel();
    };
  }, []);

  const executeParsedCommand = (parsed: ParsedVoiceCommand) => {
    if (parsed.kind === 'spell') {
      if (parsed.targetName) {
        const match = enemies.find(
          (e) =>
            e.entity.hp > 0 &&
            e.entity.name.toLowerCase().includes(parsed.targetName!.toLowerCase())
        );
        if (match) {
          selectTarget(match.entity.id);
        }
      }

      const res = castSpell(parsed.spellId, { charge: parsed.charge, viaVoice: true });
      if (res.success) {
        const msg = parsed.charge ? `Charging ${parsed.spellName}!` : `Cast ${parsed.spellName}!`;
        setStatusMessage(msg);
        speakFeedback(msg, settings.spokenFeedback);
      } else {
        setStatusMessage(res.reason || 'Spell failed.');
        if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
      }
      return;
    }

    if (parsed.kind === 'dodge') {
      const res = performDodge(parsed.dodgeType, parsed.targetLane);
      if (res.success) {
        setStatusMessage(`Voice: ${parsed.dodgeType.replace('_', ' ')}`);
        if (battleRecorder) battleRecorder.recordVoiceAttempt(true, parsed.rawTranscript);
      } else {
        setStatusMessage(res.reason || 'Dodge failed.');
        if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
      }
      return;
    }

    if (parsed.kind === 'move_lane') {
      const res = moveLane(parsed.direction);
      if (res.success) {
        setStatusMessage(`Moved ${parsed.direction}`);
        if (battleRecorder) battleRecorder.recordVoiceAttempt(true, parsed.rawTranscript);
      } else {
        setStatusMessage(res.reason || 'Cannot move.');
        if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
      }
      return;
    }

    setStatusMessage(parsed.reason);
    addLog(`🎙️ Voice command not recognized: "${parsed.rawTranscript}"`, 'system');
    if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
  };

  const startVoice = () => {
    if (!settings.enabled || !supported || turnPhase !== 'player_turn') return;
    soundEngine.playClick();
    setTranscript('');
    setPreviewCommand(null);
    setStatusMessage('Listening... speak spell, dodge, or lane');
    latestTranscriptRef.current = '';

    const started = voiceCommandManager.startListening(settings.language, {
      onTranscript: (text, isFinal) => {
        setTranscript(text);
        latestTranscriptRef.current = text;
        const parsed = VoiceCommandParser.parse(text, activeSpells);
        setPreviewCommand(parsed);
        if (isFinal) {
          voiceCommandManager.stopListening();
          setListening(false);
          executeParsedCommand(parsed);
        }
      },
      onError: (err) => {
        setListening(false);
        setStatusMessage(err);
      },
      onEnd: () => {
        setListening(false);
      },
    });

    if (started) {
      setListening(true);
    }
  };

  const stopVoice = () => {
    if (!listening) return;
    voiceCommandManager.stopListening();
    setListening(false);
    if (latestTranscriptRef.current) {
      const parsed = VoiceCommandParser.parse(latestTranscriptRef.current, activeSpells);
      executeParsedCommand(parsed);
    }
  };

  const cancelVoice = () => {
    voiceCommandManager.cancel();
    setListening(false);
    setTranscript('');
    setPreviewCommand(null);
    setStatusMessage('Voice cast cancelled.');
  };

  if (!settings.enabled) return null;

  return (
    <div className="flex items-center gap-2 relative">
      {!supported ? (
        <div
          className="px-2 py-1 rounded bg-purple-950/70 border border-purple-800/60 font-pixel text-[8px] text-gray-400 flex items-center gap-1"
          title="Browser SpeechRecognition API unavailable in this browser"
        >
          <MicOff size={12} />
          <span>VOICE N/A</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={turnPhase !== 'player_turn'}
            onMouseDown={settings.mode === 'push-to-talk' ? startVoice : undefined}
            onMouseUp={settings.mode === 'push-to-talk' ? stopVoice : undefined}
            onClick={
              settings.mode === 'toggle'
                ? () => (listening ? stopVoice() : startVoice())
                : undefined
            }
            className={`pixel-btn px-2.5 py-1.5 flex items-center gap-1.5 font-pixel text-[9px] cursor-pointer transition ${
              listening
                ? 'border-red-400 text-red-300 bg-red-950/60 animate-pulse'
                : 'text-amber-200 border-amber-600/70 hover:scale-105'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={
              settings.mode === 'push-to-talk'
                ? 'Hold to speak a spell (e.g. "Cast Arcane Dart", "Dodge", "Move Left")'
                : 'Press to speak a spell, dodge, or lane command (press again to stop)'
            }
          >
            {listening ? <Volume2 size={13} /> : <Mic size={13} />}
            <span>{listening ? 'LISTENING...' : settings.mode === 'push-to-talk' ? 'HOLD TO CAST' : 'VOICE CAST'}</span>
          </button>

          {listening && (
            <button
              type="button"
              onClick={cancelVoice}
              className="p-1 text-red-400 hover:text-red-200 cursor-pointer"
              title="Cancel voice input"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      )}

      {(transcript || statusMessage) && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 pixel-box bg-[#120b21]/95 border border-purple-500/70 pointer-events-none z-50">
          {transcript && (
            <div className="font-lore text-[11px] text-purple-200 truncate">
              Heard: "{transcript}"
            </div>
          )}
          {previewCommand && previewCommand.kind === 'spell' && (
            <div className="font-pixel text-[8px] text-amber-300 mt-0.5">
              Match: {previewCommand.spellName} ({Math.round(previewCommand.confidence * 100)}%)
            </div>
          )}
          {statusMessage && (
            <div className="font-pixel text-[8px] text-emerald-300 mt-0.5">{statusMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
