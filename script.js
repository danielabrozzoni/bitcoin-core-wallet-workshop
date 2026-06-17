function bindSelectorGroup({ buttonSelector, paneSelector, storageKey, defaultValue }) {
  const buttons = document.querySelectorAll(buttonSelector);
  const panes = document.querySelectorAll(paneSelector);

  function setSelected(value) {
    buttons.forEach((button) => {
      const isActive = button.dataset[buttonSelector.includes("download") ? "downloadSelect" : "osSelect"] === value;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    panes.forEach((pane) => {
      const paneKey = paneSelector.includes("download") ? "downloadPane" : "osPane";
      pane.classList.toggle("active", pane.dataset[paneKey] === value);
    });
    localStorage.setItem(storageKey, value);
  }

  let savedValue = localStorage.getItem(storageKey) || defaultValue;
  if (storageKey === 'bitcoinCoreDevelopmentOs' && savedValue === 'linux') savedValue = 'mac';
  setSelected(savedValue);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = buttonSelector.includes("download") ? "downloadSelect" : "osSelect";
      setSelected(button.dataset[key]);
    });
  });
}

bindSelectorGroup({
  buttonSelector: "[data-os-select]",
  paneSelector: "[data-os-pane]",
  storageKey: "bitcoinCoreDevelopmentOs",
  defaultValue: "mac",
});

bindSelectorGroup({
  buttonSelector: "[data-download-select]",
  paneSelector: "[data-download-pane]",
  storageKey: "bitcoinCoreDevelopmentDownload",
  defaultValue: "mac-arm",
});

const navLinks = document.querySelectorAll(".section-nav a");
const sections = [...document.querySelectorAll("main section:not(.archived)")];
let currentSectionId = sections[0]?.id;
let lockedSectionId = null;
let unlockScrollTimeout;

function setActiveSection(sectionId) {
  currentSectionId = sectionId;
  const activeLink = [...navLinks].find((link) => link.getAttribute("href") === `#${sectionId}`);
  const parentGroup = activeLink?.dataset.parent;

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    const isParent = parentGroup && link.dataset.group === parentGroup;
    link.classList.toggle("active", isActive);
    link.classList.toggle("parent-active", Boolean(isParent));
  });
}

const observer = new IntersectionObserver((entries) => {
  if (lockedSectionId) return;

  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;

  setActiveSection(visible.target.id);
}, { threshold: [0.2, 0.45, 0.7] });

sections.forEach((section) => observer.observe(section));

function unlockActiveSection(sectionId) {
  if (lockedSectionId !== sectionId) return;

  lockedSectionId = null;
  window.clearTimeout(unlockScrollTimeout);
  setActiveSection(sectionId);
}

function scrollToSection(section) {
  lockedSectionId = section.id;
  setActiveSection(section.id);
  section.scrollIntoView({ behavior: "smooth", block: "start" });

  window.clearTimeout(unlockScrollTimeout);
  const releaseAfterScrollSettles = () => {
    window.clearTimeout(unlockScrollTimeout);
    unlockScrollTimeout = window.setTimeout(() => {
      window.removeEventListener("scroll", releaseAfterScrollSettles);
      unlockActiveSection(section.id);
    }, 160);
  };

  window.addEventListener("scroll", releaseAfterScrollSettles);
  releaseAfterScrollSettles();
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href")?.slice(1);
    const targetSection = targetId ? document.getElementById(targetId) : null;
    if (!targetSection) return;

    event.preventDefault();
    scrollToSection(targetSection);
    history.replaceState(null, "", `#${targetId}`);
  });
});

document.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  const isTyping = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tagName) || event.target.isContentEditable;
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;

  const currentIndex = Math.max(0, sections.findIndex((section) => section.id === currentSectionId));
  const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = Math.min(sections.length - 1, Math.max(0, currentIndex + direction));

  if (nextIndex !== currentIndex) {
    event.preventDefault();
    scrollToSection(sections[nextIndex]);
  }
});
