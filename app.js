console.log("APP.JS SE JE NALOŽIL");

const STORAGE_KEY = "blagajne-faza-1-2";
const SESSION_KEY = "blagajne-session";

const supabaseUrl = "https://meddfblefpposadxaljf.supabase.co";

const supabaseKey =
"sb_publishable_KmG74vMRJqz5ckg7tdY94Q_4Kg9H1cl";

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

async function testSupabase() {

    console.log("TEST SUPABASE ZAČETEK");

    const { data, error } = await supabaseClient
        .from("stores")
        .select("*");

    console.log("DATA:", data);
    console.log("ERROR:", error);

}

testSupabase();
const defaultUsers = [
  { id: "u-owner", name: "Gregor Lastnik", role: "administrator", storeIds: ["all"] },
  { id: "u-accounting", name: "Maja Računovodstvo", role: "računovodstvo", storeIds: ["all"] },
  { id: "u-manager-lj", name: "Nina Ljubljana", role: "poslovodja", storeIds: ["s-lj"] },
  { id: "u-cashier-mb", name: "Tomaž Maribor", role: "blagajnik", storeIds: ["s-mb"] }
];

const defaultState = {
  users: defaultUsers,
  activeUserId: "u-owner",
  stores: [
    { id: "s-lj", name: "Trgovina Center", city: "Ljubljana", manager: "Nina Ljubljana" },
    { id: "s-mb", name: "Trgovina Lent", city: "Maribor", manager: "Tomaž Maribor" }
  ],
  closings: [],
  audit: []
};

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  logoutBtn: document.querySelector("#logoutBtn"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  viewTitle: document.querySelector("#viewTitle"),
  viewSubtitle: document.querySelector("#viewSubtitle"),
  activeUserName: document.querySelector("#activeUserName"),
  activeRole: document.querySelector("#activeRole"),
  quickCloseBtn: document.querySelector("#quickCloseBtn"),
  seedDataBtn: document.querySelector("#seedDataBtn"),
  backupBtn: document.querySelector("#backupBtn"),
  storeTodayRows: document.querySelector("#storeTodayRows"),
  recentClosings: document.querySelector("#recentClosings"),
  approvalList: document.querySelector("#approvalList"),
  reportRows: document.querySelector("#reportRows"),
  reportSummary: document.querySelector("#reportSummary"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  importJsonBtn: document.querySelector("#importJsonBtn"),
  importJsonFile: document.querySelector("#importJsonFile"),
  monthFilterBtn: document.querySelector("#monthFilterBtn"),
  printReportBtn: document.querySelector("#printReportBtn"),
  clearDataBtn: document.querySelector("#clearDataBtn"),
  filterFrom: document.querySelector("#filterFrom"),
  filterTo: document.querySelector("#filterTo"),
  filterMonth: document.querySelector("#filterMonth"),
  filterStore: document.querySelector("#filterStore"),
  filterStatus: document.querySelector("#filterStatus"),
  storeList: document.querySelector("#storeList"),
  storeForm: document.querySelector("#storeForm"),
  storeEditId: document.querySelector("#storeEditId"),
  storeFormTitle: document.querySelector("#storeFormTitle"),
  storeSubmitBtn: document.querySelector("#storeSubmitBtn"),
  cancelStoreEditBtn: document.querySelector("#cancelStoreEditBtn"),
  userList: document.querySelector("#userList"),
  userForm: document.querySelector("#userForm"),
  userEditId: document.querySelector("#userEditId"),
  userFormTitle: document.querySelector("#userFormTitle"),
  userSubmitBtn: document.querySelector("#userSubmitBtn"),
  cancelUserEditBtn: document.querySelector("#cancelUserEditBtn"),
  userUsername: document.querySelector("#userUsername"),
  userPassword: document.querySelector("#userPassword"),
  userStoreAccess: document.querySelector("#userStoreAccess"),
  auditList: document.querySelector("#auditList"),
  closingForm: document.querySelector("#closingForm"),
  resetFormBtn: document.querySelector("#resetFormBtn"),
  closingSubmitBtn: document.querySelector("#closingSubmitBtn"),
  closingStatus: document.querySelector("#closingStatus"),
  storeId: document.querySelector("#storeId"),
  closingDate: document.querySelector("#closingDate"),
  openingCash: document.querySelector("#openingCash"),
  cashSales: document.querySelector("#cashSales"),
  cardSales: document.querySelector("#cardSales"),
  otherSales: document.querySelector("#otherSales"),
  refunds: document.querySelector("#refunds"),
  deposit: document.querySelector("#deposit"),
  countedCash: document.querySelector("#countedCash"),
  cardStatement: document.querySelector("#cardStatement"),
  notes: document.querySelector("#notes"),
  attachments: document.querySelector("#attachments"),
  expectedCash: document.querySelector("#expectedCash"),
  cashVariance: document.querySelector("#cashVariance"),
  cardVariance: document.querySelector("#cardVariance"),
  closingId: document.querySelector("#closingId"),
  todayRevenue: document.querySelector("#todayRevenue"),
  todayCash: document.querySelector("#todayCash"),
  todayCards: document.querySelector("#todayCards"),
  openVariance: document.querySelector("#openVariance")
};

const viewCopy = {
  dashboard: ["Pregled", "Dnevni promet, zaključki in odstopanja po trgovinah."],
  closing: ["Nov zaključek", "Vnos dnevnega zaključka z avtomatskim izračunom odstopanj."],
  approvals: ["Potrditve", "Pregled, potrjevanje in zaklepanje dnevnih zaključkov."],
  reports: ["Poročila", "Filtri, seštevki in izvoz podatkov za računovodstvo."],
  settings: ["Nastavitve", "Upravljanje trgovin, uporabnikov in varnostnih kopij."]
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return normalizeState(structuredClone(defaultState));
  try {
    return normalizeState({ ...structuredClone(defaultState), ...JSON.parse(saved) });
  } catch {
    return normalizeState(structuredClone(defaultState));
  }
}

function normalizeState(nextState) {
  const normalizedUsers = Array.isArray(nextState.users) && nextState.users.length ? nextState.users : structuredClone(defaultUsers);
  return {
    ...structuredClone(defaultState),
    ...nextState,
    users: normalizedUsers.map((user, index) => ({
      ...user,
      username: user.username || (user.role === "administrator" && index === 0 ? "admin" : user.name.toLowerCase().replaceAll(" ", ".").replaceAll("ÄŤ", "c").replaceAll("Ĺˇ", "s").replaceAll("Ĺľ", "z")),
      password: user.password || (user.role === "administrator" && index === 0 ? "admin123" : "1234")
    })),
    stores: Array.isArray(nextState.stores) ? nextState.stores : [],
    closings: Array.isArray(nextState.closings) ? nextState.closings : [],
    audit: Array.isArray(nextState.audit) ? nextState.audit : []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function todayIso(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function dateIsoLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function numberValue(id) {
  return Number(elements[id].value || 0);
}

function currentUser() {
  return state.users.find((user) => user.id === state.activeUserId);
}

function visibleStores() {
  const user = currentUser();
  if (!user) return [];
  if (user.storeIds.includes("all")) return state.stores;
  return state.stores.filter((store) => user.storeIds.includes(store.id));
}

function canApprove() {
  return ["administrator", "računovodstvo", "poslovodja"].includes(currentUser()?.role);
}

function canManageSettings() {
  return currentUser()?.role === "administrator";
}

function totalSales(closing) {
  return closing.cashSales + closing.cardSales + closing.otherSales - closing.refunds;
}

function expectedCashFor(values) {
  return values.openingCash + values.cashSales - values.refunds - values.deposit;
}

function cashVarianceFor(values) {
  return values.countedCash - expectedCashFor(values);
}

function cardVarianceFor(values) {
  return values.cardStatement - values.cardSales;
}

function closingCalculationsFromForm() {
  const values = {
    openingCash: numberValue("openingCash"),
    cashSales: numberValue("cashSales"),
    cardSales: numberValue("cardSales"),
    otherSales: numberValue("otherSales"),
    refunds: numberValue("refunds"),
    deposit: numberValue("deposit"),
    countedCash: numberValue("countedCash"),
    cardStatement: numberValue("cardStatement")
  };
  return {
    expectedCash: expectedCashFor(values),
    cashVariance: cashVarianceFor(values),
    cardVariance: cardVarianceFor(values)
  };
}

function renderCalculations() {
  const calc = closingCalculationsFromForm();
  elements.expectedCash.textContent = money(calc.expectedCash);
  elements.cashVariance.textContent = money(calc.cashVariance);
  elements.cardVariance.textContent = money(calc.cardVariance);
}

function setView(viewName) {
  elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  elements.views.forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${viewName}View`).classList.add("active");
  elements.viewTitle.textContent = viewCopy[viewName][0];
  elements.viewSubtitle.textContent = viewCopy[viewName][1];
  render();
}

function statusBadge(status) {
  const label = status === "approved" ? "Potrjeno" : "V čakanju";
  return `<span class="status ${status}">${label}</span>`;
}

function varianceTag(value) {
  const type = Math.abs(value) > 0.009 ? "warn" : "ok";
  const label = Math.abs(value) > 0.009 ? `Odstopanje ${money(value)}` : "Brez odstopanja";
  return `<span class="tag ${type}">${label}</span>`;
}

function storeName(storeId) {
  const store = state.stores.find((item) => item.id === storeId);
  return store ? `${store.name}, ${store.city}` : "Neznana trgovina";
}

function renderUsers() {
  const user = currentUser();
  elements.activeUserName.textContent = user?.name || "";
  elements.activeRole.textContent = user?.role || "";
}

function renderStoreOptions() {
  const options = visibleStores().map((store) => `<option value="${store.id}">${store.name} - ${store.city}</option>`).join("");
  elements.storeId.innerHTML = options;
  elements.filterStore.innerHTML = `<option value="all">Vse trgovine</option>${state.stores
    .map((store) => `<option value="${store.id}">${store.name} - ${store.city}</option>`)
    .join("")}`;
  elements.userStoreAccess.innerHTML = `<option value="all">Vse trgovine</option>${state.stores
    .map((store) => `<option value="${store.id}">${store.name} - ${store.city}</option>`)
    .join("")}`;
}

function renderDashboard() {
  const today = todayIso();
  const visibleStoreIds = visibleStores().map((store) => store.id);
  const todayClosings = state.closings.filter((closing) => closing.date === today && visibleStoreIds.includes(closing.storeId));
  const totals = todayClosings.reduce(
    (sum, closing) => {
      sum.revenue += totalSales(closing);
      sum.cash += closing.cashSales;
      sum.cards += closing.cardSales;
      return sum;
    },
    { revenue: 0, cash: 0, cards: 0 }
  );
  const openVariance = state.closings
    .filter((closing) => closing.status !== "approved" && visibleStoreIds.includes(closing.storeId))
    .reduce((sum, closing) => sum + Math.abs(closing.cashVariance) + Math.abs(closing.cardVariance), 0);

  elements.todayRevenue.textContent = money(totals.revenue);
  elements.todayCash.textContent = money(totals.cash);
  elements.todayCards.textContent = money(totals.cards);
  elements.openVariance.textContent = money(openVariance);

  elements.storeTodayRows.innerHTML = visibleStores()
    .map((store) => {
      const closing = todayClosings.find((item) => item.storeId === store.id);
      if (!closing) {
        return `<tr><td>${store.name}</td><td><span class="status missing">Ni zaključka</span></td><td>${money(0)}</td><td>${money(0)}</td><td>${money(0)}</td><td>${money(0)}</td></tr>`;
      }
      return `<tr>
        <td>${store.name}</td>
        <td>${statusBadge(closing.status)}</td>
        <td>${money(totalSales(closing))}</td>
        <td>${money(closing.cashSales)}</td>
        <td>${money(closing.cardSales)}</td>
        <td>${money(closing.cashVariance + closing.cardVariance)}</td>
      </tr>`;
    })
    .join("");

  renderClosingCards(elements.recentClosings, state.closings
    .filter((closing) => visibleStoreIds.includes(closing.storeId))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6), false);
}

function renderClosingCards(container, closings, approvalMode) {
  if (!closings.length) {
    container.innerHTML = `<div class="empty-state">Ni vnosov za prikaz.</div>`;
    return;
  }

  container.innerHTML = "";
  closings.forEach((closing) => {
    const template = document.querySelector("#closingCardTemplate").content.cloneNode(true);
    template.querySelector(".card-title").textContent = storeName(closing.storeId);
    template.querySelector(".card-meta").textContent = `${closing.date} | vnesel ${closing.createdByName}`;
    template.querySelector(".card-numbers").textContent = `Promet ${money(totalSales(closing))} | gotovina ${money(closing.cashSales)} | kartice ${money(closing.cardSales)}`;
    template.querySelector(".card-tags").innerHTML = `${statusBadge(closing.status)} ${varianceTag(closing.cashVariance + closing.cardVariance)} <span class="tag ok">${closing.attachments.length} dokazil</span>`;

    const actions = template.querySelector(".card-actions");
    const edit = document.createElement("button");
    edit.className = "secondary";
    edit.type = "button";
    edit.textContent = "Odpri";
    edit.addEventListener("click", () => editClosing(closing.id));
    actions.append(edit);

    if (closing.attachments.length) {
      const files = document.createElement("button");
      files.className = "secondary";
      files.type = "button";
      files.textContent = "Dokazila";
      files.addEventListener("click", () => viewAttachments(closing.id));
      actions.append(files);
    }

    if (approvalMode && closing.status !== "approved" && canApprove()) {
      const approve = document.createElement("button");
      approve.className = "primary";
      approve.type = "button";
      approve.textContent = "Potrdi";
      approve.addEventListener("click", () => approveClosing(closing.id));
      actions.append(approve);
    }

    if (closing.status !== "approved") {
      const remove = document.createElement("button");
      remove.className = "danger";
      remove.type = "button";
      remove.textContent = "Izbriši";
      remove.addEventListener("click", () => deleteClosing(closing.id));
      actions.append(remove);
    }

    container.append(template);
  });
}

function renderApprovals() {
  const visibleStoreIds = visibleStores().map((store) => store.id);
  const pending = state.closings
    .filter((closing) => closing.status !== "approved" && visibleStoreIds.includes(closing.storeId))
    .sort((a, b) => b.date.localeCompare(a.date));
  renderClosingCards(elements.approvalList, pending, true);
}

function filteredClosings() {
  const from = elements.filterFrom.value;
  const to = elements.filterTo.value;
  const store = elements.filterStore.value;
  const status = elements.filterStatus.value;
  const visibleStoreIds = visibleStores().map((item) => item.id);

  return state.closings
    .filter((closing) => visibleStoreIds.includes(closing.storeId))
    .filter((closing) => !from || closing.date >= from)
    .filter((closing) => !to || closing.date <= to)
    .filter((closing) => store === "all" || closing.storeId === store)
    .filter((closing) => status === "all" || closing.status === status)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderReports() {
  const closings = filteredClosings();
  const totals = closings.reduce(
    (sum, closing) => {
      sum.revenue += totalSales(closing);
      sum.cash += closing.cashSales;
      sum.cards += closing.cardSales;
      sum.variance += closing.cashVariance + closing.cardVariance;
      return sum;
    },
    { revenue: 0, cash: 0, cards: 0, variance: 0 }
  );

  elements.reportSummary.innerHTML = `
    <div><span>Promet</span><strong>${money(totals.revenue)}</strong></div>
    <div><span>Gotovina</span><strong>${money(totals.cash)}</strong></div>
    <div><span>Kartice</span><strong>${money(totals.cards)}</strong></div>
    <div><span>Odstopanje</span><strong>${money(totals.variance)}</strong></div>
  `;

  elements.reportRows.innerHTML = closings.length
    ? closings
        .map(
          (closing) => `<tr>
            <td>${closing.date}</td>
            <td>${storeName(closing.storeId)}</td>
            <td>${statusBadge(closing.status)}</td>
            <td>${money(totalSales(closing))}</td>
            <td>${money(closing.cashSales)}</td>
            <td>${money(closing.cardSales)}</td>
            <td>${money(closing.cashVariance + closing.cardVariance)}</td>
            <td><div class="inline-actions"><button class="secondary" type="button" data-edit="${closing.id}">Odpri</button>${closing.status !== "approved" ? `<button class="danger" type="button" data-delete-closing="${closing.id}">Izbriši</button>` : ""}</div></td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="8">Ni podatkov za izbrane filtre.</td></tr>`;
}

function renderStores() {
  elements.storeList.innerHTML = state.stores.length
    ? state.stores
        .map(
          (store) => `<article class="store-item">
        <strong>${store.name}</strong>
        <span>${store.city}</span>
        <span>Odgovorna oseba: ${store.manager}</span>
        <div class="inline-actions">
          <button class="secondary" type="button" data-edit-store="${store.id}">Uredi</button>
          <button class="danger" type="button" data-delete-store="${store.id}">Odstrani</button>
        </div>
      </article>`
        )
        .join("")
    : `<div class="empty-state">Ni vnesenih trgovin. Dodaj prvo trgovino z obrazcem na levi.</div>`;
}

function renderUsersList() {
  elements.userList.innerHTML = state.users.length
    ? state.users
        .map((user) => {
          const access = user.storeIds.includes("all")
            ? "Vse trgovine"
            : user.storeIds.map((storeId) => storeName(storeId)).join(", ");
          const locked = user.id === state.activeUserId || state.users.length === 1;
          return `<article class="store-item">
            <strong>${user.name}</strong>
            <span>Uporabniško ime: ${user.username || "-"}</span>
            <span>${user.role}</span>
            <span>Dostop: ${access || "brez trgovin"}</span>
            <div class="inline-actions">
              <button class="secondary" type="button" data-edit-user="${user.id}">Uredi</button>
              <button class="danger" type="button" data-delete-user="${user.id}" ${locked ? "disabled" : ""}>Odstrani</button>
            </div>
          </article>`;
        })
        .join("")
    : `<div class="empty-state">Ni uporabnikov.</div>`;
}

function renderAudit() {
  const rows = state.audit.slice(0, 8);
  elements.auditList.innerHTML = rows.length
    ? rows
        .map((entry) => `<div class="audit-row"><strong>${entry.action}</strong><span>${entry.userName}</span><span>${new Date(entry.createdAt).toLocaleString("sl-SI")}</span></div>`)
        .join("")
    : `<div class="empty-state">Revizijska sled je prazna.</div>`;
}

function render() {
  if (!currentUser()) {
    showLogin();
    return;
  }
  showApp();
  renderUsers();
  renderStoreOptions();
  renderDashboard();
  renderApprovals();
  renderReports();
  renderStores();
  renderUsersList();
  renderAudit();
  renderCalculations();
}

function showLogin() {
  elements.loginScreen.classList.remove("hidden");
  elements.appShell.classList.add("hidden");
}

function showApp() {
  elements.loginScreen.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
}

function login(event) {
  event.preventDefault();
  const username = elements.loginUsername.value.trim().toLowerCase();
  const password = elements.loginPassword.value;
  const user = state.users.find((item) => (item.username || "").toLowerCase() === username && item.password === password);
  if (!user) {
    elements.loginError.textContent = "Napačno uporabniško ime ali geslo.";
    return;
  }
  state.activeUserId = user.id;
  localStorage.setItem(SESSION_KEY, user.id);
  elements.loginError.textContent = "";
  elements.loginForm.reset();
  addAudit("login", user.id);
  saveState();
  render();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  state.activeUserId = "";
  showLogin();
}

async function filesToAttachments(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

function resetClosingForm() {
  elements.closingForm.reset();
  elements.closingId.value = "";
  elements.closingDate.value = todayIso();
  elements.otherSales.value = "0";
  elements.refunds.value = "0";
  elements.deposit.value = "0";
  setClosingFormLocked(false);
  renderStoreOptions();
  renderCalculations();
}

function setClosingFormLocked(locked, closing = null) {
  const fields = [
    "storeId",
    "closingDate",
    "openingCash",
    "cashSales",
    "cardSales",
    "otherSales",
    "refunds",
    "deposit",
    "countedCash",
    "cardStatement",
    "notes",
    "attachments"
  ];
  fields.forEach((id) => {
    elements[id].disabled = locked;
  });
  elements.closingSubmitBtn.disabled = locked;
  elements.closingStatus.textContent = locked
    ? `Zaključek je potrjen in zaklenjen. Potrdil: ${closing?.approvedBy || "neznano"}.`
    : "";
  elements.closingStatus.classList.toggle("visible", locked);
}

function resetStoreForm() {
  elements.storeForm.reset();
  elements.storeEditId.value = "";
  elements.storeFormTitle.textContent = "Dodaj trgovino";
  elements.storeSubmitBtn.textContent = "Dodaj trgovino";
}

function resetUserForm() {
  elements.userForm.reset();
  elements.userEditId.value = "";
  elements.userPassword.required = true;
  elements.userPassword.placeholder = "Obvezno za novega uporabnika";
  elements.userFormTitle.textContent = "Dodaj uporabnika";
  elements.userSubmitBtn.textContent = "Dodaj uporabnika";
}

async function saveClosing(event) {
  event.preventDefault();
  if (!elements.storeId.value) {
    alert("Najprej dodaj trgovino ali izberi uporabnika, ki ima dostop do trgovine.");
    return;
  }
  const existing = state.closings.find((closing) => closing.id === elements.closingId.value);
  if (existing && existing.status === "approved") {
    alert("Potrjenega zaključka ni mogoče spreminjati.");
    return;
  }
  const duplicate = state.closings.find(
    (closing) =>
      closing.storeId === elements.storeId.value &&
      closing.date === elements.closingDate.value &&
      closing.id !== elements.closingId.value
  );
  if (duplicate) {
    alert("Za to trgovino in datum zaključek že obstaja. Odpri obstoječi zaključek in ga popravi.");
    return;
  }

  const calc = closingCalculationsFromForm();
  const attachments = await filesToAttachments(elements.attachments.files);
  const user = currentUser();
  const closing = {
    id: elements.closingId.value || crypto.randomUUID(),
    storeId: elements.storeId.value,
    date: elements.closingDate.value,
    openingCash: numberValue("openingCash"),
    cashSales: numberValue("cashSales"),
    cardSales: numberValue("cardSales"),
    otherSales: numberValue("otherSales"),
    refunds: numberValue("refunds"),
    deposit: numberValue("deposit"),
    countedCash: numberValue("countedCash"),
    cardStatement: numberValue("cardStatement"),
    expectedCash: calc.expectedCash,
    cashVariance: calc.cashVariance,
    cardVariance: calc.cardVariance,
    notes: elements.notes.value.trim(),
    attachments: attachments.length ? attachments : existing?.attachments || [],
    status: existing?.status || "draft",
    createdBy: existing?.createdBy || user.id,
    createdByName: existing?.createdByName || user.name,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.closings = existing
    ? state.closings.map((item) => (item.id === closing.id ? closing : item))
    : [closing, ...state.closings];
  addAudit(existing ? "updated" : "created", closing.id);
  saveState();
  resetClosingForm();
  setView("dashboard");
}

function addAudit(action, closingId) {
  state.audit.unshift({
    id: crypto.randomUUID(),
    action,
    closingId,
    userId: currentUser().id,
    userName: currentUser().name,
    createdAt: new Date().toISOString()
  });
}

function approveClosing(id) {
  if (!canApprove()) {
    alert("Ta uporabnik nima pravice potrjevanja.");
    return;
  }
  state.closings = state.closings.map((closing) =>
    closing.id === id
      ? { ...closing, status: "approved", approvedBy: currentUser().name, approvedAt: new Date().toISOString() }
      : closing
  );
  addAudit("approved", id);
  saveState();
  render();
}

function deleteClosing(id) {
  const closing = state.closings.find((item) => item.id === id);
  if (!closing || closing.status === "approved") return;
  if (!confirm("Izbrišem ta osnutek zaključka? Potrjenih zaključkov ni mogoče izbrisati.")) return;
  state.closings = state.closings.filter((item) => item.id !== id);
  addAudit("deleted", id);
  saveState();
  render();
}

function viewAttachments(id) {
  const closing = state.closings.find((item) => item.id === id);
  if (!closing || !closing.attachments.length) return;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Brskalnik je blokiral novo okno za dokazila.");
    return;
  }
  const files = closing.attachments
    .map((file) => {
      const safeName = escapeHtml(file.name);
      if (file.type?.startsWith("image/")) {
        return `<article><h2>${safeName}</h2><img src="${file.dataUrl}" alt="${safeName}"></article>`;
      }
      if (file.type === "application/pdf") {
        return `<article><h2>${safeName}</h2><iframe src="${file.dataUrl}" title="${safeName}"></iframe></article>`;
      }
      return `<article><h2>${safeName}</h2><a href="${file.dataUrl}" download="${safeName}">Prenesi dokazilo</a></article>`;
    })
    .join("");
  win.document.write(`<!doctype html><html lang="sl"><head><meta charset="utf-8"><title>Dokazila</title><style>body{font-family:Arial,sans-serif;margin:24px;background:#f4f6f8;color:#1e252c}article{background:white;border:1px solid #dfe5ea;border-radius:8px;margin-bottom:16px;padding:16px}img{max-width:100%;height:auto}iframe{width:100%;height:80vh;border:1px solid #dfe5ea}</style></head><body><h1>Dokazila: ${escapeHtml(storeName(closing.storeId))} ${closing.date}</h1>${files}</body></html>`);
  win.document.close();
}

function editClosing(id) {
  const closing = state.closings.find((item) => item.id === id);
  if (!closing) return;
  setView("closing");
  elements.closingId.value = closing.id;
  elements.storeId.value = closing.storeId;
  elements.closingDate.value = closing.date;
  elements.openingCash.value = closing.openingCash;
  elements.cashSales.value = closing.cashSales;
  elements.cardSales.value = closing.cardSales;
  elements.otherSales.value = closing.otherSales;
  elements.refunds.value = closing.refunds;
  elements.deposit.value = closing.deposit;
  elements.countedCash.value = closing.countedCash;
  elements.cardStatement.value = closing.cardStatement;
  elements.notes.value = closing.notes;
  elements.attachments.value = "";
  setClosingFormLocked(closing.status === "approved", closing);
  renderCalculations();
}

function saveStore(event) {
  event.preventDefault();
  if (!canManageSettings()) {
    alert("Samo administrator ali računovodstvo lahko ureja trgovine.");
    return;
  }
  const id = elements.storeEditId.value || crypto.randomUUID();
  const name = document.querySelector("#storeName").value.trim();
  const city = document.querySelector("#storeCity").value.trim();
  const duplicate = state.stores.find((store) => store.id !== id && store.name.toLowerCase() === name.toLowerCase() && store.city.toLowerCase() === city.toLowerCase());
  if (duplicate) {
    alert("Trgovina s tem nazivom in mestom že obstaja.");
    return;
  }
  const store = {
    id,
    name: document.querySelector("#storeName").value.trim(),
    city: document.querySelector("#storeCity").value.trim(),
    manager: document.querySelector("#storeManager").value.trim()
  };
  state.stores = elements.storeEditId.value
    ? state.stores.map((item) => (item.id === id ? store : item))
    : [...state.stores, store];
  addAudit(elements.storeEditId.value ? "store_updated" : "store_created", id);
  resetStoreForm();
  saveState();
  render();
}

function editStore(id) {
  const store = state.stores.find((item) => item.id === id);
  if (!store) return;
  elements.storeEditId.value = store.id;
  document.querySelector("#storeName").value = store.name;
  document.querySelector("#storeCity").value = store.city;
  document.querySelector("#storeManager").value = store.manager;
  elements.storeFormTitle.textContent = "Uredi trgovino";
  elements.storeSubmitBtn.textContent = "Shrani spremembe";
}

function saveUser(event) {
  event.preventDefault();
  if (!canManageSettings()) {
    alert("Samo administrator lahko dodaja uporabnike in spreminja gesla.");
    return;
  }
  const storeAccess = elements.userStoreAccess.value;
  const id = elements.userEditId.value || crypto.randomUUID();
  const existing = state.users.find((item) => item.id === id);
  const username = elements.userUsername.value.trim().toLowerCase();
  const password = elements.userPassword.value || existing?.password || "";
  if (!username) {
    alert("Vnesi uporabniško ime.");
    return;
  }
  if (!password) {
    alert("Za novega uporabnika vnesi geslo.");
    return;
  }
  const duplicate = state.users.find((item) => item.id !== id && (item.username || "").toLowerCase() === username);
  if (duplicate) {
    alert("To uporabniško ime je že uporabljeno.");
    return;
  }
  const user = {
    id,
    name: document.querySelector("#userName").value.trim(),
    username,
    password,
    role: document.querySelector("#userRole").value,
    storeIds: storeAccess === "all" ? ["all"] : [storeAccess]
  };
  state.users = elements.userEditId.value
    ? state.users.map((item) => (item.id === id ? user : item))
    : [...state.users, user];
  addAudit(elements.userEditId.value ? "user_updated" : "user_created", id);
  resetUserForm();
  saveState();
  render();
}

function editUser(id) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return;
  elements.userEditId.value = user.id;
  document.querySelector("#userName").value = user.name;
  elements.userUsername.value = user.username || "";
  elements.userPassword.value = "";
  elements.userPassword.required = false;
  elements.userPassword.placeholder = "Pusti prazno, če ostane isto";
  document.querySelector("#userRole").value = user.role;
  elements.userStoreAccess.value = user.storeIds.includes("all") ? "all" : user.storeIds[0] || "all";
  elements.userFormTitle.textContent = "Uredi uporabnika";
  elements.userSubmitBtn.textContent = "Shrani spremembe";
}

function deleteStore(id) {
  if (!canManageSettings()) {
    alert("Samo administrator ali računovodstvo lahko odstrani trgovino.");
    return;
  }
  const hasClosings = state.closings.some((closing) => closing.storeId === id);
  const message = hasClosings
    ? "Ta trgovina ima zaključke. Če jo odstraniš, se izbrišejo tudi njeni zaključki. Nadaljujem?"
    : "Odstranim to trgovino?";
  if (!confirm(message)) return;
  state.stores = state.stores.filter((store) => store.id !== id);
  state.closings = state.closings.filter((closing) => closing.storeId !== id);
  state.users = state.users.map((user) => {
    if (user.storeIds.includes("all")) return user;
    return { ...user, storeIds: user.storeIds.filter((storeId) => storeId !== id) };
  });
  addAudit("store_deleted", id);
  saveState();
  resetStoreForm();
  resetClosingForm();
  render();
}

function deleteUser(id) {
  if (!canManageSettings()) {
    alert("Samo administrator ali računovodstvo lahko odstrani uporabnika.");
    return;
  }
  if (id === state.activeUserId || state.users.length === 1) return;
  if (!confirm("Odstranim tega uporabnika? Zaključki, ki jih je že vnesel, ostanejo v zgodovini.")) return;
  state.users = state.users.filter((user) => user.id !== id);
  addAudit("user_deleted", id);
  saveState();
  resetUserForm();
  render();
}

function clearAllBusinessData() {
  if (!confirm("To izbriše vse trgovine, zaključke, dokazila in demo podatke v tem brskalniku. Uporabniki ostanejo. Nadaljujem?")) return;
  state = normalizeState({
    ...structuredClone(defaultState),
    activeUserId: state.activeUserId,
    users: state.users,
    stores: [],
    closings: [],
    audit: []
  });
  saveState();
  resetClosingForm();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function seedData() {
  const demoStores = structuredClone(defaultState.stores);
  demoStores.forEach((store) => {
    if (!state.stores.some((existing) => existing.id === store.id)) {
      state.stores.push(store);
    }
  });

  const demoClosings = [
    {
      storeId: "s-lj",
      date: todayIso(),
      openingCash: 150,
      cashSales: 842.4,
      cardSales: 1288.9,
      otherSales: 62,
      refunds: 34.9,
      deposit: 700,
      countedCash: 257.5,
      cardStatement: 1288.9,
      notes: "Reden zaključek.",
      status: "draft"
    },
    {
      storeId: "s-mb",
      date: todayIso(),
      openingCash: 120,
      cashSales: 518.2,
      cardSales: 934.1,
      otherSales: 25,
      refunds: 19.5,
      deposit: 480,
      countedCash: 138.7,
      cardStatement: 930.1,
      notes: "POS izpisek ima razliko 4 EUR.",
      status: "draft"
    },
    {
      storeId: "s-lj",
      date: todayIso(-1),
      openingCash: 150,
      cashSales: 762.2,
      cardSales: 1120.45,
      otherSales: 47,
      refunds: 22,
      deposit: 720,
      countedCash: 170.2,
      cardStatement: 1120.45,
      notes: "Potrjeno brez pripomb.",
      status: "approved"
    }
  ].map((item) => {
    const expectedCash = expectedCashFor(item);
    return {
      ...item,
      id: crypto.randomUUID(),
      expectedCash,
      cashVariance: item.countedCash - expectedCash,
      cardVariance: item.cardStatement - item.cardSales,
      attachments: [{ name: "demo-z-izpisek.txt", type: "text/plain", size: 0, dataUrl: "" }],
      createdBy: currentUser().id,
      createdByName: currentUser().name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  state.closings = [...demoClosings, ...state.closings];
  saveState();
  render();
}

function exportCsv() {
  const rows = filteredClosings();
  const header = ["datum", "trgovina", "status", "promet", "gotovina", "kartice", "drugo", "vracila", "polog", "odstopanje_gotovina", "odstopanje_kartice", "opombe"];
  const lines = [header.join(";")].concat(
    rows.map((closing) =>
      [
        closing.date,
        storeName(closing.storeId),
        closing.status,
        totalSales(closing).toFixed(2),
        closing.cashSales.toFixed(2),
        closing.cardSales.toFixed(2),
        closing.otherSales.toFixed(2),
        closing.refunds.toFixed(2),
        closing.deposit.toFixed(2),
        closing.cashVariance.toFixed(2),
        closing.cardVariance.toFixed(2),
        `"${closing.notes.replaceAll('"', '""')}"`
      ].join(";")
    )
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `blagajne-porocilo-${todayIso()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "blagajne-faza-1-2",
    version: 2,
    data: state
  };
  downloadFile(`blagajne-backup-${todayIso()}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = parsed.data || parsed;
      if (!Array.isArray(imported.users) || !Array.isArray(imported.stores) || !Array.isArray(imported.closings)) {
        throw new Error("Invalid backup");
      }
      if (!confirm("Uvoz bo zamenjal trenutne podatke v tem brskalniku. Nadaljujem?")) return;
      state = normalizeState(imported);
      if (!state.users.some((user) => user.id === state.activeUserId)) {
        state.activeUserId = state.users[0]?.id || "u-owner";
      }
      saveState();
      resetClosingForm();
      render();
    } catch {
      alert("Datoteka ni veljaven backup za ta program.");
    } finally {
      elements.importJsonFile.value = "";
    }
  };
  reader.readAsText(file);
}

function setCurrentMonthFilter() {
  const month = todayIso().slice(0, 7);
  elements.filterMonth.value = month;
  elements.filterFrom.value = `${month}-01`;
  const end = dateIsoLocal(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0));
  elements.filterTo.value = end;
  renderReports();
}

function applyMonthInput() {
  if (!elements.filterMonth.value) return;
  const month = elements.filterMonth.value;
  elements.filterFrom.value = `${month}-01`;
  elements.filterTo.value = dateIsoLocal(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0));
  renderReports();
}

elements.navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
elements.loginForm.addEventListener("submit", login);
elements.logoutBtn.addEventListener("click", logout);
elements.quickCloseBtn.addEventListener("click", () => setView("closing"));
elements.seedDataBtn.addEventListener("click", seedData);
elements.backupBtn.addEventListener("click", exportJson);
elements.closingForm.addEventListener("submit", saveClosing);
elements.storeForm.addEventListener("submit", saveStore);
elements.userForm.addEventListener("submit", saveUser);
elements.resetFormBtn.addEventListener("click", resetClosingForm);
elements.cancelStoreEditBtn.addEventListener("click", resetStoreForm);
elements.cancelUserEditBtn.addEventListener("click", resetUserForm);
elements.exportCsvBtn.addEventListener("click", exportCsv);
elements.exportJsonBtn.addEventListener("click", exportJson);
elements.importJsonBtn.addEventListener("click", () => elements.importJsonFile.click());
elements.importJsonFile.addEventListener("change", (event) => importJson(event.target.files[0]));
elements.monthFilterBtn.addEventListener("click", setCurrentMonthFilter);
elements.printReportBtn.addEventListener("click", () => window.print());
elements.clearDataBtn.addEventListener("click", clearAllBusinessData);
elements.reportRows.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.deleteClosing;
  if (editId) editClosing(editId);
  if (deleteId) deleteClosing(deleteId);
});
elements.storeList.addEventListener("click", (event) => {
  const editId = event.target.dataset.editStore;
  const deleteId = event.target.dataset.deleteStore;
  if (editId) editStore(editId);
  if (deleteId) deleteStore(deleteId);
});
elements.userList.addEventListener("click", (event) => {
  const editId = event.target.dataset.editUser;
  const deleteId = event.target.dataset.deleteUser;
  if (editId) editUser(editId);
  if (deleteId) deleteUser(deleteId);
});
["openingCash", "cashSales", "cardSales", "otherSales", "refunds", "deposit", "countedCash", "cardStatement"].forEach((id) => {
  elements[id].addEventListener("input", renderCalculations);
});
elements.filterMonth.addEventListener("change", applyMonthInput);
["filterFrom", "filterTo", "filterStore", "filterStatus"].forEach((id) => {
  elements[id].addEventListener("change", renderReports);
});

resetClosingForm();
render();
