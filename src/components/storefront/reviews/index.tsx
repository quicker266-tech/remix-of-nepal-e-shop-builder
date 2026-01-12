/**
 * ============================================================================
 * REVIEW COMPONENTS - BARREL EXPORT
 * ============================================================================
 *
 * Export all review-related components from a single entry point.
 *
 * REQUIRES: product_reviews table in Supabase
 *
 * SQL Migration:
 * ```sql
 * CREATE TABLE product_reviews (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 *   store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 *   customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
 *   customer_name TEXT NOT NULL,
 *   customer_email TEXT,
 *   rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
 *   title TEXT,
 *   content TEXT,
 *   is_verified_purchase BOOLEAN DEFAULT false,
 *   is_approved BOOLEAN DEFAULT false,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
 * CREATE INDEX idx_product_reviews_store ON product_reviews(store_id);
 * CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved);
 *
 * ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Public can read approved reviews" ON product_reviews
 *   FOR SELECT USING (is_approved = true);
 *
 * CREATE POLICY "Anyone can submit reviews" ON product_reviews
 *   FOR INSERT WITH CHECK (true);
 *
 * CREATE POLICY "Store owners can manage reviews" ON product_reviews
 *   FOR ALL USING (
 *     store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
 *     OR is_super_admin(auth.uid())
 *   );
 * ```
 *
 * ============================================================================
 */

export { StarRating, RatingDisplay } from './StarRating';
export { ReviewSummary } from './ReviewSummary';
export { ReviewList } from './ReviewList';
export { ReviewForm } from './ReviewForm';
