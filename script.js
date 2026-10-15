
"use strict";

// ======================================
// CYBER LAB — JAVASCRIPT ENGINE
// ======================================

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  runs: 0,
  modal: null,
  timerInterval: null,
  timerRemaining: 0,
  stopwatchInterval: null,
  stopwatchStart: 0,
  stopwatchElapsed: 0,
  stopwatchRunning: false,
  reactionTimeout: null,
  reactionStart: 0,
  reactionState: "idle",
  toastTimeout: null,
  particles: [],
  particleAnimation: null
};

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[char]);

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
}

function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    toast("Не удалось сохранить данные в браузере.");
    return false;
  }
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => toast("Скопировано!"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();

  try {
    document.execCommand("copy");
    toast("Скопировано!");
  } catch {
    toast("Не удалось скопировать. Выдели текст вручную.");
  }

  field.remove();
}

// ======================================
// CLOCK AND COUNTERS
// ======================================

function updateClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString("ru-RU", {
    hour12: false
  });
}

function updateYear() {
  $("#year").textContent = new Date().getFullYear();
}

function updateRunCounter() {
  $("#statRuns").textContent = state.runs;
}

// ======================================
// THEME SWITCHER
// ======================================

function initializeTheme() {
  let savedTheme = "dark";

  try {
    savedTheme = localStorage.getItem("cyber-theme") || "dark";
  } catch {}

  document.body.classList.toggle("light", savedTheme === "light");
  updateThemeButton();
}

function updateThemeButton() {
  const button = $("#themeBtn");
  const light = document.body.classList.contains("light");

  button.textContent = light ? "☾" : "☼";
  button.title = light ? "Включить тёмную тему" : "Включить светлую тему";
}

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");

  const theme = document.body.classList.contains("light") ? "light" : "dark";

  try {
    localStorage.setItem("cyber-theme", theme);
  } catch {}

  updateThemeButton();
  toast(theme === "light" ? "Светлая тема включена" : "Тёмная тема включена");
});

// ======================================
// MOBILE NAVIGATION
// ======================================

$("#menuBtn").addEventListener("click", () => {
  const nav = $("#nav");
  const open = nav.classList.toggle("open");

  $("#menuBtn").textContent = open ? "×" : "☰";
  $("#menuBtn").setAttribute("aria-expanded", String(open));
});

$$('#nav a').forEach(link => {
  link.addEventListener("click", () => {
    $("#nav").classList.remove("open");
    $("#menuBtn").textContent = "☰";
    $("#menuBtn").setAttribute("aria-expanded", "false");
  });
});

// Highlight the current section in navigation.
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    $$("#nav a").forEach(link => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${entry.target.id}`
      );
    });
  });
}, { rootMargin: "-35% 0px -55% 0px" });

$$("main section[id]").forEach(section => navObserver.observe(section));

// ======================================
// SEARCH TOOLS
// ======================================

$("#toolSearch").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  let visible = 0;

  $$(".tool-card").forEach(card => {
    const text = `${card.dataset.search} ${card.innerText}`.toLowerCase();
    const match = text.includes(query);

    card.classList.toggle("hidden", !match);
    if (match) visible++;
  });

  $("#emptySearch").classList.toggle("hidden", visible !== 0);
});

// ======================================
// JAVASCRIPT PLAYGROUND
// ======================================

const starterCode = `const name = "Cyber Developer";
const skills = ["HTML", "CSS", "JavaScript"];

console.log("Welcome to Cyber Lab!");
console.log("Имя:", name);
console.log("Навыки:", skills.join(" + "));
console.log("Случайное число:", Math.floor(Math.random() * 100) + 1);`;

const exampleCodes = [
  `const numbers = [2, 4, 6, 8, 10];

console.log("Массив:", numbers);
console.log("Умножение на 2:", numbers.map(n => n * 2));
console.log("Сумма:", numbers.reduce((sum, n) => sum + n, 0));
console.log("Чётные:", numbers.filter(n => n % 4 === 0));`,

  `const user = {
  name: "Developer",
  level: 1,
  skills: ["HTML", "CSS", "JavaScript"]
};

console.log("Имя:", user.name);
console.log("Уровень:", user.level);
console.log("Навыки:", user.skills.join(", "));
user.level++;
console.log("Новый уровень:", user.level);`,

  `function calculate(a, b, operation) {
  if (operation === "+") return a + b;
  if (operation === "-") return a - b;
  if (operation === "*") return a * b;
  if (operation === "/") return b !== 0 ? a / b : "Деление на ноль";
  return "Неизвестная операция";
}

console.log(calculate(20, 5, "+"));
console.log(calculate(20, 5, "*"));
console.log(calculate(20, 5, "/"));`,

  `const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
  console.log("Запуск...");
  await delay(700);
  console.log("Шаг 1 завершён");
  await delay(700);
  console.log("Эксперимент завершён!");
}

