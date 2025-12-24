import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export default function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentStore } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentStore && id) {
      fetchOrder();
    }
  }, [currentStore, id]);

  const fetchOrder = async () => {
    if (!currentStore || !id) return;

    try {
      const [orderResult, itemsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .eq('store_id', currentStore.id)
          .single(),
        supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id),
      ]);

      if (orderResult.error) throw orderResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setOrder(orderResult.data);
      setOrderItems(itemsResult.data || []);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
      navigate('/dashboard/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as Order['status'] })
        .eq('id', order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus as Order['status'] });
      toast.success('Order status updated');
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-info text-info-foreground">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-warning text-warning-foreground">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-success text-success-foreground">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const shippingAddress = order.shipping_address as { name?: string; address?: string; city?: string; phone?: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/orders')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Order {order.order_number}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No items in this order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-4 border-b last:border-0">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">SKU: {item.sku || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">रु {Number(item.unit_price).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.internal_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={order.status} onValueChange={updateOrderStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>रु {Number(order.subtotal).toLocaleString()}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-रु {Number(order.discount_amount).toLocaleString()}</span>
                </div>
              )}
              {Number(order.shipping_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>रु {Number(order.shipping_amount).toLocaleString()}</span>
                </div>
              )}
              {Number(order.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>रु {Number(order.tax_amount).toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>रु {Number(order.total).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{shippingAddress.name}</p>
                <p className="text-muted-foreground">{shippingAddress.address}</p>
                <p className="text-muted-foreground">{shippingAddress.city}</p>
                {shippingAddress.phone && (
                  <p className="text-muted-foreground mt-2">{shippingAddress.phone}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
