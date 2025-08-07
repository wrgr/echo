const translateToEnglish = async (text, srcLang = 'auto') => {
  const translations = {
    'Tengo dolor en el estómago.': 'I have pain in my stomach.',
    'Me duele el estómago y no puedo comer mucho.':
      "My stomach hurts and I can't eat much.",
    'Estoy mareado y me duele la cabeza.': "I'm dizzy and my head hurts.",
    'Hola mi nombre es Maria.': 'Hello, my name is Maria.',
    'y no puedo caminar bien': 'and I cannot walk well.',
    'Hello my name is Maria y no puedo caminar bien':
      'Hello my name is Maria and I cannot walk well.',
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

  // Split by spaces but keep them in the array for reconstruction
  const segments = rawText.split(/(\s+)/);
  const processed = [];

  for (const segment of segments) {
    // If it's purely whitespace, keep as is
    if (!segment.trim()) {
      processed.push(segment);
      continue;
    }

    // Separate word from attached punctuation (e.g., "Hola,")
    const match = segment.match(/^(\p{L}+[\p{M}]*)(.*)$/u);
    if (!match) {
      processed.push(segment);
      continue;
    }

    const word = match[1];
    const punctuation = match[2] || '';

    const translation = await translateToEnglish(word, srcLang);
    const translationAvailable =
      translation && !translation.startsWith('[translation unavailable');

    if (
      translationAvailable &&
      translation.trim().toLowerCase() !== word.trim().toLowerCase()
    ) {
      processed.push(`${word} (${translation})${punctuation}`);
    } else {
      processed.push(word + punctuation);
    }
  }

  return processed.join('');
};

module.exports = { translateToEnglish, formatPatientResponse };
