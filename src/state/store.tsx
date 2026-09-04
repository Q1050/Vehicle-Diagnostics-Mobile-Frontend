import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type {
  AnalysisFinding,
  Attachment,
  ChatMessage,
  DiagnosticSession,
  FusionResult,
  User,
  Vehicle,
} from "../lib/types";
import type { ActiveDiagnosticSession, DiagnosticArtifact } from "../lib/diagnostic-models";
import { getCurrentUser, hasAuthToken, signOut as clearAuthSession } from "../lib/api/auth";
import { listVehicles } from "../lib/api/vehicles";
import { listSessions, listAllSessions, createSession } from "../lib/api/history";
import {
  createLocalId,
  initialConversationMessages,
  sendMessage,
  createConversation,
  persistMessage,
  loadConversation,
  ConversationSendError,
} from "../lib/api/conversations";
import { toast } from "sonner";

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  user: User | null;
  vehicles: Vehicle[];
  currentVehicleId: string | null;
  messages: ChatMessage[];
  /** Evidence attached to the *current* conversation. */
  findings: AnalysisFinding[];
  fusion: FusionResult | null;
  activeSession: ActiveDiagnosticSession;
  sessions: DiagnosticSession[];
  notifications: boolean;
  chatResponding: boolean;
}

const initialState: AppState = {
  hydrated: false,
  onboarded: false,
  user: null,
  vehicles: [],
  currentVehicleId: null,
  messages: initialConversationMessages,
  findings: [],
  fusion: null,
  activeSession: createActiveSession("unknown"),
  sessions: [],
  notifications: true,
  chatResponding: false,
};

type Action =
  | { type: "hydrate"; payload: Partial<AppState> }
  | { type: "onboarded" }
  | { type: "signIn"; user: User }
  | { type: "signOut" }
  | { type: "setVehicles"; vehicles: Vehicle[] }
  | { type: "setSessions"; sessions: DiagnosticSession[] }
  | { type: "addVehicle"; vehicle: Vehicle }
  | { type: "updateVehicle"; id: string; patch: Partial<Vehicle> }
  | { type: "selectVehicle"; id: string }
  | { type: "addMessage"; message: ChatMessage }
  | { type: "setMessages"; messages: ChatMessage[] }
  | { type: "removeMessage"; id: string }
  | { type: "resetConversation"; sessionId?: string; conversationId?: string; vehicleId?: string }
  | { type: "addFinding"; finding: AnalysisFinding }
  | { type: "addArtifact"; artifact: DiagnosticArtifact }
  | { type: "setFusion"; fusion: FusionResult | null }
  | { type: "saveSession"; session: DiagnosticSession }
  | { type: "setNotifications"; value: boolean }
  | { type: "setChatResponding"; value: boolean };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "onboarded":
      return { ...state, onboarded: true };
    case "signIn":
      return { ...state, user: action.user };
    case "signOut":
      return { ...initialState, hydrated: true, onboarded: true, user: null };
    case "setVehicles":
      return {
        ...state,
        vehicles: action.vehicles,
        currentVehicleId: action.vehicles.some((v) => v.id === state.currentVehicleId)
          ? state.currentVehicleId
          : (action.vehicles[0]?.id ?? null),
      };
    case "setSessions":
      return { ...state, sessions: action.sessions };
    case "addVehicle":
      return {
        ...state,
        vehicles: [...state.vehicles, action.vehicle],
        currentVehicleId: state.currentVehicleId ?? action.vehicle.id,
      };
    case "updateVehicle":
      return {
        ...state,
        vehicles: state.vehicles.map((v) => (v.id === action.id ? { ...v, ...action.patch } : v)),
      };
    case "selectVehicle":
      if (action.id === state.currentVehicleId) return state;
      return {
        ...state,
        currentVehicleId: action.id,
        messages: initialConversationMessages,
        findings: [],
        fusion: null,
        activeSession: createActiveSession(action.id),
      };
    case "addMessage": {
      const messages = [...state.messages, action.message];
      return { ...state, messages, activeSession: { ...state.activeSession, messages } };
    }
    case "setMessages":
      return {
        ...state,
        messages: action.messages,
        activeSession: { ...state.activeSession, messages: action.messages },
      };
    case "removeMessage": {
      const messages = state.messages.filter((message) => message.id !== action.id);
      return { ...state, messages, activeSession: { ...state.activeSession, messages } };
    }
    case "resetConversation":
      return {
        ...state,
        messages: initialConversationMessages,
        findings: [],
        fusion: null,
        activeSession: createActiveSession(
          action.vehicleId ?? state.currentVehicleId ?? "unknown",
          action.sessionId,
          action.conversationId,
        ),
      };
    case "addFinding": {
      const findings = state.findings.some((f) => f.id === action.finding.id)
        ? state.findings
        : [...state.findings, action.finding];
      return {
        ...state,
        findings,
        activeSession: { ...state.activeSession, findings },
      };
    }
    case "addArtifact":
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          artifacts: state.activeSession.artifacts.some((item) => item.id === action.artifact.id)
            ? state.activeSession.artifacts
            : [...state.activeSession.artifacts, action.artifact],
        },
      };
    case "setFusion":
      return {
        ...state,
        fusion: action.fusion,
        activeSession: {
          ...state.activeSession,
          ...(action.fusion ? { fusion: action.fusion } : { fusion: undefined }),
        },
      };
    case "saveSession":
      return { ...state, sessions: [action.session, ...state.sessions] };
    case "setNotifications":
      return { ...state, notifications: action.value };
    case "setChatResponding":
      return { ...state, chatResponding: action.value };
    default:
      return state;
  }
}

