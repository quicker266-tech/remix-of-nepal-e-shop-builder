import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface ShippingZone {
  id: string;
  name: string;
  rate: number;
  cities: string[];
}

interface ShippingSettings {
  enable_shipping: boolean;
  free_shipping_threshold: number | null;
  default_shipping_rate: number;
  shipping_zones: ShippingZone[];
}

export default function Checkout() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { items, cartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [shippingAmount, setShippingAmount] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });

  useEffect(() => {
    if (storeSlug) {
      fetchShippingSettings();
    }
  }, [storeSlug]);

  useEffect(() => {
    if (shippingSettings && formData.city) {
      calculateShipping();
    }
  }, [shippingSettings, formData.city, cartTotal]);

  const fetchShippingSettings = async () => {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', storeSlug)
        .single();

      if (!storeData) return;

      const { data } = await supabase
        .from('store_shipping_settings')
        .select('*')
        .eq('store_id', storeData.id)
        .maybeSingle();

      if (data) {
        setShippingSettings({
          enable_shipping: data.enable_shipping ?? true,
          free_shipping_threshold: data.free_shipping_threshold,
          default_shipping_rate: data.default_shipping_rate ?? 0,
          shipping_zones: (data.shipping_zones as unknown as ShippingZone[]) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching shipping settings:', error);
    }
  };

  const calculateShipping = () => {
    if (!shippingSettings || !shippingSettings.enable_shipping) {
      setShippingAmount(0);
      return;
    }

    // Check free shipping threshold
    if (shippingSettings.free_shipping_threshold && cartTotal >= shippingSettings.free_shipping_threshold) {
      setShippingAmount(0);
      return;
    }

    // Find matching zone
    const customerCity = formData.city.toLowerCase().trim();
    const matchingZone = shippingSettings.shipping_zones.find(zone =>
      zone.cities.some(city => city.toLowerCase().trim() === customerCity)
    );

    if (matchingZone) {
      setShippingAmount(matchingZone.rate);
    } else {
      setShippingAmount(shippingSettings.default_shipping_rate);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const orderTotal = cartTotal + shippingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get store ID from slug
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', storeSlug)
        .single();

      if (storeError || !storeData) {
        throw new Error('Store not found');
      }

      const newOrderNumber = generateOrderNumber();

      // Create or update customer using secure RPC function
      const { data: customerId, error: customerError } = await supabase
        .rpc('create_or_update_checkout_customer', {
          p_store_id: storeData.id,
          p_email: formData.email,
          p_full_name: formData.fullName,
          p_phone: formData.phone,
          p_address: formData.address,
          p_city: formData.city,
        });

      if (customerError) throw customerError;
      if (!customerId) throw new Error('Failed to create customer');

      // Create the order
      const shippingAddress = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
      };

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeData.id,
          customer_id: customerId,
          order_number: newOrderNumber,
          status: 'pending',
          subtotal: cartTotal,
          shipping_amount: shippingAmount,
          discount_amount: 0,
          tax_amount: 0,
          total: orderTotal,
          shipping_address: shippingAddress as unknown as Json,
          notes: formData.notes || null,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Failed to create order');

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name: item.name,
        variant_name: item.variantName || null,
        sku: null,
        unit_price: item.price,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update customer stats
      await supabase
        .from('customers')
        .update({
          total_orders: (await supabase.from('customers').select('total_orders').eq('id', customerId).single()).data?.total_orders + 1 || 1,
          total_spent: (await supabase.from('customers').select('total_spent').eq('id', customerId).single()).data?.total_spent + orderTotal || orderTotal,
        })
        .eq('id', customerId);

      setOrderNumber(newOrderNumber);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
            <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-4">
              Thank you for your order. We'll contact you shortly.
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-xl font-mono font-bold">{orderNumber}</p>
            </div>
            <Link to={`/store/${storeSlug}`}>
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
          <Link to={`/store/${storeSlug}`}>
            <Button>Back to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/store/${storeSlug}/cart`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+977 98XXXXXXXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Kathmandu"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Special instructions for delivery..."
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                    />
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
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} {item.variantName && `(${item.variantName})`} × {item.quantity}
                      </span>
                      <span>रु {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator />
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>रु {cartTotal.toLocaleString()}</span>
                  </div>
                  
                  {shippingSettings?.enable_shipping && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        Shipping
                        {shippingAmount === 0 && shippingSettings.free_shipping_threshold && cartTotal >= shippingSettings.free_shipping_threshold && (
                          <span className="text-xs text-success">(Free)</span>
                        )}
                      </span>
                      <span>
                        {shippingAmount > 0 ? `रु ${shippingAmount.toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                  )}
                  
                  {shippingSettings?.free_shipping_threshold && cartTotal < shippingSettings.free_shipping_threshold && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      Add रु {(shippingSettings.free_shipping_threshold - cartTotal).toLocaleString()} more for free shipping!
                    </p>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">रु {orderTotal.toLocaleString()}</span>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Place Order
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Payment: Cash on Delivery
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
