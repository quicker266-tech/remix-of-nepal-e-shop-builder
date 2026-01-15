/**
 * ============================================================================
 * STOREFRONT HEADER COMPONENT
 * ============================================================================
 * 
 * Customer-facing header with navigation, logo, cart, and mobile menu.
 * Supports both subdomain and path-based routing modes.
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  Menu, 
  ShoppingCart, 
  Search, 
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  url?: string;
  page_id?: string;
  location: string;
  parent_id?: string;
  is_highlighted: boolean;
  open_in_new_tab: boolean;
  children?: NavItem[];
}

interface HeaderConfig {
  layout?: 'logo-left' | 'logo-center' | 'logo-right';
  sticky?: boolean;
  showSearch?: boolean;
  showCart?: boolean;
  showAccount?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface StorefrontHeaderProps {
  store: Store;
  headerConfig: HeaderConfig;
  navItems: NavItem[];
  isSubdomainMode?: boolean;
}

export function StorefrontHeader({ store, headerConfig, navItems, isSubdomainMode = false }: StorefrontHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter only top-level nav items (no parent)
  const topLevelItems = navItems.filter(item => !item.parent_id);

  // Build store-relative URL
  const buildStoreUrl = (path: string): string => {
    if (isSubdomainMode) {
      return path;
    }
    return `/store/${store.slug}${path}`;
  };

  // Build navigation URL
  const getNavUrl = (item: NavItem): string => {
    if (item.url) return item.url;
    if (item.page_id) return buildStoreUrl(`/page/${item.page_id}`);
    return '#';
  };

  // Get children for a parent item
  const getChildren = (parentId: string): NavItem[] => {
    return navItems.filter(item => item.parent_id === parentId);
  };

  const renderDesktopNav = () => (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {topLevelItems.map(item => {
          const children = getChildren(item.id);
          
          if (children.length > 0) {
            return (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuTrigger className="bg-transparent">
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-48 gap-1 p-2">
                    {children.map(child => (
                      <li key={child.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={getNavUrl(child)}
                            target={child.open_in_new_tab ? '_blank' : undefined}
                            className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            {child.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={item.id}>
              <Link
                to={getNavUrl(item)}
                target={item.open_in_new_tab ? '_blank' : undefined}
                className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  item.is_highlighted && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {item.label}
              </Link>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );

  const renderMobileNav = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex items-center justify-between mb-6">
          <Link to={buildStoreUrl('/')} onClick={() => setMobileMenuOpen(false)}>
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-8" />
            ) : (
              <span className="text-lg font-bold">{store.name}</span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col space-y-1">
          {topLevelItems.map(item => {
            const children = getChildren(item.id);
            
            return (
              <div key={item.id}>
                <Link
                  to={getNavUrl(item)}
                  target={item.open_in_new_tab ? '_blank' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    item.is_highlighted && "bg-primary text-primary-foreground"
                  )}
                >
                  {item.label}
                </Link>
                
                {children.length > 0 && (
                  <div className="pl-4 mt-1 space-y-1">
                    {children.map(child => (
                      <Link
                        key={child.id}
                        to={getNavUrl(child)}
                        target={child.open_in_new_tab ? '_blank' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1.5 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );

  const justifyClass = {
    'logo-left': 'justify-between',
    'logo-center': 'justify-center',
    'logo-right': 'justify-between flex-row-reverse',
  }[headerConfig.layout || 'logo-left'];

  return (
    <header 
      className={cn(
        "bg-background border-b border-border",
        headerConfig.sticky && "sticky top-0 z-50"
      )}
      style={{
        backgroundColor: headerConfig.backgroundColor,
        color: headerConfig.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={cn("flex items-center h-16", justifyClass)}>
          {/* Mobile Menu Button */}
          {renderMobileNav()}

          {/* Logo */}
          <Link to={buildStoreUrl('/')} className="flex items-center">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-8 md:h-10" />
            ) : (
              <span className="text-xl font-bold text-foreground">{store.name}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          {headerConfig.layout !== 'logo-center' && renderDesktopNav()}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {headerConfig.showSearch && (
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}
            
            {headerConfig.showAccount && (
              <Link to={buildStoreUrl('/account')}>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </Link>
            )}
            
            {headerConfig.showCart && (
              <Link to={buildStoreUrl('/cart')}>
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="sr-only">Cart</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Centered Navigation (for logo-center layout) */}
        {headerConfig.layout === 'logo-center' && (
          <div className="hidden md:flex justify-center pb-4">
            {renderDesktopNav()}
          </div>
        )}
      </div>
    </header>
  );
}
