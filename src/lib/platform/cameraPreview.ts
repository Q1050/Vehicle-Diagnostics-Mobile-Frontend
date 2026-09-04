import { ensureMediaPermission, isNativeAndroid } from "./mediaPermissions";
import { MediaPermissionError } from "./mediaCapture";

export async function startCameraPreview(video: HTMLVideoElement): Promise<MediaStream> {
  if (isNativeAndroid()) {
    const permission = await ensureMediaPermission("camera");
    if (permission !== "granted" && permission !== "limited") {
      throw new MediaPermissionError("camera");
    }
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Live camera preview is not available on this device.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopCameraPreview(stream: MediaStream | null, video?: HTMLVideoElement | null) {
  stream?.getTracks().forEach((track) => track.stop());
  if (video) video.srcObject = null;
}

export async function capturePreviewFrame(video: HTMLVideoElement): Promise<File> {
  if (!video.videoWidth || !video.videoHeight) throw new Error("The camera is not ready yet.");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The captured frame could not be prepared.");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("The captured frame could not be saved.")),
      "image/jpeg",
      0.88,
    ),
  );
  return new File([blob], `autoassist-${Date.now()}.jpg`, { type: "image/jpeg" });
}
