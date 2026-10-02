# By Adunni MCP Server

A minimal [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server exposing two tools that let an AI agent look up product information and order status for the [By Adunni](https://byadunni.com) storefront — without a human driving a UI.

Built to practice the specific skill of designing an interface **for an agent to call**, rather than for a human to read: structured inputs/outputs, explicit schemas, and documentation written so a model can act on it directly.

## Why this exists

By Adunni is a live e-commerce brand I run. In the real store, a support agent or internal tool would need to answer questions like "is this in stock?" or "where's my order?" — today that's done by a human (me) checking Shopify manually. This project is a small proof-of-concept for how an AI agent could do that lookup directly, via two well-defined tools.

The underlying data is a static in-memory fixture (`src/data.ts`) standing in for the real Shopify Admin API, so this runs standalone with zero credentials or network calls.

## Tools

### `get_product_info`

Look up a single product by ID, or list all products in a collection.

| Input | Type | Required | Description |
|---|---|---|---|
| `productId` | string | no* | Exact product ID, e.g. `prod_001` |
| `collection` | string | no* | Collection name, e.g. `Evening` |

\* Provide one or the other. If neither is given, all products are returned.

**Returns:** JSON object (single product) or JSON array (collection/all), each with `id`, `name`, `collection`, `price`, `currency`, `stock`, `description`.

**Example call:**
```json
{ "name": "get_product_info", "arguments": { "productId": "prod_001" } }
```
**Example response:**
```json
{
  "id": "prod_001",
  "name": "Adaeze Beaded Clutch",
  "collection": "Evening",
  "price": 85,
  "currency": "GBP",
  "stock": 12,
  "description": "Hand-beaded clutch bag with a braided strap, made in a classic evening silhouette."
}
```

### `check_order_status`

Look up an order by ID. Resolves each line item into its full product object in the same call, so an agent doesn't need to chain a second lookup.

| Input | Type | Required | Description |
|---|---|---|---|
| `orderId` | string | yes | Exact order ID, e.g. `order_1001` |

**Returns:** JSON object with `id`, `customerEmail`, `status` (`processing` \| `shipped` \| `delivered` \| `cancelled`), `items` (each resolved to its full product), `placedAt`, `shippingCountry`, and `trackingNumber` if available.

If the order ID doesn't exist, the tool returns an error result (`isError: true`) with a JSON `{ "error": "..." }` payload, rather than throwing — so an agent can handle it gracefully instead of crashing.

## Running it

```bash
npm install
npm run build
npm start          # runs the compiled server on stdio
```

For local development without a build step:
```bash
npm run dev         # runs src/index.ts directly via tsx
```

## Connecting it to an MCP client

Add to your client's MCP config (e.g. Claude Desktop's `claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "adunni-store": {
      "command": "node",
      "args": ["/absolute/path/to/adunni-mcp-server/dist/index.js"]
    }
  }
}
```

## Testing

A smoke test drives the server with real MCP JSON-RPC messages over stdio and asserts on the results (exact lookup, collection filtering, nested order resolution, and error handling for unknown IDs):

```bash
npm run build
node test/smoke-test.mjs
```

## Stack

TypeScript, [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk), [`zod`](https://www.npmjs.com/package/zod) for schema validation. Transport: stdio.

## Author

Fopefoluwa Ayo — [fopeayo@hotmail.com](mailto:fopeayo@hotmail.com)
