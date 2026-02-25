const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const Groq     = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post('/', protect, async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    const response = await groq.chat.completions.create({
      model:      'llama-3.1-8b-instant',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const message = response.choices[0]?.message?.content ||
      'Sorry, I could not generate a response.';

    res.json({ success: true, message });

  } catch (err) {
    console.error('Groq API error:', err.message);
    console.error('Status:', err.status);
    res.status(500).json({
      success: false,
      message: 'AI service error',
      error:   err.message,
    });
  }
});

module.exports = router;