const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";

const tgUser = TG?.initDataUnsafe?.user;
let currentUserId = tgUser?.id || null;

// ================== ИЗБРАННОЕ (localStorage) ==================
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    const countEl = document.getElementById('favorites-count');
    if (countEl) countEl.textContent = favorites.length;
    renderFavorites();
}

function isFavorite(id) {
    return favorites.includes(id);
}

function toggleFavorite(id) {
    if (isFavorite(id)) {
        favorites = favorites.filter(f => f !== id);
    } else {
        favorites.push(id);
    }
    saveFavorites();
    document.querySelectorAll('.fav-heart').forEach(heart => {
        if (heart.dataset.id == id) {
            heart.classList.toggle('inactive', !isFavorite(id));
            heart.textContent = isFavorite(id) ? '♥' : '♡';
        }
    });
}

async function uploadImage(file, bucket = 'product-images') {
  const path = `${Date.now()}_${file.name}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: file
  });
  if (response.ok) return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  alert(`⚠️ Ошибка загрузки фото! Проверь бакет '${bucket}'`);
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
    if (tab.dataset.tab === 'favorites') {
        renderFavorites();
    }
  });
});

// ================== ИЗБРАННОЕ (рендер) ==================
function renderFavorites() {
    const container = document.getElementById('favorites-products-container');
    const empty = document.getElementById('favorites-empty');
    const countBadge = document.getElementById('favorites-count');
    countBadge.textContent = favorites.length;

    if (favorites.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    const ids = favorites.join(',');
    fetchData(`products?id=in.(${ids})`).then(products => {
        if (products.length === 0) {
            container.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Товары не найдены</p>';
            return;
        }
        let html = '<div class="product-grid">';
        products.forEach(p => {
            html += `<div class="product-card" onclick="openProductDetail(${p.id})">
                <img src="${p.image_url}" style="width:100%; height:180px; object-fit:cover;">
                <div class="fav-heart active" onclick="event.stopPropagation(); toggleFavorite(${p.id})">♥</div>
                <p class="price">${p.price} ₽</p>
                <h4>${p.title}</h4>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    });
}

// ================== ИЗБРАННОЕ: ПЕРЕКЛЮЧЕНИЕ ТАБОВ ==================
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
      document.getElementById('favorites-products-container').innerHTML = '';
      document.getElementById('favorites-empty').innerHTML = '<p>Вы пока не добавили поставщиков в избранное</p>';
      document.getElementById('favorites-empty').style.display = 'block';
    } else {
      favSearchBar.classList.remove('suppliers-mode');
      renderFavorites();
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

// ================== АДМИНКА ==================
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

  let allUploaded = true;
  const uploadedUrls = [];
  for (const file of selectedFiles) {
    const uploadedUrl = await uploadImage(file, 'product-images');
    if (!uploadedUrl) {
      allUploaded = false;
      break;
    }
    uploadedUrls.push(uploadedUrl);
  }

  if (!allUploaded) {
    alert("❌ Не удалось загрузить фото! Товар НЕ сохранен. Проверь интернет и бакет 'product-images'.");
    return;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({ subcategory_id: subId, supplier_id: supId, title, price, old_price: oldPrice || null, discount, description: desc, image_url: "https://via.placeholder.com/200", is_hot: discount ? true : false })
  });

  if (response.ok) {
    const productData = await response.json();
    const productId = productData[0].id;

    for (const url of uploadedUrls) {
      await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, image_url: url })
      });
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
    loadHomeSections();
  } else {
    alert("❌ Ошибка! Не получилось сохранить товар.");
  }
};

// ================== ЛОГИКА КОНТАКТОВ ПОСТАВЩИКА ==================
const contactsContainer = document.getElementById('supplier-contacts-container');
const addContactBtn = document.getElementById('btn-add-contact');

