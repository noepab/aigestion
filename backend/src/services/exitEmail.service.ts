import fs from 'fs';
import path from 'path';

// Load markdown templates from the assets directory (relative to this file)
const templatesDir = path.resolve(__dirname, '../../assets/exit_templates');

/**
 * Returns a map of template names to their raw markdown content.
 * Template files should be named `<name>.md` (e.g., `formal.md`).
 */
export function getTemplates(): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(templatesDir)) {
    return result;
  }
  const files = fs.readdirSync(templatesDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const name = path.basename(file, '.md');
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
      result[name] = content;
    }
  }
  return result;
}

/**
 * Renders a template by replacing placeholders of the form `{{key}}` with values.
 * Placeholders that are not provided remain unchanged.
 */
export function renderTemplate(name: string, data: Record<string, string>): string {
  const templates = getTemplates();
  const raw = templates[name];
  if (!raw) {
    throw new Error(`Template "${name}" not found`);
  }
  let rendered = raw;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(placeholder, value);
  }
  return rendered;
}
