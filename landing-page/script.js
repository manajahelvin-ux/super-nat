/**
 * Super-Nat — Landing page interactions
 * - Validation formulaire + envoi vers Google Apps Script Web App
 * - Animations reveal au scroll
 * - Navigation mobile
 * Aucune dépendance externe.
 */

// ===================================================================
// CONFIGURATION — À REMPLACER APRÈS DÉPLOIEMENT APPS SCRIPT
// ===================================================================
// 1. Déployez apps-script/Code.gs en Web App (voir README.md)
// 2. Copiez l'URL fournie par Google (https://script.google.com/macros/s/.../exec)
// 3. Collez-la ci-dessous entre les guillemets.
const GOOGLE_SCRIPT_URL = "COLLER_ICI_APRES_DEPLOIEMENT";
// Exemple : "https://script.google.com/macros/s/AKfycb.../exec"

// ===================================================================
// Utilitaires
// ===================================================================
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// Année footer
const yearEl = $("#year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// ===================================================================
// Navigation mobile
// ===================================================================
const burger = $(".header__burger");
const mobileNav = $("#mobile-nav");
if (burger && mobileNav) {
  burger.addEventListener("click", () => {
    const expanded = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!expanded));
    mobileNav.hidden = expanded;
  });
  // Fermer au clic sur un lien
  $$(".mobile-nav__link, .mobile-nav__cta").forEach((a) => {
    a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
    });
  });
  // Fermer avec Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobileNav.hidden) {
      burger.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
      burger.focus();
    }
  });
}

// ===================================================================
// Reveal au scroll (fade-in discret)
// ===================================================================
const revealEls = $$(".section, .card, .offer, .step, .testimonial, .hero__content, .hero__visual, .contact__intro, .form");
revealEls.forEach((el) => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
  revealObserver.observe(el);
});

// Respecte prefers-reduced-motion : déjà géré en CSS, mais on désactive l'observer
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealEls.forEach((el) => {
    el.classList.add("is-visible");
    revealObserver.unobserve(el);
  });
}

// ===================================================================
// Formulaire — validation + envoi Apps Script
// ===================================================================
const form = $("#lead-form");
const statusEl = $("#form-status");
const submitBtn = $("#form-submit");

function showStatus(type, html) {
  if (!statusEl) return;
  statusEl.innerHTML = `<div class="status status--${type}">${html}</div>`;
  statusEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearStatus() {
  if (statusEl) statusEl.innerHTML = "";
}

function setFieldError(input, message) {
  const errorEl = document.getElementById(`error-${input.id}`);
  if (errorEl) errorEl.textContent = message || "";
  if (message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
  } else {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  }
}

function validateForm() {
  let valid = true;
  clearStatus();

  const nom = $("#nom");
  const email = $("#email");
  const besoin = $("#besoin");

  // Nom complet — requis, min 2 caractères
  if (!nom.value.trim() || nom.value.trim().length < 2) {
    setFieldError(nom, "Merci d'indiquer votre nom complet.");
    valid = false;
  } else {
    setFieldError(nom, "");
  }

  // Email — requis + pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    setFieldError(email, "L'email professionnel est requis.");
    valid = false;
  } else if (!emailPattern.test(email.value.trim())) {
    setFieldError(email, "Format d'email invalide (ex. nom@entreprise.fr).");
    valid = false;
  } else {
    setFieldError(email, "");
  }

  // Besoin — requis, min 10 caractères
  if (!besoin.value.trim() || besoin.value.trim().length < 10) {
    setFieldError(besoin, "Décrivez votre besoin en quelques mots (10 caractères min.).");
    valid = false;
  } else {
    setFieldError(besoin, "");
  }

  return valid;
}

// Efface l'erreur à la saisie
["nom", "email", "besoin"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => setFieldError(el, ""));
});

