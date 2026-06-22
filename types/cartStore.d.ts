import { CartItem, AddToCartItem } from "./index";

export interface CartStore {
  items: CartItem[];
  selectedDeliveryType: number;
  addItem: (item: AddToCartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => Promise<void>;
  clearLocalCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  updateItemQuantity: (id: string, quantity: number) => void;
  loadServerCart: () => Promise<void>;
  setSelectedDeliveryType: (type: number) => void;
}

export interface AddToCartItem {
  _id: string;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  images: string[];
  price: number;
  brand?:
    | {
        _id: string;
        name: string;
        displayNames?: {
          en: string;
          "zh-TW": string;
        };
      }
    | string;
  quantity?: number;
}

declare module "@/store/cartStore" {
  const useCartStore: <T extends (state: CartStore) => unknown>(
    selector: T
  ) => ReturnType<T>;
  export default useCartStore;
}
