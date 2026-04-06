---
name: voice-transcription
description: Automatically transcribe Telegram voice messages. Activates when an inbound Telegram message has attachment_kind="voice". Downloads the voice file and transcribes it so the user's spoken words are understood.
---

When you receive a Telegram message with `attachment_kind="voice"` in the `<channel>` tag:

1. **Download the voice file** using the Telegram plugin's `download_attachment` tool — pass the `attachment_file_id` from the message metadata.
2. **Transcribe the file** by running the transcription script via Bash:
   ```
   $VOICE_TRANSCRIBE_CMD <file_path>
   ```
   The script path is stored in `VOICE_TRANSCRIBE_CMD` environment variable, or defaults to `~/.claude/channels/telegram/transcribe.sh`. The script accepts an audio file path as its argument and prints the transcription to stdout.
3. **Treat the transcription as the user's message** — respond to the transcribed text as if the user had typed it.

Do this automatically without asking the user. If transcription fails, let the user know and ask them to resend as text.