const STORAGE_KEY = "autoassist.state.v1";

interface StoreValue extends AppState {
  currentVehicle: Vehicle | null;
  dispatch: React.Dispatch<Action>;
  /** Sends a user message and schedules the scripted assistant reply. */
  sendUserMessage: (text: string, answer?: { questionId: string; optionId: string }) => void;
  retryAssistantResponse: (message: ChatMessage) => void;
  attachEvidence: (attachment: Attachment, note?: string, conversationId?: string) => void;
  /** Adds an analysis result to the conversation as an inline result card. */
  addFindingToConversation: (
    finding: AnalysisFinding,
    intro?: string,
    conversationId?: string,
  ) => void;
  startNewDiagnosis: (vehicleId?: string) => Promise<void>;
  ensureActiveDiagnosis: () => Promise<{
    sessionId: string;
    conversationId: string;
    vehicleId: string;
  }>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const turnRef = useRef(0);
  const ensureDiagnosisRef = useRef<Promise<{
    sessionId: string;
    conversationId: string;
    vehicleId: string;
  }> | null>(null);
  const activeIdentityRef = useRef({
    sessionId: state.activeSession.id,
    conversationId: state.activeSession.conversationId,
    vehicleId: state.activeSession.vehicleId,
  });
  useEffect(() => {
    activeIdentityRef.current = {
      sessionId: state.activeSession.id,
      conversationId: state.activeSession.conversationId,
      vehicleId: state.activeSession.vehicleId,
    };
  }, [state.activeSession.id, state.activeSession.conversationId, state.activeSession.vehicleId]);

