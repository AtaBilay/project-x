// ============ INIT ============
const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";
const ADMIN_ID = 6157818783;

const tgUser = TG?.initDataUnsafe?.user;
let currentUserId = tgUser?.id || null;
let isAdmin = false;
let currentSupplierData = null;
let currentDetailProductId = null;
let selectedFiles = [];

let favProducts = JSON.parse(localStorage.getItem('fav_products') || '[]');
let favSuppliers = JSON.parse(localStorage.getItem('fav_suppliers') || '[]');
function saveFavs(){
  localStorage.setItem('fav_products', JSON.stringify(favProducts));
  localStorage.setItem('fav_suppliers', JSON.stringify(favSuppliers));
}

// ============ ERROR BANNER ============
function showErrorBanner(msg){
  let el = document.getElementById('__supabase_err');
  if (!el) {
    el = document.createElement('div');
    el.id = '__supabase_err';
    document.body.appendChild(el);
  }
  el.textContent = msg;
}

// ============ SUPABASE ============
async function uploadImage(file, bucket = 'product-images'){
  const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY },
      body: file
    });
    if (r.ok) return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    const txt = await r.text();
    showErrorBanner(`Upload [${r.status}] ${bucket}: ${txt.slice(0,150)}`);
    return null;
  } catch(e){
    showErrorBanner('Upload сеть: ' + e.message);
    return null;
  }
}

async function fetchData(endpoint){
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json'
      }
    });
    if (!r.ok) {
      const txt = await r.text();
      showErrorBanner(`⚠️ Supabase [${r.status}] /${endpoint.split('?')[0]} → ${txt.slice(0,180)}`);
      return [];
    }
    const data = await r.json();
    if (!Array.isArray(data)) {
      showErrorBanner('⚠️ Ответ не массив: ' + JSON.stringify(data).slice(0,180));
      return [];
    }
    return data;
  } catch(e){
    showErrorBanner('⚠️ Сеть: ' + e.message);
    return [];
  }
}

async function sbInsert(table, body){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const txt = await r.text();
    showErrorBanner(`⚠️ Insert ${table} [${r.status}]: ${txt.slice(0,180)}`);
    return null;
  }
  return await r.json();
}