if (form && submitBtn) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearStatus();

    // Honeypot anti-spam
    const honeypot = $("#website");
    if (honeypot && honeypot.value.trim() !== "") {
      // Bot détecté — on fait comme si c'était un succès sans rien envoyer
      showStatus("success", "<strong>Merci !</strong> Votre demande a bien été prise en compte.");
      return;
    }

    if (!validateForm()) {
      showStatus("error", "Veuillez corriger les champs indiqués avant d'envoyer.");
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Prépare les données
    const formData = new FormData(form);
    const payload = {
      nom: (formData.get("nom") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      entreprise: (formData.get("entreprise") || "").toString().trim(),
      type_app: (formData.get("type_app") || "").toString().trim(),
      mode: (formData.get("mode") || "").toString().trim(),
      budget: (formData.get("budget") || "").toString().trim(),
      besoin: (formData.get("besoin") || "").toString().trim(),
      source: window.location.href,
      userAgent: navigator.userAgent,
    };

    // État chargement
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    const originalText = $(".btn__text", submitBtn)?.textContent;
    const textEl = $(".btn__text", submitBtn);
    if (textEl) textEl.textContent = "Envoi en cours…";

    // Si l'URL n'est pas configurée, on simule un succès (mode démo)
    const isPlaceholder = !GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("COLLER_ICI");
    if (isPlaceholder) {
      console.warn(
        "[Super-Nat] GOOGLE_SCRIPT_URL n'est pas configurée. Le formulaire fonctionne en mode démo (aucune donnée n'est envoyée). Déployez le Apps Script et remplacez la constante dans script.js — voir README.md."
      );
      await new Promise((r) => setTimeout(r, 900));
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      if (textEl && originalText) textEl.textContent = originalText;
      showStatus(
        "success",
        `<strong>Merci ${escapeHtml(payload.nom)} !</strong> Votre demande a bien été prise en compte.<br>
        Je vous réponds sous <strong>24h ouvrées</strong> avec un cadrage clair pour démarrer votre <strong>essai gratuit de 15 jours</strong>.<br>
        <span style="opacity:0.85">Aucun paiement ne vous sera demandé avant la fin de l'essai.</span><br><br>
        <span style="font-size:12px;opacity:0.7">Mode démo : configurez <code>GOOGLE_SCRIPT_URL</code> dans <code>script.js</code> pour enregistrer réellement les leads dans Google Sheets (voir README).</span>`
      );
      form.reset();
      // Remettre le radio par défaut après reset
      const defaultRadio = form.querySelector('input[name="mode"][value="À discuter après l\'essai"]');
      if (defaultRadio) defaultRadio.checked = true;
      return;
    }

    try {
      // Envoi vers Google Apps Script
      // On envoie en text/plain pour éviter le preflight CORS (Apps Script ne gère pas OPTIONS)
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      // Apps Script renvoie souvent du JSON même avec redirect
      let data = null;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        // Réponse non-JSON mais statut 200 = considéré comme succès (comportement Apps Script)
        data = { ok: response.ok };
      }

      const ok = response.ok && (data.ok === undefined || data.ok === true || data.result === "success");

      if (!ok) {
        throw new Error(data.error || data.message || `Erreur serveur (${response.status})`);
      }

      showStatus(
        "success",
        `<strong>Merci ${escapeHtml(payload.nom)} !</strong> Votre demande a bien été enregistrée.<br>
        Je vous réponds sous <strong>24h ouvrées</strong> avec un cadrage clair pour démarrer votre <strong>essai gratuit de 15 jours</strong>.<br>
        <span style="opacity:0.85">Aucun paiement ne vous sera demandé avant la fin de l'essai — on choisit ensemble le mode (achat ou abonnement) après.</span>`
      );
      form.reset();
      const defaultRadio2 = form.querySelector('input[name="mode"][value="À discuter après l\'essai"]');
      if (defaultRadio2) defaultRadio2.checked = true;
    } catch (err) {
      console.error("[Super-Nat] Erreur envoi formulaire :", err);
      const msg = err && err.message ? escapeHtml(err.message) : "Une erreur est survenue.";
      showStatus(
        "error",
        `<strong>Oups — l'envoi a échoué.</strong><br>${msg}<br>
        Réessayez dans un instant ou écrivez-moi directement à <a href="mailto:contact@super-nat.fr" style="text-decoration:underline">contact@super-nat.fr</a>.<br>
        <span style="font-size:12px;opacity:0.7">Si le problème persiste, vérifiez que l'URL Apps Script est correcte et déployée en accès "Anyone".</span>`
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      if (textEl && originalText) textEl.textContent = originalText;
    }
  });
}

// Échappement HTML simple pour éviter l'injection dans les messages de statut
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Smooth scroll pour les ancres (amélioration progressive)
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", href);
    }
  });
});
