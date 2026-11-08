import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Pool } from "pg";
import { createApp } from "../src/app";

function makePool(rows: unknown[] = [], rowCount = rows.length) {
  return { query: vi.fn().mockResolvedValue({ rows, rowCount }) } as unknown as Pool & { query: ReturnType<typeof vi.fn> };
}
afterEach(() => vi.restoreAllMocks());

describe("operations API", () => {
  it("reports database readiness", async () => {
    const response = await request(createApp(makePool())).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
  });
  it("lists orders", async () => {
    const response = await request(createApp(makePool([{ id: "order-1" }]))).get("/api/orders");
    expect(response.status).toBe(200);
    expect(response.body.orders).toHaveLength(1);
  });
  it("rejects invalid input without querying the database", async () => {
    const pool = makePool();
    const response = await request(createApp(pool)).post("/api/orders").send({ customerName: " ", totalCents: -10 });
    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("creates orders with parameterized SQL", async () => {
    const created = { id: "order-2", customer_name: "Demo", total_cents: 1299 };
    const pool = makePool([created]);
    const response = await request(createApp(pool)).post("/api/orders").send({ customerName: "Demo", totalCents: 1299 });
    expect(response.status).toBe(201);
    expect(response.body.order).toEqual(created);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("VALUES ($1, $2)"), ["Demo", 1299]);
  });
  it("rejects unsupported order statuses", async () => {
    const pool = makePool();
    const response = await request(createApp(pool)).patch("/api/orders/order-1/status").send({ status: "paid" });
    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
