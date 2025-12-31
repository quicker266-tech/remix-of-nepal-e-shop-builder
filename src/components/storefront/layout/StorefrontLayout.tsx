/**
 * ============================================================================
 * STOREFRONT LAYOUT COMPONENT
 * ============================================================================
 * 
 * Main layout wrapper for all customer-facing storefront pages.
 * Provides consistent header, footer, and main content area.
 * 
 * ============================================================================
 */

import { ReactNode } from 'react';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';

interface StorefrontLayoutProps {
  children: ReactNode;
  store: {
    name: string;
    logo_url?: string | null;
    slug: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  headerConfig?: {
    sticky?: boolean;
    showSearch?: boolean;
    showCart?: boolean;
    showAccount?: boolean;
    backgroundColor?: string;
    textColor?: string;
  };
  footerConfig?: {
    showNewsletter?: boolean;
    showSocialLinks?: boolean;
    copyrightText?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  showHeader?: boolean;
  showFooter?: boolean;
}

export function StorefrontLayout({ 
  children, 
  store, 
  headerConfig,
  footerConfig,
  socialLinks,
  showHeader = true,
  showFooter = true,
}: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && (
        <StorefrontHeader store={store} headerConfig={headerConfig} />
      )}
      
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && (
        <StorefrontFooter 
          store={store} 
          footerConfig={footerConfig} 
          socialLinks={socialLinks}
        />
      )}
    </div>
  );
}
