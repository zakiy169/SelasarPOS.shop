// Initial Seed Data for Kedai Kopi Selasar POS

export const CATEGORIES = [
  { id: 'all', name: 'Semua Menu', icon: 'Coffee' },
  { id: 'signature', name: 'Signature Selasar', icon: 'Sparkles' },
  { id: 'espresso', name: 'Espresso Based', icon: 'Zap' },
  { id: 'manual', name: 'Manual Brew', icon: 'Filter' },
  { id: 'noncoffee', name: 'Non-Coffee', icon: 'CupSoda' },
  { id: 'pastry', name: 'Pastry & Snack', icon: 'Cookie' },
  { id: 'beans', name: 'Coffee Beans 200g', icon: 'Package' }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Kopi Selasar Aren',
    category: 'signature',
    price: 22000,
    costPrice: 8500,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
    description: 'Es Kopi Milk khas Selasar dengan Gula Aren Premium Organik & Fresh Milk.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-1', name: 'Biji Kopi Arabica Selasar', amount: 18, unit: 'g' },
      { id: 'ing-2', name: 'Fresh Milk Pasteurisasi', amount: 120, unit: 'ml' },
      { id: 'ing-3', name: 'Sirup Gula Aren Organik', amount: 25, unit: 'ml' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-2',
    name: 'Selasar Pandan Latte',
    category: 'signature',
    price: 25000,
    costPrice: 9500,
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=80',
    description: 'Espresso shot dipadukan dengan ekstrak Pandan wangi dan oat milk gurih.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-1', name: 'Biji Kopi Arabica Selasar', amount: 18, unit: 'g' },
      { id: 'ing-5', name: 'Oat Milk Oatly', amount: 140, unit: 'ml' },
      { id: 'ing-6', name: 'Sirup Pandan Housemade', amount: 20, unit: 'ml' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-3',
    name: 'Americano / Long Black',
    category: 'espresso',
    price: 18000,
    costPrice: 4500,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
    description: 'Double shot Espresso Arabica blend Selasar diseduh dengan air mineral murni.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-1', name: 'Biji Kopi Arabica Selasar', amount: 18, unit: 'g' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-4',
    name: 'Caffe Latte / Cappuccino',
    category: 'espresso',
    price: 24000,
    costPrice: 8800,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80',
    description: 'Espresso seimbang dengan microfoam fresh milk lembut.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-1', name: 'Biji Kopi Arabica Selasar', amount: 18, unit: 'g' },
      { id: 'ing-2', name: 'Fresh Milk Pasteurisasi', amount: 180, unit: 'ml' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-5',
    name: 'Spanish Latte',
    category: 'espresso',
    price: 26000,
    costPrice: 9800,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80',
    description: 'Espresso creamy dengan perpaduan susu kental manis dan fresh milk hangat/dingin.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-1', name: 'Biji Kopi Arabica Selasar', amount: 18, unit: 'g' },
      { id: 'ing-2', name: 'Fresh Milk Pasteurisasi', amount: 140, unit: 'ml' },
      { id: 'ing-7', name: 'Susu Kental Manis', amount: 25, unit: 'ml' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-6',
    name: 'Manual Brew V60 (Single Origin)',
    category: 'manual',
    price: 28000,
    costPrice: 11000,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80',
    description: 'Seduhan manual filter V60 dengan biji kopi pilihan (Gayo Wine / Ciwidey / Aceh).',
    isAvailable: true,
    ingredients: [
      { id: 'ing-8', name: 'Biji Kopi Single Origin Filter', amount: 15, unit: 'g' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-7',
    name: 'Matcha Uji Premium Latte',
    category: 'noncoffee',
    price: 27000,
    costPrice: 10500,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
    description: 'Matcha Impor Uji Kyoto Jepang diseduh dengan fresh milk gurih & manis alami.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-9', name: 'Bubuk Matcha Uji Premium', amount: 12, unit: 'g' },
      { id: 'ing-2', name: 'Fresh Milk Pasteurisasi', amount: 180, unit: 'ml' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-8',
    name: 'Artisan Dark Chocolate',
    category: 'noncoffee',
    price: 26000,
    costPrice: 9200,
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=80',
    description: 'Cokelat hitam 70% kakao khas Bali yang rich dan creamy.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-10', name: 'Bubuk Cokelat Artisan 70%', amount: 25, unit: 'g' },
      { id: 'ing-2', name: 'Fresh Milk Pasteurisasi', amount: 180, unit: 'ml' },
      { id: 'ing-4', name: 'Cup 16oz Selasar', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-9',
    name: 'Butter Croissant French',
    category: 'pastry',
    price: 23000,
    costPrice: 10000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
    description: 'Croissant renyah bermentega tinggi dipanggang segar setiap pagi.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-11', name: 'Pastry Croissant Frozen', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-10',
    name: 'Almond Croissant',
    category: 'pastry',
    price: 28000,
    costPrice: 12500,
    image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=500&auto=format&fit=crop&q=80',
    description: 'Croissant dengan isian krim almond lezat dan taburan irisan almond panggang.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-12', name: 'Pastry Almond Croissant', amount: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'prod-11',
    name: 'Single Origin House Blend 200g',
    category: 'beans',
    price: 85000,
    costPrice: 48000,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=80',
    description: 'Biji kopi sangrai khas Selasar (70% Arabica Gayo, 30% Robusta Dampit). Notes: Chocolate & Caramel.',
    isAvailable: true,
    ingredients: [
      { id: 'ing-13', name: 'Kemasan Zipper Bag 200g', amount: 1, unit: 'pcs' }
    ]
  }
];

export const INITIAL_INVENTORY = [
  { id: 'ing-1', name: 'Biji Kopi Arabica Selasar', stock: 14500, unit: 'g', minStock: 2000, category: 'Kopi', packSize: 1000, packUnitName: 'Pack', costPerUnit: 250 },
  { id: 'ing-2', name: 'Fresh Milk Pasteurisasi', stock: 38000, unit: 'ml', minStock: 10000, category: 'Susu', packSize: 1000, packUnitName: 'Botol', costPerUnit: 22 },
  { id: 'ing-3', name: 'Sirup Gula Aren Organik', stock: 8500, unit: 'ml', minStock: 2500, category: 'Sirup', packSize: 1000, packUnitName: 'Botol', costPerUnit: 45 },
  { id: 'ing-4', name: 'Cup 16oz Selasar', stock: 420, unit: 'pcs', minStock: 100, category: 'Kemasan', packSize: 50, packUnitName: 'Slop', costPerUnit: 600 },
  { id: 'ing-5', name: 'Oat Milk Oatly', stock: 9000, unit: 'ml', minStock: 3000, category: 'Susu', packSize: 1000, packUnitName: 'Karton', costPerUnit: 48 },
  { id: 'ing-6', name: 'Sirup Pandan Housemade', stock: 1800, unit: 'ml', minStock: 1000, category: 'Sirup', packSize: 500, packUnitName: 'Botol', costPerUnit: 35 },
  { id: 'ing-7', name: 'Susu Kental Manis', stock: 5000, unit: 'ml', minStock: 1500, category: 'Susu', packSize: 500, packUnitName: 'Kaleng', costPerUnit: 18 },
  { id: 'ing-8', name: 'Biji Kopi Single Origin Filter', stock: 3200, unit: 'g', minStock: 1000, category: 'Kopi', packSize: 1000, packUnitName: 'Pack', costPerUnit: 350 },
  { id: 'ing-9', name: 'Bubuk Matcha Uji Premium', stock: 850, unit: 'g', minStock: 500, category: 'Powder', packSize: 500, packUnitName: 'Pouch', costPerUnit: 400 },
  { id: 'ing-10', name: 'Bubuk Cokelat Artisan 70%', stock: 1200, unit: 'g', minStock: 500, category: 'Powder', packSize: 500, packUnitName: 'Pouch', costPerUnit: 180 },
  { id: 'ing-11', name: 'Pastry Croissant Frozen', stock: 18, unit: 'pcs', minStock: 20, category: 'Pastry', packSize: 10, packUnitName: 'Box', costPerUnit: 10000 },
  { id: 'ing-12', name: 'Pastry Almond Croissant', stock: 14, unit: 'pcs', minStock: 15, category: 'Pastry', packSize: 10, packUnitName: 'Box', costPerUnit: 12500 }
];

export const INITIAL_TABLES = [
  { id: 't-1', name: 'Meja 01', zone: 'Indoor Aircon', status: 'available', capacity: 2, currentOrderId: null },
  { id: 't-2', name: 'Meja 02', zone: 'Indoor Aircon', status: 'occupied', capacity: 4, currentOrderId: 'SLSR-LIVE-101' },
  { id: 't-3', name: 'Meja 03', zone: 'Indoor Aircon', status: 'available', capacity: 2, currentOrderId: null },
  { id: 't-4', name: 'Meja 04', zone: 'Outdoor Selasar', status: 'available', capacity: 4, currentOrderId: null },
  { id: 't-5', name: 'Meja 05', zone: 'Outdoor Selasar', status: 'occupied', capacity: 4, currentOrderId: 'SLSR-LIVE-102' },
  { id: 't-6', name: 'Meja 06', zone: 'Outdoor Selasar', status: 'reserved', capacity: 6, currentOrderId: null },
  { id: 't-7', name: 'VIP Sofa A', zone: 'VIP Lounge', status: 'available', capacity: 8, currentOrderId: null },
  { id: 't-8', name: 'Bar Counter 01', zone: 'Bar Seat', status: 'available', capacity: 1, currentOrderId: null },
  { id: 't-9', name: 'Bar Counter 02', zone: 'Bar Seat', status: 'available', capacity: 1, currentOrderId: null }
];

export const INITIAL_LOYALTY_MEMBERS = [
  { id: 'mem-1', name: 'Pelanggan Selasar', phone: '081234567890', points: 340, totalSpent: 3400000, level: 'Gold VIP', joinedDate: '2025-11-12' },
  { id: 'mem-2', name: 'Budi Santoso', phone: '085712345678', points: 120, totalSpent: 1200000, level: 'Silver', joinedDate: '2026-01-15' },
  { id: 'mem-3', name: 'Sarah Amalia', phone: '081987654321', points: 85, totalSpent: 850000, level: 'Bronze', joinedDate: '2026-03-20' },
  { id: 'mem-4', name: 'Farhan Rizky', phone: '082133445566', points: 490, totalSpent: 4900000, level: 'Platinum', joinedDate: '2025-08-01' }
];

// Helper to generate seed historical transactions for immediate reports visualization
export const generateSeedTransactions = () => {
  const transactions = [];
  const now = new Date();
  
  // Active Kitchen Live Order 1
  transactions.push({
    id: 'SLSR-LIVE-101',
    receiptNumber: 'SLSR-260810-9101',
    date: new Date(now.getTime() - 12 * 60000).toISOString(),
    customerType: 'Dine-In',
    tableName: 'Meja 02',
    customerName: 'Pelanggan Selasar',
    items: [
      { id: 'prod-1', name: 'Kopi Selasar Aren', price: 22000, qty: 2, variant: 'Iced (Dingin)', sugar: '100% Normal', notes: 'Extra es sedikit' },
      { id: 'prod-9', name: 'Butter Croissant French', price: 23000, qty: 1, notes: 'Dipanaskan dulu' }
    ],
    subtotal: 67000,
    tax: 6700,
    serviceCharge: 3350,
    discount: 0,
    total: 77050,
    paymentMethod: 'qris',
    paymentStatus: 'paid',
    orderStatus: 'preparing', // KDS status
    cashierName: 'Rian Barista'
  });

  // Active Kitchen Live Order 2
  transactions.push({
    id: 'SLSR-LIVE-102',
    receiptNumber: 'SLSR-260810-9102',
    date: new Date(now.getTime() - 5 * 60000).toISOString(),
    customerType: 'Dine-In',
    tableName: 'Meja 05',
    customerName: 'Mbak Sarah',
    items: [
      { id: 'prod-2', name: 'Selasar Pandan Latte', price: 25000, qty: 1, variant: 'Iced (Dingin)', sugar: '50% Less Sugar' },
      { id: 'prod-7', name: 'Matcha Uji Premium Latte', price: 27000, qty: 1, variant: 'Iced (Dingin)' }
    ],
    subtotal: 52000,
    tax: 5200,
    serviceCharge: 2600,
    discount: 5000,
    total: 54800,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    cashReceived: 100000,
    cashChange: 45200,
    orderStatus: 'pending', // KDS status
    cashierName: 'Rian Barista'
  });

  // Generate 25 historical completed transactions for today, past 30 days, and past 12 months
  const paymentMethods = ['qris', 'cash', 'qris', 'debit', 'ewallet', 'cash'];
  const sampleNames = ['Andi', 'Dian', 'Reza', 'Fitri', 'Hendra', 'Maya', 'Nanda', 'Pelanggan Umum'];

  for (let i = 1; i <= 35; i++) {
    // Generate dates spread across today, this month, and past months
    const hoursAgo = i * 4;
    const dateObj = new Date(now.getTime() - hoursAgo * 3600 * 1000);

    const item1 = INITIAL_PRODUCTS[i % INITIAL_PRODUCTS.length];
    const item2 = INITIAL_PRODUCTS[(i + 3) % INITIAL_PRODUCTS.length];
    const qty1 = (i % 2) + 1;
    const qty2 = (i % 3) === 0 ? 1 : 0;

    const sub = (item1.price * qty1) + (qty2 ? item2.price * qty2 : 0);
    const tax = Math.round(sub * 0.1);
    const service = Math.round(sub * 0.05);
    const total = sub + tax + service;

    const items = [
      { id: item1.id, name: item1.name, price: item1.price, qty: qty1, variant: 'Iced (Dingin)', sugar: 'Normal' }
    ];
    if (qty2) {
      items.push({ id: item2.id, name: item2.name, price: item2.price, qty: qty2, variant: 'Hot (Hangat)' });
    }

    transactions.push({
      id: `SLSR-HIST-${100 + i}`,
      receiptNumber: `SLSR-${dateObj.getFullYear().toString().slice(-2)}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}-${1000 + i}`,
      date: dateObj.toISOString(),
      customerType: i % 2 === 0 ? 'Dine-In' : 'Takeaway',
      tableName: i % 2 === 0 ? `Meja 0${(i % 6) + 1}` : 'Takeaway Counter',
      customerName: sampleNames[i % sampleNames.length],
      items,
      subtotal: sub,
      tax,
      serviceCharge: service,
      discount: 0,
      total,
      paymentMethod: paymentMethods[i % paymentMethods.length],
      paymentStatus: 'paid',
      orderStatus: 'completed',
      cashierName: 'Rian Barista'
    });
  }

  return transactions;
};

// ─── Add-on / Extras menu items (editable from Settings > Addon Manager) ───
export const INITIAL_ADDONS = [
  { id: 'addon-1', name: 'Oat Milk Oatly',      type: 'milk',  price: 6000, isActive: true, emoji: '🌾' },
  { id: 'addon-2', name: 'Almond Milk',           type: 'milk',  price: 6000, isActive: true, emoji: '🥜' },
  { id: 'addon-3', name: 'Extra Shot Espresso',   type: 'extra', price: 5000, isActive: true, emoji: '☕' },
  { id: 'addon-4', name: 'Extra Sirup / Syrup',   type: 'extra', price: 3000, isActive: true, emoji: '🍯' },
  { id: 'addon-5', name: 'Whipped Cream Topping', type: 'extra', price: 4000, isActive: true, emoji: '🍦' },
  { id: 'addon-6', name: 'Choco Drizzle',         type: 'extra', price: 3000, isActive: true, emoji: '🍫' },
];
