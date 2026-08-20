// Helper utilities for Indonesian Currency & Date formatting

export const formatRupiah = (number) => {
  const value = Number(number);
  if (!Number.isFinite(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
};

const asValidDate = (dateInput) => {
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateIndonesian = (dateInput) => {
  const date = asValidDate(dateInput);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(date);
};

export const formatDateShort = (dateInput) => {
  const date = asValidDate(dateInput);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }).format(date);
};

export const formatTimeOnly = (dateInput) => {
  const date = asValidDate(dateInput);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(date) + ' WIB';
};

export const formatReceiptDate = (dateInput) => {
  const date = asValidDate(dateInput);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Jakarta'
  }).format(date).replace(',', '');
};

export const generateReceiptNumber = () => {
  const today = new Date();
  const dateStr = today.getFullYear().toString().slice(-2) +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SLSR-${dateStr}-${randomNum}`;
};
