# Fashion Marketplace API

A public REST API that serves realistic fashion marketplace data: sellers, products, product colours, customers and orders. Anyone can call it from the internet.

Live URL: _to be added after deployment_

## Resources

The API has five resource types. Order items are part of an order, so they appear inside the order and are not a separate resource.

All IDs are generated UUIDs, never sequential integers. Sequential numbers let anyone walk the whole dataset by counting (`/products/1`, `/products/2`, and so on). UUIDs cannot be guessed.

Money is a whole number in kobo, with a `currency` field beside it.

### Seller

| Field | Type | Required? | Notes |
|---|---|---|---|
| id | UUID | Yes | Generated |
| storeName | string | Yes | Store or brand name |
| city | string | Yes | Where the seller is based |
| createdAt | timestamp | Yes | |

### Product

| Field | Type | Required? | Notes |
|---|---|---|---|
| id | UUID | Yes | Generated |
| sellerId | UUID | Yes | Refers to a Seller |
| name | string | Yes | |
| imageUrl | string | Yes | |
| category | enum | Yes | `bags`, `shoes`, `clothes`, `accessories` |
| targetAudience | enum | Yes | `men`, `women`, `unisex` |
| price | integer | Yes | Kobo. Greater than 0 |
| currency | string | Yes | `NGN` |
| sizeOrDimensions | string | Yes | One fixed size per product |
| description | string | Yes | |
| material | string | No | |
| createdAt | timestamp | Yes | |
| updatedAt | timestamp | Yes | |

### Product Colour

| Field | Type | Required? | Notes |
|---|---|---|---|
| id | UUID | Yes | Generated |
| productId | UUID | Yes | Refers to a Product |
| colour | string | Yes | Unique within a product |
| stockQuantity | integer | Yes | 0 or more |

### Customer

| Field | Type | Required? | Notes |
|---|---|---|---|
| id | UUID | Yes | Generated |
| name | string | Yes | |
| email | string | Yes | Unique |
| phone | string | Yes | |
| createdAt | timestamp | Yes | |

### Order

| Field | Type | Required? | Notes |
|---|---|---|---|
| id | UUID | Yes | Generated |
| customerId | UUID | Yes | Refers to a Customer |
| status | enum | Yes | `pending`, `paid`, `shipped`, `delivered`, `cancelled` |
| total | integer | Yes | Kobo. Greater than 0. Worked out from the items |
| currency | string | Yes | `NGN` |
| deliveryAddress | string | Yes | |
| items | array | Yes | At least one item (see below) |
| createdAt | timestamp | Yes | |
| updatedAt | timestamp | Yes | |

Each item inside an order:

| Field | Type | Required? | Notes |
|---|---|---|---|
| id | UUID | Yes | Generated |
| productColourId | UUID | Yes | Refers to a Product Colour |
| productName | string | Yes | Copied at purchase time |
| colourName | string | Yes | Copied at purchase time |
| unitPrice | integer | Yes | Kobo. Copied at purchase time |
| quantity | integer | Yes | Greater than 0 |

## Relationships

- Seller → Product: one to many.
- Product → Product Colour: one to many.
- Customer → Order: one to many.
- Order → Order Item: one to many.
- Order Item → Product Colour: many to one.

An order is connected to products only through its items and their colours.

## What this API does not have

It follows the brief: no authentication for reading, no landing page, no admin panel. The API is the product. Carts, payments and reviews from the full marketplace design are left out to keep the scope small.