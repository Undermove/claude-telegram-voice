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
- A transcription tool of your choice (see examples below)

## Quick start (4 steps)

```
/plugin marketplace add Undermove/claude-telegram-voice
/plugin install claude-telegram-voice
/claude-telegram-voice:setup
```

Then restart Claude Code — done! The setup command will check your system, help install a transcription tool if needed, and configure everything automatically.

## Alternative installation

### From official marketplace (when available)

```
/plugin install claude-telegram-voice
```

### Local / development

```bash
git clone https://github.com/Undermove/claude-telegram-voice.git
claude --plugin-dir ./claude-telegram-voice --channels plugin:telegram@claude-plugins-official
```

### Manual setup

#### 1. Create a transcription script

The plugin calls your script with one argument — the path to an `.ogg` audio file. Your script must print the transcription to stdout.

**Example: Local Whisper**

```bash
#!/bin/bash
# transcribe.sh
whisper "$1" --model small --language ru --output_format txt --output_dir /tmp 2>/dev/null
cat "/tmp/$(basename "${1%.*}").txt"
rm -f "/tmp/$(basename "${1%.*}").txt"
```

Install Whisper: `pip install openai-whisper`

**Example: faster-whisper**

```bash
#!/bin/bash
# transcribe.sh
faster-whisper "$1" --model small --language ru 2>/dev/null | grep -v '^\['
```

Install: `pip install faster-whisper`

**Example: OpenAI API**

```bash
#!/bin/bash
# transcribe.sh
curl -s https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@$1" -F model="whisper-1" | jq -r .text
```

#### 2. Make the script executable

```bash
chmod +x /path/to/transcribe.sh
```

#### 3. Configure the environment variable

Add to `~/.claude/channels/telegram/.env`:

```
VOICE_TRANSCRIBE_CMD=/path/to/transcribe.sh
```

Or set it in your shell before launching Claude Code.

#### 4. Launch Claude Code

```bash
claude --channels plugin:telegram@claude-plugins-official
```

Send a voice message — Claude will automatically transcribe and respond to it.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `VOICE_TRANSCRIBE_CMD` | Yes | Path to a script that accepts an audio file path and prints transcription to stdout |

Any tool works — as long as it reads the audio file and prints text to stdout. If the script fails, Claude will let the user know and ask them to resend as text.

## Plugin structure

```
claude-telegram-voice/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
│   └── marketplace.json     # Marketplace config
├── commands/
│   └── setup.md             # /claude-telegram-voice:setup command
├── skills/
│   └── voice-transcription/
│       └── SKILL.md         # Auto-trigger skill
├── README.md
└── LICENSE
```

## License

MIT
