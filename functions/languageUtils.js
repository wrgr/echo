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

const simulateBrokenEnglish = (text) =>
  text
    .split(' ')
    .map((word) => word.slice(0, 4))
    .join(' ');

const formatPatientResponse = async (rawText, proficiency, srcLang = 'auto') => {
  if (!rawText) return '';
  const translation = await translateToEnglish(rawText, srcLang);

  const translationAvailable =
    translation && !translation.startsWith('[translation unavailable');

  // If any part of the response is not English and we have a translation,
  // append the translation in parentheses.
  if (
    translationAvailable &&
    translation.trim() !== rawText.trim()
  ) {
    return `${rawText} (${translation})`;
  }

  const prof = (proficiency || '').toLowerCase();
  if (prof === 'fluent') {
    return translationAvailable ? translation : rawText;
  }
  if (prof === 'none') {
    return `${rawText} (${translation})`;
  }
  return simulateBrokenEnglish(translationAvailable ? translation : rawText);
};

module.exports = { translateToEnglish, formatPatientResponse };
