const translateToEnglish = (text, srcLang = 'auto') => {
  const translations = {
    'Tengo dolor en el estómago.': 'I have pain in my stomach.',
    'Me duele el estómago y no puedo comer mucho.': "My stomach hurts and I can't eat much.",
    'Estoy mareado y me duele la cabeza.': "I'm dizzy and my head hurts.",
    'Hola mi nombre es Maria.': 'Hello, my name is Maria.',
    'y no puedo caminar bien': 'and I cannot walk well.',
    'Hello my name is Maria y no puedo caminar bien':
      'Hello my name is Maria and I cannot walk well.',
  };
  return translations[text] || `[translation unavailable for: ${text}]`;
};

const simulateBrokenEnglish = (text) =>
  text
    .split(' ')
    .map((word) => word.slice(0, 4))
    .join(' ');

const formatPatientResponse = (rawText, proficiency, srcLang = 'auto') => {
  if (!rawText) return '';
  const translation = translateToEnglish(rawText, srcLang);
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
