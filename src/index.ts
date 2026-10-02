import "dotenv/config";
import express from "express";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./errors";
import { productsRouter } from "./routes/products";
import { sellersRouter } from "./routes/sellers";
import { customersRouter } from "./routes/customers";
import { ordersRouter } from "./routes/orders";

const app = express();
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
    res.json({ data: { status: "ok" }, meta: {} });
});

app.use("/api/v1/products", productsRouter);
app.use("/api/v1/sellers", sellersRouter);
app.use("/api/v1/customers", customersRouter);
app.use("/api/v1/orders", ordersRouter);

// These two must stay last
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`API running on port ${config.port}`);
});
