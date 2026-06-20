import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import {
  IoHomeOutline,
  IoInformationCircleOutline,
  IoMailOutline,
} from "react-icons/io5";
import { FaBlogger } from "react-icons/fa";
import { MdContactSupport } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Session } from "next-auth";
import type { CustomUser } from "@/types";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTranslation } from "@/providers/language/LanguageContext";
import { LanguageToggle } from "@/components/language/language-toggle";
import { ShoppingCart } from "lucide-react";
import useCartStore from "@/store/cartStore";
import { useStore } from "@/providers/store/StoreContext";
import { useRouter, usePathname } from "next/navigation";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { useCartUI } from "@/components/ui/CartUIContext";
import Cart from "@/components/ui/Cart";
import CategoryMenu from "@/components/ui/CategoryMenu";
import { cachedGet } from "@/utils/services/clientCache";

interface MobileMenuProps {
  isOpen: boolean;
  setMenuClose: () => void;
  setSearchOpen: (value: boolean) => void;
  searchTerm: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClose: () => void;
  firstTwelveItems: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
  }>;
  resultArr: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
  }>;
  productModile: boolean;
  setProductModile: (value: boolean) => void;
  setAdminPanelMob: (value: boolean) => void;
  session: (Session & { user?: CustomUser }) | null;
  user: CustomUser | undefined;
  adminPanelMob: boolean;
  isLoading?: boolean;
}

interface Category {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
  order: number;
}

// Common styles for navbar buttons
const navbarButtonStyles = {
  base: "flex items-center w-full text-lg transition-colors duration-200 py-2.5 px-3 rounded-lg",
  default: "text-muted-foreground hover:text-foreground hover:bg-accent",
  active: "text-foreground bg-accent",
  primary: "text-primary hover:text-primary/80 hover:bg-primary/10",
  danger: "text-red-500 hover:text-red-600 hover:bg-red-50/10",
  withIcon: "gap-3",
  divider: "mt-6 pt-6 border-t border-border",
};

