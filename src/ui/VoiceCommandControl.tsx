import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, XCircle } from 'lucide-react';
import { voiceCommandManager, VoiceSessionState } from '../voice/VoiceCommandManager';
import { VoiceCommandParser, ParsedVoiceCommand } from '../voice/VoiceCommandParser';
import { loadVoiceSettings, speakFeedback } from '../voice/VoiceSettings';
import { useCombatStore } from '../stores/combatStore';
import { soundEngine } from '../voice/soundEngine';

type FeedbackPhase =
  | 'inactive'
  | 'listening'
  | 'recognizing'
  | 'cast'
  | 'rejected'
  | 'ambiguous'
  | 'denied'
  | 'unsupported';

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

  const [sessionState, setSessionState] = useState<VoiceSessionState>(
    voiceCommandManager.isSupported() ? 'inactive' : 'unsupported'
  );
  const [feedbackPhase, setFeedbackPhase] = useState<FeedbackPhase>(
    voiceCommandManager.isSupported() ? 'inactive' : 'unsupported'
  );
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [identifiedSpell, setIdentifiedSpell] = useState<string | null>(null);
  const [identifiedTarget, setIdentifiedTarget] = useState<string | null>(null);

  const settings = loadVoiceSettings();
  const supported = voiceCommandManager.isSupported();
  const latestAlternativesRef = useRef<string[]>([]);
  const executedThisSessionRef = useRef(false);

  useEffect(() => {
    return () => {
      voiceCommandManager.cancel();
    };
  }, []);

  const executeParsedCommand = (parsed: ParsedVoiceCommand) => {
    if (executedThisSessionRef.current) return;
    executedThisSessionRef.current = true;

    if (parsed.kind === 'ambiguous') {
      setFeedbackPhase('ambiguous');
      setStatusMessage(parsed.reason);
      addLog(`🎙️ Ambiguous voice command: ${parsed.reason}`, 'system');
      if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
      return;
    }

    if (parsed.kind === 'spell') {
      setIdentifiedSpell(parsed.spellName);
      const livingEnemies = enemies.map((e) => e.entity).filter((e) => e.hp > 0);
      const targetRes = VoiceCommandParser.resolveVoiceTarget(parsed.targetName, livingEnemies);

      if (targetRes) {
        if (targetRes.status === 'ambiguous') {
          setFeedbackPhase('ambiguous');
          const msg = `Multiple targets match "${parsed.targetName}": ${targetRes.candidates.join(', ')}. Click or specify one.`;
          setStatusMessage(msg);
          addLog(`🎙️ ${msg}`, 'system');
          if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
          return;
        }
        if (targetRes.status === 'not_found') {
          setFeedbackPhase('rejected');
          const msg = `Target "${targetRes.query}" not found on the battlefield.`;
          setStatusMessage(msg);
          addLog(`🎙️ ${msg}`, 'system');
          if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
          return;
        }
        if (targetRes.status === 'matched') {
          setIdentifiedTarget(targetRes.enemyName);
          selectTarget(targetRes.enemyId);
        } else if (targetRes.status === 'all') {
          const spellObj = activeSpells.find((s) => s.id === parsed.spellId);
          if (spellObj && spellObj.targetRule !== 'all_enemies' && !parsed.charge) {
            setFeedbackPhase('rejected');
            const msg = `${parsed.spellName} cannot target all enemies.`;
            setStatusMessage(msg);
            addLog(`🎙️ ${msg}`, 'system');
            if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
            return;
          }
          setIdentifiedTarget('All Enemies');
        }
      }

      const res = castSpell(parsed.spellId, { charge: parsed.charge, viaVoice: true });
      if (res.success) {
        const msg = parsed.charge ? `Charging ${parsed.spellName}!` : `Cast ${parsed.spellName}!`;
        setFeedbackPhase('cast');
        setStatusMessage(msg);
        speakFeedback(msg, settings.spokenFeedback);
      } else {
        setFeedbackPhase('rejected');
        setStatusMessage(res.reason || 'Spell rejected by combat rules.');
        if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
      }
      return;
    }

    if (parsed.kind === 'dodge') {
      const res = performDodge(parsed.dodgeType, parsed.targetLane);
      if (res.success) {
        setFeedbackPhase('cast');
        setStatusMessage(`Voice: ${parsed.dodgeType.replace('_', ' ')}`);
        if (battleRecorder) battleRecorder.recordVoiceAttempt(true, parsed.rawTranscript);
      } else {
        setFeedbackPhase('rejected');
        setStatusMessage(res.reason || 'Dodge failed.');
        if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
      }
      return;
    }

    if (parsed.kind === 'move_lane') {
      const res = moveLane(parsed.direction);
      if (res.success) {
        setFeedbackPhase('cast');
        setStatusMessage(`Moved ${parsed.direction} lane`);
        if (battleRecorder) battleRecorder.recordVoiceAttempt(true, parsed.rawTranscript);
      } else {
        setFeedbackPhase('rejected');
        setStatusMessage(res.reason || 'Cannot move lanes.');
        if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
      }
      return;
    }

    setFeedbackPhase('rejected');
    setStatusMessage(parsed.reason);
    addLog(`🎙️ Voice command rejected: "${parsed.rawTranscript}"`, 'system');
    if (battleRecorder) battleRecorder.recordVoiceAttempt(false, parsed.rawTranscript);
  };

  const startVoice = () => {
    if (!settings.enabled || !supported || turnPhase !== 'player_turn') return;
    if (voiceCommandManager.isListening()) return;

    soundEngine.playClick();
    setTranscript('');
    setIdentifiedSpell(null);
    setIdentifiedTarget(null);
    setStatusMessage('Listening... speak spell, dodge, or lane');
    setFeedbackPhase('listening');
    latestAlternativesRef.current = [];
    executedThisSessionRef.current = false;

    voiceCommandManager.startListening(settings.language, {
      onStateChange: (st) => {
        setSessionState(st);
        if (st === 'listening') setFeedbackPhase('listening');
        else if (st === 'recognizing') setFeedbackPhase('recognizing');
        else if (st === 'denied') setFeedbackPhase('denied');
        else if (st === 'unsupported') setFeedbackPhase('unsupported');
      },
      onTranscript: (text, isFinal, alternatives) => {
        setTranscript(text);
        latestAlternativesRef.current = alternatives.length > 0 ? alternatives : [text];
        const parsed = VoiceCommandParser.parseAlternatives(
          latestAlternativesRef.current,
          activeSpells
        );
        if (parsed.kind === 'spell') {
          setIdentifiedSpell(parsed.spellName);
          if (parsed.targetName) setIdentifiedTarget(parsed.targetName);
        }
        if (isFinal) {
          voiceCommandManager.stopListening();
          executeParsedCommand(parsed);
        }
      },
      onError: (err, code) => {
        setSessionState(code === 'not-allowed' || code === 'service-not-allowed' ? 'denied' : 'inactive');
        setFeedbackPhase(code === 'not-allowed' || code === 'service-not-allowed' ? 'denied' : 'rejected');
        setStatusMessage(err);
      },
      onEnd: () => {
        setSessionState('inactive');
      },
    });
  };

  const stopVoice = () => {
    if (!voiceCommandManager.isListening()) return;
    voiceCommandManager.stopListening();
    setSessionState('inactive');
    if (!executedThisSessionRef.current && latestAlternativesRef.current.length > 0) {
      const parsed = VoiceCommandParser.parseAlternatives(
        latestAlternativesRef.current,
        activeSpells
      );
      executeParsedCommand(parsed);
    }
  };

  const cancelVoice = () => {
    executedThisSessionRef.current = true;
    voiceCommandManager.cancel();
    setSessionState('inactive');
    setFeedbackPhase('inactive');
    setTranscript('');
    setIdentifiedSpell(null);
    setIdentifiedTarget(null);
    setStatusMessage('Voice cast cancelled.');
  };

  if (!settings.enabled) return null;

  const isListening = sessionState === 'listening' || sessionState === 'recognizing';

  return (
    <div className="flex items-center gap-2 relative">
      {!supported ? (
        <div
          className="px-2 py-1 rounded bg-purple-950/70 border border-purple-800/60 font-pixel text-[8px] text-gray-400 flex items-center gap-1"
          title="Browser SpeechRecognition API unavailable in this browser. Use mouse or keys 1-6."
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
                ? () => (isListening ? stopVoice() : startVoice())
                : undefined
            }
            className={`pixel-btn px-2.5 py-1.5 flex items-center gap-1.5 font-pixel text-[9px] cursor-pointer transition ${
              isListening
                ? 'border-red-400 text-red-300 bg-red-950/60 animate-pulse'
                : 'text-amber-200 border-amber-600/70 hover:scale-105'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={
              settings.mode === 'push-to-talk'
                ? 'Hold to speak a spell (e.g. "Cast Arcane Dart on Malakor")'
                : 'Press to speak a spell, dodge, or lane command (press again to stop)'
            }
          >
            {isListening ? <Volume2 size={13} /> : <Mic size={13} />}
            <span>
              {sessionState === 'recognizing'
                ? 'RECOGNIZING...'
                : isListening
                ? 'LISTENING...'
                : settings.mode === 'push-to-talk'
                ? 'HOLD TO CAST'
                : 'VOICE CAST'}
            </span>
          </button>

          {isListening && (
            <button
              type="button"
              onClick={cancelVoice}
              className="p-1 text-red-400 hover:text-red-200 cursor-pointer"
              title="Cancel voice input"
              aria-label="Cancel voice input"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      )}

      {(transcript || statusMessage || feedbackPhase !== 'inactive') && (
        <div className="absolute bottom-full left-0 mb-2 w-72 p-2.5 pixel-box bg-[#120b21]/95 border border-purple-500/70 pointer-events-none z-50 space-y-0.5">
          <div className="flex items-center justify-between font-pixel text-[7px] text-purple-300 uppercase">
            <span>VOICE STATUS</span>
            <span
              className={
                feedbackPhase === 'cast'
                  ? 'text-emerald-400'
                  : feedbackPhase === 'rejected' || feedbackPhase === 'denied'
                  ? 'text-red-400'
                  : feedbackPhase === 'ambiguous'
                  ? 'text-amber-300'
                  : 'text-sky-300'
              }
            >
              {feedbackPhase.toUpperCase()}
            </span>
          </div>

          {transcript && (
            <div className="font-lore text-[11px] text-purple-100 truncate">
              Transcript: "{transcript}"
            </div>
          )}
          {identifiedSpell && (
            <div className="font-pixel text-[8px] text-amber-300">
              Spell: {identifiedSpell}
              {identifiedTarget ? ` → ${identifiedTarget}` : ''}
            </div>
          )}
          {statusMessage && (
            <div className="font-lore text-[11px] text-emerald-300 leading-tight">
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
