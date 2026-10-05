const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");

// Solo los elementos y eventos que coordina app.js; el navegador verifica el resto.
function startApp(options = {}) {
  const events = {};
  const elements = new Map();
  let now = new Date(2026, 9, 4, 12).getTime();
  let raw = options.raw ?? null;
  let writes = 0;
  let reads = 0;
  class Element {
    constructor() {
      this.children = []; this.dataset = {}; this.attributes = {};
      this.value = ""; this.textContent = ""; this.hidden = false;
      this.classList = { toggle() {} };
    }
    append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, callback) { this[name] = callback; }
    setCustomValidity() {}
    reportValidity() { return true; }
    reset() {}
    focus() { document.activeElement = this; }
    scrollIntoView() {}
    contains(target) { return this === target || this.children.some(child => child.contains?.(target)); }
    closest() { return this.dataset.date ? this : null; }
  }
  const get = selector => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  const document = {
    activeElement: null, visibilityState: "visible",
    querySelector: get, createElement: () => new Element(),
    addEventListener(name, callback) { events[name] = callback; }
  };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const context = vm.createContext({
    Date: Clock, document,
    localStorage: {
      getItem() { reads += 1; if (options.readError) throw Error("lectura"); return raw; },
      setItem(key, value) {
        writes += 1;
        if (options.afterWriteTime) now = options.afterWriteTime;
        if (options.writeError) throw Error("escritura");
        raw = value;
      }
    },
    setInterval(callback, delay) { events.timer = callback; events.delay = delay; },
    window: { addEventListener(name, callback) { events[name] = callback; } }
  });
  for (const file of ["study-logic.js", "app.js"]) vm.runInContext(readFileSync(join(__dirname, "..", file), "utf8"), context);
  return {
    get, document, events, context,
    evaluate: expression => vm.runInContext(expression, context),
    setDay: date => { now = date.getTime(); },
    storage: () => ({ raw, writes, reads }),
    submit(date = "2026-10-04", minutes = 30) {
      get("#date").value = date; get("#topic").value = "Tema"; get("#minutes").valueAsNumber = minutes;
      get("#session-form").submit({ preventDefault() {} });
    }
  };
}

test("lectura inválida bloquea incluso el envío programático y no se reintenta", () => {
  for (const options of [{ raw: "{" }, { readError: true }, { raw: '[{"date":"2023-02-29"}]' }]) {
    const app = startApp(options);
    app.submit(); app.events.focus(); app.events.timer();
    assert.equal(app.storage().writes, 0);
    assert.equal(app.storage().reads, 1);
    assert.equal(app.get("#session-fields").disabled, true);
    assert.equal(app.get("#streak-count").textContent, "No disponible");
    assert.match(app.get("#heat-error").textContent, /No se puede leer/);
  }
});

test("guardado correcto actualiza mapa, conserva formato y persiste tras recarga", () => {
  const app = startApp();
  app.submit(); app.submit("2026-10-03", 12.5);
  assert.equal(app.get("#message").textContent, "Sesión guardada.");
  assert.equal(app.evaluate("heatModel.days.at(-1).text"), "30 min");
  assert.deepEqual(Object.keys(JSON.parse(app.storage().raw)[0]), ["date", "topic", "minutes"]);
  const reload = startApp({ raw: app.storage().raw });
  assert.equal(reload.evaluate("calculateStreak(sessions, new Date())"), 2);
  assert.equal(reload.evaluate("selectedHeatDate"), "2026-10-04");
});

test("fallo de escritura conserva historial y actualiza el día posterior al intento", () => {
  const raw = JSON.stringify([{ date: "2026-10-04", topic: "Anterior", minutes: 5 }]);
  const app = startApp({ raw, writeError: true, afterWriteTime: new Date(2026, 9, 5, 0, 1).getTime() });
  app.submit();
  assert.equal(app.storage().raw, raw);
  assert.equal(app.get("#topic").value, "Tema");
  assert.equal(app.evaluate("heatModel.today"), "2026-10-05");
  assert.match(app.get("#message").textContent, /No se pudo guardar/);
});

