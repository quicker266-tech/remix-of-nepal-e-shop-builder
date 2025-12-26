import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Plus, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useStore } from '@/contexts/StoreContext';

export default function StoreSwitcher() {
  const navigate = useNavigate();
  const { stores, currentStore, setCurrentStore, loading } = useStore();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-4 border-b border-sidebar-border">
        <div className="h-10 bg-sidebar-accent/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant="outline"
          className="w-full justify-start bg-sidebar-accent/50 border-sidebar-border"
          onClick={() => navigate('/dashboard/create-store')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Store
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-sidebar-border">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 bg-sidebar-primary rounded flex items-center justify-center flex-shrink-0">
                <Store className="w-3 h-3 text-sidebar-primary-foreground" />
              </div>
              <span className="truncate">{currentStore?.name || 'Select store'}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Search stores..." />
            <CommandList>
              <CommandEmpty>No store found.</CommandEmpty>
              <CommandGroup heading="Your Stores">
                {stores.map((store) => (
                  <CommandItem
                    key={store.id}
                    value={store.name}
                    onSelect={() => {
                      setCurrentStore(store);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center mr-2">
                      <Store className="w-3 h-3 text-primary" />
                    </div>
                    <span className="flex-1 truncate">{store.name}</span>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        currentStore?.id === store.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    navigate('/dashboard/create-store');
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Store
                </CommandItem>
                {currentStore && (
                  <CommandItem
                    onSelect={() => {
                      navigate('/dashboard/settings');
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Store Settings
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
