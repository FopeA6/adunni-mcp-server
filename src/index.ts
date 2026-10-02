#!/usr/bin/env node
/**
 * By Adunni MCP Server
 * -----------------------------------------------------------------------
 * A minimal Model Context Protocol (MCP) server exposing two tools that
 * let an AI agent look up product information and order status for the
 * By Adunni storefront, without a human driving a UI.
 *
 * Transport: stdio (standard for local MCP servers run by an agent host
 * such as Claude Desktop, Claude Code, or any MCP-compatible client).
 *
 * Data: served from an in-memory fixture (src/data.ts) standing in for
 * the real Shopify Admin API, so this can run standalone with no
 * credentials or network access.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { products, orders } from "./data.js";

const server = new McpServer({
  name: "adunni-store",
  version: "1.0.0",
});

/**
 * Tool: get_product_info
 * Looks up a single product by id, or lists all products in a collection.
 * Returns structured JSON so an agent can reason over fields (price,
 * stock, etc.) without parsing prose.
 */
server.registerTool(
  "get_product_info",
  {
    title: "Get product info",
    description:
      "Look up By Adunni product details by product ID, or list all " +
      "products in a given collection (e.g. 'Evening', 'Everyday'). " +
      "Returns price, currency, stock level and description as structured " +
      "JSON. Provide either productId OR collection, not both.",
    inputSchema: {
      productId: z
        .string()
        .optional()
        .describe("Exact product ID, e.g. 'prod_001'."),
      collection: z
        .string()
        .optional()
        .describe("Collection name to list, e.g. 'Evening'."),
    },
  },
  async ({ productId, collection }) => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (!product) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `No product found with id '${productId}'` }),
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
      };
    }

    if (collection) {
      const matches = products.filter(
        (p) => p.collection.toLowerCase() === collection.toLowerCase()
      );
      return {
        content: [{ type: "text", text: JSON.stringify(matches, null, 2) }],
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
    };
  }
);

/**
 * Tool: check_order_status
 * Looks up an order by id and resolves its line items into full product
 * objects, so an agent gets everything it needs in one call rather than
 * having to chain a second lookup itself.
 */
server.registerTool(
  "check_order_status",
  {
    title: "Check order status",
    description:
      "Look up a By Adunni order by order ID. Returns status " +
      "(processing/shipped/delivered/cancelled), shipping country, " +
      "tracking number if available, and the full product details for " +
      "each line item.",
    inputSchema: {
      orderId: z.string().describe("Exact order ID, e.g. 'order_1001'."),
    },
  },
  async ({ orderId }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `No order found with id '${orderId}'` }),
          },
        ],
      };
    }

    const resolvedItems = order.items.map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId) ?? null,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ...order, items: resolvedItems }, null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("By Adunni MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
