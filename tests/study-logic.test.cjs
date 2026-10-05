const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { localDateKey, parseLocalDate, isValidSession } = require("../study-logic.js");
const logic = require("../study-logic.js");

function session(date, minutes = 30) {
  return { date, topic: "Tema", minutes };
}

test("sumas exactas, notación exponencial y límite finito", () => {
  const exact = logic.toExactMinutes;
  const sum = values => values.map(exact).reduce(logic.addExactMinutes, exact(0));
  assert.equal(logic.compareExactMinutes(sum(Array(10).fill(0.1)), exact(1)), 0);
  assert.equal(logic.compareExactMinutes(sum([1e-7, 10, 0.2]), sum([0.2, 1e-7, 10])), 0);
  assert.equal(logic.isMinutesOverflow(exact(Number.MAX_VALUE)), false);
  assert.equal(logic.isMinutesOverflow(sum([Number.MAX_VALUE, Number.MAX_VALUE])), true);
  assert.equal(logic.compareExactMinutes(exact(Number.MIN_VALUE), exact(0)), 1);
});

test("niveles y presentación no redondean a otro intervalo", () => {
  const values = [0, 0.5, 29.999, 30, 59.999, 60, 119.999, 120];
  assert.deepEqual(values.map(value => logic.getHeatLevel(logic.toExactMinutes(value))), [0, 1, 1, 2, 2, 3, 3, 4]);
  for (const [value, text] of [[0, "0 min"], [12.5, "12,5 min"], [29.9999, "≈29,999 min"], [0.0004, "Menos de 0,001 min"]]) {
    assert.equal(logic.formatHeatMinutes(logic.toExactMinutes(value)).text, text);
  }
  assert.match(logic.formatHeatMinutes(logic.toExactMinutes(29.9999)).accessible, /Aproximadamente/);
  assert.doesNotMatch(logic.formatHeatMinutes(logic.toExactMinutes(1e100)).text, /e\+|Infinity/);
});

test("periodo local completo, duplicados, meses y futuras", () => {
  const today = parseLocalDate("2026-10-04");
  const rows = [session("2026-07-13", 10), session("2026-07-12", 90), session("2026-10-04", 10), session("2026-10-04", 20), session("2026-10-05", 90)];
  const before = JSON.stringify(rows);
  const model = logic.buildHeatMap(rows, today);
  assert.equal(model.status, "ready");
  assert.equal(model.start, "2026-07-13");
  assert.equal(model.end, "2026-10-04");
  assert.equal(model.days.length, 84);
  assert.equal(model.weeks.length, 12);
  assert.equal(model.days.at(-1).text, "30 min");
  assert.equal(model.days.at(-1).level, 2);
  assert.deepEqual(model.weeks.at(-1).months, ["septiembre", "octubre"]);
  assert.equal(JSON.stringify(rows), before);
  assert.equal(localDateKey(today), "2026-10-04");
  const next = logic.buildHeatMap([session("2026-10-06")], parseLocalDate("2026-10-05"));
  assert.equal(next.start, "2026-07-20");
  assert.equal(next.empty, true);
  assert.equal(next.days.at(-1).level, null);
  assert.equal(next.days.at(-1).total, null);
  assert.equal(logic.buildHeatMap([session("2026-10-06")], parseLocalDate("2026-10-06")).empty, false);
});

test("totales extremos compactos, redondeo y consulta decimal exacta", () => {
  const format = value => logic.formatHeatMinutes(logic.toExactMinutes(value));
  assert.equal(format(999999999).fullText, undefined);
  assert.equal(format(1e9).text, "1 × 10⁹ min");
  assert.equal(format(1e9).fullText, "1.000.000.000 min");
  assert.equal(format(1.2345e9).text, "≈1,235 × 10⁹ min");
  assert.equal(format(9.9999e9).text, "≈1 × 10¹⁰ min");
  assert.equal(format(Number.MAX_VALUE).text, "≈1,798 × 10³⁰⁸ min");
  assert.equal(format(Number.MAX_VALUE).accessible, "Aproximadamente 1,798 por diez elevado a 308 minutos");
  assert.match(format(Number.MAX_VALUE).fullText, /^179\.769\.313\.486\.231\.570/);
  assert.ok(format(Number.MAX_VALUE).text.length < 30);
  const total = logic.addExactMinutes(logic.toExactMinutes(1e9), logic.toExactMinutes(0.0001));
  assert.equal(logic.formatHeatMinutes(total).fullText, "1.000.000.000,0001 min");
  assert.equal(logic.getHeatLevel(total), 4);
});

