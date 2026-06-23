import { format } from "date-fns";
import Image from "next/image";
import { useTranslation } from "@/providers/language/LanguageContext";

interface PrintableInvoiceProps {
  invoice: any;
  formatInvoiceAddress: (address: any) => string;
}

export default function PrintableInvoice({
  invoice,
  formatInvoiceAddress,
}: PrintableInvoiceProps) {
  const { language } = useTranslation();

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        {/* Logo */}
        <div style={{ marginBottom: "20px" }}>
          <Image src="/logo.png" alt="Company Logo" width={150} height={50} />
        </div>

        {/* Invoice Details */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Invoice</h1>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>
              {invoice.invoiceNumber}
            </p>
            <p style={{ margin: 0 }}>
              {format(new Date(invoice.createdAt), "PPP")}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
          Customer Information
        </h2>
        <p>
          <strong>Name:</strong> {invoice.user.name}
        </p>
        <p>
          <strong>Email:</strong> {invoice.user.email}
        </p>
        {invoice.user.phone && (
          <p>
            <strong>Phone:</strong> {invoice.user.phone}
          </p>
        )}
      </div>

      {/* Period Info */}
      {invoice.invoiceType === "period" && (
        <div style={{ marginBottom: "30px" }}>
          <p>
            <strong>Period Start:</strong>{" "}
            {format(new Date(invoice.periodStart), "PPP")}
          </p>
          <p>
            <strong>Period End:</strong>{" "}
            {format(new Date(invoice.periodEnd), "PPP")}
          </p>
        </div>
      )}

      {/* Order Summary */}
      <h2 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>
        Order Summary
      </h2>
      {invoice.orders.map((order: any) => (
        <div
          key={order._id}
          style={{
            marginBottom: "20px",
            borderBottom: "1px solid #ccc",
            paddingBottom: "20px",
          }}
        >
          <p style={{ fontFamily: "monospace", marginBottom: "10px" }}>
            #{order._id.slice(-12).toUpperCase()}
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "15px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Items</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Quantity</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Price</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.cartProducts.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>{item.product.name}</td>
                  <td style={{ textAlign: "right", padding: "8px" }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: "right", padding: "8px" }}>
                    ${item.product.price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", padding: "8px" }}>
                    ${(item.quantity * item.product.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <p>
              <strong>Subtotal:</strong> ${(order.subtotal || 0).toFixed(2)}
            </p>
            <p>
              <strong>Delivery:</strong> ${(order.deliveryCost || 0).toFixed(2)}
            </p>
            <p style={{ fontWeight: "bold" }}>
              Total: ${(order.total || 0).toFixed(2)}
            </p>
            {(order.totalPremium ?? 0) > 0 && (
              <p style={{ fontWeight: "bold", color: "#CA8A04" }}>
                Total Premium: ${(order.totalPremium ?? 0).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Only show grand totals for period invoices */}
      {invoice.invoiceType === "period" && (
        <div
          style={{
            borderTop: "2px solid #ccc",
            paddingTop: "15px",
            marginTop: "20px",
          }}
        >
          <p style={{ textAlign: "right" }}>
            <strong>Total Subtotal:</strong> $
            {invoice.orders
              .reduce(
                (sum: number, order: any) => sum + (order.subtotal || 0),
                0
              )
              .toFixed(2)}
          </p>
          <p style={{ textAlign: "right" }}>
            <strong>Total Delivery:</strong> $
            {invoice.orders
              .reduce(
                (sum: number, order: any) => sum + (order.deliveryCost || 0),
                0
              )
              .toFixed(2)}
          </p>
          <p style={{ textAlign: "right", fontWeight: "bold" }}>
            <strong>Grand Total:</strong> $
            {invoice.orders
              .reduce((sum: number, order: any) => sum + (order.total || 0), 0)
              .toFixed(2)}
          </p>
          {invoice.orders.some(
            (order: any) => (order.totalPremium ?? 0) > 0
          ) && (
            <p
              style={{
                textAlign: "right",
                fontWeight: "bold",
                color: "#CA8A04",
              }}
            >
              <strong>Total Premium:</strong> $
              {invoice.orders
                .reduce(
                  (sum: number, order: any) => sum + (order.totalPremium ?? 0),
                  0
                )
                .toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Payment Info */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
          Payment Information
        </h2>
        <p>
          <strong>Payment Method:</strong>{" "}
          {invoice.paymentMethod
            ? invoice.paymentMethod.replace("_", " ")
            : "Not Specified"}
        </p>
        {invoice.notes && (
          <p>
            <strong>Notes:</strong> {invoice.notes}
          </p>
        )}
      </div>

      {/* Delivery */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Delivery</h2>
        <div style={{ marginBottom: "15px" }}>
          <p>
            <strong>Address:</strong>
          </p>
          <p>
            {formatInvoiceAddress(
              invoice.shippingAddress || invoice.billingAddress
            )}
          </p>
        </div>
        <div>
          <p>
            <strong>Delivery Method:</strong>
          </p>
          <p>
            {invoice.orders?.[0]?.deliveryMethodName?.en ||
              "Not specified"}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <p>Chinese Power Fresh Fruits Limited</p>
        <p>Fresh! Fresh! Fresh!</p>
      </div>
    </div>
  );
}
