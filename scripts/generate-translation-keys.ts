import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

async function generateTranslationKeys(): Promise<void> {
  const canonicalPath = 'src/locales/en.json';
  const outputPath = 'src/generated/translation-keys.ts';
  
  const content = await readFile(canonicalPath, 'utf-8');
  const data = JSON.parse(content);
  
  const keys = Object.keys(data).sort();
  
  const typeUnion = keys.map(k => `  | '${k}'`).join('\n');
  const arrayContent = keys.map(k => `  '${k}'`).join(',\n');
  
  const output = `export type TranslationKey =
${typeUnion};

export const translationKeys = [
${arrayContent}
] as const satisfies readonly TranslationKey[];
`;
  
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf-8');
  
  console.log(`✓ Generated translation keys: ${keys.length} keys`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateTranslationKeys().catch((err) => {
    console.error('Generation failed:', err.message);
    process.exit(1);
  });
}
