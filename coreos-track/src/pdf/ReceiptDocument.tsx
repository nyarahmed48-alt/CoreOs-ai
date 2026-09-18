import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export type ReceiptData = {
  receiptNo: string;
  code: string;
  name: string;
  type: string;
  status: string;
  entryDate: string;
  issuedDate: string;
  dueDate?: string | null;
  amountLabel: string;
  currency: string;
  notes?: string | null;
  linkUrl?: string | null;
  issuedBy: string;
  brand?: string;
};

/**
 * Watermark tuning.
 *
 * `WATERMARK_OPACITY` is intentionally low (8%) — the phrase must be clearly
 * visible as a security mark but must never compete with the amounts, codes or
 * transaction text printed on top of it.
 */
const WATERMARK_TEXT = "VOID IF COPIED";
const WATERMARK_OPACITY = 0.08;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    color: "#111827",
    fontFamily: "Helvetica",
    position: "relative",
  },
  watermarkLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  watermarkRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  watermarkText: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    color: "#4338ca",
    opacity: WATERMARK_OPACITY,
    letterSpacing: 3,
    transform: "rotate(-30deg)",
  },
  header: {
    backgroundColor: "#6d6ef0",
    color: "#ffffff",
    padding: 22,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  brandSub: { fontSize: 8, marginTop: 4, letterSpacing: 2, color: "#e6e6ff" },
  headerRight: { alignItems: "flex-end" },
  headerLabel: { fontSize: 7, letterSpacing: 2, color: "#e6e6ff" },
  headerCode: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 4 },
  metaGrid: {
    marginTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaCell: { width: "50%", marginBottom: 14 },
  metaLabel: { fontSize: 7, letterSpacing: 1.5, color: "#6b7280" },
  metaValue: { fontSize: 11, marginTop: 3, fontFamily: "Helvetica-Bold" },
  table: { marginTop: 8, borderRadius: 6, overflow: "hidden" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  colDesc: { width: "60%" },
  colCurrency: { width: "20%", textAlign: "right" },
  colAmount: { width: "20%", textAlign: "right" },
  headCell: { fontSize: 7, letterSpacing: 1.5, color: "#6b7280" },
  totalRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#111827",
    paddingTop: 12,
  },
  totalLabel: { fontSize: 8, letterSpacing: 2, color: "#6b7280" },
  totalValue: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#4338ca" },
  notesBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  notesLabel: { fontSize: 7, letterSpacing: 1.5, color: "#6b7280" },
  notesText: { marginTop: 4, lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#9ca3af" },
});

/** Tiled diagonal "VOID IF COPIED" layer that sits behind the content. */
function Watermark() {
  const rows = [0, 1, 2, 3, 4, 5];
  return (
    <View style={styles.watermarkLayer} fixed>
      {rows.map((row) => (
        <View
          key={row}
          style={[styles.watermarkRow, { marginTop: row === 0 ? 70 : 78 }]}
        >
          <Text style={styles.watermarkText}>{WATERMARK_TEXT}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const brand = data.brand ?? "CoreOS";
  return (
    <Document
      title={`Receipt ${data.receiptNo}`}
      author={brand}
      subject={`${data.type} — ${data.name}`}
    >
      <Page size="A4" style={styles.page}>
        <Watermark />

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{brand}</Text>
            <Text style={styles.brandSub}>OFFICIAL RECEIPT</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>CLIENT CODE</Text>
            <Text style={styles.headerCode}>{data.code}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>RECEIPT NO.</Text>
            <Text style={styles.metaValue}>{data.receiptNo}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>DATE ISSUED</Text>
            <Text style={styles.metaValue}>{data.issuedDate}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>BILLED TO</Text>
            <Text style={styles.metaValue}>{data.name}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>TYPE</Text>
            <Text style={styles.metaValue}>{data.type}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>ENTRY DATE</Text>
            <Text style={styles.metaValue}>{data.entryDate}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>STATUS</Text>
            <Text style={styles.metaValue}>{data.status.toUpperCase()}</Text>
          </View>
          {data.dueDate ? (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>DUE</Text>
              <Text style={styles.metaValue}>{data.dueDate}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.headCell, styles.colDesc]}>DESCRIPTION</Text>
            <Text style={[styles.headCell, styles.colCurrency]}>CURRENCY</Text>
            <Text style={[styles.headCell, styles.colAmount]}>AMOUNT</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>
              {data.type} service — {data.name}
            </Text>
            <Text style={styles.colCurrency}>{data.currency}</Text>
            <Text style={styles.colAmount}>{data.amountLabel}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL DUE</Text>
          <Text style={styles.totalValue}>{data.amountLabel}</Text>
        </View>

        {data.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {data.linkUrl ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>REFERENCE LINK</Text>
            <Text style={styles.notesText}>{data.linkUrl}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Issued by {data.issuedBy} · Thank you for your business
          </Text>
          <Text style={styles.footerText}>
            {WATERMARK_TEXT} · {brand} {data.code}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
