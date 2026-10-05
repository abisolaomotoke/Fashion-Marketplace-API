# Fashion Marketplace API

A public REST API that serves realistic fashion marketplace data: sellers, products, product colours, customers and orders. Anyone can call it from the internet.

Live URL: https://fashion-marketplace-api-rmz4.onrender.com

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
| colours | array | Yes | Product colours with id, colour and stockQuantity. Included in product responses |

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

## Base URL

https://fashion-marketplace-api-rmz4.onrender.com/api/v1

Try it:

```bash
curl "https://fashion-marketplace-api-rmz4.onrender.com/api/v1/products?limit=2"
```
The API runs on a free plan, so the first request after a quiet period can take up to a minute.

## Endpoints

### GET /api/v1/products

List products, paginated.

| Query param    | Type    | Default   | Notes                                      |
|----------------|---------|-----------|--------------------------------------------|
| limit          | integer | 20        | Max 100                                    |
| offset         | integer | 0         | 0 or more                                  |
| category       | string  |           | `bags`, `shoes`, `clothes`, `accessories`  |
| targetAudience | string  |           | `men`, `women`, `unisex`                   |
| minPrice       | integer |           | Kobo                                       |
| sort           | string  | createdAt | Allowed fields only                        |
| order          | string  | asc       | `asc` or `desc`                            |

**Request**

```bash
curl "http://localhost:3000/api/v1/products?category=bags&limit=2"
```

**Response**

```json
{
  "data": [
    {
      "id": "b7a6d395-54b5-409c-8b63-b4baaa31f282",
      "sellerId": "dd37c7d5-d56b-4581-92cf-728feaf90e30",
      "name": "Tasty Duffel Bag",
      "imageUrl": "https://picsum.photos/seed/b7a6d395-54b5-409c-8b63-b4baaa31f282/400/400",
      "category": "bags",
      "targetAudience": "men",
      "price": 9300000,
      "currency": "NGN",
      "sizeOrDimensions": "Large",
      "colours": [
        {
          "id": "e4decb14-3411-4839-8323-c3a880c1e1f5",
          "colour": "Red",
          "stockQuantity": 13
        },
        {
          "id": "a8a27878-52f5-4eb9-bf25-7590286c4949",
          "colour": "Grey",
          "stockQuantity": 12
        },
        {
          "id": "9625c989-cdab-44cc-891d-7826e74c95c5",
          "colour": "Brown",
          "stockQuantity": 7
        },
        {
          "id": "8c32503d-47bf-4178-b4d4-cab13bd68ccd",
          "colour": "White",
          "stockQuantity": 29
        }
      ]
    },
    {
      "id": "16994348-4ba7-44f1-994d-f3b879c1c705",
      "sellerId": "d9390e4d-736f-4cd8-b35c-fbd9289284ee",
      "name": "Fresh Crossbody Bag",
      "imageUrl": "https://picsum.photos/seed/16994348-4ba7-44f1-994d-f3b879c1c705/400/400",
      "category": "bags",
      "targetAudience": "women",
      "price": 4350000,
      "currency": "NGN",
      "sizeOrDimensions": "Medium",
      "colours": [
        {
          "id": "2692dc0e-951c-4b77-8d42-c451b078b591",
          "colour": "Pink",
          "stockQuantity": 0
        },
        {
          "id": "9e80ceaf-0f44-4fda-a89d-78162373c037",
          "colour": "White",
          "stockQuantity": 4
        },
        {
          "id": "72499223-360c-4709-b1c4-6515a9624adc",
          "colour": "Blue",
          "stockQuantity": 0
        }
      ]
    }
  ],
  "meta": {
    "total": 64,
    "limit": 2,
    "offset": 0,
    "hasMore": true
  }
}
```
The list returns a short version of each product. Call `GET /api/v1/products/:id` to get the full product.


### GET /api/v1/products/:id

Get one full product.

**Request**

```bash
curl "http://localhost:3000/api/v1/products/b7a6d395-54b5-409c-8b63-b4baaa31f282"
```

**Response**

