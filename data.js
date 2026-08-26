export const categories = [
  { id: 'suppliers', title: 'Поставщики', color: 'yellow', icon: '📦' },
  { id: 'promo', title: 'Акции', color: 'green', icon: '🛒' },
  { id: 'women', title: 'Женщинам', color: 'blue', icon: '👗' },
  { id: 'men', title: 'Мужчинам', color: 'red', icon: '👕' },
  { id: 'kids', title: 'Одежда для детей', color: 'blue', icon: '🧸' },
  { id: 'shoes', title: 'Обувь', color: 'green', icon: '👟' }
];

export const suppliers = [
  { id: 1, name: 'К Б 2А-34 Женская одежда ISMAT', desc: 'Прямой поставщик ТК Садовод', logo: 'https://via.placeholder.com/100' },
  { id: 2, name: 'MAZARINI К/Б', desc: 'Магазин одежды', logo: 'https://via.placeholder.com/100' },
  { id: 3, name: 'MARELLA КБ 2Г-11', desc: 'САДОВОД', logo: 'https://via.placeholder.com/100' }
];

export const products = [
  { id: 1, title: 'Рубашка', price: 1700, oldPrice: null, category: 'women', hot: false, image: 'https://via.placeholder.com/300' },
  { id: 2, title: 'Блузка', price: 500, oldPrice: null, category: 'women', hot: false, image: 'https://via.placeholder.com/300' },
  { id: 3, title: 'Мужской костюм двойка', price: 999, oldPrice: 1500, category: 'promo', hot: true, image: 'https://via.placeholder.com/300' },
  { id: 4, title: 'Костюм Зв-1', price: 799, oldPrice: 2000, category: 'promo', hot: true, image: 'https://via.placeholder.com/300' }
];

export const faq = [
  { q: 'Как оформить заказ?', a: 'Откройте пост поставщика. Перейдите по ссылке. Свяжитесь с поставщиком напрямую. Согласуйте заказ, доставку и оплату.' },
  { q: 'Подписка оплачивается один раз или каждый месяц?', a: 'Подписка в BAZA является ежемесячной.' }
];