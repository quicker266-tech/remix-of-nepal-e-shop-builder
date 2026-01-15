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
import { BeeLoader } from '@/components/ui/bee-loader';

export default function StoreSwitcher() {
  const navigate = useNavigate();
  const { stores, currentStore, setCurrentStore, loading } = useStore();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
        <BeeLoader size="sm" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant="outline"
          className="w-full justify-start bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
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
            className="w-full justify-between bg-sidebar-primary/10 border-sidebar-primary/30 text-sidebar-foreground hover:bg-sidebar-primary/20 hover:border-sidebar-primary/50 transition-all"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Store className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <div className="flex flex-col items-start truncate">
                <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 font-medium">Current Store</span>
                <span className="truncate font-semibold text-sidebar-foreground">{currentStore?.name || 'Select store'}</span>
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-sidebar-foreground/50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0 bg-card border border-border shadow-lg z-50" 
          align="start"
          sideOffset={4}
        >
          <Command className="bg-card">
            <CommandInput 
              placeholder="Search stores..." 
              className="border-b border-border"
            />
            <CommandList className="max-h-64">
              <CommandEmpty className="py-4 text-center text-muted-foreground">
                No store found.
              </CommandEmpty>
              <CommandGroup heading="Your Stores" className="text-muted-foreground">
                {stores.map((store) => (
                  <CommandItem
                    key={store.id}
                    value={store.name}
                    onSelect={() => {
                      setCurrentStore(store);
                      setOpen(false);
                    }}
                    className="cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
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
              <CommandSeparator className="bg-border" />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    navigate('/dashboard/create-store');
                    setOpen(false);
                  }}
                  className="cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground"
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
                    className="cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground"
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
