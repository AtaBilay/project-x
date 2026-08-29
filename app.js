const TG = window.Telegram?.WebApp;
TG?.ready(); TG?.expand();

const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";

const tgUser = TG?.initDataUnsafe?.user;
let currentUserId = tgUser?.id || null;

// ... (остальной код выше) ...

// ================== КАТЕГОРИИ ==================
const nestedScreen = document.getElementById('nested-screen');
const nestedTitle = document.getElementById('nested-title');
const nestedContent = document.getElementById('nested-content');

async function loadCategories() {
  const categories = await fetchData('categories');
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';

  // Добавляем виртуальную карточку "Поставщики", если её нет в базе
  const hasSuppliersCat = categories.some(cat => cat.title.toLowerCase() === 'поставщики');
  if (!hasSuppliersCat) {
    const virtualCard = document.createElement('div');
    virtualCard.className = 'cat-card';
    virtualCard.innerHTML = `<img src="https://via.placeholder.com/150/FFD700/000000?text=Suppliers"><div>Поставщики</div>`;
    virtualCard.onclick = () => openSuppliersScreen();
    grid.appendChild(virtualCard);
  }

  // Рендерим категории и вешаем клики
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
// ... (остальной код) ...

// ================== СТАРТ ==================
loadCategories();
loadHomeSections();
renderFavorites();
