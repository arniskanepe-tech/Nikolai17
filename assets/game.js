// assets/game.js
(() => {
  const level = {
    id: 1,
    answer: "345",
    targetSlot: 1,
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

    feedback.innerHTML =
      `Uzgriez disku, līdz pretī mērķa simbolam <strong>${level.symbols[level.targetSlot]}</strong> redzi kodu <strong>${level.answer}</strong>. ` +
      `Kad esi gatavs, spied centrā <strong>Pārbaudīt</strong>.`;
  }

  function closeDisk(){
    if (!isOpen) return;
    isOpen = false;

    diskShell.classList.add("disk-corner");
    diskShell.classList.remove("disk-center");

    disk.setInteractive(false);
  }

  // atver tikai stūrī
  diskShell.addEventListener("click", () => {
    if (!diskShell.classList.contains("disk-corner")) return;
    openDisk();
  });

  // klikšķis ārpus diska aizver
  document.addEventListener("pointerdown", (e) => {
    if (!isOpen) return;
    if (diskShell.contains(e.target)) return;
    closeDisk();
  });

  // POGA “Pārbaudīt” -> te notiek salīdzināšana
  disk.setOnCheck(() => {
    if (!isOpen) return;

    const atTarget = disk.getCodeAtTarget();
    if (atTarget === level.answer){
      solved = true;
      disk.renderStatus("OK", true);
    } else {
      solved = false;
      disk.renderStatus("NĒ", false); // vari mainīt uz "X" vai "NO"
    }
  });
})();