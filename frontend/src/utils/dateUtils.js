// Simple date utilities to avoid external dependencies

export const formatDistanceToNow = (date, options = {}) => {
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const addSuffix = options.addSuffix || false;
  const suffix = addSuffix ? ' ago' : '';

  if (diffSeconds < 60) {
    return `just now`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}${suffix}`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}${suffix}`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}${suffix}`;
  } else {
    // For longer periods, return formatted date
    return date.toLocaleDateString();
  }
};

export const formatDateTime = (date) => {
  return date.toLocaleString();
};

export const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date) => {
  return date.toLocaleDateString();
};

export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

export const getRelativeDate = (date) => {
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDate(date);
  }
}; 