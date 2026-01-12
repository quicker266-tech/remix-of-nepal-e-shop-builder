/**
 * ============================================================================
 * CHECKOUT PAGE
 * ============================================================================
 *
 * Handles the checkout process for customer orders.
 * Filters cart items by storeSlug to only checkout items from this store.
 *
 * NOTE: Header/Footer are now rendered by StorefrontLayout (parent)
 * This component receives store data via useStorefrontContext()
 *
 * SECURITY:
 * - Form validation with Zod schema
 * - HTML sanitization for notes field
 * - Input length limits
 *
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useStorefrontContext } from '@/components/storefront/StorefrontLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { sanitizeHtml } from '@/lib/sanitize';
import type { Json } from '@/integrations/supabase/types';

// Zod schema for checkout form validation
const checkoutSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),
  phone: z.string()
    .trim()
    .min(7, 'Phone must be at least 7 characters')
    .max(20, 'Phone must be less than 20 characters')
    .regex(/^[+\d\s()-]+$/, 'Phone can only contain numbers, spaces, +, -, (, )'),
  address: z.string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters'),
  city: z.string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  notes: z.string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .transform(val => val || ''),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { store } = useStorefrontContext();
  const { items, clearCart } = useCart();

  // Filter items for current store only
  const storeItems = items.filter(item => item.storeSlug === storeSlug);

  // Calculate totals for this store's items only
  const cartTotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const shippingAmount = 100; // Fixed shipping for now
  const orderTotal = cartTotal + shippingAmount;

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const validateForm = (): CheckoutFormData | null => {
    const result = checkoutSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return null;
    }

    setFormErrors({});
    return result.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form with zod schema
    const validatedData = validateForm();
    if (!validatedData) {
      toast.error('Please fix the form errors');
      return;
    }

    if (storeItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!store) {
      toast.error('Store not found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize notes field to prevent XSS when displayed
      const sanitizedNotes = validatedData.notes ? sanitizeHtml(validatedData.notes) : '';

      console.log('🛒 [CHECKOUT] Starting checkout process...', {
        storeSlug,
        storeId: store.id,
        email: validatedData.email,
        cartTotal,
        itemCount: storeItems.length,
      });

      // ================================================================
      // STEP 1: Create or update customer using RPC function
      // ================================================================
      console.log('👤 [CHECKOUT] Step 1: Creating/updating customer...');
      const { data: customerId, error: customerError } = await supabase
        .rpc('create_or_update_checkout_customer', {
          p_store_id: store.id,
          p_email: validatedData.email,
          p_full_name: validatedData.fullName,
          p_phone: validatedData.phone,
          p_address: validatedData.address,
          p_city: validatedData.city,
        });

      if (customerError) {
        console.error('❌ [CHECKOUT] Customer creation failed:', customerError);
        throw customerError;
      }

      console.log('✅ [CHECKOUT] Customer created/updated:', customerId);

      // ================================================================
      // STEP 2: Create order record
      // ================================================================
      const newOrderNumber = generateOrderNumber();
      console.log('📦 [CHECKOUT] Step 2: Creating order...', { orderNumber: newOrderNumber });

      const shippingAddress = {
        full_name: validatedData.fullName,
        address: validatedData.address,
        city: validatedData.city,
        phone: validatedData.phone,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: store.id,
          customer_id: customerId,
          order_number: newOrderNumber,
          status: 'pending',
          subtotal: cartTotal,
          shipping_amount: shippingAmount,
          discount_amount: 0,
          tax_amount: 0,
          total: orderTotal,
          shipping_address: shippingAddress as unknown as Json,
          billing_address: shippingAddress as unknown as Json,
          notes: sanitizedNotes || null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ [CHECKOUT] Order creation failed:', orderError);
        throw orderError;
      }

      console.log('✅ [CHECKOUT] Order created:', {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
      });

      // ================================================================
      // STEP 3: Create order items
      // ================================================================
      console.log('📋 [CHECKOUT] Step 3: Creating order items...', {
        itemCount: storeItems.length,
      });

      const orderItems = storeItems.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name: item.name,
        variant_name: item.variantName || null,
        sku: null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ [CHECKOUT] Order items creation failed:', itemsError);
        throw itemsError;
      }

      console.log('✅ [CHECKOUT] Order items created successfully');

      // ================================================================
      // STEP 4: Update customer stats (fixed increment logic)
      // ================================================================
      console.log('📊 [CHECKOUT] Step 4: Updating customer stats...');

      // First, get current customer stats
      const { data: currentCustomer } = await supabase
        .from('customers')
        .select('total_orders, total_spent')
        .eq('id', customerId)
        .single();

      // Now increment properly
      const newTotalOrders = (currentCustomer?.total_orders || 0) + 1;
      const newTotalSpent = (currentCustomer?.total_spent || 0) + orderTotal;

      await supabase
        .from('customers')
        .update({
          total_orders: newTotalOrders,
          total_spent: newTotalSpent,
        })
        .eq('id', customerId);

      console.log('✅ [CHECKOUT] Customer stats updated:', {
        total_orders: newTotalOrders,
        total_spent: newTotalSpent,
      });

      // ================================================================
      // SUCCESS! Show order confirmation
      // ================================================================
      console.log('🎉 [CHECKOUT] Checkout complete!', {
        order_id: order.id,
        order_number: newOrderNumber,
        total: orderTotal,
      });

      setOrderNumber(newOrderNumber);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');

    } catch (error: any) {
      console.error('❌ [CHECKOUT] CHECKOUT FAILED:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================================================================
  // ORDER CONFIRMATION VIEW
  // ================================================================
  if (orderComplete) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-4">
              Thank you for your order. We'll contact you shortly.
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-xl font-mono font-bold">{orderNumber}</p>
            </div>
            <Link to={`/store/${storeSlug}/catalog`}>
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ================================================================
  // EMPTY CART VIEW
  // ================================================================
  if (storeItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-4">Add some products before checkout</p>
          <Link to={`/store/${storeSlug}/catalog`}>
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ================================================================
  // CHECKOUT FORM VIEW
  // ================================================================
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Navigation */}
      <Link to={`/store/${storeSlug}/cart`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Cart
      </Link>

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      placeholder="John Doe"
                      required
                      maxLength={100}
                      className={formErrors.fullName ? 'border-destructive' : ''}
                    />
                    {formErrors.fullName && (
                      <p className="text-sm text-destructive">{formErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="+977 98XXXXXXXX"
                      required
                      maxLength={20}
                      className={formErrors.phone ? 'border-destructive' : ''}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-destructive">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="john@example.com"
                    required
                    maxLength={254}
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (formErrors.address) setFormErrors(prev => ({ ...prev, address: '' }));
                    }}
                    placeholder="Thamel, Kathmandu"
                    required
                    maxLength={200}
                    className={formErrors.address ? 'border-destructive' : ''}
                  />
                  {formErrors.address && (
                    <p className="text-sm text-destructive">{formErrors.address}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      if (formErrors.city) setFormErrors(prev => ({ ...prev, city: '' }));
                    }}
                    placeholder="Kathmandu"
                    required
                    maxLength={100}
                    className={formErrors.city ? 'border-destructive' : ''}
                  />
                  {formErrors.city && (
                    <p className="text-sm text-destructive">{formErrors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special instructions?"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{formData.notes.length}/500 characters</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {storeItems.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                      <span>
                        {item.name} {item.variantName && `(${item.variantName})`} × {item.quantity}
                      </span>
                      <span>रु {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>रु {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>रु {shippingAmount.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>रु {orderTotal.toLocaleString()}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
