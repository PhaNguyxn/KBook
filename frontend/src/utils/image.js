export function getImageUrl(image) {
  if (!image) {
    return "/book-placeholder.jpg";
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${import.meta.env.VITE_SERVER_URL}${image}`;
}
