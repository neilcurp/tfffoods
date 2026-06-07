// Pure (no-DB) helpers for the checkout route: input validation and totals.
// Order/invoice persistence stays in the route handler.

export interface CheckoutError {
  status: number;
  body: { error: string; details?: unknown };
}

export interface CheckoutTotals {
  deliveryMethodIndex: number;
  subtotal: number;
  finalDeliveryCost: number;
  total: number;
}

interface CheckoutInput {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  shippingAddress?: { en?: string; "zh-TW"?: string } | null;
  cartItems?: unknown;
  deliveryMethod?: unknown;
  paymentMethod?: unknown;
}

/**
 * Validates required checkout fields, the bilingual shipping address, and the
 * cart contents. Returns a CheckoutError to send to the client, or null when
 * the input is valid.
 */
export function validateCheckoutInput(data: CheckoutInput): CheckoutError | null {
  const { name, email, phone, shippingAddress, cartItems, deliveryMethod, paymentMethod } =
    data;

  const missingFields = {
    name: !name,
    email: !email,
    phone: !phone,
    shippingAddress: !shippingAddress,
    cartItems: !cartItems,
    deliveryMethod: deliveryMethod === undefined,
    paymentMethod: !paymentMethod,
  };

  if (Object.values(missingFields).some(Boolean)) {
    return {
      status: 400,
      body: { error: "Missing required fields", details: missingFields },
    };
  }

  if (!shippingAddress?.en || !shippingAddress?.["zh-TW"]) {
    return {
      status: 400,
      body: {
        error: "Invalid shipping address",
        details: {
          missing: {
            en: !shippingAddress?.en,
            "zh-TW": !shippingAddress?.["zh-TW"],
          },
        },
      },
    };
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      status: 400,
      body: {
        error: "Invalid cart items",
        details: {
          isArray: Array.isArray(cartItems),
          length: Array.isArray(cartItems) ? cartItems.length : undefined,
        },
      },
    };
  }

  return null;
}

/**
 * Computes the delivery method index, subtotal, delivery cost (free above the
 * configured threshold), and total. Returns a CheckoutError if the delivery
 * method index is invalid.
 */
export function computeOrderTotals(
  cartItems: Array<{ price?: number; quantity?: number }>,
  deliverySettings: {
    deliveryMethods: Array<{ cost: number }>;
    freeDeliveryThreshold: number;
  },
  deliveryMethod: unknown
): { error: CheckoutError } | { totals: CheckoutTotals } {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  const deliveryMethodIndex = Number(deliveryMethod);

  if (
    isNaN(deliveryMethodIndex) ||
    deliveryMethodIndex < 0 ||
    deliveryMethodIndex >= deliverySettings.deliveryMethods.length
  ) {
    return {
      error: {
        status: 400,
        body: {
          error: "Invalid delivery method",
          details: {
            deliveryMethod,
            deliveryMethodIndex,
            type: typeof deliveryMethod,
            methodsLength: deliverySettings.deliveryMethods.length,
            validation: {
              isNaN: isNaN(deliveryMethodIndex),
              isNegative: deliveryMethodIndex < 0,
              isOutOfBounds:
                deliveryMethodIndex >= deliverySettings.deliveryMethods.length,
            },
          },
        },
      },
    };
  }

  const deliveryCost = deliverySettings.deliveryMethods[deliveryMethodIndex].cost;
  const finalDeliveryCost =
    subtotal >= deliverySettings.freeDeliveryThreshold ? 0 : deliveryCost;
  const total = subtotal + finalDeliveryCost;

  return {
    totals: { deliveryMethodIndex, subtotal, finalDeliveryCost, total },
  };
}