window.addContactField = function(type = 'telegram', value = '') {
    if (!contactsContainer) {
        alert("⚠️ Ошибка: не найден блок для контактов. Обнови страницу (Ctrl+F5).");
        return;
    }
    
    const div = document.createElement('div');
    div.className = 'contact-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    
    div.innerHTML = `
        <select class="contact-type" style="width: 30%; padding: 10px; border-radius: 10px; border: 1px solid #e0e0e0; background: white;">
            <option value="telegram" ${type === 'telegram' ? 'selected' : ''}>Telegram</option>
            <option value="whatsapp" ${type === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
            <option value="phone" ${type === 'phone' ? 'selected' : ''}>Телефон</option>
            <option value="vk" ${type === 'vk' ? 'selected' : ''}>VK</option>
            <option value="website" ${type === 'website' ? 'selected' : ''}>Сайт</option>
        </select>
        <input type="text" class="contact-value" placeholder="Ссылка или номер" value="${value}" style="flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <button type="button" class="remove-contact-btn" style="background: #ff3b30; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold;">×</button>
    `;
    
    div.querySelector('.remove-contact-btn').addEventListener('click', () => {
        div.remove();
    });
    
    contactsContainer.appendChild(div);
};

if (addContactBtn) {
    addContactBtn.addEventListener('click', function() { window.addContactField(); });
}

