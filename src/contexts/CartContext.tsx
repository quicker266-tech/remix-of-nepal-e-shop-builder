/**
 * ============================================================================
 * CART CONTEXT
 * ============================================================================
 * 
 * Manages shopping cart state for customer-facing storefront.
 * Persists cart to localStorage for session continuity.
 * 
 * ARCHITECTURE:
 * - Cart items are stored in React state
 * - localStorage is synced on every change
 * - Items are identified by productId + variantId combination
 * - Cart state is global (works across store pages)
 * 
 * ITEM MATCHING:
 * Items are uniquely identified by the combination of productId AND variantId.
 * This allows the same product with different variants to exist as separate items.
 * Example: "T-Shirt (Red, Large)" and "T-Shirt (Blue, Medium)" are separate items.
 * 
 * PERSISTENCE:
 * Cart is saved to localStorage under the key 'cart'.
 * This persists across page refreshes and browser sessions.
 * Note: Cart is NOT tied to user account (anonymous cart).
 * 
 * USAGE:
 * ```tsx
 * const { items, addToCart, cartTotal } = useCart();
 * 
 * // Add item
 * addToCart({
 *   productId: 'abc123',
 *   variantId: 'variant456',
 *   name: 'T-Shirt',
 *   variantName: 'Red / Large',
 *   price: 29.99,
 *   quantity: 1,
 *   image: 'https://...'
 * });
 * ```
 * 
 * ============================================================================
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Cart item data structure
 * 
 * @property productId - ID of the product
 * @property variantId - ID of the variant (null for products without variants)
 * @property name - Product name for display
 * @property variantName - Variant name for display (e.g., "Red / Large")
 * @property price - Unit price at time of adding
 * @property quantity - Number of this item in cart
 * @property image - Product image URL for cart display
 */
interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  price: number;
  quantity: number;
  image: string | null;
}

/**
 * Shape of the cart context
 * 
 * @property items - Array of items currently in cart
 * @property addToCart - Add an item (or increment if exists)
 * @property removeFromCart - Remove an item completely
 * @property updateQuantity - Change quantity of an item
 * @property clearCart - Empty the cart
 * @property cartItemCount - Total number of items (sum of quantities)
 * @property cartTotal - Total price of all items
 */
interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Cart Provider Component
 * Wraps the storefront and provides cart state
 */
export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize cart from localStorage (if available)
  const [items, setItems] = useState<CartItem[]>(() => {
    // SSR safety check
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Sync cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  /**
   * Add an item to the cart
   * If item already exists (same productId + variantId), increment quantity
   * Otherwise, add as new item
   */
  const addToCart = (newItem: CartItem) => {
    setItems(prevItems => {
      // Find existing item with same product and variant
      const existingIndex = prevItems.findIndex(
        item => item.productId === newItem.productId && item.variantId === newItem.variantId
      );

      if (existingIndex >= 0) {
        // Item exists - increment quantity
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }

      // Item doesn't exist - add to cart
      return [...prevItems, newItem];
    });
  };

  /**
   * Remove an item from the cart completely
   * Matches by productId + variantId combination
   */
  const removeFromCart = (productId: string, variantId: string | null) => {
    setItems(prevItems => 
      prevItems.filter(item => !(item.productId === productId && item.variantId === variantId))
    );
  };

  /**
   * Update the quantity of an item
   * If quantity is less than 1, removes the item
   */
  const updateQuantity = (productId: string, variantId: string | null, quantity: number) => {
    // Remove item if quantity drops below 1
    if (quantity < 1) {
      removeFromCart(productId, variantId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  /**
   * Clear all items from the cart
   * Typically called after successful checkout
   */
  const clearCart = () => {
    setItems([]);
  };

  // ================================================================
  // COMPUTED VALUES
  // ================================================================

  // Total number of items (sum of all quantities)
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Total price (sum of price * quantity for each item)
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartItemCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook to access cart context
 * Must be used within a CartProvider
 * 
 * @throws Error if used outside of CartProvider
 * 
 * @example
 * ```tsx
 * function CartIcon() {
 *   const { cartItemCount } = useCart();
 *   return <Badge>{cartItemCount}</Badge>;
 * }
 * ```
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
