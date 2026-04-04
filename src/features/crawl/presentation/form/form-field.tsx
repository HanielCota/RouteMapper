import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const formFieldVariants = cva("", {
  variants: {
    size: {
      sm: "space-y-1",
      md: "space-y-2",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface FormFieldProps extends VariantProps<typeof formFieldVariants> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  description,
  error,
  htmlFor,
  children,
  size,
  className,
}: FormFieldProps) {
  return (
    <div className={cn(formFieldVariants({ size }), className)}>
      <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <div>{children}</div>
      {description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-0.5 text-xs font-medium text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