// ================== ДОБАВЛЕНИЕ ПОСТАВЩИКА ==================
document.getElementById('btn-add-supplier').onclick = () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-admin-supplier').classList.add('active');
    
    contactsContainer.innerHTML = '';
    addContactField('telegram', '');
    document.getElementById('supplier-name').value = '';
    document.getElementById('supplier-desc').value = '';
    document.getElementById('supplier-logo').value = '';
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

  const contacts = [];
  const rows = document.querySelectorAll('.contact-row');
  rows.forEach(row => {
      const type = row.querySelector('.contact-type').value;
      const value = row.querySelector('.contact-value').value.trim();
      if (value) {
          contacts.push({ type: type, value: value });
      }
  });

  let logoUrl = null;
  if (logoFile) {
    logoUrl = await uploadImage(logoFile, 'supplier-images');
    if (!logoUrl) {
      alert("❌ Не удалось загрузить логотип! Поставщик НЕ сохранен.");
      return;
    }
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/suppliers`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, description: desc, logo_url: logoUrl, contacts: contacts })
  });

  if (response.ok) {
    document.getElementById('supplier-name').value = '';
    document.getElementById('supplier-desc').value = '';
    document.getElementById('supplier-logo').value = '';
    contactsContainer.innerHTML = ''; 
    alert("✅ Поставщик добавлен! Теперь его можно выбрать при добавлении товара.");
  } else {
    alert("❌ Ошибка при добавлении поставщика!");
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

  let url = null;
  if (imgFile) {
    url = await uploadImage(imgFile, 'category-images');
    if (!url) {
      alert("❌ Ошибка загрузки иконки! Раздел НЕ создан. Проверь бакет 'category-images'.");
      return;
    }
  }

  let table = 'categories';
  if (modalType === 'subcategory') table = 'subcategories';
  
  const duplicate = await fetchData(`${table}?title=ilike.${encodeURIComponent(name.trim())}`);
  if (duplicate.length > 0) {
    alert(`⚠️ Такой раздел уже есть! Название «${name}» уже используется.`);
    return;
  }

  let body = { title: name, image_url: url };
  if (modalType === 'subcategory') {
    const cats = await fetchData('categories');
    body = { title: name, image_url: url, category_id: cats[0]?.id || 1 };
  }

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
    loadHomeSections();
  } else {
    alert("❌ Ошибка! Сервер Supabase отказал в создании. Проверь политики RLS.");
  }
};

// ================== ДЕТАЛИ ТОВАРА И КОНТАКТЫ ==================
const detailScreen = document.getElementById('screen-product-detail');
const detailContent = document.getElementById('detail-content');
const detailBackBtn = document.getElementById('detail-back-btn');

let currentSupplierData = null;

document.getElementById('back-btn').addEventListener('click', () => {
  nestedScreen.classList.add('hidden');
});

detailBackBtn.addEventListener('click', () => {
  detailScreen.classList.add('hidden');
  nestedScreen.classList.remove('hidden');
});

window.showSupplierContacts = () => {
    const s = currentSupplierData;
    if (!s) {
        alert("Поставщик не найден");
        return;
    }
    
    const contacts = s.contacts || [];
    let html = '';
    
    html += `<p style="color: #999; font-size: 14px; margin: 0 0 15px 0;">${s.name}</p>`;
    
    if (contacts.length === 0) {
        html += '<p style="text-align:center; color: #999; margin: 20px 0;">У поставщика пока нет контактов.</p>';
    } else {
        contacts.forEach(contact => {
            let label = '';
            let icon = '🔗';
            switch (contact.type) {
                case 'telegram': label = 'Telegram'; icon = '✈️'; break;
                case 'whatsapp': label = 'WhatsApp'; icon = '💬'; break;
                case 'phone': label = 'Телефон'; icon = '📞'; break;
                case 'vk': label = 'VK'; icon = '📘'; break;
                case 'website': label = 'Сайт'; icon = '🌐'; break;
                default: label = contact.type;
            }
            
            let link = contact.value;
            if (!link.startsWith('http')) {
                link = 'https://' + link;
            }

            html += `
                <div style="background: #f9f9f9; padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 24px;">${icon}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: var(--text); font-size: 16px;">${label}</div>
                        <a href="${link}" target="_blank" style="color: var(--blue); text-decoration: underline; font-size: 14px; word-break: break-all;">${contact.value}</a>
                    </div>
                </div>
            `;
        });
    }
    
    document.getElementById('supplier-contacts-list').innerHTML = html;
    document.getElementById('supplier-contacts-modal').classList.remove('hidden');
};

document.getElementById('close-contacts-btn').addEventListener('click', () => {
    document.getElementById('supplier-contacts-modal').classList.add('hidden');
});

// Открытие деталей товара
window.openProductDetail = async (productId) => {
  detailScreen.classList.remove('hidden');
  nestedScreen.classList.add('hidden');
  detailContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Загрузка...</p>';

  const product = await fetchData(`products?id=eq.${productId}`);
  if (product.length === 0) {
    detailContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Товар не найден</p>';
    return;
  }
  const p = product[0];

  const images = await fetchData(`product_images?product_id=eq.${productId}`);
  const galleryImages = images.length > 0 ? images.map(i => i.image_url) : [p.image_url];

  let supplierBlock = '';
  if (p.supplier_id) {
    const supplier = await fetchData(`suppliers?id=eq.${p.supplier_id}`);
    if (supplier.length > 0) {
      const s = supplier[0];
      currentSupplierData = s;
      
      supplierBlock = `
        <div class="product-detail-supplier" style="display:block; padding:15px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                <img src="${s.logo_url}" style="width:50px; height:50px; border-radius:10px; object-fit:cover;">
                <div>
                    <h4 style="margin:0; font-size:16px;">${s.name}</h4>
                    <p style="margin:5px 0 0; font-size:14px; color:#999;">${s.description || ''}</p>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <button onclick="showSupplierContacts()" style="background:#f2f2f7; border:none; border-radius:15px; padding:12px; font-size:14px; font-weight:600; cursor:pointer; text-align:center;">
                    💬 Контакты поставщика
                </button>
                <button onclick="alert('Здесь будет список товаров этого поставщика!')" style="background:#f2f2f7; border:none; border-radius:15px; padding:12px; font-size:14px; font-weight:600; cursor:pointer; text-align:center;">
                    🏬 Ассортимент поставщика
                </button>
            </div>
        </div>
      `;
    }
  }

  let galleryHtml = '<div class="product-gallery">';
  galleryImages.forEach(img => {
    galleryHtml += `<img src="${img}" onerror="this.src='https://via.placeholder.com/300'">`;
  });
  galleryHtml += '</div>';
  if (galleryImages.length > 1) {
    let dotsHtml = '<div class="gallery-dots">';
    galleryImages.forEach((_, i) => {
        dotsHtml += `<span class="${i === 0 ? 'active' : ''}"></span>`;
    });
    dotsHtml += '</div>';
    galleryHtml += dotsHtml;
  }

  setTimeout(() => {
    const gallery = document.querySelector('.product-gallery');
    const dots = document.querySelectorAll('.gallery-dots span');
    if (gallery && dots.length > 0) {
        gallery.addEventListener('scroll', () => {
            const index = Math.round(gallery.scrollLeft / gallery.clientWidth);
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        });
    }
  }, 100);

  detailContent.innerHTML = `
    ${galleryHtml}
    <h2 class="product-detail-title">${p.title}</h2>
    <div class="product-detail-price">${p.price} ₽ ${p.old_price ? `<span style="text-decoration: line-through; font-size: 18px; color: #999; font-weight: 400;">${p.old_price} ₽</span>` : ''}</div>
    
    <div class="product-detail-desc">
      <h4>Описание</h4>
      <p style="margin: 0; color: #555; font-size: 14px;">${p.description || 'Описание отсутствует'}</p>
    </div>

    ${supplierBlock}
  `;
};

// ================== ПОИСК ==================
const homeSearchInput = document.getElementById('home-search-input');
const searchScreen = document.getElementById('screen-search');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchBackBtn = document.getElementById('search-back-btn');

homeSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        searchScreen.classList.add('active');
        searchInput.value = query;
        performSearch(query);
    } else {
        searchScreen.classList.remove('active');
        document.getElementById('screen-home').classList.add('active');
    }
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length === 0) {
        searchResults.innerHTML = '';
        return;
    }
    performSearch(query);
});

searchBackBtn.addEventListener('click', () => {
    searchScreen.classList.remove('active');
    document.getElementById('screen-home').classList.add('active');
    homeSearchInput.value = '';
});

async function performSearch(query) {
    searchResults.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Ищем...</p>';
    const products = await fetchData(`products?title=ilike.*${encodeURIComponent(query)}*`);
    if (products.length === 0) {
        searchResults.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Ничего не найдено</p>';
        return;
    }
    searchResults.innerHTML = `<div class="product-grid">${products.map(p => {
        const isFav = isFavorite(p.id);
        return `<div class="product-card" onclick="openProductDetail(${p.id})">
            <img src="${p.image_url}" style="width:100%; height:180px; object-fit:cover;">
            <div class="fav-heart ${isFav ? 'active' : 'inactive'}" data-id="${p.id}" onclick="event.stopPropagation(); toggleFavorite(${p.id})">${isFav ? '♥' : '♡'}</div>
            <p class="price">${p.price} ₽</p>
            <h4>${p.title}</h4>
        </div>`;
    }).join('')}</div>`;
}

// ================== ЗАГРУЗКА ГЛАВНОЙ (ЛЕНТЫ) - ИСПРАВЛЕННАЯ ==================
async function loadHomeSections() {
    // Загружаем ВСЕ товары (берём максимум 100, чтобы точно ничего не пропустить)
    const allProducts = await fetchData('products?limit=100');
    
    // Горячие предложения: фильтруем те, у которых есть старая цена (скидка)
    const hotDeals = allProducts.filter(p => p.old_price && p.old_price > p.price);
    const shuffledHot = hotDeals.sort(() => 0.5 - Math.random()).slice(0, 8);
    const hotScroll = document.getElementById('hot-scroll');
    hotScroll.innerHTML = shuffledHot.map(p => `
        <div class="product-mini" onclick="openProductDetail(${p.id})">
            <div class="fav-heart ${isFavorite(p.id) ? 'active' : 'inactive'}" data-id="${p.id}" onclick="event.stopPropagation(); toggleFavorite(${p.id})">${isFavorite(p.id) ? '♥' : '♡'}</div>
            <img src="${p.image_url}">
            <h4>${p.title}</h4>
            <p class="price">${p.price} ₽ <span style="text-decoration:line-through; color:#999; font-size:12px;">${p.old_price}</span></p>
        </div>
    `).join('');

    // ТОП товары недели: рандомные из всех
    const shuffledTop = allProducts.sort(() => 0.5 - Math.random()).slice(0, 8);
    const topScroll = document.getElementById('top-scroll');
    topScroll.innerHTML = shuffledTop.map(p => `
        <div class="product-mini" onclick="openProductDetail(${p.id})">
            <div class="fav-heart ${isFavorite(p.id) ? 'active' : 'inactive'}" data-id="${p.id}" onclick="event.stopPropagation(); toggleFavorite(${p.id})">${isFavorite(p.id) ? '♥' : '♡'}</div>
            <img src="${p.image_url}">
            <h4>${p.title}</h4>
            <p class="price">${p.price} ₽</p>
        </div>
    `).join('');

    // Поставщики недели (первые 3)
    const suppliers = await fetchData('suppliers?limit=3');
    const supplierList = document.getElementById('supplier-list');
    supplierList.innerHTML = suppliers.map(s => `
        <div class="supplier-item" onclick="openSupplierDetail(${s.id})" style="cursor:pointer;">
            <img src="${s.logo_url}">
            <div>
                <h4>${s.name}</h4>
                <p>${s.description || ''}</p>
            </div>
            <span class="heart" style="margin-left:auto; font-size:24px; color:#ccc;">♡</span>
        </div>
    `).join('');
}

// ================== ЛОГИКА ПОСТАВЩИКОВ ==================
const screenSuppliers = document.getElementById('screen-suppliers');
const suppliersBackBtn = document.getElementById('suppliers-back-btn');
const suppliersListContainer = document.getElementById('suppliers-list-container');
const screenSupplierDetail = document.getElementById('screen-supplier-detail');
const supplierDetailBackBtn = document.getElementById('supplier-detail-back-btn');
const supplierDetailContent = document.getElementById('supplier-detail-content');

let selectedSupplierCategories = [];

const categoryFilterModal = document.getElementById('category-filter-modal');
const modalCategoryGrid = document.getElementById('modal-category-grid');
const closeFilterModalBtn = document.getElementById('close-filter-modal-btn');
const openFilterModalBtn = document.getElementById('open-filter-modal-btn');

window.openSuppliersScreen = async () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenSuppliers.classList.add('active');
    const suppliers = await fetchData('suppliers');
    updateFilterStatusText();
    renderSuppliersList(suppliers);
};

function updateFilterStatusText() {
    const statusText = document.getElementById('filter-status-text');
    const subtitleText = document.getElementById('filter-subtitle-text');
    if (selectedSupplierCategories.length === 0) {
        statusText.textContent = 'Все категории';
        subtitleText.textContent = 'Показаны все поставщики каталога';
    } else {
        statusText.textContent = `Выбрано: ${selectedSupplierCategories.length}`;
        subtitleText.textContent = 'Отфильтрованы поставщики по выбранным категориям';
    }
}

function renderSuppliersList(suppliers) {
    suppliersListContainer.innerHTML = '';
    if (suppliers.length === 0) {
        suppliersListContainer.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Поставщики не найдены</p>';
        return;
    }
    suppliers.forEach(s => {
        const div = document.createElement('div');
        div.className = 'supplier-card';
        div.innerHTML = `
            <img src="${s.logo_url}">
            <div>
                <h4>${s.name}</h4>
                <p>${s.description || ''}</p>
            </div>
            <span class="heart">♡</span>
        `;
        div.onclick = () => openSupplierDetail(s.id);
        suppliersListContainer.appendChild(div);
    });
}

async function filterSuppliersBySelectedCategories() {
    if (selectedSupplierCategories.length === 0) {
        const allSuppliers = await fetchData('suppliers');
        renderSuppliersList(allSuppliers);
        return;
    }
    const [allProducts, allSubcategories, allSuppliers] = await Promise.all([fetchData('products'), fetchData('subcategories'), fetchData('suppliers')]);
    const supplierCategories = {};
    allSubcategories.forEach(sub => {
        const productsInSub = allProducts.filter(p => p.subcategory_id === sub.id);
        productsInSub.forEach(p => {
            if (!supplierCategories[p.supplier_id]) supplierCategories[p.supplier_id] = [];
            if (!supplierCategories[p.supplier_id].includes(sub.category_id)) supplierCategories[p.supplier_id].push(sub.category_id);
        });
    });
    const filteredSuppliers = allSuppliers.filter(s => {
        const cats = supplierCategories[s.id] || [];
        return cats.some(cat => selectedSupplierCategories.includes(parseInt(cat)));
    });
    renderSuppliersList(filteredSuppliers);
}

openFilterModalBtn.addEventListener('click', async () => {
    const categories = await fetchData('categories');
    modalCategoryGrid.innerHTML = '';
    categories.forEach(cat => {
        const catBtn = document.createElement('div');
        catBtn.className = 'modal-category-item';
        catBtn.textContent = cat.title;
        if (selectedSupplierCategories.includes(cat.id)) catBtn.classList.add('selected');
        catBtn.onclick = () => {
            if (selectedSupplierCategories.includes(cat.id)) {
                selectedSupplierCategories = selectedSupplierCategories.filter(id => id !== cat.id);
                catBtn.classList.remove('selected');
            } else {
                selectedSupplierCategories.push(cat.id);
                catBtn.classList.add('selected');
            }
        };
        modalCategoryGrid.appendChild(catBtn);
    });
    categoryFilterModal.classList.remove('hidden');
});

closeFilterModalBtn.addEventListener('click', () => {
    categoryFilterModal.classList.add('hidden');
    filterSuppliersBySelectedCategories();
    updateFilterStatusText();
});

window.openSupplierDetail = async (supplierId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenSupplierDetail.classList.add('active');
    supplierDetailContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Загрузка...</p>';
    const supplier = await fetchData(`suppliers?id=eq.${supplierId}`);
    if (supplier.length > 0) {
        const s = supplier[0];
        currentSupplierData = s;
        const products = await fetchData(`products?supplier_id=eq.${supplierId}`);
        let productsHtml = '';
        if (products.length > 0) {
            const productIds = products.map(p => p.id);
            const allImages = await fetchData(`product_images?product_id=in.(${productIds.join(',')})`);
            productsHtml = `<h3 style="margin-bottom:15px;">Товары поставщика</h3><div class="product-grid">`;
            products.forEach(p => {
                const imgs = allImages.filter(img => img.product_id === p.id);
                const mainImg = imgs.length > 0 ? imgs[0].image_url : p.image_url;
                productsHtml += `
                    <div class="product-card" onclick="openProductDetail(${p.id})">
                        <div class="fav-heart ${isFavorite(p.id) ? 'active' : 'inactive'}" data-id="${p.id}" onclick="event.stopPropagation(); toggleFavorite(${p.id})">${isFavorite(p.id) ? '♥' : '♡'}</div>
                        <img src="${mainImg}" style="width:100%; height:180px; object-fit:cover;">
                        <p class="price">${p.price} ₽</p>
                        <h4>${p.title}</h4>
                    </div>`;
            });
            productsHtml += `</div>`;
        } else {
            productsHtml = '<p style="text-align:center; color:#999; margin-top:30px;">У этого поставщика пока нет товаров</p>';
        }
        supplierDetailContent.innerHTML = `
            <div class="supplier-detail-header">
                <img src="${s.logo_url}">
                <div><h3>${s.name}</h3><p>${s.description || ''}</p></div>
            </div>
            <div class="supplier-detail-buttons">
                <button onclick="showSupplierContacts()">💬 Контакты поставщика</button>
                <button onclick="alert('Здесь будет список товаров этого поставщика!')">🏬 Избранное</button>
            </div>
            ${productsHtml}
        `;
    }
};

suppliersBackBtn.addEventListener('click', () => {
    screenSuppliers.classList.remove('active');
    document.getElementById('screen-home').classList.add('active');
});
supplierDetailBackBtn.addEventListener('click', () => {
    screenSupplierDetail.classList.remove('active');
    screenSuppliers.classList.add('active');
});

// ================== КАТЕГОРИИ ==================
const nestedScreen = document.getElementById('nested-screen');
const nestedTitle = document.getElementById('nested-title');
const nestedContent = document.getElementById('nested-content');

async function loadCategories() {
  const categories = await fetchData('categories');
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  const hasSuppliersCat = categories.some(cat => cat.title.toLowerCase() === 'поставщики');
  if (!hasSuppliersCat) {
    const virtualCard = document.createElement('div');
    virtualCard.className = 'cat-card';
    virtualCard.innerHTML = `<img src="https://via.placeholder.com/150/FFD700/000000?text=Suppliers"><div>Поставщики</div>`;
    virtualCard.onclick = () => openSuppliersScreen();
    grid.appendChild(virtualCard);
  }
  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'cat-card';
    if (cat.title.toLowerCase() === 'поставщики') {
      card.onclick = () => openSuppliersScreen();
    } else {
      card.onclick = () => openCategory(cat);
    }
    card.innerHTML = `<img src="${cat.image_url}"><div>${cat.title}</div>`;
    grid.appendChild(card);
  });
}

function renderProductGrid(products, allImages) {
  return `<div class="product-grid">
    ${products.map(p => {
      const imgs = allImages.filter(img => img.product_id === p.id);
      const mainImg = imgs.length > 0 ? imgs[0].image_url : p.image_url;
      const dots = imgs.length > 1 ? `<div style="display:flex; justify-content:center; gap:4px; margin-top:5px;">${imgs.map((_, i) => `<div style="width:6px;height:6px;border-radius:50%;background:${i===0?'#007aff':'#ccc'}"></div>`).join('')}</div>` : '';
      const isFav = isFavorite(p.id);
      return `
        <div class="product-card" onclick="openProductDetail(${p.id})">
          <img src="${mainImg}" style="width:100%; height:180px; object-fit:cover;">
          <div class="fav-heart ${isFav ? 'active' : 'inactive'}" data-id="${p.id}" onclick="event.stopPropagation(); toggleFavorite(${p.id})">${isFav ? '♥' : '♡'}</div>
          ${dots}
          <p class="price">${p.price} ₽</p>
          <h4>${p.title}</h4>
        </div>
      `;
    }).join('')}
  </div>`;
}

async function openCategory(cat) {
  nestedTitle.textContent = cat.title;
  nestedScreen.classList.remove('hidden');
  const subcats = await fetchData(`subcategories?category_id=eq.${cat.id}`);
  const filteredSubcats = subcats.filter(sub => sub.title.toLowerCase() !== 'все товары');
  const allProductsItem = `
    <div class="list-item" style="cursor:pointer;" onclick="openAllProducts('${cat.id}')">
      <div style="background:#eee; width:60px; height:60px; border-radius:10px; display:flex; justify-content:center; align-items:center; font-size:30px; margin-right:15px;">📦</div>
      <h4>Все товары</h4>
    </div>`;
  nestedContent.innerHTML = allProductsItem + filteredSubcats.map(sub => `
    <div class="list-item" style="cursor:pointer;" onclick="openProducts('${sub.id}')">
      <img src="${sub.image_url}"><h4>${sub.title}</h4>
    </div>`).join('');
}

window.openAllProducts = async (categoryId) => {
  nestedTitle.textContent = 'Все товары';
  nestedContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Загрузка...</p>';
  const subcats = await fetchData(`subcategories?category_id=eq.${categoryId}`);
  const subIds = subcats.map(s => s.id);
  let products = [], allImages = [];
  if (subIds.length > 0) {
    products = await fetchData(`products?subcategory_id=in.(${subIds.join(',')})`);
    const productIds = products.map(p => p.id);
    if (productIds.length > 0) allImages = await fetchData(`product_images?product_id=in.(${productIds.join(',')})`);
  }
  nestedContent.innerHTML = renderProductGrid(products, allImages);
};

window.openProducts = async (subId) => {
  nestedTitle.textContent = 'Товары';
  const products = await fetchData(`products?subcategory_id=eq.${subId}`);
  const productIds = products.map(p => p.id);
  let allImages = [];
  if (productIds.length > 0) allImages = await fetchData(`product_images?product_id=in.(${productIds.join(',')})`);
  nestedContent.innerHTML = renderProductGrid(products, allImages);
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

// ================== СТАРТ ==================
loadCategories();
loadHomeSections();
renderFavorites();