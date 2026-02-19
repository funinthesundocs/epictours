#!/usr/bin/env node
/**
 * Claude Haiku 4.5 CLI
 *
 * IMPORTANT: This script is hardcoded to claude-haiku-4-5 ONLY.
 * It will NEVER call Sonnet, Opus, or any other Anthropic model.
 * The ANTHROPIC_API_KEY in .env.local is for Haiku use only.
 *
 * Usage:
 *   node scripts/haiku-cli.js "<prompt>" [--verbose]
 *
 * IMPORTANT FACTS (learned from real integration failures):
 *   - Model:   claude-haiku-4-5  (NOT claude-3-5-haiku-20241022 — that ID returns 404)
 *   - Auth:    x-api-key header  (NOT Authorization: Bearer — that's OpenAI format)
 *   - Version: anthropic-version: 2023-06-01 header is required
 *   - Format:  response is data.content[] array of blocks, NOT data.choices[0].message.content
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Hardcoded model — DO NOT CHANGE ──────────────────────────────────────────
const MODEL = 'claude-haiku-4-5';
const ENDPOINT_HOSTNAME = 'api.anthropic.com';
const ENDPOINT_PATH = '/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 4096;

// ── Auto-load .env.local ──────────────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('ANTHROPIC_API_KEY=')) {
                process.env.ANTHROPIC_API_KEY = trimmed.slice('ANTHROPIC_API_KEY='.length).trim();
                break;
            }
        }
    }
}

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.error('Usage: node scripts/haiku-cli.js "<prompt>" [--verbose]');
    console.error(`Model: ${MODEL} (fixed)`);
    process.exit(1);
}

const verbose = args.includes('--verbose');
const prompt = args.filter(a => a !== '--verbose')[0];

// ── Validate API key ──────────────────────────────────────────────────────────
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY is not set.');
    console.error('Add it to .env.local as: ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
}

// ── Build request ─────────────────────────────────────────────────────────────
const body = JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: 'You are a helpful AI assistant.',
    messages: [
        { role: 'user', content: prompt },
    ],
});

const options = {
    hostname: ENDPOINT_HOSTNAME,
    path: ENDPOINT_PATH,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Length': Buffer.byteLength(body),
    },
};

// ── Execute request ───────────────────────────────────────────────────────────
const req = https.request(options, (res) => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();

        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`Anthropic API error ${res.statusCode}:`);
            try {
                console.error(JSON.stringify(JSON.parse(raw), null, 2));
            } catch {
                console.error(raw);
            }
            process.exit(1);
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            console.error('Failed to parse response:', raw);
            process.exit(1);
        }

        // Anthropic Messages API returns content as an array of typed blocks.
        // NOT the same as OpenAI's choices[0].message.content.
        const content = data?.content
            ?.filter(b => b.type === 'text')
            ?.map(b => b.text)
            ?.join('\n') ?? '';

        if (verbose) {
            console.error(`[Model: ${data.model} | Input: ${data.usage?.input_tokens} | Output: ${data.usage?.output_tokens} tokens]`);
        }
        console.log(content);
    });
});

req.on('error', (err) => {
    console.error('Request failed:', err.message);
    process.exit(1);
});

req.write(body);
req.end();
