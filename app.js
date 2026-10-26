const SUPABASE_URL = "https://chvwhwxqpeacuiyccexw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMKtRMhQPVglw2Hhg0RImQ_FRFByVIr";
const BOT_USERNAME = "prosto_vigodno_bot"; 
let allData = { bloggers: [], links: [], events: [], payments: [] };
let currentPeriod = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  await loadAllData();
});

async function fetchFromDB(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  return await res.json();
}

async function loadAllData() {
  allData.bloggers = await fetchFromDB('bloggers');
  allData.links = await fetchFromDB('ref_links');
  allData.events = await fetchFromDB('ref_events');
  allData.payments = await fetchFromDB('ref_payments');
  renderDashboard();
  renderBloggers();
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.content').forEach(c => c.style.display = 'none');
  if (tab === 'dashboard') {
    document.querySelectorAll('.tab')[0].classList.add('active');
    document.getElementById('tab-dashboard').style.display = 'block';
  } else {
    document.querySelectorAll('.tab')[1].classList.add('active');
    document.getElementById('tab-bloggers').style.display = 'block';
  }
}

function setPeriod(period, btn) {
  currentPeriod = period;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDashboard();
}

function isInPeriod(dateStr) {
  if (currentPeriod === 'all') return true;
  const date = new Date(dateStr); const now = new Date();
  if (currentPeriod === 'today') return date.toDateString() === now.toDateString();
  const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
  if (currentPeriod === 'week') return diffDays <= 7;
  if (currentPeriod === 'month') return diffDays <= 30;
  return true;
}

function renderDashboard() {
  let totalStarts = 0, totalPayments = 0, totalIncome = 0;
  const bloggerStats = {}; 
  
  // Уникальные старты
  const uniqueStarts = {};
  allData.events.filter(e => e.event === 'bot_start' && isInPeriod(e.created_at)).forEach(e => {
    if (!uniqueStarts[e.tg_id]) {
      uniqueStarts[e.tg_id] = true;
      totalStarts++;
      if (e.blogger_id) {
        if (!bloggerStats[e.blogger_id]) bloggerStats[e.blogger_id] = { starts: 0, payments: 0, income: 0 };
        bloggerStats[e.blogger_id].starts++;
      }
    }
  });

  allData.payments.filter(p => p.status === 'success' && isInPeriod(p.paid_at)).forEach(p => {
    totalPayments++; totalIncome += p.amount;
    if (p.blogger_id) {
      if (!bloggerStats[p.blogger_id]) bloggerStats[p.blogger_id] = { starts: 0, payments: 0, income: 0 };
      bloggerStats[p.blogger_id].payments++; bloggerStats[p.blogger_id].income += p.amount;
    }
  });

  document.getElementById('kpi-starts').textContent = totalStarts;
  document.getElementById('kpi-payments').textContent = totalPayments;
  document.getElementById('kpi-income').textContent = totalIncome.toLocaleString('ru-RU') + ' ₽';
  let conversion = totalStarts > 0 ? Math.round((totalPayments / totalStarts) * 100) : 0;
  document.getElementById('kpi-conversion').textContent = conversion + '%';

  const tbody = document.getElementById('funnel-table-body'); tbody.innerHTML = '';
  if (Object.keys(bloggerStats).length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--hint); padding:20px;">Нет данных</td></tr>'; return;
  }
  const sorted = Object.entries(bloggerStats).sort((a, b) => b[1].income - a[1].income);
  for (const [id, stats] of sorted) {
    const blogger = allData.bloggers.find(b => b.id == id);
    const name = blogger ? blogger.name : 'Органика / Удален';
    const conv = stats.starts > 0 ? Math.round((stats.payments / stats.starts) * 100) : 0;
    tbody.innerHTML += `<tr><td><b>${name}</b></td><td><span class="badge">${stats.starts}</span></td><td><span class="badge green">${stats.payments}</span> (${conv}%)</td><td class="text-green">${stats.income} ₽</td></tr>`;
  }
}

function renderBloggers() {
  const list = document.getElementById('bloggers-list'); list.innerHTML = '';
  if (allData.bloggers.length === 0) { list.innerHTML = '<p style="text-align:center; color:var(--hint);">Пока нет блогеров</p>'; return; }
  allData.bloggers.forEach(b => {
    const links = allData.links.filter(l => l.blogger_id === b.id);
    let linksHtml = '';
    links.forEach(l => {
      linksHtml += `<div class="link-row"><span>...?start=<span class="link-code">${l.code}</span></span><button class="copy-btn" onclick="copyLink('${l.code}')">Копировать</button></div>`;
    });
    list.innerHTML += `<div class="blogger-card"><div class="blogger-name">${b.name}</div><div class="blogger-contact">${b.contact || 'Нет контакта'}</div><div>${linksHtml || 'Нет ссылок'}</div></div>`;
  });
}

function openAddModal() { document.getElementById('add-modal').classList.add('show'); }
function closeAddModal() { document.getElementById('add-modal').classList.remove('show'); }

async function saveBlogger() {
  const name = document.getElementById('new-name').value.trim();
  const contact = document.getElementById('new-contact').value.trim();
  const platform = document.getElementById('new-platform').value.trim() || 'telegram';
  if (!name) { alert('Введите имя'); return; }
  
  const resBlogger = await fetch(`${SUPABASE_URL}/rest/v1/bloggers`, {
    method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({ name, contact })
  });
  if (!resBlogger.ok) { alert('Ошибка создания'); return; }
  const newBlogger = (await resBlogger.json())[0];
  const code = 'b_' + Math.random().toString(36).substring(2, 7);
  
  await fetch(`${SUPABASE_URL}/rest/v1/ref_links`, {
    method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, blogger_id: newBlogger.id, platform })
  });
  closeAddModal(); await loadAllData();
}

function copyLink(code) {
  const fullUrl = `https://t.me/${BOT_USERNAME}?start=${code}`;
  navigator.clipboard.writeText(fullUrl).then(() => alert('Ссылка скопирована!'));
}

function exportCSV() {
  let csv = 'Блогер;Старты;Оплаты;Конверсия;Доход\n';
  const stats = {};
  allData.events.filter(e => e.event === 'bot_start' && isInPeriod(e.created_at)).forEach(e => {
    if (e.blogger_id) { if(!stats[e.blogger_id]) stats[e.blogger_id]={s:0,p:0,i:0}; stats[e.blogger_id].s++; }
  });
  allData.payments.filter(p => p.status === 'success' && isInPeriod(p.paid_at)).forEach(p => {
    if (p.blogger_id) { if(!stats[p.blogger_id]) stats[p.blogger_id]={s:0,p:0,i:0}; stats[p.blogger_id].p++; stats[p.blogger_id].i+=p.amount; }
  });
  for (const [id, s] of Object.entries(stats)) {
    const b = allData.bloggers.find(x => x.id == id);
    const conv = s.s > 0 ? Math.round((s.p / s.s) * 100) : 0;
    csv += `"${b?b.name:'Органика'}";${s.s};${s.p};${conv}%;${s.i}\n`;
  }
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `analytics_${currentPeriod}.csv`; link.click();
}
