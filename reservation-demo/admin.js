/**
 * Operator dashboard — loads existing reservations, then subscribes to
 * Supabase Realtime so new bookings from the customer form appear without a
 * refresh.
 */
(function () {
  "use strict";

  const configured =
    typeof window.SUPABASE_URL === "string" &&
    typeof window.SUPABASE_ANON_KEY === "string" &&
    window.SUPABASE_URL.startsWith("http") &&
    !window.SUPABASE_URL.includes("YOUR-PROJECT-REF");

  const banner = document.getElementById("config-banner");
  const statusPill = document.getElementById("status-pill");
  const statusLabel = document.getElementById("status-label");
  const tbody = document.getElementById("reservations-body");
  const emptyState = document.getElementById("empty-state");

  const statTotal = document.getElementById("stat-total");
  const statToday = document.getElementById("stat-today");
  const statGuestsToday = document.getElementById("stat-guests-today");

  if (!configured) {
    banner.classList.add("visible");
    statusLabel.textContent = "Not connected";
    return;
  }

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  let rows = [];

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(value) {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(value) {
    const [h, m] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  function formatTimestamp(value) {
    return new Date(value).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderStats() {
    const today = todayISO();
    const todaysRows = rows.filter((r) => r.reservation_date === today);

    statTotal.textContent = rows.length;
    statToday.textContent = todaysRows.length;
    statGuestsToday.textContent = todaysRows.reduce((sum, r) => sum + r.guest_count, 0);
  }

  function rowHTML(r) {
    const phone = r.phone_number
      ? `<span class="pill">${escapeHTML(r.phone_number)}</span>`
      : `<span class="pill muted">Not Provided</span>`;

    return `
      <tr data-id="${r.id}">
        <td>${formatDate(r.reservation_date)}</td>
        <td>${formatTime(r.reservation_time)}</td>
        <td><span class="guest-badge">${r.guest_count}</span></td>
        <td>${phone}</td>
        <td>${formatTimestamp(r.created_at)}</td>
      </tr>
    `;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderTable() {
    emptyState.style.display = rows.length ? "none" : "block";
    tbody.innerHTML = rows.map(rowHTML).join("");
    renderStats();
  }

  function prependRow(row) {
    if (rows.some((r) => r.id === row.id)) return;
    rows = [row, ...rows];
    renderTable();
    const tr = tbody.querySelector(`tr[data-id="${row.id}"]`);
    if (tr) {
      tr.classList.add("row-new");
      setTimeout(() => tr.classList.remove("row-new"), 2500);
    }
  }

  async function loadReservations() {
    const { data, error } = await client
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Failed to load reservations:", error);
      statusPill.classList.remove("live");
      statusLabel.textContent = "Connection error";
      return;
    }

    rows = data;
    renderTable();
  }

  function setLive() {
    statusPill.classList.add("live");
    statusLabel.textContent = "Live";
  }

  client
    .channel("reservations-dashboard")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "reservations" },
      (payload) => prependRow(payload.new),
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") setLive();
    });

  loadReservations();
})();
