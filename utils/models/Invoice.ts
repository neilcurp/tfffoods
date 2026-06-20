import mongoose from "mongoose";
import { logger } from "@/utils/logger";

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      validate: {
        validator: function (v: string) {
          return v && v.length > 0;
        },
        message: "Invoice number cannot be empty",
      },
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    phone: {
      type: Number,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (v: number) {
          return /^\d{8,}$/.test(v.toString()); // Validate minimum 8 digits
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    invoiceType: {
      type: String,
      enum: {
        values: ["one-time", "period"],
        message: "Invoice type must be either 'one-time' or 'period'",
      },
      required: [true, "Invoice type is required"],
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
    ],
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Price cannot be negative"],
        },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "overdue", "cancelled"],
        message:
          "Status must be 'pending', 'paid', 'overdue', or 'cancelled'",
      },
      default: "pending",
    },
    periodStart: {
      type: Date,
      required: [true, "Period start date is required"],
    },
    periodEnd: {
      type: Date,
      required: [true, "Period end date is required"],
      validate: {
        validator: function (this: any, v: Date) {
          return v && v >= this.periodStart;
        },
        message: "Period end date must be after period start date",
      },
    },
    billingAddress: {
      type: Object,
      required: false,
    },
    shippingAddress: {
      type: Object,
      required: false,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["credit_card", "bank_transfer", "cash", "offline_payment"],
        message: "Invalid payment method",
      },
    },
    paymentProofUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: function (doc, ret) {
        try {
          // Convert ObjectIds to strings
          ret._id = ret._id.toString();
          if (ret.user) ret.user._id = ret.user._id.toString();
          if (ret.orders) {
            ret.orders = ret.orders.map((order: any) => {
              try {
                if (order._id) order._id = order._id.toString();
                if (order.items) {
                  order.items = order.items.map((item: any) => {
                    try {
                      if (item.id) item.id._id = item.id._id.toString();
                      return item;
                    } catch (itemError) {
                      logger.error("Error transforming invoice item:", {
                        error: itemError,
                        item,
                        orderId: order._id,
                        invoiceId: doc._id,
                      });
                      return {
                        id: null,
                        quantity: item.quantity || 0,
                      };
                    }
                  });
                }
                return order;
              } catch (orderError) {
                logger.error("Error transforming invoice order:", {
                  error: orderError,
                  order,
                  invoiceId: doc._id,
                });
                return {
                  _id: order._id?.toString() || "unknown",
                  items: [],
                };
              }
            });
          }
          if (ret.items) {
            ret.items = ret.items.map((item: any) => {
              try {
                if (item.product) item.product = item.product.toString();
                return item;
              } catch (itemError) {
                logger.error("Error transforming invoice item:", {
                  error: itemError,
                  item,
                  invoiceId: doc._id,
                });
                return {
                  product: null,
                  quantity: item.quantity || 0,
                  price: item.price || 0,
                };
              }
            });
          }
          return ret;
        } catch (error) {
          logger.error("Error transforming invoice:", {
            error,
            invoiceId: doc._id,
          });
          return {
            _id: doc._id.toString(),
            orders: [],
            items: [],
          };
        }
      },
    },
  }
);

// Indexes for better query performance
// invoiceNumber is already indexed due to unique: true
invoiceSchema.index({ user: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceType: 1 });
invoiceSchema.index({ orders: 1 });
invoiceSchema.index({ periodEnd: 1 });

// Ensure orders array is never null
invoiceSchema.pre("save", function (next) {
  if (!this.orders) {
    this.orders = [];
  }
  next();
});

// Add error handling to pre-save hook
invoiceSchema.pre("save", async function (next) {
  try {
    // Validate required fields
    if (!this.user) {
      throw new Error("User is required");
    }
    if (!this.invoiceNumber) {
      throw new Error("Invoice number is required");
    }
    if (!this.invoiceType) {
      throw new Error("Invoice type is required");
    }
    if (!this.amount && this.amount !== 0) {
      throw new Error("Amount is required");
    }
    if (!this.periodStart) {
      throw new Error("Period start date is required");
    }
    if (!this.periodEnd) {
      throw new Error("Period end date is required");
    }

    // Validate period dates
    if (this.periodEnd < this.periodStart) {
      throw new Error("Period end date must be after period start date");
    }

    // Validate amount
    if (this.amount < 0) {
      throw new Error("Amount cannot be negative");
    }

    // Validate items
    if (this.items) {
      this.items.forEach((item: any, index: number) => {
        if (!item.product) {
          throw new Error(`Item ${index} is missing product`);
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Item ${index} has invalid quantity`);
        }
        if (!item.price || item.price < 0) {
          throw new Error(`Item ${index} has invalid price`);
        }
      });
    }

    // Check orders status and update invoice status
    if (this.orders && this.orders.length > 0) {
      const Order = mongoose.model("Order");
      const orders = await Order.find({ _id: { $in: this.orders } });

      if (orders.length > 0) {
        const allDelivered = orders.every(
          (order) => order.status === "delivered"
        );
        const allCancelled = orders.every(
          (order) => order.status === "cancelled"
        );

        // Never downgrade an invoice that was already marked paid (payment is
        // confirmed at verification time now, not only at delivery).
        if (allCancelled) {
          this.status = "cancelled";
        } else if (allDelivered && this.status !== "paid") {
          this.status = "paid";
          if (!this.paymentDate) {
            this.paymentDate = new Date();
          }
        }
      }
    }

    next();
  } catch (error) {
    logger.error("Error in invoice pre-save hook:", {
      error,
      invoiceId: this._id,
      invoiceNumber: this.invoiceNumber,
    });
    next(error);
  }
});

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);
