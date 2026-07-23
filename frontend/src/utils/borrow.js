export function isBorrowOverdue(borrow) {
  if (!borrow || borrow.status !== "borrowing") {
    return false;
  }

  if (!borrow.dueDate) {
    return false;
  }

  const dueDate = new Date(borrow.dueDate);
  const today = new Date();

  dueDate.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

export function getBorrowStatus(borrow) {
  if (borrow?.status === "returned") {
    return {
      text: "Đã trả",
      className: "status-returned",
    };
  }

  if (isBorrowOverdue(borrow)) {
    return {
      text: "Quá hạn",
      className: "status-overdue",
    };
  }

  return {
    text: "Đang mượn",
    className: "status-borrowing",
  };
}

export function getReaderFullName(reader) {
  if (!reader) {
    return "Không xác định";
  }

  return `${reader.lastName || ""} ${reader.firstName || ""}`.trim();
}

export function getShortBorrowId(id) {
  if (!id) {
    return "—";
  }

  return id.slice(-8).toUpperCase();
}
