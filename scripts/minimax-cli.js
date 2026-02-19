#!/usr/bin/env node
/**
 * Minimax M2.5 CLI
 *
 * Usage:
 *   node scripts/minimax-cli.js "<prompt>" [--verbose]
 *
 * Examples:
 *   node scripts/minimax-cli.js "Summarize this in one sentence"
 *   node scripts/minimax-cli.js "Explain this code" --verbose
 *
 * Environment:
 *   MINIMAX_API_KEY  - Required. Store in .env.local as: MINIMAX_API_KEY=sk-cp-...
 *
 * IMPORTANT FACTS (learned from real integration failures):
 *   - Endpoint: api.minimax.io (NOT api.minimaxi.chat)
 *   - Model:    MiniMax-M2.5 (NOT abab6.5, NOT abab6.5-chat)
 *   - Key type: sk-cp- prefix = Coding Plan = text models only (correct)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Hardcoded — do not change ──────────────────────────────────────────────
const MODEL = 'MiniMax-M2.5';
const ENDPOINT_HOSTNAME = 'api.minimax.io';
const ENDPOINT_PATH = '/v1/chat/completions';

// ── Auto-load .env.local ───────────────────────────────────────────────────
if (!process.env.MINIMAX_API_KEY) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('MINIMAX_API_KEY=')) {
                process.env.MINIMAX_API_KEY = trimmed.slice('MINIMAX_API_KEY='.length).trim();
                break;
            }
        }
    }
}

// ── Parse args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.error('Usage: node scripts/minimax-cli.js "<prompt>" [--verbose]');
    console.error(`Model: ${MODEL} (fixed)`);
    process.exit(1);
}

const verbose = args.includes('--verbose');
const prompt = args.filter(a => a !== '--verbose')[0];

// ── Validate key ───────────────────────────────────────────────────────────
const apiKey = process.env.MINIMAX_API_KEY;
if (!apiKey) {
    console.error('Error: MINIMAX_API_KEY is not set.');
    console.error('Add it to .env.local as: MINIMAX_API_KEY=sk-cp-...');
    process.exit(1);
}

// ── Build request ──────────────────────────────────────────────────────────
const body = JSON.stringify({
    model: MODEL,
    messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: prompt },
    ],
    stream: false,
});

const options = {
    hostname: ENDPOINT_HOSTNAME,
    path: ENDPOINT_PATH,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
    },
};

// ── Execute ────────────────────────────────────────────────────────────────
const req = https.request(options, (res) => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();

        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`Minimax API error ${res.statusCode}:`);
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

        // Minimax uses OpenAI-compatible format
        const content = data?.choices?.[0]?.message?.content ?? '';

        if (verbose) {
            // Show raw content including <think> blocks
            console.log(content);
        } else {
            // Strip <think>...</think> blocks for clean output
            const clean = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            console.log(clean);
        }
    });
});

req.on('error', (err) => {
    console.error('Request failed:', err.message);
    process.exit(1);
});

req.write(body);
req.end();
