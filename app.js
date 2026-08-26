const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";

const tgUser = TG?.initDataUnsafe?.user;
let currentUserId = tgUser?.id || null;

// ================== АДМИН-ЧЕК ==================
async function checkIfAdmin(userId) {
  if (!userId) return false;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?telegram_id=eq.${userId}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const data = await response.json();
  return data.length > 0;
}

// ================== ЗАГРУЗКА ФОТО (добавили bucket) ==================
async function uploadImage(file, bucket = 'product-images') {
  const path = `${Date.now()}_${file.name}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
    body: file
  });

  if (response.ok) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
  
  alert(`Ошибка загрузки фото! Проверь, что создан бакет '${bucket}' в Supabase.`);
  return null;
}

// ================== ПОЛУЧЕНИЕ ДАННЫХ ==================
async function fetchData(endpoint) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return await response.json();
}

// ================== РЕНДЕР ГЛАВНОЙ ==================
async function loadCategories() {
  const categories = await fetchData('categories');
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.innerHTML = `<img src="${cat.image_url}"><div>${cat.title}</div>`;
    card.onclick = () => openCategory(cat);
    grid.appendChild(card);
  });
}

// ================== НАВИГАЦИЯ ==================
const tabs = document.querySelectorAll('.tab-item');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('screen-' + tab.dataset.tab).classList.add('active');
  });
});

// ================== ПРОФИЛЬ ==================
document.getElementById('user-name').textContent = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'Пользователь';
document.getElementById('user-username').textContent = tgUser?.username ? '@' + tgUser.username : 'Нет username';

async function initProfile() {
  const isAdmin = await checkIfAdmin(currentUserId);
  if (isAdmin) {
    document.getElementById('admin-panel-btn').style.display = 'block';
  }
}
initProfile();

document.getElementById('admin-panel-btn').addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
});

document.getElementById('admin-back-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-profile').classList.add('active');
};

// ================== ДОБАВЛЕНИЕ ТОВАРА ==================
document.getElementById('btn-add-product').onclick = async () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin-product').classList.add('active');
  
  const categories = await fetchData('categories');
  const catSelect = document.getElementById('product-category');
  catSelect.innerHTML = '';
  categories.forEach(cat => {
    catSelect.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
  });
  loadSubsAndSuppliers();
};

async function loadSubsAndSuppliers() {
  const subcats = await fetchData('subcategories');
  const suppliers = await fetchData('suppliers');
  
  const subSelect = document.getElementById('product-subcategory');
  const supSelect = document.getElementById('product-supplier');
  
  subSelect.innerHTML = '<option value="">Выберите тип...</option>';
  subcats.forEach(sub => subSelect.innerHTML += `<option value="${sub.id}">${sub.title}</option>`);

  supSelect.innerHTML = '<option value="">Выберите поставщика...</option>';
  suppliers.forEach(sup => supSelect.innerHTML += `<option value="${sup.id}">${sup.name}</option>`);
}

document.getElementById('product-back-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
};

document.getElementById('save-product-btn').onclick = async () => {
  const title = document.getElementById('product-title').value;
  const price = document.getElementById('product-price').value;
  const oldPrice = document.getElementById('product-old-price').value;
  const discount = document.getElementById('product-discount').value;
  const desc = document.getElementById('product-desc').value;
  const subId = document.getElementById('product-subcategory').value;
  const supId = document.getElementById('product-supplier').value;
  const imgFile = document.getElementById('product-image').files[0];

  if (!title || !price) return alert("Заполни название и цену!");
  
  let imgUrl = "https://via.placeholder.com/200";
  if (imgFile) {
    const uploaded = await uploadImage(imgFile, 'product-images'); // <- бакет для товаров
    if (uploaded) imgUrl = uploaded;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({
      subcategory_id: subId || null,
      supplier_id: supId || null,
      title,
      price,
      old_price: oldPrice || null,
      discount,
      description: desc,
      image_url: imgUrl,
      is_hot: discount ? true : false
    })
  });

  if (response.ok) {
    alert("Товар добавлен!");
    loadCategories();
  } else {
    alert("Ошибка при добавлении!");
  }
};

// ================== ДОБАВЛЕНИЕ ПОСТАВЩИКА ==================
document.getElementById('btn-add-supplier').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin-supplier').classList.add('active');
};

document.getElementById('supplier-back-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
};

document.getElementById('save-supplier-btn').onclick = async () => {
  const name = document.getElementById('supplier-name').value;
  const desc = document.getElementById('supplier-desc').value;
  const logoFile = document.getElementById('supplier-logo').files[0];

  if (!name) return alert("Введите название поставщика!");

  let logoUrl = "https://via.placeholder.com/50";
  if (logoFile) {
    const uploaded = await uploadImage(logoFile, 'supplier-images'); // <- бакет для поставщиков!
    if (uploaded) logoUrl = uploaded;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/suppliers`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name,
      description: desc,
      logo_url: logoUrl
    })
  });

  if (response.ok) {
    alert("Поставщик добавлен!");
    document.getElementById('supplier-name').value = '';
    document.getElementById('supplier-desc').value = '';
    document.getElementById('supplier-logo').value = '';
  } else {
    alert("Ошибка при добавлении поставщика!");
  }
};

