'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AISuggestionButton({
  revieweeId,
  reviewType,
  onSuggestionGenerated,
  disabled = false,
  className = ''
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSuggestion = async () => {
    if (!revieweeId || !reviewType) {
      toast.error('Missing required information for AI suggestion');
      return;
    }

    try {
      setIsGenerating(true);

      const response = await api.post('/ai/review-suggestion', {
        revieweeId,
        reviewType,
        includeOKRData: true,
        includeFeedbackData: true
      });

      if (response.data.success) {
        onSuggestionGenerated(response.data.data.suggestion);
        toast.success('AI suggestion generated successfully!');
      } else {
        toast.error('Failed to generate AI suggestion');
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);

      if (error.response?.status === 503) {
        toast.error('AI services are temporarily unavailable. Please try again later.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate AI suggestion');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGenerateSuggestion}
      disabled={disabled || isGenerating}
      className={`flex items-center gap-2 ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Suggest Draft
        </>
      )}
    </Button>
  );
}
