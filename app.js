const STORAGE_KEY = "diario-estudio-sesiones";
const form = document.querySelector("#session-form");
const fields = document.querySelector("#session-fields");
const dateInput = document.querySelector("#date");
const topicInput = document.querySelector("#topic");
const minutesInput = document.querySelector("#minutes");
const message = document.querySelector("#message");
const sessionList = document.querySelector("#session-list");
const heatTable = document.querySelector("#heat-table");
const heatError = document.querySelector("#heat-error");
const heatDetail = document.querySelector("#heat-detail");
const heatButtons = new Map();
const READ_ERROR = "No se puede leer el historial. Recarga la página para volver a intentarlo";
const OVERFLOW_ERROR = "No se puede mostrar la actividad porque un total diario es demasiado grande";

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function loadSessions() {
  try {
    return decodeSessions(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { status: "read-error" };
  }
}

function fullDate(date) {
  return parseLocalDate(date).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function renderStatistics(today) {
  if (!canReadSessions) {
    for (const id of ["streak-count", "best-streak-count", "weekly-minutes-count", "monthly-days-count"]) {
      document.querySelector(`#${id}`).textContent = "No disponible";
    }
    for (const id of ["streak-unit", "best-streak-unit", "weekly-minutes-unit", "monthly-days-unit"]) {
      document.querySelector(`#${id}`).textContent = "";
    }
    document.querySelector("#streak-message").textContent = READ_ERROR;
    return;
  }
  const streak = calculateStreak(sessions, today);
  const best = calculateBestStreak(sessions, today);
  const weekly = calculateWeeklyMinutes(sessions, today);
  const monthly = calculateMonthlyStudyDays(sessions, today);
  document.querySelector("#streak-count").textContent = streak;
  document.querySelector("#streak-unit").textContent = streak === 1 ? "día" : "días";
  document.querySelector("#best-streak-count").textContent = best;
  document.querySelector("#best-streak-unit").textContent = best === 1 ? "día" : "días";
  document.querySelector("#weekly-minutes-count").textContent = weekly === null ? "No disponible" : weekly.toLocaleString("es");
  document.querySelector("#weekly-minutes-unit").textContent = weekly === null ? "" : "min";
  document.querySelector("#monthly-days-count").textContent = monthly;
  document.querySelector("#monthly-days-unit").textContent = monthly === 1 ? "día" : "días";
  const studiedToday = sessions.some(session => session.date === localDateKey(today));
  document.querySelector("#streak-message").textContent = studiedToday
    ? "¡Hoy ya has sumado un día de estudio!"
    : streak > 0 ? "Tu racha sigue viva. Estudia hoy para mantenerla" : "Registra una sesión de hoy para empezar tu racha";
}

function renderSessions() {
  sessionList.replaceChildren();
  const empty = document.querySelector("#empty-message");
  empty.hidden = canReadSessions && sessions.length > 0;
  empty.textContent = canReadSessions
    ? "Tu diario empieza con una sesión. Completa el formulario de arriba para guardarla aquí."
    : READ_ERROR;
  if (!canReadSessions) return;
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const session of sorted) {
    const item = document.createElement("li");
    const details = document.createElement("div");
    details.className = "session-details";
    const topic = document.createElement("span");
    topic.className = "session-topic";
    topic.textContent = session.topic;
    const date = document.createElement("time");
    date.className = "session-date";
    date.dateTime = session.date;
    date.textContent = fullDate(session.date);
    const minutes = document.createElement("span");
    minutes.className = "session-minutes";
    minutes.textContent = `${session.minutes.toLocaleString("es")} min`;
    details.append(topic, date);
    item.append(details, minutes);
    sessionList.append(item);
  }
}

function renderHeatSelection() {
  for (const [date, button] of heatButtons) {
    button.setAttribute("aria-pressed", String(date === selectedHeatDate));
    button.tabIndex = date === selectedHeatDate ? 0 : -1;
  }
  const day = heatModel.days.find(day => day.date === selectedHeatDate);
  const fullTotal = document.querySelector("#heat-full-total");
  if (fullTotal.dataset.date !== day.date) fullTotal.open = false;
  fullTotal.dataset.date = day.date;
  fullTotal.hidden = !day.fullText;
  document.querySelector("#heat-full-value").textContent = day.fullText || "";
  const prefix = `${fullDate(day.date)}${day.isToday ? " (hoy)" : ""}: `;
  const text = prefix + day.accessible;
  // No repetir el anuncio si únicamente cambia el foco o se comprueba el reloj.
  if (heatDetail.dataset.announcement !== text) {
    const visible = document.createElement("span");
    visible.setAttribute("aria-hidden", "true");
    visible.textContent = prefix + day.text;
    const accessible = document.createElement("span");
    accessible.className = "visually-hidden";
    accessible.textContent = text;
    heatDetail.replaceChildren(visible, accessible);
    heatDetail.dataset.announcement = text;
  }
}

function focusHeatDate(date) {
  const button = heatButtons.get(date);
  if (button) {
    button.focus({ preventScroll: true });
    button.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }
}

function renderHeatMap(today) {
  const active = document.activeElement;
  const fullTotal = document.querySelector("#heat-full-total");
  const focusedInFullTotal = fullTotal.contains(active);
  const focused = active === heatError ? "error"
    : focusedInFullTotal ? selectedHeatDate
    : heatTable.contains(active) ? active.dataset.date : null;
  const previousStatus = heatModel.status;
  heatModel = canReadSessions ? buildHeatMap(sessions, today) : { status: "read-error" };
  const interaction = resolveHeatMapInteraction(selectedHeatDate, focused, previousStatus, heatModel.status, today);
  selectedHeatDate = interaction.selected;
  const ready = heatModel.status === "ready";
  document.querySelector("#heat-content").hidden = !ready;
  heatError.hidden = ready;
  heatTable.replaceChildren();
  heatButtons.clear();
  if (!ready) {
    const text = heatModel.status === "read-error" ? READ_ERROR : OVERFLOW_ERROR;
    if (heatError.textContent !== text) heatError.textContent = text;
    heatDetail.textContent = "";
    heatDetail.dataset.announcement = "";
    const fullTotal = document.querySelector("#heat-full-total");
    fullTotal.hidden = true;
    fullTotal.open = false;
    fullTotal.dataset.date = "";
    document.querySelector("#heat-full-value").textContent = "";
    if (interaction.focus === "error") heatError.focus();
    return;
  }
  heatError.textContent = "";
  document.querySelector("#heat-range").textContent = `${fullDate(heatModel.start)} — ${fullDate(heatModel.end)}`;
  document.querySelector("#heat-today").textContent = `Actividad hasta hoy: ${fullDate(heatModel.today)}`;
  document.querySelector("#heat-empty").hidden = !heatModel.empty;

  const head = document.createElement("thead");
  const headings = document.createElement("tr");
  const corner = document.createElement("th");
  corner.scope = "col";
  corner.textContent = "Día";
  headings.append(corner);
  let previousMonth = "";
  for (const week of heatModel.weeks) {
    const heading = document.createElement("th");
    heading.scope = "col";
    for (const month of week.months.filter(month => month !== previousMonth)) {
      const label = document.createElement("span");
      label.className = "heat-month";
      label.textContent = month.slice(0, 3);
      heading.append(label);
    }
    heading.setAttribute("aria-label", `Semana del ${fullDate(week.start)}: ${week.months.join(" y ")}`);
    previousMonth = week.months.at(-1);
    headings.append(heading);
  }
  head.append(headings);
  const body = document.createElement("tbody");
  const names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  names.forEach((name, row) => {
    const line = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = name.slice(0, 3);
    label.setAttribute("aria-label", name);
    line.append(label);
    for (const week of heatModel.weeks) {
      const day = week.days[row];
      const cell = document.createElement("td");
      const square = document.createElement(day.future ? "span" : "button");
      square.className = day.future ? "heat-day heat-future" : `heat-day heat-level-${day.level}`;
      square.setAttribute("aria-label", `${fullDate(day.date)}${day.isToday ? ", hoy" : ""}: ${day.accessible}`);
      if (day.future) {
        square.setAttribute("role", "img");
        square.textContent = "·";
      } else {
        square.type = "button";
        square.dataset.date = day.date;
        if (day.isToday) { square.setAttribute("aria-current", "date"); square.textContent = "•"; }
        heatButtons.set(day.date, square);
      }
      cell.append(square);
      line.append(cell);
    }
    body.append(line);
  });
  heatTable.append(head, body);
  renderHeatSelection();
  if (interaction.focus && !(focusedInFullTotal && !fullTotal.hidden && selectedHeatDate === focused)) {
    focusHeatDate(interaction.focus);
  }
}

function updateIndicators(today) {
  currentDay = localDateKey(today);
  renderStatistics(today);
  renderHeatMap(today);
}

function checkDayChange() {
  const today = new Date();
  const key = localDateKey(today);
  if (key === currentDay) return;
  if (dateInput.value === currentDay) dateInput.value = key;
  updateIndicators(today);
}

heatTable.addEventListener("click", event => {
  const date = event.target.closest("button[data-date]")?.dataset.date;
  checkDayChange();
  if (!date || !heatButtons.has(date)) return;
  selectedHeatDate = date;
  renderHeatSelection();
  focusHeatDate(date);
});

heatTable.addEventListener("keydown", event => {
  const originalDate = event.target.dataset.date;
  checkDayChange();
  if (!heatButtons.size || !originalDate) return;
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const date = heatButtons.has(originalDate) ? originalDate : selectedHeatDate;
  focusHeatDate(getNextHeatMapDate(date, event.key, parseLocalDate(currentDay)));
});

// Tab sale desde la casilla recorrida; al regresar entra por la selección.
heatTable.addEventListener("focusin", event => {
  checkDayChange();
  for (const button of heatButtons.values()) button.tabIndex = button === event.target ? 0 : -1;
});
heatTable.addEventListener("focusout", event => {
  if (!heatTable.contains(event.relatedTarget)) {
    for (const [date, button] of heatButtons) button.tabIndex = date === selectedHeatDate ? 0 : -1;
  }
});

// Comprobar antes de la activación nativa: no abrir un total que acaba de caducar.
function checkFullTotalInteraction(event) {
  const selectedBefore = selectedHeatDate;
  checkDayChange();
  if (heatModel.status !== "ready" || selectedHeatDate !== selectedBefore
    || document.querySelector("#heat-full-total").hidden) {
    event.preventDefault();
  }
}

const fullTotalControl = document.querySelector("#heat-full-total");
fullTotalControl.addEventListener("click", checkFullTotalInteraction);
fullTotalControl.addEventListener("keydown", checkFullTotalInteraction);
fullTotalControl.addEventListener("focusin", checkDayChange);

topicInput.addEventListener("input", () => topicInput.setCustomValidity(""));
minutesInput.addEventListener("input", () => minutesInput.setCustomValidity(""));
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!canReadSessions) { showMessage(READ_ERROR, true); return; }
  const topic = topicInput.value.trim();
  const minutes = minutesInput.valueAsNumber;
  topicInput.setCustomValidity(topic ? "" : "Escribe un tema.");
  minutesInput.setCustomValidity(Number.isFinite(minutes) && minutes > 0 ? "" : "Introduce un número de minutos mayor que 0.");
  if (!form.reportValidity()) return;
  const session = { date: dateInput.value, topic, minutes };
  if (!isValidSession(session)) { showMessage("Introduce una fecha válida con un año de cuatro cifras.", true); return; }
  const updated = [session, ...sessions];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    updateIndicators(new Date());
    showMessage("No se pudo guardar la sesión. Comprueba que el navegador permite el almacenamiento local y vuelve a intentarlo.", true);
    return;
  }
  sessions = updated;
  const today = new Date();
  form.reset();
  dateInput.value = localDateKey(today);
  renderSessions();
  updateIndicators(today);
  showMessage("Sesión guardada.");
});

const loaded = loadSessions();
const canReadSessions = loaded.status === "ready";
let sessions = canReadSessions ? loaded.sessions : [];
let currentDay = "";
let heatModel = { status: "initial" };
let selectedHeatDate = null;
fields.disabled = !canReadSessions;
const initialToday = new Date();
dateInput.value = localDateKey(initialToday);
renderSessions();
updateIndicators(initialToday);
setInterval(checkDayChange, 15000);
window.addEventListener("focus", checkDayChange);
window.addEventListener("pageshow", checkDayChange);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkDayChange();
});
