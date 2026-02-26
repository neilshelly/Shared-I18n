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

function flattenKeys(obj: any, prefix = ''): LocaleData {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(`Invalid structure: Expected object, got ${typeof obj}`);
  }

  return Object.keys(obj).reduce((acc: LocaleData, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenKeys(obj[k], pre + k));
    } else if (typeof obj[k] === 'string') {
      acc[pre + k] = obj[k];
    } else {
      throw new Error(`Key "${pre + k}" has non-string value (found ${typeof obj[k]})`);
    }
    return acc;
  }, {});
}

function getStructure(obj: any): any {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    const result: any = {};
    for (const key of Object.keys(obj).sort()) {
      result[key] = getStructure(obj[key]);
    }
    return result;
  }
  return true;
}

function validateStructure(data: unknown, filename: string): { flattened: LocaleData, raw: any } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${filename}: Must be a nested object structure`);
  }
  
  const flattened = flattenKeys(data);
  
  for (const [key, value] of Object.entries(flattened)) {
    extractPlaceholders(value);
  }
  
  return { flattened, raw: data };
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
  
  const locales: Map<string, { flattened: LocaleData, raw: any }> = new Map();
  
  for (const file of localeFiles) {
    const filePath = join(basePath, file);
    const content = await readFile(filePath, 'utf-8');
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new Error(`${file}: Invalid JSON - ${err instanceof Error ? err.message : String(err)}`);
    }
    
    try {
      const validated = validateStructure(parsed, file);
      locales.set(file, validated);
    } catch (err) {
      throw new Error(`${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  const canonical = locales.get('en.json')!;
  const canonicalKeys = new Set(Object.keys(canonical.flattened));
  const canonicalStructure = JSON.stringify(getStructure(canonical.raw));
  
  for (const [file, data] of locales.entries()) {
    if (file === 'en.json') continue;
    
    const localeKeys = new Set(Object.keys(data.flattened));
    
    const missing = [...canonicalKeys].filter(k => !localeKeys.has(k));
    if (missing.length > 0) {
      throw new Error(`${file}: Missing keys compared to canonical: ${missing.join(', ')}`);
    }
    
    const extra = [...localeKeys].filter(k => !canonicalKeys.has(k));
    if (extra.length > 0) {
      throw new Error(`${file}: Extra keys not in canonical: ${extra.join(', ')}`);
    }
    
    const localeStructure = JSON.stringify(getStructure(data.raw));
    if (localeStructure !== canonicalStructure) {
      throw new Error(`${file}: Nesting shape mismatch compared to canonical en.json`);
    }
    
    for (const key of canonicalKeys) {
      const canonicalValue = canonical.flattened[key];
      const localeValue = data.flattened[key];
      
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
