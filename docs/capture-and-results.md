# Capture and reconstruction

`/inspect` accepts video (100 MB maximum), ordered overlapping photos (3–96 JPG/PNG/WebP, 10 MB each, 80 MB total), or an 8–30 second camera recording. `/missions/:id` shows actual engine GLB, floor-plan PNG, mental-map PNG, object evidence and downloadable JSON/ZIP artifacts. Processing happens after capture; this is not streaming reconstruction.

The Node service calls the configured Hugging Face Space `/map` endpoint and persists its real bundle and metadata to private Supabase Storage. Image uploads use the same engine pipeline as video. No generated illustrative image is substituted for a reconstruction. Existing inspection comparison calls `/compare`; the Space must have that endpoint deployed.

Run `npm run dev` with the client and server environment files configured. The Vite `/api` proxy targets port 3000. Production must route `/api` to the Node service (or set `VITE_API_URL` to its reachable HTTPS URL), support SPA route fallback, and allow the frontend origin in `CLIENT_URL`.

Phone pairing requires a phone-accessible HTTPS deployment. It creates a 30-minute QR capture link with separate capture/viewer capabilities; only their hashes are stored. The phone records without audio and submits once. The desktop follows the submitted mission to its result page. Keep QR links private. The duplicate-submission guard assumes one Node process; multi-instance deployments need an atomic database claim. Jobs currently run in the server process, so use a persistent Node service; durable jobs and account ownership are still needed for production scale. Mission IDs are access capabilities, not account authorization.

Download the floor plan and mental map from the completed result to use on the landing page. Publishing them is a separate deliberate step because they expose the captured space. The two supplied WhatsApp videos have not been uploaded or processed; uploading them to the external Space awaits permission. No GPU job is started by build or tests.
