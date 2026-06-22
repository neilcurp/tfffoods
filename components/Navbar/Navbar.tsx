/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { RxHamburgerMenu } from "react-icons/rx";
import CartIcon from "@/components/ui/CartIcon";
import ProductDrawer from "./ProductDrawer";
import AdminDrawer from "@/components/Navbar/AdminDrawer";
import MobileMenu from "@/components/Navbar/MobileMenu";
import NavbarLinks from "./NavbarLinks";
import UserSection from "./UserSection";
import SearchDrawer from "./SearchDrawer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageToggle } from "@/components/language/language-toggle";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useSearch } from "@/hooks/useSearch";
import type { CustomSession, SearchResult } from "@/types";
import { useStore } from "@/providers/store/StoreContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { IoMdClose } from "react-icons/io";
import HamburgerIcon from "@/components/ui/HamburgerIcon";

const Navbar = () => {
  const router = useRouter();
  const { data: session } = useSession() as { data: CustomSession | null };
  const { settings, isLoading } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [productModile, setProductModile] = useState(false);
  const [adminPanelMob, setAdminPanelMob] = useState(false);
  const { t, language } = useTranslation();

  const { searchTerm, resultArr, firstTwelveItems, handleChange, clearSearch } =
    useSearch();

  const user = session?.user;

  const setProductModile1 = () => {
    setProductModile(true);
  };

  const setAdminPanelMobile = () => {
    setAdminPanelMob(true);
  };

  const setMenuClose = () => {
    setIsOpen(!isOpen);
  };

  const handleSearchClick = () => {
    setSearchOpen(true);
    setProductOpen(false);
    setAdmin(false);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setIsOpen(false);
    clearSearch();
  };

  // Keep --navbar-height in sync with the real rendered navbar so fixed panels
  // (e.g. profile sidebar) sit flush below it. Static guesses (100px) were too
  // short because the logo is 96px plus padding/margins (~140px+).
  useEffect(() => {
    const navbar = document.getElementById("site-navbar");
    if (!navbar) return;

    const syncNavbarHeight = () => {
      const height = navbar.getBoundingClientRect().height;
      if (height > 0) {
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${Math.ceil(height)}px`
        );
      }
    };

    syncNavbarHeight();
    const observer = new ResizeObserver(syncNavbarHeight);
    observer.observe(navbar);
    window.addEventListener("resize", syncNavbarHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncNavbarHeight);
    };
  }, [isLoading, settings.logo]);

  return (
    <>
      {/* Desktop Navbar - Hidden on Mobile */}
      <nav className="hidden md:block sticky top-0 z-50">
        <div id="site-navbar" className="navbar app-global-container">
          <div className="navbar-content flex items-center justify-between">
            {/* Brand Container */}
            <div className="flex items-center">
              <div className="navbar-brand-container">
                <div className="navbar-brand">
                  {isLoading ? (
                    <LoadingSkeleton width="w-[75px]" height="h-[45px]" />
                  ) : (
                    <Image
                      alt={
                        typeof settings.storeName === "string"
                          ? settings.storeName
                          : settings.storeName[language]
                      }
                      onClick={() => router.push("/")}
                      src={settings.logo}
                      width={160}
                      height={96}
                      className="navbar-logo cursor-pointer"
                      priority
                    />
                  )}
                  {isLoading ? (
                    <LoadingSkeleton
                      width="w-32"
                      height="h-6"
                      className="ml-2"
                    />
                  ) : (
                    <h1
                      onClick={() => router.push("/")}
                      className="navbar-title cursor-pointer"
                    >
                      {typeof settings.storeName === "string"
                        ? settings.storeName
                        : settings.storeName[language]}
                    </h1>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-between ml-8">
              <div className="navbar-buttons-container">
                <NavbarLinks session={session} setAdmin={setAdmin} />
              </div>

              <div className="navbar-right-container">
                <div className="navbar-search-container">
                  <SearchDrawer
                    searchOpen={searchOpen}
                    setSearchOpen={setSearchOpen}
                    searchTerm={searchTerm}
                    handleChange={handleChange}
                    handleSearchClose={handleSearchClose}
                    firstTwelveItems={firstTwelveItems}
                    resultArr={resultArr}
                    isLoading={isLoading}
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-4">
                    <LoadingSkeleton width="w-8" height="h-8" rounded={true} />
                    <LoadingSkeleton width="w-8" height="h-8" rounded={true} />
                    <LoadingSkeleton width="w-8" height="h-8" rounded={true} />
                    <LoadingSkeleton width="w-8" height="h-8" rounded={true} />
                  </div>
                ) : (
                  <>
                    <CartIcon />
                    <ThemeToggle />
                    <LanguageToggle />
                    <UserSection session={session} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Logo - Only visible on mobile */}
      <div className="md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-50">
        {isLoading ? (
          <LoadingSkeleton width="w-[45px]" height="h-[30px]" />
        ) : (
          <Image
            alt={
              typeof settings.storeName === "string"
                ? settings.storeName
                : settings.storeName[language]
            }
            onClick={() => router.push("/")}
            src={settings.logo}
            width={45}
            height={30}
            className="cursor-pointer"
            priority
          />
        )}
      </div>

      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="ghost"
          size="sm"
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            isOpen
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={setMenuClose}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <HamburgerIcon isOpen={isOpen} />
        </Button>
      </div>

      {/* Mobile Action Icons - Only visible on mobile */}
      <div className="md:hidden fixed top-3 right-3 z-50 flex items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <LoadingSkeleton width="w-8" height="h-8" rounded={true} />
            <LoadingSkeleton width="w-8" height="h-8" rounded={true} />
            <LoadingSkeleton width="w-8" height="h-8" rounded={true} />
          </div>
        ) : (
          <>
            <CartIcon />
            <ThemeToggle />
            <LanguageToggle />
          </>
        )}
      </div>

      {/* Drawers */}
      <ProductDrawer
        isOpen={productOpen || productModile}
        onClose={() => {
          setProductOpen(false);
          setProductModile(false);
        }}
        productModile={productModile}
        setProductModile={setProductModile}
      />
      <AdminDrawer
        admin={admin || adminPanelMob}
        setAdmin={setAdmin}
        adminPanelMob={adminPanelMob}
        setAdminPanelMob={setAdminPanelMob}
      />
      <MobileMenu
        isOpen={isOpen}
        setMenuClose={setMenuClose}
        setSearchOpen={setSearchOpen}
        searchTerm={searchTerm.search}
        handleChange={handleChange}
        handleSearchClose={handleSearchClose}
        firstTwelveItems={firstTwelveItems}
        resultArr={resultArr}
        setProductModile={setProductModile1}
        productModile={productModile}
        setAdminPanelMob={setAdminPanelMobile}
        session={session}
        user={user}
        adminPanelMob={adminPanelMob}
        isLoading={isLoading}
      />
    </>
  );
};

export default Navbar;
