import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { ensureMediaPermission, isNativeAndroid } from "./mediaPermissions";

export class MediaPermissionError extends Error {
  constructor(public readonly permission: "camera" | "microphone") {
    super(`${permission === "camera" ? "Camera" : "Microphone"} permission is required.`);
    this.name = "MediaPermissionError";
  }
}

export async function captureNativePhoto(source: "camera" | "library"): Promise<File | null> {
  if (!isNativeAndroid()) return null;
  if (source === "camera") {
    const state = await ensureMediaPermission("camera");
    if (state !== "granted" && state !== "limited") throw new MediaPermissionError("camera");
  }
  try {
    const photo = await Camera.getPhoto({
      source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      resultType: CameraResultType.Uri,
      quality: 85,
      correctOrientation: true,
      width: 1920,
    });
    if (!photo.webPath) throw new Error("The selected photo could not be read.");
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const extension = photo.format === "png" ? "png" : "jpg";
    return new File([blob], `autoassist-${Date.now()}.${extension}`, {
      type: blob.type || `image/${extension === "jpg" ? "jpeg" : extension}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("cancel") || message.includes("user cancelled")) return null;
    throw error;
  }
}
