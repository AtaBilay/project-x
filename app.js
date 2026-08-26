import { categories, hotDeals, topProducts, suppliers, subCategories, blouses, promoProducts, faqData } from './data.js';

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// ================== ЛОГИКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ==================
const tgUser = tg?.initDataUnsafe?.user;

if (tgUser) {
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
  document.getElementById('user-name').textContent = fullName || 'Пользователь';

  const tgUsername = tgUser.username;
  document.getElementById('user-username').textContent = tgUsername ? '@' + tgUsername : 'Без username';

  if (tgUser.photo_url) {
    document.getElementById('user-avatar').src = tgUser.photo_url;
  } else {
    const firstLetter = fullName ? fullName[0].toUpperCase() : 'U';
    document.getElementById('user-avatar').src = `https://via.placeholder.com/60/007AFF/FFFFFF?text=${firstLetter}`;
  }
} else {
  document.getElementById('user-name').textContent = 'Откройте в Telegram';
  document.getElementById('user-username').textContent = '@not_telegram';
  document.getElementById('user-avatar').src = 'https://via.placeholder.com/60/FF0000/FFFFFF?text=?';
}
// ================================================================

// ================== ПОДКЛЮЧЕНИЕ КУРСА ВАЛЮТ (БАНК) ==================
async function fetchCurrencyRate() {
  const rateElement = document.getElementById('kzt-rate');
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/RUB');
    const data = await response.json();
    
    if (data && data.rates && data.rates.KZT) {
      const rate = data.rates.KZT.toFixed(2);
      rateElement.textContent = rate;
    } else {
      throw new Error('Rate not found');
    }
  } catch (e) {
    console.log('Ошибка получения курса, использую резервный 5,94');
    rateElement.textContent = '5,94';
  }
}
fetchCurrencyRate();
// ======================================================================

// Переключение вкладок
const tabs = document.querySelectorAll('.tab-item');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById('screen-' + tab.dataset.tab).classList.add('active');
  });
});

// ================== ПЕРЕХОД В НАСТРОЙКИ ==================
const openSettingsBtn = document.getElementById('open-settings-btn');
const settingsBackBtn = document.getElementById('settings-back-btn');

// Открыть настройки
openSettingsBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-settings').classList.add('active');
});

// Вернуться в профиль
settingsBackBtn.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-profile').classList.add('active');
});
// ==============================================================

// Рендер категорий на главной
const categoryGrid = document.getElementById('category-grid');
categories.forEach(cat => {
  const card = document.createElement('div');
  card.className = 'cat-card';
  card.innerHTML = `<img src="${cat.image}" alt="${cat.title}"><div>${cat.title}</div>`;
  card.addEventListener('click', () => openCategory(cat));
  categoryGrid.appendChild(card);
});

// Рендер горячих предложений
const hotScroll = document.getElementById('hot-scroll');
hotDeals.forEach(p => {
  hotScroll.innerHTML += `
    <div class="product-mini">
      <div style="position:relative;">
        ${p.hot ? '<span class="hot-badge">🔥 Hot</span>' : ''}
        <img src="${p.image}">
      </div>
      <h4>${p.name}</h4>
      <p class="price">${p.price} ₽</p>
    </div>
  `;
});

// Рендер топ товаров
const topScroll = document.getElementById('top-scroll');
topProducts.forEach(p => {
  topScroll.innerHTML += `
    <div class="product-mini">
      <div style="position:relative;">
        <img src="${p.image}">
      </div>
      <h4>${p.name}</h4>
      <p class="price">${p.price} ₽</p>
    </div>
  `;
});

// Рендер поставщиков недели
const supplierList = document.getElementById('supplier-list');
suppliers.forEach(s => {
  supplierList.innerHTML += `
    <div class="supplier-item">
      <img src="${s.logo}">
      <div>
        <h4>${s.name}</h4>
        <p>${s.desc}</p>
      </div>
    </div>
  `;
});

// Рендер FAQ (аккордеон)
const faqAccordion = document.getElementById('faq-accordion');
faqData.forEach(item => {
  faqAccordion.innerHTML += `
    <details>
      <summary>${item.q}</summary>
      <p>${item.a}</p>
    </details>
  `;
});

// Логика вложенных экранов
const nestedScreen = document.getElementById('nested-screen');
const nestedTitle = document.getElementById('nested-title');
const nestedContent = document.getElementById('nested-content');

function openCategory(cat) {
  nestedTitle.textContent = cat.title;
  nestedScreen.classList.remove('hidden');
  
  if (cat.id === 'suppliers') {
    nestedContent.innerHTML = suppliers.map(s => `
      <div class="list-item">
        <img src="${s.logo}">
        <div><h4>${s.name}</h4><p style="color:#888; margin:5px 0 0;">${s.desc}</p></div>
      </div>
    `).join('');
  } else if (cat.id === 'women') {
    nestedContent.innerHTML = subCategories.map(sub => `
      <div class="list-item" onclick="openSubCategory('${sub.id}')">
        <div style="background:#eee; width:60px; height:60px; border-radius:10px; display:flex; justify-content:center; align-items:center; font-size:30px; margin-right:15px;">${sub.icon}</div>
        <h4>${sub.title}</h4>
      </div>
    `).join('');
  } else if (cat.id === 'promo') {
    nestedContent.innerHTML = `<div class="product-grid">
      ${promoProducts.map(p => `
        <div class="product-card">
          <div style="position:relative;">
            ${p.hot ? '<span class="hot-badge">🔥 Hot</span>' : ''}
            ${p.discount ? `<span class="discount" style="top: auto; bottom: 10px; left: 10px;">${p.discount}</span>` : ''}
            <img src="${p.image}" style="width:100%; height:180px; object-fit:cover;">
          </div>
          <p class="price">${p.price} ₽ ${p.oldPrice ? `<span class="old-price">${p.oldPrice} ₽</span>` : ''}</p>
          <h4>${p.name}</h4>
        </div>
      `).join('')}
    </div>`;
  } else {
    nestedContent.innerHTML = `<div class="product-grid">
      ${blouses.map(p => `
        <div class="product-card">
          <img src="${p.image}" style="width:100%; height:180px; object-fit:cover;">
          <p class="price">${p.price} ₽</p>
          <h4>${p.name}</h4>
        </div>
      `).join('')}
    </div>`;
  }
}

// Кнопка "Назад" на вложенных экранах
document.getElementById('back-btn').addEventListener('click', () => {
  nestedScreen.classList.add('hidden');
});

// Функция для перехода в подкатегории
window.openSubCategory = (id) => {
  nestedTitle.textContent = 'Товары';
  nestedContent.innerHTML = `<div class="product-grid">
    ${blouses.map(p => `
      <div class="product-card">
        <img src="${p.image}">
        <p class="price">${p.price} ₽</p>
        <h4>${p.name}</h4>
      </div>
    `).join('')}
  </div>`;
};
