export interface CartProduct {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    description?: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  quantity: number;
}

export interface OrderItem {
  id: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    description?: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  quantity: number;
}

export interface Order {
  _id: string;
  total: number;
  totalPremium?: number;
  items: OrderItem[];
  cartProducts?: CartProduct[]; // Added for frontend compatibility
  createdAt: string;
  name?: string;
  email?: string;
  status?: string;
  deliveryCost: number;
  subtotal: number;
  deliveryMethod: number;
  deliveryMethodName?: {
    en: string;
    "zh-TW": string;
  };
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  periodInvoiceNumber?: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      en: string;
      "zh-TW": string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  orders: Order[];
  status: string;
  billingAddress?: {
    en: string;
    "zh-TW": string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  shippingAddress?: {
    en: string;
    "zh-TW": string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  invoiceType?: "one-time" | "period";
  periodStart?: string;
  periodEnd?: string;
  paymentMethod?: string;
  notes?: string;
  paymentProofUrl?: string;
  paymentReference?: string;
  paymentDate?: string;
  amount: number;
  items?: Array<{
    product: {
      _id: string;
      name: string;
      images: string[];
      price: number;
      description?: string;
      displayNames?: {
        en: string;
        "zh-TW": string;
      };
    };
    quantity: number;
    price: number;
  }>;
}

export interface PDFDownloadLinkProps {
  blob: Blob | null;
  url: string | null;
  loading: boolean;
  error: Error | null;
}