// ============ HEART SVG ============
function heartSVG(active){
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="${active?'#ff4d67':'none'}" stroke="${active?'#ff4d67':'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-.3 0-.6-.1-.8-.3C7.4 17.4 3 13.3 3 9.5 3 6.5 5.4 4 8.4 4c1.6 0 3.1.8 4 2.1.9-1.3 2.4-2.1 4-2.1 3 0 5.4 2.5 5.4 5.5 0 3.8-4.4 7.9-8.2 11.2-.2.2-.5.3-.8.3z"/></svg>`;
}

// ============ NAVIGATION ============
function goTab(name){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
  document.querySelectorAll('.tabbtn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name === 'catalog') loadCatalogScreen();
  if (name === 'favorites') renderFavorites();
  if (name === 'profile') loadProfile();
}
window.goTab = goTab;

// ============ FAVORITES ============
function updateFavBadges(){
  const n = favProducts.length;
  document.querySelectorAll('.navdot').forEach(el => el.textContent = n);
  const gc = document.getElementById('seg-goods-count');
  const sc = document.getElementById('seg-sup-count');
  if (gc) gc.textContent = n;
  if (sc) sc.textContent = favSuppliers.length;
}
function toggleFavProduct(id){
  const i = favProducts.indexOf(id);
  if (i > -1) favProducts.splice(i, 1); else favProducts.push(id);
  saveFavs();
  updateFavBadges();
  document.querySelectorAll(`[data-fav-pid="${id}"]`).forEach(el => {
    const isFav = favProducts.includes(id);
    el.classList.toggle('on', isFav);
    el.innerHTML = heartSVG(isFav);
  });
}
function toggleFavSupplier(id){
  const i = favSuppliers.indexOf(id);
  if (i > -1) favSuppliers.splice(i, 1); else favSuppliers.push(id);
  saveFavs();
  updateFavBadges();
  document.querySelectorAll(`[data-fav-sid="${id}"]`).forEach(el => {
    const isFav = favSuppliers.includes(id);
    el.classList.toggle('on', isFav);
    el.style.color = isFav ? '#ff4d67' : 'var(--hint)';
    el.innerHTML = heartSVG(isFav);
  });
}
window.toggleFavProduct = toggleFavProduct;
window.toggleFavSupplier = toggleFavSupplier;

// ============ PRODUCT CARD ============
function renderProductCard(p, imgs){
  const images = (imgs && imgs.length) ? imgs : [{ image_url: p.image_url || 'https://via.placeholder.com/300' }];
  const slides = images.map(im => `<div class="ph-slide"><img src="${im.image_url || im}" alt="" loading="lazy"></div>`).join('');
  const dots = images.length > 1
    ? `<div class="ph-dotsrow">${images.map((_, i) => `<span class="pdot${i === 0 ? ' active' : ''}" data-idx="${i}" onclick="event.stopPropagation();goToSlide(this, ${i});"></span>`).join('')}</div>`
    : '';
  const badge = p.discount ? `<span class="tagbadge">${p.discount}</span>` : (p.is_hot ? '<span class="tagbadge">Hot</span>' : '');
  const fav = favProducts.includes(p.id);
  return `<div class="prod" onclick="openProductDetail(${p.id})">
    <div class="ph">
      <div class="ph-track">${slides}</div>
      ${badge}
      <button class="pcorner ${fav ? 'on' : ''}" data-fav-pid="${p.id}" onclick="event.stopPropagation();toggleFavProduct(${p.id});">${heartSVG(fav)}</button>
    </div>
    ${dots}
    <div class="pinfo">
      <div class="price">${p.price} ₽${p.old_price ? ` <span style="text-decoration:line-through;font-size:12px;color:var(--hint);font-weight:400;">${p.old_price} ₽</span>` : ''}</div>
      <div class="pname">${p.title}</div>
    </div>
  </div>`;
}
window.renderProductCard = renderProductCard;

function goToSlide(dotEl, idx){
  const prod = dotEl.closest('.prod');
  if (!prod) return;
  const track = prod.querySelector('.ph-track');
  if (!track) return;
  track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
}
window.goToSlide = goToSlide;

document.addEventListener('scroll', (e) => {
  const t = e.target;
  if (t && t.classList && t.classList.contains('ph-track')) {
    const idx = Math.round(t.scrollLeft / t.clientWidth);
    const row = t.closest('.prod')?.querySelector('.ph-dotsrow');
    if (row) row.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  }
}, true);

// ============ LOAD HOME ============
async function loadHome(){
  const [cats, products] = await Promise.all([
    fetchData('categories'),
    fetchData('products?limit=200')
  ]);
  const chiprow = document.getElementById('chiprow');
  chiprow.innerHTML = '<button class="chip active" data-cat="">Все</button>' +
    (cats.length ? cats.map(c => `<button class="chip" data-cat="${c.id}">${c.title}</button>`).join('') : '');
  chiprow.querySelectorAll('.chip').forEach(ch => {
    ch.onclick = () => {
      chiprow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      ch.classList.add('active');
      filterHomeByCategory(ch.dataset.cat);
    };
  });

  const hot = products.filter(p => p.is_hot).slice(0, 6);
  const top = products.slice(0, 6);
  const ids = [...new Set([...hot, ...top].map(p => p.id))];
  let imgs = [];
  if (ids.length) imgs = await fetchData(`product_images?product_id=in.(${ids.join(',')})`);

  document.getElementById('hot-grid').innerHTML = hot.length
    ? hot.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('')
    : '<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">Пока нет товаров</p>';
  document.getElementById('top-grid').innerHTML = top.length
    ? top.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('')
    : '<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">Пока нет товаров</p>';
}

async function filterHomeByCategory(catId){
  if (!catId) { loadHome(); return; }
  const subs = await fetchData(`subcategories?category_id=eq.${catId}`);
  const subIds = subs.map(s => s.id);
  const hotGrid = document.getElementById('hot-grid');
  const topGrid = document.getElementById('top-grid');
  if (!subIds.length) {
    hotGrid.innerHTML = '<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">В этой категории пока нет товаров</p>';
    topGrid.innerHTML = '';
    return;
  }
  const products = await fetchData(`products?subcategory_id=in.(${subIds.join(',')})&limit=50`);
  let imgs = [];
  if (products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p => p.id).join(',')})`);
  hotGrid.innerHTML = products.length
    ? products.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('')
    : '<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">Нет товаров</p>';
  topGrid.innerHTML = '';
}

// ============ CATALOG SCREEN ============
async function loadCatalogScreen(){
  const [cats, sups] = await Promise.all([fetchData('categories'), fetchData('suppliers')]);
  document.getElementById('catalog-cat-list').innerHTML = cats.map(c => `
    <div class="list-row" onclick="openCategoryOverlay(${c.id}, '${(c.title || '').replace(/'/g, "\\'")}')">
      <div class="avatar">${c.image_url ? `<img src="${c.image_url}">` : '📦'}</div>
      <div class="meta"><b>${c.title}</b><span>Раздел каталога</span></div>
      <span class="chev">›</span>
    </div>`).join('') || '<div style="text-align:center;padding:20px;color:var(--hint);">Категорий пока нет</div>';

  document.getElementById('catalog-sup-list').innerHTML =
    (sups.slice(0, 10).map(s => `
      <div class="list-row" onclick="openSupplierDetail(${s.id})">
        <div class="avatar">${s.logo_url ? `<img src="${s.logo_url}">` : s.name.slice(0, 2).toUpperCase()}</div>
        <div class="meta"><b>${s.name}</b><span>${s.description || ''}</span></div>
        <span class="chev">›</span>
      </div>`).join('') || '<div style="text-align:center;padding:20px;color:var(--hint);">Поставщиков пока нет</div>')
    + (sups.length ? `<div class="list-row" onclick="openSuppliersScreen()" style="justify-content:center;"><b style="color:var(--btn);">Все поставщики →</b></div>` : '');
}

