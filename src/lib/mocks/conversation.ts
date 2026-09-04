import type { ChatMessage } from "../types";

let seq = 0;
export function nextId(prefix = "msg") {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

export const openingMessages: ChatMessage[] = [
  {
    id: "msg_open",
    role: "assistant",
    text: "Tell me what you've noticed. You can describe the problem in your own words, take a photo, record a sound, or upload a video.",
    suggestions: [
      "It makes a strange noise",
      "It shakes or vibrates",
      "A warning light came on",
      "Something looks like it's leaking",
    ],
    createdAt: new Date().toISOString(),
  },
];

/**
 * Very small scripted assistant used by the prototype. Replaced later by
 * POST /api/v1/conversations/:id/messages.
 */
export function scriptedReply(userText: string, turn: number): ChatMessage {
  const text = userText.toLowerCase();

  if (turn === 0) {
    return {
      id: nextId(),
      role: "assistant",
      text: "Thanks — that helps. Shaking at a stop is often related to how the engine is idling. When did you first notice it?",
      suggestions: ["Today", "This week", "It has been happening for a while", "Not sure"],
      createdAt: new Date().toISOString(),
    };
  }

  if (/today|week|while|not sure/.test(text)) {
    return {
      id: nextId(),
      role: "assistant",
      text: "Good to know. Evidence helps a lot here. If it's safe to do so with the car parked, a short engine recording or a photo of the engine bay would let me narrow this down.",
      suggestions: [
        "Record engine sound",
        "Take a photo",
        "Scan warning lights",
        "Just keep talking",
      ],
      createdAt: new Date().toISOString(),
    };
  }

  if (/light|warning|dashboard/.test(text)) {
    return {
      id: nextId(),
      role: "assistant",
      text: "A lit warning indicator is useful evidence. Scanning your dashboard lets me tell you which indicator it may be and how concerning it usually is.",
      suggestions: ["Scan warning lights", "Describe it instead"],
      createdAt: new Date().toISOString(),
    };
  }

  if (/noise|sound|knock|squeal|rattle/.test(text)) {
    return {
      id: nextId(),
      role: "assistant",
      text: "Sounds are easier for me to judge than to describe. A ten second recording near the engine — with the car parked and away from moving parts — usually tells me a lot.",
      suggestions: ["Record engine sound", "Live listen", "Describe it instead"],
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: nextId(),
    role: "assistant",
    text: "Understood. I've added that to this diagnosis. Anything else you've noticed — a smell, a light, a change in how it drives?",
    suggestions: ["A smell", "A warning light", "It drives differently", "That's everything"],
    createdAt: new Date().toISOString(),
  };
}
