import "dotenv/config";
import express from "express";
import { config } from "./config";

const app = express();
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
    res.json({ data: { status: "ok" }, meta: {} });
});

app.listen(config.port, () => {
    console.log(`API running on port ${config.port}`);
});