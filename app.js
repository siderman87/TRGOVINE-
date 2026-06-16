let state = { stores: [], users: [], closings: [], attachments: [], audit: [] };
let currentUser = JSON.parse(localStorage.getItem("b3-user") || "null");

const $ = (id) => document.getElementById(id);
const money = (v) => new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" }).format(Number(v || 0));
const today = () => new Date().toISOString().slice(0, 10);
const num = (id) => Number($(id).value || 0);

async function api(path, payload) {
  const res = await fetch(path, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Napaka");
  return data;
}

function seller(id) {
  return state.users.find((u) => u.id === id) || { name: "neznano", role: "" };
}

function store(id) {
  return state.stores.find((s) => s.id === id) || { name: "neznana trgovina", city: "" };
}

function canManage() {
  return ["administrator", "računovodstvo"].includes(currentUser?.role);
}

function visibleStores() {
  if (!currentUser?.store_id) return state.stores;
  return state.stores.filter((s) => s.id === currentUser.store_id);
}

function total(c) {
  return Number(c.cash_sales) + Number(c.card_sales) + Number(c.other_sales) - Number(c.refunds);
}

function variance(c) {
  return Number(c.cash_variance) + Number(c.card_variance);
}

function calcForm() {
  const expected = num("openingCash") + num("cashSales") - num("refunds") - num("deposit");
  $("expectedCash").textContent = money(expected);
  $("cashVariance").textContent = money(num("countedCash") - expected);
  $("cardVariance").textContent = money(num("cardStatement") - num("cardSales"));
}

async function refresh() {
  state = await api("/api/state");
  render();
}

function render() {
  if (!currentUser) return;
  $("currentUserName").textContent = currentUser.name;
  $("currentUserRole").textContent = currentUser.role;
  renderOptions();
  renderDashboard();
  renderReports();
  renderAdminTables();
  renderAudit();
}

function renderOptions() {
  const stores = visibleStores();
  $("storeId").innerHTML = stores.map((s) => `<option value="${s.id}">${s.name} - ${s.city}</option>`).join("");
  $("filterStore").innerHTML = `<option value="all">Vse trgovine</option>${stores.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}`;
  $("userStore").innerHTML = `<option value="">Vse trgovine</option>${state.stores.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}`;
  const users = state.users.filter((u) => u.active !== 0).filter((u) => !currentUser.store_id || !u.store_id || u.store_id === currentUser.store_id);
  $("sellerId").innerHTML = users.map((u) => `<option value="${u.id}">${u.name}</option>`).join("");
  $("filterSeller").innerHTML = `<option value="all">Vse prodajalke</option>${users.map((u) => `<option value="${u.id}">${u.name}</option>`).join("")}`;
}

function visibleClosings() {
  const storeIds = new Set(visibleStores().map((s) => s.id));
  return state.closings.filter((c) => storeIds.has(c.store_id));
}

function renderDashboard() {
  const rows = visibleClosings().filter((c) => c.closing_date === today());
  $("mRevenue").textContent = money(rows.reduce((s, c) => s + total(c), 0));
  $("mCash").textContent = money(rows.reduce((s, c) => s + Number(c.cash_sales), 0));
  $("mCards").textContent = money(rows.reduce((s, c) => s + Number(c.card_sales), 0));
  $("mVariance").textContent = money(rows.reduce((s, c) => s + Math.abs(variance(c)), 0));
  renderStoreChart();
  renderSellerStats();
}

function renderStoreChart() {
  const totals = visibleStores().map((s) => {
    const value = visibleClosings().filter((c) => c.store_id === s.id).reduce((sum, c) => sum + total(c), 0);
    return { name: s.name, value };
  });
  const max = Math.max(1, ...totals.map((r) => r.value));
  $("storeChart").innerHTML = totals.map((r) => `
    <div class="bar-row">
      <strong>${r.name}</strong>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (r.value / max) * 100)}%"></div></div>
      <span>${money(r.value)}</span>
    </div>
  `).join("") || `<p>Ni podatkov za graf.</p>`;
}

function renderSellerStats() {
  const map = new Map();
  visibleClosings().forEach((c) => {
    const key = c.seller_id;
    const row = map.get(key) || { count: 0, revenue: 0, variance: 0 };
    row.count += 1;
    row.revenue += total(c);
    row.variance += Math.abs(variance(c));
    map.set(key, row);
  });
  $("sellerStats").innerHTML = [...map.entries()].map(([id, r]) => `
    <tr><td>${seller(id).name}</td><td>${r.count}</td><td>${money(r.revenue)}</td><td>${money(r.variance / r.count)}</td></tr>
  `).join("") || `<tr><td colspan="4">Ni podatkov.</td></tr>`;
}

function filteredClosings() {
  const from = $("fromDate").value;
  const to = $("toDate").value;
  const storeId = $("filterStore").value;
  const sellerId = $("filterSeller").value;
  return visibleClosings()
    .filter((c) => !from || c.closing_date >= from)
    .filter((c) => !to || c.closing_date <= to)
    .filter((c) => storeId === "all" || c.store_id === storeId)
    .filter((c) => sellerId === "all" || c.seller_id === sellerId)
    .sort((a, b) => b.closing_date.localeCompare(a.closing_date));
}

function renderReports() {
  const rows = filteredClosings();
  const sums = {
    revenue: rows.reduce((s, c) => s + total(c), 0),
    cash: rows.reduce((s, c) => s + Number(c.cash_sales), 0),
    cards: rows.reduce((s, c) => s + Number(c.card_sales), 0),
    variance: rows.reduce((s, c) => s + variance(c), 0)
  };
  $("reportTotals").innerHTML = `
    <article><span>Promet</span><strong>${money(sums.revenue)}</strong></article>
    <article><span>Gotovina</span><strong>${money(sums.cash)}</strong></article>
    <article><span>Kartice</span><strong>${money(sums.cards)}</strong></article>
    <article class="warn"><span>Odstopanje</span><strong>${money(sums.variance)}</strong></article>
  `;
  $("closingRows").innerHTML = rows.map((c) => `
    <tr>
      <td>${c.closing_date}</td>
      <td>${store(c.store_id).name}</td>
      <td>${seller(c.seller_id).name}</td>
      <td><span class="badge ${c.status === "approved" ? "ok" : ""}">${c.status === "approved" ? "potrjeno" : "osnutek"}</span></td>
      <td>${money(total(c))}</td>
      <td>${money(variance(c))}</td>
      <td class="actions">
        ${c.status !== "approved" ? `<button class="secondary" data-edit-closing="${c.id}">Popravi</button><button class="primary" data-approve="${c.id}">Potrdi</button><button class="danger" data-delete="${c.id}">Izbriši</button>` : `<button class="secondary" data-view-closing="${c.id}">Ogled</button>`}
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7">Ni podatkov.</td></tr>`;
}

function renderAdminTables() {
  if (!canManage()) {
    $("storeRows").innerHTML = `<tr><td colspan="5">Za urejanje nastavitev moraš biti administrator ali računovodstvo.</td></tr>`;
    $("userRows").innerHTML = `<tr><td colspan="5">Za urejanje nastavitev moraš biti administrator ali računovodstvo.</td></tr>`;
    return;
  }
  $("storeRows").innerHTML = state.stores.map((s) => {
    const count = state.closings.filter((c) => c.store_id === s.id).length;
    return `<tr>
      <td>${s.name}</td><td>${s.city}</td><td>${s.manager}</td><td>${count}</td>
      <td class="actions"><button class="secondary" data-edit-store="${s.id}">Uredi</button><button class="danger" data-delete-store="${s.id}" ${count ? "disabled" : ""}>Izbriši</button></td>
    </tr>`;
  }).join("") || `<tr><td colspan="5">Ni trgovin.</td></tr>`;

  $("userRows").innerHTML = state.users.map((u) => {
    const canDelete = u.id !== currentUser.id;
    return `<tr>
      <td>${u.name}</td><td>${u.role}</td><td>${u.store_id ? store(u.store_id).name : "Vse trgovine"}</td><td>${u.active ? "aktiven" : "neaktiven"}</td>
      <td class="actions"><button class="secondary" data-edit-user="${u.id}">Uredi</button><button class="danger" data-delete-user="${u.id}" ${canDelete ? "" : "disabled"}>${u.active ? "Deaktiviraj" : "Odstrani"}</button></td>
    </tr>`;
  }).join("") || `<tr><td colspan="5">Ni uporabnikov.</td></tr>`;
}

function renderAudit() {
  $("auditList").innerHTML = state.audit.map((a) => `
    <div class="audit-row"><strong>${a.action}</strong><span>${a.user_name}</span><span>${new Date(a.created_at).toLocaleString("sl-SI")}</span></div>
  `).join("") || `<p>Ni revizijskih zapisov.</p>`;
}

async function filesToPayload(files) {
  return Promise.all([...files].map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, mime: file.type, data_url: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

async function saveClosing(e) {
  e.preventDefault();
  const payload = {
    user: currentUser,
    id: $("closingId").value || undefined,
    store_id: $("storeId").value,
    seller_id: $("sellerId").value,
    closing_date: $("closingDate").value,
    opening_cash: num("openingCash"),
    cash_sales: num("cashSales"),
    card_sales: num("cardSales"),
    other_sales: num("otherSales"),
    refunds: num("refunds"),
    deposit: num("deposit"),
    counted_cash: num("countedCash"),
    card_statement: num("cardStatement"),
    notes: $("notes").value,
    attachments: await filesToPayload($("attachments").files)
  };
  await api("/api/closings", payload);
  resetClosingForm();
  calcForm();
  await refresh();
  setView("reports");
}

function resetClosingForm() {
  $("closingForm").reset();
  $("closingId").value = "";
  $("closingDate").value = today();
  enableClosingForm(true);
}

function enableClosingForm(enabled) {
  ["storeId", "sellerId", "closingDate", "openingCash", "cashSales", "cardSales", "otherSales", "refunds", "deposit", "countedCash", "cardStatement", "notes", "attachments"].forEach((id) => {
    $(id).disabled = !enabled;
  });
  $("closingForm").querySelector('button[type="submit"]').disabled = !enabled;
}

function editClosing(id, viewOnly = false) {
  const c = state.closings.find((item) => item.id === id);
  if (!c) return;
  setView("closing");
  $("closingId").value = c.id;
  $("storeId").value = c.store_id;
  $("sellerId").value = c.seller_id;
  $("closingDate").value = c.closing_date;
  $("openingCash").value = c.opening_cash;
  $("cashSales").value = c.cash_sales;
  $("cardSales").value = c.card_sales;
  $("otherSales").value = c.other_sales;
  $("refunds").value = c.refunds;
  $("deposit").value = c.deposit;
  $("countedCash").value = c.counted_cash;
  $("cardStatement").value = c.card_statement;
  $("notes").value = c.notes || "";
  enableClosingForm(!viewOnly && c.status !== "approved");
  calcForm();
}

function setView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === name));
  document.querySelectorAll(".nav").forEach((n) => n.classList.toggle("active", n.dataset.view === name));
  const titles = {
    dashboard: ["Pregled", "Sinhroniziran pregled vseh trgovin v SQLite bazi."],
    closing: ["Zaključek", "Dnevni vnos prometa, štetja in dokazil."],
    reports: ["Poročila", "PDF/print poročila, filtri in potrjevanje."],
    tris: ["TRIS uvoz", "Uvoz dnevnih zaključkov iz TRIS CSV izvoza."],
    settings: ["Nastavitve", "Trgovine, prodajalke in revizijska sled."]
  };
  $("title").textContent = titles[name][0];
  $("subtitle").textContent = titles[name][1];
  render();
}

async function saveStore(e) {
  e.preventDefault();
  if (!canManage()) return alert("Samo administrator ali računovodstvo lahko ureja trgovine.");
  await api("/api/stores", { user: currentUser, id: $("editStoreId").value || undefined, name: $("storeName").value, city: $("storeCity").value, manager: $("storeManager").value });
  resetStoreForm();
  await refresh();
}

async function saveUser(e) {
  e.preventDefault();
  if (!canManage()) return alert("Samo administrator ali računovodstvo lahko ureja uporabnike.");
  await api("/api/users", { user: currentUser, id: $("editUserId").value || undefined, name: $("userName").value, pin: $("userPin").value, role: $("userRole").value, store_id: $("userStore").value || null });
  resetUserForm();
  await refresh();
}

function resetStoreForm() {
  $("storeForm").reset();
  $("editStoreId").value = "";
}

function resetUserForm() {
  $("userForm").reset();
  $("editUserId").value = "";
  $("userPin").required = true;
}

function editStore(id) {
  const s = state.stores.find((item) => item.id === id);
  if (!s) return;
  setView("settings");
  $("editStoreId").value = s.id;
  $("storeName").value = s.name;
  $("storeCity").value = s.city;
  $("storeManager").value = s.manager;
  $("storeName").focus();
}

function editUser(id) {
  const u = state.users.find((item) => item.id === id);
  if (!u) return;
  setView("settings");
  $("editUserId").value = u.id;
  $("userName").value = u.name;
  $("userRole").value = u.role;
  $("userStore").value = u.store_id || "";
  $("userPin").value = "";
  $("userPin").required = false;
  $("userName").focus();
}

function setMonth() {
  const month = today().slice(0, 7);
  $("fromDate").value = `${month}-01`;
  $("toDate").value = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toLocaleDateString("sv-SE");
  renderReports();
}

async function importTris() {
  const result = await api("/api/import-tris", { user: currentUser, csv: $("trisCsv").value });
  $("trisResult").textContent = JSON.stringify(result, null, 2);
  await refresh();
}

document.addEventListener("click", async (e) => {
  if (e.target.matches(".nav")) setView(e.target.dataset.view);
  if (e.target.id === "logoutBtn") {
    localStorage.removeItem("b3-user");
    currentUser = null;
    $("loginView").classList.remove("hidden");
    $("appView").classList.add("hidden");
  }
  if (e.target.id === "refreshBtn") await refresh();
  if (e.target.id === "newStoreBtn") resetStoreForm();
  if (e.target.id === "newUserBtn") resetUserForm();
  if (e.target.id === "monthBtn") setMonth();
  if (e.target.id === "printBtn") window.print();
  if (e.target.id === "importTrisBtn") importTris().catch((err) => alert(err.message));
  if (e.target.dataset.approve) {
    await api("/api/approve", { user: currentUser, id: e.target.dataset.approve });
    await refresh();
  }
  if (e.target.dataset.editClosing) editClosing(e.target.dataset.editClosing);
  if (e.target.dataset.viewClosing) editClosing(e.target.dataset.viewClosing, true);
  if (e.target.dataset.delete) {
    if (confirm("Izbrišem osnutek zaključka?")) {
      await api("/api/delete-closing", { user: currentUser, id: e.target.dataset.delete });
      await refresh();
    }
  }
  if (e.target.dataset.editStore) editStore(e.target.dataset.editStore);
  if (e.target.dataset.editUser) editUser(e.target.dataset.editUser);
  if (e.target.dataset.deleteStore) {
    if (confirm("Izbrišem trgovino? To je možno samo, če še nima zaključkov.")) {
      await api("/api/delete-store", { user: currentUser, id: e.target.dataset.deleteStore }).catch((err) => alert(err.message));
      await refresh();
    }
  }
  if (e.target.dataset.deleteUser) {
    if (confirm("Deaktiviram ali izbrišem uporabnika? Zaključki v zgodovini ostanejo.")) {
      await api("/api/delete-user", { user: currentUser, id: e.target.dataset.deleteUser }).catch((err) => alert(err.message));
      await refresh();
    }
  }
});

["openingCash", "cashSales", "cardSales", "otherSales", "refunds", "deposit", "countedCash", "cardStatement"].forEach((id) => {
  $(id).addEventListener("input", calcForm);
});
["fromDate", "toDate", "filterStore", "filterSeller"].forEach((id) => $(id).addEventListener("change", renderReports));

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginError").textContent = "";
  try {
    const data = await api("/api/login", { pin: $("pinInput").value });
    currentUser = data.user;
    localStorage.setItem("b3-user", JSON.stringify(currentUser));
    $("loginView").classList.add("hidden");
    $("appView").classList.remove("hidden");
    await refresh();
  } catch (err) {
    $("loginError").textContent = err.message;
  }
});
$("closingForm").addEventListener("submit", (e) => saveClosing(e).catch((err) => alert(err.message)));
$("storeForm").addEventListener("submit", (e) => saveStore(e).catch((err) => alert(err.message)));
$("userForm").addEventListener("submit", (e) => saveUser(e).catch((err) => alert(err.message)));
$("trisFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) $("trisCsv").value = await file.text();
});
resetClosingForm();
setMonth();
calcForm();
if (currentUser) {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  refresh();
}
