/* Public Web App URL, not a secret. Replace with the deployed /exec URL. */
const GOOGLE_SCRIPT_URL = "COLLER_ICI_APRES_DEPLOIEMENT";

(() => {
  "use strict";

  const year = document.getElementById("current-year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Reveal only when supported; without JS, everything remains readable.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((element) => {
      element.classList.add("is-pending");
      observer.observe(element);
    });
    // Restore visibility if the user changes their motion preference mid-session.
    reducedMotion.addEventListener?.("change", (event) => {
      if (!event.matches) return;
      observer.disconnect();
      document.querySelectorAll(".is-pending").forEach((element) => {
        element.classList.remove("is-pending");
      });
    });
  }

  // An anchor to a closed privacy/legal panel should open it before navigation.
  function openLinkedDetails(hash) {
    if (!hash || hash === "#") return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target instanceof HTMLDetailsElement) target.open = true;
  }
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", () => openLinkedDetails(anchor.hash));
  });
  window.addEventListener("hashchange", () => openLinkedDetails(window.location.hash));
  openLinkedDetails(window.location.hash);

  const form = document.getElementById("lead-form");
  const button = document.getElementById("submit-button");
  const buttonLabel = button?.querySelector(".button-label");
  const message = document.getElementById("form-message");
  if (!form || !button || !buttonLabel || !message) return;

  const initialLabel = buttonLabel.textContent;
  const controls = [...form.querySelectorAll("input, select, textarea")];
  let submitting = false;

  // The HTML button is disabled until this handler is ready: no accidental
  // native POST of personal information if JavaScript is unavailable.
  form.noValidate = true;
  button.disabled = false;

  function showMessage(text, state) {
    message.dataset.state = state;
    message.hidden = false;
    message.textContent = text;
  }

  function validateField(field) {
    field.setCustomValidity("");
    if (field.name === "fullName" && field.value.trim().length < 2) {
      field.setCustomValidity("Indiquez votre nom complet (au moins 2 caractères).");
    }
    if (field.name === "description" && field.value.trim().length < 20) {
      field.setCustomValidity("Décrivez votre besoin en au moins 20 caractères.");
    }
    if (field.name === "email" && (field.validity.typeMismatch || field.validity.patternMismatch)) {
      field.setCustomValidity("Indiquez une adresse email valide, par exemple nom@entreprise.fr.");
    }
    if (field.validity.valid) field.removeAttribute("aria-invalid");
    return field.validity.valid;
  }

  controls.forEach((field) => {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("change", () => validateField(field));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;

    ["fullName", "email", "company", "description"].forEach((name) => {
      const field = form.elements.namedItem(name);
      field.value = field.value.trim();
    });
    controls.forEach(validateField);
    if (!form.checkValidity()) {
      controls.forEach((field) => {
        if (!field.validity.valid) field.setAttribute("aria-invalid", "true");
      });
      showMessage("Vérifiez les champs obligatoires : votre nom, un email valide et une description d’au moins 20 caractères.", "error");
      form.reportValidity();
      return;
    }

    // Reject placeholders, /dev URLs and unexpected hosts. The endpoint is public.
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(GOOGLE_SCRIPT_URL)) {
      showMessage("Le formulaire n’est pas encore connecté. Votre demande n’a pas été envoyée. L’éditeur doit configurer son URL Google Apps Script avant la mise en ligne. Aucun paiement n’a été effectué.", "error");
      return;
    }

    const values = new FormData(form);
    const payload = {
      fullName: values.get("fullName"),
      email: values.get("email"),
      company: values.get("company"),
      appType: values.get("appType"),
      collaborationMode: values.get("collaborationMode"),
      budget: values.get("budget"),
      description: values.get("description")
    };
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    submitting = true;
    form.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.classList.add("is-loading");
    buttonLabel.textContent = "Envoi de votre demande…";
    controls.forEach((field) => { field.disabled = true; });
    showMessage("Votre demande est en cours d’envoi. Merci de patienter.", "loading");

    try {
      // JSON in text/plain avoids an OPTIONS preflight, unsupported by Apps
      // Script Web Apps. Keep CORS enabled: never claim success on opaque data.
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("HTTP_ERROR");
      const result = await response.json();
      if (result?.success !== true) {
        if (result?.code === "VALIDATION_ERROR") throw new Error("VALIDATION_ERROR");
        throw new Error("SERVER_ERROR");
      }
      form.reset();
      controls.forEach((field) => {
        field.removeAttribute("aria-invalid");
        field.setCustomValidity("");
      });
      showMessage("Merci, votre demande a bien été enregistrée ! Je vous recontacte pour cadrer votre projet. Les 15 jours d’essai gratuit commenceront à la mise à disposition de votre application. Aucun paiement n’est demandé avant la fin de l’essai ; achat ou abonnement sera décidé ensemble ensuite.", "success");
    } catch (error) {
      if (error.message === "VALIDATION_ERROR") {
        showMessage("La demande n’a pas été enregistrée : vérifiez les informations saisies et les longueurs autorisées, puis réessayez.", "error");
      } else if (error.message === "SERVER_ERROR") {
        showMessage("Le service n’a pas confirmé l’enregistrement. Vos informations restent dans le formulaire. Réessayez plus tard ou contactez l’éditeur ; un nouvel envoi peut créer un doublon si le premier a abouti.", "error");
      } else {
        showMessage("Impossible de confirmer l’enregistrement (connexion, délai ou configuration du service). Vos informations restent dans le formulaire. Vérifiez votre connexion ou contactez l’éditeur avant de renvoyer : la demande a peut-être déjà été reçue. Aucun paiement n’a été effectué.", "error");
      }
    } finally {
      window.clearTimeout(timeoutId);
      submitting = false;
      form.removeAttribute("aria-busy");
      controls.forEach((field) => { field.disabled = false; });
      button.disabled = false;
      button.classList.remove("is-loading");
      buttonLabel.textContent = initialLabel;
    }
  });
})();