start();`
];

function updateLineNumbers() {
  const lines = Math.max(1, $("#codeInput").value.split("\n").length);
  $("#lineNumbers").innerHTML = Array.from(
    { length: lines },
    (_, i) => i + 1
  ).join("<br>");
}

$("#codeInput").addEventListener("input", updateLineNumbers);

$("#codeInput").addEventListener("keydown", event => {
  if (event.key === "Tab") {
    event.preventDefault();

    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    input.setRangeText("  ", start, end, "end");
    updateLineNumbers();
  }

  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();
    runPlayground();
  }
});

$("#exampleCode").addEventListener("click", () => {
  const code = exampleCodes[Math.floor(Math.random() * exampleCodes.length)];
  $("#codeInput").value = code;
  updateLineNumbers();
  toast("Пример загружен");
});

$("#clearConsole").addEventListener("click", () => {
  $("#consoleOutput").textContent = "Консоль очищена.";
  $("#consoleStatus").textContent = "Очищено";
});

$("#runCode").addEventListener("click", runPlayground);

function runPlayground() {
  const code = $("#codeInput").value;
  const output = $("#consoleOutput");
  const status = $("#consoleStatus");

  output.textContent = "Запуск кода...";
  status.textContent = "Выполняется";

  // Выполняем пользовательский код в sandbox iframe.
  // Он не получает доступ к DOM родительской страницы.
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.title = "Изолированная среда JavaScript";
  frame.style.display = "none";

  let finished = false;

  const finish = (message, isError = false) => {
    if (finished) return;
    finished = true;

    output.textContent = message || "(Нет вывода)";
    output.style.color = isError ? "#ff779b" : "#6bffb4";
    status.textContent = isError ? "Ошибка" : "Готово";

    frame.remove();
    clearTimeout(timeout);

    state.runs++;
    updateRunCounter();
  };

  const timeout = setTimeout(() => {
    finish("Превышено время выполнения. Возможно, код содержит бесконечный цикл.", true);
  }, 5000);

  window.addEventListener("message", function handler(event) {
    if (event.source !== frame.contentWindow) return;
    if (!event.data || event.data.type !== "cyber-console") return;

    window.removeEventListener("message", handler);
    finish(event.data.output, event.data.error);
  });

  // Не даём введённому коду закрыть наш script-тег в srcdoc.
  const safeCode = code.replace(/<\/script/gi, "<\\/script");

  frame.srcdoc = `<!DOCTYPE html>
