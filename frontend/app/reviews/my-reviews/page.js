'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Button } from '../../../components/ui/button';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Star,
  Users
} from 'lucide-react';
import PeerReviewNomination from '../../../components/reviews/PeerReviewNomination';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function MyReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNominations, setShowNominations] = useState(false);
  const [activeCycles, setActiveCycles] = useState([]);

  useEffect(() => {
    fetchMyReviews();
    fetchActiveCycles();
  }, []);

  // Add effect to refresh data when page becomes visible (e.g., returning from submission)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMyReviews();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/review-submissions/my-submissions');
      const reviewData = response.data.reviews || response.data.data || [];

      // Debug logging to see the actual data structure
      console.log('Raw API response:', response.data);
      console.log('Review data:', reviewData);
      if (reviewData.length > 0) {
        console.log('First review structure:', reviewData[0]);
      }

      setReviews(reviewData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Don't show error toast immediately, might be expected for new users
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch reviews');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCycles = async () => {
    try {
      // Use the dedicated endpoint for user's active review cycles
      const response = await api.get('/review-cycles/my-active');
      setActiveCycles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching active cycles:', error);
    }
  };

  const getStatusBadge = (review) => {
    if (review.status === 'submitted' || review.submittedAt) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Submitted
        </span>
      );
    }

    // Show "Draft" for reviews that have actual content (AI suggestions, responses, or populated response fields)
    const hasAIContent = !!(review.aiSuggestions?.suggestedComments?.length > 0);
    const hasResponses = !!(review.responses?.length > 0);
    const hasComments = !!(review.comments?.length > 0);
    const hasPopulatedResponses = review.responses?.some((r) => r.response?.trim() || r.rating > 0);

    if (
      review.status === 'draft' &&
      (hasAIContent || hasResponses || hasComments || hasPopulatedResponses)
    ) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FileText className="w-3 h-3 mr-1" />
          Draft
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
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
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !(review.status === 'submitted' || review.submittedAt);
    if (filter === 'submitted') return review.status === 'submitted' || review.submittedAt;
    return true;
  });

  const ReviewCard = ({ review }) => {
    // Safe access to nested properties
    const reviewCycle = review.reviewCycleId || review.reviewCycle || {};
    const cycleName = reviewCycle.name || 'Unknown Cycle';
    const cycleEndDate = reviewCycle.endDate || new Date();

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">
                  {getReviewTypeLabel(review.reviewType)}
                </h3>
                {getStatusBadge(review)}
              </div>

              <p className="text-sm text-gray-600 mb-2">{cycleName}</p>

              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {formatDate(cycleEndDate)}</span>
                </div>
                {review.revieweeId && (
                  <div className="flex items-center space-x-1">
                    <span>
                      For: {review.revieweeId.firstName} {review.revieweeId.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {review.status === 'submitted' || review.submittedAt ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/reviews/submit/${review._id}`}>View Review</Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href={`/reviews/submit/${review._id}`}>Start Review</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-1">Complete your assigned performance reviews</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Reviews' },
                { key: 'pending', label: 'Pending' },
                { key: 'submitted', label: 'Submitted' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    filter === key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeCycles.length > 0 && (
            <Button variant="outline" onClick={() => setShowNominations(!showNominations)}>
              <Users className="w-4 h-4 mr-2" />
              {showNominations ? 'Hide Nominations' : 'Nominate Peers'}
            </Button>
          )}
        </div>

        {/* Peer Nominations Section */}
        {showNominations && activeCycles.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Peer Review Nominations</h3>
            <p className="text-sm text-gray-600 mb-4">
              Nominate colleagues for peer reviews in active review cycles.
            </p>
            {activeCycles.map((cycle) => (
              <div key={cycle._id} className="mb-6 last:mb-0">
                <h4 className="font-medium text-gray-800 mb-2">{cycle.name}</h4>
                <PeerReviewNomination
                  reviewCycleId={cycle._id}
                  revieweeId={user?.id}
                  maxNominations={5}
                  onNominationsChange={(nominations) => {
                    console.log('Nominations updated:', nominations);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all'
                ? "You don't have any reviews assigned yet. Reviews will appear here when a review cycle becomes active."
                : `No ${filter} reviews found. Try changing the filter or check back later.`}
            </p>
            {activeCycles.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Active cycles found:</strong> {activeCycles.length} cycle(s) are active.
                  Review submissions should be created automatically. Try refreshing the page.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
