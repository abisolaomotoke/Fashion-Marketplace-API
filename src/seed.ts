import "dotenv/config";
import { faker } from "@faker-js/faker";
type ProductCategory = "bags" | "shoes" | "clothes" | "accessories";
type TargetAudience = "men" | "women" | "unisex";
type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";
import { prisma } from "./db";

// Same seed number = same data on every run
faker.seed(2026);

const COUNTS = { sellers: 50, customers: 200, products: 300, orders: 300 };

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City"];
const STREETS = ["Allen Avenue", "Adeola Odeku Street", "Awolowo Road", "Herbert Macaulay Way", "Ahmadu Bello Way", "Opebi Road", "Aba Road"];
const PHONE_PREFIXES = ["803", "806", "810", "813", "816", "703", "705", "708", "901", "902"];
const COLOURS = ["Black", "White", "Blue", "Red", "Green", "Yellow", "Brown", "Pink", "Grey", "Navy", "Beige", "Purple", "Orange"];

const TYPES: Record<ProductCategory, string[]> = {
    bags: ["Tote Bag", "Crossbody Bag", "Backpack", "Clutch", "Handbag", "Duffel Bag"],
    shoes: ["Sneakers", "Sandals", "Loafers", "Boots", "Slippers", "Heels"],
    clothes: ["Ankara Shirt", "Kaftan", "Gown", "Jeans", "Hoodie", "Agbada", "Polo Shirt"],
    accessories: ["Leather Belt", "Beaded Necklace", "Sunglasses", "Wristwatch", "Cap", "Scarf"],
};
const SIZES: Record<ProductCategory, string[]> = {
    bags: ["Small", "Medium", "Large"],
    shoes: ["EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"],
    clothes: ["S", "M", "L", "XL", "XXL"],
    accessories: ["One size", "Adjustable", "60 cm", "80 cm"],
};
const MATERIALS: Record<ProductCategory, string[]> = {
    bags: ["Leather", "Canvas", "Nylon"],
    shoes: ["Leather", "Canvas", "Rubber"],
    clothes: ["Cotton", "Linen", "Ankara cotton", "Denim"],
    accessories: ["Metal", "Beads", "Leather"],
};

async function main() {
    // 1. Clear everything, children first
    await prisma.$transaction([
        prisma.orderItem.deleteMany(),
        prisma.order.deleteMany(),
        prisma.productColour.deleteMany(),
        prisma.product.deleteMany(),
        prisma.customer.deleteMany(),
        prisma.seller.deleteMany(),
    ]);

    // 2. Sellers
    const sellers = Array.from({ length: COUNTS.sellers }, () => ({
        id: faker.string.uuid(),
        storeName: `${faker.person.lastName()} ${faker.helpers.arrayElement(["Bags", "Kicks", "Threads", "Styles", "Closet", "Fashion House"])}`,
        city: faker.helpers.arrayElement(CITIES),
        createdAt: faker.date.past({ years: 1 }),
    }));
    await prisma.seller.createMany({ data: sellers });

    // 3. Customers (email is unique, so the number goes into it)
    const customers = Array.from({ length: COUNTS.customers }, (_, i) => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: `customer${i + 1}@example.com`,
        phone: `0${faker.helpers.arrayElement(PHONE_PREFIXES)}${faker.string.numeric(7)}`,
        createdAt: faker.date.past({ years: 1 }),
    }));
    await prisma.customer.createMany({ data: customers });

    // 4. Products (prices are in kobo)
    const categories = Object.keys(TYPES) as ProductCategory[];
    const products = Array.from({ length: COUNTS.products }, () => {
        const category = faker.helpers.arrayElement(categories);
        const id = faker.string.uuid();
        const createdAt = faker.date.past({ years: 1 });
        return {
            id,
            sellerId: faker.helpers.arrayElement(sellers).id,
            name: `${faker.commerce.productAdjective()} ${faker.helpers.arrayElement(TYPES[category])}`,
            imageUrl: `https://picsum.photos/seed/${id}/400/400`,
            category,
            targetAudience: faker.helpers.weightedArrayElement<TargetAudience>([
                { weight: 40, value: "women" },
                { weight: 35, value: "men" },
                { weight: 25, value: "unisex" },
            ]),
            price: faker.number.int({ min: 6, max: 300 }) * 500 * 100,
            currency: "NGN",
            sizeOrDimensions: faker.helpers.arrayElement(SIZES[category]),
            description: faker.commerce.productDescription(),
            material: faker.datatype.boolean({ probability: 0.9 }) ? faker.helpers.arrayElement(MATERIALS[category]) : null,
            createdAt,
            updatedAt: createdAt,
        };
    });
    await prisma.product.createMany({ data: products });

    // 5. Colours (2 to 4 per product, about 1 in 7 sold out)
    const colours = products.flatMap((p) =>
        faker.helpers.arrayElements(COLOURS, { min: 2, max: 4 }).map((colour) => ({
            id: faker.string.uuid(),
            productId: p.id,
            colour,
            stockQuantity: faker.datatype.boolean({ probability: 0.15 }) ? 0 : faker.number.int({ min: 1, max: 40 }),
        })),
    );
    await prisma.productColour.createMany({ data: colours });

    // 6. Orders and their items (names and prices are copied, like a real purchase)
    const productById = new Map(products.map((p) => [p.id, p]));
    const orders: any[] = [];
    const items: any[] = [];

    for (let i = 0; i < COUNTS.orders; i++) {
        const orderId = faker.string.uuid();
        const createdAt = faker.date.recent({ days: 90 });
        const picked = faker.helpers.arrayElements(colours, { min: 1, max: 3 });
        let total = 0;

        for (const c of picked) {
            const product = productById.get(c.productId)!;
            const quantity = faker.number.int({ min: 1, max: 3 });
            total += product.price * quantity;
            items.push({
                id: faker.string.uuid(),
                orderId,
                productColourId: c.id,
                productName: product.name,
                colourName: c.colour,
                unitPrice: product.price,
                quantity,
            });
        }

        orders.push({
            id: orderId,
            customerId: faker.helpers.arrayElement(customers).id,
            status: faker.helpers.weightedArrayElement<OrderStatus>([
                { weight: 15, value: "pending" },
                { weight: 25, value: "paid" },
                { weight: 25, value: "shipped" },
                { weight: 30, value: "delivered" },
                { weight: 5, value: "cancelled" },
            ]),
            total,
            currency: "NGN",
            deliveryAddress: `${faker.number.int({ min: 1, max: 120 })} ${faker.helpers.arrayElement(STREETS)}, ${faker.helpers.arrayElement(CITIES)}`,
            createdAt,
            updatedAt: createdAt,
        });
    }
    await prisma.order.createMany({ data: orders });
    await prisma.orderItem.createMany({ data: items });

    console.log("Seeded:", {
        sellers: sellers.length,
        customers: customers.length,
        products: products.length,
        colours: colours.length,
        orders: orders.length,
        orderItems: items.length,
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
