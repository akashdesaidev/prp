'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ReviewForm from '../../../../components/reviews/ReviewForm';
import ReviewFormWizard from '../../../../components/reviews/ReviewFormWizard';
import { Button } from '../../../../components/ui/button';
import { ArrowLeft, Save, Send, FileText, Clock, CheckCircle, Layers } from 'lucide-react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function ReviewSubmissionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [useWizardMode, setUseWizardMode] = useState(true);
  const [formData, setFormData] = useState({
    responses: [],
    overallRating: 0,
    comments: ''
  });

  useEffect(() => {
    if (id) {
      fetchReviewSubmission();
    }
  }, [id]);

  const fetchReviewSubmission = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/review-submissions/${id}`);
      const reviewData = response.data.data || response.data;

      // Debug logging to see the actual data structure
      console.log('Review submission response:', response.data);
      console.log('Review data structure:', reviewData);
      console.log('Review cycle data:', reviewData?.reviewCycleId);
      console.log('Questions in cycle:', reviewData?.reviewCycleId?.questions?.length || 0);
      console.log('AI suggestions:', {
        hasAI: !!reviewData?.aiSuggestions,
        commentsLength: reviewData?.aiSuggestions?.suggestedComments?.length || 0
      });

      setReview(reviewData);

      // Safe access to review cycle and questions
      // The backend populates reviewCycleId, not reviewCycle
      const reviewCycle = reviewData?.reviewCycleId || {};
      const questions = reviewCycle?.questions || [];

      console.log('Review cycle object:', reviewCycle);
      console.log('Questions array:', questions);

      // Initialize form data with existing responses or empty structure
      if (reviewData.responses && reviewData.responses.length > 0) {
        // Use existing responses, but ensure they match the questions structure
        const formattedResponses = reviewData.responses.map((response) => ({
          questionId: response.questionId,
          questionText: response.questionText,
          response: response.response || '',
          rating: response.rating || null
        }));

        setFormData({
          responses: formattedResponses,
          overallRating: reviewData.overallRating || 0,
          comments: reviewData.comments || reviewData.aiSuggestions?.suggestedComments || ''
        });
      } else {
        // Initialize with empty responses based on questions
        const emptyResponses = questions.map((question) => ({
          questionId: question._id || question.id,
          questionText: question.question || question.text,
          response: '',
          rating: question.requiresRating ? 0 : null
        }));

        setFormData({
          responses: emptyResponses,
          overallRating: 0,
          comments: reviewData.aiSuggestions?.suggestedComments || ''
        });
      }
    } catch (error) {
      toast.error('Failed to fetch review details');
      console.error('Error fetching review:', error);
      router.push('/reviews/my-reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      responses: prev.responses.map((response) =>
        response.questionId === questionId ? { ...response, [field]: value } : response
      )
    }));
  };

  const handleOverallChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    // Safe access to review cycle and questions
    const reviewCycle = review?.reviewCycleId || {};
    const questions = reviewCycle?.questions || [];

    // Check if all required questions are answered
    for (const response of formData.responses) {
      const question = questions.find((q) => (q._id || q.id) === response.questionId);

      if (question && question.isRequired) {
        if (question.requiresRating && !response.rating) {
          toast.error(`Please provide a rating for: ${question.question || question.text}`);
          return false;
        }
        if (!question.requiresRating && !response.response.trim()) {
          toast.error(`Please provide an answer for: ${question.question || question.text}`);
          return false;
        }
      }
    }

    return true;
  };

  // Helper function to clean form data before sending to backend
  const prepareFormData = (data) => {
    const cleanedData = { ...data };

    // Remove overallRating if it's 0 (no rating selected)
    if (cleanedData.overallRating === 0) {
      delete cleanedData.overallRating;
    }

    // Clean responses array - remove rating if it's 0
    if (cleanedData.responses) {
      cleanedData.responses = cleanedData.responses.map((response) => {
        const cleanedResponse = { ...response };
        if (cleanedResponse.rating === 0) {
          delete cleanedResponse.rating;
        }
        return cleanedResponse;
      });
    }

    return cleanedData;
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const cleanedData = prepareFormData(formData);
      await api.patch(`/review-submissions/${id}`, {
        ...cleanedData,
        status: 'draft'
      });
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // First save the current data as draft
      const cleanedData = prepareFormData(formData);
      await api.patch(`/review-submissions/${id}`, cleanedData);

      // Then submit the review using the dedicated submit endpoint
      await api.post(`/review-submissions/${id}/submit`);

      toast.success('Review submitted successfully');
      router.push('/reviews/my-reviews');
    } catch (error) {
      toast.error('Failed to submit review');
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
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

  const getReviewTypeIcon = (type) => {
    return <FileText className="w-5 h-5" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!review) {
    return (
      <ProtectedRoute>
        <div className="p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Review not found</h3>
          <p className="text-gray-500 mb-4">The requested review could not be found.</p>
          <Button onClick={() => router.push('/reviews/my-reviews')}>Back to My Reviews</Button>
        </div>
      </ProtectedRoute>
    );
  }

  const isSubmitted = review.status === 'submitted' || review.submittedAt;
  // Safe access to nested properties
  const reviewCycle = review?.reviewCycleId || {};
  const dueDate = new Date(reviewCycle?.endDate || new Date());
  const isOverdue = dueDate < new Date() && !isSubmitted;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/reviews/my-reviews')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to My Reviews
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                {!isSubmitted && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUseWizardMode(!useWizardMode)}
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      {useWizardMode ? 'Basic View' : 'Wizard View'}
                    </Button>

                    <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Draft'}
                    </Button>

                    <Button onClick={handleSubmit} disabled={submitting}>
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </>
                )}

                {isSubmitted && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Submitted</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Review Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  {getReviewTypeIcon(review.reviewType)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getReviewTypeLabel(review.reviewType)}
                  </h1>
                  <p className="text-gray-600 mt-1">{reviewCycle?.name || 'Unknown Cycle'}</p>
                  {review.reviewType === 'peer' && review.revieweeId && (
                    <p className="text-sm text-gray-500 mt-1">
                      For: {review.revieweeId.firstName} {review.revieweeId.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Due: {formatDate(reviewCycle?.endDate || new Date())}
                  </span>
                </div>

                {isOverdue && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Overdue
                  </span>
                )}

                {isSubmitted && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Submitted on {formatDate(review.submittedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {useWizardMode ? (
            <ReviewFormWizard
              review={review}
              formData={formData}
              onResponseChange={handleResponseChange}
              onOverallChange={handleOverallChange}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              readOnly={isSubmitted}
              saving={saving}
              submitting={submitting}
            />
          ) : (
            <ReviewForm
              review={review}
              formData={formData}
              onResponseChange={handleResponseChange}
              onOverallChange={handleOverallChange}
              readOnly={isSubmitted}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
