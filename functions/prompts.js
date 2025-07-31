const fs = require('fs');
const path = require('path');

const promptsPath = path.join(__dirname, 'prompts.json');
const promptsData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
const promptMap = Object.fromEntries(promptsData.map(p => [p.prompt, p]));

const formatPrompt = (template, vars = {}) =>
  // eslint-disable-next-line no-new-func
  new Function(...Object.keys(vars), `return \`${template}\`;`)(
    ...Object.values(vars),
  );

const getPrompt = (name) => {
  if (!promptMap[name]) {
    throw new Error(`Prompt '${name}' not found in prompts.json`);
  }
  return promptMap[name].promptText;
};

module.exports = { formatPrompt, getPrompt };