test("guardar un exceso confirma la sesión y permite registrar de nuevo", () => {
  const app = startApp();
  app.submit("2026-10-04", Number.MAX_VALUE);
  app.submit("2026-10-04", Number.MAX_VALUE);
  assert.equal(app.get("#message").textContent, "Sesión guardada.");
  assert.equal(app.evaluate("heatModel.status"), "overflow");
  assert.equal(app.get("#session-fields").disabled, false);
  assert.equal(app.get("#weekly-minutes-count").textContent, "No disponible");
  app.submit("2026-10-03", 1);
  assert.equal(app.storage().writes, 3);
  app.setDay(new Date(2027, 0, 1, 12)); app.events.timer();
  assert.equal(app.evaluate("heatModel.status"), "ready");
  assert.equal(app.evaluate("selectedHeatDate"), "2027-01-01");
});

test("eventos y control previo detectan cambios sin releer ni desplazar foco externo", () => {
  const app = startApp();
  const outside = app.get("#topic"); outside.focus();
  assert.equal(app.events.delay, 15000);
  for (const [event, day] of [["visibilitychange", 5], ["focus", 6], ["pageshow", 7]]) {
    app.setDay(new Date(2026, 9, day, 0, 30)); app.events[event]();
    assert.equal(app.evaluate("heatModel.today"), `2026-10-0${day}`);
    assert.equal(app.document.activeElement, outside);
  }
  app.setDay(new Date(2026, 9, 2, 0, 30));
  app.evaluate("checkDayChange()");
  assert.equal(app.evaluate("heatModel.today"), "2026-10-02");
  assert.equal(app.storage().reads, 1);
});

test("transiciones reales de foco interno, error y recuperación", () => {
  const app = startApp();
  app.evaluate("heatButtons.get('2026-10-04').focus()");
  app.setDay(new Date(2026, 9, 3, 12)); app.events.timer();
  assert.equal(app.document.activeElement.dataset.date, "2026-10-03");
  app.submit("2026-10-03", Number.MAX_VALUE);
  app.submit("2026-10-03", Number.MAX_VALUE);
  assert.equal(app.document.activeElement, app.get("#heat-error"));
  app.setDay(new Date(2027, 0, 1, 12)); app.events.timer();
  assert.equal(app.document.activeElement.dataset.date, "2027-01-01");
});

test("el guardado a medianoche conserva la fecha elegida y usa una sola referencia posterior", () => {
  const app = startApp({ afterWriteTime: new Date(2026, 9, 5, 0, 1).getTime() });
  app.submit("2026-10-04", 30);
  assert.equal(JSON.parse(app.storage().raw)[0].date, "2026-10-04");
  assert.equal(app.evaluate("heatModel.today"), "2026-10-05");
  assert.equal(Number(app.get("#weekly-minutes-count").textContent), 0);
  assert.equal(Number(app.get("#streak-count").textContent), 1);
});

test("un foco externo no se mueve cuando aparece o se recupera un error", () => {
  const app = startApp();
  const outside = app.get("#topic"); outside.focus();
  app.submit("2026-10-04", Number.MAX_VALUE); app.submit("2026-10-04", Number.MAX_VALUE);
  assert.equal(app.document.activeElement, outside);
  app.setDay(new Date(2027, 0, 1, 12)); app.events.timer();
  assert.equal(app.document.activeElement, outside);
  assert.equal(app.evaluate("selectedHeatDate"), "2027-01-01");
});

test("total extremo se ofrece contraído y desaparece al consultar otro día o error", () => {
  const app = startApp();
  app.submit("2026-10-04", Number.MAX_VALUE);
  const disclosure = app.get("#heat-full-total");
  assert.equal(disclosure.hidden, false);
  assert.equal(disclosure.open, false);
  assert.match(app.get("#heat-full-value").textContent, /^179\.769/);
  disclosure.open = true;
  app.evaluate("selectedHeatDate = '2026-10-03'; renderHeatSelection()");
  assert.equal(disclosure.hidden, true);
  assert.equal(disclosure.open, false);
  app.evaluate("selectedHeatDate = '2026-10-04'; renderHeatSelection()");
  assert.equal(disclosure.hidden, false);
  assert.equal(disclosure.open, false);
  app.submit("2026-10-04", Number.MAX_VALUE);
  assert.equal(disclosure.hidden, true);
  assert.equal(app.get("#heat-full-value").textContent, "");
});

