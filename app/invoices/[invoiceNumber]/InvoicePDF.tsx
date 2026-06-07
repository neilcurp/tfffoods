"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import React from "react";
import { format } from "date-fns";
import type { Invoice, Order, CartProduct } from "./invoiceTypes";

// Register fonts
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc9.ttf",
      fontWeight: "bold",
    },
  ],
});

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#bfbfbf",
    borderBottomWidth: 1,
    minHeight: 30,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontFamily: "Helvetica",
  },
  total: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#bfbfbf",
    paddingTop: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "grey",
    fontFamily: "Helvetica",
  },
  summaryRight: {
    marginLeft: "auto",
    marginTop: 10,
    textAlign: "right",
  },
});

// PDF Document Component
const InvoicePDF: React.FC<{ invoice: Invoice; language: string }> = ({
  invoice,
  language,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Invoice {invoice.invoiceNumber}</Text>
            <Text>Date: {format(new Date(invoice.createdAt), "PPP")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Customer Information
          </Text>
          <Text>Name: {invoice.user.name}</Text>
          <Text>Email: {invoice.user.email}</Text>
          {invoice.user.phone && <Text>Phone: {invoice.user.phone}</Text>}
        </View>

        {invoice.invoiceType === "period" &&
          invoice.periodStart &&
          invoice.periodEnd && (
            <View style={styles.section}>
              <Text>
                Period Start: {format(new Date(invoice.periodStart), "PPP")}
              </Text>
              <Text>
                Period End: {format(new Date(invoice.periodEnd), "PPP")}
              </Text>
            </View>
          )}

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
            Billing Address:
          </Text>
          <Text>
            {invoice.billingAddress
              ? invoice.billingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
          <Text style={{ fontWeight: "bold", marginTop: 10, marginBottom: 5 }}>
            Shipping Address:
          </Text>
          <Text>
            {invoice.shippingAddress
              ? invoice.shippingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
        </View>

        {/* Order Summary */}
        {invoice.orders.map((order: Order) => (
          <View key={order._id} style={styles.section}>
            <Text style={{ fontFamily: "Helvetica", marginBottom: 10 }}>
              #{order._id.slice(-12).toUpperCase()}
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Item</Text>
                <Text style={styles.tableCell}>Quantity</Text>
                <Text style={styles.tableCell}>Price</Text>
                <Text style={styles.tableCell}>Total</Text>
              </View>
              {(order.cartProducts || []).map(
                (item: CartProduct, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>
                      {item.product.displayNames?.[language] ||
                        item.product.name}
                    </Text>
                    <Text style={styles.tableCell}>{item.quantity}</Text>
                    <Text style={styles.tableCell}>
                      ${item.product.price.toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>
                      ${(item.quantity * item.product.price).toFixed(2)}
                    </Text>
                  </View>
                )
              )}
            </View>
            <View style={styles.summaryRight}>
              <Text>Subtotal: ${(order.subtotal || 0).toFixed(2)}</Text>
              <Text>Delivery: ${(order.deliveryCost || 0).toFixed(2)}</Text>
              <Text style={{ fontWeight: "bold" }}>
                Total: ${(order.total || 0).toFixed(2)}
              </Text>
              {(order.totalPremium ?? 0) > 0 && (
                <Text style={{ fontWeight: "bold", color: "#CA8A04" }}>
                  Total Premium: ${(order.totalPremium ?? 0).toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        ))}

        {/* Grand Total - Only for period invoices */}
        {invoice.invoiceType === "period" && (
          <View style={[styles.section, styles.total]}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              Grand Total: ${invoice.amount.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Payment Information
          </Text>
          <Text>
            Payment Method:{" "}
            {invoice.paymentMethod
              ? invoice.paymentMethod.replace("_", " ")
              : "Not Specified"}
          </Text>
          {invoice.paymentProofUrl && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>Payment Proof:</Text>
              <View style={{ marginTop: 5 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.paymentProofUrl}
                  alt="Payment Proof"
                  style={{ maxWidth: "100%", height: "auto", borderRadius: 5 }}
                />
              </View>
            </View>
          )}
          {invoice.notes && <Text>Notes: {invoice.notes}</Text>}
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Addresses
          </Text>
          <Text style={{ fontWeight: "bold" }}>Billing Address:</Text>
          <Text>
            {invoice.billingAddress
              ? invoice.billingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>
            Shipping Address:
          </Text>
          <Text>
            {invoice.shippingAddress
              ? invoice.shippingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Chinese Power Fresh Fruits Limited</Text>
          <Text>Fresh! Fresh! Fresh!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
