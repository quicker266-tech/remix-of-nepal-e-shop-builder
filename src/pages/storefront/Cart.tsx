/**
 * ============================================================================
 * SHOPPING CART PAGE
 * ============================================================================
 * 
 * Displays cart items with quantity controls and checkout button.
 * Supports both subdomain and path-based routing modes.
 * 
 * ============================================================================
 */

import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useStorefrontOptional } from '@/contexts/StorefrontContext';
import { useStoreLinksWithFallback } from '@/hooks/useStoreLinks';

export default function Cart() {
  // Try StorefrontContext first (subdomain mode)
  const storefrontContext = useStorefrontOptional();
  
  // Get from URL params
  const { storeSlug: urlStoreSlug } = useParams();
  
  // Determine store slug
  const storeSlug = storefrontContext?.storeSlug || urlStoreSlug;
  
  // Get link builder
  const links = useStoreLinksWithFallback(storeSlug || '');
  
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();

  // Filter items by current store slug to prevent cross-store cart bleeding
  const storeItems = items.filter(item => item.storeSlug === storeSlug);

  if (storeItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link to={links.home()}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="font-semibold">Shopping Cart</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some products to get started
            </p>
            <Link to={links.home()}>
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={links.home()}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="font-semibold">Shopping Cart</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
              Clear All
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {storeItems.map((item) => (
              <Card key={`${item.productId}-${item.variantId}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">{item.variantName}</p>
                      )}
                      <p className="font-semibold text-primary mt-1">
                        रु {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>रु {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">रु {cartTotal.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(links.checkout())}
                >
                  Proceed to Checkout
                </Button>
                <Link to={links.home()} className="w-full">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
