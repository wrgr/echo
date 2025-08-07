const translateToEnglish = (text, srcLang = 'auto') => {
  const translations = {
    'Tengo dolor en el estómago.': 'I have pain in my stomach.',
    'Me duele el estómago y no puedo comer mucho.': "My stomach hurts and I can't eat much.",
    'Estoy mareado y me duele la cabeza.': "I'm dizzy and my head hurts.",
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
  const prof = (proficiency || '').toLowerCase();
  if (prof === 'none') {
    return `${rawText} (${translation})`;
  }
  if (prof === 'fluent') {
    return translation;
  }
  return simulateBrokenEnglish(translation);
};

module.exports = { translateToEnglish, formatPatientResponse };
