# claude-telegram-voice

Claude Code plugin that automatically transcribes Telegram voice messages so Claude can understand what you said.

Works with any transcription tool — [OpenAI Whisper](https://github.com/openai/whisper), [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [whisper.cpp](https://github.com/ggerganov/whisper.cpp), OpenAI API, or any custom script.

## How it works

1. You send a voice message to your Telegram bot
2. The Telegram plugin delivers the message to Claude with a file reference
3. This plugin's skill tells Claude to automatically download and transcribe it
4. Claude receives the spoken text and responds normally

No modifications to the official Telegram plugin required.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with the [Telegram plugin](https://github.com/anthropics/claude-plugins-official) installed
- [Bun](https://bun.sh) runtime
- A transcription tool of your choice (see examples below)

## Installation

### 1. Install the plugin

In Claude Code:

```
/plugin install claude-telegram-voice@custom
```

Or manually clone to `~/.claude/plugins/claude-telegram-voice` and add to `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "claude-telegram-voice@custom": true
  }
}
```

### 2. Create a transcription script

The plugin calls your script with one argument — the path to an `.ogg` audio file. Your script must print the transcription to stdout.

**Example: Local Whisper**

```bash
#!/bin/bash
# transcribe.sh — uses OpenAI Whisper locally
whisper "$1" --model small --language ru --output_format txt --output_dir /tmp 2>/dev/null
cat "/tmp/$(basename "${1%.*}").txt"
rm -f "/tmp/$(basename "${1%.*}").txt"
```

Install Whisper: `pip install openai-whisper`

**Example: faster-whisper**

```bash
#!/bin/bash
# transcribe.sh — uses faster-whisper (GPU-accelerated)
faster-whisper "$1" --model small --language ru 2>/dev/null | grep -v '^\[' 
```

Install: `pip install faster-whisper`

**Example: OpenAI API**

```bash
#!/bin/bash
# transcribe.sh — uses OpenAI Whisper API (no local GPU needed)
curl -s https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@$1" -F model="whisper-1" | jq -r .text
```

Make the script executable:

```bash
chmod +x /path/to/transcribe.sh
```

### 3. Configure the environment variable

Add to `~/.claude/channels/telegram/.env`:

```
VOICE_TRANSCRIBE_CMD=/path/to/transcribe.sh
```

Or set it in your shell before launching Claude Code.

### 4. Restart Claude Code

```bash
claude --channels plugin:telegram@claude-plugins-official
```

Send a voice message — Claude will automatically transcribe and respond to it.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `VOICE_TRANSCRIBE_CMD` | Yes | Path to a script that accepts an audio file path as an argument and prints transcription to stdout |

The transcription command has a 2-minute timeout. If it fails, Claude will let you know and ask you to resend as text.

## How it differs from patching the Telegram plugin

This plugin works **alongside** the official Telegram plugin without modifying it:

- The Telegram plugin delivers voice messages with a `file_id`
- This plugin adds a **skill** that tells Claude to download and transcribe voice messages automatically
- This plugin adds a **transcribe tool** (MCP server) that runs your transcription command

This means updates to the official Telegram plugin won't break anything.

## License

MIT
