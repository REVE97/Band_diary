export const formatDate = (date) => {
  if (!date) return "";

  return date.slice(0,10);
}