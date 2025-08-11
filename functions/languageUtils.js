/**
 * Ensures patient responses are always understandable by the provider.
 * Detects the language of the given text and, when it isn't English,
 * appends an inline English translation in the form:
 * "<original> (English: <translation>)".
 *
 * If translation fails, the original text is returned unchanged when it
 * appears to be English, otherwise a notice is appended to the original
 * text indicating that translation was unavailable.
 *
 * @param {string} rawText The text returned by the simulator.
 * @returns {Promise<string>} Formatted response with inline translation when needed.
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
      return `${rawText} (English: translation unavailable)`;
    }

    // If Google thinks the text is already English, return it unchanged
    if (detectedLang === 'en' || translation.toLowerCase() === rawText.toLowerCase()) {
      return rawText;
    }

    return `${rawText} (English: ${translation})`;
  } catch (err) {
    console.error('formatPatientResponse translation error:', err);
    // Fallback heuristic: assume English if text is ASCII
    return /^[\x00-\x7F]*$/.test(rawText)
      ? rawText
      : `${rawText} (English: translation unavailable)`;
  }
};

module.exports = { formatPatientResponse };
