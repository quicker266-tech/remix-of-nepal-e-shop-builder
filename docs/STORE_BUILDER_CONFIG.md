# Store Builder Configuration Guide

## Overview

This document explains the configuration format compatibility system used in the Store Builder's storefront section components.

## Current Implementation: Option B (Dual Format Support)

### The Problem

There's a mismatch between how the **SectionEditor** saves configuration and what the **storefront components** originally expected:

| Component | SectionEditor Saves (Flat) | Original Component Expected (Nested) |
|-----------|---------------------------|-------------------------------------|
| HeroBanner | `buttonText`, `buttonLink` | `primaryButton: { text, url }` |
| HeroBanner | `textAlignment` | `alignment` |
| HeroBanner | `backgroundOverlay` (0-100) | `overlayOpacity` (0-1) |
| HeroVideo | `buttonLink` | `buttonUrl` |
| HeroSlider | `slide.buttonLink` | `slide.buttonUrl` |

### The Solution

Storefront components now accept **BOTH** formats and normalize internally:

```typescript
// Example from HeroBanner.tsx
const overlayOpacity = config.backgroundOverlay !== undefined 
  ? config.backgroundOverlay / 100 
  : config.overlayOpacity ?? 0.5;

const alignment = config.textAlignment || config.alignment || "center";

const primaryButtonText = config.buttonText || config.primaryButton?.text;
const primaryButtonUrl = config.buttonLink || config.primaryButton?.url;
```

### Benefits of Option B

1. **Backward Compatibility**: Existing stored configs continue to work
2. **No Migration Required**: No database changes needed
3. **Low Risk**: Minimal code changes, isolated to component files
4. **Incremental**: Can migrate to Option A later when ready

## Affected Components

These components have been updated with dual-format support:

| Component | File | Aliases Added |
|-----------|------|---------------|
| HeroBanner | `src/components/storefront/sections/HeroBanner.tsx` | `buttonText`↔`primaryButton.text`, `buttonLink`↔`primaryButton.url`, `textAlignment`↔`alignment`, `backgroundOverlay`↔`overlayOpacity` |
| HeroVideo | `src/components/storefront/sections/HeroVideo.tsx` | `buttonLink`↔`buttonUrl` |
| HeroSlider | `src/components/storefront/sections/HeroSlider.tsx` | `slide.buttonLink`↔`slide.buttonUrl` |

## Future Migration: Option A (Unified Format)

When ready to migrate to a single format, follow these steps:

### Step 1: Update SectionEditor to Save Nested Format

Modify `src/components/store-builder/editor/SectionEditor.tsx`:

```typescript
// Before (flat):
function HeroBannerFields({ config, updateField }: FieldProps) {
  return (
    <Field label="Button Text">
      <Input 
        value={config.buttonText || ''} 
        onChange={(e) => updateField('buttonText', e.target.value)} 
      />
    </Field>
  );
}

// After (nested):
function HeroBannerFields({ config, updateField }: FieldProps) {
  const updateButton = (field: string, value: string) => {
    updateField('primaryButton', { 
      ...config.primaryButton, 
      [field]: value 
    });
  };
  
  return (
    <Field label="Button Text">
      <Input 
        value={config.primaryButton?.text || ''} 
        onChange={(e) => updateButton('text', e.target.value)} 
      />
    </Field>
  );
}
```

### Step 2: Create Database Migration

Create a migration to convert existing configs:

```sql
-- Migration: Convert flat HeroBanner config to nested format
UPDATE page_sections 
SET config = jsonb_set(
  jsonb_set(
    config - 'buttonText' - 'buttonLink' - 'secondaryButtonText' - 'secondaryButtonLink',
    '{primaryButton}',
    jsonb_build_object(
      'text', config->>'buttonText',
      'url', config->>'buttonLink'
    )
  ),
  '{secondaryButton}',
  jsonb_build_object(
    'text', config->>'secondaryButtonText',
    'url', config->>'secondaryButtonLink'
  )
)
WHERE section_type = 'hero_banner'
AND config ? 'buttonText';
```

### Step 3: Remove Fallbacks from Components

After migration is complete and verified, remove the dual-format support:

```typescript
// Before (dual support):
const primaryButtonText = config.buttonText || config.primaryButton?.text;

// After (nested only):
const primaryButtonText = config.primaryButton?.text;
```

## Config Field Reference

### HeroBanner

| SectionEditor Field | Storefront Field | Notes |
|---------------------|------------------|-------|
| `title` | `title` | ✓ Same |
| `subtitle` | `subtitle` | ✓ Same |
| `buttonText` | `primaryButton.text` | Aliased |
| `buttonLink` | `primaryButton.url` | Aliased |
| `secondaryButtonText` | `secondaryButton.text` | Aliased |
| `secondaryButtonLink` | `secondaryButton.url` | Aliased |
| `textAlignment` | `alignment` | Aliased |
| `backgroundOverlay` | `overlayOpacity` | Converted (÷100) |
| `backgroundImage` | `backgroundImage` | ✓ Same |
| `height` | `height` | ✓ Same |

### HeroVideo

| SectionEditor Field | Storefront Field | Notes |
|---------------------|------------------|-------|
| `videoUrl` | `videoUrl` | ✓ Same |
| `title` | `title` | ✓ Same |
| `subtitle` | `subtitle` | ✓ Same |
| `buttonText` | `buttonText` | ✓ Same |
| `buttonLink` | `buttonUrl` | Aliased |
| `muted` | `muted` | ✓ Same |
| `loop` | `loop` | ✓ Same |

### HeroSlider

| SectionEditor Field | Storefront Field | Notes |
|---------------------|------------------|-------|
| `slides[].title` | `slides[].title` | ✓ Same |
| `slides[].subtitle` | `slides[].subtitle` | ✓ Same |
| `slides[].backgroundImage` | `slides[].backgroundImage` | ✓ Same |
| `slides[].buttonText` | `slides[].buttonText` | ✓ Same |
| `slides[].buttonLink` | `slides[].buttonUrl` | Aliased |
| `autoplay` | `autoplay` | ✓ Same |
| `interval` | `interval` | ✓ Same |

## Adding New Sections

When creating new storefront section components:

1. **Check SectionEditor first**: Look at `renderSectionFields()` in `SectionEditor.tsx` to see what field names are used
2. **Match the flat format**: Use the same field names as SectionEditor
3. **Document any aliases**: If you need different internal names, add fallback support and document here

## Debugging Config Issues

If a section isn't displaying configured values:

1. **Check browser DevTools**: Log the `config` prop in the component
2. **Compare field names**: Verify SectionEditor field names match component expectations
3. **Check for typos**: Common issues include `buttonLink` vs `buttonUrl`, `textAlignment` vs `alignment`
4. **Verify database**: Query `page_sections` table to see actual stored config

```typescript
// Add temporary debug logging
export function HeroBanner({ config }: HeroBannerProps) {
  console.log('HeroBanner config:', config);
  // ...
}
```

## Related Files

- `src/components/store-builder/editor/SectionEditor.tsx` - Editor form fields
- `src/components/store-builder/constants.ts` - Default configs
- `src/components/storefront/sections/` - All storefront components
- `src/hooks/useStoreBuilder.ts` - Section CRUD operations