<html>
<body>
<script>
(() => {
  const lines = [];
  let hasError = false;

  const format = value => {
    if (typeof value === "string") return value;
    if (typeof value === "undefined") return "undefined";

    try {
      const result = JSON.stringify(value, null, 2);
      return result === undefined ? String(value) : result;
    } catch {
      return String(value);
    }
  };

  const report = (...args) => {
    lines.push(args.map(format).join(" "));
  };

  console.log = report;
  console.info = report;
  console.warn = (...args) => report("[WARN]", ...args);
  console.error = (...args) => {
    hasError = true;
    report("[ERROR]", ...args);
  };

  window.onerror = (message, source, line, column) => {
    hasError = true;
    lines.push("Ошибка: " + message + " (строка " + line + ")");
    return true;
  };

  window.onunhandledrejection = event => {
    hasError = true;
    lines.push("Promise error: " + String(event.reason));
  };

  try {
    (async () => {
      try {
        ${safeCode}
      } catch (error) {
        hasError = true;
        lines.push(error.name + ": " + error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      parent.postMessage({
        type: "cyber-console",
        output: lines.join("\\n"),
        error: hasError
      }, "*");
    })();
  } catch (error) {
    parent.postMessage({
      type: "cyber-console",
      output: error.name + ": " + error.message,
      error: true
    }, "*");
  }
})();
<\/script>
</body>
</html>`;

  document.body.append(frame);
}

updateLineNumbers();

// ======================================
// MODAL SYSTEM
// ======================================

const modal = $("#toolModal");
const modalTitle = $("#modalTitle");
const modalContent = $("#modalContent");

function openModal(title, content, eyebrow = "CYBER TOOL") {
  clearInterval(state.timerInterval);
  state.timerInterval = null;

  modalTitle.textContent = title;
  $("#modalEyebrow").textContent = eyebrow;
  modalContent.innerHTML = content;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  state.modal = title;

  $("#closeModal").focus();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  clearInterval(state.stopwatchInterval);
  state.stopwatchInterval = null;
  clearTimeout(state.reactionTimeout);
  state.modal = null;
}

$("#closeModal").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

$$("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    openTool(button.dataset.open);
  });
});

function openTool(name) {
  const tools = {
    calculator: showCalculator,
    password: showPasswordGenerator,
    timer: showTimer,
    stopwatch: showStopwatch,
    random: showRandomGenerator,
    notes: showNotes,
    color: showColorStudio,
    text: showTextAnalyzer,
    json: showJSONFormatter,
    converter: showConverter,
    reaction: showReactionTest,
    todo: showTaskManager
  };

  if (tools[name]) tools[name]();
}

// ======================================
// TOOL 01 — CALCULATOR
// ======================================

function showCalculator() {
  openModal("Калькулятор", `
    <p>Введи два числа и выбери операцию.</p>
    <label>Первое число
      <input class="field" id="calcA" type="number" value="25">
    </label>
    <label>Операция
      <select class="field" id="calcOp">
        <option value="+">Сложение (+)</option>
        <option value="-">Вычитание (−)</option>
        <option value="*">Умножение (×)</option>
        <option value="/">Деление (÷)</option>
        <option value="**">Степень (**)</option>
        <option value="%">Остаток (%)</option>
      </select>
    </label>
    <label>Второе число
      <input class="field" id="calcB" type="number" value="5">
    </label>
    <button class="btn btn-primary" id="calcRun">Вычислить</button>
    <div class="result-box" id="calcResult">Результат появится здесь.</div>
  `);

  $("#calcRun").addEventListener("click", () => {
    const a = Number($("#calcA").value);
    const b = Number($("#calcB").value);
    const op = $("#calcOp").value;
    let result;

    if ($("#calcA").value === "" || $("#calcB").value === "") {
      result = "Введи оба числа.";
    } else {
      switch (op) {
        case "+": result = a + b; break;
        case "-": result = a - b; break;
        case "*": result = a * b; break;
        case "/": result = b === 0 ? "На ноль делить нельзя." : a / b; break;
        case "**": result = a ** b; break;
        case "%": result = b === 0 ? "Деление на ноль." : a % b; break;
      }
    }

    $("#calcResult").textContent = String(result);
  });
}

// ======================================
// TOOL 02 — PASSWORD GENERATOR
// ======================================

function showPasswordGenerator() {
  openModal("Генератор паролей", `
    <p>Создай случайный пароль. Не используй демонстрационные пароли для важных аккаунтов.</p>
    <label>Длина пароля: <b id="passLengthLabel">16</b>
      <input class="field" id="passLength" type="range" min="6" max="48" value="16">
    </label>
    <label><input type="checkbox" id="passUpper" checked> Заглавные буквы</label>
    <label><input type="checkbox" id="passLower" checked> Строчные буквы</label>
    <label><input type="checkbox" id="passNumbers" checked> Цифры</label>
    <label><input type="checkbox" id="passSymbols"> Специальные символы</label>
    <div class="result-box" id="passResult">Нажми «Создать пароль».</div>
    <div class="modal-actions">
      <button class="btn btn-primary" id="passGenerate">Создать пароль</button>
      <button class="btn btn-outline" id="passCopy">Копировать</button>
    </div>
    <p class="small-note">Случайность генерируется средствами браузера. Для особо важных систем используй специализированный менеджер паролей.</p>
  `);

  $("#passLength").addEventListener("input", event => {
    $("#passLengthLabel").textContent = event.target.value;
  });

  $("#passGenerate").addEventListener("click", () => {
    let chars = "";
    if ($("#passUpper").checked) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if ($("#passLower").checked) chars += "abcdefghijklmnopqrstuvwxyz";
    if ($("#passNumbers").checked) chars += "0123456789";
    if ($("#passSymbols").checked) chars += "!@#$%^&*()-_=+?";

    if (!chars) {
      toast("Выбери хотя бы один тип символов.");
      return;
    }

    const length = Number($("#passLength").value);
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    const password = [...values]
      .map(value => chars[value % chars.length])
      .join("");

    $("#passResult").textContent = password;
  });

  $("#passCopy").addEventListener("click", () => {
    copyText($("#passResult").textContent);
  });
}

// ======================================
// TOOL 03 — TIMER
// ======================================

function showTimer() {
  openModal("Таймер", `
    <p>Установи время обратного отсчёта.</p>
    <div class="mini-row">
      <label>Минуты<input class="field" id="timerMin" type="number" min="0" max="999" value="1"></label>
      <label>Секунды<input class="field" id="timerSec" type="number" min="0" max="59" value="0"></label>
    </div>
    <div class="result-number" id="timerDisplay">01:00</div>
    <div class="modal-actions">
      <button class="btn btn-primary" id="timerStart">▶ Старт</button>
      <button class="btn btn-outline" id="timerPause">Пауза</button>
      <button class="btn btn-outline" id="timerReset">Сброс</button>
    </div>
  `);

  state.timerRemaining = 60;

  const render = () => {
    const m = Math.floor(state.timerRemaining / 60);
    const s = state.timerRemaining % 60;
    $("#timerDisplay").textContent =
      `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  $("#timerStart").addEventListener("click", () => {
    if (state.timerInterval) return;

    if (state.timerRemaining <= 0) {
      state.timerRemaining =
        Math.max(0, Number($("#timerMin").value) * 60 + Number($("#timerSec").value));

      if (state.timerRemaining <= 0) {
        toast("Установи время больше нуля.");
        return;
      }
    }

    state.timerInterval = setInterval(() => {
      state.timerRemaining--;
      render();

      if (state.timerRemaining <= 0) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        toast("Время вышло!");
        $("#timerDisplay").textContent = "00:00";
      }
    }, 1000);
  });

  $("#timerPause").addEventListener("click", () => {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  });

  $("#timerReset").addEventListener("click", () => {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.timerRemaining =
      Math.max(0, Number($("#timerMin").value) * 60 + Number($("#timerSec").value));
    render();
  });

  render();
}

