const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";

const tgUser = TG?.initDataUnsafe?.user;

// ================== ИЗБРАННОЕ (localStorage) ==================
let favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts') || '[]');
let favoriteSuppliers = JSON.parse(localStorage.getItem('favoriteSuppliers') || '[]');

function isProductFavorite(id) {
  return favoriteProducts.includes(id);
}

function toggleProductFavorite(id) {
  if (isProductFavorite(id)) {
    favoriteProducts = favoriteProducts.filter(f => f !== id);
  } else {
    favoriteProducts.push(id);
  }
  localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
  updateFavoritesCount();
  renderProductFavorites();
  // Обновляем сердечки на странице
  document.querySelectorAll('.fav-heart').forEach(heart => {
    if (heart.dataset.id == id && heart.dataset.type === 'product') {
      heart.classList.toggle('inactive', !isProductFavorite(id));
      heart.textContent = isProductFavorite(id) ? '♥' : '♡';
    }
  });
}

function isSupplierFavorite(id) {
  return favoriteSuppliers.includes(id);
}

function toggleSupplierFavorite(id) {
  if (isSupplierFavorite(id)) {
    favoriteSuppliers = favoriteSuppliers.filter(f => f !== id);
  } else {
    favoriteSuppliers.push(id);
  }
  localStorage.setItem('favoriteSuppliers', JSON.stringify(favoriteSuppliers));
  updateFavoritesCount();
  renderSupplierFavorites();
  // Обновляем сердечки у поставщиков
  document.querySelectorAll('.supplier-heart').forEach(heart => {
    if (heart.dataset.id == id) {
      heart.classList.toggle('inactive', !isSupplierFavorite(id));
      heart.textContent = isSupplierFavorite(id) ? '♥' : '♡';
    }
  });
}

function updateFavoritesCount() {
  const countEl = document.getElementById('favorites-count');
  if (countEl) countEl.textContent = favoriteProducts.length + favoriteSuppliers.length;
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
      renderProductFavorites();
      renderSupplierFavorites();
    }
  });
});

