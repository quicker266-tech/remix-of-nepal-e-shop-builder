import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Package, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;
type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;
type OrderWithItems = Order & { items: OrderItem[] };

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStore } = useStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  useEffect(() => {
    if (currentStore && id) {
      fetchCustomerData();
    }
  }, [currentStore, id]);

  const fetchCustomerData = async () => {
    if (!currentStore || !id) return;

    try {
      const [customerResult, ordersResult] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .eq('store_id', currentStore.id)
          .single(),
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', id)
          .eq('store_id', currentStore.id)
          .order('created_at', { ascending: false }),
      ]);

      if (customerResult.error) throw customerResult.error;
      if (ordersResult.error) throw ordersResult.error;

      setCustomer(customerResult.data);

      // Fetch order items for all orders
      const orderIds = ordersResult.data?.map(o => o.id) || [];
      let ordersWithItems: OrderWithItems[] = [];

      if (orderIds.length > 0) {
        const { data: allItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Group items by order_id
        const itemsByOrder = (allItems || []).reduce((acc, item) => {
          acc[item.order_id] = acc[item.order_id] || [];
          acc[item.order_id].push(item);
          return acc;
        }, {} as Record<string, OrderItem[]>);

        // Merge items into orders
        ordersWithItems = (ordersResult.data || []).map(order => ({
          ...order,
          items: itemsByOrder[order.id] || []
        }));
      }

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer');
      navigate('/dashboard/customers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      processing: { variant: 'default', label: 'Processing' },
      shipped: { variant: 'default', label: 'Shipped' },
      delivered: { variant: 'default', label: 'Delivered' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = badges[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Customer not found</p>
        <Link to="/dashboard/customers">
          <Button className="mt-4">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/customers')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{customer.full_name || 'Guest Customer'}</h1>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.total_orders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">रु {Number(customer.total_spent || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customer Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(customer.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <div>{customer.address}</div>
                {customer.city && <div className="text-sm text-muted-foreground">{customer.city}</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order History</CardTitle>
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const shippingAddress = order.shipping_address as { name?: string; address?: string; city?: string; phone?: string } | null;
                const isExpanded = expandedOrders.has(order.id);

                return (
                  <div key={order.id} className="border rounded-lg overflow-hidden">
                    {/* Clickable Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-center"
                      onClick={() => toggleOrder(order.id)}
                    >
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">रु {Number(order.total).toLocaleString()}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <ChevronDown className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t p-4 space-y-4 bg-muted/20">
                        {/* Items */}
                        <div>
                          <h4 className="font-medium mb-3">Items</h4>
                          {order.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No items</p>
                          ) : (
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.product_name}</p>
                                    {item.variant_name && (
                                      <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                                    )}
                                    {item.sku && (
                                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                                    )}
                                  </div>
                                  <div className="text-right text-sm">
                                    <p>रु {Number(item.unit_price).toLocaleString()} x {item.quantity}</p>
                                    <p className="font-medium">रु {Number(item.total_price).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Order Summary */}
                        <div className="flex justify-end">
                          <div className="w-64 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>रु {Number(order.subtotal).toLocaleString()}</span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                              <div className="flex justify-between text-green-600">
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
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span>रु {Number(order.total).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        {shippingAddress && (
                          <div>
                            <h4 className="font-medium mb-2">Shipping Address</h4>
                            <div className="text-sm text-muted-foreground">
                              {shippingAddress.name && <p className="font-medium text-foreground">{shippingAddress.name}</p>}
                              {shippingAddress.address && <p>{shippingAddress.address}</p>}
                              {shippingAddress.city && <p>{shippingAddress.city}</p>}
                              {shippingAddress.phone && <p className="mt-1">{shippingAddress.phone}</p>}
                            </div>
                          </div>
                        )}

                        {/* Customer Notes */}
                        {order.notes && (
                          <div>
                            <h4 className="font-medium mb-2">Customer Notes</h4>
                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                          </div>
                        )}

                        {/* Link to full order page */}
                        <div className="pt-2">
                          <Link
                            to={`/dashboard/orders/${order.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View full order details →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
