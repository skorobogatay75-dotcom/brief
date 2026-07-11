"use client";

import { Button } from "@/components/ui/Button";

interface ExportExcelButtonProps {
  href: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "danger";
}

export function ExportExcelButton({
  href,
  label = "Скачать Excel",
  size = "sm",
  variant = "secondary",
}: ExportExcelButtonProps) {
  return (
    <a href={href} download>
      <Button type="button" variant={variant} size={size}>
        {label}
      </Button>
    </a>
  );
}