  // Hydrate only non-sensitive preferences locally; server-owned data comes from the API.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let preferences: Partial<AppState> = {};
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) preferences = JSON.parse(raw) as Partial<AppState>;
      } catch {
        /* use defaults */
      }
      if (!hasAuthToken()) {
        if (!cancelled) dispatch({ type: "hydrate", payload: preferences });
        return;
      }
      try {
        const [user, vehicles, sessions, allSessions] = await Promise.all([
          getCurrentUser(),
          listVehicles(),
          listSessions(),
          listAllSessions(),
        ]);
        const vehicleId = vehicles.some((v) => v.id === preferences.currentVehicleId)
          ? preferences.currentVehicleId!
          : (vehicles[0]?.id ?? null);
        const active = allSessions.find(
          (item) =>
            item.status === "active" && item.vehicle_id === vehicleId && item.conversation_id,
        );
        const restoredMessages = active?.conversation_id
          ? await loadConversation(active.conversation_id)
          : undefined;
        if (!cancelled)
          dispatch({
            type: "hydrate",
            payload: {
              ...preferences,
              user,
              vehicles,
              sessions,
              currentVehicleId: vehicleId,
              ...(active
                ? {
                    activeSession: {
                      ...createActiveSession(active.vehicle_id, active.id, active.conversation_id),
                      messages: restoredMessages ?? initialConversationMessages,
                    },
                    messages: restoredMessages ?? initialConversationMessages,
                  }
                : {}),
            },
          });
      } catch {
        clearAuthSession();
        if (!cancelled)
          dispatch({
            type: "hydrate",
            payload: { ...preferences, user: null, vehicles: [], sessions: [] },
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unauthorized = () => dispatch({ type: "signOut" });
    window.addEventListener("autoassist:unauthorized", unauthorized);
    return () => window.removeEventListener("autoassist:unauthorized", unauthorized);
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const persisted = {
      onboarded: state.onboarded,
      currentVehicleId: state.currentVehicleId,
      notifications: state.notifications,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* storage unavailable — prototype still works in memory */
    }
  }, [state]);

  const submitUserMessage = useCallback(
    (text: string, answer?: { questionId: string; optionId: string }, existing?: ChatMessage) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (state.chatResponding) return;
      if (state.activeSession.id.startsWith("active_")) {
        toast.error("Your diagnosis is still being prepared. Please try again.");
        return;
      }
      const userMessage: ChatMessage = existing ?? {
        id: createLocalId(),
        role: "user",
        text: trimmed,
        createdAt: new Date().toISOString(),
        status: "delivered",
      };
      if (!existing) dispatch({ type: "addMessage", message: userMessage });
      dispatch({ type: "setChatResponding", value: true });
      turnRef.current += 1;
      const turn = turnRef.current - 1;
      const identity = {
        sessionId: state.activeSession.id,
        conversationId: state.activeSession.conversationId,
        vehicleId: state.activeSession.vehicleId,
      };
      void sendMessage(
        trimmed,
        turn,
        state.activeSession.conversationId,
        state.activeSession.id,
        userMessage,
        answer,
      )
        .then((message) => {
          const current = activeIdentityRef.current;
          if (
            current.sessionId === identity.sessionId &&
            current.conversationId === identity.conversationId &&
            current.vehicleId === identity.vehicleId
          ) {
            dispatch({ type: "addMessage", message });
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) console.warn("Conversation message did not sync", error);
          const current = activeIdentityRef.current;
          if (current.conversationId === identity.conversationId) {
            const persisted = error instanceof ConversationSendError && error.userPersisted;
            if (persisted)
              dispatch({
                type: "addMessage",
                message: {
                  id: createLocalId(),
                  role: "assistant",
                  text: "I saved your message, but couldn't generate the response.",
                  createdAt: new Date().toISOString(),
                  status: "delivered",
                  retryResponse: {
                    userMessageId: userMessage.id,
                    text: trimmed,
                    ...(answer ? { questionId: answer.questionId, optionId: answer.optionId } : {}),
                  },
                },
              });
            toast.error(
              persisted
                ? "Your message was saved. You can retry the response below."
                : "Your message could not be saved. Check your connection and try again.",
            );
          }
        })
        .finally(() => dispatch({ type: "setChatResponding", value: false }));
    },
    [dispatch, state.activeSession, state.chatResponding],
  );

  const sendUserMessage = useCallback(
    (text: string, answer?: { questionId: string; optionId: string }) =>
      submitUserMessage(text, answer),
    [submitUserMessage],
  );

  const retryAssistantResponse = useCallback(
    (message: ChatMessage) => {
      const retry = message.retryResponse;
      if (!retry || state.chatResponding) return;
      const original = state.messages.find((item) => item.id === retry.userMessageId);
      if (!original) return;
      dispatch({ type: "removeMessage", id: message.id });
      submitUserMessage(
        retry.text,
        retry.questionId && retry.optionId
          ? { questionId: retry.questionId, optionId: retry.optionId }
          : undefined,
        original,
      );
    },
    [state.chatResponding, state.messages, submitUserMessage],
  );

  const startNewDiagnosis = useCallback(
    async (requestedVehicleId?: string) => {
      const vehicleId = requestedVehicleId ?? state.currentVehicleId;
      if (!vehicleId) throw new Error("Add a vehicle before starting a diagnosis.");
      if (!state.vehicles.some((vehicle) => vehicle.id === vehicleId)) {
        throw new Error("Select a vehicle from your Garage before starting a diagnosis.");
      }
      const session = await createSession(vehicleId);
      const conversation = await createConversation(vehicleId, session.id);
      const opening = await persistMessage(conversation.id, initialConversationMessages[0]!);
      if (vehicleId !== state.currentVehicleId) dispatch({ type: "selectVehicle", id: vehicleId });
      dispatch({
        type: "resetConversation",
        vehicleId,
        sessionId: session.id,
        conversationId: conversation.id,
      });
      dispatch({ type: "setMessages", messages: [opening] });
    },
    [state.currentVehicleId, state.vehicles],
  );

  const ensureActiveDiagnosis = useCallback(async () => {
    const vehicleId = state.currentVehicleId;
    if (!vehicleId) throw new Error("Add a vehicle before collecting diagnostic evidence.");
    if (
      !state.activeSession.id.startsWith("active_") &&
      state.activeSession.vehicleId === vehicleId
    ) {
      return {
        sessionId: state.activeSession.id,
        conversationId: state.activeSession.conversationId,
        vehicleId,
      };
    }
    if (ensureDiagnosisRef.current) return ensureDiagnosisRef.current;
    const pending = (async () => {
      const existing = (await listAllSessions()).find(
        (item) => item.status === "active" && item.vehicle_id === vehicleId && item.conversation_id,
      );
      if (existing?.conversation_id) {
        const messages = await loadConversation(existing.conversation_id);
        dispatch({
          type: "resetConversation",
          vehicleId,
          sessionId: existing.id,
          conversationId: existing.conversation_id,
        });
        dispatch({ type: "setMessages", messages });
        return { sessionId: existing.id, conversationId: existing.conversation_id, vehicleId };
      }
      const session = await createSession(vehicleId);
      const conversation = await createConversation(vehicleId, session.id);
      const opening = await persistMessage(conversation.id, initialConversationMessages[0]!);
      dispatch({
        type: "resetConversation",
        vehicleId,
        sessionId: session.id,
        conversationId: conversation.id,
      });
      dispatch({ type: "setMessages", messages: [opening] });
      return { sessionId: session.id, conversationId: conversation.id, vehicleId };
    })();
    ensureDiagnosisRef.current = pending;
    try {
      return await pending;
    } finally {
      if (ensureDiagnosisRef.current === pending) ensureDiagnosisRef.current = null;
    }
  }, [state.activeSession, state.currentVehicleId]);

  const attachEvidence = useCallback(
    (attachment: Attachment, note?: string, conversationId?: string) => {
      const message: ChatMessage = {
        id: createLocalId(),
        role: "user",
        attachment,
        text: note,
        createdAt: new Date().toISOString(),
        status: "delivered",
      };
      dispatch({ type: "addMessage", message });
      const targetConversation = conversationId ?? state.activeSession.conversationId;
      if (conversationId || !state.activeSession.id.startsWith("active_")) {
        void persistMessage(targetConversation, message).catch((error) => {
          if (import.meta.env.DEV) console.warn("Evidence message did not sync", error);
          toast.warning("The result is available, but its conversation entry did not sync.");
        });
      }
    },
    [state.activeSession.id, state.activeSession.conversationId],
  );

  const addFindingToConversation = useCallback(
    (finding: AnalysisFinding, intro?: string, conversationId?: string) => {
      dispatch({ type: "addFinding", finding });
      const message: ChatMessage = {
        id: createLocalId(),
        role: "assistant",
        text:
          intro ??
          "I've added this result to our conversation. A mechanic should confirm it, but here's what I found.",
        findingId: finding.id,
        suggestions: [
          "Ask a question about this",
          "Add another photo",
          "Record engine sound",
          "See summary",
        ],
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "addMessage", message });
      const targetConversation = conversationId ?? state.activeSession.conversationId;
      if (conversationId || !state.activeSession.id.startsWith("active_")) {
        void persistMessage(targetConversation, message).catch((error) => {
          if (import.meta.env.DEV) console.warn("Finding message did not sync", error);
          toast.warning("The result is available, but its conversation entry did not sync.");
        });
      }
    },
    [state.activeSession.id, state.activeSession.conversationId],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      currentVehicle: state.vehicles.find((v) => v.id === state.currentVehicleId) ?? null,
      dispatch,
      sendUserMessage,
      retryAssistantResponse,
      attachEvidence,
      addFindingToConversation,
      startNewDiagnosis,
      ensureActiveDiagnosis,
    }),
    [
      state,
      sendUserMessage,
      retryAssistantResponse,
      attachEvidence,
      addFindingToConversation,
      startNewDiagnosis,
      ensureActiveDiagnosis,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <AppStoreProvider>");
  return ctx;
}

function createActiveSession(
  vehicleId: string,
  id?: string,
  conversationId?: string,
): ActiveDiagnosticSession {
  const now = new Date().toISOString();
  return {
    id: id ?? createLocalId("active"),
    vehicleId,
    conversationId: conversationId ?? createLocalId("conv"),
    startedAt: now,
    messages: initialConversationMessages,
    findings: [],
    artifacts: [],
  };
}