// ============ CATEGORY OVERLAY ============
async function openCategoryOverlay(catId, title){
  const nested = document.getElementById('nested-screen');
  document.getElementById('nested-title').textContent = title;
  document.getElementById('nested-content').innerHTML = '<p style="text-align:center;margin-top:50px;color:var(--hint);">Загрузка...</p>';
  nested.classList.add('show');
  const subs = await fetchData(`subcategories?category_id=eq.${catId}`);
  const filtered = subs.filter(s => (s.title || '').toLowerCase() !== 'все товары');
  document.getElementById('nested-content').innerHTML = `
    <div class="card" style="padding:4px 16px;">
      <div class="list-row" onclick="openAllProductsInCategory(${catId})">
        <div class="avatar">📦</div><div class="meta"><b>Все товары</b></div><span class="chev">›</span>
      </div>
      ${filtered.map(s => `<div class="list-row" onclick="openProductsInSub(${s.id})">
        <div class="avatar">${s.image_url ? `<img src="${s.image_url}">` : '📁'}</div>
        <div class="meta"><b>${s.title}</b></div><span class="chev">›</span>
      </div>`).join('')}
    </div>`;
}
window.openCategoryOverlay = openCategoryOverlay;

async function openAllProductsInCategory(catId){
  const subs = await fetchData(`subcategories?category_id=eq.${catId}`);
  const subIds = subs.map(s => s.id);
  if (!subIds.length) { alert('Товаров нет'); return; }
  const products = await fetchData(`products?subcategory_id=in.(${subIds.join(',')})`);
  let imgs = [];
  if (products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p => p.id).join(',')})`);
  document.getElementById('nested-title').textContent = 'Все товары';
  document.getElementById('nested-content').innerHTML = `<div class="grid2">${products.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('')}</div>`;
}
window.openAllProductsInCategory = openAllProductsInCategory;

async function openProductsInSub(subId){
  const products = await fetchData(`products?subcategory_id=eq.${subId}`);
  let imgs = [];
  if (products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p => p.id).join(',')})`);
  document.getElementById('nested-title').textContent = 'Товары';
  document.getElementById('nested-content').innerHTML = `<div class="grid2">${products.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('')}</div>`;
}
window.openProductsInSub = openProductsInSub;

