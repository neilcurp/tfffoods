"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import React from "react";
import { format } from "date-fns";
import type { Invoice, Order, CartProduct } from "./invoiceTypes";
import { PDF_FONT_URL } from "@/utils/services/pdfFontConfig";

export interface InvoiceBranding {
  storeName?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
}

Font.register({
  family: "NotoSansTC",
  fonts: [
    { src: PDF_FONT_URL, fontWeight: "normal" },
    { src: PDF_FONT_URL, fontWeight: "bold" },
  ],
});

const ACCENT = "#535C91";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#E1E3EA";
const LABEL_GRAY = "#787A84";
const VALUE_DARK = "#212529";
const PAID_GREEN = "#228B57";
const PAID_GREEN_TEXT = "#167A4A";
const PAID_GREEN_BG = "#E8F5EE";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    fontFamily: "NotoSansTC",
    fontSize: 8,
    color: VALUE_DARK,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  brandLogo: { maxWidth: 80, maxHeight: 32, objectFit: "contain" },
  brandName: { fontSize: 8.5, fontWeight: "bold", color: ACCENT },
  brandInfo: {
    fontSize: 8.5,
    color: LABEL_GRAY,
    textAlign: "right",
    lineHeight: 1.35,
    maxWidth: 220,
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: ACCENT,
    marginBottom: 6,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#28282C",
  },
  cardRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 5,
    padding: 9,
  },
  cardTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: ACCENT,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  cardTitleInline: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: ACCENT,
    textTransform: "uppercase",
  },
  paymentBadge: {
    backgroundColor: PAID_GREEN_BG,
    borderWidth: 0.5,
    borderColor: PAID_GREEN,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentBadgeText: {
    color: PAID_GREEN_TEXT,
    fontSize: 6,
    textAlign: "center",
    lineHeight: 1.2,
  },
  kvLabel: { fontSize: 6.5, color: LABEL_GRAY, marginBottom: 1 },
  kvValue: { fontSize: 8, color: VALUE_DARK, marginBottom: 6 },
  addressCol: { flex: 1 },
  table: { marginTop: 2 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ACCENT,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  tableHeaderCell: { color: "#FFFFFF", fontSize: 7.5, fontWeight: "bold" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: CARD_BORDER,
  },
  tableRowAlt: { backgroundColor: "#F5F6F8" },
  cellItem: { flex: 1, fontSize: 7.5 },
  cellQty: { width: 44, fontSize: 7.5, textAlign: "center" },
  cellPrice: { width: 62, fontSize: 7.5, textAlign: "right" },
  cellTotal: { width: 62, fontSize: 7.5, textAlign: "right" },
  totals: { marginTop: 8, marginLeft: "auto", width: 180 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalsLabel: { fontSize: 8, color: LABEL_GRAY },
  totalsValue: { fontSize: 8, color: VALUE_DARK },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: ACCENT,
    marginTop: 3,
    marginBottom: 5,
  },
  grandLabel: { fontSize: 9.5, fontWeight: "bold", color: ACCENT },
  grandValue: { fontSize: 9.5, fontWeight: "bold", color: ACCENT },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    color: LABEL_GRAY,
    fontSize: 7,
    borderTopWidth: 0.5,
    borderTopColor: CARD_BORDER,
    paddingTop: 6,
  },
});

const KeyValue: React.FC<{ label: string; value?: string }> = ({
  label,
  value,
}) => (
  <View>
    <Text style={styles.kvLabel}>{label}</Text>
    <Text style={styles.kvValue}>{value || "-"}</Text>
  </View>
);

