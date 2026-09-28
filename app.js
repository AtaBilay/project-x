const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";
const ADMIN_ID = 6157818783;

const tgUser = TG?.initDataUnsafe?.user;
let currentUserId = tgUser?.id || null;
let isAdmin = false;

// ==== FAVORITES (localStorage) ====
let favProducts = JSON.parse(localStorage.getItem('fav_products') || '[]');
let favSuppliers = JSON.parse(localStorage.getItem('fav_suppliers') || '[]');
function saveFavs(){localStorage.setItem('fav_products',JSON.stringify(favProducts));localStorage.setItem('fav_suppliers',JSON.stringify(favSuppliers));}
function isFavProduct(id){return favProducts.includes(id);}
function isFavSupplier(id){return favSuppliers.includes(id);}
function toggleFavProduct(id){const i=favProducts.indexOf(id);if(i>-1)favProducts.splice(i,1);else favProducts.push(id);saveFavs();updateFavBadges();renderFavorites();}
function toggleFavSupplier(id){const i=favSuppliers.indexOf(id);if(i>-1)favSuppliers.splice(i,1);else favSuppliers.push(id);saveFavs();renderFavorites();}
function updateFavBadges(){const n=favProducts.length;document.querySelectorAll('[id^="badge-fav"]').forEach(el=>el.textContent=n);document.getElementById('seg-goods-count').textContent=n;document.getElementById('seg-sup-count').textContent=favSuppliers.length;}

// ==== SUPABASE ====
async function uploadImage(file, bucket='product-images'){
  const path=`${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},body:file});
  if(r.ok)return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  alert(`⚠️ Ошибка загрузки фото! Проверь бакет '${bucket}'`);return null;
}
async function fetchData(endpoint){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
  return await r.json();
}

// ==== TAB NAVIGATION ====
function goTab(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('screen-'+name);
  if(el)el.classList.add('active');
  document.querySelectorAll('.tabbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  if(name==='catalog')loadCatalogScreen();
  if(name==='favorites')renderFavorites();
  if(name==='profile')loadProfile();
}
window.goTab = goTab;

// ==== PRODUCT CARD RENDERER ====
function heartSVG(active){
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="${active?'#ff4d67':'none'}" stroke="${active?'#ff4d67':'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-.3 0-.6-.1-.8-.3C7.4 17.4 3 13.3 3 9.5 3 6.5 5.4 4 8.4 4c1.6 0 3.1.8 4 2.1.9-1.3 2.4-2.1 4-2.1 3 0 5.4 2.5 5.4 5.5 0 3.8-4.4 7.9-8.2 11.2-.2.2-.5.3-.8.3z"/></svg>`;
}
function renderProductCard(p, images){
  const imgs = images && images.length ? images : [{image_url: p.image_url || 'https://via.placeholder.com/300'}];
  const slides = imgs.map(im=>`<div class="ph-slide"><img src="${im.image_url||im}" alt=""></div>`).join('');
  const dots = imgs.length>1 ? `<div class="ph-dotsrow">${imgs.map((_,i)=>`<span class="pdot${i===0?' active':''}"></span>`).join('')}</div>` : '';
  const badge = p.discount ? `<span class="tagbadge">${p.discount}</span>` : (p.is_hot ? '<span class="tagbadge">Hot</span>' : '');
  const fav = isFavProduct(p.id);
  return `<div class="prod" data-pid="${p.id}" onclick="openProductDetail(${p.id})">
    <div class="ph">
      <div class="ph-track">${slides}</div>
      ${badge}
      <button class="pcorner ${fav?'on':''}" onclick="event.stopPropagation();toggleFavProduct(${p.id});this.classList.toggle('on');this.innerHTML=heartSVG(!${fav});">${heartSVG(fav)}</button>
    </div>
    ${dots}
    <div class="pinfo">
      <div class="price">${p.price} ₽ ${p.old_price?`<span style="text-decoration:line-through;font-size:12px;color:var(--hint);font-weight:400;">${p.old_price} ₽</span>`:''}</div>
      <div class="pname">${p.title}</div>
    </div>
  </div>`;
}
window.heartSVG = heartSVG;

