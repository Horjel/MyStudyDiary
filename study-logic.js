// Construimos la fecha con valores locales, sin convertirla a UTC.
function localDateKey(date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  // Base fija a mediodía: no depende del reloj ni de cambios cerca de medianoche.
  const date = new Date(2000, 0, 1, 12, 0, 0, 0);
  // setFullYear respeta también los años del 0000 al 0099.
  date.setFullYear(year, month - 1, day);
  return date;
}

function isValidSession(session) {
  return session !== null && typeof session === "object"
    && typeof session.date === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(session.date)
    && localDateKey(parseLocalDate(session.date)) === session.date
    && typeof session.topic === "string" && session.topic.trim() !== ""
    && Number.isFinite(session.minutes) && session.minutes > 0;
}

function validateSessions(sessions) {
  return Array.isArray(sessions) && sessions.every(isValidSession);
}

function decodeSessions(raw) {
  try {
    const sessions = raw === null ? [] : JSON.parse(raw);
    return validateSessions(sessions) ? { status: "ready", sessions } : { status: "read-error" };
  } catch {
    return { status: "read-error" };
  }
}

// Ejemplo: 12,5 son 125 unidades con una cifra decimal; 0,01 son 1 con dos.
// La notación exponencial también aparece en los Number ya guardados.
function toExactMinutes(value) {
  const [mantissa, exponentText = "0"] = String(value).toLowerCase().split("e");
  const [whole, fraction = ""] = mantissa.split(".");
  let coefficient = BigInt(whole + fraction);
  let scale = fraction.length - Number(exponentText);
  if (scale < 0) {
    coefficient *= 10n ** BigInt(-scale);
    scale = 0;
  }
  return { coefficient, scale };
}

function addExactMinutes(a, b) {
  const scale = Math.max(a.scale, b.scale);
  return {
    coefficient: a.coefficient * 10n ** BigInt(scale - a.scale) + b.coefficient * 10n ** BigInt(scale - b.scale),
    scale
  };
}

function compareExactMinutes(a, b) {
  const scale = Math.max(a.scale, b.scale);
  const left = a.coefficient * 10n ** BigInt(scale - a.scale);
  const right = b.coefficient * 10n ** BigInt(scale - b.scale);
  return left < right ? -1 : left > right ? 1 : 0;
}

function isMinutesOverflow(total) {
  return compareExactMinutes(total, { coefficient: BigInt(Number.MAX_VALUE), scale: 0 }) > 0;
}

function getHeatLevel(total) {
  if (total.coefficient === 0n) return 0;
  if (compareExactMinutes(total, toExactMinutes(30)) < 0) return 1;
  if (compareExactMinutes(total, toExactMinutes(60)) < 0) return 2;
  if (compareExactMinutes(total, toExactMinutes(120)) < 0) return 3;
  return 4;
}

function formatLargeHeatMinutes(total) {
  const digits = String(total.coefficient);
  let exponent = digits.length - total.scale - 1;
  let significant = BigInt(digits.slice(0, 4));
  // Solo se redondea la etiqueta; el acumulador exacto queda intacto.
  if (Number(digits[4] || "0") >= 5) significant += 1n;
  if (significant === 10000n) {
    significant = 1000n;
    exponent += 1;
  }
  const rounded = String(significant);
  const decimals = rounded.slice(1).replace(/0+$/, "");
  const mantissa = rounded[0] + (decimals ? `,${decimals}` : "");
  const approximate = /[1-9]/.test(digits.slice(4));
  const superscript = [...String(exponent)].map(digit => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]).join("");
  const divisor = 10n ** BigInt(total.scale);
  const whole = (total.coefficient / divisor).toLocaleString("es");
  const fraction = total.scale === 0 ? "" : String(total.coefficient % divisor).padStart(total.scale, "0").replace(/0+$/, "");
  return {
    text: `${approximate ? "≈" : ""}${mantissa} × 10${superscript} min`,
    accessible: `${approximate ? "Aproximadamente " : ""}${mantissa} por diez elevado a ${exponent} minutos`,
    fullText: `${whole}${fraction ? `,${fraction}` : ""} min`
  };
}

function formatHeatMinutes(total) {
  if (compareExactMinutes(total, toExactMinutes(1e9)) >= 0) return formatLargeHeatMinutes(total);
  if (total.coefficient > 0n && compareExactMinutes(total, toExactMinutes(0.001)) < 0) {
    return { text: "Menos de 0,001 min", accessible: "Menos de 0,001 minutos" };
  }
  const divisor = 10n ** BigInt(Math.max(0, total.scale - 3));
  const thousandths = total.scale > 3 ? total.coefficient / divisor : total.coefficient * 10n ** BigInt(3 - total.scale);
  const approximate = total.scale > 3 && total.coefficient % divisor !== 0n;
  const whole = (thousandths / 1000n).toLocaleString("es");
  const fraction = String(thousandths % 1000n).padStart(3, "0").replace(/0+$/, "");
  const value = whole + (fraction ? `,${fraction}` : "");
  return {
    text: `${approximate ? "≈" : ""}${value} min`,
    accessible: `${approximate ? "Aproximadamente " : ""}${value} minutos`
  };
}

