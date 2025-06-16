import axios from 'axios';
import logger from '../utils/logger.js';

class AIService {
  constructor() {
    this.openaiClient = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    this.geminiClient = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      params: {
        key: process.env.GEMINI_API_KEY
      }
    });
  }

  async generateReviewSuggestion(reviewData) {
    try {
      // Try OpenAI first
      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful HR assistant generating professional performance review suggestions. Provide constructive, specific, and actionable feedback.'
          },
          {
            role: 'user',
            content: `Generate a professional review suggestion based on the following data:
            
            Reviewee: ${reviewData.revieweeName}
            Review Type: ${reviewData.reviewType}
            Past Feedback: ${reviewData.pastFeedback || 'No previous feedback available'}
            OKR Progress: ${reviewData.okrProgress || 'No OKR data available'}
            
            Please provide specific, constructive feedback in 2-3 paragraphs.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return {
        success: true,
        suggestion: response.data.choices[0].message.content,
        provider: 'openai'
      };
    } catch (openAIError) {
      logger.warn('OpenAI failed, trying Gemini fallback', openAIError.message);

      try {
        // Fallback to Gemini
        const response = await this.geminiClient.post('/models/gemini-1.5-flash:generateContent', {
          contents: [
            {
              parts: [
                {
                  text: `Generate a professional performance review suggestion for ${reviewData.revieweeName}. 
              Review Type: ${reviewData.reviewType}
              Past Feedback: ${reviewData.pastFeedback || 'No previous feedback available'}
              OKR Progress: ${reviewData.okrProgress || 'No OKR data available'}
              
              Provide specific, constructive feedback in 2-3 paragraphs.`
                }
              ]
            }
          ]
        });

        return {
          success: true,
          suggestion: response.data.candidates[0].content.parts[0].text,
          provider: 'gemini'
        };
      } catch (geminiError) {
        logger.error('Both AI providers failed', { openAIError, geminiError });
        return {
          success: false,
          error: 'AI services temporarily unavailable'
        };
      }
    }
  }

  async summarizeSelfAssessment(assessmentData) {
    try {
      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that helps summarize self-assessments. Extract key themes, strengths, weaknesses, and impact statements.'
          },
          {
            role: 'user',
            content: `Summarize this self-assessment:
            
            ${assessmentData.responses.map((r) => `Q: ${r.question}\nA: ${r.response}`).join('\n\n')}
            
            Please provide:
            1. Key Themes (2-3 main points)
            2. Strengths (2-3 items)
            3. Areas for Improvement (2-3 items)
            4. Impact Statements (1-2 key achievements)`
          }
        ],
        max_tokens: 400,
        temperature: 0.5
      });

      return {
        success: true,
        summary: response.data.choices[0].message.content,
        provider: 'openai'
      };
    } catch (openAIError) {
      try {
        // Fallback to Gemini
        const response = await this.geminiClient.post('/models/gemini-1.5-flash:generateContent', {
          contents: [
            {
              parts: [
                {
                  text: `Summarize this self-assessment and extract key themes, strengths, areas for improvement, and impact statements:
              
              ${assessmentData.responses.map((r) => `Q: ${r.question}\nA: ${r.response}`).join('\n\n')}`
                }
              ]
            }
          ]
        });

        return {
          success: true,
          summary: response.data.candidates[0].content.parts[0].text,
          provider: 'gemini'
        };
      } catch (geminiError) {
        logger.error('Both AI providers failed for summarization', { openAIError, geminiError });
        return {
          success: false,
          error: 'AI summarization temporarily unavailable'
        };
      }
    }
  }

  async generateQuestionResponse(reviewData) {
    try {
      // Try OpenAI first
      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful HR assistant generating specific answers to performance review questions. Provide professional, constructive responses based on the employee data provided.'
          },
          {
            role: 'user',
            content: `Answer this specific review question for ${reviewData.revieweeName}:

Question: "${reviewData.question}"
Requires Rating: ${reviewData.requiresRating ? 'Yes (1-10 scale)' : 'No'}

Employee Context:
- Past Feedback: ${reviewData.pastFeedback || 'No previous feedback available'}
- OKR Progress: ${reviewData.okrProgress || 'No OKR data available'}

Please provide:
1. A specific answer to the question (2-3 sentences)
${reviewData.requiresRating ? '2. A rating from 1-10 (where 1=poor, 10=exceptional)' : ''}

Format your response as:
Response: [your answer here]
${reviewData.requiresRating ? 'Rating: [number]' : ''}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const aiResponse = response.data.choices[0].message.content;

      // Parse the response to extract answer and rating
      const responseMatch = aiResponse.match(/Response:\s*(.+?)(?=Rating:|$)/s);
      const ratingMatch = reviewData.requiresRating ? aiResponse.match(/Rating:\s*(\d+)/) : null;

      return {
        success: true,
        response: responseMatch ? responseMatch[1].trim() : aiResponse,
        rating: ratingMatch ? parseInt(ratingMatch[1]) : null,
        provider: 'openai'
      };
    } catch (openAIError) {
      logger.warn(
        'OpenAI failed for question response, trying Gemini fallback',
        openAIError.message
      );

      try {
        // Fallback to Gemini
        const response = await this.geminiClient.post('/models/gemini-1.5-flash:generateContent', {
          contents: [
            {
              parts: [
                {
                  text: `Answer this performance review question for ${reviewData.revieweeName}:
                  
Question: "${reviewData.question}"
${reviewData.requiresRating ? 'Also provide a rating from 1-10.' : ''}

Context:
- Past Feedback: ${reviewData.pastFeedback || 'No previous feedback available'}
- OKR Progress: ${reviewData.okrProgress || 'No OKR data available'}

Provide a professional, specific answer in 2-3 sentences.`
                }
              ]
            }
          ]
        });

        const aiResponse = response.data.candidates[0].content.parts[0].text;

        // Simple parsing for Gemini response
        const ratingMatch = reviewData.requiresRating
          ? aiResponse.match(/(\d+)\/10|rating.*?(\d+)|(\d+)\s*out\s*of\s*10/i)
          : null;
        const rating = ratingMatch
          ? parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3])
          : null;

        return {
          success: true,
          response: aiResponse,
          rating: rating,
          provider: 'gemini'
        };
      } catch (geminiError) {
        logger.error('Both AI providers failed for question response', {
          openAIError,
          geminiError
        });
        return {
          success: false,
          error: 'AI question response temporarily unavailable'
        };
      }
    }
  }

  async analyzeSentiment(text) {
    try {
      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a sentiment analysis AI. Analyze the sentiment of the given text and respond with only one word: "positive", "neutral", or "negative". Also identify if the response is vague or ambiguous.'
          },
          {
            role: 'user',
            content: `Analyze the sentiment and quality of this text: "${text}"`
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      const result = response.data.choices[0].message.content.toLowerCase();
      const sentiment = result.includes('positive')
        ? 'positive'
        : result.includes('negative')
          ? 'negative'
          : 'neutral';

      const qualityFlags = [];
      if (result.includes('vague') || result.includes('ambiguous') || text.length < 20) {
        qualityFlags.push('vague_response');
      }
      if (text.split(' ').length < 5) {
        qualityFlags.push('too_short');
      }

      return {
        success: true,
        sentiment,
        qualityFlags,
        provider: 'openai'
      };
    } catch (error) {
      logger.error('Sentiment analysis failed', error);

      // Simple fallback sentiment analysis
      const positiveWords = [
        'good',
        'great',
        'excellent',
        'outstanding',
        'positive',
        'strong',
        'effective'
      ];
      const negativeWords = [
        'bad',
        'poor',
        'weak',
        'ineffective',
        'negative',
        'lacking',
        'needs improvement'
      ];

      const lowerText = text.toLowerCase();
      const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length;

      let sentiment = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      else if (negativeCount > positiveCount) sentiment = 'negative';

      const qualityFlags = [];
      if (text.length < 20) qualityFlags.push('too_short');
      if (text.split(' ').length < 5) qualityFlags.push('vague_response');

      return {
        success: true,
        sentiment,
        qualityFlags,
        provider: 'fallback'
      };
    }
  }

  // AI Scoring Algorithm (as per PRD)
  calculateAIScore(components) {
    const {
      recentFeedbackScore = 0,
      okrScore = 0,
      peerFeedbackScore = 0,
      managerFeedbackScore = 0,
      selfAssessmentScore = 0,
      tenureAdjustmentScore = 0
    } = components;

    const finalScore =
      recentFeedbackScore * 0.35 +
      okrScore * 0.25 +
      peerFeedbackScore * 0.15 +
      managerFeedbackScore * 0.15 +
      selfAssessmentScore * 0.05 +
      tenureAdjustmentScore * 0.05;

    return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
  }

  async testConnection() {
    const results = {
      openai: false,
      gemini: false,
      errors: {}
    };

    // Test OpenAI connection
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await this.openaiClient.post('/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 5
        });

        if (response.status === 200) {
          results.openai = true;
          logger.info('OpenAI connection test successful');
        }
      } catch (error) {
        results.openai = false;
        results.errors.openai = error.response?.data?.error?.message || error.message;
        logger.error('OpenAI connection test failed:', error.response?.data || error.message);
      }
    } else {
      results.errors.openai = 'API key not configured';
    }

    // Test Gemini connection
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await this.geminiClient.post('/models/gemini-1.5-flash:generateContent', {
          contents: [
            {
              parts: [
                {
                  text: 'Test connection'
                }
              ]
            }
          ]
        });

        if (response.status === 200) {
          results.gemini = true;
          logger.info('Gemini connection test successful');
        }
      } catch (error) {
        results.gemini = false;
        results.errors.gemini = error.response?.data?.error?.message || error.message;
        logger.error('Gemini connection test failed:', error.response?.data || error.message);
      }
    } else {
      results.errors.gemini = 'API key not configured';
    }

    return results;
  }
}

export default new AIService();