```json
{"data":{"id":"b7a6d395-54b5-409c-8b63-b4baaa31f282","sellerId":"dd37c7d5-d56b-4581-92cf-728feaf90e30","name":"Tasty Duffel Bag","imageUrl":"https://picsum.photos/seed/b7a6d395-54b5-409c-8b63-b4baaa31f282/400/400","category":"bags","targetAudience":"men","price":9300000,"currency":"NGN","sizeOrDimensions":"Large","description":"Discover the minor new Bike with an exciting mix of Plastic ingredients","material":"Canvas","createdAt":"2026-10-01T21:06:27.690Z","updatedAt":"2026-10-01T21:06:27.690Z","colours":[{"id":"e4decb14-3411-4839-8323-c3a880c1e1f5","colour":"Red","stockQuantity":13},{"id":"a8a27878-52f5-4eb9-bf25-7590286c4949","colour":"Grey","stockQuantity":12},{"id":"9625c989-cdab-44cc-891d-7826e74c95c5","colour":"Brown","stockQuantity":7},{"id":"8c32503d-47bf-4178-b4d4-cab13bd68ccd","colour":"White","stockQuantity":29}]},"meta":{}}
```

**Not found**

```bash
curl -i "http://localhost:3000/api/v1/products/00000000-0000-0000-0000-000000000000"
```

```json
{"error":{"code":"NOT_FOUND","message":"Product not found"}}
```

### GET /api/v1/sellers

List sellers, paginated.

| Query param | Type    | Default   | Notes               |
|-------------|---------|-----------|---------------------|
| limit       | integer | 20        | Max 100             |
| offset      | integer | 0         | 0 or more           |
| city        | string  |           | Filter by city      |
| sort        | string  | createdAt | Allowed fields only |
| order       | string  | asc       | `asc` or `desc`     |

**Request**

```bash
curl "http://localhost:3000/api/v1/sellers?limit=2"
```

**Response**

```json
{"data":[{"id":"aad2f1bc-c8e1-4216-bfb5-d2d85af24edb","storeName":"Goyette Bags","city":"Enugu","createdAt":"2026-09-29T08:22:53.252Z"},{"id":"e40eeb83-b512-4f0f-aab0-e5d73c9db320","storeName":"Bergstrom Kicks","city":"Abuja","createdAt":"2026-09-29T04:46:01.709Z"}],"meta":{"total":50,"limit":2,"offset":0,"hasMore":true}}
```

### GET /api/v1/sellers/:id

Get one seller.

**Request**

```bash
curl "http://localhost:3000/api/v1/sellers/e40eeb83-b512-4f0f-aab0-e5d73c9db320"
```

**Response**

```json
{"data":{"id":"e40eeb83-b512-4f0f-aab0-e5d73c9db320","storeName":"Bergstrom Kicks","city":"Abuja","createdAt":"2026-09-29T04:46:01.709Z","_count":{"products":7}},"meta":{}}
```

**Not found**

```bash
curl -i "http://localhost:3000/api/v1/sellers/00000000-0000-0000-0000-000000000000"
```

```json
{"error":{"code":"NOT_FOUND","message":"Seller not found"}}
```

### GET /api/v1/sellers/:id/products

List the products of one seller, paginated.

Takes the same query parameters as `GET /api/v1/products`.

**Request**

```bash
curl "http://localhost:3000/api/v1/sellers/aad2f1bc-c8e1-4216-bfb5-d2d85af24edb/products?limit=2"
```

**Response**

```json
{"data":[{"id":"653e924e-3336-42b4-b333-316da9fae74e","sellerId":"aad2f1bc-c8e1-4216-bfb5-d2d85af24edb","name":"Modern Jeans","imageUrl":"https://picsum.photos/seed/653e924e-3336-42b4-b333-316da9fae74e/400/400","category":"clothes","targetAudience":"men","price":6350000,"currency":"NGN","sizeOrDimensions":"M","colours":[{"id":"8fb31447-98a4-422b-9a46-4199090f8f3b","colour":"Black","stockQuantity":29},{"id":"db313fa1-f668-4c18-9f69-b80db22bad6a","colour":"Orange","stockQuantity":26},{"id":"41668b80-b586-4581-ba8d-b1e4054b3496","colour":"Navy","stockQuantity":21}]},{"id":"dfae054d-8189-44c6-9b95-8076eee28bf5","sellerId":"aad2f1bc-c8e1-4216-bfb5-d2d85af24edb","name":"Handcrafted Heels","imageUrl":"https://picsum.photos/seed/dfae054d-8189-44c6-9b95-8076eee28bf5/400/400","category":"shoes","targetAudience":"unisex","price":8800000,"currency":"NGN","sizeOrDimensions":"EU 45","colours":[{"id":"07e3cbdb-e046-420b-adf8-fb1e87462806","colour":"Yellow","stockQuantity":3},{"id":"3c9c40b2-6af0-4866-94fc-44aca9e1e78a","colour":"Orange","stockQuantity":1}]}],"meta":{"total":8,"limit":2,"offset":0,"hasMore":true}}
```

