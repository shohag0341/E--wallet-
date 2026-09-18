// ============================================================
// DASHBOARD (Home) LOGIC
// ============================================================

const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const TYPE_LABEL = { deposit: "Deposit", withdraw: "Withdraw", admin_adjustment: "Adjustment" };

function formatMoney(n) {
  return "৳" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
         " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function renderTxRow(tx) {
  const sign = tx.type === "deposit" ? "+" : "-";
  const color = tx.type === "deposit" ? "var(--success)" : "var(--danger)";
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f1f1f5;">
      <div>
        <div style="font-weight:600; font-size:14px;">${TYPE_LABEL[tx.type] || tx.type}</div>
        <div style="font-size:12px; color:var(--text-muted);">${formatDate(tx.created_at)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700; color:${color}; font-size:14px;">${sign}${formatMoney(tx.amount)}</div>
        <span class="badge ${tx.status}">${STATUS_LABEL[tx.status] || tx.status}</span>
      </div>
    </div>
  `;
}

(async function init() {
  const auth = await requireAuth();
  if (!auth) return;

  // যদি admin ভুল করে dashboard এ চলে আসে, admin panel এ পাঠিয়ে দাও
  if (auth.profile.role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  // --- Wallet balance load ---
  const { data: wallet, error: walletError } = await supabaseClient
    .from("wallets")
    .select("balance")
    .eq("user_id", auth.user.id)
    .single();

  if (!walletError && wallet) {
    document.getElementById("balanceAmount").textContent = formatMoney(wallet.balance);
  }

  // --- Recent transactions (last 5) ---
  const { data: txs, error: txError } = await supabaseClient
    .from("transactions")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const listEl = document.getElementById("recentTxList");
  if (txError) {
    listEl.innerHTML = `<div class="empty-state">লোড করা যায়নি।</div>`;
    return;
  }
  if (!txs || txs.length === 0) {
    listEl.innerHTML = `<div class="empty-state">এখনো কোনো লেনদেন হয়নি।</div>`;
    return;
  }
  listEl.innerHTML = txs.map(renderTxRow).join("");
})();