// ================== МОДАЛКА ДЛЯ КАТЕГОРИЙ И ТИПОВ ==================
const modal = document.getElementById('create-modal');
let modalType = 'category';

document.getElementById('btn-add-category').onclick = () => openCreateModal('category', 'Новый раздел');
document.getElementById('btn-add-subcategory').onclick = () => openCreateModal('subcategory', 'Новый тип');

function openCreateModal(type, title) {
  modalType = type;
  document.getElementById('modal-title').textContent = title;
  modal.classList.remove('hidden');
}

document.getElementById('modal-cancel-btn').onclick = () => modal.classList.add('hidden');

document.getElementById('modal-save-btn').onclick = async () => {
  const name = document.getElementById('modal-name').value;
  const imgFile = document.getElementById('modal-image').files[0];
  
  if (!name) return alert("Введите название!");
  
  let url = null;
  if (imgFile) {
    const uploaded = await uploadImage(imgFile, 'category-images'); // <- бакет для категорий/иконок!
    if (uploaded) url = uploaded;
  }

  let table = 'categories';
  let body = { title: name, image_url: url };
  
  if (modalType === 'subcategory') {
    table = 'subcategories';
    const cats = await fetchData('categories');
    body = { title: name, image_url: url, category_id: cats[0]?.id || 1 };
  }

  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  modal.classList.add('hidden');
  alert("Создано!");
};

// ================== FAQ ==================
const faqData = [
  { q: 'Как оформить заказ?', a: 'Откройте пост поставщика. Перейдите по ссылке. Свяжитесь с поставщиком напрямую.' },
  { q: 'Подписка оплачивается один раз?', a: 'Подписка является ежемесячной.' }
];

const faqList = document.getElementById('faq-list');
faqData.forEach(item => {
  const div = document.createElement('div');
  div.className = 'faq-item';
  div.innerHTML = `<div class="faq-question">${item.q}</div><div class="faq-answer">${item.a}</div>`;
  div.querySelector('.faq-question').onclick = () => div.classList.toggle('open');
  faqList.appendChild(div);
});

// ================== ВЛОЖЕННЫЕ ЭКРАНЫ ==================
const nestedScreen = document.getElementById('nested-screen');
const nestedTitle = document.getElementById('nested-title');
const nestedContent = document.getElementById('nested-content');

async function openCategory(cat) {
  nestedTitle.textContent = cat.title;
  nestedScreen.classList.remove('hidden');

  const subcats = await fetchData(`subcategories?category_id=eq.${cat.id}`);
  nestedContent.innerHTML = subcats.map(sub => `
    <div class="list-item" onclick="openProducts('${sub.id}')">
      <img src="${sub.image_url}"><h4>${sub.title}</h4>
    </div>
  `).join('');
}

window.openProducts = async (subId) => {
  nestedTitle.textContent = 'Товары';
  const products = await fetchData(`products?subcategory_id=eq.${subId}`);
  nestedContent.innerHTML = `<div class="product-grid">
    ${products.map(p => `
      <div class="product-card">
        <img src="${p.image_url}">
        <p class="price">${p.price} ₽</p>
        <h4>${p.title}</h4>
      </div>
    `).join('')}
  </div>`;
};

document.getElementById('back-btn').onclick = () => nestedScreen.classList.add('hidden');

// ================== СТАРТ ==================
loadCategories();
