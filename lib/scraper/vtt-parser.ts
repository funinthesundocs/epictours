/**
 * Parse WebVTT subtitle files from yt-dlp --write-auto-sub.
 * Strips timestamps, removes duplicate lines (yt-dlp auto-subs repeat text
 * across overlapping cue windows), and returns clean plain text.
 */
export function parseVTT(vttContent: string): string {
  const lines = vttContent.split('\n');
  const textLines: string[] = [];
  let prevLine = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip WEBVTT header
    if (line === 'WEBVTT' || line.startsWith('Kind:') || line.startsWith('Language:')) continue;

    // Skip NOTE blocks
    if (line.startsWith('NOTE')) continue;

    // Skip empty lines
    if (!line) continue;

    // Skip timestamp lines (e.g., "00:00:01.000 --> 00:00:04.000")
    if (/^\d{2}:\d{2}[:.]\d{2}[.,]\d{3}\s*-->/.test(line)) continue;

    // Skip cue identifiers (numeric lines that precede timestamps)
    if (/^\d+$/.test(line)) continue;

    // Strip HTML-like tags from auto-subs (e.g., <c>, </c>, <00:00:01.000>)
    const cleaned = line
      .replace(/<\/?[^>]+>/g, '')  // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();

    if (!cleaned) continue;

    // Deduplicate: yt-dlp auto-subs often repeat the same line across cues
    if (cleaned === prevLine) continue;

    // Also skip if this line is a substring of the previous (partial repeats)
    if (prevLine && prevLine.includes(cleaned)) continue;

    textLines.push(cleaned);
    prevLine = cleaned;
  }

  return textLines.join('\n');
}

/**
 * Parse VTT into timestamped segments for a searchable transcript viewer.
 * Returns array of { start, end, text } objects.
 */
export function parseVTTWithTimestamps(vttContent: string): { start: number; end: number; text: string }[] {
  const lines = vttContent.split('\n');
  const segments: { start: number; end: number; text: string }[] = [];
  let currentStart = 0;
  let currentEnd = 0;
  let currentText: string[] = [];
  let prevText = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Match timestamp line
    const timeMatch = line.match(
      /^(\d{2}):(\d{2})[:.:](\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2})[:.:](\d{2})[.,](\d{3})/
    );

    if (timeMatch) {
      // Save previous segment
      if (currentText.length > 0) {
        const text = currentText.join(' ').trim();
        if (text && text !== prevText) {
          segments.push({ start: currentStart, end: currentEnd, text });
          prevText = text;
        }
      }

      // Parse new timestamps (in seconds)
      currentStart =
        parseInt(timeMatch[1]) * 3600 +
        parseInt(timeMatch[2]) * 60 +
        parseInt(timeMatch[3]) +
        parseInt(timeMatch[4]) / 1000;
      currentEnd =
        parseInt(timeMatch[5]) * 3600 +
        parseInt(timeMatch[6]) * 60 +
        parseInt(timeMatch[7]) +
        parseInt(timeMatch[8]) / 1000;
      currentText = [];
      continue;
    }

    // Skip headers, notes, cue IDs
    if (
      line === 'WEBVTT' ||
      line.startsWith('Kind:') ||
      line.startsWith('Language:') ||
      line.startsWith('NOTE') ||
      /^\d+$/.test(line) ||
      !line
    ) continue;

    // Clean and add text
    const cleaned = line
      .replace(/<\/?[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();

    if (cleaned) {
      currentText.push(cleaned);
    }
  }

  // Don't forget last segment
  if (currentText.length > 0) {
    const text = currentText.join(' ').trim();
    if (text && text !== prevText) {
      segments.push({ start: currentStart, end: currentEnd, text });
    }
  }

  return segments;
}
