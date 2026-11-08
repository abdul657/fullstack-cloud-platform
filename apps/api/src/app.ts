import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import type { Pool } from "pg";

const allowedStatuses = new Set(["pending", "processing", "fulfilled", "cancelled"]);

export function createApp(pool: Pool) {
  const app = express();
  const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", async (_request, response) => {
    try { await pool.query("SELECT 1"); response.json({ status: "ok", database: "connected" }); }
    catch { response.status(503).json({ status: "degraded", database: "unavailable" }); }
  });

  app.get("/api/orders", async (_request, response, next) => {
    try {
      const result = await pool.query(
        "SELECT id, order_number, customer_name, status, total_cents, currency, created_at FROM orders ORDER BY created_at DESC LIMIT 100"
      );
      response.json({ orders: result.rows });
    } catch (error) { next(error); }
  });

  app.post("/api/orders", async (request, response, next) => {
    const customerName = typeof request.body?.customerName === "string" ? request.body.customerName.trim() : "";
    const totalCents = request.body?.totalCents;
    if (!customerName || customerName.length > 120) {
      response.status(400).json({ error: "customerName must contain 1 to 120 characters." }); return;
    }
    if (!Number.isInteger(totalCents) || totalCents <= 0 || totalCents > 100000000) {
      response.status(400).json({ error: "totalCents must be a positive integer." }); return;
    }
    try {
      const result = await pool.query(
        "INSERT INTO orders (customer_name, total_cents) VALUES ($1, $2) RETURNING id, order_number, customer_name, status, total_cents, currency, created_at",
        [customerName, totalCents]
      );
      response.status(201).json({ order: result.rows[0] });
    } catch (error) { next(error); }
  });

  app.patch("/api/orders/:id/status", async (request, response, next) => {
    const status = request.body?.status;
    if (typeof status !== "string" || !allowedStatuses.has(status)) {
      response.status(400).json({ error: "status must be pending, processing, fulfilled, or cancelled." }); return;
    }
    try {
      const result = await pool.query(
        "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, order_number, customer_name, status, total_cents, currency, created_at",
        [status, request.params.id]
      );
      if (result.rowCount === 0) { response.status(404).json({ error: "Order not found." }); return; }
      response.json({ order: result.rows[0] });
    } catch (error) { next(error); }
  });

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    console.error("Unhandled API error:", error);
    response.status(500).json({ error: "An unexpected server error occurred." });
  };
  app.use(errorHandler);
  return app;
}
