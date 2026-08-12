// Helper utilities for Indonesian Currency & Date formatting

export const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
};

export const formatDateIndonesian = (dateInput) => {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

export const formatDateShort = (dateInput) => {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const formatTimeOnly = (dateInput) => {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date) + ' WIB';
};

export const generateReceiptNumber = () => {
  const today = new Date();
  const dateStr = today.getFullYear().toString().slice(-2) +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SLSR-${dateStr}-${randomNum}`;
};
