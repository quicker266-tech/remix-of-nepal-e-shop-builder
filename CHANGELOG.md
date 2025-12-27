# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - 2025-12-27

### Documentation
- Added comprehensive JSDoc comments to all Store Builder editor components:
  - `EditorHeader.tsx` - Preview controls and publish actions
  - `SectionPalette.tsx` - Section type selection with icon mapping
  - `SectionList.tsx` - Drag-and-drop section management
  - `SectionEditor.tsx` - Section configuration with field renderers
  - `PageManager.tsx` - Page CRUD operations
  - `ThemeEditor.tsx` - Theme customization (colors, fonts, layout)
  - `PreviewFrame.tsx` - Live preview rendering
- Added JSDoc comments to Context files:
  - `AuthContext.tsx` - Authentication flow and role management
  - `StoreContext.tsx` - Multi-tenant store selection
  - `CartContext.tsx` - Shopping cart with localStorage persistence
- Added JSDoc comments to key pages:
  - `ProductForm.tsx` - Product create/edit with validation
  - `StoreCatalog.tsx` - Customer-facing product catalog

---

## [Unreleased]

### 2024-12-27 - Store Builder Visual Editor

#### Added
- **Database Schema** (`supabase/migrations/`)
  - `store_themes` - Store theme configuration (colors, typography, layout)
  - `store_pages` - Custom page management (homepage, about, contact, etc.)
  - `page_sections` - Drag-drop page sections with JSONB configuration
  - `store_navigation` - Header/footer navigation menus
  - `store_header_footer` - Global header/footer settings
  - All tables include RLS policies for security

- **Store Builder Components** (`src/components/store-builder/`)
  - `StoreBuilder.tsx` - Main editor container with tabs for sections/theme/pages
  - `types.ts` - TypeScript definitions for all section configurations
  - `constants.ts` - Section definitions, available fonts, default theme values

- **Editor Components** (`src/components/store-builder/editor/`)
  - `EditorHeader.tsx` - Top bar with preview modes (desktop/tablet/mobile), zoom, publish
  - `SectionPalette.tsx` - Collapsible palette to add new sections by category
  - `SectionList.tsx` - Drag-and-drop reorderable list of page sections
  - `SectionEditor.tsx` - Configuration panel for editing section properties
  - `PageManager.tsx` - Create, edit, delete store pages
  - `ThemeEditor.tsx` - Edit colors, fonts, and layout settings
  - `PreviewFrame.tsx` - Live preview with responsive viewport simulation

- **Custom Hooks** (`src/hooks/useStoreBuilder.ts`)
  - `useStoreTheme()` - Fetch and update store theme
  - `useStorePages()` - CRUD operations for pages
  - `usePageSections()` - CRUD operations for sections with reordering
  - `useStoreHeaderFooter()` - Header/footer configuration
  - `useStoreNavigation()` - Navigation menu management

- **Routing**
  - Added `/dashboard/store-builder` route in `App.tsx`
  - Added "Store Builder" link in `DashboardSidebar.tsx`

#### Section Types Supported
| Category | Sections |
|----------|----------|
| Hero | `hero_banner`, `hero_slider`, `hero_video` |
| Products | `featured_products`, `product_grid`, `product_carousel`, `new_arrivals`, `best_sellers` |
| Categories | `category_grid`, `category_banner` |
| Content | `text_block`, `image_text`, `gallery`, `testimonials`, `faq` |
| Marketing | `announcement_bar`, `newsletter`, `countdown`, `promo_banner`, `trust_badges`, `brand_logos` |
| Layout | `custom_html`, `spacer`, `divider` |

---

## File Structure

```
src/
├── components/
│   └── store-builder/
│       ├── StoreBuilder.tsx      # Main editor entry point
│       ├── types.ts              # TypeScript type definitions
│       ├── constants.ts          # Section definitions & defaults
│       └── editor/
│           ├── EditorHeader.tsx  # Top navigation bar
│           ├── SectionPalette.tsx # Add sections panel
│           ├── SectionList.tsx   # Section list with drag-drop
│           ├── SectionEditor.tsx # Section config form
│           ├── PageManager.tsx   # Page CRUD
│           ├── ThemeEditor.tsx   # Theme customization
│           └── PreviewFrame.tsx  # Live preview
├── hooks/
│   └── useStoreBuilder.ts        # Data management hooks
└── ...
```

---

## Developer Notes

### Adding a New Section Type

1. Add type to `SectionType` union in `types.ts`
2. Create config interface (e.g., `MyNewSectionConfig`) in `types.ts`
3. Add section definition in `constants.ts` with:
   - `type`, `label`, `icon`, `category`, `description`, `defaultConfig`
4. Add field renderer in `SectionEditor.tsx`
5. Add preview renderer in `PreviewFrame.tsx`

### Database Migrations
All migrations are in `supabase/migrations/`. They run automatically on deploy.

### RLS Policies
- Store members can manage their own store's data
- Public can view published pages of active stores
- Super admins have full access

---

## Previous Changes

_(Add earlier changes here as the project evolves)_
