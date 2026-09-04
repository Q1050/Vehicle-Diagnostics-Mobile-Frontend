import { App } from "@capacitor/app";
import { Camera } from "@capacitor/camera";
import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type MediaPermission = "camera" | "microphone";
export type MediaPermissionState = "granted" | "prompt" | "denied" | "limited" | "unknown";

interface NativeMediaPermissionsPlugin {
  getMicrophonePermission(): Promise<{ state: string }>;
  requestMicrophonePermission(): Promise<{ state: string }>;
  openAppSettings(): Promise<void>;
}

const NativeMediaPermissions = registerPlugin<NativeMediaPermissionsPlugin>("MediaPermissions");
export const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

function normalize(state: string | undefined): MediaPermissionState {
  if (state === "granted") return "granted";
  if (state === "limited") return "limited";
  if (state === "prompt" || state === "prompt_with_rationale") return "prompt";
  if (state === "denied") return "denied";
  return "unknown";
}

async function browserPermission(kind: MediaPermission): Promise<MediaPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
  try {
    const result = await navigator.permissions.query({ name: kind as PermissionName });
    return normalize(result.state);
  } catch {
    return "unknown";
  }
}

export async function getMediaPermission(kind: MediaPermission): Promise<MediaPermissionState> {
  if (!isNativeAndroid()) return browserPermission(kind);
  try {
    if (kind === "camera") return normalize((await Camera.checkPermissions()).camera);
    return normalize((await NativeMediaPermissions.getMicrophonePermission()).state);
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`[media] ${kind} permission check failed`, error);
    return "unknown";
  }
}

export async function requestMediaPermission(kind: MediaPermission): Promise<MediaPermissionState> {
  try {
    if (isNativeAndroid()) {
      const state =
        kind === "camera"
          ? (await Camera.requestPermissions({ permissions: ["camera"] })).camera
          : (await NativeMediaPermissions.requestMicrophonePermission()).state;
      const normalized = normalize(state);
      if (import.meta.env.DEV) console.info(`[media] ${kind} permission: ${normalized}`);
      return normalized;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: kind === "camera",
      audio: kind === "microphone",
    });
    stream.getTracks().forEach((track) => track.stop());
    return "granted";
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`[media] ${kind} permission request failed`, error);
    return getMediaPermission(kind);
  }
}

export async function ensureMediaPermission(kind: MediaPermission): Promise<MediaPermissionState> {
  const current = await getMediaPermission(kind);
  return current === "granted" || current === "limited" ? current : requestMediaPermission(kind);
}

export async function openAppSettings(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  await NativeMediaPermissions.openAppSettings();
  return true;
}

export async function onAppResume(callback: () => void): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) callback();
  });
}

export async function onAppStateChange(
  callback: (isActive: boolean) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return App.addListener("appStateChange", ({ isActive }) => callback(isActive));
}
