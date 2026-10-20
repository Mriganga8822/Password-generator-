const $ = id => document.getElementById(id);
const passwordInput = $("password");
const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}?"
};

function secureIndex(max) {
  if (!Number.isSafeInteger(max) || max < 1) throw new Error("Invalid random range.");
  const range = 0x100000000, limit = range - range % max, buffer = new Uint32Array(1);
  let n;
  do { crypto.getRandomValues(buffer); n = buffer[0]; } while (n >= limit);
  return n % max;
}
function shuffle(a) {
  for (let i=a.length-1;i>0;i--) { const j=secureIndex(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function getLength() {
  const n=Number($("length").value);
  if (!Number.isInteger(n)||n<8||n>64) throw new Error("Password length must be 8–64.");
  return n;
}
function selectedSets() {
  return Object.keys(CHARSETS).filter(k=>$(k).checked).map(k=>CHARSETS[k]);
}
function randomPassword(length=getLength()) {
  const sets=selectedSets();
  if (!sets.length) throw new Error("Select at least one character type.");
  if (length<sets.length) throw new Error("Increase the length to include every selected type.");
  const all=sets.join("");
  const chars=sets.map(s=>s[secureIndex(s.length)]);
  while(chars.length<length) chars.push(all[secureIndex(all.length)]);
  return shuffle(chars).join("");
}

// Personal mode: keeps the name/nickname in order, adds date parts,
// then appends random characters to reach the selected length.
function personalPassword() {
  const name=$("name").value.trim();
  const dob=$("dob").value.trim();
  const nickname=$("nickname").value.trim();
  const extra=$("extra").value.trim();
  if (!name&&!dob&&!nickname&&!extra) throw new Error("Enter at least one personal-data field.");

  const length=getLength(), sets=selectedSets();
  if (!sets.length) throw new Error("Select at least one character type.");
  if (length<sets.length) throw new Error("Increase the length to include every selected type.");

  const allowed = sets.join("");
  const hasUpper=$("upper").checked, hasLower=$("lower").checked;
  let word=(name||nickname||extra).replace(/[^a-zA-Z0-9]/g,"");
  if (word && hasUpper) word=word[0].toUpperCase()+word.slice(1);
  else if (word && hasLower) word=word.toLowerCase();

  const nums=(dob.match(/\d+/g)||[]);
  let dateText="";
  if (nums.length>=3) {
    // DD/MM/YYYY or DD-MM-YYYY
    dateText=(nums[2]||"").slice(-4);
    if (!dateText) dateText=nums[0]+nums[1];
  } else if (nums.length===1) {
    const d=nums[0];
    dateText=d.length===8?d.slice(4):d;
  }

  const symbolSet=CHARSETS.symbols;
  const chosenSymbol=$("symbols").checked ? symbolSet[secureIndex(symbolSet.length)] : "";
  let core=word;
  if (dateText && $("numbers").checked) core += dateText;
  if (chosenSymbol) core += chosenSymbol;

  // Include a second recognizable input if space allows.
  const second=(name && word!==name ? nickname : extra).replace(/[^a-zA-Z0-9]/g,"");
  if (second && core.length<length-3) core += second.slice(0, Math.max(0,length-core.length-3));

  // Ensure the core fits, then fill only the end with random characters.
  core=Array.from(core).slice(0,length).join("");
  while(core.length<length) {
    const pool=allowed;
    core += pool[secureIndex(pool.length)];
  }
  return core;
}
function updateStrength(p) {
  const types=[/[a-z]/.test(p),/[A-Z]/.test(p),/[0-9]/.test(p),/[^a-zA-Z0-9]/.test(p)].filter(Boolean).length;
  const score=Math.min(4,Math.floor(p.length/8)+(types>=3?1:0));
  $("strengthText").textContent="Estimated strength: "+["Very weak","Weak","Fair","Strong","Very strong"][score];
  $("strengthBar").style.width=["10%","25%","50%","75%","100%"][score];
  $("strengthBar").style.background=score<2?"#ef4444":score<4?"#eab308":"#22c55e";
}
function display(p) {
  passwordInput.value=p; passwordInput.type="password";
  $("showBtn").textContent="Show"; $("showBtn").setAttribute("aria-label","Show password");
  $("message").textContent=""; updateStrength(p);
}
function generate(mode) {
  try { display(mode==="personal"?personalPassword():randomPassword()); }
  catch(e) { $("message").textContent=e.message; }
}
$("randomBtn").addEventListener("click",()=>generate("random"));
$("personalBtn").addEventListener("click",()=>generate("personal"));
$("refreshBtn").addEventListener("click",()=>generate("random"));
$("showBtn").addEventListener("click",()=>{
  const showing=passwordInput.type==="text";
  passwordInput.type=showing?"password":"text";
  $("showBtn").textContent=showing?"Show":"Hide";
  $("showBtn").setAttribute("aria-label",showing?"Show password":"Hide password");
});
$("copyBtn").addEventListener("click",async()=>{
  if(!passwordInput.value){$("message").textContent="Generate a password first.";return;}
  try { await navigator.clipboard.writeText(passwordInput.value); $("message").textContent="Password copied to clipboard."; }
  catch {
    passwordInput.type="text"; passwordInput.select();
    const ok=document.execCommand("copy"); passwordInput.setSelectionRange(0,0); passwordInput.type="password";
    $("message").textContent=ok?"Password copied.":"Copy failed. Select and copy manually.";
  }
});
$("length").addEventListener("input",()=>{const n=Number($("length").value);if(Number.isInteger(n)&&n>=8&&n<=64)$("lengthSlider").value=n;});
$("lengthSlider").addEventListener("input",()=>$("length").value=$("lengthSlider").value);
generate("random");