// ======================================
// TOOL 04 — STOPWATCH
// ======================================

function showStopwatch() {
  state.stopwatchElapsed = 0;
  state.stopwatchRunning = false;

  openModal("Секундомер", `
    <p>Запускай, ставь на паузу и фиксируй круги.</p>
    <div class="result-number" id="watchDisplay">00:00.0</div>
    <div class="modal-actions">
      <button class="btn btn-primary" id="watchStart">▶ Старт</button>
      <button class="btn btn-outline" id="watchLap">Круг</button>
      <button class="btn btn-outline" id="watchReset">Сброс</button>
    </div>
    <div class="task-list" id="watchLaps"></div>
  `);

  const format = ms => {
    const total = Math.floor(ms / 100);
    const tenths = total % 10;
    const seconds = Math.floor(total / 10) % 60;
    const minutes = Math.floor(total / 600);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
  };

  const elapsed = () => state.stopwatchElapsed +
    (state.stopwatchRunning ? performance.now() - state.stopwatchStart : 0);

  const render = () => {
    $("#watchDisplay").textContent = format(elapsed());
  };

  $("#watchStart").addEventListener("click", () => {
    if (state.stopwatchRunning) {
      state.stopwatchElapsed = elapsed();
      state.stopwatchRunning = false;
      clearInterval(state.stopwatchInterval);
      state.stopwatchInterval = null;
      $("#watchStart").textContent = "▶ Продолжить";
    } else {
      state.stopwatchStart = performance.now();
      state.stopwatchRunning = true;
      state.stopwatchInterval = setInterval(render, 100);
      $("#watchStart").textContent = "Ⅱ Пауза";
    }
    render();
  });

  $("#watchLap").addEventListener("click", () => {
    if (!state.stopwatchRunning && state.stopwatchElapsed === 0) {
      toast("Сначала запусти секундомер.");
      return;
    }

    const item = document.createElement("div");
    item.className = "task-item";
    item.textContent = `Круг ${$("#watchLaps").children.length + 1}: ${format(elapsed())}`;
    $("#watchLaps").prepend(item);
  });

  $("#watchReset").addEventListener("click", () => {
    clearInterval(state.stopwatchInterval);
    state.stopwatchInterval = null;
    state.stopwatchRunning = false;
    state.stopwatchElapsed = 0;
    $("#watchStart").textContent = "▶ Старт";
    $("#watchLaps").replaceChildren();
    render();
  });
}

