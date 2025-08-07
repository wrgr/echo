export const formatEnglishProficiency = (proficiency, includeEnglish = false) => {
  if (!proficiency) return '';
  if (proficiency === 'None') {
    return 'No English';
  }
  return includeEnglish ? `${proficiency} English` : proficiency;
};
