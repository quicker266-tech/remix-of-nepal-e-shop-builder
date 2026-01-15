/**
 * ============================================================================
 * CUSTOMER ORDERS PAGE
 * ============================================================================
 * 
 * Shows complete order history for the customer at this store.
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStorefrontOptional } from '@/contexts/StorefrontContext';
import { useStoreLinksWithFallback } from '@/hooks/useStoreLinks';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_amount: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function CustomerOrders() {
  const storefrontContext = useStorefrontOptional();
  const { storeSlug: urlStoreSlug } = useParams();
  const navigate = useNavigate();
  
  const storeSlug = storefrontContext?.storeSlug || urlStoreSlug;
  const store = storefrontContext?.store;
  const links = useStoreLinksWithFallback(storeSlug || '');
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [store?.id]);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate(links.auth() + '?returnTo=account');
        return;
      }
      
      if (!store?.id) return;
      
      // Get customer ID for this store
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', store.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!customer) {
        setOrders([]);
        setLoading(false);
        return;
      }
      
      // Fetch orders with items
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          status, 
          subtotal, 
          shipping_amount, 
          total, 
          created_at,
          order_items (
            id,
            product_name,
            variant_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('store_id', store.id)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={links.account()}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">My Orders</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-4">
                When you place orders, they'll appear here
              </p>
              <Link to={links.home()}>
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <Collapsible 
                  open={expandedOrder === order.id}
                  onOpenChange={(open) => setExpandedOrder(open ? order.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{order.order_number}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'MMMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">रु {order.total.toLocaleString()}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          {expandedOrder === order.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-4 space-y-3">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div>
                              <span className="font-medium">{item.product_name}</span>
                              {item.variant_name && (
                                <span className="text-muted-foreground"> - {item.variant_name}</span>
                              )}
                              <span className="text-muted-foreground"> × {item.quantity}</span>
                            </div>
                            <span>रु {item.total_price.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-3 space-y-1 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>रु {order.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Shipping</span>
                            <span>रु {(order.shipping_amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>रु {order.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