// ======================================
// TOOL 05 — RANDOM NUMBER
// ======================================

function showRandomGenerator() {
  openModal("Random Generator", `
    <p>Случайное целое число между минимумом и максимумом.</p>
    <div class="mini-row">
      <label>Минимум<input class="field" id="randomMin" type="number" value="1"></label>
      <label>Максимум<input class="field" id="randomMax" type="number" value="100"></label>
    </div>
    <div class="result-number" id="randomResult">?</div>
    <button class="btn btn-primary" id="randomGenerate">⚄ Генерировать</button>
  `);

  $("#randomGenerate").addEventListener("click", () => {
    const min = Number($("#randomMin").value);
    const max = Number($("#randomMax").value);

    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) {
      toast("Проверь диапазон целых чисел.");
      return;
    }

    $("#randomResult").textContent =
      String(Math.floor(Math.random() * (max - min + 1)) + min);
  });
}

// ======================================
// TOOL 06 — NOTES
// ======================================

function showNotes() {
  const saved = safeRead("cyber-notes", "");

  openModal("Мои заметки", `
    <p>Заметки сохраняются локально в этом браузере.</p>
    <label>Текст заметки
      <textarea class="field" id="notesInput" placeholder="Идея для нового проекта...">${escapeHTML(saved)}</textarea>
    </label>
    <div class="modal-actions">
      <button class="btn btn-primary" id="notesSave">Сохранить</button>
      <button class="btn btn-outline" id="notesCopy">Копировать</button>
      <button class="btn btn-outline" id="notesClear">Очистить</button>
    </div>
    <p class="small-note">Локальные данные могут быть удалены при очистке данных браузера.</p>
  `);

  $("#notesSave").addEventListener("click", () => {
    if (safeSave("cyber-notes", $("#notesInput").value)) {
      toast("Заметка сохранена.");
    }
  });

  $("#notesCopy").addEventListener("click", () => {
    copyText($("#notesInput").value);
  });

  $("#notesClear").addEventListener("click", () => {
    $("#notesInput").value = "";
    safeSave("cyber-notes", "");
    toast("Заметки очищены.");
  });
}

// ======================================
// TOOL 07 — COLOR STUDIO
// ======================================

function showColorStudio() {
  openModal("Color Studio", `
    <p>Выбери цвет, посмотри его HEX-код и скопируй значение.</p>
    <label>Цвет
      <input class="field" id="colorPicker" type="color" value="#ff3d83">
    </label>
    <div class="color-preview" id="colorPreview"></div>
    <div class="result-box" id="colorValue">#FF3D83</div>
    <div class="modal-actions">
      <button class="btn btn-primary" id="colorCopy">Копировать HEX</button>
      <button class="btn btn-outline" id="colorRandom">Случайный цвет</button>
    </div>
  `);

  const render = () => {
    const value = $("#colorPicker").value.toUpperCase();
    $("#colorValue").textContent = value;
    $("#colorPreview").style.background = value;
  };

  $("#colorPicker").addEventListener("input", render);
  $("#colorCopy").addEventListener("click", () => copyText($("#colorPicker").value));

  $("#colorRandom").addEventListener("click", () => {
    $("#colorPicker").value = "#" + Math.floor(Math.random() * 16777215)
      .toString(16).padStart(6, "0");
    render();
  });

  render();
}

// ======================================
// TOOL 08 — TEXT ANALYZER
// ======================================

function showTextAnalyzer() {
  openModal("Text Analyzer", `
    <p>Вставь текст, чтобы узнать его статистику.</p>
    <textarea class="field" id="analyzeInput" placeholder="Вставь или напиши текст..."></textarea>
    <div class="result-box" id="textStats">Символы: 0 · Слова: 0 · Строки: 0</div>
    <div class="modal-actions">
      <button class="btn btn-primary" id="textUpper">В ВЕРХНИЙ РЕГИСТР</button>
      <button class="btn btn-outline" id="textLower">в нижний регистр</button>
      <button class="btn btn-outline" id="textCopy">Копировать текст</button>
    </div>
  `);

  const update = () => {
    const value = $("#analyzeInput").value;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const lines = value ? value.split("\n").length : 0;

    $("#textStats").textContent =
      `Символы: ${value.length} · Без пробелов: ${value.replace(/\s/g, "").length} · Слова: ${words} · Строки: ${lines}`;
  };

  $("#analyzeInput").addEventListener("input", update);

  $("#textUpper").addEventListener("click", () => {
    $("#analyzeInput").value = $("#analyzeInput").value.toUpperCase();
    update();
  });

  $("#textLower").addEventListener("click", () => {
    $("#analyzeInput").value = $("#analyzeInput").value.toLowerCase();
    update();
  });

  $("#textCopy").addEventListener("click", () => {
    copyText($("#analyzeInput").value);
  });
}

