export function getErrorMessage(error, defaultMessage = "Đã xảy ra lỗi") {
  return error.response?.data?.message || error.message || defaultMessage;
}
