---
description: Set up voice transcription for the Telegram plugin — checks dependencies, creates the transcription script, and configures the environment
allowed-tools: [Bash, Read, Write, Edit]
---

Help the user set up voice transcription for the Claude Code Telegram plugin. Follow these steps:

## Step 1: Check what's available

Run these checks and report the results:

```bash
which whisper 2>/dev/null && echo "whisper: FOUND" || echo "whisper: NOT FOUND"
which faster-whisper 2>/dev/null && echo "faster-whisper: FOUND" || echo "faster-whisper: NOT FOUND"
pip3 list 2>/dev/null | grep -i whisper || true
```

Also check if VOICE_TRANSCRIBE_CMD is already configured:
```bash
grep VOICE_TRANSCRIBE_CMD ~/.claude/channels/telegram/.env 2>/dev/null || echo "NOT CONFIGURED"
```

## Step 2: Based on what's found, do one of these

**If whisper or faster-whisper is installed**: tell the user it's already there and proceed to Step 3.

**If nothing is installed**: ask the user which option they prefer:
- **Option A**: Local Whisper (free, private, needs ~1GB disk for the model) — `pip install openai-whisper`
- **Option B**: faster-whisper (faster, less RAM) — `pip install faster-whisper`
- **Option C**: OpenAI API (no local install, but costs money and needs API key)
- **Option D**: They already have their own transcription tool — ask for the command

Wait for the user's choice, then help them install if needed.

## Step 3: Create the transcription script

Create `~/.claude/channels/telegram/transcribe.sh` based on the chosen tool. Make it executable with `chmod +x`.

For Whisper:
```bash
#!/bin/bash
whisper "$1" --model small --language ru --output_format txt --output_dir /tmp 2>/dev/null
cat "/tmp/$(basename "${1%.*}").txt"
rm -f "/tmp/$(basename "${1%.*}").txt"
```

For faster-whisper:
```bash
#!/bin/bash
faster-whisper "$1" --model small --language ru 2>/dev/null | grep -v '^\['
```

For OpenAI API:
```bash
#!/bin/bash
curl -s https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@$1" -F model="whisper-1" | jq -r .text
```

Ask the user what language they primarily speak (default: ru) and adjust the --language flag.

## Step 4: Configure the environment

Add `VOICE_TRANSCRIBE_CMD=~/.claude/channels/telegram/transcribe.sh` to `~/.claude/channels/telegram/.env`. Don't overwrite existing lines — append.

## Step 5: Verify

Run a quick test — download any small .ogg file or create a silent one, and run the transcription script on it to make sure it doesn't error out.

Tell the user to restart Claude Code for changes to take effect.
