const { test, before, after } = require('node:test');
const assert = require('assert');
const { formatPatientResponse } = require('./languageUtils');

const originalFetch = global.fetch;
const mockTranslations = {
  Hola: { translation: 'Hello', src: 'es' },
  mi: { translation: 'my', src: 'es' },
  nombre: { translation: 'name', src: 'es' },
  es: { translation: 'is', src: 'es' },
  Maria: { translation: 'Maria', src: 'es' },
  y: { translation: 'and', src: 'es' },
  no: { translation: 'no', src: 'es' },
  puedo: { translation: 'can', src: 'es' },
  caminar: { translation: 'walk', src: 'es' },
  bien: { translation: 'well', src: 'es' },
  'Hola mi nombre es Maria': {
    translation: 'Hello, my name is Maria',
    src: 'es',
  },
  'y no puedo caminar bien': {
    translation: 'and I cannot walk well',
    src: 'es',
  },
  'Hello my name is Maria y no puedo caminar bien': {
    translation: 'Hello my name is Maria and I cannot walk well',
    src: 'es',
  },
};

before(() => {
  global.fetch = async (url) => {
    const q = new URL(url).searchParams.get('q');
    const entry = mockTranslations[q] || { translation: q, src: 'en' };
    return {
      json: async () => [[[entry.translation, q]], null, entry.src],
    };
  };
});

after(() => {
  global.fetch = originalFetch;
});

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
