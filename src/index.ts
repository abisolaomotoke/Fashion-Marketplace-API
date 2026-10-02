import "dotenv/config";
import express from "express";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./errors";
import { productsRouter } from "./routes/products";

const app = express();
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
    res.json({ data: { status: "ok" }, meta: {} });
});

app.use("/api/v1/products", productsRouter);

// These two must stay last
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`API running on port ${config.port}`);
});