// Photo slider dots updater (delegated)
document.addEventListener('scroll',e=>{
  const t=e.target;
  if(t.classList && t.classList.contains('ph-track')){
    const idx=Math.round(t.scrollLeft/t.clientWidth);
    const row=t.closest('.prod')?.querySelector('.ph-dotsrow');
    if(row)row.querySelectorAll('.pdot').forEach((d,i)=>d.classList.toggle('active',i===idx));
  }
},true);

// ==== LOAD HOME ====
async function loadHome(){
  const [cats, products] = await Promise.all([fetchData('categories'), fetchData('products?limit=200')]);
  // Chips
  const chiprow = document.getElementById('chiprow');
  chiprow.innerHTML = '<button class="chip active" data-cat="">Все</button>' + cats.map(c=>`<button class="chip" data-cat="${c.id}">${c.title}</button>`).join('');
  chiprow.querySelectorAll('.chip').forEach(ch=>{
    ch.onclick = ()=>{
      chiprow.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      ch.classList.add('active');
      const catId = ch.dataset.cat;
      filterHomeByCategory(catId);
    };
  });
  // Hot & Top
  const hot = products.filter(p=>p.is_hot).slice(0,6);
  const top = products.slice(0,6);
  const allIds = [...new Set([...hot,...top].map(p=>p.id))];
  let imgs = [];
  if(allIds.length) imgs = await fetchData(`product_images?product_id=in.(${allIds.join(',')})`);
  document.getElementById('hot-grid').innerHTML = hot.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('') || '<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">Пока нет товаров</p>';
  document.getElementById('top-grid').innerHTML = top.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('') || '<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">Пока нет товаров</p>';
}
window._allProducts = [];
async function filterHomeByCategory(catId){
  if(!catId){loadHome();return;}
  const subs = await fetchData(`subcategories?category_id=eq.${catId}`);
  const subIds = subs.map(s=>s.id);
  if(!subIds.length){
    document.getElementById('hot-grid').innerHTML='<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">В этой категории пока нет товаров</p>';
    document.getElementById('top-grid').innerHTML='';
    return;
  }
  const products = await fetchData(`products?subcategory_id=in.(${subIds.join(',')})&limit=50`);
  let imgs = [];
  if(products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p=>p.id).join(',')})`);
  document.getElementById('hot-grid').innerHTML = products.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('') || '<p style="color:var(--hint);font-size:13px;grid-column:1/-1;text-align:center;">Нет товаров</p>';
  document.getElementById('top-grid').innerHTML='';
}

// ==== CATALOG SCREEN ====
async function loadCatalogScreen(){
  const [cats, sups] = await Promise.all([fetchData('categories'), fetchData('suppliers')]);
  document.getElementById('catalog-cat-list').innerHTML = cats.map(c=>`
    <div class="list-row" onclick="openCategoryOverlay(${c.id}, '${c.title.replace(/'/g,"\\'")}')">
      <div class="avatar" style="background:var(--blue-light);color:var(--btn);">${c.image_url?`<img src="${c.image_url}">`:'📦'}</div>
      <div class="meta"><b>${c.title}</b><span>Раздел каталога</span></div>
      <span class="chev">›</span>
    </div>`).join('');
  document.getElementById('catalog-sup-list').innerHTML = sups.slice(0,10).map(s=>`
    <div class="list-row" onclick="openSupplierDetail(${s.id})">
      <div class="avatar">${s.logo_url?`<img src="${s.logo_url}">`:s.name.slice(0,2).toUpperCase()}</div>
      <div class="meta"><b>${s.name}</b><span>${s.description||''}</span></div>
      <span class="chev">›</span>
    </div>`).join('') + `<div class="list-row" onclick="openSuppliersScreen()" style="justify-content:center;"><b style="color:var(--btn);">Все поставщики →</b></div>`;
}

// ==== CATEGORY OVERLAY (subcategories) ====
window.openCategoryOverlay = async (catId, title)=>{
  const nested = document.getElementById('nested-screen');
  document.getElementById('nested-title').textContent = title;
  document.getElementById('nested-content').innerHTML = '<p style="text-align:center;margin-top:50px;color:var(--hint);">Загрузка...</p>';
  nested.classList.add('show');
  const subs = await fetchData(`subcategories?category_id=eq.${catId}`);
  const filtered = subs.filter(s=>(s.title||'').toLowerCase()!=='все товары');
  document.getElementById('nested-content').innerHTML = `
    <div class="card" style="padding:4px 16px;">
      <div class="list-row" onclick="openAllProductsInCategory(${catId})">
        <div class="avatar">📦</div><div class="meta"><b>Все товары</b></div><span class="chev">›</span>
      </div>
      ${filtered.map(s=>`<div class="list-row" onclick="openProductsInSub(${s.id})">
        <div class="avatar">${s.image_url?`<img src="${s.image_url}">`:'📁'}</div>
        <div class="meta"><b>${s.title}</b></div><span class="chev">›</span>
      </div>`).join('')}
    </div>`;
};
document.getElementById('back-btn').onclick = ()=>document.getElementById('nested-screen').classList.remove('show');

window.openAllProductsInCategory = async (catId)=>{
  const subs = await fetchData(`subcategories?category_id=eq.${catId}`);
  const subIds = subs.map(s=>s.id);
  if(!subIds.length){alert('Товаров нет');return;}
  const products = await fetchData(`products?subcategory_id=in.(${subIds.join(',')})`);
  let imgs=[];
  if(products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p=>p.id).join(',')})`);
  document.getElementById('nested-title').textContent = 'Все товары';
  document.getElementById('nested-content').innerHTML = `<div class="grid2">${products.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('')}</div>`;
};
window.openProductsInSub = async (subId)=>{
  const products = await fetchData(`products?subcategory_id=eq.${subId}`);
  let imgs=[];
  if(products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p=>p.id).join(',')})`);
  document.getElementById('nested-title').textContent = 'Товары';
  document.getElementById('nested-content').innerHTML = `<div class="grid2">${products.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('')}</div>`;
};

// ==== PRODUCT DETAIL ====
window.openProductDetail = async (productId)=>{
  const overlay = document.getElementById('screen-product-detail');
  overlay.classList.add('show');
  const content = document.getElementById('detail-content');
  content.innerHTML = '<p style="text-align:center;margin-top:60px;color:var(--hint);">Загрузка...</p>';
  const pArr = await fetchData(`products?id=eq.${productId}`);
  if(!pArr.length){content.innerHTML='<p style="text-align:center;margin-top:60px;">Товар не найден</p>';return;}
  const p = pArr[0];
  const images = await fetchData(`product_images?product_id=eq.${productId}`);
  const imgs = images.length ? images : [{image_url:p.image_url||'https://via.placeholder.com/300'}];
  const slides = imgs.map(im=>`<div class="ph-slide"><img src="${im.image_url||im}" alt=""></div>`).join('');
  const dots = imgs.length>1 ? `<div class="pd-dots" id="pd-dots">${imgs.map((_,i)=>`<span class="pdot${i===0?' active':''}"></span>`).join('')}</div>` : '';
  let supplierBlock = '';
  if(p.supplier_id){
    const supArr = await fetchData(`suppliers?id=eq.${p.supplier_id}`);
    if(supArr.length){
      const s = supArr[0];
      window.currentSupplierData = s;
      supplierBlock = `
        <div class="pd-supplier">
          <div class="avatar">${s.logo_url?`<img src="${s.logo_url}">`:s.name.slice(0,2)}</div>
          <div style="flex:1;"><b style="font-size:15px;">${s.name}</b><div style="font-size:12px;color:var(--hint);">${s.description||'Прямой поставщик'}</div></div>
        </div>
        <div class="pd-actions">
          <button onclick="showSupplierContacts()">💬 Контакты</button>
          <button onclick="openSupplierDetail(${s.id})">🏬 Ассортимент</button>
        </div>`;
    }
  }
  const isFav = isFavProduct(p.id);
  const heartBtn = document.getElementById('pd-heart');
  heartBtn.classList.toggle('on', isFav);
  heartBtn.innerHTML = heartSVG(isFav);
  heartBtn.onclick = ()=>{toggleFavProduct(p.id);heartBtn.classList.toggle('on');heartBtn.innerHTML=heartSVG(isFavProduct(p.id));};
  content.innerHTML = `
    <div class="pd-photo"><div class="ph-track" id="pd-track">${slides}</div></div>
    ${dots}
    <div class="pd-price-row">
      <span class="pd-price">${p.price} ₽</span>
      ${p.old_price?`<span class="pd-old">${p.old_price} ₽</span>`:''}
    </div>
    <div class="pd-name">${p.title}</div>
    ${supplierBlock}
    <div class="card" style="margin-top:14px;">
      <h3 style="font-size:15px;margin-bottom:6px;">Описание</h3>
      <p style="font-size:14px;color:var(--hint);line-height:1.5;white-space:pre-line;">${p.description||'Описание отсутствует'}</p>
    </div>
    <div class="notice" style="margin-top:14px;">🛡️ Заказ, оплата и доставка — напрямую у поставщика. Мы не принимаем оплату и не участвуем в сделке.</div>
  `;
  const track = document.getElementById('pd-track');
  track.addEventListener('scroll',()=>{
    const idx = Math.round(track.scrollLeft/track.clientWidth);
    document.querySelectorAll('#pd-dots .pdot').forEach((d,i)=>d.classList.toggle('active',i===idx));
  });
};
document.getElementById('detail-back-btn').onclick = ()=>document.getElementById('screen-product-detail').classList.remove('show');

// ==== SEARCH ====
const searchInput = document.getElementById('search-input');
let searchTimer;
searchInput.addEventListener('input', ()=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 350);
});
async function runSearch(){
  const q = searchInput.value.trim();
  const block = document.getElementById('search-block');
  const home = document.getElementById('home-block');
  if(!q){block.style.display='none';home.style.display='block';return;}
  block.style.display='block';home.style.display='none';
  const res = await fetchData(`products?title=ilike.*${encodeURIComponent(q)}*&limit=30`);
  const empty = document.getElementById('search-empty');
  if(!res.length){
    document.getElementById('search-results').innerHTML='';
    empty.style.display='flex';
    return;
  }
  empty.style.display='none';
  const imgs = await fetchData(`product_images?product_id=in.(${res.map(p=>p.id).join(',')})`);
  document.getElementById('search-results').innerHTML = res.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('');
}

// ==== SORT SHEET ====
function openSortSheet(){document.getElementById('sort-modal').classList.remove('hidden');}
window.openSortSheet = openSortSheet;
document.getElementById('sort-modal-backdrop').onclick = ()=>document.getElementById('sort-modal').classList.add('hidden');
window.pickSortOption = (val)=>{
  document.querySelectorAll('.sort-option').forEach(o=>{
    o.classList.toggle('active', o.dataset.value===val);
    o.querySelector('.radio-btn').classList.toggle('selected', o.dataset.value===val);
  });
  setTimeout(()=>document.getElementById('sort-modal').classList.add('hidden'),200);
};

// ==== FAVORITES SCREEN ====
function segSwitch(which){
  document.getElementById('seg-goods').classList.toggle('active',which==='goods');
  document.getElementById('seg-sup').classList.toggle('active',which==='sup');
  document.getElementById('fav-body').children[0].style.display = which==='goods'?'':'none';
  document.getElementById('fav-suppliers').style.display = which==='sup'?'':'none';
}
window.segSwitch = segSwitch;

async function renderFavorites(){
  const goodsWrap = document.getElementById('fav-goods');
  const emptyGoods = document.getElementById('fav-goods-empty');
  if(!favProducts.length){
    goodsWrap.innerHTML='';
    emptyGoods.style.display='flex';
  } else {
    emptyGoods.style.display='none';
    const products = await fetchData(`products?id=in.(${favProducts.join(',')})`);
    const imgs = products.length ? await fetchData(`product_images?product_id=in.(${products.map(p=>p.id).join(',')})`) : [];
    goodsWrap.innerHTML = products.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('');
  }
  const supWrap = document.getElementById('fav-suppliers-list');
  const emptySup = document.getElementById('fav-sup-empty');
  if(!favSuppliers.length){
    supWrap.innerHTML='';
    emptySup.style.display='flex';
  } else {
    emptySup.style.display='none';
    const sups = await fetchData(`suppliers?id=in.(${favSuppliers.join(',')})`);
    supWrap.innerHTML = sups.map(s=>`
      <div class="list-row" onclick="openSupplierDetail(${s.id})">
        <div class="avatar">${s.logo_url?`<img src="${s.logo_url}">`:s.name.slice(0,2)}</div>
        <div class="meta"><b>${s.name}</b><span>${s.description||''}</span></div>
        <button class="heart-ic" style="color:#ff4d67;" onclick="event.stopPropagation();toggleFavSupplier(${s.id});">${heartSVG(true)}</button>
      </div>`).join('');
  }
}

// ==== PROFILE ====
function loadProfile(){
  document.getElementById('user-name').textContent = [tgUser?.first_name,tgUser?.last_name].filter(Boolean).join(' ')||'Пользователь';
  document.getElementById('user-username').textContent = tgUser?.username?'@'+tgUser.username:'Нет username';
  if(tgUser?.photo_url) document.getElementById('user-avatar').src = tgUser.photo_url;
}

// ==== SUPPLIERS LIST & DETAIL ====
window.openSuppliersScreen = async ()=>{
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-suppliers').classList.add('active');
  const sups = await fetchData('suppliers');
  renderSuppliersList(sups);
};
function renderSuppliersList(sups){
  const wrap = document.getElementById('suppliers-list-container');
  if(!sups.length){wrap.innerHTML='<p style="text-align:center;color:var(--hint);margin-top:30px;">Поставщики не найдены</p>';return;}
  wrap.innerHTML = `<div class="card" style="padding:4px 16px;">${sups.map(s=>`
    <div class="list-row" onclick="openSupplierDetail(${s.id})">
      <div class="avatar">${s.logo_url?`<img src="${s.logo_url}">`:s.name.slice(0,2)}</div>
      <div class="meta"><b>${s.name}</b><span>${s.description||''}</span></div>
      <span class="chev">›</span>
    </div>`).join('')}</div>`;
}
document.getElementById('suppliers-back-btn').onclick = ()=>goTab('catalog');

window.openSupplierDetail = async (supplierId)=>{
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-supplier-detail').classList.add('active');
  const wrap = document.getElementById('supplier-detail-content');
  wrap.innerHTML = '<p style="text-align:center;margin-top:50px;color:var(--hint);">Загрузка...</p>';
  const arr = await fetchData(`suppliers?id=eq.${supplierId}`);
  if(!arr.length)return;
  const s = arr[0];
  window.currentSupplierData = s;
  const products = await fetchData(`products?supplier_id=eq.${supplierId}&limit=30`);
  let imgs=[];
  if(products.length) imgs = await fetchData(`product_images?product_id=in.(${products.map(p=>p.id).join(',')})`);
  const isFav = isFavSupplier(s.id);
  wrap.innerHTML = `
    <div class="pd-supplier">
      <div class="avatar" style="width:56px;height:56px;">${s.logo_url?`<img src="${s.logo_url}">`:s.name.slice(0,2)}</div>
      <div style="flex:1;"><b style="font-size:16px;">${s.name}</b><div style="font-size:13px;color:var(--hint);">${s.description||''}</div></div>
      <button class="heart-ic ${isFav?'on':''}" style="color:${isFav?'#ff4d67':'var(--hint)'};" onclick="event.stopPropagation();toggleFavSupplier(${s.id});this.style.color=isFavSupplier(${s.id})?'#ff4d67':'var(--hint)';this.innerHTML=heartSVG(isFavSupplier(${s.id}));">${heartSVG(isFav)}</button>
    </div>
    <div class="pd-actions" style="margin-bottom:16px;">
      <button onclick="showSupplierContacts()">💬 Контакты</button>
      <button onclick="alert('Скоро: ассортимент поставщика')">🏬 Ассортимент</button>
    </div>
    ${products.length ? `<div class="sec-title" style="margin-bottom:10px;">Товары поставщика</div><div class="grid2">${products.map(p=>renderProductCard(p,imgs.filter(i=>i.product_id===p.id))).join('')}</div>` : '<p style="text-align:center;color:var(--hint);margin-top:30px;">Товаров пока нет</p>'}
  `;
};
document.getElementById('supplier-detail-back-btn').onclick = ()=>{document.getElementById('screen-supplier-detail').classList.remove('active');document.getElementById('screen-suppliers').classList.add('active');};

// ==== CONTACTS MODAL ====
window.showSupplierContacts = ()=>{
  const s = window.currentSupplierData;
  if(!s)return;
  const contacts = Array.isArray(s.contacts)?s.contacts:[];
  let html = `<p style="color:var(--hint);font-size:13px;margin:0 0 14px 0;">${s.name}</p>`;
  if(!contacts.length) html+='<p style="text-align:center;color:var(--hint);margin:20px 0;">У поставщика пока нет контактов.</p>';
  else contacts.forEach(c=>{
    let icon='🔗', label=c.type;
    if(c.type==='telegram'){icon='✈️';label='Telegram';}
    else if(c.type==='whatsapp'){icon='💬';label='WhatsApp';}
    else if(c.type==='phone'){icon='📞';label='Телефон';}
    else if(c.type==='vk'){icon='📘';label='VK';}
    else if(c.type==='website'){icon='🌐';label='Сайт';}
    let link=c.value.startsWith('http')?c.value:'https://'+c.value;
    html+=`<div style="background:var(--secbg);padding:14px;border-radius:12px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
      <div style="font-size:22px;">${icon}</div>
      <div style="flex:1;min-width:0;"><b style="font-size:14px;">${label}</b><div><a href="${link}" target="_blank" style="color:var(--btn);text-decoration:underline;font-size:13px;word-break:break-all;">${c.value}</a></div></div>
    </div>`;
  });
  document.getElementById('supplier-contacts-list').innerHTML = html;
  document.getElementById('supplier-contacts-modal').classList.remove('hidden');
};
document.getElementById('close-contacts-btn').onclick = ()=>document.getElementById('supplier-contacts-modal').classList.add('hidden');

// ==== ADMIN PANEL ====
const adminPanelBtn = document.getElementById('admin-panel-btn');
adminPanelBtn.onclick = ()=>{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('screen-admin').classList.add('active');};
document.getElementById('admin-back-btn').onclick = ()=>goTab('profile');

// Product add
document.getElementById('btn-add-product').onclick = async ()=>{
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-admin-product').classList.add('active');
  const categories = await fetchData('categories');
  const catSelect = document.getElementById('product-category');
  catSelect.innerHTML = categories.map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
  loadSubsAndSuppliers();
};
let selectedFiles = [];
document.getElementById('product-images').addEventListener('change',(e)=>{
  selectedFiles = Array.from(e.target.files);
  renderImagePreviews();
});
function renderImagePreviews(){
  const pc = document.getElementById('image-preview-container');
