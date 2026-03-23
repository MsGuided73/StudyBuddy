import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export function useLiveAPI(getCanvas: () => HTMLCanvasElement | null, userName: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const videoIntervalRef = useRef<number | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Study Buddy, a super friendly, casual AI math tutor. The student's name is ${userName}. You are looking at their whiteboard and talking to them. Guide them step by step. Keep your responses concise, conversational, and informal. Use their name. Do not give the final answer immediately. EXCEPTION: If ${userName} explicitly asks for the full step-by-step solution, provide it clearly.`,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);

            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const float32Array = e.inputBuffer.getChannelData(0);
              const int16Array = new Int16Array(float32Array.length);
              for (let i = 0; i < float32Array.length; i++) {
                int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767;
              }
              const bytes = new Uint8Array(int16Array.buffer);
              let binaryString = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binaryString += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binaryString);

              sessionPromise.then(session => {
                session.sendRealtimeInput({ audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);

            videoIntervalRef.current = window.setInterval(() => {
              const canvas = getCanvas();
              if (canvas) {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                const base64 = dataUrl.split(',')[1];
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ video: { data: base64, mimeType: 'image/jpeg' } });
                });
              }
            }, 1000);
          },
          onmessage: (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudioChunk(base64Audio);
            }

            if (message.serverContent?.interrupted) {
              stopPlayback();
            }
          },
          onclose: () => {
            disconnect();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError(err.message || "An error occurred");
            disconnect();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to microphone or API");
      setIsConnecting(false);
      disconnect();
    }
  }, [getCanvas, userName]);

  const playAudioChunk = (base64: string) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    const currentTime = audioCtx.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }

    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;

    sourceNodesRef.current.push(source);
    source.onended = () => {
      sourceNodesRef.current = sourceNodesRef.current.filter(s => s !== source);
    };
  };

  const stopPlayback = () => {
    sourceNodesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourceNodesRef.current = [];
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    stopPlayback();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  return { isConnected, isConnecting, error, connect, disconnect };
}