// ================== РЕНДЕР ИЗБРАННОГО: ТОВАРЫ ==================
async function renderProductFavorites() {
  const container = document.getElementById('favorites-products-container');
  const empty = document.getElementById('favorites-empty');
  empty.style.display = 'none';

  if (favoriteProducts.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = 'В избранном пока пусто (товары)';
    return;
  }

  const ids = favoriteProducts.join(',');
  fetchData(`products?id=in.(${ids})`).then(products => {
    if (products.length === 0) {
      container.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Товары не найдены</p>';
      return;
    }
    let html = '<div class="product-grid">';
    products.forEach(p => {
      html += `
        <div class="product-card" onclick="openProductDetail(${p.id})">
          <img src="${p.image_url}" style="width:100%; height:180px; object-fit:cover;">
          <div class="fav-heart active" data-id="${p.id}" data-type="product" onclick="event.stopPropagation(); toggleProductFavorite(${p.id})">♥</div>
          <p class="price">${p.price} ₽</p>
          <h4>${p.title}</h4>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  });
}

// ================== РЕНДЕР ИЗБРАННОГО: ПОСТАВЩИКИ ==================
async function renderSupplierFavorites() {
  const container = document.getElementById('favorites-suppliers-container');
  const empty = document.getElementById('favorites-empty-suppliers');
  if (!container || !empty) return;

  empty.style.display = 'none';

  if (favoriteSuppliers.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = 'В избранном пока пусто (поставщики)';
    return;
  }

  const ids = favoriteSuppliers.join(',');
  fetchData(`suppliers?id=in.(${ids})`).then(suppliers => {
    if (suppliers.length === 0) {
      container.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Поставщики не найдены</p>';
      return;
    }
    let html = '';
    suppliers.forEach(s => {
      html += `
        <div class="supplier-card" style="cursor:pointer;" onclick="openSupplierDetail(${s.id})">
          <img src="${s.logo_url}">
          <div>
            <h4>${s.name}</h4>
            <p>${s.description || ''}</p>
          </div>
          <span class="supplier-heart active" data-id="${s.id}" onclick="event.stopPropagation(); toggleSupplierFavorite(${s.id})">♥</span>
        </div>`;
    });
    container.innerHTML = html;
  });
}

// ================== ЭКРАНЫ ==================
const nestedScreen = document.getElementById('nested-screen');
const nestedTitle = document.getElementById('nested-title');
const nestedContent = document.getElementById('nested-content');

// ================== ЗАГРУЗКА КАТЕГОРИЙ ==================
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
    card.innerHTML = `<img src="${cat.image_url}"><div>${cat.title}</div>`;
    card.onclick = () => openCategory(cat);
    grid.appendChild(card);
  });
}

// ================== ОТКРЫТИЕ КАТЕГОРИИ ==================
async function openCategory(cat) {
  nestedTitle.textContent = cat.title;
  nestedScreen.classList.remove('hidden');

  const subcats = await fetchData(`subcategories?category_id=eq.${cat.id}`);
  if (subcats.length > 0) {
    let html = '';
    subcats.forEach(sub => {
      html += `
        <div class="list-item" style="cursor:pointer;" onclick="openProducts('${sub.id}')">
          <img src="${sub.image_url}"><h4>${sub.title}</h4>
        </div>
      `;
    });
    nestedContent.innerHTML = html;
  } else {
    openProductsByCategory(cat.id);
  }
}

// ================== ОТКРЫТИЕ ТОВАРОВ ==================
async function openProducts(subId) {
  nestedTitle.textContent = 'Товары';
  const products = await fetchData(`products?subcategory_id=eq.${subId}`);
  renderProductGrid(products);
}

async function openProductsByCategory(categoryId) {
  nestedTitle.textContent = 'Товары';
  const subcats = await fetchData(`subcategories?category_id=eq.${categoryId}`);
  const subIds = subcats.map(s => s.id);
  let products = [];
  if (subIds.length > 0) {
    products = await fetchData(`products?subcategory_id=in.(${subIds.join(',')})`);
  }
  renderProductGrid(products);
}

// ================== РЕНДЕР ТОВАРОВ (с сердечками) ==================
function renderProductGrid(products) {
  if (products.length === 0) {
    nestedContent.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Товары не найдены</p>';
    return;
  }
  
  let html = '<div class="product-grid">';
  products.forEach(p => {
    const isFav = isProductFavorite(p.id);
    html += `
      <div class="product-card" onclick="openProductDetail(${p.id})">
        <img src="${p.image_url}" style="width:100%; height:180px; object-fit:cover;">
        <div class="fav-heart ${isFav ? 'active' : 'inactive'}" data-id="${p.id}" data-type="product" onclick="event.stopPropagation(); toggleProductFavorite(${p.id})">${isFav ? '♥' : '♡'}</div>
        <p class="price">${p.price} ₽</p>
        <h4>${p.title}</h4>
      </div>
    `;
  });
  html += '</div>';
  nestedContent.innerHTML = html;
}

// ================== ДЕТАЛИ ТОВАРА ==================
const detailScreen = document.getElementById('screen-product-detail');
const detailContent = document.getElementById('detail-content');
const detailBackBtn = document.getElementById('detail-back-btn');

async function openProductDetail(productId) {
  detailScreen.classList.remove('hidden');
  nestedScreen.classList.add('hidden');
  detailContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Загрузка...</p>';

  const product = await fetchData(`products?id=eq.${productId}`);
  if (product.length === 0) {
    detailContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Товар не найден</p>';
    return;
  }
  const p = product[0];

  let supplierBlock = '';
  if (p.supplier_id) {
    const supplier = await fetchData(`suppliers?id=eq.${p.supplier_id}`);
    if (supplier.length > 0) {
      const s = supplier[0];
      supplierBlock = `
        <div class="product-detail-supplier" style="display:block; padding:15px; background:#fff; border-radius:15px; margin-top:15px;">
          <div style="display:flex; align-items:center; gap:15px;">
            <img src="${s.logo_url}" style="width:50px; height:50px; border-radius:10px; object-fit:cover;">
            <div>
              <h4 style="margin:0; font-size:16px;">${s.name}</h4>
              <p style="margin:5px 0 0; font-size:14px; color:#999;">${s.description || ''}</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  detailContent.innerHTML = `
    <img class="product-detail-img" src="${p.image_url}" onerror="this.src='https://via.placeholder.com/300'">
    <h2 class="product-detail-title">${p.title}</h2>
    <div class="product-detail-price">${p.price} ₽ ${p.old_price ? `<span style="text-decoration: line-through; font-size: 18px; color: #999; font-weight: 400;">${p.old_price} ₽</span>` : ''}</div>
    <div class="product-detail-desc" style="background:#fff; border-radius:15px; padding:15px; margin-top:15px;">
      <h4>Описание</h4>
      <p style="margin:0; color:#555; font-size:14px;">${p.description || 'Описание отсутствует'}</p>
    </div>
    ${supplierBlock}
  `;
}

// Кнопка "Назад" в деталях товара
detailBackBtn.addEventListener('click', () => {
  detailScreen.classList.add('hidden');
  nestedScreen.classList.remove('hidden');
});

// Кнопка "Назад" на экране категорий
document.getElementById('back-btn').addEventListener('click', () => {
  nestedScreen.classList.add('hidden');
});

// ================== ПОСТАВЩИКИ (список и детали) ==================
const screenSuppliers = document.getElementById('screen-suppliers');
const suppliersBackBtn = document.getElementById('suppliers-back-btn');
const suppliersListContainer = document.getElementById('suppliers-list-container');
const screenSupplierDetail = document.getElementById('screen-supplier-detail');
const supplierDetailBackBtn = document.getElementById('supplier-detail-back-btn');
const supplierDetailContent = document.getElementById('supplier-detail-content');

async function openSuppliersScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenSuppliers.classList.add('active');
  const suppliers = await fetchData('suppliers');
  renderSuppliersList(suppliers);
}

function renderSuppliersList(suppliers) {
  suppliersListContainer.innerHTML = '';
  if (suppliers.length === 0) {
    suppliersListContainer.innerHTML = '<p style="text-align:center; margin-top:50px; color:#999;">Поставщики не найдены</p>';
    return;
  }
  suppliers.forEach(s => {
    const isFav = isSupplierFavorite(s.id);
    const div = document.createElement('div');
    div.className = 'supplier-card';
    div.innerHTML = `
      <img src="${s.logo_url}">
      <div>
        <h4>${s.name}</h4>
        <p>${s.description || ''}</p>
      </div>
      <span class="supplier-heart ${isFav ? 'active' : 'inactive'}" data-id="${s.id}" onclick="event.stopPropagation(); toggleSupplierFavorite(${s.id})">${isFav ? '♥' : '♡'}</span>
    `;
    div.onclick = () => openSupplierDetail(s.id);
    suppliersListContainer.appendChild(div);
  });
}

async function openSupplierDetail(supplierId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenSupplierDetail.classList.add('active');
  supplierDetailContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Загрузка...</p>';
  const supplier = await fetchData(`suppliers?id=eq.${supplierId}`);
  if (supplier.length > 0) {
    const s = supplier[0];
    const products = await fetchData(`products?supplier_id=eq.${supplierId}`);
    let productsHtml = '';
    if (products.length > 0) {
      productsHtml = `<h3 style="margin-bottom:15px;">Товары поставщика</h3><div class="product-grid">`;
      products.forEach(p => {
        const isFav = isProductFavorite(p.id);
        productsHtml += `
          <div class="product-card" onclick="openProductDetail(${p.id})">
            <img src="${p.image_url}" style="width:100%; height:180px; object-fit:cover;">
            <div class="fav-heart ${isFav ? 'active' : 'inactive'}" data-id="${p.id}" data-type="product" onclick="event.stopPropagation(); toggleProductFavorite(${p.id})">${isFav ? '♥' : '♡'}</div>
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
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
        <button onclick="alert('Контакты скоро будут!')">💬 Контакты</button>
        <button onclick="toggleSupplierFavorite(${s.id})">${isSupplierFavorite(s.id) ? '♥ В избранном' : '♡ В избранное'}</button>
      </div>
      ${productsHtml}
    `;
  }
}

suppliersBackBtn.addEventListener('click', () => {
  screenSuppliers.classList.remove('active');
  document.getElementById('screen-home').classList.add('active');
});
supplierDetailBackBtn.addEventListener('click', () => {
  screenSupplierDetail.classList.remove('active');
  screenSuppliers.classList.add('active');
});

// ================== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК В ИЗБРАННОМ ==================
const favTabs = document.querySelectorAll('.favorites-tab');
favTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    favTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const tabName = tab.dataset.tab;
    if (tabName === 'suppliers') {
      document.getElementById('favorites-products-container').style.display = 'none';
      document.getElementById('favorites-suppliers-container').style.display = 'block';
      renderSupplierFavorites();
    } else {
      document.getElementById('favorites-products-container').style.display = 'block';
      document.getElementById('favorites-suppliers-container').style.display = 'none';
      renderProductFavorites();
    }
  });
});

// ================== СТАРТ ==================
loadCategories();
updateFavoritesCount();
renderProductFavorites();
renderSupplierFavorites();