function getHeatMapRange(today) {
  const todayKey = localDateKey(today);
  const monday = parseLocalDate(todayKey);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const end = new Date(monday.getTime());
  end.setDate(end.getDate() + 6);
  monday.setDate(monday.getDate() - 77);
  return { start: localDateKey(monday), end: localDateKey(end), today: todayKey };
}

function sumDailyMinutes(sessions, today) {
  const range = getHeatMapRange(today);
  const totals = new Map();
  for (const session of sessions) {
    if (session.date >= range.start && session.date <= range.today) {
      const previous = totals.get(session.date) || toExactMinutes(0);
      totals.set(session.date, addExactMinutes(previous, toExactMinutes(session.minutes)));
    }
  }
  return totals;
}

function buildHeatMap(sessions, today) {
  const range = getHeatMapRange(today);
  const totals = sumDailyMinutes(sessions, today);
  if ([...totals.values()].some(isMinutesOverflow)) return { status: "overflow" };
  const days = [];
  const weeks = [];
  const cursor = parseLocalDate(range.start);
  for (let column = 0; column < 12; column += 1) {
    const week = { start: localDateKey(cursor), months: [], days: [] };
    for (let row = 0; row < 7; row += 1) {
      const date = localDateKey(cursor);
      const future = date > range.today;
      const total = future ? null : totals.get(date) || toExactMinutes(0);
      const month = cursor.toLocaleDateString("es", { month: "long" });
      if (!week.months.includes(month)) week.months.push(month);
      const day = {
        date, column, row, future, isToday: date === range.today, total,
        level: future ? null : getHeatLevel(total),
        ...(future ? { text: "Día futuro", accessible: "Día futuro" } : formatHeatMinutes(total))
      };
      days.push(day);
      week.days.push(day);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return { status: "ready", ...range, days, weeks, empty: totals.size === 0 };
}

function getNextHeatMapDate(date, direction, today) {
  const steps = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
  if (!(direction in steps)) return date;
  const next = parseLocalDate(date);
  next.setDate(next.getDate() + steps[direction]);
  const key = localDateKey(next);
  const range = getHeatMapRange(today);
  return key < range.start || key > range.today ? date : key;
}

function resolveHeatMapInteraction(selected, focused, previousStatus, status, today) {
  if (status !== "ready") return { selected: null, focus: focused ? "error" : null };
  const range = getHeatMapRange(today);
  const available = date => date && date >= range.start && date <= range.today;
  return {
    selected: previousStatus === "ready" && available(selected) ? selected : range.today,
    focus: !focused ? null : available(focused) ? focused : range.today
  };
}

function calculateStreak(sessions, today) {
  const studyDays = new Set(sessions.map(session => session.date));
  const day = parseLocalDate(localDateKey(today));
  if (!studyDays.has(localDateKey(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (studyDays.has(localDateKey(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function calculateBestStreak(sessions, today) {
  const todayKey = localDateKey(today);
  const studyDays = [...new Set(sessions.map(session => session.date))].filter(date => date <= todayKey).sort();
  let streak = 0;
  let bestStreak = 0;
  let expectedDate = "";
  for (const date of studyDays) {
    streak = date === expectedDate ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
    const nextDay = parseLocalDate(date);
    nextDay.setDate(nextDay.getDate() + 1);
    expectedDate = localDateKey(nextDay);
  }
  return bestStreak;
}

function calculateWeeklyMinutes(sessions, today) {
  const todayKey = localDateKey(today);
  const monday = parseLocalDate(todayKey);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const mondayKey = localDateKey(monday);
  let total = toExactMinutes(0);
  for (const session of sessions) {
    if (session.date >= mondayKey && session.date <= todayKey) total = addExactMinutes(total, toExactMinutes(session.minutes));
  }
  return isMinutesOverflow(total) ? null : Number(`${total.coefficient}e-${total.scale}`);
}

function calculateMonthlyStudyDays(sessions, today) {
  const todayKey = localDateKey(today);
  const firstDay = parseLocalDate(todayKey);
  firstDay.setDate(1);
  const firstDayKey = localDateKey(firstDay);
  return new Set(sessions.filter(session => session.date >= firstDayKey && session.date <= todayKey).map(session => session.date)).size;
}

// Node importa estas funciones para los tests; el navegador usa el script clásico.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    localDateKey, parseLocalDate, isValidSession, validateSessions, decodeSessions,
    toExactMinutes, addExactMinutes, compareExactMinutes, isMinutesOverflow,
    getHeatLevel, formatHeatMinutes, getHeatMapRange, sumDailyMinutes, buildHeatMap,
    getNextHeatMapDate, resolveHeatMapInteraction,
    calculateStreak, calculateBestStreak, calculateWeeklyMinutes, calculateMonthlyStudyDays
  };
}
