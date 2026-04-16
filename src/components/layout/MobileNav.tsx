"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/LocaleProvider";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const t = useTranslation();

  const navLinks = [
    { href: "/explorar", label: t.common.explore },
    { href: "/rutas", label: t.common.routes },
    { href: "/pueblos-magicos", label: t.common.pueblosMagicos },
    { href: "/guias", label: t.common.guides },
  ];

  // Close drawer on navigation
  React.useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <MapPin className="h-5 w-5 text-terracotta" />
            <span className="font-display text-lg font-bold">
              Rutas <span className="text-terracotta">en MX</span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === link.href || pathname?.startsWith(link.href + "/")
                  ? "bg-terracotta/10 text-terracotta"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Separator />

        <div className="flex flex-col gap-2 px-6 py-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/iniciar-sesion">{t.common.login}</Link>
          </Button>
          <Button className="w-full" asChild>
            <Link href="/registrarse">{t.common.register}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
