// Mobile menu toggle
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = document.getElementById('menu-icon');

const OPEN_ICON = '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />';
const CLOSE_ICON = '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />';

menuBtn.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('hidden') === false;
  mobileMenu.classList.toggle('flex', isOpen);
  menuIcon.innerHTML = isOpen ? CLOSE_ICON : OPEN_ICON;
  menuBtn.setAttribute('aria-expanded', isOpen);
  menuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
