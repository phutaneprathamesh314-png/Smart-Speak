import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio build',
    },
  },
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    // Accept either body.prompt, body.contents, or body directly if it's a string
    const promptText = body.prompt || body.contents || (typeof body === 'string' ? body : '');

    if (!promptText) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Prompt or contents is required' }),
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: promptText,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: response.text }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
