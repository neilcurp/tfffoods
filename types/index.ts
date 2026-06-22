import type { Session } from "next-auth";

export interface Address {
  en: string;
  "zh-TW": string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type CustomSession = Session & {
  user?: CustomUser | undefined;
};

export interface OrdersResponse {
  orders: Order[];
  hasMore: boolean;
  totalOrders: number;
}

export interface Order {
  _id: string;
  name: string;
  email: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  country: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  cartProducts: OrderProduct[];
  paymentProofUrl?: string;
  paymentReference?: string;
  paid?: boolean;
  rejectionReason?: string;
}

export interface OrderProduct {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
  };
  quantity: number;
  price: number;
}

export interface CustomUser {
  _id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  image?: string | null;
  admin?: boolean;
  role?: "admin" | "accounting" | "logistics" | "user";
  phone?: string;
  address?: Address;
  isPeriodPaidUser?: boolean;
  paymentPeriod?: "weekly" | "monthly" | null;
  notificationPreferences?: {
    orderUpdates: boolean;
    promotions: boolean;
  };
}

// Brand interface
export interface Brand {
  _id: string;
  name: string;
  legacyBrandName?: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  descriptions?: {
    en: string;
    "zh-TW": string;
  };
  icon?: string;
  isActive: boolean;
  order: number;
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Base product structure
export interface BaseProduct {
  _id: string;
  name: string;
  description: string;
  descriptions?: {
    en: string;
    "zh-TW": string;
  };
  images: string[];
  price: number;
  originalPrice?: number;
  brand: Brand;
  material: string;
  bracelet?: string;
  condition: string;
  featured?: boolean;
  user: string;
  movement?: string;
  thickness?: string;
  glass?: string;
  luminova?: string;
  casematerial?: string;
  crown?: string;
  bandsize?: string;
  lugs?: string;
  water?: string;
  createdAt: string;
  updatedAt: string;
}

// Product adds admin fields
export interface Product {
  _id: string;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  description: string;
  descriptions?: {
    en: string;
    "zh-TW": string;
  };
  price: number;
  originalPrice?: number;
  images: string[];
  brand?: {
    _id: string;
    name: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  category?: {
    _id: string;
    name: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
    specifications?: Specification[];
  };
  specifications?: Specification[];
  material?: string;
  condition?: string;
  averageRating?: number;
  numReviews?: number;
  featured?: boolean;
  draft?: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

// CartItem for cart operations
export interface CartItem {
  _id: string;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  images: string[];
  price: number;
  basePrice?: number;
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
  category?: {
    _id: string;
    name: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  material?: string;
  condition?: string;
  quantity: number;
  selectedSpecifications?: Record<string, string>;
}

// Type for adding items to cart
export type AddToCartItem = {
  _id: string;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  images: string[];
  price: number;
  basePrice?: number;
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
  category?: {
    _id: string;
    name: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  material?: string;
  condition?: string;
  quantity?: number;
  selectedSpecifications?: Record<string, string>;
};

export interface CartStore {
  items: CartItem[];
  selectedDeliveryType: number;
  addItem: (item: AddToCartItem) => void;
  removeItem: (id: string, selectedSpecs?: Record<string, any>) => void;
  clearCart: () => void;
  clearLocalCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  updateItemQuantity: (id: string, quantity: number) => void;
  loadServerCart: () => Promise<void>;
  setSelectedDeliveryType: (type: number) => void;
}

export interface SearchResult {
  _id: string;
  name: string;
  price: number;
  images: string[];
  brand: Brand;
  averageRating: number;
  numReviews: number;
  originalPrice: number;
}

export interface WishlistItem {
  _id: string;
  userId: string;
  productId: string;
  addedAt: string;
}

export interface NavbarLinksProps {
  session: CustomSession | null;
  setProductOpen: (value: boolean) => void;
  setAdmin: (value: boolean) => void;
}

export interface ProductDrawerProps {
  productOpen: boolean;
  setProductOpen: (value: boolean) => void;
}

export interface AdminDrawerProps {
  admin: boolean;
  setAdmin: (value: boolean) => void;
}

export interface UserSectionProps {
  session: CustomSession | null;
}

export interface SearchDrawerProps {
  searchOpen: boolean;
  searchTerm: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClose: () => void;
  firstTwelveItems: SearchResult[];
  resultArr: SearchResult[];
}

export interface MobileMenuProps {
  isOpen: boolean;
  setMenuClose: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  resultArr: SearchResult[];
  session: CustomSession | null;
  user: CustomUser | undefined;
  adminPanelMob: boolean;
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface Specification {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
  description?: string;
  value: {
    en: string;
    "zh-TW": string;
  };
  displayNames: {
    en: string;
    "zh-TW": string;
  };
}

export interface CategorySpecification {
  label: string;
  key: string;
  type: "text" | "number" | "select";
  options?: string[];
  required: boolean;
  description?: string;
}

export interface ProductSpecification {
  key: string;
  value: {
    en: string;
    "zh-TW": string;
  };
  type: "text" | "number" | "select";
  displayNames: {
    en: string;
    "zh-TW": string;
  };
}

export interface CloudinaryUploadResult {
  event: string;
  info: {
    secure_url: string;
    public_id: string;
    asset_id: string;
    version: string;
    version_id: string;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    url: string;
    access_mode: string;
    original_filename: string;
  };
}

export function isCloudinaryUploadResult(
  result: unknown
): result is CloudinaryUploadResult {
  if (!result || typeof result !== "object") return false;

  const typedResult = result as Partial<CloudinaryUploadResult>;

  return (
    typeof typedResult.event === "string" &&
    typedResult.info !== undefined &&
    typeof typedResult.info === "object" &&
    typeof (typedResult.info as any).secure_url === "string"
  );
}
