/**
 * ============================================================================
 * SHOPPING CART PAGE
 * ============================================================================
 *
 * Displays the shopping cart for the current store.
 * Filters items by storeSlug to show only items from this store.
 *
 * NOTE: Header/Footer are now rendered by StorefrontLayout (parent)
 * This component receives store data via useStorefrontContext()
 *
 * ============================================================================
 */

import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useStorefrontContext } from '@/components/storefront/StorefrontLayout';

export default function Cart() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { store } = useStorefrontContext();
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();

  // Filter items for current store only
  const storeItems = items.filter(item => item.storeSlug === storeSlug);

  // Calculate total for this store's items only
  const storeCartTotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (storeItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link to={`/store/${storeSlug}/catalog`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>

        <div className="py-16">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some products to get started
            </p>
            <Link to={`/store/${storeSlug}/catalog`}>
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link to={`/store/${storeSlug}/catalog`} className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>
        <Button variant="ghost" size="sm" onClick={() => clearCart()} className="text-destructive">
          Clear Cart
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

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
                <span>रु {storeCartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">रु {storeCartTotal.toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate(`/store/${storeSlug}/checkout`)}
              >
                Proceed to Checkout
              </Button>
              <Link to={`/store/${storeSlug}/catalog`} className="w-full">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