test("lectura inválida global, historial vacío y exceso independiente", () => {
  for (const raw of ["{", "null", "{}", JSON.stringify([session("2023-02-29")]), JSON.stringify([session("9999-12-31", -1)])]) {
    assert.equal(logic.decodeSessions(raw).status, "read-error");
  }
  assert.deepEqual(logic.decodeSessions(null), { status: "ready", sessions: [] });
  assert.equal(logic.decodeSessions("[]").status, "ready");
  const today = parseLocalDate("2026-10-04");
  assert.equal(logic.buildHeatMap([session("2026-10-04", Number.MAX_VALUE), session("2026-10-04", Number.MAX_VALUE)], today).status, "overflow");
  const split = [session("2026-10-03", Number.MAX_VALUE), session("2026-10-04", Number.MAX_VALUE)];
  assert.equal(logic.buildHeatMap(split, today).status, "ready");
  assert.equal(logic.calculateWeeklyMinutes(split, today), null);
  assert.equal(logic.calculateStreak(split, today), 2);
});

test("navegación y selección respetan límites, retrocesos y errores", () => {
  const today = parseLocalDate("2026-10-04");
  assert.equal(logic.getNextHeatMapDate("2026-10-04", "ArrowDown", today), "2026-10-04");
  assert.equal(logic.getNextHeatMapDate("2026-10-04", "ArrowLeft", today), "2026-09-27");
  assert.equal(logic.getNextHeatMapDate("2026-09-27", "ArrowRight", today), "2026-10-04");
  assert.equal(logic.getNextHeatMapDate("2026-10-03", "ArrowDown", today), "2026-10-04");
  assert.equal(logic.getNextHeatMapDate("2026-10-03", "ArrowUp", today), "2026-10-02");
  assert.equal(logic.getNextHeatMapDate("2026-07-13", "ArrowUp", today), "2026-07-13");
  const resolve = logic.resolveHeatMapInteraction;
  assert.deepEqual(resolve("2026-10-04", "2026-10-04", "ready", "ready", parseLocalDate("2026-10-03")), { selected: "2026-10-03", focus: "2026-10-03" });
  assert.deepEqual(resolve("2026-10-03", null, "ready", "overflow", today), { selected: null, focus: null });
  assert.deepEqual(resolve("2026-10-03", "2026-10-03", "ready", "overflow", today), { selected: null, focus: "error" });
  assert.deepEqual(resolve(null, "error", "overflow", "ready", today), { selected: "2026-10-04", focus: "2026-10-04" });
});

test("regresión de los cuatro indicadores", () => {
  const today = parseLocalDate("2026-10-04");
  const rows = [session("2026-10-03", 10), session("2026-10-03", 20), session("2026-10-02", 5), session("2026-09-28", 3), session("2026-10-05", 90)];
  assert.equal(logic.calculateStreak(rows, today), 2);
  assert.equal(logic.calculateBestStreak(rows, today), 2);
  assert.equal(logic.calculateWeeklyMinutes(rows, today), 38);
  assert.equal(logic.calculateMonthlyStudyDays(rows, today), 2);
  const old = [session("2025-01-01"), session("2025-01-02"), session("2025-01-03")];
  assert.equal(logic.calculateBestStreak([...old, ...rows], today), 3);
  assert.equal(logic.calculateStreak([], today), 0);
  assert.equal(logic.calculateMonthlyStudyDays([session("2026-10-01"), session("2026-10-01"), session("2026-10-04")], today), 2);
});

