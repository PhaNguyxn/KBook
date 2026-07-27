export function formatCurrency(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "Chưa cập nhật";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}
