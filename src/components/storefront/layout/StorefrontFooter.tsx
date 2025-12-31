/**
 * ============================================================================
 * STOREFRONT FOOTER COMPONENT
 * ============================================================================
 * 
 * Footer for customer-facing storefront pages.
 * Features: Link columns, social links, copyright.
 * 
 * ============================================================================
 */

import { Link, useParams } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

interface StorefrontFooterProps {
  store: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
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
}

export function StorefrontFooter({ store, footerConfig, socialLinks }: StorefrontFooterProps) {
  const { storeSlug } = useParams();

  const config = footerConfig || {
    showSocialLinks: true,
  };

  const currentYear = new Date().getFullYear();
  const copyrightText = config.copyrightText || `© ${currentYear} ${store.name}. All rights reserved.`;

  // Default link columns
  const linkColumns = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', href: `/store/${storeSlug}/products` },
        { label: 'New Arrivals', href: `/store/${storeSlug}/products?sort=newest` },
        { label: 'Best Sellers', href: `/store/${storeSlug}/products?sort=popular` },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: `/store/${storeSlug}/about` },
        { label: 'Contact', href: `/store/${storeSlug}/contact` },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: `/store/${storeSlug}/faq` },
        { label: 'Shipping', href: `/store/${storeSlug}/shipping` },
        { label: 'Returns', href: `/store/${storeSlug}/returns` },
      ],
    },
  ];

  const socialIcons = [
    { key: 'facebook', icon: Facebook, url: socialLinks?.facebook },
    { key: 'instagram', icon: Instagram, url: socialLinks?.instagram },
    { key: 'twitter', icon: Twitter, url: socialLinks?.twitter },
    { key: 'youtube', icon: Youtube, url: socialLinks?.youtube },
  ].filter(s => s.url);

  return (
    <footer 
      className="bg-muted/50 border-t border-border"
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold text-lg text-foreground mb-4">{store.name}</h3>
            {store.email && (
              <p className="text-sm text-muted-foreground mb-2">
                <a href={`mailto:${store.email}`} className="hover:text-foreground transition-colors">
                  {store.email}
                </a>
              </p>
            )}
            {store.phone && (
              <p className="text-sm text-muted-foreground mb-2">
                <a href={`tel:${store.phone}`} className="hover:text-foreground transition-colors">
                  {store.phone}
                </a>
              </p>
            )}
            {store.address && (
              <p className="text-sm text-muted-foreground">{store.address}</p>
            )}

            {/* Social Links */}
            {config.showSocialLinks && socialIcons.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialIcons.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {linkColumns.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold text-sm text-foreground mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