// ======================================
// TOOL 09 — JSON FORMATTER
// ======================================

function showJSONFormatter() {
  openModal("JSON Formatter", `
    <p>Проверь JSON и отформатируй его с отступами.</p>
    <textarea class="field" id="jsonInput" placeholder='{"name":"Cyber Lab","active":true}'></textarea>
    <div class="modal-actions">
      <button class="btn btn-primary" id="jsonFormat">Форматировать</button>
      <button class="btn btn-outline" id="jsonMinify">Сжать</button>
      <button class="btn btn-outline" id="jsonCopy">Копировать результат</button>
    </div>
    <div class="result-box" id="jsonResult">Здесь появится результат.</div>
  `);

  const process = compact => {
    try {
      const parsed = JSON.parse($("#jsonInput").value);
      $("#jsonResult").textContent = JSON.stringify(parsed, null, compact ? 0 : 2);
      $("#jsonResult").dataset.valid = "true";
    } catch (error) {
      $("#jsonResult").textContent = `Ошибка JSON: ${error.message}`;
      $("#jsonResult").dataset.valid = "false";
    }
  };

  $("#jsonFormat").addEventListener("click", () => process(false));
  $("#jsonMinify").addEventListener("click", () => process(true));

  $("#jsonCopy").addEventListener("click", () => {
    if ($("#jsonResult").dataset.valid === "true") {
      copyText($("#jsonResult").textContent);
    } else {
      toast("Сначала исправь JSON.");
    }
  });
}

// ======================================
// TOOL 10 — UNIT CONVERTER
// ======================================

function showConverter() {
  openModal("Unit Converter", `
    <p>Перевод единиц длины.</p>
    <label>Значение
      <input class="field" id="convertValue" type="number" value="100">
    </label>
    <div class="mini-row">
      <label>Из
        <select class="field" id="convertFrom">
          <option value="mm">Миллиметры</option>
          <option value="cm" selected>Сантиметры</option>
          <option value="m">Метры</option>
          <option value="km">Километры</option>
        </select>
      </label>
      <label>В
        <select class="field" id="convertTo">
          <option value="mm">Миллиметры</option>
          <option value="cm">Сантиметры</option>
          <option value="m" selected>Метры</option>
          <option value="km">Километры</option>
        </select>
      </label>
    </div>
    <div class="result-number" id="convertResult">1 m</div>
  `);

  const factors = { mm: 0.001, cm: 0.01, m: 1, km: 1000 };
  const labels = { mm: "мм", cm: "см", m: "м", km: "км" };

  const convert = () => {
    const value = Number($("#convertValue").value);
    const from = $("#convertFrom").value;
    const to = $("#convertTo").value;

    if ($("#convertValue").value.trim() === "" || !Number.isFinite(value)) {
      $("#convertResult").textContent = "Введи число";
      return;
    }

    const result = value * factors[from] / factors[to];
    $("#convertResult").textContent =
      `${Number(result.toPrecision(10))} ${labels[to]}`;
  };

  ["convertValue", "convertFrom", "convertTo"].forEach(id => {
    $("#" + id).addEventListener("input", convert);
    $("#" + id).addEventListener("change", convert);
  });

  convert();
}

// ======================================
// TOOL 11 — REACTION TEST
// ======================================

