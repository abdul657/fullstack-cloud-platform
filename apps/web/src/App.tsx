import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createOrder, getOrders, updateOrderStatus, type Order, type OrderStatus } from "./api";

const statuses: OrderStatus[] = ["pending", "processing", "fulfilled", "cancelled"];
function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("24.99");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try { setOrders(await getOrders()); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load orders."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const metrics = useMemo(() => ({
    total: orders.length,
    active: orders.filter((o) => o.status === "pending" || o.status === "processing").length,
    fulfilled: orders.filter((o) => o.status === "fulfilled").length,
    value: orders.reduce((sum, o) => sum + o.total_cents, 0),
  }), [orders]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!customerName.trim() || !Number.isFinite(cents) || cents <= 0) {
      setError("Enter a customer name and a positive amount."); return;
    }
    setSaving(true); setError("");
    try { await createOrder(customerName.trim(), cents); setCustomerName(""); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to create order."); }
    finally { setSaving(false); }
  }
  async function handleStatusChange(order: Order, status: OrderStatus) {
    try { await updateOrderStatus(order.id, status); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update order."); }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">CO</div>
        <div><p className="eyebrow">OPERATIONS WORKSPACE</p><h1>Commerce Console</h1></div>
        <span className="environment">DEMO ENVIRONMENT</span>
      </header>
      <section className="intro">
        <div><p className="eyebrow">OVERVIEW</p><h2>Order operations</h2><p className="muted">A compact view of order records and their current lifecycle states.</p></div>
        <button className="secondary-button" onClick={() => void refresh()} type="button">Refresh data</button>
      </section>
      {error && <div role="alert" className="alert">{error}</div>}
      <section className="metrics" aria-label="Order summary">
        <article className="metric"><span>Total orders</span><strong>{metrics.total}</strong></article>
        <article className="metric"><span>Active orders</span><strong>{metrics.active}</strong></article>
        <article className="metric"><span>Fulfilled</span><strong>{metrics.fulfilled}</strong></article>
        <article className="metric"><span>Recorded value</span><strong>{formatMoney(metrics.value, "USD")}</strong></article>
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">ORDER REGISTER</p><h3>Recent orders</h3></div><span className="count">{orders.length} records</span></div>
          {loading ? <p className="muted">Loading orders…</p> : (
            <div className="table-wrap">
              <table><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>{orders.map((order) => (
                  <tr key={order.id}><td className="order-id">#{order.order_number}</td><td>{order.customer_name}</td>
                    <td>{formatMoney(order.total_cents, order.currency)}</td>
                    <td><select aria-label={"Status for order " + order.order_number} value={order.status}
                      onChange={(event) => void handleStatusChange(order, event.target.value as OrderStatus)}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select></td>
                  </tr>
                ))}{orders.length === 0 && <tr><td colSpan={4} className="empty">No orders yet. Create one to get started.</td></tr>}</tbody>
              </table>
            </div>
          )}
        </article>
        <aside className="panel create-panel">
          <p className="eyebrow">QUICK ACTION</p><h3>Create an order record</h3>
          <p className="muted">Add a sample order to the local operations register.</p>
          <form onSubmit={handleCreate}>
            <label htmlFor="customer">Customer name</label>
            <input id="customer" value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={120} placeholder="e.g. Jordan Lee" required />
            <label htmlFor="amount">Order amount (USD)</label>
            <input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            <button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Add order"}</button>
          </form>
          <p className="fine-print">Demo data only. No payment is collected or processed.</p>
        </aside>
      </section>
      <footer>Built with React, TypeScript, Express, and PostgreSQL.</footer>
    </main>
  );
}