const MobileMenu = ({
  isOpen,
  setMenuClose,
  setSearchOpen,
  searchTerm,
  handleChange,
  handleSearchClose,
  firstTwelveItems,
  resultArr = [],
  productModile,
  setProductModile,
  setAdminPanelMob,
  session,
  user,
  adminPanelMob,
  isLoading = false,
}: MobileMenuProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const { t, language } = useTranslation();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { settings } = useStore();
  const { openCart, closeCart, isOpen: isCartOpen } = useCartUI();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [isNavigating, setIsNavigating] = useState(false);
  const [menuWasOpen, setMenuWasOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      setError(null);
      const data = await cachedGet<Category[]>("/api/categories");
      setCategories(data); // API now returns array directly
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setError("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Initial fetch only
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryClick = async (categoryId: string) => {
    try {
      // First update the selected category
      setSelectedCategory(categoryId);
      setIsNavigating(true);

      // Build the path
      const path =
        categoryId === "All Categories"
          ? "/products"
          : `/products?category=${categoryId}`;

      // Close the menu
      handleMenuClose();

      // Force a hard navigation
      window.location.href = path;
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigating(false);
      // Show error to user
      alert(t("common.navigationError"));
    }
  };

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setMenuClose();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, setMenuClose]);

  const handleMenuClose = () => {
    setMenuWasOpen(isOpen); // Store menu state before closing
    setMenuClose();
    setShowSearch(false);
    handleSearchClose();
    setSearchOpen(false);
    // Reset search term
    handleChange({
      target: { value: "", name: "search" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const NavLink = ({
    href,
    onClick,
    className,
    variant = "default",
    isDivider = false,
    children,
  }: {
    href: string;
    onClick?: () => void;
    className?: string;
    variant?: "default" | "active" | "primary" | "danger";
    isDivider?: boolean;
    children: React.ReactNode;
  }) => (
    <li className={isDivider ? navbarButtonStyles.divider : ""}>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          navbarButtonStyles.base,
          navbarButtonStyles[variant],
          className
        )}
      >
        {children}
      </Link>
    </li>
  );

  const NavButton = ({
    onClick,
    className,
    variant = "default",
    isDivider = false,
    children,
  }: {
    onClick?: () => void;
    className?: string;
    variant?: "default" | "active" | "primary" | "danger";
    isDivider?: boolean;
    children: React.ReactNode;
  }) => (
    <li className={isDivider ? navbarButtonStyles.divider : ""}>
      <button
        onClick={onClick}
        className={cn(
          navbarButtonStyles.base,
          navbarButtonStyles[variant],
          className
        )}
      >
        {children}
      </button>
    </li>
  );

  // Categories Section JSX
  const categoriesSection = (
    <div className="border-t border-border/50 mt-4">
      <CategoryMenu
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategoryClick}
        isMobile={true}
      />
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 ${
          isOpen ? "visible" : "invisible pointer-events-none"
        }`}
        onClick={handleMenuClose}
      >
        <div
          className={`fixed top-0 left-0 h-full w-3/4 bg-white/60 dark:bg-black/60 shadow-lg transform transition-transform duration-500 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full bg-white/60 dark:bg-black/60">
            <div className="flex items-center justify-end pt-20 border-b border-black dark:border-white"></div>

            <div className="p-3 border-b border-black dark:border-white">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t("search.placeholder")}
                  className="w-full pl-9 h-9 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70"
                  value={searchTerm || ""}
                  onChange={handleChange}
                  name="search"
                />
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-white text-base" />
              </div>
              {searchTerm && firstTwelveItems.length > 0 && (
                <div className="mt-2 max-h-[300px] overflow-y-auto">
                  {firstTwelveItems.map((item) => (
                    <Link
                      key={item._id}
                      href={`/product/${item._id}`}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg"
                      onClick={handleMenuClose}
                    >
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {categoriesSection}

            <div className="overflow-y-auto max-h-[calc(100vh-120px)]">
              <nav className="p-2">
                {session?.user?.admin && (
                  <Button
                    onClick={() => {
                      setMenuClose();
                      setAdminPanelMob(true);
                    }}
                    variant="ghost"
                    className="w-full mt-4 bg-yellow-500 hover:bg-yellow-400 text-foreground dark:text-foreground transition-colors"
                  >
                    {t("navigation.adminPanel")}
                  </Button>
                )}
              </nav>

              {/* User Section */}
              <div className="p-2 mt-2">
                <div className="flex items-center justify-between border-b border-black dark:border-white pb-4">
                  <div className="flex items-center gap-4">
                    <Link
                      href="/"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-foreground hover:text-foreground/80 transition-colors"
                    >
                      <IoHomeOutline size={28} />
                    </Link>

                    <Link
                      href="/blog"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-foreground hover:text-foreground/80 transition-colors"
                    >
                      <FaBlogger size={24} />
                    </Link>

                    <Link
                      href="/about"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-foreground hover:text-foreground/80 transition-colors"
                    >
                      <IoInformationCircleOutline size={28} />
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-foreground hover:text-foreground/80 transition-colors"
                    >
                      <IoMailOutline size={28} />
                    </Link>
                    {session?.user && (
                      <div className="flex items-center gap-2 list-none">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={session.user.image || "/default-avatar.png"}
                            alt={session.user.name || "User"}
                          />
                          <AvatarFallback>
                            {session.user.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <NavLink
                          href="/profile"
                          onClick={() => {
                            setMenuClose();
                            if (productModile) setProductModile(false);
                            if (adminPanelMob) setAdminPanelMob(false);
                          }}
                          className="text-foreground hover:text-foreground/80 hover:bg-accent"
                        >
                          {t("navigation.profile")}
                        </NavLink>
                      </div>
                    )}
                  </div>
                </div>
                {session?.user ? (
                  <ul className="space-y-1 list-none">
                    <button
                      onClick={async () => {
                        try {
                          // 1. Clear client-side cart
                          await clearCart();

                          // 2. Use NextAuth's signOut with redirect
                          await signOut({
                            callbackUrl: "/login",
                            redirect: true,
                          });

                          // 3. Clear all client storage
                          localStorage.clear();
                          sessionStorage.clear();
                        } catch (error) {
                          console.error("Logout failed:", error);
                          // Even on error, try to redirect
                          window.location.href = "/login";
                        }
                      }}
                      className="text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      {t("navigation.logout")}
                    </button>
                  </ul>
                ) : (
                  <div className="list-none">
                    <NavLink
                      href="/login"
                      onClick={() => {
                        setMenuClose();
                      }}
                      variant="primary"
                      className="text-foreground hover:text-foreground/80 hover:bg-accent"
                    >
                      {t("navigation.login")}
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isCartOpen && <Cart onClose={closeCart} isMobile={true} />}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default MobileMenu;
