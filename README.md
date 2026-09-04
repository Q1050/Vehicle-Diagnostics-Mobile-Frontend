# AutoAssist Frontend

React/TanStack Start consumer client for the AutoAssist diagnostic backend. The app uses real authentication, vehicles, conversations, grounded chat orchestration, structured symptom extraction, image/audio/video diagnostics, realtime audio, evidence fusion, manual retrieval, session completion, and history.

## Web development

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Start the sibling backend first. Browser configuration:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCKS=false
```

Real diagnostics are the default. Set `VITE_USE_MOCKS=true` only for explicit UI development; it mocks image, audio, video, live-audio, and fusion results. Authentication, vehicles, conversations, and history always use the backend. A failed real request never falls back to a fake result.

Chat prepares a real backend diagnostic session and conversation even when `/chat` is opened directly. In real mode, it persists the user-authored message once and asks the backend orchestrator to extract/reuse symptoms, load current evidence and fusion, optionally retrieve exact-vehicle manual guidance, generate or fall back to a grounded response, and persist the assistant once.

Validated citations appear in a compact expandable “Manual guidance sources” section and are labeled as reference guidance, not detected faults. Follow-up suggestions and supported action labels reuse the existing chips and routes. Provider failures normally show the backend's deterministic fallback without losing the conversation. With `VITE_USE_MOCKS=true`, the existing scripted generator remains available for UI development; real failures never silently become scripted successes.

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

## Android (Capacitor)

For the Android emulator use `VITE_API_BASE_URL=http://10.0.2.2:8000`, then:

```powershell
npm run build:mobile
npm run sync:mobile
Set-Location android
.\gradlew.bat assembleDebug
```

The APK is under `android/app/build/outputs/apk/debug/`. Internet and microphone permissions are declared. Cleartext HTTP is enabled only in debug builds.

On a physical device, localhost and `10.0.2.2` do not point to the development computer. Use its LAN address (bind the backend to `0.0.0.0` and allow the firewall) or an HTTPS tunnel. Use HTTPS in production.

Create the ignored mobile configuration locally before building:

```env
VITE_API_BASE_URL=http://<YOUR_PC_LAN_IP>:8000
VITE_USE_MOCKS=false
```

Then run `npm run build:mobile` and open Android Studio with `npm run open:android`.
The debug manifest permits development cleartext HTTP; release builds use the main
network-security policy and should point only to HTTPS services. Camera and microphone
permissions must be granted on the device when prompted. Never commit
`.env.mobile.local`, `android/local.properties`, signing keys, APKs, AABs, Gradle
output, `.output`, or `node_modules`.

## iOS readiness

Camera, photo-library, and microphone usage descriptions are included. Building requires macOS and Xcode:

```bash
npm install
VITE_API_BASE_URL=https://your-development-api.example npm run build:mobile
npm run sync:mobile
npm run open:ios
```

Select the signing team and run the App target in Xcode. iOS runtime behavior has not been tested on Windows.

## Security and persistence

Completed history and artifacts are authoritative on the backend; raw media is not stored in browser storage. The WebSocket query-string JWT should become a short-lived socket ticket, and Capacitor credentials should use native secure storage, before production.

Deferred work includes production evaluation of grounded responses, stronger semantic manual embeddings, cloud deployment, and production observability.
