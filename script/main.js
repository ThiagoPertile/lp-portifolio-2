const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const revealItems = document.querySelectorAll(".reveal");
const heroVisual = document.querySelector(".hero-visual");
const year = document.getElementById("year");
const currentPath = window.location.pathname;

if (year) {
  year.textContent = new Date().getFullYear();
}

if (nav) {
  nav.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#")) {
      return;
    }
    const normalizedHref = href.replace("../", "");
    if (currentPath.endsWith(normalizedHref)) {
      link.classList.add("is-active");
    }
    if (currentPath.endsWith("/index.html") && normalizedHref === "index.html") {
      link.classList.add("is-active");
    }
  });
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -10% 0px",
  }
);

revealItems.forEach((item) => {
  const delay = item.getAttribute("data-delay");
  if (delay) {
    item.style.setProperty("--delay", `${delay}ms`);
  }
  observer.observe(item);
});

const counterElements = document.querySelectorAll("[data-count]");
counterElements.forEach((counter) => {
  const target = Number(counter.getAttribute("data-count"));
  if (!Number.isFinite(target)) {
    return;
  }

  let start = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const updateCounter = () => {
    start += step;
    if (start >= target) {
      counter.textContent = String(target);
      return;
    }
    counter.textContent = String(start);
    requestAnimationFrame(updateCounter);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateCounter();
          counterObserver.unobserve(counter);
        }
      });
    },
    { threshold: 0.4 }
  );

  counterObserver.observe(counter);
});

const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-project-card]");

if (filterButtons.length && projectCards.length) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter") || "all";
      filterButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");

      projectCards.forEach((card) => {
        const category = card.getAttribute("data-category") || "";
        const show = filter === "all" || category === filter;
        card.classList.toggle("is-hidden", !show);
      });
    });
  });
}

const accordionButtons = document.querySelectorAll("[data-accordion-trigger]");
accordionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    if (!item) {
      return;
    }
    const willOpen = !item.classList.contains("is-open");
    item.classList.toggle("is-open", willOpen);
    button.setAttribute("aria-expanded", String(willOpen));
  });
});

const getCookieValue = (name) => {
  const cookieString = `; ${document.cookie}`;
  const chunks = cookieString.split(`; ${name}=`);
  if (chunks.length === 2) {
    return chunks.pop().split(";").shift() || "";
  }
  return "";
};

const splitFullName = (fullName) => {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const pushFieldIfValue = (fields, name, value) => {
  if (!name) {
    return;
  }
  const normalizedName = String(name).trim();
  if (!normalizedName || normalizedName.startsWith("SEU_")) {
    return;
  }
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return;
  }
  fields.push({ name: normalizedName, value: normalizedValue });
};

const isHubspotConfigured = (form) => {
  const portalId = form.getAttribute("data-hubspot-portal-id") || "";
  const formId = form.getAttribute("data-hubspot-form-id") || "";
  if (!portalId || !formId) {
    return false;
  }
  if (portalId === "SEU_PORTAL_ID" || formId === "SEU_FORM_ID") {
    return false;
  }
  return true;
};

