import { categories, products, suppliers } from './data.js';

// Инициализация Telegram
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// Переключение вкладок
const tabs = document.querySelectorAll('.tab-item');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Убираем активный класс со всех
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Добавляем активный
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Отрисовка сетки категорий на главной
const catContainer = document.getElementById('home-categories');
categories.forEach(cat => {
  const card = document.createElement('div');
  card.className = 'cat-card';
  card.innerHTML = `
    <div style="height: 80px; background: ${cat.color}; display: flex; justify-content: center; align-items: center; font-size: 40px;">${cat.icon}</div>
    <div style="padding: 10px; font-weight: bold;">${cat.title}</div>
  `;
  card.addEventListener('click', () => openCategory(cat));
  catContainer.appendChild(card);
});

// Функция открытия категории (вложенная навигация)
function openCategory(cat) {
  const nested = document.getElementById('nested-screen');
  const title = document.getElementById('nested-title');
  const content = document.getElementById('nested-content');
  
  title.textContent = cat.title;
  nested.classList.remove('hidden');
  
  if (cat.id === 'suppliers') {
    // Рендерим поставщиков
    content.innerHTML = suppliers.map(s => `
      <div style="display:flex; align-items:center; background:white; padding:15px; margin:10px; border-radius:12px;">
        <img src="${s.logo}" style="width:50px; height:50px; border-radius:8px; margin-right:15px;">
        <div>
          <h4 style="margin:0;">${s.name}</h4>
          <p style="margin:0; color:grey; font-size:14px;">${s.desc}</p>
        </div>
      </div>
    `).join('');
  } else {
    // Рендерим товары
    const filteredProducts = products.filter(p => p.category === cat.id);
    content.innerHTML = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; padding:10px;">
      ${filteredProducts.map(p => `
        <div style="background:white; border-radius:12px; overflow:hidden;">
          <img src="${p.image}" style="width:100%; height:150px; object-fit:cover;">
          <div style="padding:10px;">
            <b>${p.price} ₽</b>
            <p style="margin:0; font-size:14px;">${p.title}</p>
          </div>
        </div>
      `).join('')}
    </div>`;
  }
}

// Кнопка назад
function goBack() {
  document.getElementById('nested-screen').classList.add('hidden');
}
