import { translationKeys, en, deDE } from '../dist/index.js';

console.log('=== Smoke Test ===');
console.log(`Array.isArray(translationKeys): ${Array.isArray(translationKeys)}`);
console.log(`translationKeys.length: ${translationKeys.length}`);
console.log(`typeof en: ${typeof en}`);
console.log(`typeof deDE: ${typeof deDE}`);
console.log('');
console.log('Sample keys:');
translationKeys.slice(0, 3).forEach(key => {
  console.log(`  - ${key}`);
});
console.log('');
console.log('✓ Smoke test passed');
