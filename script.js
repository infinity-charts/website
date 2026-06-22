const header = document.querySelector(".site-header");
const tabs = document.querySelector("[data-tabs]");

function setHeaderState() {
  header.dataset.elevated = String(window.scrollY > 12);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (tabs) {
  const tabButtons = Array.from(tabs.querySelectorAll("[role='tab']"));
  const panels = Array.from(tabs.querySelectorAll("[role='tabpanel']"));

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((tab) => {
        tab.setAttribute("aria-selected", String(tab === button));
      });

      panels.forEach((panel) => {
        const active = panel.id === button.getAttribute("aria-controls");
        panel.hidden = !active;
        panel.classList.toggle("active", active);
      });
    });
  });
}
