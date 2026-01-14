/**
 * ============================================================================
 * STOREFRONT FOOTER COMPONENT
 * ============================================================================
 * 
 * Customer-facing footer with navigation links, social icons, and copyright.
 * Supports both subdomain and path-based routing modes.
 * 
 * ============================================================================
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  url?: string;
  page_id?: string;
  location: string;
  is_highlighted: boolean;
  open_in_new_tab: boolean;
}

interface FooterColumn {
  id: string;
  title: string;
  links: Array<{ label: string; url: string }>;
}

interface FooterConfig {
  layout?: 'simple' | 'multi-column' | 'minimal';
  showNewsletter?: boolean;
  showSocialLinks?: boolean;
  showPaymentIcons?: boolean;
  copyrightText?: string;
  backgroundColor?: string;
  textColor?: string;
  columns?: FooterColumn[];
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  pinterest?: string;
  linkedin?: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
}

interface StorefrontFooterProps {
  store: Store;
  footerConfig: FooterConfig;
  socialLinks: SocialLinks;
  navItems: NavItem[];
  isSubdomainMode?: boolean;
}

export function StorefrontFooter({ store, footerConfig, socialLinks, navItems, isSubdomainMode = false }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();
  const copyrightText = footerConfig.copyrightText || `© ${currentYear} ${store.name}. All rights reserved.`;

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

  const renderSocialLinks = () => {
    const socialIcons = [
      { key: 'facebook', icon: Facebook, url: socialLinks.facebook },
      { key: 'instagram', icon: Instagram, url: socialLinks.instagram },
      { key: 'twitter', icon: Twitter, url: socialLinks.twitter },
      { key: 'youtube', icon: Youtube, url: socialLinks.youtube },
      { key: 'linkedin', icon: Linkedin, url: socialLinks.linkedin },
    ].filter(s => s.url);

    if (socialIcons.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        {socialIcons.map(({ key, icon: Icon, url }) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{key}</span>
          </a>
        ))}
      </div>
    );
  };

  const renderNewsletter = () => (
    <div className="space-y-2">
      <h4 className="font-semibold">Stay Updated</h4>
      <p className="text-sm text-muted-foreground">
        Subscribe to our newsletter for updates and offers.
      </p>
      <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <Input 
          type="email" 
          placeholder="Enter your email" 
          className="flex-1"
        />
        <Button type="submit">Subscribe</Button>
      </form>
    </div>
  );

  // Minimal layout
  if (footerConfig.layout === 'minimal') {
    return (
      <footer 
        className="bg-muted/50 border-t border-border py-6"
        style={{
          backgroundColor: footerConfig.backgroundColor,
          color: footerConfig.textColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{copyrightText}</p>
            {footerConfig.showSocialLinks && renderSocialLinks()}
          </div>
        </div>
      </footer>
    );
  }

  // Simple layout
  if (footerConfig.layout === 'simple') {
    return (
      <footer 
        className="bg-muted/50 border-t border-border py-8"
        style={{
          backgroundColor: footerConfig.backgroundColor,
          color: footerConfig.textColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo/Name */}
            <Link to={buildStoreUrl('/')} className="text-lg font-bold">
              {store.name}
            </Link>

            {/* Navigation Links */}
            {navItems.length > 0 && (
              <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {navItems.map(item => (
                  <Link
                    key={item.id}
                    to={getNavUrl(item)}
                    target={item.open_in_new_tab ? '_blank' : undefined}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Social Links */}
            {footerConfig.showSocialLinks && renderSocialLinks()}
          </div>

          <Separator className="my-6" />

          <p className="text-center text-sm text-muted-foreground">{copyrightText}</p>
        </div>
      </footer>
    );
  }

  // Multi-column layout (default)
  return (
    <footer 
      className="bg-muted/50 border-t border-border py-12"
      style={{
        backgroundColor: footerConfig.backgroundColor,
        color: footerConfig.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to={buildStoreUrl('/')} className="text-xl font-bold">
              {store.name}
            </Link>
            {footerConfig.showSocialLinks && renderSocialLinks()}
          </div>

          {/* Footer Columns from config */}
          {footerConfig.columns?.slice(0, 2).map(column => (
            <div key={column.id} className="space-y-4">
              <h4 className="font-semibold">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.url}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Navigation from database */}
          {navItems.length > 0 && !footerConfig.columns?.length && (
            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <ul className="space-y-2">
                {navItems.slice(0, 6).map(item => (
                  <li key={item.id}>
                    <Link
                      to={getNavUrl(item)}
                      target={item.open_in_new_tab ? '_blank' : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Newsletter */}
          {footerConfig.showNewsletter && renderNewsletter()}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{copyrightText}</p>
          
          {footerConfig.showPaymentIcons && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">Secure payments</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
