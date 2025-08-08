const { test } = require('node:test');
const assert = require('assert');
const { formatPatientResponse } = require('./languageUtils');

test('returns English text unchanged', async () => {
  const res = await formatPatientResponse('I have a headache.');
  assert.strictEqual(res, 'I have a headache.');
});

test('returns non-English text unchanged', async () => {
  const res = await formatPatientResponse('Hola mi nombre es Maria.');
  assert.strictEqual(res, 'Hola mi nombre es Maria.');
});
