const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";

const tgUser = TG?.initDataUnsafe?.user;
let currentUserId = tgUser?.id || null;

async function checkIfAdmin(userId) {
  if (!userId) return false;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?telegram_id=eq.${userId}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const data = await response.json();
  return data.length > 0;
}

async function uploadImage(file, bucket = 'product-images') {
  const path = `${Date.now()}_${file.name}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
    body: file
  });
  if (response.ok) return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  alert(`Ошибка загрузки фото! Проверь бакет '${bucket}'`);
  return null;
}

async function fetchData(endpoint) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return await response.json();
}

// ================== НАВИГАЦИЯ ПО ВКЛАДКАМ ==================
const tabs = document.querySelectorAll('.tab-item');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('screen-' + tab.dataset.tab).classList.add('active');
  });
});

// ================== ИЗБРАННОЕ: ПЕРЕКЛЮЧЕНИЕ И ФИЛЬТРЫ ==================
const favTabs = document.querySelectorAll('.favorites-tab');
const favSearchBar = document.getElementById('fav-search-bar');
const favoritesSortBtn = document.getElementById('favorites-sort-btn');
const sortModal = document.getElementById('sort-modal');
const sortModalBackdrop = document.getElementById('sort-modal-backdrop');
const sortOptions = document.querySelectorAll('.sort-option');

favTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    favTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'suppliers') {
      favSearchBar.classList.add('suppliers-mode');
    } else {
      favSearchBar.classList.remove('suppliers-mode');
    }
  });
});

favoritesSortBtn.addEventListener('click', () => {
  sortModal.classList.remove('hidden');
});

sortModalBackdrop.addEventListener('click', () => {
  sortModal.classList.add('hidden');
});

sortOptions.forEach(option => {
  option.addEventListener('click', () => {
    sortOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
    sortModal.classList.add('hidden');
  });
});

// ================== ПЕРЕХОД В НАСТРОЙКИ И FAQ ==================
const openSettingsBtn = document.getElementById('open-settings-btn');
const settingsBackBtn = document.getElementById('settings-back-btn');
const openFaqBtn = document.getElementById('open-faq-btn');
const faqBackBtn = document.getElementById('faq-back-btn');

if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-settings').classList.add('active');
});
if (settingsBackBtn) settingsBackBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-profile').classList.add('active');
});
if (openFaqBtn) openFaqBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-faq').classList.add('active');
});
if (faqBackBtn) faqBackBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-profile').classList.add('active');
});

// ================== ПРОФИ
