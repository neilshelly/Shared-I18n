import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';

function flattenKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).reduce((acc: string[], k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      acc.push(...flattenKeys(obj[k], pre + k));
    } else {
      acc.push(pre + k);
    }
    return acc;
  }, []);
}

async function generateTranslationKeys(): Promise<void> {
  const localesDir = 'src/locales';
  const canonicalPath = join(localesDir, 'en.json');
  const outputPath = 'src/generated/translation-keys.ts';
  const localesOutputPath = 'src/generated/locales.ts';
  
  const content = await readFile(canonicalPath, 'utf-8');
  const data = JSON.parse(content);
  
  const keys = flattenKeys(data).sort();
  
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

  // Generate locales.ts to avoid JSON import friction for consumers
  const files = await readdir(localesDir);
  const localeFiles = files.filter(f => f.endsWith('.json'));
  
  let localesOutput = '';
  for (const file of localeFiles) {
    const localeName = file.replace('.json', '').replace('-', '');
    const fileContent = await readFile(join(localesDir, file), 'utf-8');
    // Using stringify ensures it's valid JS object syntax
    localesOutput += `export const ${localeName} = ${fileContent};\n\n`;
  }

  await writeFile(localesOutputPath, localesOutput, 'utf-8');
  console.log(`✓ Generated locales TS exports`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateTranslationKeys().catch((err) => {
    console.error('Generation failed:', err.message);
    process.exit(1);
  });
}
