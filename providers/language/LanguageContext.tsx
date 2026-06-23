"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "@/types/language";
import { translationLoader } from "@/utils/translationLoader";

type TranslationValue = string | { [key: string]: TranslationValue };

interface TranslationsType {
  [key: string]: TranslationValue;
}

interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  getMultiLangValue: (key: string) => MultiLangValue;
  isLoading: boolean;
}

// Default translations for SSR
const defaultTranslations: Record<string, TranslationsType> = {
  common: {
    loading: "Loading...",
    error: "Error",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    noResults: "No results found",
    allCategories: "All Categories",
    all: "All",
    previous: "Previous",
    pagination: "Page {{current}} of {{total}}",
    next: "Next",
    pageNotFound: "Page Not Found",
    pageNotFoundDesc: "The page you are looking for does not exist.",
    backToHome: "Back to Home",
  },
  auth: {
    loginRequired: "Login Required",
    loginToAddToCart: "Please login to add items to cart",
    login: "Login",
    createAccount: "Create Account",
  },
  navigation: {
    products: "Products",
    about: "About",
    contact: "Contact",
    blog: "Blog",
  },
  admin: {
    dashboard: { title: "Dashboard" },
    products: { title: "Products" },
    categories: { title: "Categories" },
    specifications: { title: "Specifications" },
    users: { title: "Users" },
    brands: { title: "Brands" },
    newsletter: { title: "Newsletter" },
    logistics: { title: "Logistics" },
    blog: { title: "Blog" },
    guarantee: { title: "Guarantee" },
    features: { title: "Features" },
    settings: { title: "Settings" },
    privacy: { title: "Privacy Policy" },
    periodUsers: { title: "Period Users" },
  },
  "admin-orders": {
    title: "Orders",
    filter: { status: "Filter by Status" },
    status: {
      pending: "Pending",
      processing: "Processing",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },
    type: {
      oneTime: "One-time Order",
      period: "Period Order",
    },
    payment: {
      rejectPrompt: "Are you sure you want to reject this payment?",
    },
    actions: {
      reject: "Reject",
    },
  },
  newsletter: {
    title: "Newsletter",
    description: "Subscribe to our newsletter",
    buttonText: "Subscribe",
    disclaimer: "By subscribing you agree to receive our newsletter",
    bannerAlt: "Newsletter banner",
    emailPlaceholder: "Enter your email",
  },
  checkout: {
    canceled: {
      title: "Payment Canceled",
      message: "Your payment has been canceled.",
      payAgain: "Your order is saved — you can complete payment below or from your order details.",
      viewOrder: "View order",
      returnToCart: "Return to Cart",
      continueShopping: "Continue Shopping",
    },
  },
  order: {
    details: {
      payment: {
        verifiedBadge: "Payment Verified",
        verifiedNote: "Payment received and verified. Thank you!",
        choosePaymentMessage:
          "This order is awaiting payment. Pay now by card, or upload your payment proof for offline payment.",
        payNow: "Pay Now",
        cancelledNotice:
          "Payment was cancelled. Your order is saved — you can pay again below.",
        upload: {
          button: "Upload Proof",
          reupload: "Re-Upload Payment Proof",
          uploading: "Uploading...",
        },
      },
    },
    status: {
      pending: "Pending",
      pending_payment_verification: "Pending Verification",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },
  },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};

export { useTranslation };

// List of all available translation modules
const availableModules = [
  "common",
  "navigation",
  "cart",
  "wishlist",
  "search",
  "settings",
  "categories",
  "specifications",
  "footer",
  "blog",
  "review",
  "payment",
  "order",
  "order-details",
  "logistics",
  "product-management",
  "notification",
  "form",
  "user",
  "address",
  "error",
  "checkout",
  "checkout-page",
  "auth",
  "product",
  "admin",
  "admin-logistics",
  "admin-orders",
  "admin-periodorders",
  "admin-roles",
  "admin-newsletter",
  "newsletter",
  "invoice",
  "admin-invoice",
  "admin-invoicedetails",
  "profile",
  "guarantee",
  "admin-features",
  "admin-settings",
  "admin-privacy",
  "admin-periodUsers",
  "admin-deliverySettings",
  "admin-hero",
] as const;

