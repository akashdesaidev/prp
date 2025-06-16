'use client';

import { useState } from 'react';
import { Star, MessageSquare, Hash, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import AISuggestionButton from '../ai/AISuggestionButton';

export default function DynamicQuestionTemplate({
  question,
  response,
  onResponseChange,
  readOnly = false,
  error = null,
  showAISuggestion = false,
  onAISuggestion = null
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const questionId = question._id || question.id;

  const handleAISuggestion = async () => {
    if (!onAISuggestion) return;

    setAiLoading(true);
    try {
      // Mock AI suggestion - in real implementation, this would call the AI service
      const suggestion = await generateAISuggestion(question, response);
      onAISuggestion(suggestion);
    } catch (error) {
      console.error('AI suggestion failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const generateAISuggestion = async (question, currentResponse) => {
    // Mock AI suggestion logic - replace with actual AI service call
    const suggestions = {
      'What are your key accomplishments this quarter?':
        'Successfully led the implementation of the new customer onboarding system, resulting in a 25% reduction in setup time. Collaborated with cross-functional teams to deliver three major product features ahead of schedule. Mentored two junior developers, helping them achieve their learning objectives.',
      'What areas would you like to improve?':
        'I would like to enhance my public speaking skills to better present technical concepts to non-technical stakeholders. Additionally, I want to deepen my knowledge of cloud architecture patterns to contribute more effectively to our infrastructure decisions.',
      'How would you rate your collaboration skills?':
        'I consistently work well with team members across different departments, actively listen to diverse perspectives, and contribute to a positive team environment. I regularly facilitate knowledge sharing sessions and help resolve conflicts constructively.'
    };

    // Simple matching for demo - in real implementation, use AI service
    const matchedSuggestion =
      suggestions[question.text] ||
      'Based on your role and responsibilities, consider highlighting specific achievements, quantifiable results, and areas for professional growth that align with your career objectives.';

    return matchedSuggestion;
  };

  const RatingComponent = ({ value, onChange, readOnly = false, scale = 10 }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const getRatingLabel = (rating) => {
      if (scale === 5) {
        const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        return labels[rating] || '';
      } else {
        if (rating <= 2) return 'Needs Improvement';
        if (rating <= 4) return 'Below Expectations';
        if (rating <= 6) return 'Meets Expectations';
        if (rating <= 8) return 'Exceeds Expectations';
        return 'Outstanding';
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          {Array.from({ length: scale }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              type="button"
              disabled={readOnly}
              className={`w-8 h-8 transition-all duration-200 ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              }`}
              onMouseEnter={() => !readOnly && setHoverRating(rating)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
              onClick={() => !readOnly && onChange(rating)}
            >
              <Star
                className={`w-full h-full ${
                  rating <= (hoverRating || value)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <div className="ml-3 text-sm">
            <span className="font-medium text-gray-900">
              {value || hoverRating || 0}/{scale}
            </span>
            {(value || hoverRating) && (
              <span className="text-gray-600 ml-2">({getRatingLabel(value || hoverRating)})</span>
            )}
          </div>
        </div>

        {/* Rating Scale Reference */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
          <div className="grid grid-cols-2 gap-1">
            <span>1-2: Needs Improvement</span>
            <span>3-4: Below Expectations</span>
            <span>5-6: Meets Expectations</span>
            <span>7-8: Exceeds Expectations</span>
            <span>9-10: Outstanding</span>
          </div>
        </div>
      </div>
    );
  };

  const TextAreaComponent = ({
    value,
    onChange,
    placeholder,
    rows = 4,
    readOnly = false,
    minLength = 0,
    maxLength = 2000
  }) => {
    const characterCount = value?.length || 0;
    const isOverLimit = characterCount > maxLength;
    const isUnderMinimum = minLength > 0 && characterCount < minLength;

    return (
      <div className="space-y-2">
        <textarea
          value={value || ''}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          placeholder={readOnly ? '' : placeholder}
          rows={rows}
          readOnly={readOnly}
          className={`w-full border rounded-md px-3 py-2 text-sm resize-vertical transition-colors ${
            readOnly
              ? 'bg-gray-50 text-gray-700 cursor-default border-gray-200'
              : error
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />

        <div className="flex justify-between items-center text-xs">
          <div className="space-x-4">
            {minLength > 0 && (
              <span className={isUnderMinimum ? 'text-amber-600' : 'text-gray-500'}>
                Min: {minLength} characters
              </span>
            )}
          </div>

          <span
            className={`${
              isOverLimit
                ? 'text-red-600'
                : characterCount > maxLength * 0.9
                  ? 'text-amber-600'
                  : 'text-gray-500'
            }`}
          >
            {characterCount}/{maxLength}
          </span>
        </div>

        {isUnderMinimum && (
          <div className="text-xs text-amber-600">
            Please provide at least {minLength} characters for a complete response.
          </div>
        )}
      </div>
    );
  };

  const MultipleChoiceComponent = ({
    options,
    value,
    onChange,
    readOnly = false,
    allowMultiple = false
  }) => {
    const handleOptionChange = (optionValue) => {
      if (readOnly) return;

      if (allowMultiple) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.includes(optionValue)
          ? currentValues.filter((v) => v !== optionValue)
          : [...currentValues, optionValue];
        onChange(newValues);
      } else {
        onChange(optionValue);
      }
    };

    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const isSelected = allowMultiple
            ? Array.isArray(value) && value.includes(option.value)
            : value === option.value;

          return (
            <label
              key={index}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                readOnly ? 'cursor-default bg-gray-50' : 'hover:bg-gray-50'
              } ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <input
                type={allowMultiple ? 'checkbox' : 'radio'}
                checked={isSelected}
                onChange={() => handleOptionChange(option.value)}
                disabled={readOnly}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    );
  };

  // Helper to get the actual question type from either type field or requiresRating field
  const getQuestionType = () => {
    // If question has explicit type field, use it
    if (question.type) {
      return question.type;
    }

    // For ReviewCycle questions, infer type from requiresRating field
    if (question.requiresRating !== undefined) {
      return question.requiresRating ? 'rating_text' : 'text';
    }

    // Default fallback
    return 'text';
  };

  const getQuestionIcon = () => {
    const questionType = getQuestionType();
    switch (questionType) {
      case 'rating':
      case 'rating_text':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'text':
      case 'long_text':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'multiple_choice':
      case 'checkbox':
        return <Hash className="w-5 h-5 text-green-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderQuestionInput = () => {
    const questionType = getQuestionType();
    switch (questionType) {
      case 'rating':
        return (
          <RatingComponent
            value={response?.rating || 0}
            onChange={(rating) => onResponseChange(questionId, 'rating', rating)}
            readOnly={readOnly}
            scale={question.scale || 10}
          />
        );

      case 'text':
        return (
          <TextAreaComponent
            value={response?.response || ''}
            onChange={(text) => onResponseChange(questionId, 'response', text)}
            placeholder="Please provide your response..."
            rows={3}
            readOnly={readOnly}
            minLength={question.minLength || 0}
            maxLength={question.maxLength || 2000}
          />
        );

      case 'long_text':
        return (
          <TextAreaComponent
            value={response?.response || ''}
            onChange={(text) => onResponseChange(questionId, 'response', text)}
            placeholder="Please provide a detailed response..."
            rows={6}
            readOnly={readOnly}
            minLength={question.minLength || 50}
            maxLength={question.maxLength || 5000}
          />
        );

      case 'rating_text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating ({question.scale || 10}-point scale)
              </label>
              <RatingComponent
                value={response?.rating || 0}
                onChange={(rating) => onResponseChange(questionId, 'rating', rating)}
                readOnly={readOnly}
                scale={question.scale || 10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments
              </label>
              <TextAreaComponent
                value={response?.response || ''}
                onChange={(text) => onResponseChange(questionId, 'response', text)}
                placeholder="Please provide additional context for your rating..."
                rows={3}
                readOnly={readOnly}
                maxLength={question.maxLength || 1000}
              />
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <MultipleChoiceComponent
            options={question.options || []}
            value={response?.response}
            onChange={(value) => onResponseChange(questionId, 'response', value)}
            readOnly={readOnly}
            allowMultiple={false}
          />
        );

      case 'checkbox':
        return (
          <MultipleChoiceComponent
            options={question.options || []}
            value={response?.response}
            onChange={(value) => onResponseChange(questionId, 'response', value)}
            readOnly={readOnly}
            allowMultiple={true}
          />
        );

      default:
        return (
          <div className="text-gray-500 italic">
            Unsupported question type: {questionType}
            {question.type !== questionType &&
              ` (detected from: ${question.type || 'requiresRating'})`}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-gray-50 rounded-lg mt-1 flex-shrink-0">{getQuestionIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-gray-900 pr-4">
              {question.text || question.question || question.questionText || 'Question'}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </h3>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {question.helpText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(!showHelp)}
                  className="p-1 h-auto"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Button>
              )}

              {showAISuggestion && !readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAISuggestion}
                  disabled={aiLoading}
                  className="p-1 h-auto text-blue-600 hover:text-blue-700"
                >
                  <Lightbulb className={`w-4 h-4 ${aiLoading ? 'animate-pulse' : ''}`} />
                </Button>
              )}
            </div>
          </div>

          {question.description && (
            <p className="text-sm text-gray-600 mt-1 mb-3">{question.description}</p>
          )}

          {/* Help Text */}
          {showHelp && question.helpText && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-start">
                <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">{question.helpText}</div>
              </div>
            </div>
          )}

          {/* Question Input */}
          <div className="space-y-3">{renderQuestionInput()}</div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}

          {/* Question Metadata */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{question.required ? 'Required' : 'Optional'}</span>
              {question.category && (
                <span className="px-2 py-1 bg-gray-100 rounded-full">{question.category}</span>
              )}
            </div>

            <div className="text-xs text-gray-500">{getCompletionStatus()}</div>
          </div>
        </div>
      </div>
    </div>
  );

  function getCompletionStatus() {
    const hasResponse = () => {
      switch (question.type) {
        case 'rating':
          return response?.rating > 0;
        case 'text':
        case 'long_text':
          return response?.response?.trim();
        case 'rating_text':
          return response?.rating > 0 || response?.response?.trim();
        case 'multiple_choice':
          return response?.response;
        case 'checkbox':
          return Array.isArray(response?.response) && response.response.length > 0;
        default:
          return false;
      }
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          hasResponse() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {hasResponse() ? 'Completed' : 'Pending'}
      </span>
    );
  }
}
