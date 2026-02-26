import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface LocaleData {
  [key: string]: string;
}

function extractPlaceholders(value: string): Set<string> {
  const placeholders = new Set<string>();
  const regex = /\{\{(\w+)\}\}/g;
  let match;
  
  while ((match = regex.exec(value)) !== null) {
    placeholders.add(match[1]);
  }
  
  const openCount = (value.match(/\{\{/g) || []).length;
  const closeCount = (value.match(/\}\}/g) || []).length;
  
  if (openCount !== closeCount) {
    throw new Error(`Malformed placeholder in value: "${value}"`);
  }
  
  if (openCount > 0 && placeholders.size !== openCount) {
    throw new Error(`Malformed placeholder in value: "${value}"`);
  }
  
  return placeholders;
}

function validateStructure(data: unknown, filename: string): LocaleData {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${filename}: Must be a flat key:string object`);
  }
  
  const result: LocaleData = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') {
      throw new Error(`${filename}: Key "${key}" has non-string value (found ${typeof value})`);
    }
    extractPlaceholders(value);
    result[key] = value;
  }
  
  return result;
}

export async function validateLocales(basePath: string = 'src/locales'): Promise<void> {
  const files = await readdir(basePath);
  const localeFiles = files.filter(f => f.endsWith('.json'));
  
  if (localeFiles.length === 0) {
    throw new Error('No locale files found');
  }
  
  if (!localeFiles.includes('en.json')) {
    throw new Error('Canonical locale file en.json not found');
  }
  
  const locales: Map<string, LocaleData> = new Map();
  
  for (const file of localeFiles) {
    const filePath = join(basePath, file);
    const content = await readFile(filePath, 'utf-8');
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new Error(`${file}: Invalid JSON - ${err instanceof Error ? err.message : String(err)}`);
    }
    
    const validated = validateStructure(parsed, file);
    locales.set(file, validated);
  }
  
  const canonical = locales.get('en.json')!;
  const canonicalKeys = new Set(Object.keys(canonical));
  
  for (const [file, data] of locales.entries()) {
    if (file === 'en.json') continue;
    
    const localeKeys = new Set(Object.keys(data));
    
    const missing = [...canonicalKeys].filter(k => !localeKeys.has(k));
    if (missing.length > 0) {
      throw new Error(`${file}: Missing keys compared to canonical: ${missing.join(', ')}`);
    }
    
    const extra = [...localeKeys].filter(k => !canonicalKeys.has(k));
    if (extra.length > 0) {
      throw new Error(`${file}: Extra keys not in canonical: ${extra.join(', ')}`);
    }
    
    for (const key of canonicalKeys) {
      const canonicalValue = canonical[key];
      const localeValue = data[key];
      
      const canonicalPlaceholders = extractPlaceholders(canonicalValue);
      const localePlaceholders = extractPlaceholders(localeValue);
      
      const missingPlaceholders = [...canonicalPlaceholders].filter(p => !localePlaceholders.has(p));
      if (missingPlaceholders.length > 0) {
        throw new Error(`${file}: Key "${key}" missing placeholders: ${missingPlaceholders.join(', ')}`);
      }
      
      const extraPlaceholders = [...localePlaceholders].filter(p => !canonicalPlaceholders.has(p));
      if (extraPlaceholders.length > 0) {
        throw new Error(`${file}: Key "${key}" has extra placeholders: ${extraPlaceholders.join(', ')}`);
      }
    }
  }
  
  console.log(`✓ Validated ${locales.size} locale file(s)`);
  console.log(`✓ All locales have ${canonicalKeys.size} keys matching canonical`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateLocales().catch((err) => {
    console.error('Validation failed:', err.message);
    process.exit(1);
  });
}