function showReactionTest() {
  state.reactionState = "idle";

  openModal("Reaction Test", `
    <p>Нажми на поле, чтобы начать. Когда оно станет зелёным, нажми как можно быстрее.</p>
    <button class="reaction-zone" id="reactionZone">Нажми, чтобы начать</button>
    <div class="result-box" id="reactionResult">Твой результат появится здесь.</div>
  `);

  const zone = $("#reactionZone");
  const result = $("#reactionResult");

  zone.addEventListener("click", () => {
    if (state.reactionState === "idle" || state.reactionState === "result") {
      clearTimeout(state.reactionTimeout);
      state.reactionState = "waiting";
      zone.className = "reaction-zone waiting";
      zone.textContent = "Жди зелёный сигнал...";

      result.textContent = "Не нажимай до появления зелёного поля!";

      state.reactionTimeout = setTimeout(() => {
        if (!modal.classList.contains("open")) return;
        state.reactionState = "ready";
        state.reactionStart = performance.now();
        zone.className = "reaction-zone ready";
        zone.textContent = "ЖМИ СЕЙЧАС!";
      }, 1200 + Math.random() * 2800);

      return;
    }

    if (state.reactionState === "waiting") {
      clearTimeout(state.reactionTimeout);
      state.reactionState = "result";
      zone.className = "reaction-zone early";
      zone.textContent = "Слишком рано!";
      result.textContent = "Попробуй ещё раз и дождись зелёного сигнала.";
      return;
    }

    if (state.reactionState === "ready") {
      const ms = Math.round(performance.now() - state.reactionStart);
      state.reactionState = "result";
      zone.className = "reaction-zone";
      zone.textContent = "Попробовать ещё раз";
      result.textContent = `Твоя реакция: ${ms} мс.`;
    }
  });
}

// ======================================
// TOOL 12 — TASK MANAGER
// ======================================

function showTaskManager() {
  let tasks = safeRead("cyber-tasks", []);

  if (!Array.isArray(tasks)) tasks = [];

  openModal("Task Manager", `
    <p>Список дел сохраняется в локальном хранилище браузера.</p>
    <form id="taskForm" class="mini-row">
      <input class="field" id="taskInput" placeholder="Новая задача..." maxlength="160" required>
      <button class="btn btn-primary" type="submit">Добавить</button>
    </form>
    <div class="task-list" id="taskList"></div>
    <p class="small-note" id="taskSummary"></p>
  `);

  const render = () => {
    const list = $("#taskList");
    list.replaceChildren();

    tasks.forEach((task, index) => {
      const item = document.createElement("div");
      item.className = `task-item${task.done ? " done" : ""}`;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = Boolean(task.done);
      check.setAttribute("aria-label", "Отметить задачу");

      check.addEventListener("change", () => {
        tasks[index].done = check.checked;
        safeSave("cyber-tasks", tasks);
        render();
      });

      const text = document.createElement("span");
      text.textContent = task.text;

      const remove = document.createElement("button");
      remove.className = "task-delete";
      remove.type = "button";
      remove.textContent = "✕";
      remove.setAttribute("aria-label", "Удалить задачу");

      remove.addEventListener("click", () => {
        tasks.splice(index, 1);
        safeSave("cyber-tasks", tasks);
        render();
      });

      item.append(check, text, remove);
      list.append(item);
    });

    const completed = tasks.filter(task => task.done).length;
    $("#taskSummary").textContent =
      `Всего: ${tasks.length} · Выполнено: ${completed} · Осталось: ${tasks.length - completed}`;
  };

  $("#taskForm").addEventListener("submit", event => {
    event.preventDefault();

    const input = $("#taskInput");
    const text = input.value.trim();
    if (!text) return;

    tasks.push({
      id: Date.now(),
      text,
      done: false
    });

    safeSave("cyber-tasks", tasks);
    input.value = "";
    render();
  });

  render();
}

// ======================================
// LEARNING LIBRARY
// ======================================

