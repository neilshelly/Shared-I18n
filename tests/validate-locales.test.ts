import { describe, it, expect, beforeEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { validateLocales } from '../scripts/validate-locales.js';

const TEMP_DIR = 'tests/fixtures/temp';

describe('validateLocales', () => {
  beforeEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
    await mkdir(TEMP_DIR, { recursive: true });
  });

  it('should pass validation for matching nested locales', async () => {
    await writeFile(
      join(TEMP_DIR, 'en.json'),
      JSON.stringify({
        common: {
          hello: 'Hello',
          goodbye: 'Goodbye {{name}}'
        }
      })
    );
    await writeFile(
      join(TEMP_DIR, 'de-DE.json'),
      JSON.stringify({
        common: {
          hello: 'Hallo',
          goodbye: 'Auf Wiedersehen {{name}}'
        }
      })
    );

    await expect(validateLocales(TEMP_DIR)).resolves.toBeUndefined();
  });

  it('should fail when a locale has an extra key in nested structure', async () => {
    await writeFile(
      join(TEMP_DIR, 'en.json'),
      JSON.stringify({ common: { hello: 'Hello' } })
    );
    await writeFile(
      join(TEMP_DIR, 'de-DE.json'),
      JSON.stringify({
        common: {
          hello: 'Hallo',
          extra: 'Extra key'
        }
      })
    );

    await expect(validateLocales(TEMP_DIR)).rejects.toThrow('Extra keys not in canonical');
  });

  it('should fail when a locale is missing a key in nested structure', async () => {
    await writeFile(
      join(TEMP_DIR, 'en.json'),
      JSON.stringify({
        common: {
          hello: 'Hello',
          goodbye: 'Goodbye'
        }
      })
    );
    await writeFile(
      join(TEMP_DIR, 'de-DE.json'),
      JSON.stringify({ common: { hello: 'Hallo' } })
    );

    await expect(validateLocales(TEMP_DIR)).rejects.toThrow('Missing keys compared to canonical');
  });

  it('should fail when placeholder names differ', async () => {
    await writeFile(
      join(TEMP_DIR, 'en.json'),
      JSON.stringify({ greeting: 'Hello {{name}}' })
    );
    await writeFile(
      join(TEMP_DIR, 'de-DE.json'),
      JSON.stringify({ greeting: 'Hallo {{username}}' })
    );

    await expect(validateLocales(TEMP_DIR)).rejects.toThrow('missing placeholders');
  });

  it('should fail on malformed placeholders', async () => {
    await writeFile(
      join(TEMP_DIR, 'en.json'),
      JSON.stringify({ broken: 'Hello {{name' })
    );

    await expect(validateLocales(TEMP_DIR)).rejects.toThrow('Malformed placeholder');
  });

  it('should fail on non-string values in nested structure', async () => {
    await writeFile(
      join(TEMP_DIR, 'en.json'),
      JSON.stringify({ nested: { bad: 123 } })
    );

    await expect(validateLocales(TEMP_DIR)).rejects.toThrow('non-string value');
  });

  it('should fail when nesting shape differs but flattened keys match', async () => {
    await writeFile(
      join(TEMP_DIR, 'en.json'),
      JSON.stringify({
        common: {
          hello: 'Hello'
        }
      })
    );
    await writeFile(
      join(TEMP_DIR, 'de-DE.json'),
      JSON.stringify({
        'common.hello': 'Hallo'
      })
    );

    await expect(validateLocales(TEMP_DIR)).rejects.toThrow('Nesting shape mismatch');
  });

  it('should fail on invalid JSON', async () => {
    await writeFile(join(TEMP_DIR, 'en.json'), '{ invalid json }');

    await expect(validateLocales(TEMP_DIR)).rejects.toThrow('Invalid JSON');
  });
});