### GET /api/v1/customers

List customers, paginated.

| Query param | Type    | Default   | Notes               |
|-------------|---------|-----------|---------------------|
| limit       | integer | 20        | Max 100             |
| offset      | integer | 0         | 0 or more           |
| email       | string  |           | Filter by email     |
| name        | string  |           | Filter by name      |
| sort        | string  | createdAt | Allowed fields only |
| order       | string  | asc       | `asc` or `desc`     |

**Request**

```bash
curl "http://localhost:3000/api/v1/customers?limit=2"
```

**Response**

```json
{"data":[{"id":"db6906bf-8cb3-49ea-ab1e-c7851c190669","name":"Ada Lovelace","email":"ada.readme@example.com","phone":"08012345678","createdAt":"2026-10-03T08:53:10.007Z"},{"id":"bf0cfcdc-d595-4585-828f-2d7c89cdbf04","name":"Skye Conn","email":"customer162@example.com","phone":"09012673163","createdAt":"2026-10-01T05:13:19.075Z"}],"meta":{"total":201,"limit":2,"offset":0,"hasMore":true}}
```

### GET /api/v1/customers/:id

Get one customer.

**Request**

```bash
curl "http://localhost:3000/api/v1/customers/bf0cfcdc-d595-4585-828f-2d7c89cdbf04"
```

**Response**

```json
{"data":{"id":"bf0cfcdc-d595-4585-828f-2d7c89cdbf04","name":"Skye Conn","email":"customer162@example.com","phone":"09012673163","createdAt":"2026-10-01T05:13:19.075Z","_count":{"orders":6}},"meta":{}}
```

**Not found**

```bash
curl -i "http://localhost:3000/api/v1/customers/00000000-0000-0000-0000-000000000000"
```

```json
{"error":{"code":"NOT_FOUND","message":"Customer not found"}}
```

### POST /api/v1/customers

Create a customer.

| search       | string  |            | Matches part of the name    |
| createdAfter | date    |            | Customers created after it  |
| sort         | string  | createdAt  | `name` or `createdAt`       |
| order        | string  | desc       | `asc` or `desc`             |

**Request**

```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada.readme@example.com","phone":"08012345678"}'
```

**Response (201 Created)**

```json
{"data":{"id":"db6906bf-8cb3-49ea-ab1e-c7851c190669","name":"Ada Lovelace","email":"ada.readme@example.com","phone":"08012345678","createdAt":"2026-10-03T08:53:10.007Z"},"meta":{}}
```

**Missing field (422)**

```json
{"error":{"code":"VALIDATION_ERROR","message":"email: email is required"}}
```

**Email already exists (409)**

```json
{"error":{"code":"CONFLICT","message":"A customer with this email already exists"}}
```


### GET /api/v1/orders

List orders, paginated.

| Query param | Type    | Default   | Notes                                                  |
|-------------|---------|-----------|--------------------------------------------------------|
| limit       | integer | 20        | Max 100                                                |
| offset      | integer | 0         | 0 or more                                              |
| status      | string  |           | `pending`, `paid`, `shipped`, `delivered`, `cancelled` |
| customerId  | UUID    |           | Only orders of this customer                           |
| minTotal    | integer |          | Kobo. Total of at least this                           |
| maxTotal    | integer |           | Kobo. Total of at most this. Not below `minTotal`      |
| sort        | string  | createdAt | `createdAt` or `total`                                 |
| order       | string  | desc      | `asc` or `desc`                                        |

**Request**

```bash
curl "http://localhost:3000/api/v1/orders?limit=2"
```

**Response**

