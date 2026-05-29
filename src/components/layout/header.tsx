"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Copy, LogOut, Menu, Home, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/auth/session-context";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Funde", icon: Home },
  { href: "/upload", label: "Hochladen", icon: Upload },
];

export function Header() {
  const pathname = usePathname();
  const { currentSession, logout } = useSession();

  async function copyInviteCode() {
    if (!currentSession) return;
    await navigator.clipboard?.writeText(currentSession.inviteCode);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-primary">Blue Prince</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2",
                  pathname === href && "text-primary"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          <Button
            type="button"
            variant={pathname === "/settings" ? "secondary" : "ghost"}
            size="icon-sm"
            title="Einstellungen"
            render={<Link href="/settings" aria-label="Einstellungen" />}
          >
            <Settings className="w-4 h-4" />
          </Button>
          {currentSession && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyInviteCode}
              className="gap-2"
              title="Invitecode kopieren"
            >
              <Badge variant="secondary" className="font-mono">
                {currentSession.inviteCode}
              </Badge>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="pt-10">
              <SheetHeader className="text-left px-6">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="px-4 py-4 space-y-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}>
                    <Button
                      variant={pathname === href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2",
                        pathname === href && "text-primary"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Button>
                  </Link>
                ))}
                <Link href="/settings">
                  <Button
                    variant={pathname === "/settings" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      pathname === "/settings" && "text-primary"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    Einstellungen
                  </Button>
                </Link>
                {currentSession && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start gap-2 font-mono"
                    onClick={copyInviteCode}
                  >
                    <Copy className="w-4 h-4" />
                    {currentSession.inviteCode}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
