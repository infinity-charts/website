const header = document.querySelector(".site-header");

function setHeaderState() {
  header.dataset.elevated = String(window.scrollY > 12);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });
