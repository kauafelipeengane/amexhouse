export function addResourceHint(rel, href, crossOrigin) {
  if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (crossOrigin) link.crossOrigin = crossOrigin;
  document.head.appendChild(link);
}
export function prepareVideoConnections() {
  addResourceHint('preconnect', 'https://www.youtube.com');
  addResourceHint('preconnect', 'https://www.google.com');
  addResourceHint('dns-prefetch', 'https://i.ytimg.com');
}
