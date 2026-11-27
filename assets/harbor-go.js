'use strict';
const button = document.querySelector('[data-destination]');
if (button) button.addEventListener('click', () => {
  const url = new URL(atob(button.dataset.destination.split('').reverse().join('')));
  if (url.protocol === 'https:') window.location.replace(url.href);
});
