/**
 * ============================================================================
 * REVIEW FORM COMPONENT
 * ============================================================================
 *
 * Form for submitting product reviews.
 * Reviews are submitted with is_approved = false by default (requires moderation).
 *
 * ============================================================================
 */

import { useState } from 'react';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  storeId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, storeId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          store_id: storeId,
          customer_name: name.trim(),
          customer_email: email.trim() || null,
          rating,
          title: title.trim() || null,
          content: content.trim() || null,
          is_verified_purchase: false, // Can be updated later if customer is linked
          is_approved: false, // Requires moderation
        });

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          toast.error('Review system is being set up. Please try again later.');
        } else {
          throw error;
        }
        return;
      }

      setIsSubmitted(true);
      toast.success('Thank you! Your review has been submitted for approval.');
      onSuccess?.();

      // Reset form
      setRating(0);
      setName('');
      setEmail('');
      setTitle('');
      setContent('');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold text-lg mb-2">Thank You!</h3>
          <p className="text-muted-foreground">
            Your review has been submitted and is pending approval.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsSubmitted(false)}
          >
            Write Another Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-2">
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
              <span className="text-sm text-muted-foreground">
                {rating > 0 ? `${rating} star${rating === 1 ? '' : 's'}` : 'Click to rate'}
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="reviewer-name">Your Name *</Label>
            <Input
              id="reviewer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email (optional) */}
          <div className="space-y-2">
            <Label htmlFor="reviewer-email">Email (optional)</Label>
            <Input
              id="reviewer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Your email will not be published
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Review Title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="review-content">Your Review</Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
