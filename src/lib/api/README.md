# Frontend API boundary

Backend payloads belong in `dto/`. Adapter functions convert those DTOs into the
existing domain and presentation types before data reaches a route component.
`DiagnosticArtifact` retains normalized evidence and the raw response for later
fusion while screens continue rendering `AnalysisFinding` and `FusionResult`.

Capability switches are independent. Image diagnostics use the real shared
backend; audio, video, live audio, fusion, auth, vehicles, conversations, and
history remain mocked. Set `VITE_API_BASE_URL` to the shared backend origin.

## Future server state

TanStack Query should own vehicle lists, diagnostic history, conversation/session
loading, and manual/RAG lookups. Active diagnostic capture and realtime stream
state should remain in Context or component-local state.

## Intentional compatibility bypasses

Garage edits still dispatch directly to the local store instead of calling
`updateVehicle`. History screens still read persisted Context state instead of
`listSessions`/`getSession`. These remain unchanged to avoid a premature server
state migration.
