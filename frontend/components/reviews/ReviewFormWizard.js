'use client';

import { useState, useEffect, useRef } from 'react';

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
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle,
  Save,
  Send,
  FileText,
  Clock,
  Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import DynamicQuestionTemplate from './DynamicQuestionTemplate';
import AISuggestionButton from '../ai/AISuggestionButton';
import toast from 'react-hot-toast';

export default function ReviewFormWizard({
  review,
  formData,
  onResponseChange,
  onOverallChange,
  onSaveDraft,
  onSubmit,
  readOnly = false,
  saving = false,
  submitting = false
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [validationErrors, setValidationErrors] = useState({});

  // Move useEffect to the top to avoid conditional hook issues
  useEffect(() => {
    // This will be called after steps are created
    const validateCurrentStep = () => {
      const errors = {};
      const currentStepData = steps[currentStep];

      if (currentStepData && !currentStepData.isSummary && !currentStepData.isOverallAssessment) {
        currentStepData.questions.forEach((question) => {
          const questionId = question._id || question.id;
          const response = formData.responses?.find((r) => r.questionId === questionId);
          const questionType = getQuestionType(question);

          if (question.required || question.isRequired) {
            if (questionType === 'rating' && !response?.rating) {
              errors[questionId] = 'Rating is required';
            } else if (questionType === 'text' && !response?.response?.trim()) {
              errors[questionId] = 'Response is required';
            } else if (
              questionType === 'rating_text' &&
              !response?.rating &&
              !response?.response?.trim()
            ) {
              errors[questionId] = 'Either rating or response is required';
            }
          }
        });
      }

      setValidationErrors(errors);

      // Update completed steps
      if (Object.keys(errors).length === 0 && !currentStepData?.isSummary) {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
      } else if (!currentStepData?.isSummary && !currentStepData?.isOverallAssessment) {
        setCompletedSteps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(currentStep);
          return newSet;
        });
      }

      // For overall assessment step, mark as completed if user has provided some input
      if (currentStepData?.isOverallAssessment) {
        const hasOverallInput =
          formData.overallRating > 0 || (formData.comments && formData.comments.trim().length > 0);
        if (hasOverallInput) {
          setCompletedSteps((prev) => new Set([...prev, currentStep]));
        } else {
          setCompletedSteps((prev) => {
            const newSet = new Set(prev);
            newSet.delete(currentStep);
            return newSet;
          });
        }
      }
    };

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

    if (steps.length > 0) {
      validateCurrentStep();
    }
  }, [currentStep, formData, steps.length]);

  const questions = review?.reviewCycleId?.questions || [];
  // Dynamic questions per step based on total questions
  const questionsPerStep = questions.length <= 6 ? 1 : questions.length <= 12 ? 2 : 3;
  const totalSteps = Math.ceil(questions.length / questionsPerStep) + 2; // +2 for overall assessment and summary steps

  // Create steps from questions - always group by count for consistency
  const steps = [];

  if (questions.length === 0) {
    // No questions, just add overall assessment and summary
    console.log('No questions found, skipping question steps');
  } else {
    // Always group by count for predictable behavior
    console.log('Creating question steps:', {
      totalQuestions: questions.length,
      questionsPerStep,
      expectedStepCount: Math.ceil(questions.length / questionsPerStep)
    });

    for (let i = 0; i < questions.length; i += questionsPerStep) {
      const stepQuestions = questions.slice(i, i + questionsPerStep);
      const stepNumber = Math.floor(i / questionsPerStep) + 1;

      steps.push({
        id: Math.floor(i / questionsPerStep),
        title: `Section ${stepNumber}`,
        description: `Questions ${i + 1}-${Math.min(i + questionsPerStep, questions.length)} of ${questions.length}`,
        questions: stepQuestions
      });

      console.log(`Created step ${stepNumber}:`, {
        stepId: Math.floor(i / questionsPerStep),
        questionsInStep: stepQuestions.length,
        questionRange: `${i + 1}-${Math.min(i + questionsPerStep, questions.length)}`
      });
    }
  }

  // Add overall assessment step
  steps.push({
    id: steps.length,
    title: 'Overall Assessment',
    description: 'Provide your overall rating and comments',
    questions: [],
    isOverallAssessment: true
  });

  // Add summary step
  steps.push({
    id: steps.length,
    title: 'Review & Submit',
    description: 'Review your responses and submit',
    questions: [],
    isSummary: true
  });

  // Debug steps creation
  console.log('Wizard Steps Debug:', {
    questionsLength: questions.length,
    questionsPerStep,
    totalSteps,
    stepsCount: steps.length,
    steps: steps.map((s, index) => ({
      stepIndex: index,
      id: s.id,
      title: s.title,
      questionsCount: s.questions?.length || 0,
      questionIds: s.questions?.map((q) => q._id || q.id) || [],
      isOverallAssessment: s.isOverallAssessment,
      isSummary: s.isSummary
    })),
    currentStep,
    currentStepData: steps[currentStep]
      ? {
          title: steps[currentStep].title,
          questionsCount: steps[currentStep].questions?.length || 0,
          isOverallAssessment: steps[currentStep].isOverallAssessment,
          isSummary: steps[currentStep].isSummary
        }
      : null,
    allQuestions: questions.map((q, i) => ({
      index: i,
      id: q._id || q.id,
      text: q.text?.substring(0, 50)
    }))
  });

  // Safety check for steps
  if (steps.length === 0) {
    console.error('Wizard View: No steps created!');
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No questions available</h3>
        <p className="text-gray-500">
          This review cycle doesn't have any questions configured for the wizard view.
        </p>
      </div>
    );
  }

  if (currentStep >= steps.length) {
    console.error('Wizard View: Current step out of bounds!', {
      currentStep,
      stepsLength: steps.length
    });
    setCurrentStep(0);
    return null;
  }

  const getStepProgress = () => {
    // Exclude summary step from progress calculation (totalSteps - 1)
    // Include overall assessment step in progress calculation
    const progressSteps = totalSteps - 1; // Only exclude summary step
    const progress = Math.round((completedSteps.size / progressSteps) * 100);
    // Cap progress at 100% to prevent over 100%
    return Math.min(progress, 100);
  };

  const getQuestionProgress = (step) => {
    if (step.isSummary) return 100;

    const answered = step.questions.filter((question) => {
      const questionId = question._id || question.id;
      const response = formData.responses?.find((r) => r.questionId === questionId);
      const questionType = getQuestionType(question);

      if (questionType === 'rating') return response?.rating;
      if (questionType === 'text') return response?.response?.trim();
      if (questionType === 'rating_text') return response?.rating || response?.response?.trim();
      return false;
    }).length;

    return Math.round((answered / step.questions.length) * 100);
  };

  const canProceedToNext = () => {
    const currentStepData = steps[currentStep];

    // Cannot proceed past summary step
    if (currentStepData?.isSummary) {
      console.log('Cannot proceed: Already at summary step');
      return false;
    }

    // For overall assessment step, always allow proceeding to summary step
    if (currentStepData?.isOverallAssessment) {
      const canProceedFromOverall = currentStep < steps.length - 1;
      console.log('Overall assessment step - can proceed:', canProceedFromOverall);
      return canProceedFromOverall;
    }

    // For regular question steps, allow navigation if readOnly (review mode)
    // or check validation errors if in edit mode
    if (readOnly) {
      console.log('Read-only mode - allowing navigation');
      return true;
    }

    const canProceed = Object.keys(validationErrors).length === 0;
    console.log('Edit mode - can proceed:', canProceed, 'errors:', validationErrors);
    return canProceed;
  };

  const handleNext = () => {
    const canProceed = canProceedToNext();
    const isLastStep = currentStep >= totalSteps - 1;

    console.log('HandleNext debug:', {
      currentStep,
      totalSteps,
      stepsLength: steps.length,
      canProceed,
      isLastStep,
      currentStepData: steps[currentStep]
        ? {
            title: steps[currentStep].title,
            isOverallAssessment: steps[currentStep].isOverallAssessment,
            isSummary: steps[currentStep].isSummary
          }
        : null
    });

    if (!isLastStep && canProceed) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Cannot proceed to next step:', { isLastStep, canProceed });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    // Allow navigation to completed steps or current step
    // Also allow navigation to overall assessment and summary steps for testing
    const targetStep = steps[stepIndex];
    const canNavigate =
      stepIndex <= currentStep ||
      completedSteps.has(stepIndex) ||
      targetStep?.isOverallAssessment ||
      targetStep?.isSummary;

    console.log('Step click debug:', {
      stepIndex,
      currentStep,
      targetStep: targetStep
        ? {
            title: targetStep.title,
            isOverallAssessment: targetStep.isOverallAssessment,
            isSummary: targetStep.isSummary
          }
        : null,
      canNavigate,
      completedSteps: Array.from(completedSteps)
    });

    if (canNavigate) {
      setCurrentStep(stepIndex);
    }
  };

  const handleAISuggestion = async (questionId, suggestion) => {
    const question = questions.find((q) => (q._id || q.id) === questionId);
    const questionType = getQuestionType(question);
    if (questionType === 'text' || questionType === 'rating_text') {
      onResponseChange(questionId, 'response', suggestion);
      toast.success('AI suggestion applied');
    }
  };

  const getReviewTypeLabel = (type) => {
    const labels = {
      self: 'Self Assessment',
      peer: 'Peer Review',
      manager: 'Manager Review',
      upward: 'Upward Review'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const OverallAssessmentStep = () => {
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const handleGenerateOverallAI = async () => {
      if (isGeneratingAI) return;

      setIsGeneratingAI(true);
      try {
        // Calculate suggested rating based on individual question responses
        const responses = formData.responses || [];
        const ratingsFromResponses = responses
          .map((r) => r.rating)
          .filter((rating) => rating && rating > 0);

        let suggestedRating = 0;
        if (ratingsFromResponses.length > 0) {
          suggestedRating = Math.round(
            ratingsFromResponses.reduce((sum, rating) => sum + rating, 0) /
              ratingsFromResponses.length
          );
        } else {
          // Default to middle rating if no individual ratings
          suggestedRating = 6;
        }

        // Generate AI comment based on responses
        const responseTexts = responses
          .map((r) => r.response)
          .filter((text) => text && text.trim().length > 0)
          .join(' ');

        let aiComment = '';
        if (responseTexts.length > 50) {
          // Simple AI-like summary (in real app, this would call AI service)
          aiComment = `Based on the detailed responses provided, this ${getReviewTypeLabel(review.reviewType).toLowerCase()} demonstrates solid performance across key areas. The feedback indicates consistent effort and achievement of objectives with room for continued growth and development.`;
        } else {
          aiComment = `This ${getReviewTypeLabel(review.reviewType).toLowerCase()} shows positive performance indicators. Continued focus on key objectives and professional development will support ongoing success.`;
        }

        // Apply the AI suggestions
        onOverallChange('overallRating', suggestedRating);
        onOverallChange('comments', aiComment);

        toast.success('AI suggestions applied to overall assessment');
      } catch (error) {
        console.error('Error generating AI suggestions:', error);
        toast.error('Failed to generate AI suggestions');
      } finally {
        setIsGeneratingAI(false);
      }
    };

    // Check if we can proceed to next step (summary step)
    const canProceedToSummary = () => {
      return currentStep < steps.length - 1;
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Overall Assessment</h3>
          <p className="text-gray-600">
            Provide your overall rating and any additional comments for this{' '}
            {getReviewTypeLabel(review.reviewType).toLowerCase()}.
          </p>
        </div>

        {/* AI Suggestion Button */}
        {!readOnly && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleGenerateOverallAI}
              disabled={isGeneratingAI}
              className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {isGeneratingAI ? 'Generating AI Suggestions...' : 'Generate AI Overall Assessment'}
            </Button>
          </div>
        )}

        {/* Overall Assessment Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-6">Overall Assessment</h4>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Rating (1-10 scale)
              </label>
              <RatingComponent
                value={formData.overallRating || 0}
                onChange={(rating) => onOverallChange('overallRating', rating)}
                readOnly={readOnly}
                size="large"
              />
              <p className="text-xs text-gray-500 mt-2">
                Rate the overall performance based on all aspects covered in this review.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Comments (Optional)
              </label>
              <FocusStableTextArea
                initialValue={formData.comments || ''}
                onChange={(text) => onOverallChange('comments', text)}
                placeholder="Any additional feedback, observations, or comments..."
                rows={6}
                readOnly={readOnly}
                questionId="overall"
                fieldType="comments"
              />
              <p className="text-xs text-gray-500 mt-2">
                Provide any additional context, specific examples, or overall feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={saving || submitting || readOnly}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button onClick={handleNext} disabled={!canProceedToSummary()}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const SummaryStep = () => {
    const totalQuestions = questions.length;
    const answeredQuestions =
      formData.responses?.filter((response) => {
        const question = questions.find((q) => (q._id || q.id) === response.questionId);
        const questionType = getQuestionType(question);
        if (questionType === 'rating') return response.rating;
        if (questionType === 'text') return response.response?.trim();
        if (questionType === 'rating_text') return response.rating || response.response?.trim();
        return false;
      }).length || 0;

    const requiredQuestions = questions.filter((q) => q.required).length;
    const answeredRequired =
      formData.responses?.filter((response) => {
        const question = questions.find(
          (q) => (q._id || q.id) === response.questionId && q.required
        );
        if (!question) return false;
        const questionType = getQuestionType(question);
        if (questionType === 'rating') return response.rating;
        if (questionType === 'text') return response.response?.trim();
        if (questionType === 'rating_text') return response.rating || response.response?.trim();
        return false;
      }).length || 0;

    const canSubmit = answeredRequired === requiredQuestions;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Complete!</h3>
          <p className="text-gray-600">
            Please review your responses before submitting your{' '}
            {getReviewTypeLabel(review.reviewType).toLowerCase()}.
          </p>
        </div>

        {/* Progress Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Completion Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{answeredQuestions}</div>
              <div className="text-sm text-gray-600">of {totalQuestions} questions answered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{answeredRequired}</div>
              <div className="text-sm text-gray-600">of {requiredQuestions} required completed</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{Math.round((answeredQuestions / totalQuestions) * 100)}%</span>
            </div>
            <Progress value={(answeredQuestions / totalQuestions) * 100} className="h-2" />
          </div>
        </div>

        {/* Review Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Review Details</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Review Type:</span>
              <span className="font-medium">{getReviewTypeLabel(review.reviewType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Review Cycle:</span>
              <span className="font-medium">{review.reviewCycleId?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium">{formatDate(review.reviewCycleId?.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${canSubmit ? 'text-green-600' : 'text-amber-600'}`}>
                {canSubmit ? 'Ready to Submit' : 'Incomplete'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={saving || submitting || readOnly}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button
              onClick={onSubmit}
              disabled={!canSubmit || saving || submitting || readOnly}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>

        {!canSubmit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-3" />
              <div>
                <h5 className="font-medium text-amber-800">Incomplete Review</h5>
                <p className="text-sm text-amber-700 mt-1">
                  Please complete all required questions before submitting your review.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getReviewTypeLabel(review?.reviewType)}
            </h1>
            <p className="text-gray-600 mt-1">
              {review?.reviewCycleId?.name} • Due {formatDate(review?.reviewCycleId?.endDate)}
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600">Overall Progress</div>
            <div className="text-2xl font-bold text-blue-600">{getStepProgress()}%</div>
          </div>
        </div>

        <Progress value={getStepProgress()} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => handleStepClick(index)}
                disabled={index > currentStep && !completedSteps.has(index)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  index === currentStep
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : completedSteps.has(index)
                      ? 'border-green-500 bg-green-500 text-white'
                      : index < currentStep
                        ? 'border-gray-300 bg-gray-100 text-gray-600 hover:border-gray-400'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.isSummary ? (
                  <Send className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <h3 className="font-semibold text-gray-900">{steps[currentStep]?.title}</h3>
          <p className="text-sm text-gray-600">{steps[currentStep]?.description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {steps[currentStep]?.isSummary ? (
          <SummaryStep />
        ) : steps[currentStep]?.isOverallAssessment ? (
          <OverallAssessmentStep />
        ) : (
          <div className="space-y-6">
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-gray-900">
                Step {currentStep + 1} of {totalSteps}
              </h4>
              <div className="text-sm text-gray-600">
                {getQuestionProgress(steps[currentStep])}% complete
              </div>
            </div>

            {/* Questions */}
            {steps[currentStep]?.questions.map((question, index) => (
              <div
                key={question._id || question.id}
                className="border-b border-gray-100 pb-6 last:border-b-0"
              >
                <DynamicQuestionTemplate
                  question={question}
                  response={formData.responses?.find(
                    (r) => r.questionId === (question._id || question.id)
                  )}
                  onResponseChange={onResponseChange}
                  readOnly={readOnly}
                  error={validationErrors[question._id || question.id]}
                  showAISuggestion={
                    !readOnly &&
                    (getQuestionType(question) === 'text' ||
                      getQuestionType(question) === 'rating_text')
                  }
                  onAISuggestion={(suggestion) =>
                    handleAISuggestion(question._id || question.id, suggestion)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation - Only show for regular question steps, not for overall assessment or summary */}
      {!steps[currentStep]?.isSummary && !steps[currentStep]?.isOverallAssessment && (
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={saving || submitting || readOnly}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button onClick={handleNext} disabled={!canProceedToNext()}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h5 className="font-medium text-red-800">Please complete the following:</h5>
              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                {Object.entries(validationErrors).map(([questionId, error]) => {
                  const question = questions.find((q) => (q._id || q.id) === questionId);
                  return (
                    <li key={questionId}>
                      {question?.text?.substring(0, 50)}...: {error}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