test("calendarios y cambios horarios en tres zonas aisladas", () => {
  const { spawnSync } = require("node:child_process");
  const script = `const a=require('node:assert/strict'); const l=require(${JSON.stringify(join(__dirname, "../study-logic.js"))});
    for(const key of ['2024-02-29','2026-01-01','2026-03-08','2026-03-29','2026-04-05','2026-09-27','2026-10-25','2026-11-01']) {
      const today=l.parseLocalDate(key); today.setHours(0,30,0,0); const before=today.getTime(); const m=l.buildHeatMap([],today);
      a.equal(m.today,key); a.equal(m.days.length,84); a.equal(new Set(m.days.map(d=>d.date)).size,84);
      a.equal(l.parseLocalDate(m.start).getDay(),1); a.equal(l.parseLocalDate(m.end).getDay(),0); a.equal(today.getTime(),before);
    }`;
  for (const TZ of ["Europe/Madrid", "America/New_York", "Pacific/Auckland"]) {
    const result = spawnSync(process.execPath, ["-e", script], { env: { ...process.env, TZ }, encoding: "utf8" });
    assert.equal(result.status, 0, `${TZ}: ${result.stderr}`);
  }
});

test("las fechas locales conservan día, año de cuatro cifras y mediodía", () => {
  for (const value of ["2024-02-29", "2026-03-29", "2026-10-25", "0099-01-02", "0000-01-01"]) {
    const date = parseLocalDate(value);
    assert.equal(localDateKey(date), value);
    assert.equal(date.getHours(), 12);
    assert.equal(date.getMinutes(), 0);
  }
  const earlyMorning = new Date(2026, 9, 4, 0, 30);
  const originalTime = earlyMorning.getTime();
  assert.equal(localDateKey(earlyMorning), "2026-10-04");
  assert.equal(earlyMorning.getTime(), originalTime);
});

test("el analizador funciona sin consultar el reloj actual ni disponer de DOM", () => {
  class FixedDate extends Date {
    constructor(...args) {
      assert.ok(args.length > 0, "No debe consultar la fecha actual");
      super(...args);
    }
  }
  const context = vm.createContext({ Date: FixedDate });
  vm.runInContext(readFileSync(join(__dirname, "../study-logic.js"), "utf8"), context);
  assert.equal(context.localDateKey(context.parseLocalDate("2024-02-29")), "2024-02-29");
  assert.equal(context.isValidSession({ date: "2024-02-29", topic: "Tema", minutes: 0.5 }), true);
});

test("la validación acepta sesiones válidas sin modificar sus datos", () => {
  for (const date of ["2024-02-29", "0099-01-02", "9999-12-31"]) {
    const session = Object.freeze({ date, topic: " Tema ", minutes: 0.5 });
    assert.equal(isValidSession(session), true);
    assert.deepEqual(session, { date, topic: " Tema ", minutes: 0.5 });
  }
});

test("la validación rechaza fechas imposibles y sesiones inválidas", () => {
  const valid = { date: "2026-10-04", topic: "Tema", minutes: 30 };
  for (const date of ["2023-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-01-00", "26-01-01", "2026-1-01", "texto"]) {
    assert.equal(isValidSession({ ...valid, date }), false, date);
  }
  for (const minutes of [0, -1, NaN, Infinity, "30", null]) {
    assert.equal(isValidSession({ ...valid, minutes }), false);
  }
  for (const session of [null, undefined, {}, [], { ...valid, topic: "  " }, { ...valid, topic: 42 }, { ...valid, date: null }]) {
    assert.equal(isValidSession(session), false);
  }
});

test("HTML carga la lógica como script clásico antes de app.js, sin duplicar funciones", () => {
  const html = readFileSync(join(__dirname, "../index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(match => match[0]);
  const logicIndex = scripts.findIndex(script => script.includes('src="study-logic.js"'));
  const appIndex = scripts.findIndex(script => script.includes('src="app.js"'));
  assert.ok(logicIndex >= 0 && appIndex > logicIndex);
  for (const script of [scripts[logicIndex], scripts[appIndex]]) {
    assert.match(script, /\bdefer\b/);
    assert.doesNotMatch(script, /type\s*=\s*["']module["']/);
  }
  const app = readFileSync(join(__dirname, "../app.js"), "utf8");
  assert.doesNotMatch(app, /function\s+(localDateKey|parseLocalDate|isValidSession)\s*\(/);
});
