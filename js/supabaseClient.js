// ============================================================
// SHARED SUPABASE CLIENT
// প্রতিটা পেজ এই ফাইলটা লোড করবে (config.js এর পরে)
// ============================================================
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ছোট হেল্পার: বর্তমান লগইন করা ইউজার + প্রোফাইল ফেরত দেয়
// লগইন করা না থাকলে null রিটার্ন করে
async function getCurrentUserProfile() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return null;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.error("Profile fetch error:", error.message);
    return null;
  }
  return { user: session.user, profile };
}

// পেজ-গার্ড হেল্পার: লগইন না থাকলে index.html এ পাঠিয়ে দেয়
async function requireAuth() {
  const result = await getCurrentUserProfile();
  if (!result) {
    window.location.href = "index.html";
    return null;
  }
  return result;
}

// পেজ-গার্ড হেল্পার: admin না হলে dashboard.html এ পাঠিয়ে দেয়
async function requireAdmin() {
  const result = await requireAuth();
  if (!result) return null;
  if (result.profile.role !== "admin") {
    window.location.href = "dashboard.html";
    return null;
  }
  return result;
}

