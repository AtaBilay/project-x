const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";

const tgUser = TG?.initDataUnsafe?.user;
let currentUserId = tgUser?.id || null;

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

// ================== ИЗБРАННОЕ ==================
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

// ================== НАСТРОЙКИ И FAQ ==================
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

// ================== ПРОФИЛЬ ==================
document.getElementById('user-name').textContent = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'Пользователь';
document.getElementById('user-username').textContent = tgUser?.username ? '@' + tgUser.username : 'Нет username';

// ================== АДМИНКА (КНОПКА ВИДНА ВСЕГДА) ==================
const adminPanelBtn = document.getElementById('admin-panel-btn');
const adminBackBtn = document.getElementById('admin-back-btn');

if (adminPanelBtn) adminPanelBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
});
if (adminBackBtn) adminBackBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-profile').classList.add('active');
});

// ================== ДОБАВЛЕНИЕ ТОВАРА ==================
document.getElementById('btn-add-product').onclick = async () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin-product').classList.add('active');
  
  const categories = await fetchData('categories');
  const catSelect = document.getElementById('product-category');
  catSelect.innerHTML = '';
  categories.forEach(cat => catSelect.innerHTML += `<option value="${cat.id}">${cat.title}</option>`);
  
  loadSubsAndSuppliers();
};

let selectedFiles = [];
const imageInput = document.getElementById('product-images');
const previewContainer = document.getElementById('image-preview-container');

imageInput.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    renderImagePreviews();
});

