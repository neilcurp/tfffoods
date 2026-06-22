"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserIcon, ShoppingBag, Heart, Settings, FileText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  variant?: "sidebar" | "inset";
}

export function AppSidebar({ variant = "sidebar" }: AppSidebarProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "profile";
  const { isMobile, setOpenMobile } = useSidebar();

  const handleTabChange = (tabId: string) => {
    router.push(`/profile?tab=${tabId}`);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!session?.user) return null;

  const navItems = [
    { id: "profile", label: t("navigation.profile"), icon: UserIcon },
    { id: "orders", label: t("navigation.orders"), icon: ShoppingBag },
    {
      id: "invoices",
      label: t("navigation.invoices", "Invoices"),
      icon: FileText,
    },
    { id: "wishlist", label: t("wishlist.title"), icon: Heart },
    { id: "settings", label: t("navigation.settings"), icon: Settings },
  ];

  return (
    <Sidebar
      variant={variant}
      className="mt-[100px] h-[calc(100vh-100px)] rounded-none text-sidebar-foreground md:mt-0 md:h-svh"
    >
      <div className="flex-1 overflow-auto">
        <SidebarMenu className="space-y-1 px-2 pt-10">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  size="lg"
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "h-11 text-base",
                    isActive
                      ? "bg-[#535C91] text-white hover:bg-[#424874] hover:text-white data-[active=true]:bg-[#535C91] data-[active=true]:text-white dark:bg-[#6B74A9] dark:hover:bg-[#535C91] dark:data-[active=true]:bg-[#6B74A9]"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </div>
      <Separator className="my-2 bg-sidebar-border" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-[#535C91] dark:border-[#6B74A9]">
            <AvatarImage
              src={session.user.profileImage || ""}
              alt={session.user.name || ""}
            />
            <AvatarFallback className="bg-[#535C91] text-md text-white dark:bg-[#6B74A9]">
              {session.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {session.user.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {session.user.email}
            </span>
            <div className="mt-0.5 flex gap-1">
              {session.user.admin && (
                <span className="rounded bg-[#535C91] px-1.5 py-0.5 text-[10px] text-white dark:bg-[#6B74A9]">
                  {t("navigation.admin")}
                </span>
              )}
              <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-sidebar-accent-foreground">
                {session.user.role.charAt(0).toUpperCase() +
                  session.user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
