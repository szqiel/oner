import JSZip from 'jszip';

export interface FileMap {
  [filename: string]: string;
}

/**
 * Parse files from the shared context.
 * Tries `context.files` first (multi-file Kuli output),
 * then falls back to auto-splitting `context.html`.
 */
export function parseFilesFromContext(context?: {
  files?: FileMap;
  html?: string;
}): FileMap {
  if (!context) return {};
  if (context.files && Object.keys(context.files).length > 0) {
    return context.files;
  }
  if (context.html) {
    return splitHtmlIntoFiles(context.html);
  }
  return {};
}

/**
 * Split a single HTML string into separate virtual files
 * by extracting <style> and <script> blocks.
 */
export function splitHtmlIntoFiles(html: string): FileMap {
  const files: FileMap = {};
  let cleanedHtml = html;

  // Extract all <style> blocks
  const styleBlocks: string[] = [];
  cleanedHtml = cleanedHtml.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (_match, content) => {
      styleBlocks.push(content.trim());
      return '<link rel="stylesheet" href="style.css">';
    }
  );

  // Extract all <script> blocks (non-src ones only)
  const scriptBlocks: string[] = [];
  cleanedHtml = cleanedHtml.replace(
    /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi,
    (_match, content) => {
      if (content.trim()) {
        scriptBlocks.push(content.trim());
        return '<script src="script.js"></script>';
      }
      return '';
    }
  );

  // Deduplicate link/script references
  const seenLink = new Set<string>();
  cleanedHtml = cleanedHtml.replace(
    /<link rel="stylesheet" href="style\.css">/g,
    (match) => {
      if (seenLink.has('style.css')) return '';
      seenLink.add('style.css');
      return match;
    }
  );
  const seenScript = new Set<string>();
  cleanedHtml = cleanedHtml.replace(
    /<script src="script\.js"><\/script>/g,
    (match) => {
      if (seenScript.has('script.js')) return '';
      seenScript.add('script.js');
      return match;
    }
  );

  files['index.html'] = cleanedHtml.trim();

  if (styleBlocks.length > 0) {
    files['style.css'] = styleBlocks.join('\n\n');
  }

  if (scriptBlocks.length > 0) {
    files['script.js'] = scriptBlocks.join('\n\n');
  }

  return files;
}

/**
 * Reassemble separate files back into a single HTML string for iframe preview.
 */
export function reassembleHtml(files: FileMap): string {
  let html = files['index.html'] || '';

  if (files['style.css']) {
    html = html.replace(
      /<link rel="stylesheet" href="style\.css">/,
      `<style>\n${files['style.css']}\n</style>`
    );
  }

  if (files['script.js']) {
    html = html.replace(
      /<script src="script\.js"><\/script>/,
      `<script>\n${files['script.js']}\n</script>`
    );
  }

  return html;
}

/**
 * Bundle all files into a ZIP and trigger browser download.
 */
export async function downloadAsZip(files: FileMap, zipName = 'oner-project.zip') {
  const zip = new JSZip();
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get the file extension for icon display.
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get file icon color based on extension.
 */
export function getFileIconColor(filename: string): string {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'html': return '#e34f26';
    case 'css': return '#1572b6';
    case 'js': return '#f7df1e';
    case 'ts': return '#3178c6';
    case 'json': return '#6d6d6d';
    default: return '#9ca3af';
  }
}
