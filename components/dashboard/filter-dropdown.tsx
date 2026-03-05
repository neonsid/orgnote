import { useState, memo } from "react";
import { CheckCircle2, Circle, ListFilter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "read" | "unread";

const FILTER_OPTIONS: {
  value: FilterType;
  label: string;
  icon: typeof Circle;
}[] = [
  { value: "all", label: "All", icon: ListFilter },
  { value: "read", label: "Read", icon: CheckCircle2 },
  { value: "unread", label: "Not Read", icon: Circle },
];

interface FilterDropdownProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
}

export const FilterDropdown = memo(function FilterDropdown({
  value,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = FILTER_OPTIONS.find((o) => o.value === value);
  const Icon = selectedOption?.icon || ListFilter;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
            open && "bg-accent",
          )}
        >
          <Icon className="size-4" />
          <span className="sm:inline">{selectedOption?.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        {FILTER_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors",
                value === option.value && "bg-accent",
              )}
            >
              <OptionIcon className="size-4" />
              {option.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
});
