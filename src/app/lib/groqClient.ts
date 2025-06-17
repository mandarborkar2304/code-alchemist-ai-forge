import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY || "",
});

export default groq;