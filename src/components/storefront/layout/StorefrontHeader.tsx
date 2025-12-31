/**
 * ============================================================================
 * STOREFRONT HEADER COMPONENT
 * ============================================================================
 * 
 * Header for customer-facing storefront pages.
 * Features: Logo, navigation, search, cart icon.
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X,
  User,
  Home,
  Package,
  Info,
  Phone,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface StorefrontHeaderProps {
  store: {
    name: string;
    logo_url?: string | null;
    slug: string;
  };
  headerConfig?: {
    sticky?: boolean;
    showSearch?: boolean;
    showCart?: boolean;
    showAccount?: boolean;
    backgroundColor?: string;
    textColor?: string;
  };
}

export function StorefrontHeader({ store, headerConfig }: StorefrontHeaderProps) {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const config = headerConfig || {
    sticky: true,
    showSearch: true,
    showCart: true,
    showAccount: false,
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Default navigation links
  const navLinks = [
    { label: 'Home', href: `/store/${storeSlug}`, icon: Home },
    { label: 'Products', href: `/store/${storeSlug}/products`, icon: Package },
    { label: 'About', href: `/store/${storeSlug}/about`, icon: Info },
    { label: 'Contact', href: `/store/${storeSlug}/contact`, icon: Phone },
  ];

  return (
    <header 
      className={`bg-background border-b border-border ${config.sticky ? 'sticky top-0 z-50' : ''}`}
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to={`/store/${storeSlug}`} 
            className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors"
          >
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={store.name} 
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span>{store.name}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {config.showSearch && (
              <div className="hidden sm:block">
                {searchOpen ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="search" 
                      placeholder="Search products..." 
                      className="w-48"
                      autoFocus
                      onBlur={() => setSearchOpen(false)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSearchOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Account */}
            {config.showAccount && (
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Cart */}
            {config.showCart && (
              <Button 
                variant="ghost" 
                size="icon"
                className="relative"
                onClick={() => navigate(`/store/${storeSlug}/cart`)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-8">
                  {/* Mobile Search */}
                  {config.showSearch && (
                    <div className="px-2">
                      <Input 
                        type="search" 
                        placeholder="Search products..." 
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <Icon className="h-5 w-5" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