// ============ PRODUCT DETAIL ============
async function openProductDetail(productId){
  const overlay = document.getElementById('screen-product-detail');
  overlay.classList.add('show');
  currentDetailProductId = productId;
  const content = document.getElementById('detail-content');
  content.innerHTML = '<p style="text-align:center;margin-top:60px;color:var(--hint);">Загрузка...</p>';
  const pArr = await fetchData(`products?id=eq.${productId}`);
  if (!pArr.length) { content.innerHTML = '<p style="text-align:center;margin-top:60px;">Товар не найден</p>'; return; }
  const p = pArr[0];
  const images = await fetchData(`product_images?product_id=eq.${productId}`);
  const imgs = images.length ? images : [{ image_url: p.image_url || 'https://via.placeholder.com/300' }];
  const slides = imgs.map(im => `<div class="ph-slide"><img src="${im.image_url || im}" alt=""></div>`).join('');
  const dots = imgs.length > 1 ? `<div class="pd-dots" id="pd-dots">${imgs.map((_, i) => `<span class="pdot${i === 0 ? ' active' : ''}" data-idx="${i}" onclick="goToDetailSlide(${i})"></span>`).join('')}</div>` : '';
  let supplierBlock = '';
  if (p.supplier_id) {
    const supArr = await fetchData(`suppliers?id=eq.${p.supplier_id}`);
    if (supArr.length) {
      const s = supArr[0];
      currentSupplierData = s;
      supplierBlock = `
        <div class="pd-supplier">
          <div class="avatar">${s.logo_url ? `<img src="${s.logo_url}">` : s.name.slice(0, 2)}</div>
          <div style="flex:1;min-width:0;"><b style="font-size:15px;">${s.name}</b><div style="font-size:12px;color:var(--hint);">${s.description || 'Прямой поставщик'}</div></div>
        </div>
        <div class="pd-actions">
          <button onclick="showSupplierContacts()">💬 Контакты</button>
          <button onclick="openSupplierDetail(${s.id})">🏬 Ассортимент</button>
        </div>`;
    }
  }
  const isFav = favProducts.includes(p.id);
  const heartBtn = document.getElementById('pd-heart');
  heartBtn.classList.toggle('on', isFav);
  heartBtn.innerHTML = heartSVG(isFav);
  content.innerHTML = `
    <div class="pd-photo"><div class="ph-track" id="pd-track">${slides}</div></div>
    ${dots}
    <div class="pd-price-row">
      <span class="pd-price">${p.price} ₽</span>
      ${p.old_price ? `<span class="pd-old">${p.old_price} ₽</span>` : ''}
    </div>
    <div class="pd-name">${p.title}</div>
    ${supplierBlock}
    <div class="card" style="margin-top:14px;">
      <h3 style="font-size:15px;margin-bottom:6px;">Описание</h3>
      <p style="font-size:14px;color:var(--hint);line-height:1.5;white-space:pre-line;">${p.description || 'Описание отсутствует'}</p>
    </div>
    <div class="notice" style="margin-top:14px;">🛡️ Заказ, оплата и доставка — напрямую у поставщика.</div>
  `;
  const track = document.getElementById('pd-track');
  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    document.querySelectorAll('#pd-dots .pdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  });
}
window.openProductDetail = openProductDetail;

function goToDetailSlide(idx){
  const track = document.getElementById('pd-track');
  if (!track) return;
  track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
}
window.goToDetailSlide = goToDetailSlide;

document.getElementById('pd-heart').addEventListener('click', () => {
  if (currentDetailProductId) {
    toggleFavProduct(currentDetailProductId);
    const btn = document.getElementById('pd-heart');
    const isFav = favProducts.includes(currentDetailProductId);
    btn.classList.toggle('on', isFav);
    btn.innerHTML = heartSVG(isFav);
  }
});
document.getElementById('detail-back-btn').onclick = () => document.getElementById('screen-product-detail').classList.remove('show');
document.getElementById('back-btn').onclick = () => document.getElementById('nested-screen').classList.remove('show');

// ============ SEARCH ============
const searchInput = document.getElementById('search-input');
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 350);
});
async function runSearch(){
  const q = searchInput.value.trim();
  const block = document.getElementById('search-block');
  const home = document.getElementById('home-block');
  if (!q) { block.style.display = 'none'; home.style.display = 'block'; return; }
  block.style.display = 'block';
  home.style.display = 'none';
  const res = await fetchData(`products?title=ilike.*${encodeURIComponent(q)}*&limit=30`);
  const empty = document.getElementById('search-empty');
  if (!res.length) {
    document.getElementById('search-results').innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  const imgs = await fetchData(`product_images?product_id=in.(${res.map(p => p.id).join(',')})`);
  document.getElementById('search-results').innerHTML = res.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('');
}

// ============ SORT ============
function openSortSheet(){ document.getElementById('sort-modal').classList.remove('hidden'); }
window.openSortSheet = openSortSheet;
document.getElementById('sort-modal-backdrop').onclick = () => document.getElementById('sort-modal').classList.add('hidden');
function pickSortOption(val){
  document.querySelectorAll('.sort-option').forEach(o => {
    const on = o.dataset.value === val;
    o.classList.toggle('active', on);
    const rb = o.querySelector('.radio-btn');
    if (rb) rb.classList.toggle('selected', on);
  });
  setTimeout(() => document.getElementById('sort-modal').classList.add('hidden'), 200);
}
window.pickSortOption = pickSortOption;

// ============ FAVORITES SCREEN ============
function segSwitch(which){
  document.getElementById('seg-goods').classList.toggle('active', which === 'goods');
  document.getElementById('seg-sup').classList.toggle('active', which === 'sup');
  document.getElementById('fav-goods-wrap').style.display = which === 'goods' ? '' : 'none';
  document.getElementById('fav-suppliers').style.display = which === 'sup' ? '' : 'none';
}
window.segSwitch = segSwitch;

async function renderFavorites(){
  updateFavBadges();
  const goodsWrap = document.getElementById('fav-goods');
  const emptyGoods = document.getElementById('fav-goods-empty');
  if (!favProducts.length) {
    goodsWrap.innerHTML = '';
    emptyGoods.style.display = 'flex';
  } else {
    emptyGoods.style.display = 'none';
    const products = await fetchData(`products?id=in.(${favProducts.join(',')})`);
    const imgs = products.length ? await fetchData(`product_images?product_id=in.(${products.map(p => p.id).join(',')})`) : [];
    goodsWrap.innerHTML = products.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('');
  }
  const supWrap = document.getElementById('fav-suppliers-list');
  const emptySup = document.getElementById('fav-sup-empty');
  if (!favSuppliers.length) {
    supWrap.innerHTML = '';
    emptySup.style.display = 'flex';
  } else {
    emptySup.style.display = 'none';
    const sups = await fetchData(`suppliers?id=in.(${favSuppliers.join(',')})`);
    supWrap.innerHTML = sups.map(s => `
      <div class="list-row" onclick="openSupplierDetail(${s.id})">
        <div class="avatar">${s.logo_url ? `<img src="${s.logo_url}">` : s.name.slice(0, 2)}</div>
        <div class="meta"><b>${s.name}</b><span>${s.description || ''}</span></div>
        <button class="heart-ic on" data-fav-sid="${s.id}" style="color:#ff4d67;" onclick="event.stopPropagation();toggleFavSupplier(${s.id});">${heartSVG(true)}</button>
      </div>`).join('');
  }
}
window.renderFavorites = renderFavorites;

// ============ PROFILE ============
async function loadProfile(){
  const name = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'Пользователь';
  document.getElementById('user-name').textContent = name;
  document.getElementById('user-username').textContent = tgUser?.username ? '@' + tgUser.username : 'Нет username';
  if (tgUser?.photo_url) document.getElementById('user-avatar').src = tgUser.photo_url;
  try {
    const admins = await fetchData(`admins?telegram_id=eq.${currentUserId}`);
    isAdmin = admins.length > 0 || currentUserId === ADMIN_ID;
  } catch (e) { isAdmin = currentUserId === ADMIN_ID; }
  document.getElementById('admin-panel-btn').style.display = isAdmin ? 'block' : 'none';
}

// ============ SETTINGS / FAQ ============
document.getElementById('open-settings-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-settings').classList.add('active');
};
document.getElementById('settings-back-btn').onclick = () => goTab('profile');
document.getElementById('open-faq-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-faq').classList.add('active');
};
document.getElementById('faq-back-btn').onclick = () => goTab('profile');

