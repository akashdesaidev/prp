'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle,
  Save,
  Send,
  FileText,
  Clock
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

  const questions = review?.reviewCycleId?.questions || [];
  const questionsPerStep = 5; // Increased from 3 to 5 questions per step
  const totalSteps = Math.ceil(questions.length / questionsPerStep) + 1; // +1 for summary step

  // Create steps from questions - group by category if possible, otherwise by count
  const steps = [];

  // If we have 3 or fewer questions, put them all in one step
  if (questions.length <= 3) {
    steps.push({
      id: 0,
      title: 'Questions',
      description: `All ${questions.length} questions`,
      questions: questions
    });
  } else {
    // Group questions by category first, then by count
    const questionsByCategory = questions.reduce((acc, question) => {
      const category = question.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(question);
      return acc;
    }, {});

    const categories = Object.keys(questionsByCategory);

    if (categories.length <= 3 && questions.length <= 10) {
      // If we have few categories and questions, group by category
      categories.forEach((category, index) => {
        steps.push({
          id: index,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Questions`,
          description: `${questionsByCategory[category].length} questions about ${category}`,
          questions: questionsByCategory[category]
        });
      });
    } else {
      // Default: group by count
      for (let i = 0; i < questions.length; i += questionsPerStep) {
        steps.push({
          id: Math.floor(i / questionsPerStep),
          title: `Section ${Math.floor(i / questionsPerStep) + 1}`,
          description: `Questions ${i + 1}-${Math.min(i + questionsPerStep, questions.length)}`,
          questions: questions.slice(i, i + questionsPerStep)
        });
      }
    }
  }

  // Add summary step
  steps.push({
    id: steps.length,
    title: 'Review & Submit',
    description: 'Review your responses and submit',
    questions: [],
    isSummary: true
  });

  useEffect(() => {
    validateCurrentStep();
  }, [currentStep, formData]);

  const validateCurrentStep = () => {
    const errors = {};
    const currentStepData = steps[currentStep];

    if (currentStepData && !currentStepData.isSummary) {
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
    } else {
      setCompletedSteps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
    }
  };

  const getStepProgress = () => {
    return Math.round((completedSteps.size / (totalSteps - 1)) * 100);
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
    if (currentStepData?.isSummary) return false;

    return Object.keys(validationErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1 && canProceedToNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    // Allow navigation to completed steps or current step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
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
              <span className="font-medium">{review.reviewCycle?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium">{formatDate(review.reviewCycle?.endDate)}</span>
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
          <Button variant="outline" onClick={onSaveDraft} disabled={saving || submitting}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            onClick={onSubmit}
            disabled={!canSubmit || saving || submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
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
              {review?.reviewCycle?.name} • Due {formatDate(review?.reviewCycle?.endDate)}
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
                disabled={readOnly || (index > currentStep && !completedSteps.has(index))}
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

      {/* Navigation */}
      {!steps[currentStep]?.isSummary && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || readOnly}
          >
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

            <Button onClick={handleNext} disabled={!canProceedToNext() || readOnly}>
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
