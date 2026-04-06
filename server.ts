#!/usr/bin/env bun
/**
 * Voice transcription MCP server for Claude Code.
 *
 * Provides a single tool — `transcribe` — that runs a user-supplied command
 * on an audio file and returns the transcription text.
 *
 * Configure via environment variable:
 *   VOICE_TRANSCRIBE_CMD — path to a script/command that accepts an audio file
 *                          path as its single argument and prints text to stdout.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { execFileSync } from 'child_process'
import { existsSync } from 'fs'

const VOICE_CMD = process.env.VOICE_TRANSCRIBE_CMD ?? ''

if (!VOICE_CMD) {
  process.stderr.write(
    `voice-transcription: VOICE_TRANSCRIBE_CMD is not set.\n` +
    `  Set it in your shell or in ~/.claude/channels/telegram/.env\n` +
    `  Example: VOICE_TRANSCRIBE_CMD=/path/to/transcribe.sh\n`,
  )
}

const mcp = new Server(
  { name: 'voice-transcription', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'transcribe',
      description:
        'Transcribe an audio file to text using the user-configured transcription command ' +
        '(VOICE_TRANSCRIBE_CMD). Pass the absolute path to the audio file. ' +
        'Returns the transcription text or an error message.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute path to the audio file to transcribe',
          },
        },
        required: ['file_path'],
      },
    },
  ],
}))

mcp.setRequestHandler(CallToolRequestSchema, async req => {
  if (req.params.name !== 'transcribe') {
    return { content: [{ type: 'text', text: `Unknown tool: ${req.params.name}` }], isError: true }
  }

  const filePath = req.params.arguments?.file_path as string | undefined
  if (!filePath) {
    return { content: [{ type: 'text', text: 'file_path is required' }], isError: true }
  }

  if (!VOICE_CMD) {
    return {
      content: [{
        type: 'text',
        text: 'VOICE_TRANSCRIBE_CMD is not configured. Set it to a command that accepts an audio file path and prints transcription to stdout.',
      }],
      isError: true,
    }
  }

  if (!existsSync(filePath)) {
    return { content: [{ type: 'text', text: `File not found: ${filePath}` }], isError: true }
  }

  try {
    const result = execFileSync(VOICE_CMD, [filePath], {
      timeout: 120_000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const text = result.trim()
    if (!text) {
      return { content: [{ type: 'text', text: '(empty transcription — no speech detected)' }] }
    }
    return { content: [{ type: 'text', text }] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`voice-transcription: transcription failed: ${msg}\n`)
    return { content: [{ type: 'text', text: `Transcription failed: ${msg}` }], isError: true }
  }
})

const transport = new StdioServerTransport()
void mcp.connect(transport)
