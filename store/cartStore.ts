import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, CartStore, AddToCartItem } from "@/types";
import axios from "axios";
import { cachedGet, invalidateCache } from "@/utils/services/clientCache";

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedDeliveryType: 0,
      addItem: (item: AddToCartItem) =>
        set((state) => {
          console.log("CartStore - Starting addItem:", {
            itemId: item._id,
            itemName: item.name,
            specifications: item.selectedSpecifications,
            currentCartLength: state.items.length,
          });

          // Create the cart item first
          const cartItem: CartItem = {
            _id: item._id,
            name: item.name,
            displayNames: item.displayNames,
            images: item.images,
            price: item.price,
            basePrice: item.basePrice,
            brand: item.brand,
            category: item.category,
            quantity: item.quantity || 1,
            selectedSpecifications: item.selectedSpecifications || {},
          };

          console.log("CartStore - Created cart item:", {
            ...cartItem,
            basePrice: cartItem.basePrice,
            price: cartItem.price,
            priceCheck: cartItem.price - (cartItem.basePrice || 0),
          });

          // Check for existing item with same specs
          const existingItemIndex = state.items.findIndex((i) => {
            if (i._id !== item._id) return false;

            // Compare specifications
            const currentSpecs = i.selectedSpecifications || {};
            const newSpecs = item.selectedSpecifications || {};
            const currentKeys = Object.keys(currentSpecs).sort();
            const newKeys = Object.keys(newSpecs).sort();

            console.log("CartStore - Comparing specs:", {
              currentSpecs,
              newSpecs,
              currentKeys,
              newKeys,
            });

            // If different number of specs, not the same
            if (currentKeys.length !== newKeys.length) {
              console.log("CartStore - Different number of specs");
              return false;
            }

            // Check if all keys match
            if (!currentKeys.every((key, idx) => key === newKeys[idx])) {
              console.log("CartStore - Keys don't match");
              return false;
            }

            // Check each specification value
            const specsMatch = currentKeys.every((key) => {
              const currentValue = currentSpecs[key];
              const newValue = newSpecs[key];

              // If both values are objects (multilingual values)
              if (
                typeof currentValue === "object" &&
                typeof newValue === "object" &&
                currentValue !== null &&
                newValue !== null
              ) {
                return (
                  currentValue.en === newValue.en &&
                  currentValue["zh-TW"] === newValue["zh-TW"]
                );
              }

              // For simple values
              return currentValue === newValue;
            });
            console.log("CartStore - Specs match:", specsMatch);
            return specsMatch;
          });

          console.log("CartStore - Existing item index:", existingItemIndex);

          // If item exists, update quantity
          if (existingItemIndex !== -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              price: item.price,
              basePrice: item.basePrice,
              quantity:
                (newItems[existingItemIndex].quantity || 1) +
                (item.quantity || 1),
            };
            console.log("CartStore - Updated items:", newItems);
            return { ...state, items: newItems };
          }

          // If item doesn't exist, add new item
          const newState = { ...state, items: [...state.items, cartItem] };
          console.log("CartStore - New cart state:", {
            oldLength: state.items.length,
            newLength: newState.items.length,
            newItems: newState.items,
          });
          return newState;
        }),
      removeItem: (itemId: string, selectedSpecs?: Record<string, any>) =>
        set((state) => ({
          ...state,
          items: state.items.filter((item) => {
            // If no specs provided, use old behavior
            if (!selectedSpecs) return item._id !== itemId;

            // If specs provided, match both ID and specs
            if (item._id !== itemId) return true;

            const currentSpecs = item.selectedSpecifications || {};
            const targetSpecs = selectedSpecs || {};
            const currentKeys = Object.keys(currentSpecs).sort();
            const targetKeys = Object.keys(targetSpecs).sort();

            // If different number of specs, not the same item
            if (currentKeys.length !== targetKeys.length) return true;

            // Check if all keys match
            if (!currentKeys.every((key, idx) => key === targetKeys[idx]))
              return true;

            // Check each specification value
            return !currentKeys.every((key) => {
              const currentValue = currentSpecs[key];
              const targetValue = targetSpecs[key];

              // If both values are objects (multilingual values)
              if (
                typeof currentValue === "object" &&
                typeof targetValue === "object" &&
                currentValue !== null &&
                targetValue !== null
              ) {
                return (
                  currentValue.en === targetValue.en &&
                  currentValue["zh-TW"] === targetValue["zh-TW"]
                );
              }

              // For simple values
              return currentValue === targetValue;
            });
          }),
        })),
      clearCart: async () => {
        console.log("Clearing cart...");
        set({ items: [], selectedDeliveryType: 0 });
        window.localStorage.removeItem("cart-storage");
        try {
          await axios.patch("/api/userData", { cart: [] });
          // Server cart changed; drop cached userData so reloads are fresh.
          invalidateCache("/api/userData");
        } catch (error) {
          console.error("Failed to clear server cart:", error);
        }
      },
      // Resets the cart in this browser only, WITHOUT touching the server copy.
      // Used on logout so the account cart survives and reloads on next login,
      // while the next person on this device doesn't inherit the items.
      clearLocalCart: () => {
        set({ items: [], selectedDeliveryType: 0 });
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("cart-storage");
        }
      },
      getTotalItems: () =>
        get().items.reduce((total, item) => total + (item.quantity || 1), 0),
      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * (item.quantity || 1),
          0
        ),
      updateItemQuantity: (itemId: string, quantity: number) =>
        set((state) => ({
          ...state,
          items: state.items.map((item) =>
            item._id === itemId ? { ...item, quantity } : item
          ),
        })),
      loadServerCart: async () => {
        try {
          // Shared with UserContext via cachedGet so the many callers
          // (CartIcon mount + CartContext effect) collapse into one request.
          // /api/userData returns the cart nested under `user`, not top-level.
          const data = await cachedGet<{ user?: { cart?: CartItem[] } }>(
            "/api/userData"
          );
          const serverCart = data?.user?.cart;
          if (Array.isArray(serverCart)) {
            set((state) => ({ ...state, items: serverCart as CartItem[] }));
          }
        } catch (error) {
          console.error("Failed to load server cart:", error);
        }
      },
      setSelectedDeliveryType: (type: number) => {
        set((state) => ({ ...state, selectedDeliveryType: type }));
      },
    }),
    {
      name: "cart-storage",
      version: 1,
      storage: createJSONStorage(() => {
        // Check if window is defined (client-side)
        if (typeof window !== "undefined") {
          return {
            getItem: (name) => {
              try {
                const str = localStorage.getItem(name);
                console.log("Loading cart from storage:", str);
                if (!str) return null;
                const data = JSON.parse(str);
                return data;
              } catch (error) {
                console.error("Failed to parse cart storage:", error);
                return null;
              }
            },
            setItem: (name, value) => {
              console.log("Saving cart to storage:", value);
              try {
                localStorage.setItem(name, JSON.stringify(value));
              } catch (error) {
                console.error("Failed to save cart to storage:", error);
              }
            },
            removeItem: (name) => {
              console.log("Removing cart from storage:", name);
              localStorage.removeItem(name);
            },
          };
        }
        // Return no-op storage for server-side
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        items: state.items,
        selectedDeliveryType: state.selectedDeliveryType,
      }),
    }
  )
);

export default useCartStore;
