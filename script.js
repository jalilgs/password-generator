// DOM Elements
const passwordInput = document.getElementById("password");
const lengthSlider = document.getElementById("length");
const lengthDisplay = document.getElementById("length-value");
const uppercaseCheckbox = document.getElementById("uppercase");
const lowercaseCheckbox = document.getElementById("lowercase");
const numbersCheckbox = document.getElementById("numbers");
const symbolsCheckbox = document.getElementById("symbols");
const excludeAmbiguousCheckbox = document.getElementById("exclude-ambiguous");
const noDuplicatesCheckbox = document.getElementById("no-duplicates");
const generateButton = document.getElementById("generate-btn");
const copyButton = document.getElementById("copy-btn");
const strengthBar = document.querySelector(".strength-bar");
const strengthLabel = document.getElementById("strength-label");
const entropyLabel = document.getElementById("entropy-label");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");
const clearHistoryButton = document.getElementById("clear-history-btn");

// Character sets
const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const numberCharacters = "0123456789";
const symbolCharacters = "!@#$%^&*()-_=+[]{}|;:,.<>?/";
const ambiguousCharacters = "Il1O0o";

let history = [];

window.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    loadHistory();
    makePassword();
});

lengthSlider.addEventListener("input", () => {
    lengthDisplay.textContent = lengthSlider.value;
    makePassword();
});

const checkboxes = [
    uppercaseCheckbox,
    lowercaseCheckbox,
    numbersCheckbox,
    symbolsCheckbox,
    excludeAmbiguousCheckbox,
    noDuplicatesCheckbox,
];

checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", makePassword);
});

generateButton.addEventListener("click", makePassword);

window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        makePassword();
    }
});

function removeCharacters(source, charsToRemove) {
    let result = "";
    for (const char of source) {
        if (!charsToRemove.includes(char)) {
            result += char;
        }
    }
    return result;
}

function buildCharacterPool(includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous) {
    let pool = "";

    if (includeUppercase) pool += uppercaseLetters;
    if (includeLowercase) pool += lowercaseLetters;
    if (includeNumbers) pool += numberCharacters;
    if (includeSymbols) pool += symbolCharacters;

    if (excludeAmbiguous) {
        pool = removeCharacters(pool, ambiguousCharacters);
    }

    return pool;
}

function shuffleString(str) {
    const chars = str.split("");
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
}

function createRandomPassword(length, pool, noDuplicates) {
    if (!pool) return "";

    if (noDuplicates) {
        const effectiveLength = Math.min(length, pool.length);
        return shuffleString(pool).slice(0, effectiveLength);
    }

    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        password += pool[randomIndex];
    }
    return password;
}

function makePassword() {
    const length = Number(lengthSlider.value);
    const includeUppercase = uppercaseCheckbox.checked;
    const includeLowercase = lowercaseCheckbox.checked;
    const includeNumbers = numbersCheckbox.checked;
    const includeSymbols = symbolsCheckbox.checked;
    const excludeAmbiguous = excludeAmbiguousCheckbox.checked;
    const noDuplicates = noDuplicatesCheckbox.checked;

    if (!includeLowercase && !includeUppercase && !includeNumbers && !includeSymbols) {
        alert("Please select at least one char type.");
        return;
    }

    const pool = buildCharacterPool(
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous
    );

    if (!pool) {
        alert("No characters available with the current options. Try unchecking \"Exclude Ambiguous\".");
        return;
    }

    const newPassword = createRandomPassword(length, pool, noDuplicates);

    if (noDuplicates && newPassword.length < length) {
        lengthSlider.value = newPassword.length;
        lengthDisplay.textContent = newPassword.length;
    }

    passwordInput.value = newPassword;
    updateStrengthMeter(newPassword, pool.length);
    addToHistory(newPassword);

    saveSettings(
        Number(lengthSlider.value),
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous,
        noDuplicates
    );
}

function saveSettings(length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous, noDuplicates) {
    const settings = {
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous,
        noDuplicates,
    };

    localStorage.setItem("settings", JSON.stringify(settings));
}

