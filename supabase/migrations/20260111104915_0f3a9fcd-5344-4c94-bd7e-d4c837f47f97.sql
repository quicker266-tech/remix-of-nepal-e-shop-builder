-- Migration: Add Order Status History Table
-- Purpose: Track all order status changes for audit trail and future extensions

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for fast queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Store members can view status history
CREATE POLICY "Store members can view order status history"
ON public.order_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
    AND public.can_access_store(auth.uid(), o.store_id)
  )
);

-- RLS Policy: Store members can insert status history
CREATE POLICY "Store members can insert order status history"
ON public.order_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
    AND public.can_access_store(auth.uid(), o.store_id)
  )
);

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-log status changes
DROP TRIGGER IF EXISTS trigger_log_order_status ON public.orders;
CREATE TRIGGER trigger_log_order_status
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

COMMENT ON TABLE public.order_status_history IS 'Tracks all order status changes for audit trail and customer notifications';