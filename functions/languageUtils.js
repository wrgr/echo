/**
 * Ensures patient responses are always understandable by the provider.
 * If the response is not in English, an inline English translation is appended
 * in the form: "<original> (English: <translation>)". If translation fails, the
 * original text is returned.
 *
 * @param {string} rawText The text returned by the simulator.
 * @param {string} [englishProficiency] Patient's English proficiency level.
 * @param {string} [nativeLanguage] Patient's native language.
 * @returns {Promise<string>} Formatted response with inline translation when needed.
 */
const formatPatientResponse = async (rawText, englishProficiency = '', nativeLanguage = '') => {
  if (!rawText) return '';

  // Only attempt translation if patient is not fluent
  const needsTranslation = englishProficiency && englishProficiency.toLowerCase() !== 'fluent';
  if (!needsTranslation) return rawText;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(rawText)}`;
    const response = await fetch(url);
    const data = await response.json();
    const translation = data?.[0]?.[0]?.[0];
    const detectedLang = data?.[2];

    if (!translation || typeof translation !== 'string') {
      return `${rawText} (English: translation unavailable)`;
    }

    // If Google thinks the text is already English, return it unchanged
    if (detectedLang === 'en' || translation.toLowerCase() === rawText.toLowerCase()) {
      return rawText;
    }

    return `${rawText} (English: ${translation})`;
  } catch (err) {
    console.error('formatPatientResponse translation error:', err);
    return `${rawText} (English: translation unavailable)`;
  }
};

module.exports = { formatPatientResponse };
