/**
 * Mock data standing in for By Adunni's real Shopify store/order data.
 * In production this would call the Shopify Admin API instead of reading
 * from this in-memory fixture.
 */

export interface Product {
  id: string;
  name: string;
  collection: string;
  price: number;
  currency: string;
  stock: number;
  description: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  items: { productId: string; quantity: number }[];
  placedAt: string;
  shippingCountry: string;
  trackingNumber?: string;
}

export const products: Product[] = [
  {
    id: "prod_001",
    name: "Adaeze Beaded Clutch",
    collection: "Evening",
    price: 85,
    currency: "GBP",
    stock: 12,
    description:
      "Hand-beaded clutch bag with a braided strap, made in a classic evening silhouette.",
  },
  {
    id: "prod_002",
    name: "Fola Woven Tote",
    collection: "Everyday",
    price: 65,
    currency: "GBP",
    stock: 0,
    description:
      "Lightweight woven tote for daily use, available in three colourways.",
  },
  {
    id: "prod_003",
    name: "Ronke Beaded Crossbody",
    collection: "Evening",
    price: 95,
    currency: "GBP",
    stock: 5,
    description:
      "Structured crossbody bag with hand-applied beadwork and an adjustable strap.",
  },
];

export const orders: Order[] = [
  {
    id: "order_1001",
    customerEmail: "amara@example.com",
    status: "shipped",
    items: [{ productId: "prod_001", quantity: 1 }],
    placedAt: "2026-09-20",
    shippingCountry: "GB",
    trackingNumber: "RM123456789GB",
  },
  {
    id: "order_1002",
    customerEmail: "tola@example.com",
    status: "processing",
    items: [
      { productId: "prod_003", quantity: 1 },
      { productId: "prod_002", quantity: 1 },
    ],
    placedAt: "2026-09-28",
    shippingCountry: "US",
  },
  {
    id: "order_1003",
    customerEmail: "ifeoma@example.com",
    status: "delivered",
    items: [{ productId: "prod_001", quantity: 2 }],
    placedAt: "2026-09-10",
    shippingCountry: "FR",
    trackingNumber: "LP987654321FR",
  },
];
