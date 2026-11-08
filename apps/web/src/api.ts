export type OrderStatus = "pending" | "processing" | "fulfilled" | "cancelled";
export interface Order {
  id: string; order_number: number; customer_name: string; status: OrderStatus;
  total_cents: number; currency: string; created_at: string;
}
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Request failed (" + response.status + ")");
  return payload as T;
}
export async function getOrders(): Promise<Order[]> {
  const payload = await parseResponse<{ orders: Order[] }>(await fetch(API_BASE + "/orders"));
  return payload.orders;
}
export async function createOrder(customerName: string, totalCents: number): Promise<Order> {
  const response = await fetch(API_BASE + "/orders", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName, totalCents }),
  });
  return (await parseResponse<{ order: Order }>(response)).order;
}
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const response = await fetch(API_BASE + "/orders/" + encodeURIComponent(id) + "/status", {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return (await parseResponse<{ order: Order }>(response)).order;
}
