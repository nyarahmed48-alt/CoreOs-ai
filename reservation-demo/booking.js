/**
 * Customer booking form — inserts one row into `reservations` and shows an
 * instant confirmation. Arabic (RTL) is the default language; the toggle in
 * the top bar flips the whole page to English (LTR) with no reload.
 */
(function () {
  "use strict";

  const STRINGS = {
    ar: {
      "brand.name": "مطعم لومير",
      "brand.tagline": "حجز طاولة فوري",
      "lang.ar": "عربي",
      "lang.en": "EN",
      "banner.setupTitle": "Supabase غير متصل بعد",
      "banner.setupBody":
        'انسخ ملف <code>config.example.js</code> إلى <code>config.js</code> وأدخل بيانات مشروعك في Supabase.',
      "form.title": "احجز طاولتك",
      "form.subtitle": "املأ التفاصيل أدناه وسنؤكد حجزك فورًا.",
      "form.date": "التاريخ",
      "form.dateError": "يرجى اختيار تاريخ صالح.",
      "form.time": "الوقت",
      "form.timeError": "يرجى اختيار وقت صالح.",
      "form.guests": "عدد الأشخاص",
      "form.guestsError": "أدخل عدد أشخاص بين 1 و50.",
      "form.phone": "رقم الهاتف",
      "form.optional": "(اختياري)",
      "form.phonePlaceholder": "07xx xxx xxxx",
      "form.submit": "تأكيد الحجز",
      "form.submitting": "جارٍ الإرسال...",
      "form.note": "سيتم التواصل معك فقط إذا احتجنا لتأكيد أي تفاصيل.",
      "form.submitError": "تعذّر إرسال الحجز. حاول مرة أخرى.",
      "confirm.title": "تم تأكيد حجزك!",
      "confirm.body": "نتطلع لاستقبالك. إليك تفاصيل الحجز:",
      "confirm.date": "التاريخ",
      "confirm.time": "الوقت",
      "confirm.guests": "عدد الأشخاص",
      "confirm.phone": "رقم الهاتف",
      "confirm.phoneNotProvided": "لم يُقدَّم",
      "confirm.newBooking": "إجراء حجز آخر",
      "footer.note": "حجز تجريبي — مدعوم بواسطة Supabase",
    },
    en: {
      "brand.name": "Lumière Restaurant",
      "brand.tagline": "Instant table booking",
      "lang.ar": "عربي",
      "lang.en": "EN",
      "banner.setupTitle": "Supabase not connected yet",
      "banner.setupBody":
        'Copy <code>config.example.js</code> to <code>config.js</code> and fill in your Supabase project details.',
      "form.title": "Reserve your table",
      "form.subtitle": "Fill in the details below and we'll confirm instantly.",
      "form.date": "Date",
      "form.dateError": "Please choose a valid date.",
      "form.time": "Time",
      "form.timeError": "Please choose a valid time.",
      "form.guests": "Number of guests",
      "form.guestsError": "Enter a guest count between 1 and 50.",
      "form.phone": "Phone number",
      "form.optional": "(optional)",
      "form.phonePlaceholder": "07xx xxx xxxx",
      "form.submit": "Confirm reservation",
      "form.submitting": "Submitting...",
      "form.note": "We'll only reach out if we need to confirm any details.",
      "form.submitError": "Couldn't submit your reservation. Please try again.",
      "confirm.title": "Reservation confirmed!",
      "confirm.body": "We look forward to seeing you. Here are your details:",
      "confirm.date": "Date",
      "confirm.time": "Time",
      "confirm.guests": "Guests",
      "confirm.phone": "Phone",
      "confirm.phoneNotProvided": "Not provided",
      "confirm.newBooking": "Make another reservation",
      "footer.note": "Demo booking — powered by Supabase",
    },
  };

  const STORAGE_KEY = "reservation-demo.lang";
  let lang = localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ar";

  function t(key) {
    return STRINGS[lang][key] ?? key;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.innerHTML = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = t(key);
    });

    document.getElementById("lang-ar-label").classList.toggle("active", lang === "ar");
    document.getElementById("lang-en-label").classList.toggle("active", lang === "en");

    localStorage.setItem(STORAGE_KEY, lang);
  }

  document.getElementById("lang-toggle").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    applyLang();
  });

  applyLang();

  // ------------------------------------------------------------ Supabase

  const configured =
    typeof window.SUPABASE_URL === "string" &&
    typeof window.SUPABASE_ANON_KEY === "string" &&
    window.SUPABASE_URL.startsWith("http") &&
    !window.SUPABASE_URL.includes("YOUR-PROJECT-REF");

  const banner = document.getElementById("config-banner");
  if (!configured) {
    banner.classList.add("visible");
  }

  const client = configured
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  // ------------------------------------------------------------ Form

  const form = document.getElementById("reservation-form");
  const submitBtn = document.getElementById("submit-btn");
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  const guestsInput = document.getElementById("guests");
  const phoneInput = document.getElementById("phone");

  // No booking in the past.
  dateInput.min = new Date().toISOString().slice(0, 10);

  function setFieldError(fieldId, hasError) {
    document.getElementById(fieldId).classList.toggle("has-error", hasError);
  }

  function validate() {
    let valid = true;

    const hasDate = Boolean(dateInput.value);
    setFieldError("field-date", !hasDate);
    valid = valid && hasDate;

    const hasTime = Boolean(timeInput.value);
    setFieldError("field-time", !hasTime);
    valid = valid && hasTime;

    const guests = Number(guestsInput.value);
    const validGuests = Number.isInteger(guests) && guests >= 1 && guests <= 50;
    setFieldError("field-guests", !validGuests);
    valid = valid && validGuests;

    return valid;
  }

  [dateInput, timeInput, guestsInput].forEach((el) => {
    el.addEventListener("input", validate);
  });

  function formatDate(value) {
    const d = new Date(`${value}T00:00:00`);
    return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(value) {
    const [h, m] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function showConfirmation({ date, time, guests, phone }) {
    document.getElementById("confirm-date").textContent = formatDate(date);
    document.getElementById("confirm-time").textContent = formatTime(time);
    document.getElementById("confirm-guests").textContent = guests;
    document.getElementById("confirm-phone").textContent =
      phone || t("confirm.phoneNotProvided");

    document.getElementById("form-view").style.display = "none";
    document.getElementById("confirm-view").classList.add("visible");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validate()) return;

    if (!client) {
      banner.classList.add("visible");
      return;
    }

    const payload = {
      reservation_date: dateInput.value,
      reservation_time: timeInput.value,
      guest_count: Number(guestsInput.value),
      phone_number: phoneInput.value.trim() || null,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = t("form.submitting");

    const { error } = await client.from("reservations").insert(payload);

    submitBtn.disabled = false;
    submitBtn.textContent = t("form.submit");

    if (error) {
      console.error("Reservation insert failed:", error);
      alert(t("form.submitError"));
      return;
    }

    showConfirmation({
      date: dateInput.value,
      time: timeInput.value,
      guests: payload.guest_count,
      phone: payload.phone_number,
    });
  });

  document.getElementById("new-reservation-btn").addEventListener("click", () => {
    form.reset();
    ["field-date", "field-time", "field-guests"].forEach((id) => setFieldError(id, false));
    document.getElementById("confirm-view").classList.remove("visible");
    document.getElementById("form-view").style.display = "";
  });
})();
