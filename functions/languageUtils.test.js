const { test } = require('node:test');
const assert = require('assert');
const { formatPatientResponse } = require('./languageUtils');

test('returns English text unchanged', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ json: async () => [[['I have a headache.']], null, 'en'] });
  try {
    const res = await formatPatientResponse('I have a headache.');
    assert.strictEqual(res, 'I have a headache.');
  } finally {
    global.fetch = originalFetch;
  }
});

test('adds inline translation for Spanish text', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ json: async () => [[['Hello my name is Maria.']], null, 'es'] });
  try {
    const res = await formatPatientResponse('Hola mi nombre es Maria.', 'Fluent');
    assert.strictEqual(res, 'Hola mi nombre es Maria. (English: Hello my name is Maria.)');
  } finally {
    global.fetch = originalFetch;
  }
});

test('adds inline translation for French text', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ json: async () => [[["My name is John."]], null, 'fr'] });
  try {
    const res = await formatPatientResponse("Bonjour, je m'appelle Jean.");
    assert.strictEqual(res, "Bonjour, je m'appelle Jean. (English: My name is John.)");
  } finally {
    global.fetch = originalFetch;
  }
});

test('handles translation failure gracefully', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error('Network error'); };
  try {
    const res = await formatPatientResponse('こんにちは');
    assert.strictEqual(res, 'こんにちは (English: translation unavailable)');
  } finally {
    global.fetch = originalFetch;
  }
});

