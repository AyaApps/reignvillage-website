// All screenshots remain visible without JavaScript; mobile buttons shorten the page.
const controls = document.querySelector('.showcase-controls');
const cards = [...document.querySelectorAll('.short-screen-card')];
const buttons = [...document.querySelectorAll('[data-slide]')];
const mobile = window.matchMedia('(max-width: 760px)');
let selected = 0;
function renderShowcase() {
  controls.hidden = !mobile.matches;
  cards.forEach((card, index) => { card.hidden = mobile.matches && index !== selected; });
  buttons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === selected));
    button.setAttribute('aria-controls', cards[index].id);
  });
}
buttons.forEach((button, index) => button.addEventListener('click', () => {
  selected = index;
  renderShowcase();
}));
mobile.addEventListener('change', renderShowcase);
renderShowcase();