const InvoicePDF: React.FC<{
  invoice: Invoice;
  language: string;
  branding?: InvoiceBranding;
}> = ({ invoice, language, branding }) => {
  const paid = (invoice as any).status === "paid";
  const firstOrder = invoice.orders?.[0];
  const orderNumber = firstOrder?._id
    ? `#${firstOrder._id.slice(-12).toUpperCase()}`
    : "-";
  const billing = invoice.billingAddress?.[language] || "Not specified";
  const shipping = invoice.shippingAddress?.[language] || billing;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Branded header */}
        <View style={styles.header}>
          <View>
            {branding?.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.brandLogo} src={branding.logoUrl} />
            ) : (
              <Text style={styles.brandName}>
                {branding?.storeName || "tfffoods"}
              </Text>
            )}
          </View>
          <View style={styles.brandInfo}>
            {branding?.logoUrl && branding?.storeName && (
              <Text>{branding.storeName}</Text>
            )}
            {branding?.address ? <Text>{branding.address}</Text> : null}
            {branding?.phone ? <Text>Tel: {branding.phone}</Text> : null}
            {branding?.email ? <Text>{branding.email}</Text> : null}
          </View>
        </View>
        <View style={styles.headerDivider} />

        <View style={styles.titleSection}>
          <Text style={styles.title}>{paid ? "RECEIPT" : "INVOICE"}</Text>
        </View>

        {/* Details + Payment cards */}
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Invoice Details</Text>
            <KeyValue label="Name" value={invoice.user.name} />
            <KeyValue label="Email" value={invoice.user.email} />
            <KeyValue label="Invoice Number" value={invoice.invoiceNumber} />
            <KeyValue label="Order Number" value={orderNumber} />
            <KeyValue
              label="Type"
              value={invoice.invoiceType === "period" ? "Period" : "One-time"}
            />
            <KeyValue
              label="Created"
              value={format(new Date(invoice.createdAt), "PPP")}
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Information</Text>
            <KeyValue
              label="Payment Method"
              value={
                invoice.paymentMethod
                  ? invoice.paymentMethod.replace(/[_-]/g, " ")
                  : "-"
              }
            />
            <KeyValue label="Payment Status" value={paid ? "Paid" : "Pending"} />
            {(invoice as any).paymentReference ? (
              <KeyValue
                label="Payment Reference"
                value={(invoice as any).paymentReference}
              />
            ) : null}
            {invoice.notes ? (
              <KeyValue label="Notes" value={invoice.notes} />
            ) : null}
          </View>
        </View>

        {/* Addresses card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Addresses</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={styles.addressCol}>
              <KeyValue label="Billing Address" value={billing} />
            </View>
            <View style={styles.addressCol}>
              <KeyValue label="Shipping Address" value={shipping} />
            </View>
          </View>
        </View>

        {/* Order summary card(s) */}
        {invoice.orders.map((order: Order) => {
          const deliveryCost = order.deliveryCost || 0;
          const subtotal =
            order.subtotal ??
            (order.total ? order.total - deliveryCost : 0);
          return (
            <View key={order._id} style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitleInline}>Order Summary</Text>
                {paid && (
                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>Payment confirmed</Text>
                  </View>
                )}
              </View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.cellItem]}>
                    ITEM
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.cellQty]}>
                    QTY
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.cellPrice]}>
                    PRICE
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.cellTotal]}>
                    TOTAL
                  </Text>
                </View>
                {(order.cartProducts || []).map(
                  (item: CartProduct, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 ? styles.tableRowAlt : {},
                      ]}
                    >
                      <Text style={styles.cellItem}>
                        {item.product.displayNames?.[language] ||
                          item.product.name}
                      </Text>
                      <Text style={styles.cellQty}>{item.quantity}</Text>
                      <Text style={styles.cellPrice}>
                        ${item.product.price.toFixed(2)}
                      </Text>
                      <Text style={styles.cellTotal}>
                        ${(item.quantity * item.product.price).toFixed(2)}
                      </Text>
                    </View>
                  )
                )}
              </View>
              <View style={styles.totals}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsValue}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Delivery</Text>
                  <Text style={styles.totalsValue}>
                    ${deliveryCost.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalsDivider} />
                <View style={styles.totalsRow}>
                  <Text style={styles.grandLabel}>Total</Text>
                  <Text style={styles.grandValue}>
                    ${(order.total || 0).toFixed(2)}
                  </Text>
                </View>
                {(order.totalPremium ?? 0) > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={[styles.totalsLabel, { color: "#CA8A04" }]}>
                      Total Premium
                    </Text>
                    <Text style={[styles.totalsValue, { color: "#CA8A04" }]}>
                      ${(order.totalPremium ?? 0).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Grand total for period invoices */}
        {invoice.invoiceType === "period" && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.totalsRow}>
              <Text style={styles.grandLabel}>Grand Total</Text>
              <Text style={styles.grandValue}>
                ${invoice.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Payment proof (kept from previous design) */}
        {invoice.paymentProofUrl && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Payment Proof</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={invoice.paymentProofUrl}
              style={{ maxWidth: 180, objectFit: "contain" }}
            />
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            {[
              branding?.storeName || "tfffoods",
              branding?.phone,
              branding?.email,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