function renderImagePreviews() {
    previewContainer.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const wrap = document.createElement('div');
            wrap.className = 'preview-wrap';

            const img = document.createElement('img');
            img.src = event.target.result;

            const delBtn = document.createElement('span');
            delBtn.className = 'preview-delete';
            delBtn.textContent = '×';
            delBtn.onclick = () => {
                selectedFiles.splice(index, 1);
                renderImagePreviews();
            };

            wrap.appendChild(img);
            wrap.appendChild(delBtn);
            previewContainer.appendChild(wrap);
        };
        reader.readAsDataURL(file);
    });
}

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

  if (!title.trim()) { alert("⚠️ Ты забыл написать название товара! Впиши его в поле «Название»."); return; }
  if (!price || parseFloat(price) <= 0) { alert("⚠️ Ты забыл указать цену! Впиши её в поле «Цена (₽)»."); return; }
  if (selectedFiles.length === 0) { alert("⚠️ Ты не загрузил ни одного фото! Нажми на кнопку «📸 Нажми, чтобы выбрать фото» и выбери картинку."); return; }
  if (!subId) { alert("⚠️ Ты не выбрал тип одежды! Нажми на список «Выберите тип...» и выбери нужный."); return; }
  if (!supId) { alert("⚠️ Ты не выбрал поставщика! Нажми на список «Выберите поставщика...» и выбери, от кого товар."); return; }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({ subcategory_id: subId, supplier_id: supId, title, price, old_price: oldPrice || null, discount, description: desc, image_url: "https://via.placeholder.com/200", is_hot: discount ? true : false })
  });

  if (response.ok) {
    const productData = await response.json();
    const productId = productData[0].id;

    for (const file of selectedFiles) {
      const uploadedUrl = await uploadImage(file, 'product-images');
      if (uploadedUrl) {
        await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId, image_url: uploadedUrl })
        });
      }
    }

    document.getElementById('product-title').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-old-price').value = '';
    document.getElementById('product-discount').value = '';
    document.getElementById('product-desc').value = '';
    document.getElementById('product-images').value = '';
    selectedFiles = [];
    renderImagePreviews();

    alert("✅ Товар успешно добавлен в каталог! Теперь его видят пользователи.");
    loadCategories();
  } else {
    alert("❌ Ошибка! Не получилось сохранить товар (сервер отказал). Проверь политики RLS в Supabase.");
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
  if (!name.trim()) { alert("⚠️ Ты забыл написать название поставщика! Впиши его в поле «Название»."); return; }
  if (!logoFile) { alert("⚠️ Ты не загрузил логотип! Нажми на «📸 Загрузить логотип» и выбери картинку."); return; }

  let logoUrl = "https://via.placeholder.com/50";
  if (logoFile) {
    const uploaded = await uploadImage(logoFile, 'supplier-images');
    if (uploaded) logoUrl = uploaded;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/suppliers`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, description: desc, logo_url: logoUrl })
  });

  if (response.ok) {
    document.getElementById('supplier-name').value = '';
    document.getElementById('supplier-desc').value = '';
    document.getElementById('supplier-logo').value = '';
    alert("✅ Поставщик добавлен! Теперь его можно выбрать при добавлении товара.");
  } else {
    alert("❌ Ошибка при добавлении поставщика! Проверь политики RLS.");
  }
};

// ================== МОДАЛКА КАТЕГОРИЙ ==================
const modal = document.getElementById('create-modal');
const modalImageInput = document.getElementById('modal-image');
const modalPreviewContainer = document.getElementById('modal-image-preview-container');
let modalType = 'category';

modalImageInput.addEventListener('change', (e) => {
    modalPreviewContainer.innerHTML = '';
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const wrap = document.createElement('div');
            wrap.className = 'preview-wrap';

            const img = document.createElement('img');
            img.src = event.target.result;

            wrap.appendChild(img);
            modalPreviewContainer.appendChild(wrap);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('btn-add-category').onclick = () => openCreateModal('category', 'Новый раздел');
document.getElementById('btn-add-subcategory').onclick = () => openCreateModal('subcategory', 'Новый тип');

function openCreateModal(type, title) {
  modalType = type;
  document.getElementById('modal-name').value = '';
  document.getElementById('modal-image').value = '';
  modalPreviewContainer.innerHTML = '';
  
  document.getElementById('modal-title').textContent = title;
  modal.classList.remove('hidden');
}

document.getElementById('modal-cancel-btn').onclick = () => modal.classList.add('hidden');

document.getElementById('modal-save-btn').onclick = async () => {
  const name = document.getElementById('modal-name').value;
  const imgFile = document.getElementById('modal-image').files[0];

  if (!name.trim()) { alert("⚠️ Ты забыл ввести название! Впиши его в поле «Название»."); return; }
  if (!imgFile) { alert("⚠️ Ты не загрузил иконку! Нажми на «📸 Загрузить иконку» и выбери картинку."); return; }

  let table = 'categories';
  if (modalType === 'subcategory') table = 'subcategories';
  
  const duplicate = await fetchData(`${table}?title=ilike.${encodeURIComponent(name.trim())}`);
  if (duplicate.length > 0) {
    alert(`⚠️ Такой раздел уже есть! Название «${name}» уже используется.`);
    return;
  }

  let url = null;
  if (imgFile) {
    const uploaded = await uploadImage(imgFile, 'category-images');
    if (uploaded) url = uploaded;
  }
  let body = { title: name, image_url: url };
  if (modalType === 'subcategory') {
    const cats = await fetchData('categories');
    body = { title: name, image_url: url, category_id: cats[0]?.id || 1 };
  }
  
  // ВАЖНО: Теперь проверяем ответ от Supabase
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (response.ok) {
    modal.classList.add('hidden');
    document.getElementById('modal-name').value = '';
    document.getElementById('modal-image').value = '';
    modalPreviewContainer.innerHTML = '';
    
    alert("✅ Раздел успешно создан! Теперь ты можешь добавить в него товары.");
    loadCategories();
  } else {
    alert("❌ Ошибка! Сервер Supabase отказал в создании. Скорее всего, нет прав (RLS). Выполни SQL, который я скинул.");
  }
};

// ================== FAQ ==================
const faqData = [
  { q: 'Как оформить заказ?', a: 'Откройте пост поставщика. Перейдите по ссылке. Свяжитесь с поставщиком напрямую.' },
  { q: 'В MAX у некоторых поставщиков указана ссылка на Telegram. Как сделать заказ?', a: 'Некоторые поставщики пока принимают заказы через Telegram. Если у вас нет возможности открыть Telegram, рекомендуем выбирать поставщиков с сайтом, VK, WhatsApp или другими способами связи.' },
  { q: 'Подписка оплачивается один раз или каждый месяц?', a: 'Подписка в BAZA является ежемесячной.' },
  { q: 'Почему доставка платная?', a: 'Мы не занимаемся доставкой товаров. Стоимость устанавливают транспортные компании.' },
  { q: 'Можно ли оформить возврат?', a: 'Условия возврата зависят от конкретного поставщика. Перед оплатой уточняйте условия.' },
  { q: 'Кто принимает оплату за заказ?', a: 'Оплата производится напрямую поставщику.' },
  { q: 'Почему поставщик не отвечает сразу?', a: 'У многих поставщиков большой поток обращений. Ответ может поступить в течение суток.' },
  { q: 'Безопасно ли заказывать через БАЗУ?', a: 'Мы собираем поставщиков и проверяем их перед размещением.' }
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
  const productIds = products.map(p => p.id);
  let allImages = [];
  if (productIds.length > 0) {
    allImages = await fetchData(`product_images?product_id=in.(${productIds.join(',')})`);
  }
  nestedContent.innerHTML = `<div class="product-grid">
    ${products.map(p => {
      const imgs = allImages.filter(img => img.product_id === p.id);
      const mainImg = imgs.length > 0 ? imgs[0].image_url : p.image_url;
      const dots = imgs.length > 1 ? `<div style="display:flex; justify-content:center; gap:4px; margin-top:5px;">${imgs.map((_, i) => `<div style="width:6px;height:6px;border-radius:50%;background:${i===0?'#007aff':'#ccc'}"></div>`).join('')}</div>` : '';
      return `<div class="product-card">
        <img src="${mainImg}" style="width:100%; height:180px; object-fit:cover;">
        ${dots}
        <p class="price">${p.price} ₽</p>
        <h4>${p.title}</h4>
      </div>`;
    }).join('')}
  </div>`;
};

document.getElementById('back-btn').onclick = () => nestedScreen.classList.add('hidden');

// ================== СТАРТ ==================
loadCategories();