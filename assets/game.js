// assets/game.js
(() => {
  // ============ Konfigurācija (pagaidām hardcoded; vēlāk varēs vilkt no admin/JSON) ============
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  const levels = [
    {
      id: 1,
      title: "Uzdevums #1",
      background: "bg.jpg",
      targetSlot: 1,      // ☾
      answer: "345",
      cardHtml: `
        <p>Kas par fantastisku Gadu Secību bijusi.</p>
        <p><strong>Pareizā atbilde šoreiz būs 345.</strong></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
    },
    {
      id: 2,
      title: "Uzdevums #2",
      background: "bg1.jpg",
      targetSlot: 0,      // ★ (piemērs)
      answer: "789",
      cardHtml: `
        <p>Otra bilde — otrais uzdevums.</p>
        <p><strong>Pareizā atbilde šoreiz būs 789.</strong></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
    },
  ];

  const wrongMessages = [
    "Tā jau nu gan nebūs",
    "Sīkais, nu tu dod...",
    "Ola, Ola, seniorita...",
    "Wtf...",
    "Vēl kaut kādas grandiozas idejas..",
    "Asprāte, ja?",
    "Atpakaļ uz bērnu dārzu?",
    "Saņemies, tu to vari?",
    "Es zinu, ka tu vari labāk!",
    "Forza, forza!!!",
  ];

  // ============ DOM ============
  const scene = document.getElementById("scene");

  const diskShell = document.getElementById("diskShell");
  const canvas = document.getElementById("diskCanvas");

  const cardTitle = document.getElementById("cardTitle");
  const cardBody = document.getElementById("cardBody");
  const feedback = document.getElementById("feedback");
  const targetSymbolLabel = document.getElementById("targetSymbolLabel");
  const taskCard = document.getElementById("taskCard");

  const nextBtn = document.getElementById("nextBtn");
  const resultMsg = document.getElementById("resultMsg");

  // ============ Disks ============
  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: 0,
    symbols,
  });

  // ============ State ============
  let levelIndex = 0;
  let isOpen = false;
  let solved = false;

  // pool bez atkārtošanās, līdz iztukšojas
  let wrongPool = [...wrongMessages];

  function getNextWrongMessage() {
    if (wrongPool.length === 0) wrongPool = [...wrongMessages];
    const idx = Math.floor(Math.random() * wrongPool.length);
    return wrongPool.splice(idx, 1)[0];
  }

  function setNextVisible(visible) {
    nextBtn.hidden = !visible;
  }

  function resetResultUI() {
    resultMsg.textContent = "";
    setNextVisible(false);
  }

  function loadLevel(i) {
    levelIndex = i;

    const lvl = levels[levelIndex];

    // background
    scene.style.backgroundImage = `url("assets/${lvl.background}")`;

    // card
    cardTitle.textContent = lvl.title;
    cardBody.innerHTML = lvl.cardHtml;

    // target symbol
    targetSymbolLabel.textContent = symbols[lvl.targetSlot];

    // disk config
    disk.setTargetSlot(lvl.targetSlot);

    // state reset
    solved = false;
    resetResultUI();

    // ja disks ir atvērts, atjaunojam instrukciju tekstu
    if (isOpen) {
      feedback.innerHTML =
        `Uzgriez disku, līdz pretī mērķa simbolam <strong>${symbols[lvl.targetSlot]}</strong> redzi kodu. ` +
        `Kad esi gatavs, spied centrā <strong>Pārbaudīt</strong>.`;
      disk.renderStatus("?", false);
    } else {
      feedback.innerHTML =
        `Klikšķini uz diska stūrī, lai atvērtu. Kad pareizi — centrā parādīsies <strong>OK</strong>.`;
      disk.renderStatus("?", false);
    }
  }

  // sākuma stāvoklis
  disk.setInteractive(false);
  disk.renderStatus("?", false);
  loadLevel(0);

  function openDisk() {
    if (isOpen) return;
    isOpen = true;

    const lvl = levels[levelIndex];

    diskShell.classList.add("disk-center");
    diskShell.classList.remove("disk-corner");

    disk.setInteractive(true); // disk.js pats notīra statusu, ja vajag

    // šeit šobrīd nerādam pareizo atbildi – tikai instrukciju
    feedback.innerHTML =
      `Uzgriez disku, līdz pretī mērķa simbolam <strong>${symbols[lvl.targetSlot]}</strong> redzi kodu. ` +
      `Kad esi gatavs, spied centrā <strong>Pārbaudīt</strong>.`;
  }

  function closeDisk() {
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
    // klikšķi uz kārts (piem. poga "Tālāk") nedrīkst aizvērt disku
    if (taskCard && taskCard.contains(e.target)) return;
    closeDisk();
  });

  // ========= Mazais mērķis #1: "Tālāk" pēc OK + random teksts pēc NĒ =========

  // POGA “Pārbaudīt” -> te notiek salīdzināšana
  disk.setOnCheck(() => {
    if (!isOpen) return;

    const lvl = levels[levelIndex];
    const atTarget = disk.getCodeAtTarget();

    if (atTarget === lvl.answer) {
      solved = true;
      disk.renderStatus("OK", true);

      resultMsg.textContent = "";
      setNextVisible(true);

      feedback.innerHTML = `Pareizi! Spied <strong>Tālāk</strong>, lai pārietu uz nākamo uzdevumu.`;
    } else {
      solved = false;
      disk.renderStatus("NĒ", false);

      setNextVisible(false);
      resultMsg.textContent = getNextWrongMessage();

      // atstājam instrukciju, bet varam pielikt arī "mēģini vēl"
      // (īss, lai netraucē)
      feedback.innerHTML = `Pamēģini vēlreiz. Uzgriez kodu pretī <strong>${symbols[lvl.targetSlot]}</strong> un spied <strong>Pārbaudīt</strong>.`;

      // pēc īsa brīža atgriežam pogu "Pārbaudīt" (citādi centrā paliek NĒ)
      setTimeout(() => {
        if (!solved && isOpen) {
          // setInteractive(true) notīra statusu (statusOk = null) un rāda "Pārbaudīt"
          disk.setInteractive(true);
        }
      }, 800);
    }
  });

  // TĀLĀK -> nākamais līmenis (vai beigas)
  nextBtn.addEventListener("click", () => {
    if (!solved) return;

    const isLast = levelIndex >= levels.length - 1;
    if (isLast) {
      // vienkāršs finišs (vēlāk varēs taisīt "sākums no jauna" vai "menu")
      setNextVisible(false);
      resultMsg.textContent = "🎉 Viss! Spēle pabeigta.";
      feedback.innerHTML = "Ja gribi, vari pārlādēt lapu, lai sāktu no sākuma.";
      return;
    }

    loadLevel(levelIndex + 1);

    // vizuāli atgriežam sākuma statusu
    disk.renderStatus("?", false);

    // atstāj disku stūrī (spēlētājs pats atver)
    closeDisk();
  });
})();
