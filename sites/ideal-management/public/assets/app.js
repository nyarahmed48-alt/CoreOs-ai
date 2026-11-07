/**
 * Ideal Management — site behaviour.
 *
 * Three independent pieces, each guarded so a missing element on some future
 * page cannot take the others down with it:
 *   1. navigation (mobile menu, sticky header state)
 *   2. the CV Pool forms (file picker + AJAX submit to Netlify Forms)
 *   3. Ideal AI (the chat widget, talking to /api/ideal-chat)
 *
 * No build step and no dependencies: this file ships as written.
 */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ========================================================= navigation === */

  const nav = $("#nav");
  const navToggle = $("#nav-toggle");
  const navLinks = $("#nav-links");

  if (navToggle && navLinks) {
    const setOpen = (open) => {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      navLinks.classList.toggle("is-open", open);
    };

    navToggle.addEventListener("click", () => {
      setOpen(navToggle.getAttribute("aria-expanded") !== "true");
    });

    // Tapping a link on mobile should navigate and close, not leave the menu
    // covering the section it just jumped to.
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  if (nav) {
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ====================================================== CV file picker == */

  const MAX_CV_BYTES = 8 * 1024 * 1024;

  const dropzone = $("#dropzone");
  const cvFile = $("#cv-file");
  const dropzoneText = $("#dropzone-text");

  if (dropzone && cvFile && dropzoneText) {
    const describe = (file) => {
      const mb = file.size / (1024 * 1024);
      const size = mb < 0.1 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${mb.toFixed(1)} MB`;
      return `${file.name} · ${size}`;
    };

    const showFile = () => {
      const file = cvFile.files && cvFile.files[0];
      if (!file) {
        dropzone.classList.remove("has-file");
        dropzoneText.innerHTML = "<strong>Choose a file</strong> or drop it here";
        return;
      }
      if (file.size > MAX_CV_BYTES) {
        // Rejecting here beats a 20-second upload that ends in a 413.
        cvFile.value = "";
        dropzone.classList.remove("has-file");
        dropzoneText.innerHTML = "<strong>That file is over 8 MB.</strong> Please choose a smaller one.";
        return;
      }
      dropzone.classList.add("has-file");
      dropzoneText.textContent = describe(file);
    };

    cvFile.addEventListener("change", showFile);

    ["dragenter", "dragover"].forEach((type) =>
      dropzone.addEventListener(type, (event) => {
        event.preventDefault();
        dropzone.classList.add("is-dragging");
      }),
    );
    ["dragleave", "drop"].forEach((type) =>
      dropzone.addEventListener(type, () => dropzone.classList.remove("is-dragging")),
    );

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      const dropped = event.dataTransfer && event.dataTransfer.files;
      if (dropped && dropped.length) {
        cvFile.files = dropped;
        showFile();
      }
    });
  }

  /* ========================================================= form submit == */

  /**
   * Netlify Forms accepts a normal POST to any path on the site as long as the
   * body carries `form-name`. Submitting over fetch keeps the visitor on the
   * page — and, for the CV form, lets us keep the file in a FormData body
   * rather than navigating away mid-upload.
   */
  function wireForm(form, { statusEl, button, busyLabel, done }) {
    if (!form) return;

    const idleLabel = button ? button.textContent : "";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      statusEl.textContent = "";
      statusEl.className = "form__status";
      if (button) {
        button.disabled = true;
        button.textContent = busyLabel;
      }

      try {
        const body = new FormData(form);
        const response = await fetch(form.getAttribute("action") || "/", {
          method: "POST",
          body,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const panel = form.parentElement;
        form.remove();
        const success = document.createElement("div");
        success.className = "form-done";
        success.innerHTML = done;
        panel.appendChild(success);
        success.setAttribute("tabindex", "-1");
        success.focus();
      } catch (error) {
        console.error("Form submission failed", error);
        statusEl.className = "form__status is-error";
        statusEl.textContent =
          "That did not go through. Please try again, or call or WhatsApp +964 772 252 1000, or email imanagement19@gmail.com, and we will pick it up from there.";
        if (button) {
          button.disabled = false;
          button.textContent = idleLabel;
        }
      }
    });
  }

  wireForm($("#cv-form"), {
    statusEl: $("#cv-status"),
    button: $("#cv-submit"),
    busyLabel: "Uploading…",
    done: `
      <span class="form-done__badge" aria-hidden="true">✓</span>
      <h4>You are in the pool.</h4>
      <p>
        A consultant reads every CV that comes in — usually within two working days.
        If you match a live role we will call you before your details go anywhere near
        an employer.
      </p>
      <p>Want your details removed? Message us on +964 772 252 1000 or email imanagement19@gmail.com and it is done that day.</p>
    `,
  });

  wireForm($("#hire-form"), {
    statusEl: $("#hire-status"),
    button: $("#hire-submit"),
    busyLabel: "Sending…",
    done: `
      <span class="form-done__badge" aria-hidden="true">✓</span>
      <h4>Request received.</h4>
      <p>
        One of our consultants will come back to you within one working day with first
        thoughts on the role and who we already have for it.
      </p>
    `,
  });

  wireForm($("#contact-form"), {
    statusEl: $("#contact-status"),
    button: $("#contact-submit"),
    busyLabel: "Sending…",
    done: `
      <span class="form-done__badge" aria-hidden="true">✓</span>
      <h4>Message sent.</h4>
      <p>
        We have your number and we will call you back within one working day. If it is
        urgent, ring or WhatsApp us on
        <a href="tel:+9647722521000">+964 772 252 1000</a> and skip the queue.
      </p>
    `,
  });

  /* ============================================================ Ideal AI == */

  const CHAT_ENDPOINT = "/api/ideal-chat";
  /** Turns sent back as context. Enough to hold a thread, small enough to stay cheap. */
  const HISTORY_LIMIT = 10;

  const fab = $("#chat-fab");
  const panel = $("#chat-panel");
  const log = $("#chat-log");
  const chatForm = $("#chat-form");
  const input = $("#chat-input");
  const sendBtn = $("#chat-send");
  const suggestions = $("#chat-suggestions");

  if (fab && panel && log && chatForm && input) {
    /** @type {{role: "user"|"assistant", content: string}[]} */
    const history = [];
    let greeted = false;
    let busy = false;

    const scrollDown = () => {
      log.scrollTop = log.scrollHeight;
    };

    const addBubble = (role, text) => {
      const el = document.createElement("p");
      el.className = `bubble bubble--${role === "user" ? "user" : "ai"}`;
      el.textContent = text;
      log.appendChild(el);
      scrollDown();
      return el;
    };

    const addTyping = () => {
      const el = document.createElement("p");
      el.className = "bubble bubble--ai";
      el.innerHTML = '<span class="chat__typing"><i></i><i></i><i></i></span>';
      log.appendChild(el);
      scrollDown();
      return el;
    };

    const openChat = (open) => {
      panel.hidden = !open;
      fab.setAttribute("aria-expanded", String(open));
      if (!open) return;
      if (!greeted) {
        greeted = true;
        addBubble(
          "assistant",
          "Hi — I'm Ideal AI, the assistant for Ideal Management. Ask me about our services, how the CV Pool works, or what happens after you apply. If something needs a person, I'll say so.",
        );
      }
      input.focus();
    };

    fab.addEventListener("click", () => openChat(panel.hidden));
    const closeBtn = $("#chat-close");
    if (closeBtn) closeBtn.addEventListener("click", () => openChat(false));
    $$("[data-open-chat]").forEach((el) => el.addEventListener("click", () => openChat(true)));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        openChat(false);
        fab.focus();
      }
    });

    const send = async (text) => {
      const message = text.trim();
      if (!message || busy) return;

      busy = true;
      if (sendBtn) sendBtn.disabled = true;
      if (suggestions) suggestions.hidden = true;
      input.value = "";

      addBubble("user", message);
      const typing = addTyping();

      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message, history: history.slice(-HISTORY_LIMIT) }),
        });

        // The endpoint answers with JSON on every path it controls, including
        // its own failures — so a parse error here means something in front of
        // it (a proxy, a 502 page) answered instead.
        const payload = await response.json().catch(() => null);
        const reply = payload && typeof payload.reply === "string" ? payload.reply.trim() : "";

        typing.remove();

        if (!reply) {
          addBubble(
            "assistant",
            (payload && payload.message) ||
              "I couldn't reach my assistant service just now. Please try again in a moment, or contact us on +964 772 252 1000.",
          );
        } else {
          addBubble("assistant", reply);
          history.push({ role: "user", content: message }, { role: "assistant", content: reply });
        }
      } catch (error) {
        console.error("Ideal AI request failed", error);
        typing.remove();
        addBubble(
          "assistant",
          "I'm having trouble connecting. Check your network and try again — or contact us on +964 772 252 1000 and a person will answer.",
        );
      } finally {
        busy = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
      }
    };

    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      send(input.value);
    });

    if (suggestions) {
      suggestions.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (button) send(button.textContent || "");
      });
    }
  }
})();
