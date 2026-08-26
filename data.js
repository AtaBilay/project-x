export const categories = [
  { id: 'suppliers', title: 'Поставщики', image: 'https://via.placeholder.com/150/FFD700/000000?text=Box', bg: '#FFF3CD' },
  { id: 'promo', title: 'Акции', image: 'https://via.placeholder.com/150/90EE90/000000?text=Cart', bg: '#DFF5E1' },
  { id: 'women', title: 'Женщинам', image: 'https://via.placeholder.com/150/87CEFA/000000?text=Dress', bg: '#DBEDFF' },
  { id: 'men', title: 'Мужчинам', image: 'https://via.placeholder.com/150/FFB6C1/000000?text=Shirt', bg: '#FFE4E1' },
  { id: 'kids', title: 'Одежда для детей', image: 'https://via.placeholder.com/150/ADD8E6/000000?text=Kids', bg: '#E0F7FA' },
  { id: 'shoes', title: 'Обувь', image: 'https://via.placeholder.com/150/98FB98/000000?text=Shoes', bg: '#E8F5E9' }
];

export const hotDeals = [
  { id: 101, name: 'Штаны', price: 199, image: 'https://via.placeholder.com/200', hot: true },
  { id: 102, name: 'Брючный костюм', price: 700, image: 'https://via.placeholder.com/200', hot: true },
  { id: 103, name: 'Юбка', price: 450, image: 'https://via.placeholder.com/200', hot: true }
];

export const topProducts = [
  { id: 201, name: 'Кружевная блузка', price: 500, image: 'https://via.placeholder.com/200', hot: false },
  { id: 202, name: 'Куртка джинсовая', price: 1200, image: 'https://via.placeholder.com/200', hot: false },
  { id: 203, name: 'Брюки', price: 800, image: 'https://via.placeholder.com/200', hot: false }
];

export const suppliers = [
  { id: 1, name: 'К Б 2А-34 ISMAT', desc: 'Прямой поставщик ТК Садовод', logo: 'https://via.placeholder.com/50' },
  { id: 2, name: 'MAZARINI К/Б', desc: 'Магазин одежды', logo: 'https://via.placeholder.com/50' },
  { id: 3, name: 'MARELLA КБ 2Г-11', desc: 'САДОВОД', logo: 'https://via.placeholder.com/50' }
];

export const subCategories = [
  { id: 'all', title: 'Все товары', icon: '📦' },
  { id: 'blouses', title: 'Блузки и рубашки', icon: '👚' },
  { id: 'big', title: 'Большие размеры', icon: '👗' },
  { id: 'underwear', title: 'Нижнее белье', icon: '🩲' },
  { id: 'dresses', title: 'Платья', icon: '👗' },
  { id: 'pajamas', title: 'Пижамы и сорочки', icon: '🛌' }
];

export const blouses = [
  { id: 301, name: 'Рубашка', price: 1700, image: 'https://via.placeholder.com/200' },
  { id: 302, name: 'Блузка', price: 500, image: 'https://via.placeholder.com/200' },
  { id: 303, name: 'Голубая блуза', price: 250, image: 'https://via.placeholder.com/200', hot: true },
  { id: 304, name: 'Рубашка с акцентом', price: 700, image: 'https://via.placeholder.com/200' }
];

export const promoProducts = [
  { id: 401, name: 'Мужской костюм двойка', price: 999, oldPrice: 1500, image: 'https://via.placeholder.com/200', hot: true, discount: '-33%' },
  { id: 402, name: 'Костюм 3в-1', price: 799, oldPrice: 2000, image: 'https://via.placeholder.com/200', hot: true, discount: '-60%' },
  { id: 403, name: 'Привлекательная кофта', price: 800, image: 'https://via.placeholder.com/200', hot: true, discount: '-20%' },
  { id: 404, name: 'Костюм-двойка', price: 300, image: 'https://via.placeholder.com/200', hot: true, discount: '-50%' }
];

// Полный список вопросов из твоих скриншотов
export const faqData = [
  { q: 'Как оформить заказ?', a: 'BAZA — это каталог поставщиков, а не интернет-магазин. Откройте пост поставщика. Перейдите по ссылке в посте. Изучите ассортимент и условия. Свяжитесь с поставщиком напрямую. Согласуйте заказ, доставку и оплату. Все заказы оформляются напрямую у поставщиков.' },
  { q: 'В MAX у некоторых поставщиков указана ссылка на Telegram. Как сделать заказ?', a: 'Некоторые поставщики пока принимают заказы через Telegram. Если у вас нет возможности открыть Telegram, рекомендуем выбирать поставщиков с сайтом, VK, WhatsApp или другими способами связи. Мы постепенно обновляем контакты поставщиков и добавляем альтернативные способы связи.' },
  { q: 'Подписка оплачивается один раз или каждый месяц?', a: 'Подписка в BAZA является ежемесячной. Продлевая подписку, Вы сохраняете доступ к ежедневным обновлениям, интересным конкурсам и возможность выиграть ценные призы.' },
  { q: 'Почему доставка платная?', a: 'Мы не занимаемся доставкой товаров. Стоимость доставки устанавливают транспортные компании. Цена зависит от веса, объёма груза, региона и выбранного способа доставки.' },
  { q: 'Можно ли оформить возврат?', a: 'Условия возврата зависят от конкретного поставщика. Перед оплатой обязательно уточняйте: ✔️ возможность возврата; ✔️ сроки возврата; ✔️ условия обмена товара. Все договорённости происходят напрямую между покупателем и поставщиком.' },
  { q: 'Кто принимает оплату за заказ?', a: 'Оплата производится напрямую поставщику. BAZA не принимает оплату за товары и не участвует в сделках между покупателем и продавцом.' },
  { q: 'Почему поставщик не отвечает сразу?', a: 'У многих поставщиков большой поток обращений. Ответ может поступить в течение суток. Пожалуйста, дождитесь ответа и не отправляйте одно и то же сообщение многократно.' },
  { q: 'Безопасно ли заказывать через БАЗУ?', a: 'Мы собираем поставщиков в одном месте и проверяем их перед размещением. Однако перед оплатой всегда уточняйте условия работы, доставки и возврата непосредственно у поставщика.' }
];
