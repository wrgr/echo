const test = require('node:test');
const assert = require('assert');
const { formatPatientResponse } = require('./languageUtils');

test('returns unchanged English text', async () => {
  const res = await formatPatientResponse('I have a headache.', null, 'en');
  assert.strictEqual(res, 'I have a headache.');
});

test('translates entire non-English response', async () => {
  const res = await formatPatientResponse('Hola mi nombre es Maria.', null, 'es');
  assert.strictEqual(res, 'Hola mi nombre es Maria (Hello, my name is Maria).');
});

test('translates only the non-English segment', async () => {
  const res = await formatPatientResponse('Hello my name is Maria y no puedo caminar bien', null);
  assert.strictEqual(
    res,
    'Hello my name is Maria y no puedo caminar bien (and I cannot walk well)'
  );
});
