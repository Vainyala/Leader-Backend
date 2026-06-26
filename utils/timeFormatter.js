// utils/timeFormatter.js
exports.formatISTTimestamps = (doc) => {
  const formatIST = (date) =>
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date(date));

  const obj = doc.toObject(); // Convert Mongoose doc to plain object
  if (obj.createdAt) obj.createdAt = formatIST(obj.createdAt);
  if (obj.updatedAt) obj.updatedAt = formatIST(obj.updatedAt);
  return obj;
};

