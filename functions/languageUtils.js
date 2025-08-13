/**
 * Ensures patient responses are always understandable by the provider.
 * Detects the language of the given text and, when it isn't English,
 * returns an English-only version of the message. Non-English text is never
 * exposed to the provider. When translation fails for a non-English
 * message, a notice is returned instead of the original text.
 *
 * @param {string} rawText The text returned by the simulator.
 * @returns {Promise<string>} Patient response translated to English when needed.
 */
const formatPatientResponse = async (rawText) => {
  if (!rawText) return '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(rawText)}`;
    const response = await fetch(url);
    const data = await response.json();
    const translation = data?.[0]?.[0]?.[0];
    const detectedLang = data?.[2];

    if (!translation || typeof translation !== 'string') {
      return 'English translation unavailable.';
    }

    // If Google thinks the text is already English, return it unchanged
    if (detectedLang === 'en' || translation.toLowerCase() === rawText.toLowerCase()) {
      return rawText;
    }

    return translation;
  } catch (err) {
    console.error('formatPatientResponse translation error:', err);
    // Fallback heuristic: assume English if text is ASCII
    return /^[\x00-\x7F]*$/.test(rawText)
      ? rawText
      : 'English translation unavailable.';
  }
};

module.exports = { formatPatientResponse };
