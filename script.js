const $ = id => document.getElementById(id);
const passwordInput = $("password");

const characterSets = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}?"
};

function secureIndex(max) {
  if (!Number.isSafeInteger(max) || max < 1) throw new Error("Invalid random range.");
  const range = 0x100000000;
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function secureShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function selectedSets() {
  return Object.keys(characterSets)
    .filter(key => $(key).checked)
    .map(key => characterSets[key]);
}

function getLength() {
  const length = Number($("length").value);
  if (!Number.isInteger(length) || length < 8 || length > 64) {
    throw new Error("Password length must be 8–64.");
  }
  return length;
}

function generateRandom(length = getLength()) {
  const sets = selectedSets();
  if (!sets.length) throw new Error("Select at least one character type.");
  if (length < sets.length) throw new Error("Increase length to include every selected type.");

  const all = sets.join("");
  const chars = sets.map(set => set[secureIndex(set.length)]);
  while (chars.length < length) chars.push(all[secureIndex(all.length)]);
  return secureShuffle(chars).join("");
}

function generatePersonal() {
  const values = ["name", "dob", "nickname", "extra"]
    .map(id => $(id).value.trim()).filter(Boolean);
  if (!values.length) throw new Error("Enter at least one personal-data field.");

  const length = getLength();
  const sets = selectedSets();
  if (!sets.length) throw new Error("Select at least one character type.");
  if (length < sets.length) throw new Error("Increase length to include every selected type.");

  const chars = Array.from(values.join("")).filter(char =>
    sets.some(set => set.includes(char))
  );
  const mixed = Array.from(generateRandom(length));
  if (chars.length) mixed[secureIndex(mixed.length)] = chars[secureIndex(chars.length)];
  return secureShuffle(mixed).join("");
}

function estimateStrength(password) {
  const types = [
    /[a-z]/.test(password), /[A-Z]/.test(password),
    /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)
  ].filter(Boolean).length;
  const score = Math.min(4, Math.floor(password.length / 8) + (types >= 3 ? 1 : 0));
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const widths = ["10%", "25%", "50%", "75%", "100%"];
  $("strengthText").textContent = "Estimated strength: " + labels[score];
  $("strengthBar").style.width = widths[score];
  $("strengthBar").style.background = score < 2 ? "#ef4444" : score < 4 ? "#eab308" : "#22c55e";
}

function displayPassword(password) {
  passwordInput.value = password;
  passwordInput.type = "password";
  $("showBtn").textContent = "Show";
  $("showBtn").setAttribute("aria-label", "Show password");
  $("message").textContent = "";
  estimateStrength(password);
}

function runGeneration(mode) {
  try {
    displayPassword(mode === "personal" ? generatePersonal() : generateRandom());
  } catch (error) {
    $("message").textContent = error.message;
  }
}

$("randomBtn").addEventListener("click", () => runGeneration("random"));
$("personalBtn").addEventListener("click", () => runGeneration("personal"));
$("refreshBtn").addEventListener("click", () => runGeneration("random"));

$("showBtn").addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  $("showBtn").textContent = showing ? "Show" : "Hide";
  $("showBtn").setAttribute("aria-label", showing ? "Show password" : "Hide password");
});

$("copyBtn").addEventListener("click", async () => {
  if (!passwordInput.value) {
    $("message").textContent = "Generate a password first.";
    return;
  }
  try {
    await navigator.clipboard.writeText(passwordInput.value);
    $("message").textContent = "Password copied to clipboard.";
  } catch {
    passwordInput.type = "text";
    passwordInput.select();
    const copied = document.execCommand("copy");
    passwordInput.setSelectionRange(0, 0);
    passwordInput.type = "password";
    $("message").textContent = copied
      ? "Password copied."
      : "Copy failed. Select and copy the password manually.";
  }
});

$("length").addEventListener("input", () => {
  const n = Number($("length").value);
  if (Number.isInteger(n) && n >= 8 && n <= 64) $("lengthSlider").value = n;
});
$("lengthSlider").addEventListener("input", () => {
  $("length").value = $("lengthSlider").value;
});

runGeneration("random");
