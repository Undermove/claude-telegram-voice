---
name: voice-transcription
description: Automatically transcribe Telegram voice messages. Activates when an inbound Telegram message has attachment_kind="voice". Downloads the voice file and transcribes it so the user's spoken words are understood.
---

When you receive a Telegram message with `attachment_kind="voice"` in the `<channel>` tag:

1. **Download the voice file** using the Telegram plugin's `download_attachment` tool — pass the `attachment_file_id` from the message metadata.
2. **Transcribe the file** using the `transcribe` tool from the `voice-transcription` MCP server — pass the file path returned by `download_attachment`.
3. **Treat the transcription as the user's message** — respond to the transcribed text as if the user had typed it.

Do this automatically without asking the user. If transcription fails, let the user know and ask them to resend as text.
