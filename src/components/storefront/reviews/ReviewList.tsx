/**
 * ============================================================================
 * REVIEW LIST COMPONENT
 * ============================================================================
 *
 * Displays a list of approved reviews for a product with pagination.
 *
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  created_at: string;
}

interface ReviewListProps {
  productId: string;
  pageSize?: number;
}

export function ReviewList({ productId, pageSize = 5 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchReviews(0);
  }, [productId]);

  const fetchReviews = async (pageNum: number) => {
    try {
      const from = pageNum * pageSize;
      const to = from + pageSize;

      const { data, error, count } = await supabase
        .from('product_reviews')
        .select('id, customer_name, rating, title, content, is_verified_purchase, created_at', { count: 'exact' })
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .range(from, to - 1);

      if (error) {
        // Table might not exist yet
        console.warn('Could not fetch reviews:', error.message);
        setReviews([]);
        setLoading(false);
        return;
      }

      if (pageNum === 0) {
        setReviews(data || []);
      } else {
        setReviews((prev) => [...prev, ...(data || [])]);
      }

      setHasMore(count ? from + (data?.length || 0) < count : false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    fetchReviews(page + 1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return null; // ReviewSummary will show empty state
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-border pb-6 last:border-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.customer_name}</span>
                {review.is_verified_purchase && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {review.title && (
            <h4 className="font-medium mb-1">{review.title}</h4>
          )}

          {review.content && (
            <p className="text-muted-foreground">{review.content}</p>
          )}
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            <ChevronDown className="w-4 h-4 mr-2" />
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}
