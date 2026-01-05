/**
 * ============================================================================
 * SECTION PERMISSIONS UTILITY FUNCTIONS
 * ============================================================================
 * 
 * Utility functions for checking section permissions per page type.
 * Used by SectionPalette, StoreBuilder, and useStoreBuilder hook.
 * 
 * ============================================================================
 */

import { PageType, SectionType } from '../types';
import { PAGE_SECTION_PERMISSIONS, SECTION_DEFINITIONS } from '../constants';

/**
 * Check if a section type is allowed for a given page type
 */
export function isSectionTypeAllowed(
  sectionType: SectionType, 
  pageType: PageType
): boolean {
  const permissions = PAGE_SECTION_PERMISSIONS[pageType];
  
  if (!permissions) {
    console.warn(`[sectionPermissions] Unknown page type: ${pageType}`);
    return false;
  }
  
  if (permissions.allowedSectionTypes === 'all') {
    return true;
  }
  
  return permissions.allowedSectionTypes.includes(sectionType);
}

/**
 * Get all allowed section types for a page type
 * Excludes header/footer as they are managed separately
 */
export function getAllowedSectionTypes(pageType: PageType): SectionType[] {
  const permissions = PAGE_SECTION_PERMISSIONS[pageType];
  
  if (!permissions) {
    console.warn(`[sectionPermissions] Unknown page type: ${pageType}`);
    return [];
  }
  
  if (permissions.allowedSectionTypes === 'all') {
    // Return all section types except header/footer
    return (Object.keys(SECTION_DEFINITIONS) as SectionType[])
      .filter(type => type !== 'header' && type !== 'footer');
  }
  
  return permissions.allowedSectionTypes;
}

/**
 * Check if page allows any sections at all
 */
export function canPageHaveSections(pageType: PageType): boolean {
  const permissions = PAGE_SECTION_PERMISSIONS[pageType];
  
  if (!permissions) {
    return false;
  }
  
  if (permissions.maxSections === 0) return false;
  if (permissions.allowedSectionTypes === 'all') return true;
  return permissions.allowedSectionTypes.length > 0;
}

/**
 * Check if adding a section would exceed max limit
 */
export function canAddMoreSections(
  pageType: PageType, 
  currentSectionCount: number
): boolean {
  const permissions = PAGE_SECTION_PERMISSIONS[pageType];
  
  if (!permissions) {
    return false;
  }
  
  if (permissions.maxSections === null) return true;
  return currentSectionCount < permissions.maxSections;
}

/**
 * Get permission info for display in UI
 */
export function getPagePermissionInfo(pageType: PageType) {
  return PAGE_SECTION_PERMISSIONS[pageType] || {
    allowedSectionTypes: [],
    maxSections: 0,
    description: 'Unknown page type'
  };
}

/**
 * Get count of allowed section types for a page
 */
export function getAllowedSectionCount(pageType: PageType): number {
  return getAllowedSectionTypes(pageType).length;
}
