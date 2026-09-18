// ============================================================
// DEPOSIT PAGE LOGIC
// ============================================================

// Demo-only address — এখানে real টাকা পাঠানো হবে না
const DEMO_USDT_ADDRESS = "0xDEMO000000000000000000000000000000TEST";

function showAlert(message, type = "error") {
  const box = document.getElementById("alertBox");
  box.textContent = message;
  box.className = `alert show ${type}`;
}

function hideAlert() {
  document.getElementById("alertBox").className = "alert";
}

document.getElementById("depositAddress").textContent = DEMO_USDT_ADDRESS;

document.getElementById("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(DEMO_USDT_ADDRESS);
    const btn = document.getElementById("copyBtn");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  } catch (err) {
    showAlert("Copy করা যায়নি, ম্যানুয়ালি সিলেক্ট করে কপি করো।");
  }
});

let currentUser = null;

(async function init() {
  const auth = await requireAuth();
  if (!auth) return;
  currentUser = auth.user;
})();

document.getElementById("depositForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  if (!currentUser) {
    showAlert("লগইন ভেরিফাই করা যায়নি, পেজ রিফ্রেশ করো।");
    return;
  }

  const amount = parseFloat(document.getElementById("amount").value);
  const trxId = document.getElementById("trxId").value.trim();
  const btn = document.getElementById("submitBtn");

  if (amount < 20 || amount > 5000) {
    showAlert("Amount ২০ থেকে ৫০০০ USDT এর মধ্যে হতে হবে।");
    return;
  }
  if (trxId.length < 4) {
    showAlert("সঠিক TrxID দাও।");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Submitting...`;

  // ১. deposits টেবিলে entry
  const { data: deposit, error: depositError } = await supabaseClient
    .from("deposits")
    .insert({ user_id: currentUser.id, amount, trx_id: trxId, status: "pending" })
    .select()
    .single();

  if (depositError) {
    btn.disabled = false;
    btn.textContent = "Submit";
    showAlert("Deposit request পাঠানো যায়নি: " + depositError.message);
    return;
  }

  // ২. transactions টেবিলে matching history entry
  const { error: txError } = await supabaseClient
    .from("transactions")
    .insert({
      user_id: currentUser.id,
      type: "deposit",
      amount,
      status: "pending",
      reference_id: deposit.id
    });

  btn.disabled = false;
  btn.textContent = "Submit";

  if (txError) {
    console.error("Transaction log failed:", txError.message);
  }

  showAlert("Deposit request জমা হয়েছে! Admin approve করার পর balance আপডেট হবে।", "success");
  document.getElementById("depositForm").reset();
});
