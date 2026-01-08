// assets/game.js
(() => {
  // ===== Level 1 (tavs test) =====
  const level = {
    id: 1,
    answer: "345",
    // 0..8, 0 = augšā (12:00). “1. kārts” = mūsu izvēlētais simbols.
    targetSlot: 0,
    symbols: ["★","☾","▲","◆","✚","⬣","⬟","●","▣"], // nomainīsim, kad iedosi precīzos
  };

  const diskShell = document.getElementById("diskShell");
  const canvas = document.getElementById("diskCanvas");
  const feedback = document.getElementById("feedback");
  const codeInput = document.getElementById("codeInput");
  const checkBtn = document.getElementById("checkBtn");
  const hud = document.getElementById("hud");
  const targetSymbolLabel = document.getElementById("targetSymbolLabel");

  // init disk
  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: level.targetSlot,
    symbols: level.symbols
  });

  targetSymbolLabel.textContent = level.symbols[level.targetSlot];

  // Sākumā: stūrī, tikai auto-rotate
  let isOpen = false;
  disk.setInteractive(false);
  disk.renderStatus("?", false);

  // click uz diska -> uz centru / atpakaļ uz stūri
  diskShell.addEventListener("click", (e) => {
    // ja klikšķis bija uz input/kārts, ignorē
    if (e.target.closest(".task-card")) return;

    isOpen = !isOpen;
    diskShell.classList.toggle("disk-center", isOpen);
    diskShell.classList.toggle("disk-corner", !isOpen);

    disk.setInteractive(isOpen);
    feedback.textContent = isOpen
      ? `Uzgriez kodu pretī simbolam ${level.symbols[level.targetSlot]} un spied “Pārbaudīt”.`
      : "—";

    // kad atver, fokusē input (ērti uz datora)
    if (isOpen) setTimeout(() => codeInput.focus(), 350);
  });

  // ierobežojam ievadi uz cipariem
  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0,3);
  });

  function check(){
    const typed = codeInput.value.trim();
    const atTarget = disk.getCodeAtTarget();

    // debug HUD (vari vēlāk noņemt)
    hud.textContent = `Pretī ${level.symbols[level.targetSlot]}: ${atTarget} | Ievadīts: ${typed}`;

    const ok = (typed === level.answer) && (atTarget === level.answer);

    if (ok){
      disk.renderStatus("OK", true);
      feedback.textContent = "✅ Pareizi! Šeit vēlāk būs pāreja uz nākamo lapu.";
      feedback.style.background = "rgba(52, 211, 153, .18)";
    } else {
      disk.renderStatus("?", false);
      feedback.textContent = "❌ Vēl nav. Kodam jāsakrīt gan ievadē, gan uz diska pretī mērķa simbolam.";
      feedback.style.background = "rgba(239, 68, 68, .12)";
    }
  }

  checkBtn.addEventListener("click", check);
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") check();
  });

  // sākotnējais HUD
  hud.textContent = `Mērķis: ${level.symbols[level.targetSlot]} | Meklējam: ${level.answer}`;
})();
