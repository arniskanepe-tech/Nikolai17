// assets/game.js
(() => {
  // ===== Level 1 (tests) =====
  const level = {
    id: 1,
    answer: "345",
    // 0..8, 0 = augšā (12:00)
    targetSlot: 0,
    symbols: ["★","☾","▲","◆","✚","⬣","⬟","●","▣"],
  };

  const diskShell = document.getElementById("diskShell");
  const canvas = document.getElementById("diskCanvas");
  const feedback = document.getElementById("feedback");
  const targetSymbolLabel = document.getElementById("targetSymbolLabel");

  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: level.targetSlot,
    symbols: level.symbols
  });

  targetSymbolLabel.textContent = level.symbols[level.targetSlot];

  // Sākumā: stūrī, tikai auto-rotate
  let isOpen = false;
  let solved = false;

  disk.setInteractive(false);
  disk.renderStatus("?", false);

  function openDisk(){
    if (isOpen) return;
    isOpen = true;

    diskShell.classList.add("disk-center");
    diskShell.classList.remove("disk-corner");

    disk.setInteractive(true);

    // ja jau atrisināts, rādām OK; ja nē, tad ?
    disk.renderStatus(solved ? "OK" : "?", solved);

    feedback.innerHTML =
      `Uzgriez disku, līdz pretī mērķa simbolam <strong>${level.symbols[level.targetSlot]}</strong> redzi kodu <strong>${level.answer}</strong>. ` +
      `Kad pareizi — centrā parādīsies <strong>OK</strong>.`;
  }

  function closeDisk(){
    if (!isOpen) return;
    isOpen = false;

    diskShell.classList.add("disk-corner");
    diskShell.classList.remove("disk-center");

    disk.setInteractive(false);
    // stūrī atstāj kā ir (auto-rotate), solved statusu nemainām
  }

  // Klikšķis uz diska atver TIKAI stūra režīmā
  diskShell.addEventListener("click", (e) => {
    if (!diskShell.classList.contains("disk-corner")) return;
    openDisk();
  });

  // Klikšķis ārpus diska aizver
  document.addEventListener("pointerdown", (e) => {
    if (!isOpen) return;
    if (diskShell.contains(e.target)) return;
    closeDisk();
  });

  // Pārbaude: ja kods sakrīt -> fiksē OK (neatceļam vairs)
  function loop(){
    if (!solved) {
      const atTarget = disk.getCodeAtTarget();
      if (atTarget === level.answer){
        solved = true;
        disk.renderStatus("OK", true);
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();