const lessons = {
  variables: {
    title: "Переменные",
    description: "const создаёт переменную, которую нельзя переназначить. let подходит для значений, которые будут изменяться.",
    code: `const username = "Developer";
let level = 1;

level = level + 1;

console.log(username);
console.log(level);`
  },
  functions: {
    title: "Функции",
    description: "Функции позволяют повторно использовать код. Они могут принимать параметры и возвращать результат.",
    code: `function sum(a, b) {
  return a + b;
}

const result = sum(10, 25);
console.log(result);`
  },
  arrays: {
    title: "Массивы",
    description: "Массив хранит набор элементов. map создаёт новый массив, filter отбирает элементы, reduce вычисляет общее значение.",
    code: `const numbers = [1, 2, 3, 4, 5];

console.log(numbers.map(n => n * 2));
console.log(numbers.filter(n => n > 3));
console.log(numbers.reduce((a, b) => a + b, 0));`
  },
  objects: {
    title: "Объекты",
    description: "Объект объединяет связанные свойства и значения. К свойствам можно обращаться через точку или квадратные скобки.",
    code: `const user = {
  name: "Developer",
  level: 5
};

console.log(user.name);
console.log(user["level"]);`
  },
  dom: {
    title: "DOM",
    description: "DOM позволяет JavaScript находить HTML-элементы и менять страницу. В этом примере используется консоль редактора.",
    code: `const items = ["HTML", "CSS", "JavaScript"];

const list = document.createElement("ul");

items.forEach(item => {
  const li = document.createElement("li");
  li.textContent = item;
  list.append(li);
});

console.log(list.outerHTML);`
  },
  events: {
    title: "События",
    description: "addEventListener позволяет реагировать на действия пользователя: клики, ввод текста и отправку форм.",
    code: `const button = document.createElement("button");
button.textContent = "Нажми меня";

button.addEventListener("click", () => {
  console.log("Кнопка нажата!");
});

console.log("Создана кнопка с обработчиком события.");`
  },
  async: {
    title: "Асинхронность",
    description: "async и await упрощают работу с Promise. Код может ждать завершения асинхронной операции.",
    code: `const wait = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

async function demo() {
  console.log("Начало");
  await wait(500);
  console.log("Прошло полсекунды");
}

demo();`
  },
  storage: {
    title: "Хранилище",
    description: "localStorage хранит строки в браузере между перезагрузками. В изолированном playground хранилище отдельно от сайта.",
    code: `const settings = {
  theme: "dark",
  language: "ru"
};

console.log(JSON.stringify(settings, null, 2));
console.log("Для сохранения используй localStorage в своём приложении.");`
  }
};

$$("[data-topic]").forEach(button => {
  button.addEventListener("click", () => {
    const lesson = lessons[button.dataset.topic];
    if (!lesson) return;

    openModal(lesson.title, `
      <p>${escapeHTML(lesson.description)}</p>
      <div class="result-box">${escapeHTML(lesson.code)}</div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="lessonLoad">Открыть в редакторе</button>
        <button class="btn btn-outline" id="lessonCopy">Копировать код</button>
      </div>
    `, "JAVASCRIPT KNOWLEDGE");

    $("#lessonLoad").addEventListener("click", () => {
      $("#codeInput").value = lesson.code;
      updateLineNumbers();
      closeModal();
      $("#playground").scrollIntoView({ behavior: "smooth" });
      toast("Код загружен в редактор.");
    });

    $("#lessonCopy").addEventListener("click", () => {
      copyText(lesson.code);
    });
  });
});

// ======================================
// RANDOM DEVELOPER QUOTES
// ======================================

const quotes = [
  "Каждая большая программа начинается с одной строки кода.",
  "Ошибка — это не конец. Это подсказка для следующего шага.",
  "Не просто используй технологии. Учись создавать их.",
  "Хороший разработчик постоянно задаёт вопросы.",
  "Сначала реши задачу. Затем сделай решение красивым.",
  "Маленький проект сегодня — большой опыт завтра.",
  "Код становится лучше, когда ты понимаешь, что он делает."
];

$("#quoteBtn").addEventListener("click", () => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const heading = $(".quote-box h2");

  heading.textContent = quote;
  heading.style.animation = "none";
  void heading.offsetWidth;
  heading.style.animation = "modalIn .3s ease";

  toast("Новая мотивация!");
});

// ======================================
// PARTICLE BACKGROUND
// ======================================

function initParticles() {
  const canvas = $("#particles");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  let width = 0;
  let height = 0;
  let animationId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(85, Math.max(25, Math.floor(width / 17)));

    state.particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.7 + 0.4
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    const light = document.body.classList.contains("light");
    const dotColor = light ? "130,50,100" : "255,110,175";

    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor}, .65)`;
      ctx.fill();

      for (let j = i + 1; j < state.particles.length; j++) {
        const q = state.particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 105) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${dotColor}, ${0.12 * (1 - distance / 105)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(draw);
  };

  resize();
  draw();

  window.addEventListener("resize", () => {
    cancelAnimationFrame(animationId);
    resize();
    draw();
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      cancelAnimationFrame(animationId);
      draw();
    }
  });
}

// ======================================
// START APPLICATION
// ======================================

function startApp() {
  initializeTheme();
  updateClock();
  updateYear();
  updateRunCounter();
  updateLineNumbers();
  initParticles();

  setInterval(updateClock, 1000);

  // Обновляем счётчик количества инструментов.
  $("#statTools").textContent = $$(".tool-card").length;

  console.log("Cyber Lab initialized.");
}

startApp();
