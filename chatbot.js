(() => {
  const WHATSAPP = "447300512108";

  const launch = document.querySelector("#chat-launch");
  const widget = document.querySelector("#chatbot");
  const body = document.querySelector("#chat-body");
  const form = document.querySelector("#chat-form");
  const input = document.querySelector("#chat-input");
  const closeBtn = document.querySelector("#chat-close");
  const openers = document.querySelectorAll(".js-open-chat");

  if (!launch || !widget || !body || !form || !input) return;

  const state = {
    step: "name",
    name: "",
    city: "",
    contactType: "",
    contact: "",
    service: "",
    detail: "",
  };

  const services = [
    "AI Automation",
    "SEO Content Writing",
    "Professional Website Design & Development",
    "Domain & Hosting",
  ];

  const followUps = {
    "AI Automation":
      "What would you like us to build first—AI chatbot, workflow automation, CRM automation, or lead capture?",
    "SEO Content Writing":
      "What niche or topic should we cover, and roughly how many articles or pages do you need?",
    "Professional Website Design & Development":
      "Do you need a landing page, business website, portfolio site, or company website?",
    "Domain & Hosting":
      "Do you need domain registration, VPS setup, SSL, business email—or a full setup?",
  };

  function openChat() {
    widget.hidden = false;
    if (!body.dataset.started) {
      body.dataset.started = "1";
      startFlow();
    }
  }

  function closeChat() {
    widget.hidden = true;
  }

  function addBubble(text, who = "bot") {
    const el = document.createElement("div");
    el.className = `chat-bubble ${who}`;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function addOptions(options) {
    const wrap = document.createElement("div");
    wrap.className = "chat-options";
    options.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-option";
      btn.textContent = label;
      btn.addEventListener("click", () => onOption(label));
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function addWhatsAppButton() {
    const wrap = document.createElement("div");
    wrap.className = "chat-options";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chat-option chat-whatsapp";
    btn.textContent = "Send to WhatsApp";
    btn.addEventListener("click", openWhatsApp);
    wrap.appendChild(btn);
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function clearOptions() {
    body.querySelectorAll(".chat-options").forEach((node) => node.remove());
  }

  function showInput(placeholder) {
    form.hidden = false;
    input.placeholder = placeholder;
    input.focus();
  }

  function hideInput() {
    form.hidden = true;
    input.value = "";
  }

  function startFlow() {
    state.step = "name";
    hideInput();
    addBubble("Hello! I’m the world Service Hub chatbot.");
    addBubble("May I have your full name, please?");
    showInput("Enter your full name");
  }

  function askCity() {
    state.step = "city";
    addBubble(`Thank you, ${state.name}. Which city are you from?`);
    showInput("Enter your city");
  }

  function askContactType() {
    state.step = "contactType";
    hideInput();
    addBubble("How should we contact you?");
    addOptions(["Email", "WhatsApp"]);
  }

  function askContactValue() {
    state.step = "contact";
    if (state.contactType === "Email") {
      addBubble("Please share your email address.");
      showInput("Enter your email");
    } else {
      addBubble("Please share your WhatsApp number (with country code if possible).");
      showInput("Enter your WhatsApp number");
    }
  }

  function askService() {
    state.step = "service";
    hideInput();
    addBubble("Which service are you interested in?");
    addOptions(services);
  }

  function askServiceDetail() {
    state.step = "detail";
    addBubble(
      followUps[state.service] ||
        "Please tell us briefly what you need help with."
    );
    showInput("Type your requirements");
  }

  function buildLeadMessage() {
    return [
      "New inquiry from world Service Hub chatbot",
      "",
      `Name: ${state.name}`,
      `City: ${state.city}`,
      `Preferred contact: ${state.contactType}`,
      `Contact: ${state.contact}`,
      `Service: ${state.service}`,
      "",
      `Requirements: ${state.detail}`,
      "",
      `Page: ${window.location.href}`,
    ].join("\n");
  }

  function openWhatsApp() {
    const text = encodeURIComponent(buildLeadMessage());
    const url = `https://wa.me/${WHATSAPP}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
    addBubble("WhatsApp is open — just tap Send there to finish.");
    state.step = "done";
    clearOptions();
  }

  function finishWithWhatsAppOption() {
    state.step = "whatsapp";
    hideInput();
    addBubble(
      "Thanks! Your details are ready. Tap the button below to open WhatsApp — then just press Send."
    );
    addWhatsAppButton();
  }

  async function submitEmailLead() {
    state.step = "email-submit";
    hideInput();
    addBubble("Thanks! Sending your details now…");

    const payload = {
      name: state.name,
      email: state.contact,
      city: state.city,
      service: state.service,
      detail: state.detail,
      page: window.location.href,
    };

    try {
      const res = await fetch("lead.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not send email lead");
      }
      addBubble(
        "Done. Your lead was forwarded to our team, and a confirmation email was sent to you."
      );
      state.step = "done";
    } catch (err) {
      addBubble(
        "We couldn’t send the email automatically right now. Please WhatsApp +44 7300 512108 or email info@hhnexusmarketing.com."
      );
      addWhatsAppButton();
      state.step = "done";
    }
  }

  function finishFlow() {
    if (state.contactType === "Email") {
      submitEmailLead();
      return;
    }
    finishWithWhatsAppOption();
  }

  function onOption(label) {
    clearOptions();
    addBubble(label, "user");

    if (state.step === "contactType") {
      state.contactType = label;
      askContactValue();
      return;
    }

    if (state.step === "service") {
      state.service = label;
      askServiceDetail();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;

    addBubble(value, "user");
    input.value = "";

    if (state.step === "name") {
      state.name = value;
      askCity();
      return;
    }

    if (state.step === "city") {
      state.city = value;
      askContactType();
      return;
    }

    if (state.step === "contact") {
      state.contact = value;
      askService();
      return;
    }

    if (state.step === "detail") {
      state.detail = value;
      finishFlow();
    }
  });

  launch.addEventListener("click", openChat);
  closeBtn?.addEventListener("click", closeChat);
  openers.forEach((el) => {
    el.addEventListener("click", (event) => {
      if (el.classList.contains("js-open-chat")) {
        event.preventDefault();
        openChat();
      }
    });
  });
})();
