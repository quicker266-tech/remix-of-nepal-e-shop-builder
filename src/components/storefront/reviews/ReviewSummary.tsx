/**
 * ============================================================================
 * REVIEW SUMMARY COMPONENT
 * ============================================================================
 *
 * Displays average rating, total reviews, and rating distribution breakdown.
 *
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ReviewSummaryProps {
  productId: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export function ReviewSummary({ productId }: ReviewSummaryProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewStats();
  }, [productId]);

  const fetchReviewStats = async () => {
    try {
      const { data: reviews, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_approved', true);

      if (error) {
        // Table might not exist yet
        console.warn('Could not fetch reviews:', error.message);
        setStats({
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
        setLoading(false);
        return;
      }

      if (!reviews || reviews.length === 0) {
        setStats({
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
        setLoading(false);
        return;
      }

      // Calculate stats
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      reviews.forEach((review) => {
        distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        totalRating += review.rating;
      });

      setStats({
        averageRating: totalRating / reviews.length,
        totalReviews: reviews.length,
        distribution,
      });
    } catch (error) {
      console.error('Error fetching review stats:', error);
      setStats({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <Skeleton key={star} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Be the first to review this product
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
        <div>
          <StarRating rating={stats.averageRating} size="lg" />
          <p className="text-sm text-muted-foreground mt-1">
            Based on {stats.totalReviews} review{stats.totalReviews === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[star] || 0;
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8">{star} star</span>
              <Progress value={percentage} className="flex-1 h-2" />
              <span className="w-8 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
