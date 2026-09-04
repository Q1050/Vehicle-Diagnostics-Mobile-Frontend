import type { LiveDiagnosticUpdateDto } from "./dto/liveAudio";
import { API_BASE_URL, ENDPOINTS, shouldUseMocks } from "./endpoints";
import { authSession } from "./session-storage";

export interface LiveAudioHandlers {
  onOpen?: (sessionId: string) => void;
  onUpdate?: (message: LiveDiagnosticUpdateDto) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

export interface LiveAudioSession {
  stop: () => void;
}
export interface LiveAudioOptions {
  sessionId?: string;
  vehicleId?: string;
  userDescription?: string;
}

const sessionId = "live_mock_session";
const script: { at: number; update: LiveDiagnosticUpdateDto }[] = [
  {
    at: 2000,
    update: {
      type: "diagnostic_update",
      session_id: sessionId,
      window: { start_seconds: 0, end_seconds: 2 },
      overall: { anomaly_detected: false, anomaly_score: 0.15, confidence: 0.3 },
      events: [],
      stabilized_events: [],
      evidence: [],
      summary: "Listening for a steady pattern.",
    },
  },
  {
    at: 6000,
    update: {
      type: "diagnostic_update",
      session_id: sessionId,
      window: { start_seconds: 2, end_seconds: 6 },
      overall: { anomaly_detected: true, anomaly_score: 0.4, confidence: 0.42 },
      events: [{ event: "possible_knocking", detected: true, confidence: 0.42, severity: 0.45 }],
      stabilized_events: [],
      evidence: [
        {
          source: "live",
          event: "possible_knocking",
          severity: 0.45,
          confidence: 0.42,
          explanation: "Repeating tap heard; still monitoring.",
        },
      ],
      summary: "A repeating sound is emerging.",
    },
  },
  {
    at: 11000,
    update: {
      type: "diagnostic_update",
      session_id: sessionId,
      window: { start_seconds: 6, end_seconds: 11 },
      overall: { anomaly_detected: true, anomaly_score: 0.62, confidence: 0.62 },
      events: [
        { event: "possible_knocking", detected: true, confidence: 0.62, severity: 0.62 },
        { event: "possible_misfire_pattern", detected: true, confidence: 0.34, severity: 0.38 },
      ],
      stabilized_events: [
        {
          event: "possible_knocking",
          active: true,
          state: "started",
          confidence: 0.62,
          severity: 0.62,
        },
      ],
      evidence: [
        {
          source: "live",
          event: "possible_knocking",
          severity: 0.62,
          confidence: 0.62,
          explanation: "Pattern held steady across several engine cycles.",
        },
      ],
      summary:
        "Evidence suggests a repeating knocking-like pattern. Worth having a mechanic confirm it.",
    },
  },
];

export function openLiveAudioSession(
  handlers: LiveAudioHandlers,
  options: LiveAudioOptions = {},
): LiveAudioSession {
  if (!shouldUseMocks("liveAudio")) {
    let socket: WebSocket | undefined;
    let stream: MediaStream | undefined;
    let context: AudioContext | undefined;
    let processor: ScriptProcessorNode | undefined;
    let stopped = false;
    const release = (sendStop: boolean) => {
      if (stopped) return;
      stopped = true;
      processor?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close();
      if (sendStop && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "stop" }));
      }
      socket?.close();
    };
    void (async () => {
      try {
        const token = authSession.getToken();
        if (!token) throw new Error("Authentication is required.");
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Microphone capture is unavailable in this WebView.");
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        context = new AudioContext();
        if (context.state === "suspended") await context.resume();
        const base = API_BASE_URL || window.location.origin;
        const url = new URL(ENDPOINTS.liveAudioSocket, base);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        url.searchParams.set("token", token);
        if (import.meta.env.DEV)
          console.info(`[live-audio] connecting to ${url.origin}${url.pathname}`);
        socket = new WebSocket(url);
        socket.binaryType = "arraybuffer";
        socket.onmessage = (event) => {
          const message = JSON.parse(String(event.data));
          if (message.type === "session_started") handlers.onOpen?.(message.session_id);
          else if (message.type === "diagnostic_update") handlers.onUpdate?.(message);
          else if (message.type === "error") handlers.onError?.(message.message);
        };
        socket.onerror = () => {
          if (import.meta.env.DEV) console.warn("[live-audio] WebSocket error");
          handlers.onError?.("The live audio connection failed.");
        };
        socket.onclose = () => {
          if (import.meta.env.DEV) console.info("[live-audio] WebSocket closed");
          handlers.onClose?.();
        };
        await new Promise<void>((resolve, reject) => {
          socket!.onopen = () => resolve();
          socket!.addEventListener(
            "error",
            () => reject(new Error("WebSocket connection failed.")),
            { once: true },
          );
        });
        socket.send(
          JSON.stringify({
            type: "start",
            sample_rate: 16000,
            channels: 1,
            sample_format: "pcm_s16le",
            user_description: options.userDescription,
            session_id: options.sessionId,
            vehicle_id: options.vehicleId,
          }),
        );
        const source = context.createMediaStreamSource(stream);
        processor = context.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          if (socket?.readyState !== WebSocket.OPEN || stopped) return;
          const input = event.inputBuffer.getChannelData(0);
          const ratio = context!.sampleRate / 16000;
          const pcm = new Int16Array(Math.floor(input.length / ratio));
          for (let i = 0; i < pcm.length; i++) {
            const sample = input[Math.floor(i * ratio)] ?? 0;
            pcm[i] = Math.max(-1, Math.min(1, sample)) * 32767;
          }
          socket.send(pcm.buffer);
        };
        source.connect(processor);
        processor.connect(context.destination);
      } catch (error) {
        release(false);
        handlers.onError?.(error instanceof Error ? error.message : "Live audio failed.");
      }
    })();
    return {
      stop: () => {
        release(true);
      },
    };
  }
  const timers: ReturnType<typeof setTimeout>[] = [];
  let closed = false;
  timers.push(
    setTimeout(() => {
      if (!closed) handlers.onOpen?.(sessionId);
    }, 900),
  );
  for (const step of script) {
    timers.push(
      setTimeout(() => {
        if (!closed) handlers.onUpdate?.(step.update);
      }, step.at),
    );
  }
  return {
    stop: () => {
      closed = true;
      timers.forEach(clearTimeout);
      handlers.onClose?.();
    },
  };
}
