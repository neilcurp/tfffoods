"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "@/providers/language/LanguageContext";
import useCartStore from "@/store/cartStore";
import { Product, CartItem } from "@/types";
import { useSession } from "next-auth/react";
import AuthDialog from "@/components/ui/AuthDialog";
import axios from "axios";
import { useUser } from "@/providers/user/UserContext";
import { invalidateCache } from "@/utils/services/clientCache";

type CartContextType = {
  items: CartItem[];
  addItem: (item: AddToCartItem) => void;
  removeItem: (itemId: string, selectedSpecs?: Record<string, any>) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  selectedDeliveryType: number;
  setSelectedDeliveryType: (type: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { language } = useTranslation();
  const items = useCartStore((state) => state.items);
  const addStoreItem = useCartStore((state) => state.addItem);
  const removeStoreItem = useCartStore((state) => state.removeItem);
  const updateStoreItemQuantity = useCartStore(
    (state) => state.updateItemQuantity
  );
  const clearStoreCart = useCartStore((state) => state.clearCart);
  const loadStoreServerCart = useCartStore((state) => state.loadServerCart);
  const selectedDeliveryType = useCartStore(
    (state) => state.selectedDeliveryType
  );
  const setStoreSelectedDeliveryType = useCartStore(
    (state) => state.setSelectedDeliveryType
  );

  const { data: session, status } = useSession();
  const { userData, loading: userLoading } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState<Product | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialMount = useRef(true);
  const isSyncing = useRef(false);

  // Load server cart when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (
        session?.user &&
        status === "authenticated" &&
        !userLoading &&
        userData
      ) {
        try {
          isSyncing.current = true;
          await loadStoreServerCart();
        } catch (error) {
          console.error("Failed to load cart:", error);
          if (status === "authenticated") {
            toast.error("Failed to load cart");
          }
        } finally {
          isSyncing.current = false;
        }
      }
    };

    loadCart();
  }, [session, status, userLoading, userData, loadStoreServerCart]);

  // Sync cart with server when it changes, but only if we're definitely logged in
  useEffect(() => {
    // Skip sync if:
    // 1. No session/user
    // 2. Not fully authenticated
    // 3. Still loading user data
    // 4. Already syncing
    // 5. No items to sync
    if (
      !session?.user?.id || // Require complete user data
      status !== "authenticated" ||
      userLoading ||
      !userData?.id || // Require complete user data
      isSyncing.current ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return;
    }

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set up new sync with longer delay
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        isSyncing.current = true;

        // Double-check auth status before sync
        if (status === "authenticated" && userData?.id) {
          await axios.patch(
            "/api/userData",
            { cart: items },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          // Server cart changed; drop cached userData so reloads are fresh.
          invalidateCache("/api/userData");
        }
      } catch (error) {
        console.error("Cart sync failed:", error);
        // Only try to recover if still authenticated
        if (
          error.response?.status === 409 &&
          status === "authenticated" &&
          userData?.id
        ) {
          try {
            await loadStoreServerCart();
          } catch (reloadError) {
            console.error("Cart reload failed:", reloadError);
          }
        }
      } finally {
        isSyncing.current = false;
      }
    }, 1000); // Increased delay to reduce API calls

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, session, status, userLoading, userData, loadStoreServerCart]);

  const addItem = (item: AddToCartItem) => {
    console.log("Adding item to cart (provider):", item);

    // Require authentication before adding to cart
    const isAuthenticated =
      Boolean(session?.user) &&
      status === "authenticated" &&
      !userLoading &&
      Boolean(userData);

    if (!isAuthenticated) {
      setPendingItem(item as unknown as Product);
      setShowAuthDialog(true);
      toast.error("Please log in to add items to your cart");
      return;
    }

    // Update store immediately
    addStoreItem(item);

    // Show success message
    toast.success("Item added to cart");
  };

  const removeItem = (itemId: string, selectedSpecs?: Record<string, any>) => {
    removeStoreItem(itemId, selectedSpecs);
    toast.success("Item removed from cart");
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    updateStoreItemQuantity(itemId, quantity);
  };

  const clearCart = () => {
    clearStoreCart();
    toast.success("Cart cleared");
  };

  const handleAuthDialogClose = () => {
    setShowAuthDialog(false);
    setPendingItem(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        selectedDeliveryType,
        setSelectedDeliveryType: setStoreSelectedDeliveryType,
      }}
    >
      {children}
      <AuthDialog isOpen={showAuthDialog} onClose={handleAuthDialogClose} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
