// ============================================================
// AUTH PAGE LOGIC (index.html)
// ============================================================

function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const hint = document.getElementById("switchHint");

  hideAlert();

  if (tab === "login") {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    hint.innerHTML = `Don't have an account? <a href="#" onclick="switchTab('register'); return false;">Register</a>`;
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
    hint.innerHTML = `Already have an account? <a href="#" onclick="switchTab('login'); return false;">Login</a>`;
  }
}

function togglePw(fieldId, btn) {
  const field = document.getElementById(fieldId);
  if (field.type === "password") {
    field.type = "text";
    btn.textContent = "🙈";
  } else {
    field.type = "password";
    btn.textContent = "👁";
  }
}

function showAlert(message, type = "error") {
  const box = document.getElementById("alertBox");
  box.textContent = message;
  box.className = `alert show ${type}`;
}

function hideAlert() {
  const box = document.getElementById("alertBox");
  box.className = "alert";
}

function setBtnLoading(btn, loading, originalText) {
  btn.disabled = loading;
  btn.innerHTML = loading ? `<span class="spinner"></span> Please wait...` : originalText;
}

// ------------------------------------------------------------
// If already logged in, skip straight to the right dashboard
// ------------------------------------------------------------
(async function redirectIfLoggedIn() {
  const result = await getCurrentUserProfile();
  if (result) {
    window.location.href = result.profile.role === "admin" ? "admin.html" : "dashboard.html";
  }
})();

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("loginBtn");

  setBtnLoading(btn, true);

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setBtnLoading(btn, false, "Login");
    showAlert(error.message === "Invalid login credentials"
      ? "ভুল ইমেইল অথবা পাসওয়ার্ড।"
      : error.message);
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  setBtnLoading(btn, false, "Login");

  if (profileError || !profile) {
    showAlert("প্রোফাইল লোড করা যায়নি, আবার চেষ্টা করো।");
    return;
  }

  window.location.href = profile.role === "admin" ? "admin.html" : "dashboard.html";
});

// ------------------------------------------------------------
// REGISTER
// ------------------------------------------------------------
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const fullName = document.getElementById("regFullName").value.trim();
  const username = document.getElementById("regUsername").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const btn = document.getElementById("registerBtn");

  if (password !== confirmPassword) {
    showAlert("পাসওয়ার্ড মিলছে না।");
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    showAlert("Username শুধু ইংরেজি অক্ষর, সংখ্যা ও _ দিয়ে ৩-২০ ক্যারেক্টার হতে হবে।");
    return;
  }

  setBtnLoading(btn, true);

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, username, phone }
    }
  });

  setBtnLoading(btn, false, "Create Account");

  if (error) {
    showAlert(error.message.includes("already registered")
      ? "এই ইমেইল দিয়ে আগে থেকেই একটা account আছে।"
      : error.message);
    return;
  }

  // Supabase project settings অনুযায়ী email confirmation লাগতে পারে
  if (data.session) {
    window.location.href = "dashboard.html";
  } else {
    showAlert("Account তৈরি হয়েছে! ইমেইল ভেরিফাই করে তারপর Login করো।", "success");
    switchTab("login");
  }
});