test("consultar el desplegable tras reanudar actualiza la fecha y cancela una consulta obsoleta", () => {
  for (const eventName of ["click", "keydown"]) {
    const app = startApp();
    app.submit("2026-10-04", 1e9);
    const disclosure = app.get("#heat-full-total");
    const summary = app.get("summary de prueba");
    disclosure.append(summary);
    summary.focus();
    app.setDay(new Date(2027, 0, 1, 0, 30));
    let cancelled = false;
    assert.equal(typeof disclosure[eventName], "function");
    disclosure[eventName]({ target: summary, key: "Enter", preventDefault() { cancelled = true; } });
    assert.equal(app.evaluate("heatModel.today"), "2027-01-01");
    assert.equal(disclosure.hidden, true);
    assert.equal(cancelled, true);
    assert.equal(app.document.activeElement.dataset.date, "2027-01-01");
  }
});

test("foco del desplegable va al error y a hoy al recuperar, sin perder foco si sigue válido", () => {
  const app = startApp();
  app.submit("2026-10-04", 1e9);
  app.submit("2026-10-05", Number.MAX_VALUE);
  app.submit("2026-10-05", Number.MAX_VALUE);
  const disclosure = app.get("#heat-full-total");
  const summary = app.get("summary de prueba");
  disclosure.append(summary);
  summary.focus();
  app.evaluate("updateIndicators(new Date())");
  assert.equal(app.document.activeElement, summary);
  app.setDay(new Date(2026, 9, 5, 0, 30)); app.events.focus();
  assert.equal(app.document.activeElement, app.get("#heat-error"));
  app.setDay(new Date(2027, 0, 1, 0, 30)); app.events.focus();
  assert.equal(app.document.activeElement.dataset.date, "2027-01-01");
});

test("cambiar la zona horaria en una sesión recalcula hoy sin cambiar los registros", () => {
  const { spawnSync } = require("node:child_process");
  // Un proceso separado evita cambiar la zona horaria de otros tests.
  const script = `const assert = require('node:assert/strict');
    const {readFileSync}=require('node:fs'); const {join}=require('node:path'); const vm=require('node:vm');
    const __dirname=${JSON.stringify(__dirname)};
    const startApp=${startApp.toString()};
    process.env.TZ='Asia/Tokyo';
    const app=startApp();
    const instant=new Date(Date.UTC(2026,9,4,23,30));
    app.setDay(instant); app.events.focus();
    app.submit('2026-10-05',30);
    const raw=app.storage().raw;
    assert.equal(app.evaluate('heatModel.today'),'2026-10-05');
    process.env.TZ='America/Los_Angeles'; app.events.timer();
    assert.equal(app.evaluate('heatModel.today'),'2026-10-04');
    assert.equal(app.evaluate('selectedHeatDate'),'2026-10-04');
    assert.equal(app.evaluate('heatModel.empty'),true);
    assert.equal(app.storage().raw,raw);
    process.env.TZ='Asia/Tokyo'; app.events.focus();
    assert.equal(app.evaluate('heatModel.today'),'2026-10-05');
    assert.equal(app.evaluate('heatModel.empty'),false);
    assert.equal(app.storage().raw,raw);`;
  const result = spawnSync(process.execPath, ["-e", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("tras omitir temporizadores durante una suspensión se actualiza antes de consultar", () => {
  const app = startApp();
  app.submit("2026-10-04", 1e9);
  const disclosure = app.get("#heat-full-total");
  const summary = app.get("summary de prueba");
  disclosure.append(summary);
  summary.focus();
  // No se entrega ningún evento ni tick durante el salto: simula ejecución suspendida.
  app.setDay(new Date(2027, 0, 1, 0, 30));
  assert.equal(app.evaluate("heatModel.today"), "2026-10-04");
  disclosure.click({ preventDefault() {} });
  assert.equal(app.evaluate("heatModel.today"), "2027-01-01");
  assert.equal(app.document.activeElement.dataset.date, "2027-01-01");
  assert.equal(app.storage().reads, 1);
});
