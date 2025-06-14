import { z } from 'zod';
import aiService from '../services/aiService.js';

// Validation schemas
const aiSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional()
});

// Get AI settings (masked keys for security)
export const getAISettings = async (req, res) => {
  try {
    const settings = {
      openaiApiKey: process.env.OPENAI_API_KEY
        ? '***' + process.env.OPENAI_API_KEY.slice(-4)
        : null,
      geminiApiKey: process.env.GEMINI_API_KEY
        ? '***' + process.env.GEMINI_API_KEY.slice(-4)
        : null,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasGemini: !!process.env.GEMINI_API_KEY
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting AI settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI settings',
      error: error.message
    });
  }
};

// Test AI connection
export const testAIConnection = async (req, res) => {
  try {
    const result = await aiService.testConnection();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing AI connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test AI connection',
      error: error.message
    });
  }
};

// Update AI settings (Note: In production, this should update a secure config store)
export const updateAISettings = async (req, res) => {
  try {
    const parsed = aiSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten()
      });
    }

    // In a real production environment, you would:
    // 1. Store these in a secure configuration service (AWS Secrets Manager, etc.)
    // 2. Update environment variables through your deployment system
    // 3. Restart the service to pick up new keys

    // For now, we'll just test the connection with the provided keys
    const { openaiApiKey, geminiApiKey } = parsed.data;

    let testResults = {
      openai: false,
      gemini: false
    };

    if (openaiApiKey) {
      // Test OpenAI key (simplified test)
      try {
        // This is a simplified test - in production you'd want more robust testing
        testResults.openai = openaiApiKey.startsWith('sk-') && openaiApiKey.length > 20;
      } catch (error) {
        testResults.openai = false;
      }
    }

    if (geminiApiKey) {
      // Test Gemini key (simplified test)
      try {
        testResults.gemini = geminiApiKey.length > 10;
      } catch (error) {
        testResults.gemini = false;
      }
    }

    res.json({
      success: true,
      message:
        'AI settings validated. In production, these would be securely stored and require service restart.',
      data: {
        testResults,
        note: 'This is a demo implementation. Production systems should use secure configuration management.'
      }
    });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI settings',
      error: error.message
    });
  }
};
