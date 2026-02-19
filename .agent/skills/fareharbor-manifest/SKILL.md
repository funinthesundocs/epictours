---
name: fareharbor-manifest
description: Download tomorrow's tour manifest from FareHarbor and email it to operations team with passenger count. Use when user requests daily manifest delivery, tour operations updates, or automated manifest distribution for Aloha Circle Island tours.
---

# FareHarbor Daily Manifest Email

> **New workspace?** Go to [## First-Time Setup](#first-time-setup) at the bottom to create the script files, then return here.

## Run It

**As a human (PowerShell):**
```powershell
python scripts/aci_manifest.py
```

**As an AI agent — pick your model:**
```powershell
node scripts/dispatch_minimax.js   # Cheaper ($0.0008/run)
node scripts/dispatch_haiku.js     # Faster API call ($0.0045/run)
```

Run from the project root. The script auto-calculates tomorrow's date and handles everything end-to-end.

## Dependencies (install once)

```powershell
pip install requests selenium
```

Chrome must be installed. For agent dispatch, also create `.env.local` in the project root:

```
MINIMAX_API_KEY=your-minimax-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

---

## Credentials

| Field | Value |
|-------|-------|
| FareHarbor URL | https://fareharbor.com/alohacircleisland/login |
| Username | `nikola` |
| Password | `Nikola12345!` |
| 2FA | Click **Cancel** if prompted |

## AgentMail

| Field | Value |
|-------|-------|
| Endpoint | `https://api.agentmail.to/inboxes/visupport@agentmail.to/messages/send` |
| API Key | `am_us_e8dbc7465f1b28cdb6e63866abdf44b4245a8a834b40556aee8de931cbc7e24e` |
| To | `funinthesundocs@gmail.com` |
| CC | `visupport@agentmail.to` |

---

## Critical Rules (do not deviate)

- Use `--headless=new` — old `--headless` causes "no-assets" error on FareHarbor
- Use `Page.printToPDF` CDP command — never `window.print()` or OS print dialog (causes browser reset)
- **PAX lives in `th.ng-table-header` elements** (not `td`) as `"X total"` text — use JS `innerText` query on `th` tags
- Use a JS-lambda `WebDriverWait` polling `querySelectorAll('th')` for `"X total"` — this fires exactly when FareHarbor renders, with zero wasted time
- Extract PAX **before** clicking Print — the print CSS layout removes the summary `th` rows
- The Print button does **not** open a new tab — PDF from current tab
- **Windows machine** — all paths use Windows format, never Linux/WSL (`/mnt/c/...`)
- **ASCII-safe output only** — Windows `charmap` encoding crashes on Unicode chars (e.g. `✓`). Script uses `[OK]` not `✓`. Do not introduce non-ASCII characters if modifying the script.

---

## Error Table

| Error | Cause | Fix |
|-------|-------|-----|
| "no-assets" on FareHarbor | Old headless mode | Use `--headless=new` |
| Browser connection reset | OS print dialog triggered | Use CDP `Page.printToPDF` |
| PAX = `?` | Wrong element queried | Query `th` (not `td`) — PAX lives in `th.ng-table-header` |
| Login redirect loop | 2FA not dismissed | Click Cancel on 2FA modal |
| Email 404 | Wrong inbox URL | Use `visupport@agentmail.to` not `epicagent@agentmail.to` |
| Print button not found | Text mismatch | JS find with exact text `'Print'` (not `'Print all'`) |
| `charmap` codec error | Unicode char in print() output | Keep all print() calls ASCII-only; set `PYTHONIOENCODING=utf-8` in subprocess env |

## Success Criteria

- [OK] No "no-assets" error
- [OK] PAX is a real number
- [OK] PDF is ~90KB+
- [OK] Email delivered with PDF attached

## Performance Baseline (normal = healthy)

### Dispatch scripts by model

| Model | Script | API call | Cost/run |
|-------|--------|----------|----------|
| MiniMax-M2.5 | `node scripts/dispatch_minimax.js` | ~5-6s | ~$0.0008 |
| Claude Haiku 4.5 | `node scripts/dispatch_haiku.js` | ~4s | ~$0.0045 |

### Script execution (same for all models)

| Phase | Expected | Investigate if |
|-------|----------|----------------|
| Python script | ~25-35s | >90s (stuck on WebDriverWait) |
| Total wall time | ~30-40s | >120s |

FareHarbor's WebDriverWait dominates script time — it polls `th.ng-table-header` until React renders (~15-20s in headless Chrome). Normal. Cannot be reduced without caching session cookies.

---

## First-Time Setup

Create these three files in your project. Run from the project root after creating them.

### 1. `scripts/aci_manifest.py`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ACI Daily Manifest Automation - v3
Lean: CDP printToPDF, event-based waits, minimal imports.
"""

import sys
import base64
import requests
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIG ---
FH_USERNAME = "nikola"
FH_PASSWORD = "Nikola12345!"
FH_LOGIN_URL = "https://fareharbor.com/alohacircleisland/login"

TOMORROW = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
TOMORROW_DISPLAY = (datetime.now() + timedelta(days=1)).strftime("%m-%d-%Y")
FH_MANIFEST_URL = f"https://fareharbor.com/alohacircleisland/dashboard/manifest/date/{TOMORROW}/availabilities/"

AGENTMAIL_API_URL = "https://api.agentmail.to/inboxes/visupport@agentmail.to/messages/send"
AGENTMAIL_TOKEN = "am_us_e8dbc7465f1b28cdb6e63866abdf44b4245a8a834b40556aee8de931cbc7e24e"
EMAIL_TO = "funinthesundocs@gmail.com"
EMAIL_CC = "visupport@agentmail.to"
EMAIL_SUBJECT = f"ACI Manifest for {TOMORROW_DISPLAY}"
PDF_FILENAME = f"ACI Manifest for {TOMORROW_DISPLAY}.pdf"

EMAIL_BODY = """{pax}Pax Total

Manifest is attached

Thanks Rocky! Please let me know if you have any questions

Mahalo,
Matt Campbell"""


def make_driver():
    """Chrome with anti-detection flags -- required for FareHarbor JS to load."""
    opts = Options()
    opts.add_argument("--headless=new")  # MUST be 'new' -- old headless breaks FareHarbor
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    )
    driver = webdriver.Chrome(options=opts)
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {"source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"},
    )
    return driver


def login(driver):
    print("Step 1: Logging in...")
    driver.get(FH_LOGIN_URL)
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.XPATH, "//input[@type='password']"))
    )
    try:
        user = driver.find_element(By.XPATH, "//input[@name='email']")
    except:
        user = driver.find_elements(By.XPATH, "//input[@type='text']")[0]

    user.clear()
    user.send_keys(FH_USERNAME)
    driver.find_element(By.XPATH, "//input[@type='password']").send_keys(FH_PASSWORD)
    driver.find_element(By.XPATH, "//button[@type='submit']").click()

    # Wait for redirect away from login -- no blind sleep
    WebDriverWait(driver, 15).until(lambda d: "login" not in d.current_url)

    # Dismiss 2FA if shown
    try:
        WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(translate(text(),'CANCEL','cancel'),'cancel')]")
            )
        ).click()
        print("  Dismissed 2FA.")
    except:
        pass

    print(f"  Logged in. URL: {driver.current_url}")


def navigate_to_manifest(driver):
    print(f"Step 2: Loading manifest for {TOMORROW}...")
    driver.get(FH_MANIFEST_URL)
    # PAX lives in th.ng-table-header -- poll until it appears in the DOM
    try:
        WebDriverWait(driver, 20).until(lambda d: d.execute_script("""
            return Array.from(document.querySelectorAll('th'))
                .some(el => /^\\d+\\s+total$/i.test((el.innerText || '').trim()));
        """))
    except:
        pass  # Valid if no tours tomorrow (empty manifest)
    print(f"  Loaded: {driver.current_url}")


def click_print(driver):
    """Click the Print button to apply FareHarbor's print CSS layout."""
    print("Step 3: Applying print layout...")
    btn = driver.execute_script("""
        var btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.trim() === 'Print') || null;
    """)
    if btn:
        driver.execute_script("arguments[0].click();", btn)
        print("  Print layout applied.")
    else:
        print("  Print button not found -- proceeding with default layout.")


def extract_pax(driver):
    """Sum 'X total' th.ng-table-header elements -- FareHarbor's confirmed PAX format."""
    print("Step 4: Extracting PAX count...")
    # FareHarbor stores 'X total' in th.ng-table-header (confirmed via DOM debug)
    pax = driver.execute_script("""
        var total = 0;
        Array.from(document.querySelectorAll('th')).forEach(el => {
            var t = (el.innerText || '').trim();
            if (/^\\d+\\s+total$/i.test(t)) total += parseInt(t);
        });
        return total > 0 ? total : null;
    """)
    if pax:
        print(f"  PAX: {pax}")
        return str(pax)
    print("  WARNING: PAX not found.")
    return "?"


def generate_pdf(driver):
    """CDP Page.printToPDF -- pixel-perfect, zero OS dialogs."""
    print("Step 5: Generating PDF...")
    pdf_data = driver.execute_cdp_cmd("Page.printToPDF", {
        "printBackground": True,
        "paperWidth": 8.5,
        "paperHeight": 11,
        "marginTop": 0.4,
        "marginBottom": 0.4,
        "marginLeft": 0.4,
        "marginRight": 0.4,
        "displayHeaderFooter": False,
    })
    pdf_bytes = base64.b64decode(pdf_data["data"])
    with open(PDF_FILENAME, "wb") as f:
        f.write(pdf_bytes)
    print(f"  Saved: {PDF_FILENAME} ({len(pdf_bytes):,} bytes)")
    return pdf_bytes


def send_email(pdf_bytes, pax):
    print("Step 6: Sending email...")
    resp = requests.post(
        AGENTMAIL_API_URL,
        json={
            "to": EMAIL_TO,
            "cc": EMAIL_CC,
            "subject": EMAIL_SUBJECT,
            "text": EMAIL_BODY.format(pax=pax),
            "attachments": [{
                "filename": PDF_FILENAME,
                "content": base64.b64encode(pdf_bytes).decode("utf-8"),
                "contentType": "application/pdf",
            }],
        },
        headers={"Authorization": f"Bearer {AGENTMAIL_TOKEN}"},
    )
    if resp.status_code in (200, 201, 202):
        print(f"  SUCCESS: {resp.text}")
    else:
        print(f"  ERROR {resp.status_code}: {resp.text}")
        sys.exit(1)


def main():
    print(f"{'='*50}\nACI Manifest -- {TOMORROW_DISPLAY}\n{'='*50}")
    driver = make_driver()
    try:
        login(driver)
        navigate_to_manifest(driver)
        pax = extract_pax(driver)   # Extract PAX before Print transforms the DOM
        click_print(driver)
        pdf_bytes = generate_pdf(driver)
        send_email(pdf_bytes, pax)
        print(f"\nDONE [OK]  {TOMORROW_DISPLAY} | {pax} PAX | Sent to {EMAIL_TO}")
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")
        try:
            driver.save_screenshot("aci_error.png")
        except:
            pass
        sys.exit(1)
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
```

---

### 2. `scripts/dispatch_minimax.js`

```javascript
#!/usr/bin/env node
/**
 * Dispatch: Run fareharbor-manifest skill via Minimax M2.5
 * Reads SKILL.md and aci_manifest.py, sends to Minimax as an agent task.
 * Includes timing and token cost analysis.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load API key
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

const SKILL_PATH = path.join(__dirname, '..', '.agent', 'skills', 'fareharbor-manifest', 'SKILL.md');
const SCRIPT_PATH = path.join(__dirname, 'aci_manifest.py');

const skillContent = fs.readFileSync(SKILL_PATH, 'utf8');
const scriptContent = fs.readFileSync(SCRIPT_PATH, 'utf8');

const prompt = `You are an AI agent being dispatched with a skill and a Python script to execute.

SKILL INSTRUCTIONS:
${skillContent}

THE SCRIPT (already written and ready at scripts/aci_manifest.py):
\`\`\`python
${scriptContent}
\`\`\`

YOUR TASK:
1. Confirm you understand the skill's purpose
2. Run the script by executing: python scripts/aci_manifest.py (from the project root)
3. Report back: date targeted, PAX count, email success, any errors

Execute now. The script is self-contained -- just run it.`;

const body = JSON.stringify({
    model: 'MiniMax-M2.5',
    messages: [
        { role: 'system', content: 'You are a capable AI agent. When given a skill and a script, output the shell command to run it in a powershell code block. Be direct and action-oriented.' },
        { role: 'user', content: prompt },
    ],
    stream: false,
});

// MiniMax-M2.5 pricing (confirmed Jan 2026)
const PRICE_INPUT_PER_M  = 0.30;   // $0.30 / 1M input tokens
const PRICE_OUTPUT_PER_M = 1.20;   // $1.20 / 1M output tokens

console.log('Dispatching to Minimax M2.5...\n');

const t0 = Date.now();
let tApiDone, tScriptDone;

const options = {
    hostname: 'api.minimax.io',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
    },
};

const req = https.request(options, (res) => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        tApiDone = Date.now();
        const raw = Buffer.concat(chunks).toString();
        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`API error ${res.statusCode}:`, raw);
            process.exit(1);
        }
        const data = JSON.parse(raw);
        const content = data?.choices?.[0]?.message?.content ?? '';
        const usage   = data?.usage ?? {};

        const clean = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        console.log('=== MINIMAX RESPONSE ===\n');
        console.log(clean);
        console.log('\n=== END ===\n');

        const pyMatch = clean.match(/python\s+scripts\/aci_manifest\.py/);
        const tScriptStart = Date.now();
        if (pyMatch) {
            console.log('--- Executing script as instructed by Minimax ---');
            try {
                const output = execSync('python scripts/aci_manifest.py', {
                    cwd: path.join(__dirname, '..'),
                    encoding: 'utf8',
                    timeout: 120000,
                    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
                });
                console.log(output);
            } catch (e) {
                console.error('Script error:', e.stdout || e.message);
            }
        }
        tScriptDone = Date.now();

        const apiMs    = tApiDone - t0;
        const scriptMs = tScriptDone - tScriptStart;
        const totalMs  = Date.now() - t0;
        const inputTokens  = usage.prompt_tokens     ?? 0;
        const outputTokens = usage.completion_tokens ?? 0;
        const inputCost    = (inputTokens  / 1_000_000) * PRICE_INPUT_PER_M;
        const outputCost   = (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;

        console.log('============================================================');
        console.log('  BENCHMARK REPORT -- MiniMax-M2.5');
        console.log('============================================================');
        console.log(`  API call          : ${(apiMs/1000).toFixed(2)}s`);
        console.log(`  Python script     : ${(scriptMs/1000).toFixed(2)}s`);
        console.log(`  Total wall time   : ${(totalMs/1000).toFixed(2)}s`);
        console.log('------------------------------------------------------------');
        console.log(`  Prompt tokens     : ${inputTokens.toLocaleString()}`);
        console.log(`  Completion tokens : ${outputTokens.toLocaleString()}`);
        console.log(`  TOTAL COST        : $${(inputCost+outputCost).toFixed(6)}`);
        console.log('============================================================');
    });
});

req.on('error', (err) => { console.error('Request failed:', err.message); process.exit(1); });
req.write(body);
req.end();
```

---

### 3. `scripts/dispatch_haiku.js`

```javascript
#!/usr/bin/env node
/**
 * Dispatch: Run fareharbor-manifest skill via Claude Haiku 4.5
 * Reads SKILL.md and aci_manifest.py, sends to Haiku as an agent task.
 * Includes timing and token cost analysis.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load API key from .env.local
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

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set. Add to .env.local as ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
}

const SKILL_PATH = path.join(__dirname, '..', '.agent', 'skills', 'fareharbor-manifest', 'SKILL.md');
const SCRIPT_PATH = path.join(__dirname, 'aci_manifest.py');

const skillContent = fs.readFileSync(SKILL_PATH, 'utf8');
const scriptContent = fs.readFileSync(SCRIPT_PATH, 'utf8');

const prompt = `You are an AI agent being dispatched with a skill and a Python script to execute.

SKILL INSTRUCTIONS:
${skillContent}

THE SCRIPT (already written and ready at scripts/aci_manifest.py):
\`\`\`python
${scriptContent}
\`\`\`

YOUR TASK:
1. Confirm you understand the skill's purpose in one sentence
2. Output the exact PowerShell command to run the script (from the project root)
3. Report what you expect will happen based on the skill

Be direct. Output a powershell code block containing: python scripts/aci_manifest.py`;

const body = JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: 'You are a capable AI agent. When given a skill and a script to execute, respond with a brief confirmation and the exact shell command in a powershell code block. Be terse and action-oriented.',
    messages: [{ role: 'user', content: prompt }],
});

// claude-haiku-4-5 pricing (confirmed Oct 2025)
const PRICE_INPUT_PER_M  = 1.00;   // $1.00 / 1M input tokens
const PRICE_OUTPUT_PER_M = 5.00;   // $5.00 / 1M output tokens

console.log('Dispatching to Claude Haiku 4.5...\n');

const t0 = Date.now();
let tApiDone, tScriptStart, tScriptDone;

const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
    },
};

const req = https.request(options, (res) => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        tApiDone = Date.now();
        const raw = Buffer.concat(chunks).toString();
        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`Anthropic API error ${res.statusCode}:`, raw);
            process.exit(1);
        }
        const data = JSON.parse(raw);

        const content = data?.content
            ?.filter(b => b.type === 'text')
            ?.map(b => b.text)
            ?.join('\n') ?? '';
        const usage = data?.usage ?? {};

        console.log('=== HAIKU RESPONSE ===\n');
        console.log(content);
        console.log('\n=== END ===\n');

        const pyMatch = content.match(/python\s+scripts\/aci_manifest\.py/);
        tScriptStart = Date.now();
        if (pyMatch) {
            console.log('--- Executing script as instructed by Haiku ---');
            try {
                const output = execSync('python scripts/aci_manifest.py', {
                    cwd: path.join(__dirname, '..'),
                    encoding: 'utf8',
                    timeout: 120000,
                    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
                });
                console.log(output);
            } catch (e) {
                console.error('Script error:', e.stdout || e.message);
            }
        } else {
            console.log('[!] Haiku did not output a python run command -- check response above.');
        }
        tScriptDone = Date.now();

        const apiMs    = tApiDone - t0;
        const scriptMs = tScriptDone - tScriptStart;
        const totalMs  = Date.now() - t0;
        const inputTokens  = usage.input_tokens  ?? 0;
        const outputTokens = usage.output_tokens ?? 0;
        const inputCost    = (inputTokens  / 1_000_000) * PRICE_INPUT_PER_M;
        const outputCost   = (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;

        console.log('============================================================');
        console.log('  BENCHMARK REPORT -- Claude Haiku 4.5');
        console.log('============================================================');
        console.log(`  Model             : ${data.model}`);
        console.log(`  API call          : ${(apiMs/1000).toFixed(2)}s`);
        console.log(`  Python script     : ${pyMatch ? (scriptMs/1000).toFixed(2)+'s' : 'N/A'}`);
        console.log(`  Total wall time   : ${(totalMs/1000).toFixed(2)}s`);
        console.log('------------------------------------------------------------');
        console.log(`  Input tokens      : ${inputTokens.toLocaleString()}`);
        console.log(`  Output tokens     : ${outputTokens.toLocaleString()}`);
        console.log(`  TOTAL COST        : $${(inputCost+outputCost).toFixed(6)}`);
        console.log('============================================================');
    });
});

req.on('error', (err) => { console.error('Request failed:', err.message); process.exit(1); });
req.write(body);
req.end();
```
