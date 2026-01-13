/**
 * ============================================================================
 * NAVIGATION EDITOR
 * ============================================================================
 * 
 * Manages navigation menu items for header or footer.
 * 
 * Features:
 * - Add/Edit/Delete navigation items
 * - Reorder with up/down buttons
 * - Link to internal pages or external URLs
 * - Parent-child relationships (dropdowns)
 * - Highlight as button option
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NavItem, StorePage, NavLocation } from '../types';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  FileText,
  GripVertical,
} from 'lucide-react';

interface NavigationEditorProps {
  storeId: string;
  navItems: NavItem[];
  pages: StorePage[];
  location: NavLocation;
  onAdd: (item: Partial<NavItem>) => Promise<NavItem | null>;
  onUpdate: (id: string, updates: Partial<NavItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (items: NavItem[]) => Promise<void>;
}

interface FormData {
  label: string;
  linkType: 'page' | 'external';
  pageId: string;
  url: string;
  parentId: string;
  openInNewTab: boolean;
  isHighlighted: boolean;
}

const defaultFormData: FormData = {
  label: '',
  linkType: 'page',
  pageId: '',
  url: '',
  parentId: '',
  openInNewTab: false,
  isHighlighted: false,
};

export function NavigationEditor({
  storeId,
  navItems,
  pages,
  location,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: NavigationEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter items by location and sort by sort_order
  const locationItems = navItems
    .filter((item) => item.location === location)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Get top-level items (no parent) for parent selector
  const topLevelItems = locationItems.filter((item) => !item.parent_id);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: NavItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      linkType: item.page_id ? 'page' : 'external',
      pageId: item.page_id || '',
      url: item.url || '',
      parentId: item.parent_id || '',
      openInNewTab: item.open_in_new_tab,
      isHighlighted: item.is_highlighted,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.label.trim()) return;

    setIsSubmitting(true);
    try {
      const itemData: Partial<NavItem> = {
        label: formData.label.trim(),
        location,
        page_id: formData.linkType === 'page' && formData.pageId ? formData.pageId : undefined,
        url: formData.linkType === 'external' && formData.url ? formData.url : undefined,
        parent_id: formData.parentId || undefined,
        open_in_new_tab: formData.openInNewTab,
        is_highlighted: formData.isHighlighted,
        sort_order: editingItem ? editingItem.sort_order : locationItems.length,
      };

      if (editingItem) {
        await onUpdate(editingItem.id, itemData);
      } else {
        await onAdd(itemData);
      }

      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    await onDelete(deleteItemId);
    setDeleteItemId(null);
  };

  const moveItem = async (item: NavItem, direction: 'up' | 'down') => {
    const currentIndex = locationItems.findIndex((i) => i.id === item.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= locationItems.length) return;

    const newItems = [...locationItems];
    [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];

    // Update sort_order
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    await onReorder(reorderedItems);
  };

  const getPageTitle = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    return page?.title || 'Unknown Page';
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <Button onClick={openAddDialog} variant="outline" size="sm" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Menu Item
      </Button>

      {/* Items List */}
      {locationItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">No navigation items yet.</p>
          <p className="text-xs mt-1">Click "Add Menu Item" to get started.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {locationItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors ${
                item.parent_id ? 'ml-6' : ''
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{item.label}</span>
                  {item.is_highlighted && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Button
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {item.page_id ? (
                    <>
                      <FileText className="h-3 w-3" />
                      <span className="truncate">{getPageTitle(item.page_id)}</span>
                    </>
                  ) : item.url ? (
                    <>
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{item.url}</span>
                    </>
                  ) : (
                    <span className="italic">No link</span>
                  )}
                </div>
              </div>

              {/* Reorder Buttons */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveItem(item, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveItem(item, 'down')}
                  disabled={index === locationItems.length - 1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Edit/Delete */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEditDialog(item)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteItemId(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="navLabel">Label *</Label>
              <Input
                id="navLabel"
                placeholder="e.g., Products, About Us"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            {/* Link Type */}
            <div className="space-y-2">
              <Label>Link To</Label>
              <RadioGroup
                value={formData.linkType}
                onValueChange={(value) =>
                  setFormData({ ...formData, linkType: value as 'page' | 'external' })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="page" id="link-page" />
                  <Label htmlFor="link-page" className="cursor-pointer">Internal Page</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external" id="link-external" />
                  <Label htmlFor="link-external" className="cursor-pointer">External URL</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Page Selector or URL Input */}
            {formData.linkType === 'page' ? (
              <div className="space-y-2">
                <Label htmlFor="navPage">Select Page</Label>
                <Select
                  value={formData.pageId}
                  onValueChange={(value) => setFormData({ ...formData, pageId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a page..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title} ({page.page_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="navUrl">URL</Label>
                <Input
                  id="navUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            )}

            {/* Parent Selector (for dropdowns) */}
            {!editingItem?.parent_id && topLevelItems.filter(i => i.id !== editingItem?.id).length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="navParent">Parent Menu (Optional)</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Top Level (no parent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Top Level (no parent)</SelectItem>
                    {topLevelItems
                      .filter((item) => item.id !== editingItem?.id)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          Under "{item.label}"
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="openNewTab" className="cursor-pointer">Open in new tab</Label>
                <Switch
                  id="openNewTab"
                  checked={formData.openInNewTab}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, openInNewTab: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="highlight" className="cursor-pointer">Highlight as button</Label>
                <Switch
                  id="highlight"
                  checked={formData.isHighlighted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isHighlighted: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.label.trim() || isSubmitting}>
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Navigation Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this menu item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default NavigationEditor;
