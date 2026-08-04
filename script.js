const CONTACT = {
  whatsapp: "447300512108",
};

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const revealItems = document.querySelectorAll(".reveal");
const form = document.querySelector(".contact-form");

const onScroll = () => {
  header?.classList.toggle("scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

menuToggle?.addEventListener("click", () => {
  const open = nav?.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

const drop = document.querySelector(".nav-dropdown");
const dropBtn = document.querySelector(".nav-drop-btn");

dropBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  const open = drop?.classList.toggle("open");
  dropBtn.setAttribute("aria-expanded", open ? "true" : "false");
});

document.addEventListener("click", (event) => {
  if (!drop?.contains(event.target)) {
    drop?.classList.remove("open");
    dropBtn?.setAttribute("aria-expanded", "false");
  }
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    drop?.classList.remove("open");
    dropBtn?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open menu");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
);

revealItems.forEach((item) => observer.observe(item));

window.setTimeout(() => {
  revealItems.forEach((item) => item.classList.add("visible"));
}, 600);

function buildInquiryMessage(data) {
  const lines = [
    "New inquiry from world website",
    "",
    `Name: ${data.name}`,
    `Contact: ${data.contact}`,
    `Service: ${data.interest}`,
  ];

  if (data.message) {
    lines.push("", `Message: ${data.message}`);
  }

  return lines.join("\n");
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = {
    name: form.name.value.trim(),
    contact: form.contact.value.trim(),
    interest: form.interest.value.trim(),
    message: form.message.value.trim(),
  };

  const body = buildInquiryMessage(data);
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(body)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});

document.addEventListener("click", (event) => {
  const link = event.target.closest(
    'a[href*="cashpilot.hhnexusmarketing.com"], a.js-open-tab'
  );
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (!opened) {
    const fallback = document.createElement("a");
    fallback.href = href;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.style.display = "none";
    document.body.appendChild(fallback);
    fallback.click();
    fallback.remove();
  }
});
