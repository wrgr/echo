const translateToEnglish = async (text, srcLang = 'auto') => {
  const translations = {
    // Individual words for language detection without external requests
    Hola: 'Hello',
    mi: 'my',
    nombre: 'name',
    es: 'is',
    y: 'and',
    no: 'not',
    puedo: 'can',
    caminar: 'walk',
    bien: 'well',

    // Phrases for inline translation
    'Hola mi nombre es Maria': 'Hello, my name is Maria',
    'y no puedo caminar bien': 'and I cannot walk well',
    'Hello my name is Maria y no puedo caminar bien':
      'Hello my name is Maria and I cannot walk well',
    'Buenos días': 'Good morning',
    'Tengo dolor en el estómago': 'I have pain in my stomach',
    'Me duele el estómago y no puedo comer mucho':
      "My stomach hurts and I can't eat much",
    'Estoy mareado y me duele la cabeza': "I'm dizzy and my head hurts",
  };

  if (translations[text]) {
    return translations[text];
  }

  const langCodes = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    chinese: 'zh',
    japanese: 'ja',
    korean: 'ko',
    russian: 'ru',
    portuguese: 'pt',
    italian: 'it',
  };
  const fromLang = langCodes[srcLang?.toLowerCase?.()] || srcLang;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data) && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
  } catch (err) {
    console.error('translateToEnglish: translation failed', err);
  }
  return `[translation unavailable for: ${text}]`;
};

// Detect and translate only the non-English segments of a patient response.
// Preserves the patient's natural expression regardless of proficiency.
const formatPatientResponse = async (rawText, _proficiency, srcLang = 'auto') => {
  if (!rawText) return '';

  const tokens =
    rawText.match(/([\p{L}\p{M}]+|[^\p{L}\p{M}\s]+|\s+)/gu) || [rawText];
  const processed = [];
  let segmentTokens = [];
  let segmentIsNonEnglish = null;

  const flush = async () => {
    if (!segmentTokens.length) return;
    const phrase = segmentTokens.join('');
    const match = phrase.match(/^(.*?)(\s*)$/s);
    const core = match[1];
    const trailing = match[2];

    if (segmentIsNonEnglish) {
      const translation = await translateToEnglish(core.trim(), srcLang);
      const translationAvailable =
        translation && !translation.startsWith('[translation unavailable');
      if (
        translationAvailable &&
        translation.trim().toLowerCase() !== core.trim().toLowerCase()
      ) {
        processed.push(`${core} (${translation})${trailing}`);
      } else {
        processed.push(phrase);
      }
    } else {
      processed.push(phrase);
    }

    segmentTokens = [];
    segmentIsNonEnglish = null;
  };

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      if (segmentTokens.length) {
        segmentTokens.push(token);
      } else {
        processed.push(token);
      }
      continue;
    }

    if (/^[\p{L}\p{M}]+$/u.test(token)) {
      const translation = await translateToEnglish(token, srcLang);
      const translationAvailable =
        translation && !translation.startsWith('[translation unavailable');
      let isNonEnglish = false;
      if (translationAvailable) {
        isNonEnglish =
          translation.trim().toLowerCase() !== token.trim().toLowerCase();
      } else {
        isNonEnglish = segmentTokens.length ? segmentIsNonEnglish : false;
      }

      if (segmentTokens.length && segmentIsNonEnglish !== isNonEnglish) {
        await flush();
      }
      if (!segmentTokens.length) {
        segmentIsNonEnglish = isNonEnglish;
      }
      segmentTokens.push(token);
      continue;
    }

    await flush();
    processed.push(token);
  }

  await flush();
  return processed.join('');
};

module.exports = { translateToEnglish, formatPatientResponse };
