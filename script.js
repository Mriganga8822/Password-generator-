
function generatePersonal() {
  const name = $("name").value.trim();
  const dob = $("dob").value.trim();
  const nickname = $("nickname").value.trim();
  const extra = $("extra").value.trim();

  if (!name && !dob && !nickname && !extra) {
    throw new Error("Enter at least one personal-data field.");
  }

  const length = getLength();
  const sets = selectedSets();

  if (!sets.length) {
    throw new Error("Select at least one character type.");
  }

  if (length < sets.length) {
    throw new Error("Increase length to include every selected type.");
  }

  // Preserve recognizable words instead of scrambling them.
  const words = [name, nickname, extra].filter(Boolean);
  const mainWord = words[0] || "";
  const cleanWord = mainWord.replace(/[^a-zA-Z0-9]/g, "");

  // Extract date parts from formats such as 20/02/2006.
  const dateParts = dob.match(/\d+/g) || [];
  let day = "";
  let month = "";
  let year = "";

  if (dateParts.length >= 3) {
    day = dateParts[0].padStart(2, "0");
    month = dateParts[1].padStart(2, "0");
    year = dateParts[2];
  } else if (dateParts.length === 1) {
    const digits = dateParts[0];
    if (digits.length === 8) {
      day = digits.slice(0, 2);
      month = digits.slice(2, 4);
      year = digits.slice(4);
    } else {
      year = digits;
    }
  }

  const symbols = $("symbols").checked ? characterSets.symbols : "";
  const numbersEnabled = $("numbers").checked;
  const upperEnabled = $("upper").checked;
  const lowerEnabled = $("lower").checked;

  // Preserve the name, then add recognizable date details.
  let base = cleanWord;

  if (upperEnabled && base) {
    base = base[0].toUpperCase() + base.slice(1);
  } else if (lowerEnabled) {
    base = base.toLowerCase();
  }

  if (numbersEnabled) {
    if (year) base += year;
    else if (day || month) base += day + month;
  }

  if (symbols) {
    base += symbols[secureIndex(symbols.length)];
  }

  // Add nickname/extra information if there is room.
  for (const word of words.slice(1)) {
    const cleaned = word.replace(/[^a-zA-Z0-9]/g, "");
    if (cleaned && base.length < length - 2) {
      base += cleaned;
    }
  }

  // Add remaining date parts when space permits.
  if (numbersEnabled && day && month && year) {
    const dateExtra = day + month;
    if (base.length + dateExtra.length <= length) {
      base += dateExtra;
    }
  }

  // Keep the recognizable part and fill remaining space securely.
  base = Array.from(base).slice(0, length).join("");

  const setsForExtras = sets;
  while (base.length < length) {
    const set = setsForExtras[secureIndex(setsForExtras.length)];
    base += set[secureIndex(set.length)];
  }

  return base;
}