type ModuleName = (typeof availableModules)[number];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("en");
  const [translations, setTranslations] = useState<
    Record<ModuleName, TranslationsType>
  >(defaultTranslations as Record<ModuleName, TranslationsType>);
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load all modules for a given language using translationLoader
  const loadAllModules = async (lang: Language) => {
    try {
      setIsLoading(true);
      // Remove debug log
      // console.log("Loading translations for:", lang);

      // Load essential modules first
      const essentialModules = [
        "common",
        "checkout",
        "checkout-page",
        "cart",
        "payment",
      ];
      const essentialResults = await Promise.all(
        essentialModules.map(async (moduleName) => {
          const moduleData = await translationLoader.loadTranslationModule(
            lang,
            moduleName
          );
          return { moduleName, moduleData };
        })
      );

      // Update translations with essential modules
      const essentialTranslations = essentialResults.reduce(
        (acc, { moduleName, moduleData }) => {
          acc[moduleName as ModuleName] = moduleData;
          return acc;
        },
        { ...defaultTranslations } as Record<ModuleName, TranslationsType>
      );
      setTranslations(essentialTranslations);

      // Load remaining modules in the background
      const remainingModules = availableModules.filter(
        (module) => !essentialModules.includes(module)
      );
      const remainingResults = await Promise.all(
        remainingModules.map(async (moduleName) => {
          const moduleData = await translationLoader.loadTranslationModule(
            lang,
            moduleName
          );
          return { moduleName, moduleData };
        })
      );

      // Update translations with all modules
      const allTranslations = remainingResults.reduce(
        (acc, { moduleName, moduleData }) => {
          acc[moduleName as ModuleName] = moduleData;
          return acc;
        },
        { ...essentialTranslations }
      );

      setTranslations(allTranslations);
      setLoadedModules(
        new Set(availableModules.map((module) => `${lang}:${module}`))
      );
    } catch (error) {
      console.error("Failed to load translations:", error);
      // Keep default translations on error
      setTranslations(
        defaultTranslations as Record<ModuleName, TranslationsType>
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const initializeLanguage = async () => {
      if (typeof window !== "undefined") {
        const savedLang = localStorage.getItem("language") as Language;
        const initialLang =
          savedLang && (savedLang === "en" || savedLang === "zh-TW")
            ? savedLang
            : navigator.language.toLowerCase().startsWith("zh")
            ? "zh-TW"
            : "en";

        setLanguage(initialLang);
        await loadAllModules(initialLang);
      }
    };

    initializeLanguage();
  }, []);

  // Save language preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
    }
  }, [language]);

  // Get translation value with fallback to previous translations during loading
  const getValue = (key: string): string => {
    try {
      const [moduleName, ...rest] = key.split(".") as [ModuleName, ...string[]];
      const keyPath = rest.join(".");

      // Remove debug log
      // console.log("Getting translation for:", {
      //   key,
      //   moduleName,
      //   keyPath,
      //   isLoading,
      //   hasModule: !!translations[moduleName],
      // });

      // Try current translations first
      let moduleTranslations = translations[moduleName];

      // Fall back to previous translations if current ones aren't loaded yet
      if (!moduleTranslations && isLoading) {
        moduleTranslations = defaultTranslations[moduleName];
      }

      if (!moduleTranslations) {
        // Remove debug log
        // console.warn(`No translations found for module: ${moduleName}`);
        // Return a more user-friendly fallback
        const lastPart = key.split(".").pop() || key;
        return lastPart
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      }

      const value = keyPath.split(".").reduce((obj: any, k: string) => {
        return obj?.[k];
      }, moduleTranslations);

      if (typeof value === "string") {
        return value;
      }

      // Key missing from loaded JSON (e.g. stale browser cache) — try baked-in defaults
      const defaultModule = defaultTranslations[moduleName];
      if (defaultModule) {
        const defaultValue = keyPath
          .split(".")
          .reduce((obj: any, k: string) => obj?.[k], defaultModule);
        if (typeof defaultValue === "string") {
          return defaultValue;
        }
      }

      // Remove debug log
      // console.warn(`No translation found for key: ${key}`);
      // Return a more user-friendly fallback
      const lastPart = key.split(".").pop() || key;
      return lastPart
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    } catch (error) {
      // Keep this error log as it's important for actual errors
      console.error(`Error getting translation for key: ${key}`, error);
      const lastPart = key.split(".").pop() || key;
      return lastPart
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }
  };

  // Translation function with variable interpolation
  const t = (
    key: string,
    variables?: Record<string, string | number>
  ): string => {
    let value = getValue(key);

    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        value = value.replace(
          new RegExp(`{{${varKey}}}`, "g"),
          String(varValue)
        );
      });
    }

    return value;
  };

  // Get multi-language value for a key
  const getMultiLangValue = (key: string): MultiLangValue => {
    return {
      en: getValue(`${key}.en`),
      "zh-TW": getValue(`${key}.zh-TW`),
    };
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: (newLang) => {
          setLanguage(newLang);
          loadAllModules(newLang);
        },
        t,
        getMultiLangValue,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
