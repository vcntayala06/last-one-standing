# Isolated AssemblyAI streaming voice lab

This laboratory is separate from Last One Standing Build 6.24. It does not load or modify the production game or its voice system.

## Configure

Create an AssemblyAI account, copy the development API key from its dashboard, and add this server-only line to the existing ignored `.env` file:

```text
ASSEMBLYAI_API_KEY=your_key_here
```

Never add the key to the HTML, browser JavaScript, or a committed file. The local server exchanges it for a short-lived, single-session streaming token; only that temporary token reaches Safari.

## Run locally

```powershell
npm run start:voice-stream
```

Open:

```text
http://localhost:8081/voice-stream-test.html
```

## Expose securely to an iPhone

With the streaming server still running, open another terminal:

```powershell
cloudflared tunnel --url http://localhost:8081
```

Open the generated `https://...trycloudflare.com/voice-stream-test.html` URL in iPhone Safari. The temporary tunnel URL changes when the command restarts.

## What is measured

The page reports button-to-microphone, button-to-WebSocket, audio-to-partial, provider-speech-start-to-partial, partial-to-final, and audio-to-final timing. It transcribes only; it does not evaluate answers or affect game state.