const submitToHubspot = async (form, payload) => {
  const portalId = form.getAttribute("data-hubspot-portal-id") || "";
  const formId = form.getAttribute("data-hubspot-form-id") || "";
  const firstNameField = form.getAttribute("data-hubspot-firstname-field") || "firstname";
  const lastNameField = form.getAttribute("data-hubspot-lastname-field") || "lastname";
  const emailField = form.getAttribute("data-hubspot-email-field") || "email";
  const phoneField = form.getAttribute("data-hubspot-phone-field") || "phone";
  const messageField = form.getAttribute("data-hubspot-message-field") || "";
  const ambienteField = form.getAttribute("data-hubspot-ambiente-field") || "";

  const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;
  const { firstName, lastName } = splitFullName(payload.nome);

  const fullFields = [];
  pushFieldIfValue(fullFields, firstNameField, firstName || payload.nome);
  pushFieldIfValue(fullFields, lastNameField, lastName);
  pushFieldIfValue(fullFields, emailField, payload.email);
  pushFieldIfValue(fullFields, phoneField, payload.telefone);
  pushFieldIfValue(fullFields, messageField, payload.mensagem);
  pushFieldIfValue(fullFields, ambienteField, payload.ambiente);

  const baseFields = [];
  pushFieldIfValue(baseFields, firstNameField, firstName || payload.nome);
  pushFieldIfValue(baseFields, lastNameField, lastName);
  pushFieldIfValue(baseFields, emailField, payload.email);
  pushFieldIfValue(baseFields, phoneField, payload.telefone);

  const minimalFields = [];
  pushFieldIfValue(minimalFields, firstNameField, firstName || payload.nome);
  pushFieldIfValue(minimalFields, emailField, payload.email);

  const fieldSets = [fullFields, baseFields, minimalFields].filter((set, index, arr) => {
    if (!set.length) {
      return false;
    }
    return arr.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(set)) === index;
  });

  let lastErrorMessage = "Nao foi possivel enviar para o HubSpot agora.";

  for (const fields of fieldSets) {
    const hutk = getCookieValue("hubspotutk");
    const context = {
      pageUri: window.location.href,
      pageName: document.title,
    };

    if (hutk) {
      context.hutk = hutk;
    }

    const requestBody = {
      fields,
      context,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      return;
    }

    try {
      const errorData = await response.json();
      if (errorData.message) {
        lastErrorMessage = String(errorData.message);
      }
    } catch {
      lastErrorMessage = "Nao foi possivel enviar para o HubSpot agora.";
    }

    if (response.status !== 400) {
      break;
    }
  }

  throw new Error(
    `${lastErrorMessage} Verifique os nomes internos dos campos no HubSpot (data-hubspot-*-field).`
  );
};

const leadForms = document.querySelectorAll(".js-lead-form");
leadForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = form.querySelector(".form-feedback");
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const defaultButtonLabel = submitButton ? submitButton.textContent : "";
    const nome = String(formData.get("nome") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const telefone = String(formData.get("telefone") || "").trim();

    if (!nome || !email || !telefone) {
      if (feedback) {
        feedback.textContent = "Preencha nome, e-mail e telefone para continuar.";
        feedback.classList.add("is-error");
      }
      return;
    }

    if (feedback) {
      feedback.textContent = "";
      feedback.classList.remove("is-error");
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    const leadPayload = {
      nome,
      email,
      telefone,
      ambiente: String(formData.get("ambiente") || ""),
      mensagem: String(formData.get("mensagem") || ""),
      createdAt: new Date().toISOString(),
    };

    try {
      const provider = form.getAttribute("data-integration-provider") || "";
      if (provider === "hubspot" && isHubspotConfigured(form)) {
        await submitToHubspot(form, leadPayload);
      }

      localStorage.setItem("atelierLead", JSON.stringify(leadPayload));

      const redirectUrl = form.getAttribute("data-redirect-url") || "";
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      form.reset();
      if (feedback) {
        feedback.textContent = "Recebemos seus dados. Retornaremos em breve.";
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = error instanceof Error ? error.message : "Nao foi possivel enviar o formulario.";
        feedback.classList.add("is-error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonLabel;
      }
    }
  });
});

const thankyouName = document.querySelector(".thankyou-name");
if (thankyouName) {
  const rawLead = localStorage.getItem("atelierLead");
  if (rawLead) {
    try {
      const parsedLead = JSON.parse(rawLead);
      if (parsedLead.nome) {
        const firstName = String(parsedLead.nome).split(" ")[0];
        thankyouName.textContent = firstName;
      }
    } catch {
      // Ignore malformed local storage.
    }
  }
}

if (heroVisual) {
  heroVisual.addEventListener("pointermove", (event) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const imageCard = heroVisual.querySelector(".hero-image-card");

    if (imageCard) {
      imageCard.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${y * -5}deg) translateZ(0)`;
    }
  });

  heroVisual.addEventListener("pointerleave", () => {
    const imageCard = heroVisual.querySelector(".hero-image-card");
    if (imageCard) {
      imageCard.style.transform = "perspective(1000px) rotateY(-6deg) rotateX(2deg)";
    }
  });
}
