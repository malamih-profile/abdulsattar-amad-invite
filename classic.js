const EVENT = {
  title: "خطوبة عبدالستار وأمد",
  start: "2026-11-20T19:00:00+03:00",
  place: "قاعة رؤية دجلة، بغداد – خدمي مطار بغداد، مقابيل كلية الرشيد",
  details: "دعوة خطوبة عبدالستار وأمد — الساعة السابعة مساءً",
};
const INTRO_LINES = [
  { at: 0.7, text: "عبدالستار & أمد" },
  { at: 3.5, text: "يتشرّفان بدعوتكم..." },
  { at: 6.4, text: "لمشاركتهما فرحة العمر" },
];
const SEED = [
  { name: "رنا", text: "ألف مبروك 💍 وعقبال ليلة العمر يا رب" },
  { name: "مصطفى", text: "ألف مبروك، خطوة مباركة وعقبال الفرحة الكبيرة" },
  { name: "زينب", text: "الله يتمم لكم على خير، فرحانين لكم من كل قلبنا" },
  { name: "أحمد", text: "مبارك! وعقبال ما نجتمع بفرحتكم الجاية 😄" },
  { name: "هبة", text: "أجمل خبر سمعناه اليوم، مبروك للحبيبين" },
];
const state = {
  guests: 0,
  attendance: "yes",
  muted: false,
  opened: false,
  captionIndex: -1,
  captionTimers: [],
};
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  holdFirstFrame($("introVideo"));
  $("introVideo").addEventListener("ended", revealSite);
  $("introVideo").addEventListener("timeupdate", syncCaptions);
  $("openDoor").addEventListener("click", openDoor);
  $("musicButton").addEventListener("click", toggleMusic);
  $("rsvpForm").addEventListener("submit", submitRsvp);
  $("minus").addEventListener("click", () => setGuests(state.guests - 1));
  $("plus").addEventListener("click", () => setGuests(state.guests + 1));
  document.querySelectorAll("#attendance .pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      state.attendance = pill.dataset.v;
      document.querySelectorAll("#attendance .pill").forEach((item) => {
        const on = item === pill;
        item.classList.toggle("is-on", on);
        item.setAttribute("aria-pressed", String(on));
      });
    });
  });
  setupCountdown();
  setupCalendar();
  renderWishes(loadWishes());
});

function holdFirstFrame(video) {
  if (!video) return;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  const freeze = () => {
    if (state.opened) return;
    try { video.currentTime = 0.08; } catch (error) {}
    video.pause();
  };
  ["loadedmetadata", "loadeddata", "canplay"].forEach((eventName) => {
    video.addEventListener(eventName, freeze);
  });
  if (video.readyState >= 1) freeze();
  // Soft muted play→pause so mobile browsers actually paint the first frame.
  const kick = video.play();
  if (kick && typeof kick.then === "function") {
    kick.then(() => {
      if (!state.opened) freeze();
    }).catch(() => {
      freeze();
    });
  }
}

function openDoor() {
  if (state.opened) return;
  state.opened = true;
  state.captionIndex = -1;
  $("gate").classList.add("is-open");
  const box = $("storyCaptions");
  const line = $("storyCaption");
  if (box && line) {
    box.hidden = false;
    line.textContent = "";
    line.classList.remove("is-in", "is-out");
  }
  const intro = $("introVideo");
  intro.muted = true;
  intro.currentTime = 0;
  intro.play().catch(() => revealSite());
  playMusic();
}

function syncCaptions() {
  if (!state.opened || $("gate").hidden) return;
  const time = Number($("introVideo").currentTime || 0);
  let index = -1;
  for (let i = INTRO_LINES.length - 1; i >= 0; i -= 1) {
    if (time >= INTRO_LINES[i].at) {
      index = i;
      break;
    }
  }
  if (index < 0 || index === state.captionIndex) return;
  showCaption(INTRO_LINES[index].text);
  state.captionIndex = index;
}

function showCaption(text) {
  const line = $("storyCaption");
  if (!line) return;
  clearCaptionTimers();
  line.classList.remove("is-in");
  line.classList.add("is-out");
  state.captionTimers.push(window.setTimeout(() => {
    line.textContent = text;
    line.classList.remove("is-out");
    void line.offsetWidth;
    line.classList.add("is-in");
  }, 280));
}