function loadSettings() {
    let settings = null;

    try {
        settings = JSON.parse(localStorage.getItem("settings"));
    } catch (error) {
        console.warn("Could not parse settings, falling back to defaults.");
    }

    if (settings) {
        lengthSlider.value = settings.length;
        lengthDisplay.textContent = settings.length;
        uppercaseCheckbox.checked = Boolean(settings.includeUppercase);
        lowercaseCheckbox.checked = Boolean(settings.includeLowercase);
        numbersCheckbox.checked = Boolean(settings.includeNumbers);
        symbolsCheckbox.checked = Boolean(settings.includeSymbols);
        excludeAmbiguousCheckbox.checked = Boolean(settings.excludeAmbiguous);
        noDuplicatesCheckbox.checked = Boolean(settings.noDuplicates);
    } else {
        uppercaseCheckbox.checked = true;
        lowercaseCheckbox.checked = true;
        numbersCheckbox.checked = true;
        symbolsCheckbox.checked = true;

        lengthSlider.value = 12;
        lengthDisplay.textContent = 12;
    }
}

function calculateEntropyBits(passwordLength, poolSize) {
    if (poolSize <= 1 || passwordLength === 0) return 0;
    return Math.round(passwordLength * Math.log2(poolSize));
}

function updateStrengthMeter(password, poolSize) {
    const passwordLength = password.length;
    const entropyBits = calculateEntropyBits(passwordLength, poolSize);

    entropyLabel.textContent = entropyBits + " bits";

    let strengthLabelText = "";
    let strengthClass = "";
    let barWidth = 5;

    if (entropyBits < 40) {
        strengthLabelText = "Weak";
        strengthClass = "weak";
        barWidth = 25;
    } else if (entropyBits < 60) {
        strengthLabelText = "Medium";
        strengthClass = "medium";
        barWidth = 55;
    } else if (entropyBits < 80) {
        strengthLabelText = "Strong";
        strengthClass = "strong";
        barWidth = 80;
    } else {
        strengthLabelText = "Very Strong";
        strengthClass = "very-strong";
        barWidth = 100;
    }

    strengthBar.style.width = barWidth + "%";
    strengthBar.className = "strength-bar " + strengthClass;
    strengthLabel.textContent = strengthLabelText;
}

function addToHistory(password) {
    if (!password) return;

    history = history.filter((entry) => entry !== password);
    history.unshift(password);
    history = history.slice(0, 5);

    saveHistory();
    renderHistory();
}

function saveHistory() {
    try {
        localStorage.setItem("history", JSON.stringify(history));
    } catch (error) {
        console.warn("Could not save history.");
    }
}

function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem("history"));
        history = Array.isArray(saved) ? saved.slice(0, 5) : [];
    } catch (error) {
        history = [];
    }
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyEmpty.style.display = "block";
        return;
    }

    historyEmpty.style.display = "none";

    history.forEach((entry) => {
        const item = document.createElement("li");
        item.className = "history-item";

        const text = document.createElement("span");
        text.className = "history-password";
        text.textContent = entry;

        const copyEntryButton = document.createElement("button");
        copyEntryButton.className = "history-copy-btn";
        copyEntryButton.type = "button";
        copyEntryButton.title = "Copy this password";
        copyEntryButton.setAttribute("aria-label", "Copy password " + entry);
        copyEntryButton.innerHTML = '<i class="far fa-copy"></i>';

        copyEntryButton.addEventListener("click", () => {
            navigator.clipboard
                .writeText(entry)
                .then(() => flashCopyIcon(copyEntryButton.querySelector("i")))
                .catch((error) => console.log("Could not copy: ", error));
        });

        item.appendChild(text);
        item.appendChild(copyEntryButton);
        historyList.appendChild(item);
    });
}

clearHistoryButton.addEventListener("click", () => {
    history = [];
    saveHistory();
    renderHistory();
});

copyButton.addEventListener("click", () => {
    if (!passwordInput.value) return;

    navigator.clipboard
        .writeText(passwordInput.value)
        .then(() => flashCopyIcon(copyButton.querySelector("i")))
        .catch((error) => console.log("Could not copy: ", error));
});

function flashCopyIcon(icon) {
    icon.classList.remove("far", "fa-copy");
    icon.classList.add("fas", "fa-check");
    icon.style.color = "#00d9a3";

    setTimeout(() => {
        icon.classList.add("far", "fa-copy");
        icon.classList.remove("fas", "fa-check");
        icon.style.color = "";
    }, 1500);
}
