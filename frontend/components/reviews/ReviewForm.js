import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { Star, MessageSquare, Hash } from 'lucide-react';
import { Button } from '../ui/button';
import AISuggestionButton from '../ai/AISuggestionButton';
import SelfAssessmentSummarizer from '../ai/SelfAssessmentSummarizer';

// Ultra-simple uncontrolled textarea to prevent any focus loss
const FocusStableTextArea = ({
  initialValue,
  onChange,
  placeholder,
  rows = 4,
  readOnly = false,
  questionId,
  fieldType = 'text'
}) => {
  const textareaRef = useRef(null);
  const timeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Set initial value only once
  useEffect(() => {
    if (!isInitializedRef.current && textareaRef.current) {
      textareaRef.current.value = initialValue || '';
      isInitializedRef.current = true;
    }
  }, []);

  const handleChange = (e) => {
    if (readOnly || !onChange) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounced update to parent
    timeoutRef.current = setTimeout(() => {
      onChange(e.target.value);
    }, 500);
  };

  const textareaId = `textarea-${questionId || 'overall'}-${fieldType}`;

  return (
    <textarea
      ref={textareaRef}
      id={textareaId}
      defaultValue={initialValue || ''}
      onChange={handleChange}
      placeholder={readOnly ? '' : placeholder}
      rows={rows}
      readOnly={readOnly}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-vertical ${
        readOnly
          ? 'bg-gray-50 text-gray-700 cursor-default'
          : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
      }`}
    />
  );
};

export default function ReviewForm({
  review,
  formData,
  onResponseChange,
  onOverallChange,
  readOnly = false
}) {
  const [expandedQuestions, setExpandedQuestions] = useState({});

  // Helper to get the actual question type from either type field or requiresRating field
  const getQuestionType = (question) => {
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

  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleAISuggestion = (suggestion) => {
    // For peer/manager reviews, populate the overall comments field
    onOverallChange('comments', suggestion);
  };

  const RatingComponent = ({ value, onChange, readOnly = false, size = 'default' }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const starSize = size === 'large' ? 'w-8 h-8' : 'w-6 h-6';

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={readOnly}
            className={`${starSize} transition-colors ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            onMouseEnter={() => !readOnly && setHoverRating(rating)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            onClick={() => !readOnly && onChange(rating)}
          >
            <Star
              className={`w-full h-full ${
                rating <= (hoverRating || value) ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {value || hoverRating || 0}/10
        </span>
      </div>
    );
  };

  const QuestionCard = ({ question, response, onResponseChange, readOnly = false }) => {
    const questionId = question._id || question.id;
    const questionType = getQuestionType(question);

    // Stable handlers with useCallback
    const handleRatingChange = useCallback(
      (rating) => {
        onResponseChange(questionId, 'rating', rating);
      },
      [onResponseChange, questionId]
    );

    const handleTextChange = useCallback(
      (text) => {
        onResponseChange(questionId, 'response', text);
      },
      [onResponseChange, questionId]
    );

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-2 bg-gray-50 rounded-lg mt-1">
              {questionType === 'rating' ? (
                <Hash className="w-4 h-4 text-gray-600" />
              ) : (
                <MessageSquare className="w-4 h-4 text-gray-600" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">
                {question.text || question.question || question.questionText || 'Question'}
                {(question.required || question.isRequired) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h3>

              {question.description && (
                <p className="text-sm text-gray-600 mb-4">{question.description}</p>
              )}

              {/* Rating Question */}
              {questionType === 'rating' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Rating (1-10 scale)
                  </label>
                  <RatingComponent
                    value={response?.rating || 0}
                    onChange={handleRatingChange}
                    readOnly={readOnly}
                    size="default"
                  />
                </div>
              )}

              {/* Text Question */}
              {questionType === 'text' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Your Response</label>
                  <FocusStableTextArea
                    initialValue={response?.response || ''}
                    onChange={handleTextChange}
                    placeholder="Please provide your detailed response..."
                    rows={4}
                    readOnly={readOnly}
                    questionId={questionId}
                    fieldType="response"
                  />
                </div>
              )}

              {/* Combined Rating + Text */}
              {questionType === 'rating_text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating (1-10 scale)
                    </label>
                    <RatingComponent
                      value={response?.rating || 0}
                      onChange={handleRatingChange}
                      readOnly={readOnly}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Comments
                    </label>
                    <FocusStableTextArea
                      initialValue={response?.response || ''}
                      onChange={handleTextChange}
                      placeholder="Please provide additional context for your rating..."
                      rows={3}
                      readOnly={readOnly}
                      questionId={questionId}
                      fieldType="response"
                    />
                  </div>
                </div>
              )}

              {/* Character count for text responses */}
              {(questionType === 'text' || questionType === 'rating_text') &&
                response?.response && (
                  <div className="mt-2 text-xs text-gray-500">
                    {response.response.length} characters
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{question.required || question.isRequired ? 'Required' : 'Optional'}</span>

            <span
              className={`px-2 py-1 rounded-full ${
                (questionType === 'rating' && response?.rating) ||
                (questionType === 'text' && response?.response?.trim()) ||
                (questionType === 'rating_text' && (response?.rating || response?.response?.trim()))
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {(questionType === 'rating' && response?.rating) ||
              (questionType === 'text' && response?.response?.trim()) ||
              (questionType === 'rating_text' && (response?.rating || response?.response?.trim()))
                ? 'Completed'
                : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getCompletionProgress = () => {
    if (!review?.reviewCycleId?.questions || !formData?.responses) return 0;

    const totalQuestions = review.reviewCycleId.questions.length;
    const completedQuestions = formData.responses.filter((response) => {
      const question = review.reviewCycleId.questions.find(
        (q) => (q._id || q.id) === response.questionId
      );

      if (!question) return false;
      const questionType = getQuestionType(question);

      if (questionType === 'rating') {
        return response.rating > 0;
      } else if (questionType === 'text') {
        return response.response?.trim().length > 0;
      } else if (questionType === 'rating_text') {
        return response.rating > 0 || response.response?.trim().length > 0;
      }

      return false;
    }).length;

    return totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  };

  // Stable handlers for overall assessment
  const handleOverallRatingChange = useCallback(
    (rating) => {
      onOverallChange('overallRating', rating);
    },
    [onOverallChange]
  );

  const handleOverallCommentsChange = useCallback(
    (text) => {
      onOverallChange('comments', text);
    },
    [onOverallChange]
  );

  if (!review?.reviewCycleId?.questions) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No questions available</h3>
        <p className="text-gray-500">This review cycle doesn't have any questions configured.</p>
        <div className="mt-4 text-xs text-gray-400">
          Debug: review={!!review}, reviewCycleId={!!review?.reviewCycleId}, questions=
          {review?.reviewCycleId?.questions?.length || 0}
        </div>
      </div>
    );
  }

  const completionProgress = getCompletionProgress();
  const isReviewType = review?.reviewType;
  const revieweeId = review?.revieweeId?._id || review?.revieweeId;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Review Progress</h2>
          <span className="text-sm text-gray-600">{completionProgress}% Complete</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionProgress}%` }}
          ></div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {formData.responses?.filter((r) => {
            const q = review.reviewCycleId.questions.find(
              (question) => (question._id || question.id) === r.questionId
            );
            if (!q) return false;
            const questionType = getQuestionType(q);
            return (
              (questionType === 'rating' && r.rating) ||
              (questionType === 'text' && r.response?.trim()) ||
              (questionType === 'rating_text' && (r.rating || r.response?.trim()))
            );
          }).length || 0}{' '}
          of {review.reviewCycleId.questions.length} questions completed
        </div>
      </div>

      {/* AI Tools Section */}
      {!readOnly && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Powered Tools</h3>
          <div className="flex flex-wrap gap-3">
            {/* AI Suggestion for Peer/Manager Reviews */}
            {(isReviewType === 'peer' || isReviewType === 'manager') && revieweeId && (
              <AISuggestionButton
                revieweeId={revieweeId}
                reviewType={isReviewType}
                onSuggestionGenerated={handleAISuggestion}
                className="bg-white shadow-sm"
                hasExistingSuggestion={!!review?.aiSuggestions?.suggestedComments}
              />
            )}

            {/* Self-Assessment Summarizer */}
            {isReviewType === 'self' && formData.responses && (
              <SelfAssessmentSummarizer
                responses={formData.responses}
                className="bg-white shadow-sm"
              />
            )}
          </div>

          <p className="text-sm text-blue-700 mt-3">
            {isReviewType === 'self'
              ? 'Use the Summarize button to get AI-generated insights from your responses.'
              : 'Use the Suggest Draft button to get AI-powered review suggestions based on past feedback and OKR progress.'}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {review.reviewCycleId.questions.map((question, index) => {
          const questionId = question._id || question.id;
          const response = formData.responses?.find((r) => r.questionId === questionId);

          return (
            <QuestionCard
              key={questionId}
              question={question}
              response={response}
              onResponseChange={onResponseChange}
              readOnly={readOnly}
            />
          );
        })}
      </div>

      {/* Overall Assessment */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Assessment</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating (1-10 scale)
            </label>
            <RatingComponent
              value={formData.overallRating || 0}
              onChange={handleOverallRatingChange}
              readOnly={readOnly}
              size="large"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <FocusStableTextArea
              initialValue={formData.comments || ''}
              onChange={handleOverallCommentsChange}
              placeholder="Any additional feedback or comments..."
              rows={4}
              readOnly={readOnly}
              questionId="overall"
              fieldType="comments"
            />
          </div>
        </div>
      </div>

      {/* Review Summary for Read-Only */}
      {readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Review Submitted</h3>
          <p className="text-blue-700 text-sm">
            This review has been submitted and can no longer be edited. If you need to make changes,
            please contact your manager or HR.
          </p>
        </div>
      )}
    </div>
  );
}
