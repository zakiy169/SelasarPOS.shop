const CATEGORY_MAP = {
  'black coffee': { id: 'espresso', label: 'Espresso Based' },
  'kopi susu': { id: 'signature', label: 'Signature Selasar' },
  'non-coffee': { id: 'noncoffee', label: 'Non Coffee' },
  'makanan & minuman': { id: 'signature', label: 'Signature Selasar' },
  'lain-lain': { id: 'pastry', label: 'Pastry & Snacks' },
};

const FALLBACK_CATEGORY = { id: 'signature', label: 'Signature Selasar' };

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const asText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const getCategory = (value) => {
  const key = asText(value).trim().toLowerCase();
  return CATEGORY_MAP[key] || {
    id: FALLBACK_CATEGORY.id,
    label: asText(value, FALLBACK_CATEGORY.label) || FALLBACK_CATEGORY.label,
  };
};

export const mapImportedProduct = (source) => {
  const category = getCategory(source?.category);
  const image = source?.image_url || '';
  const price = asNumber(source?.sell_price);
  const costPrice = asNumber(source?.cost_price);

  return {
    id: asText(source?.id) || `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: asText(source?.name, 'Produk Import').trim(),
    category: category.id,
    categoryId: category.id,
    categoryName: category.label,
    price,
    costPrice,
    image,
    description: asText(source?.notes),
    isAvailable: source?.is_visible !== false && asNumber(source?.stock, 0) > 0,
    ingredients: [],
    barcode: source?.barcode ?? null,
    stock: asNumber(source?.stock),
    discountPrice: source?.discount_price ?? null,
    unit: source?.unit ?? null,
    weight: source?.weight ?? null,
    weightGrams: source?.weight_grams ?? null,
    shelfLocation: source?.shelf_location ?? null,
    qrCode: source?.qr_code ?? null,
    wholesalePrices: source?.wholesale_prices ?? null,
    externalId: source?.external_id ?? null,
    createdAt: source?.created_at ?? null,
    updatedAt: source?.updated_at ?? null,
    sourceCategory: source?.category ?? null,
    _importSource: 'json',
  };
};

export const mapImportedSale = (sale, saleItems, productById) => {
  const items = saleItems.map((item) => {
    const product = productById.get(item?.product_id);
    const qty = asNumber(item?.qty, 1);
    const price = asNumber(item?.price);

    return {
      productId: item?.product_id ?? null,
      name: asText(item?.name, product?.name || 'Produk'),
      qty,
      itemUnitPrice: price,
      totalPrice: asNumber(item?.subtotal, price * qty),
      originalPrice: item?.original_price ?? null,
      notes: asText(item?.discount_note),
      variant: null,
      sugar: null,
      milk: null,
      extraShot: false,
      ingredients: product?.ingredients || [],
      cost: asNumber(item?.cost),
    };
  });

  const method = asText(sale?.method, 'Cash');
  const paid = asNumber(sale?.paid, asNumber(sale?.total));
  const change = asNumber(sale?.change);

  return {
    id: asText(sale?.id) || `SLSR-IMPORT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    receiptNumber: asText(sale?.trx_id, `IMPORT-${Date.now()}`),
    date: asText(sale?.created_at, new Date().toISOString()),
    customerType: 'Takeaway',
    tableName: 'Takeaway Counter',
    customerName: asText(sale?.customer, 'Pelanggan Umum'),
    memberId: null,
    items,
    subtotal: asNumber(sale?.subtotal),
    tax: asNumber(sale?.tax),
    serviceCharge: 0,
    discount: asNumber(sale?.discount),
    total: asNumber(sale?.total),
    paymentMethod: method,
    cashReceived: method.toLowerCase() === 'cash' ? paid : 0,
    cashChange: method.toLowerCase() === 'cash' ? change : 0,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    cashierName: 'Import JSON',
    _importSource: 'json',
    _sourceSaleId: sale?.id ?? null,
    _sourceTrxId: sale?.trx_id ?? null,
    _sourceShiftId: sale?.shift_id ?? null,
  };
};

export const parsePosBackupJson = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Format JSON tidak valid. Root harus berupa object.');
  }

  const products = Array.isArray(payload.products) ? payload.products : [];
  const sales = Array.isArray(payload.sales) ? payload.sales : [];
  const saleItems = Array.isArray(payload.sale_items) ? payload.sale_items : [];

  if (products.length === 0 && sales.length === 0 && saleItems.length === 0) {
    throw new Error('JSON tidak berisi products, sales, atau sale_items.');
  }

  const mappedProducts = products.map(mapImportedProduct);
  const productById = new Map(mappedProducts.map((product) => [product.id, product]));
  const itemsBySaleId = new Map();

  for (const item of saleItems) {
    const key = item?.sale_id;
    if (!key) continue;
    const current = itemsBySaleId.get(key) || [];
    current.push(item);
    itemsBySaleId.set(key, current);
  }

  const mappedTransactions = sales.map((sale) =>
    mapImportedSale(sale, itemsBySaleId.get(sale?.id) || [], productById)
  );

  return {
    products: mappedProducts,
    transactions: mappedTransactions,
    meta: {
      exportedAt: payload.exported_at ?? null,
      sourceUserId: payload.user_id ?? null,
      productCount: mappedProducts.length,
      saleCount: mappedTransactions.length,
      saleItemCount: saleItems.length,
    },
  };
};