const faqData = [
  { q: 'Как оформить заказ?', a: 'Просто выгодно — это каталог поставщиков, а не интернет-магазин. Откройте пост поставщика, перейдите по ссылке, изучите ассортимент и свяжитесь с поставщиком напрямую, чтобы согласовать заказ, доставку и оплату.' },
  { q: 'Кто принимает оплату за заказ?', a: 'Оплата производится напрямую поставщику. Просто выгодно не принимает оплату за товары и не участвует в сделках между покупателем и продавцом.' },
  { q: 'Можно ли оформить возврат?', a: 'Условия возврата зависят от конкретного поставщика. Перед оплатой уточняйте возможность возврата, сроки и условия обмена товара.' },
  { q: 'Можно ли написать поставщику не в Telegram?', a: 'Да — у части поставщиков в контактах указаны другие способы связи: сайт, VK, WhatsApp. Если Telegram недоступен, просто выбирайте таких поставщиков; список контактов постоянно обновляется.' },
  { q: 'Подписка списывается один раз или каждый месяц?', a: 'Подписка на «Просто выгодно» — ежемесячная. Пока она активна, вам открыты новые поступления, розыгрыши и остальные обновления каталога.' },
  { q: 'Почему доставку нужно оплачивать отдельно?', a: 'Посылки развозят транспортные компании, а не мы — именно они и выставляют цену. Стоимость зависит от веса, объёма груза и региона доставки.' },
  { q: 'Поставщик долго не отвечает — это нормально?', a: 'У популярных поставщиков в день много обращений, поэтому ответ может занять до суток. Лучше просто подождать: повторные сообщения только удлиняют очередь.' },
  { q: 'Насколько безопасно покупать через каталог?', a: 'Мы проверяем поставщиков перед публикацией, но сама сделка — это уже ваша прямая договорённость с продавцом. Поэтому важно свериться по оплате, доставке и возврату непосредственно перед покупкой.' }
];
document.getElementById('faq-list').innerHTML = faqData.map(f => `
  <div class="faq-item" onclick="this.classList.toggle('open')">
    <div class="faq-q">${f.q}<span class="chevron">⌄</span></div>
    <div class="faq-a">${f.a}</div>
  </div>`).join('');

// ============ SUPPLIERS ============
async function openSuppliersScreen(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-suppliers').classList.add('active');
  const sups = await fetchData('suppliers');
  renderSuppliersList(sups);
}
window.openSuppliersScreen = openSuppliersScreen;

function renderSuppliersList(sups){
  const wrap = document.getElementById('suppliers-list-container');
  if (!sups.length) {
    wrap.innerHTML = '<p style="text-align:center;color:var(--hint);margin-top:30px;">Поставщики не найдены</p>';
    return;
  }
  wrap.innerHTML = `<div class="card" style="padding:4px 16px;">${sups.map(s => `
    <div class="list-row" onclick="openSupplierDetail(${s.id})">
      <div class="avatar">${s.logo_url ? `<img src="${s.logo_url}">` : s.name.slice(0, 2)}</div>
      <div class="meta"><b>${s.name}</b><span>${s.description || ''}</span></div>
      <span class="chev">›</span>
    </div>`).join('')}</div>`;
}
document.getElementById('suppliers-back-btn').onclick = () => {
  document.getElementById('screen-suppliers').classList.remove('active');
  goTab('catalog');
};