function clearCaptionTimers() {
  state.captionTimers.forEach((timer) => window.clearTimeout(timer));
  state.captionTimers = [];
}

function revealSite() {
  if ($("site") && !$("site").hidden) return;
  clearCaptionTimers();
  const box = $("storyCaptions");
  if (box) box.hidden = true;

  const flare = $("flare");
  const site = $("site");
  if (flare) {
    flare.classList.remove("is-on");
    void flare.offsetWidth;
    flare.classList.add("is-on");
  }

  site.hidden = false;
  site.classList.add("is-revealing");
  document.body.classList.remove("locked");

  window.setTimeout(() => {
    $("gate").hidden = true;
    window.scrollTo(0, 0);
    site.classList.add("is-ready");
  }, 320);

  window.setTimeout(() => {
    site.classList.remove("is-revealing");
    if (flare) flare.classList.remove("is-on");
  }, 1300);
}

function setupCountdown() {
  const target = new Date(EVENT.start).getTime();
  const paint = () => {
    const distance = target - Date.now();
    if (distance <= 0) {
      $("clock").hidden = true;
      $("arrived").hidden = false;
      return;
    }
    const day = 86400000;
    const hour = 3600000;
    const minute = 60000;
    $("days").textContent = arabic(Math.floor(distance / day));
    $("hours").textContent = arabic(Math.floor((distance % day) / hour)).padStart(2, "٠");
    $("minutes").textContent = arabic(Math.floor((distance % hour) / minute)).padStart(2, "٠");
    $("seconds").textContent = arabic(Math.floor((distance % minute) / 1000)).padStart(2, "٠");
  };
  paint();
  window.setInterval(paint, 1000);
}

function arabic(value) {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[digit]);
}

function setupCalendar() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: "20261120T190000/20261120T230000",
    ctz: "Asia/Baghdad",
    location: EVENT.place,
    details: EVENT.details,
  });
  $("googleCal").href = "https://calendar.google.com/calendar/render?" + params.toString();
  $("appleCal").addEventListener("click", (event) => {
    event.preventDefault();
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "DTSTART:20261120T160000Z",
      "DTEND:20261120T200000Z",
      "SUMMARY:" + EVENT.title,
      "LOCATION:" + EVENT.place,
      "DESCRIPTION:" + EVENT.details,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const file = new Blob([ics], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "abdulstar-amad.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

function setGuests(value) {
  state.guests = Math.max(0, Math.min(20, value));
  $("guestCount").textContent = arabic(state.guests);
}

function loadWishes() {
  try {
    const saved = JSON.parse(localStorage.getItem("classic-wishes") || "null");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (error) {}
  return SEED.slice();
}

function renderWishes(items) {
  const list = $("wishList");
  list.replaceChildren();
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "wish";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const text = document.createElement("p");
    text.textContent = item.text;
    card.append(name, text);
    list.appendChild(card);
  });
}

function submitRsvp(event) {
  event.preventDefault();
  const name = $("guestName").value.trim();
  const text = $("wishText").value.trim();
  if (!name) return;
  const wishes = loadWishes();
  if (text) wishes.unshift({ name, text });
  localStorage.setItem("classic-wishes", JSON.stringify(wishes));
  localStorage.setItem("classic-rsvp", JSON.stringify({
    name,
    attendance: state.attendance,
    guests: state.guests,
    text,
  }));
  renderWishes(wishes);
  $("formNote").hidden = false;
  event.target.reset();
  setGuests(0);
}

function playMusic() {
  const music = $("bgMusic");
  if (!music) return;
  music.loop = true;
  music.muted = state.muted;
  music.volume = 0.85;
  if (music.paused) {
    music.currentTime = 0;
    music.play().catch(() => {});
  }
}

function toggleMusic() {
  const music = $("bgMusic");
  if (!music) return;
  state.muted = !state.muted;
  music.muted = state.muted;
  $("musicButton").classList.toggle("is-muted", state.muted);
  $("musicButton").setAttribute("aria-pressed", String(state.muted));
  if (!state.muted && state.opened && music.paused) music.play().catch(() => {});
}