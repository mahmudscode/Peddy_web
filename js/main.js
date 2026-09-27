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

// Close the mobile menu after picking a link
mobileMenu.addEventListener('click', (e) => {
  if (e.target.closest('a') && !mobileMenu.classList.contains('hidden')) menuBtn.click();
});

// ---------- API ----------
const API = 'https://openapi.programming-hero.com/api/peddy';

// ---------- State ----------
let currentPets = [];
let activeCategory = null;
let isLoading = false;
let loadRequestId = 0;
const adoptedIds = new Set();
let adoptingId = null;

// ---------- DOM ----------
const categoriesEl = document.getElementById('categories');
const petsEl = document.getElementById('pets');
const spinnerEl = document.getElementById('spinner');
const likedEl = document.getElementById('liked');
const likedEmptyEl = document.getElementById('liked-empty');
const detailsModal = document.getElementById('details-modal');
const detailsContent = document.getElementById('details-content');
const adoptModal = document.getElementById('adopt-modal');
const countdownEl = document.getElementById('countdown');
const detailsAdoptBtn = document.getElementById('details-adopt');

// ---------- Helpers ----------
const PLACEHOLDER_IMG = 'images/pet.webp';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fallback = (value, text = 'Not available') =>
  value === null || value === undefined || value === '' ? text : value;

const birthYear = (date) => (date ? new Date(date).getFullYear() : 'Not available');

const formatPrice = (price) => (price === null || price === undefined ? 'Not available' : `${price}$`);

const icon = (path) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">${path}</svg>`;

const ICONS = {
  breed: icon('<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />'),
  birth: icon('<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />'),
  gender: icon('<circle cx="12" cy="9" r="5" /><path stroke-linecap="round" d="M12 14v7M9 18h6" />'),
  price: icon('<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />'),
  vaccine: icon('<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />'),
  like: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" /></svg>',
};

const infoRow = (iconSvg, label, value) =>
  `<li class="flex items-center gap-2">${iconSvg}<span>${label}: ${value}</span></li>`;

// ---------- Categories ----------
const loadCategories = async () => {
  try {
    const res = await fetch(`${API}/categories`);
    const { categories } = await res.json();
    displayCategories(categories);
  } catch (err) {
    categoriesEl.innerHTML = '<p class="col-span-full text-center text-dark/60">Could not load categories.</p>';
  }
};

const displayCategories = (categories) => {
  categoriesEl.innerHTML = categories
    .map(
      ({ category, category_icon }) => `
      <button data-category="${category}"
        class="category-btn flex items-center justify-center gap-3 py-4 lg:py-5 border border-dark/10 rounded-2xl font-black text-lg md:text-xl hover:border-primary transition-colors">
        <img src="${category_icon}" alt="" class="w-8 h-8 md:w-10 md:h-10 object-contain" />
        ${category}s
      </button>`
    )
    .join('');
};

const setActiveCategory = (category) => {
  activeCategory = category;
  document.querySelectorAll('.category-btn').forEach((btn) => {
    const isActive = btn.dataset.category === category;
    btn.classList.toggle('rounded-full', isActive);
    btn.classList.toggle('rounded-2xl', !isActive);
    btn.classList.toggle('bg-primary/10', isActive);
    btn.classList.toggle('border-primary', isActive);
  });
};

categoriesEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.category-btn');
  if (!btn) return;
  const { category } = btn.dataset;
  setActiveCategory(category);
  loadPets(`${API}/category/${category.toLowerCase()}`, 'data');
});

// ---------- Pets ----------
const loadPets = async (url, key) => {
  // Only the latest request may update the grid (guards against fast category clicks)
  const requestId = ++loadRequestId;
  isLoading = true;
  petsEl.innerHTML = '';
  spinnerEl.classList.remove('hidden');
  try {
    // Show the spinner for at least 2 seconds
    const [res] = await Promise.all([fetch(url), delay(2000)]);
    const data = await res.json();
    if (requestId !== loadRequestId) return;
    currentPets = data[key] ?? [];
    displayPets(currentPets);
  } catch (err) {
    if (requestId !== loadRequestId) return;
    currentPets = [];
    petsEl.innerHTML = '<p class="col-span-full text-center text-dark/60 py-16">Something went wrong. Please try again.</p>';
  } finally {
    if (requestId === loadRequestId) {
      isLoading = false;
      spinnerEl.classList.add('hidden');
    }
  }
};

const displayPets = (pets) => {
  if (pets.length === 0) {
    petsEl.innerHTML = `
      <div class="col-span-full flex flex-col items-center text-center gap-4 py-16 px-6 bg-dark/5 rounded-2xl">
        <img src="images/error.webp" alt="" class="w-32 h-32" />
        <h3 class="text-2xl md:text-3xl font-black">No Information Available</h3>
        <p class="max-w-xl text-dark/70">
          We don't have any pets in this category right now. Please check back later or explore our other categories to find your new best friend.
        </p>
      </div>`;
    return;
  }

  petsEl.innerHTML = pets
    .map(
      ({ petId, image, pet_name, breed, date_of_birth, gender, price }) => `
      <div class="p-5 border border-dark/10 rounded-xl flex flex-col">
        <img src="${fallback(image, PLACEHOLDER_IMG)}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'"
          alt="${fallback(pet_name, 'Pet')}" class="w-full h-40 object-cover rounded-lg bg-dark/5" />
        <h4 class="mt-5 text-xl font-bold">${fallback(pet_name, 'Unnamed')}</h4>
        <ul class="mt-2 space-y-1 text-sm text-dark/70">
          ${infoRow(ICONS.breed, 'Breed', fallback(breed))}
          ${infoRow(ICONS.birth, 'Birth', birthYear(date_of_birth))}
          ${infoRow(ICONS.gender, 'Gender', fallback(gender))}
          ${infoRow(ICONS.price, 'Price', formatPrice(price))}
        </ul>
        <div class="mt-4 pt-4 border-t border-dark/10 flex items-center justify-between gap-2">
          <button data-action="like" data-id="${petId}" data-image="${fallback(image, PLACEHOLDER_IMG)}" data-name="${fallback(pet_name, 'Pet')}" aria-label="Like"
            class="px-4 py-2 rounded-lg border border-primary/20 text-dark/70 hover:bg-primary/10">${ICONS.like}</button>
          <button data-action="adopt" data-id="${petId}" ${adoptedIds.has(String(petId)) ? 'disabled' : ''}
            class="px-4 py-2 rounded-lg border border-primary/20 text-primary font-bold hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent">${adoptedIds.has(String(petId)) ? 'Adopted' : 'Adopt'}</button>
          <button data-action="details" data-id="${petId}"
            class="px-4 py-2 rounded-lg border border-primary/20 text-primary font-bold hover:bg-primary/10">Details</button>
        </div>
      </div>`
    )
    .join('');
};

petsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id, image, name } = btn.dataset;
  if (action === 'like') likePet(id, image, name);
  if (action === 'adopt') adoptPet(id);
  if (action === 'details') showDetails(id, btn);
});

// ---------- Sort ----------
document.getElementById('sort-btn').addEventListener('click', () => {
  if (isLoading) return;
  currentPets = [...currentPets].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  displayPets(currentPets);
});

// ---------- Like ----------
const likePet = (id, image, name) => {
  if (likedEl.querySelector(`[data-id="${id}"]`)) return;
  likedEmptyEl.classList.add('hidden');
  likedEl.insertAdjacentHTML(
    'beforeend',
    `<button data-id="${id}" title="View ${name}" aria-label="View details of ${name}"
      class="liked-pet block rounded-lg overflow-hidden hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary outline-none transition disabled:opacity-50">
      <img src="${image}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'" alt="${name}" class="w-full aspect-square object-cover" />
    </button>`
  );
};

// Clicking a liked pet opens its details
likedEl.addEventListener('click', (e) => {
  const thumb = e.target.closest('.liked-pet');
  if (thumb) showDetails(thumb.dataset.id, thumb);
});

// ---------- Adopt ----------
// Show the Adopt/Adopted state on every Adopt button for this pet (cards + details modal)
const syncAdoptButtons = (id) => {
  const adopted = adoptedIds.has(String(id));
  document.querySelectorAll(`button[data-action="adopt"][data-id="${id}"]`).forEach((btn) => {
    btn.textContent = adopted ? 'Adopted' : 'Adopt';
    btn.disabled = adopted;
  });
};

const adoptPet = (id) => {
  id = String(id);
  if (adoptedIds.has(id) || adoptingId) return;
  adoptingId = id;
  let count = 3;
  countdownEl.textContent = count;
  adoptModal.showModal();
  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
      return;
    }
    clearInterval(timer);
    adoptModal.close();
    adoptedIds.add(id);
    adoptingId = null;
    syncAdoptButtons(id);
  }, 1000);
};

// Keep the countdown from being dismissed with Escape
adoptModal.addEventListener('cancel', (e) => e.preventDefault());

// ---------- Details ----------
// `trigger` is the Details button or a liked-pet thumbnail
const showDetails = async (id, trigger) => {
  const isTextButton = trigger.dataset.action === 'details';
  trigger.disabled = true;
  if (isTextButton) trigger.textContent = 'Loading...';
  try {
    const res = await fetch(`${API}/pet/${id}`);
    const { petData } = await res.json();
    const { image, pet_name, breed, date_of_birth, gender, price, vaccinated_status, pet_details } = petData;
    detailsContent.innerHTML = `
      <img src="${fallback(image, PLACEHOLDER_IMG)}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'"
        alt="${fallback(pet_name, 'Pet')}" class="w-full max-h-80 object-cover rounded-lg" />
      <h3 class="mt-6 text-2xl font-black">${fallback(pet_name, 'Unnamed')}</h3>
      <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-dark/70">
        ${infoRow(ICONS.breed, 'Breed', fallback(breed))}
        ${infoRow(ICONS.birth, 'Birth', fallback(date_of_birth))}
        ${infoRow(ICONS.gender, 'Gender', fallback(gender))}
        ${infoRow(ICONS.price, 'Price', formatPrice(price))}
        ${infoRow(ICONS.vaccine, 'Vaccinated status', fallback(vaccinated_status))}
      </ul>
      <div class="mt-4 pt-4 border-t border-dark/10">
        <h4 class="font-bold">Details Information</h4>
        <p class="mt-2 text-sm text-dark/70">${fallback(pet_details, 'No details available.')}</p>
      </div>`;
    detailsAdoptBtn.dataset.id = id;
    syncAdoptButtons(id);
    detailsModal.showModal();
  } catch (err) {
    alert('Could not load pet details. Please try again.');
  } finally {
    trigger.disabled = false;
    if (isTextButton) trigger.textContent = 'Details';
  }
};

detailsAdoptBtn.addEventListener('click', () => adoptPet(detailsAdoptBtn.dataset.id));

document.getElementById('details-close').addEventListener('click', () => detailsModal.close());

// ---------- Init ----------
loadCategories();
loadPets(`${API}/pets`, 'pets');

// ---------- Subscribe ----------
document.getElementById('subscribe-form').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.reset();
  document.getElementById('subscribe-msg').classList.remove('hidden');
});
