const { test } = require('node:test');
const assert = require('assert');
const { formatPatientResponse } = require('./languageUtils');

test('returns English text unchanged', async () => {
  const res = await formatPatientResponse('I have a headache.');
  assert.strictEqual(res, 'I have a headache.');
});

test('adds inline translation for non-English text', async () => {
  const res = await formatPatientResponse('Hola mi nombre es Maria.', 'None', 'Spanish');
  assert.ok(res.startsWith('Hola mi nombre es Maria.'));
  assert.ok(res.includes('English:'));
});
