import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9"
        aria-label={ariaLabel ?? placeholder}
      />
    </div>
  );
}
