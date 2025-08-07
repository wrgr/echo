const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');
const cors = require('cors')({ origin: true });

const {
  handleGeneratePatient,
  handleGeneratePatientFromForm,
  handleInteraction,
  handleAiPopulateFields,
} = require('./handlers');
const { getHelpAdviceFromGemini } = require('./gemini');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1' });

const geminiApiSecret = defineSecret('GEMINI_API_KEY');

exports.echoSimulator = onRequest({ cors: true, secrets: [geminiApiSecret] }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    return cors(req, res, () => res.status(204).send(''));
  }

  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      console.log('echoSimulator: Received request body:', JSON.stringify(req.body, null, 2));
      const { action } = req.body;

      if (action === 'generate_patient') {
        await handleGeneratePatient(req, res, geminiApiSecret);
      } else if (action === 'interact_conversation') {
        await handleInteraction(req, res, geminiApiSecret);
      } else if (action === 'get_help_advice') {
        const { patientInfo, providerPerception, question } = req.body;
        if (!patientInfo || !providerPerception || !question) {
          return res.status(400).send('Missing data for help advice request.');
        }
        await getHelpAdviceFromGemini(geminiApiSecret, patientInfo, providerPerception, question)
          .then(advice => res.status(200).json({ advice }))
          .catch(error => {
            console.error('echoSimulator: Error getting help advice from Gemini:', error);
            res.status(500).send('Failed to get help advice: ' + error.message);
          });
      } else if (action === 'ai_populate_fields') {
        await handleAiPopulateFields(req, res, geminiApiSecret);
      } else if (action === 'generate_patient_from_form') {
        await handleGeneratePatientFromForm(req, res, geminiApiSecret);
      } else {
        return res.status(400).send(
          "Invalid or missing 'action' in request body. Expected 'generate_patient', 'interact_conversation', 'get_help_advice', 'ai_populate_fields', or 'generate_patient_from_form'."
        );
      }
    } catch (error) {
      console.error('echoSimulator: Error processing request:', error);
      res.status(500).send('An internal server error occurred: ' + error.message);
    }
  });
});