async function openSupplierDetail(supplierId){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-supplier-detail').classList.add('active');
  const wrap = document.getElementById('supplier-detail-content');
  wrap.innerHTML = '<p style="text-align:center;margin-top:50px;color:var(--hint);">Загрузка...</p>';
  const arr = await fetchData(`suppliers?id=eq.${supplierId}`);
  if (!arr.length) return;
  const s = arr[0];
  currentSupplierData = s;
  const products = await fetchData(`products?supplier_id=eq.${supplierId}&limit=30`);
  let imgs = [];
  if (products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p => p.id).join(',')})`);
  const isFav = favSuppliers.includes(s.id);
  wrap.innerHTML = `
    <div class="pd-supplier">
      <div class="avatar" style="width:56px;height:56px;">${s.logo_url ? `<img src="${s.logo_url}">` : s.name.slice(0, 2)}</div>
      <div style="flex:1;min-width:0;"><b style="font-size:16px;">${s.name}</b><div style="font-size:13px;color:var(--hint);">${s.description || ''}</div></div>
      <button class="heart-ic ${isFav ? 'on' : ''}" data-fav-sid="${s.id}" style="color:${isFav ? '#ff4d67' : 'var(--hint)'};" onclick="event.stopPropagation();toggleFavSupplier(${s.id});">${heartSVG(isFav)}</button>
    </div>
    <div class="pd-actions" style="margin-bottom:16px;">
      <button onclick="showSupplierContacts()">💬 Контакты</button>
      <button onclick="alert('Ассортимент скоро')">🏬 Ассортимент</button>
    </div>
    ${products.length
      ? `<div class="sec-title" style="margin-bottom:10px;">Товары поставщика</div><div class="grid2">${products.map(p => renderProductCard(p, imgs.filter(i => i.product_id === p.id))).join('')}</div>`
      : '<p style="text-align:center;color:var(--hint);margin-top:30px;">Товаров пока нет</p>'}
  `;
}
window.openSupplierDetail = openSupplierDetail;
document.getElementById('supplier-detail-back-btn').onclick = () => {
  document.getElementById('screen-supplier-detail').classList.remove('active');
  document.getElementById('screen-suppliers').classList.add('active');
};

// ============ CONTACTS MODAL ============
function showSupplierContacts(){
  const s = currentSupplierData;
  if (!s) return;
  const contacts = Array.isArray(s.contacts) ? s.contacts : [];
  let html = `<p style="color:var(--hint);font-size:13px;margin:0 0 14px 0;">${s.name}</p>`;
  if (!contacts.length) {
    html += '<p style="text-align:center;color:var(--hint);margin:20px 0;">У поставщика пока нет контактов.</p>';
  } else {
    contacts.forEach(c => {
      let icon = '🔗', label = c.type;
      if (c.type === 'telegram') { icon = '✈️'; label = 'Telegram'; }
      else if (c.type === 'whatsapp') { icon = '💬'; label = 'WhatsApp'; }
      else if (c.type === 'phone') { icon = '📞'; label = 'Телефон'; }
      else if (c.type === 'vk') { icon = '📘'; label = 'VK'; }
      else if (c.type === 'website') { icon = '🌐'; label = 'Сайт'; }
      let link = c.value.startsWith('http') ? c.value : 'https://' + c.value;
      html += `<div style="background:var(--secbg);padding:14px;border-radius:12px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:22px;">${icon}</div>
        <div style="flex:1;min-width:0;"><b style="font-size:14px;">${label}</b><div><a href="${link}" target="_blank" style="color:var(--btn);text-decoration:underline;font-size:13px;word-break:break-all;">${c.value}</a></div></div>
      </div>`;
    });
  }
  document.getElementById('supplier-contacts-list').innerHTML = html;
  document.getElementById('supplier-contacts-modal').classList.remove('hidden');
}
window.showSupplierContacts = showSupplierContacts;
document.getElementById('close-contacts-btn').onclick = () => document.getElementById('supplier-contacts-modal').classList.add('hidden');

// ============ ADMIN PANEL ============
document.getElementById('admin-panel-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
};
document.getElementById('admin-back-btn').onclick = () => goTab('profile');

// ---------- ADD PRODUCT ----------
document.getElementById('btn-add-product').onclick = async () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin-product').classList.add('active');
  const categories = await fetchData('categories');
  document.getElementById('product-category').innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  loadSubsAndSuppliers();
};
document.getElementById('product-back-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
};
document.getElementById('product-images').addEventListener('change', (e) => {
  selectedFiles = Array.from(e.target.files);
  renderImagePreviews();
});
function renderImagePreviews(){
  const pc = document.getElementById('image-preview-container');
  pc.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wrap = document.createElement('div');
      wrap.className = 'preview-wrap';
      const img = document.createElement('img');
      img.src = ev.target.result;
      const del = document.createElement('span');
      del.className = 'preview-delete';
      del.textContent = '×';
      del.onclick = () => { selectedFiles.splice(index, 1); renderImagePreviews(); };
      wrap.appendChild(img); wrap.appendChild(del);
      pc.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
}
async function loadSubsAndSuppliers(){
  const [subs, sups] = await Promise.all([fetchData('subcategories'), fetchData('suppliers')]);
  document.getElementById('product-subcategory').innerHTML = '<option value="">Выберите тип...</option>' + subs.map(s => `<option value="${s.id}">${s.title}</option>`).join('');
  document.getElementById('product-supplier').innerHTML = '<option value="">Выберите поставщика...</option>' + sups.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}
document.getElementById('save-product-btn').onclick = async () => {
  const title = document.getElementById('product-title').value.trim();
  const price = document.getElementById('product-price').value;
  const oldPrice = document.getElementById('product-old-price').value;
  const discount = document.getElementById('product-discount').value;
  const desc = document.getElementById('product-desc').value;
  const subId = document.getElementById('product-subcategory').value;
  const supId = document.getElementById('product-supplier').value;
  if (!title) { alert('Впиши название'); return; }
  if (!price || parseFloat(price) <= 0) { alert('Впиши цену'); return; }
  if (!selectedFiles.length) { alert('Выбери фото'); return; }
  if (!subId) { alert('Выбери тип'); return; }
  if (!supId) { alert('Выбери поставщика'); return; }
  const urls = [];
  for (const f of selectedFiles) {
    const u = await uploadImage(f, 'product-images');
    if (!u) { alert('Ошибка загрузки фото'); return; }
    urls.push(u);
  }
  const data = await sbInsert('products', {
    subcategory_id: subId, supplier_id: supId, title, price,
    old_price: oldPrice || null, discount, description: desc,
    image_url: urls[0], is_hot: discount ? true : false
  });
  if (!data || !data[0]) { alert('Ошибка сохранения'); return; }
  const pid = data[0].id;
  for (const url of urls) {
    await sbInsert('product_images', { product_id: pid, image_url: url });
  }
  ['product-title', 'product-price', 'product-old-price', 'product-discount', 'product-desc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('product-images').value = '';
  selectedFiles = [];
  renderImagePreviews();
  alert('✅ Товар добавлен!');
};

// ---------- ADD SUPPLIER ----------
const contactsContainer = document.getElementById('supplier-contacts-container');
function addContactField(type = 'telegram', value = ''){
  if (!contactsContainer) return;
  const div = document.createElement('div');
  div.className = 'contact-row';
  div.innerHTML = `
    <select class="contact-type">
      <option value="telegram" ${type === 'telegram' ? 'selected' : ''}>Telegram</option>
      <option value="whatsapp" ${type === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
      <option value="phone" ${type === 'phone' ? 'selected' : ''}>Телефон</option>
      <option value="vk" ${type === 'vk' ? 'selected' : ''}>VK</option>
      <option value="website" ${type === 'website' ? 'selected' : ''}>Сайт</option>
    </select>
    <input type="text" class="contact-value" placeholder="Ссылка или номер" value="${value}">
    <button type="button" class="remove-contact-btn">×</button>
  `;
  div.querySelector('.remove-contact-btn').onclick = () => div.remove();
  contactsContainer.appendChild(div);
}
window.addContactField = addContactField;
document.getElementById('btn-add-contact').onclick = () => addContactField();

document.getElementById('btn-add-supplier').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin-supplier').classList.add('active');
  contactsContainer.innerHTML = '';
  addContactField();
  document.getElementById('supplier-name').value = '';
  document.getElementById('supplier-desc').value = '';
  document.getElementById('supplier-logo').value = '';
};
document.getElementById('supplier-back-btn').onclick = () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
};
document.getElementById('save-supplier-btn').onclick = async () => {
  const name = document.getElementById('supplier-name').value.trim();
  const desc = document.getElementById('supplier-desc').value.trim();
  const logoFile = document.getElementById('supplier-logo').files[0];
  if (!name) { alert('Впиши название'); return; }
  const contacts = [];
  document.querySelectorAll('.contact-row').forEach(row => {
    const type = row.querySelector('.contact-type').value;
    const value = row.querySelector('.contact-value').value.trim();
    if (value) contacts.push({ type, value });
  });
  let logoUrl = null;
  if (logoFile) {
    logoUrl = await uploadImage(logoFile, 'supplier-images');
    if (!logoUrl) { alert('Ошибка загрузки логотипа'); return; }
  }
  const data = await sbInsert('suppliers', { name, description: desc, logo_url: logoUrl, contacts });
  if (data) {
    document.getElementById('supplier-name').value = '';
    document.getElementById('supplier-desc').value = '';
    document.getElementById('supplier-logo').value = '';
    contactsContainer.innerHTML = '';
    alert('✅ Поставщик добавлен!');
  } else {
    alert('Ошибка сохранения');
  }
};

// ---------- CREATE MODAL ----------
const modal = document.getElementById('create-modal');
let modalType = 'category';
document.getElementById('modal-image').addEventListener('change', (e) => {
  const pc = document.getElementById('modal-image-preview-container');
  pc.innerHTML = '';
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const wrap = document.createElement('div');
    wrap.className = 'preview-wrap';
    const img = document.createElement('img');
    img.src = ev.target.result;
    wrap.appendChild(img);
    pc.appendChild(wrap);
  };
  reader.readAsDataURL(file);
});
document.getElementById('btn-add-category').onclick = () => openCreateModal('category', 'Новый раздел');
document.getElementById('btn-add-subcategory').onclick = () => openCreateModal('subcategory', 'Новый тип');
function openCreateModal(type, title){
  modalType = type;
  document.getElementById('modal-name').value = '';
  document.getElementById('modal-image').value = '';
  document.getElementById('modal-image-preview-container').innerHTML = '';
  document.getElementById('modal-title').textContent = title;
  modal.classList.remove('hidden');
}
document.getElementById('modal-cancel-btn').onclick = () => modal.classList.add('hidden');
document.getElementById('modal-save-btn').onclick = async () => {
  const name = document.getElementById('modal-name').value.trim();
  const imgFile = document.getElementById('modal-image').files[0];
  if (!name) { alert('Впиши название'); return; }
  if (!imgFile) { alert('Выбери иконку'); return; }
  const url = await uploadImage(imgFile, 'category-images');
  if (!url) { alert('Ошибка загрузки'); return; }
  const table = modalType === 'subcategory' ? 'subcategories' : 'categories';
  const body = modalType === 'subcategory'
    ? { title: name, image_url: url, category_id: (await fetchData('categories'))[0]?.id || 1 }
    : { title: name, image_url: url };
  const data = await sbInsert(table, body);
  if (data) {
    modal.classList.add('hidden');
    alert('✅ Создано!');
  } else {
    alert('Ошибка');
  }
};

// ---------- FILTER MODAL ----------
let selectedSupplierCategories = [];
document.getElementById('open-filter-modal-btn').onclick = async () => {
  const cats = await fetchData('categories');
  const grid = document.getElementById('modal-category-grid');
  grid.innerHTML = '';
  cats.forEach(c => {
    const el = document.createElement('div');
    el.className = 'modal-category-item' + (selectedSupplierCategories.includes(c.id) ? ' selected' : '');
    el.textContent = c.title;
    el.onclick = () => {
      const i = selectedSupplierCategories.indexOf(c.id);
      if (i > -1) { selectedSupplierCategories.splice(i, 1); el.classList.remove('selected'); }
      else { selectedSupplierCategories.push(c.id); el.classList.add('selected'); }
    };
    grid.appendChild(el);
  });
  document.getElementById('category-filter-modal').classList.remove('hidden');
};
document.getElementById('close-filter-modal-btn').onclick = async () => {
  document.getElementById('category-filter-modal').classList.add('hidden');
  const allSups = await fetchData('suppliers');
  if (!selectedSupplierCategories.length) {
    renderSuppliersList(allSups);
    document.getElementById('filter-status-text').textContent = 'Все категории';
    document.getElementById('filter-subtitle-text').textContent = 'Показаны все поставщики';
    return;
  }
  const [allProducts, allSubs] = await Promise.all([fetchData('products'), fetchData('subcategories')]);
  const map = {};
  allSubs.forEach(sub => {
    const prods = allProducts.filter(p => p.subcategory_id === sub.id);
    prods.forEach(p => {
      if (!map[p.supplier_id]) map[p.supplier_id] = [];
      if (!map[p.supplier_id].includes(sub.category_id)) map[p.supplier_id].push(sub.category_id);
    });
  });
  const filtered = allSups.filter(s => (map[s.id] || []).some(c => selectedSupplierCategories.includes(parseInt(c))));
  renderSuppliersList(filtered);
  document.getElementById('filter-status-text').textContent = `Выбрано: ${selectedSupplierCategories.length}`;
  document.getElementById('filter-subtitle-text').textContent = 'Отфильтрованы по категориям';
};

// ============ START ============
loadHome();
updateFavBadges();