```json
{"data":[{"id":"7aec80a2-a79b-445b-a411-1d549f52aa98","customerId":"7843fabe-fea6-469c-a60c-1c04e7ae9892","status":"shipped","total":31300000,"currency":"NGN","createdAt":"2026-10-02T05:10:34.645Z","_count":{"items":3}},{"id":"e4f35e7c-4793-4bfd-a082-4fe462750955","customerId":"efd5aafe-b52d-40cd-adf5-989104ed0b78","status":"shipped","total":18450000,"currency":"NGN","createdAt":"2026-10-02T00:36:55.912Z","_count":{"items":2}}],"meta":{"total":300,"limit":2,"offset":0,"hasMore":true}}
```

### GET /api/v1/orders/:id

Get one full order, with its items.

**Request**

```bash
curl "http://localhost:3000/api/v1/orders/YOUR-REAL-ORDER-ID"
```

**Response**

```json
{"data":{"id":"7aec80a2-a79b-445b-a411-1d549f52aa98","customerId":"7843fabe-fea6-469c-a60c-1c04e7ae9892","status":"shipped","total":31300000,"currency":"NGN","deliveryAddress":"74 Herbert Macaulay Way, Port Harcourt","createdAt":"2026-10-02T05:10:34.645Z","updatedAt":"2026-10-02T05:10:34.645Z","items":[{"id":"5f40db61-2a2a-43f0-a355-6f0d2702499c","productColourId":"e77cec0f-b6f0-4c26-bd53-7e09f3381911","productName":"Intelligent Wristwatch","colourName":"Red","unitPrice":3650000,"quantity":3},{"id":"df77e612-86ff-4930-a8b6-1f6a01ef9b08","productColourId":"a68180c7-df50-4463-87a3-55c75a134b81","productName":"Elegant Hoodie","colourName":"White","unitPrice":6950000,"quantity":2},{"id":"f8e181ed-61c8-4e72-bb47-807346f10884","productColourId":"122f8770-076e-4d43-8bba-e504e7615d7c","productName":"Luxurious Leather Belt","colourName":"Brown","unitPrice":2150000,"quantity":3}]},"meta":{}}
```

**Not found**

```bash
curl -i "http://localhost:3000/api/v1/orders/00000000-0000-0000-0000-000000000000"
```

```json
{"error":{"code":"NOT_FOUND","message":"Order not found"}}
```

### POST /api/v1/orders

Create an order. The API works out `total` from the items, so do not send it.

| Body field      | Type   | Required | Notes                          |
|-----------------|--------|----------|--------------------------------|
| customerId      | UUID   | Yes      | Must be an existing customer   |
| deliveryAddress | string | Yes      |                                |
| items           | array  | Yes      | At least one item              |

Each item:

| Field           | Type    | Required | Notes                                  |
|-----------------|---------|----------|----------------------------------------|
| productColourId | UUID    | Yes      | Must be an existing product colour     |
| quantity        | integer | Yes      | Greater than 0                         |

**Request**

```bash
curl -X POST "http://localhost:3000/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"7843fabe-fea6-469c-a60c-1c04e7ae9892","deliveryAddress":"12 Allen Avenue, Ikeja, Lagos","items":[{"productColourId":"a68180c7-df50-4463-87a3-55c75a134b81","quantity":1}]}'
```

**Response (201 Created)**

```json
{"data":{"id":"9eb143f4-2a9e-4bdc-9d7d-1c4727d5a42b","customerId":"7843fabe-fea6-469c-a60c-1c04e7ae9892","status":"pending","total":6950000,"currency":"NGN","deliveryAddress":"12 Allen Avenue, Ikeja, Lagos","createdAt":"2026-10-03T09:20:37.370Z","updatedAt":"2026-10-03T09:20:37.370Z","items":[{"id":"58b8e8d3-c68c-48e9-90c2-e29de8848c11","productColourId":"a68180c7-df50-4463-87a3-55c75a134b81","productName":"Elegant Hoodie","colourName":"White","unitPrice":6950000,"quantity":1}]},"meta":{}}
```

**Missing field (422)**

```json
{"error":{"code":"VALIDATION_ERROR","message":"deliveryAddress: Invalid input: expected string, received undefined"}}
```

### PATCH /api/v1/orders/:id

Update an order. Send only the fields you want to change.

| Body field | Type   | Required | Notes                                                  |
|------------|--------|----------|--------------------------------------------------------|
| status     | string | No       | `pending`, `paid`, `shipped`, `delivered`, `cancelled` |

