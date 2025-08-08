const translationCache = new Map();
const translateToEnglish = async (text, srcLang = 'auto') => {
  const cacheKey = `${srcLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
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
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=en&dt=t&q=${encodeURIComponent(
      text,
    )}`;
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data) && data[0] && data[0][0] && data[0][0][0]) {
      const result = { text: data[0][0][0], src: data[2] };
      translationCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('translateToEnglish: translation failed', err);
  }
  return {
    text: `[translation unavailable for: ${text}]`,
    src: srcLang,
  };
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
      const { text: translated } = await translateToEnglish(core.trim(), srcLang);
      const translationAvailable =
        translated && !translated.startsWith('[translation unavailable');
      if (
        translationAvailable &&
        translated.trim().toLowerCase() !== core.trim().toLowerCase()
      ) {
        processed.push(`${core} (${translated})${trailing}`);
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
      const { text: translated, src: detectedSrc } = await translateToEnglish(
        token,
        srcLang,
      );
      const translationAvailable =
        translated && !translated.startsWith('[translation unavailable');
      let isNonEnglish = false;
      if (translationAvailable) {
        const same =
          translated.trim().toLowerCase() === token.trim().toLowerCase();
        if (detectedSrc && detectedSrc !== 'en') {
          // If translation differs, starts lowercase, or we are already in a
          // non-English segment, treat as non-English. This keeps proper nouns
          // within foreign-language segments but preserves standalone names in
          // English segments.
          if (!same || /^[a-z]/.test(token) || segmentIsNonEnglish) {
            isNonEnglish = true;
          }
        } else {
          isNonEnglish = !same;
        }
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
