"use client";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "profile";

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "profile":
        return t("navigation.profile");
      case "orders":
        return t("navigation.orders");
      case "invoices":
        return t("navigation.invoices", "Invoices");
      case "wishlist":
        return t("wishlist.title");
      case "settings":
        return t("navigation.settings");
      default:
        return t("navigation.profile");
    }
  };

  return (
    <header className="group-has-[data-collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 border-b bg-background transition-[width,height] ease-linear md:mt-0 mt-14">
      <div className="flex w-full items-center h-full px-4 lg:px-6">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-3" />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="m-0 text-lg font-medium leading-none text-foreground">
            {getHeaderTitle()}
          </h1>
        </div>
      </div>
    </header>
  );
}