**Request**

```bash
curl -X PATCH "http://localhost:3000/api/v1/orders/YOUR-REAL-ORDER-ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"paid"}'
```

**Response (200 OK)**

```json
{"data":{"id":"0de39090-20a7-4230-972d-29113b939ddd","customerId":"7843fabe-fea6-469c-a60c-1c04e7ae9892","status":"paid","total":6950000,"currency":"NGN","deliveryAddress":"12 Allen Avenue, Ikeja, Lagos","createdAt":"2026-10-03T09:28:40.222Z","updatedAt":"2026-10-03T09:33:38.199Z","items":[{"id":"282d60f2-d8a5-4085-85c8-71c7d0b51340","productColourId":"a68180c7-df50-4463-87a3-55c75a134b81","productName":"Elegant Hoodie","colourName":"White","unitPrice":6950000,"quantity":1}]},"meta":{}}
```

**Invalid status (422)**

```json
{"error":{"code":"VALIDATION_ERROR","message":"status: Invalid option: expected one of \"pending\"|\"paid\"|\"shipped\"|\"delivered\"|\"cancelled\""}}
```

### DELETE /api/v1/orders/:id

Delete an order.

**Request**

```bash
curl -i -X DELETE "http://localhost:3000/api/v1/orders/0de39090-20a7-4230-972d-29113b939ddd"
```

**Response (204 No Content)**

The response has no body.

**Not found (404)**

```json
{"error":{"code":"NOT_FOUND","message":"Order not found"}}
```

## Errors

Every error uses the same shape:

```json
{ "error": { "code": "NOT_FOUND", "message": "Product not found" } }
```

| Status | Code             | When it happens                                              |
|--------|------------------|--------------------------------------------------------------|
| 400    | VALIDATION_ERROR | Bad query value, such as a negative `offset` or unknown `sort` |
| 400    | MALFORMED_JSON   | The request body is not valid JSON                           |
| 404    | NOT_FOUND        | The resource or route does not exist                         |
| 409    | CONFLICT         | The email already belongs to a customer                      |
| 422    | VALIDATION_ERROR | A required field is missing or wrong in a request body       |
| 429    | RATE_LIMITED     | Too many requests                                            |

## Rate limiting

Each IP address can send 100 requests per minute. After that, the API returns `429` with a `Retry-After` header. The header gives the number of seconds to wait.

```json
{"error":{"code":"VALIDATION_ERROR","message":"offset: offset must be 0 or greater"}}{"error":{"code":"MALFORMED_JSON","message":"Request body is not valid JSON"}}
```

## Pagination

Every list endpoint returns `data` and `meta`. The default `limit` is 20 and the maximum is 100. A larger `limit` is clamped to 100.

```json
{ "data": [], "meta": { "total": 340, "limit": 20, "offset": 0, "hasMore": true } }
```

## Design decisions

### Why these resources
The API has sellers, products, product colours, customers and orders. They link to each other: a seller has many products, a product has many colours, and a customer has many orders. Each order holds items that point to product colours. I left out carts, payments and reviews to keep the scope small and the data model clear.

### Why generated identifiers
Every ID is a UUID. The alternative was a sequential integer, but anyone could then call `/products/1`, `/products/2` and so on to copy the whole dataset. UUIDs cannot be guessed.

### Why offset pagination
Lists use `limit` and `offset`. The alternative is cursor pagination. Offset is simple, and it lets a client jump to any page and show the total count. Its weakness is that results can shift if records are added or deleted between requests. Cursor pagination is better for very large or fast-changing data, such as a live feed, because it stays stable and stays fast on deep pages. For this dataset, which is a few hundred records per resource, offset is the better fit.

### Why this envelope
Every success response has `data` and `meta`. Every error has `error` with a `code` and a `message`. The alternative was a different shape per endpoint, but then every client would need special code for each one. One shape means a client writes its handling once. Errors always use an honest status code, never `200` with an error in the body.

### Why money is in kobo
Prices are whole numbers in kobo, with a `currency` field beside them. The alternative was decimal naira, but decimals cause rounding errors in totals. Whole numbers do not.

### Why versioned paths
Every path starts with `/api/v1`. If a field or route must change in a way that breaks clients, it can ship as `/api/v2` while `v1` keeps working.

