-- Create product_reviews table for customer reviews
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can view approved reviews only
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews
FOR SELECT
USING (is_approved = true);

-- Authenticated users can submit reviews (prevents spam)
CREATE POLICY "Authenticated users can submit reviews"
ON public.product_reviews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Store owners can manage reviews for their store
CREATE POLICY "Store members can view all reviews"
ON public.product_reviews
FOR SELECT
USING (can_access_store(auth.uid(), store_id));

CREATE POLICY "Store members can update reviews"
ON public.product_reviews
FOR UPDATE
USING (can_access_store(auth.uid(), store_id));

CREATE POLICY "Store members can delete reviews"
ON public.product_reviews
FOR DELETE
USING (can_access_store(auth.uid(), store_id));

-- Performance indexes
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_store_id ON public.product_reviews(store_id);
CREATE INDEX idx_product_reviews_approved ON public.product_reviews(is_approved) WHERE is_approved = true;
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(rating);

-- Trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();