// assets/game.js
(() => {
  // ============ Konfigurācija (pagaidām hardcoded; vēlāk varēs vilkt no admin/JSON) ============
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  // ===== Welcome / start gate (dzimšanas dienas režīms) =====
  const intro = {
    greeting: "Čau, Nikola! Daudz laimes dzimšanas dienā! Vai esi gatava?",
    answer: "jā",
    wrongHint: "tiešām?"
  };

  const levels = [
    {
      id: 1,
      title: "Uzdevums #1",
      background: "bg.jpg",
      targetSlot: 1,      // ☾
      answer: "345",
      cardHtml: `
        <p>Kas par fantastisku Gadu Secību bijusi.</p>
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
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
    },
        {
      id: 3,
      title: "Uzdevums #3",
      background: "bg2.jpg",
      targetSlot: 3,      // ☾
      answer: "159",
      cardHtml: `
        <p>Remember the running.</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
    }
    {
      id: 4,
      title: "Uzdevums #4",
      background: "bg3.jpg",
      targetSlot: 2,      // ☾
      answer: "713",
      cardHtml: `
        <p>Hello, Nikola.</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
    }
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

  // ===== Welcome elements =====
  const welcome = document.getElementById("welcome");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeInput = document.getElementById("welcomeInput");
  const welcomeHint = document.getElementById("welcomeHint");

  function normalize(s){
    return (s || "").trim().toLowerCase();
  }

  function showWelcomeHint(txt){
    if (!welcomeHint) return;
    welcomeHint.textContent = txt;
    welcomeHint.classList.add("show");
    setTimeout(() => welcomeHint.classList.remove("show"), 900);
  }

  function startGame(){
    // ielādējam 1. līmeni
    loadLevel(0);
    // fokusam uz spēli: disks paliek stūrī, spēlētājs pats atver
    closeDisk();
  }

  function setupWelcome(){
    if (!welcome) { startGame(); return; }

    welcomeTitle.textContent = intro.greeting;

    // === FIX: support "dead keys" / composition (ā, ē, ģ, ķ, etc.) on desktop ===
    let isComposing = false;

    function tryValidateWelcome(force = false) {
      const v = normalize(welcomeInput.value);

      // Ja nav force (piem. Enter), tad nelec virsū kamēr nav vismaz 2 burti
      if (!force && v.length < 2) return;

      if (v === normalize(intro.answer)) {
        welcome.style.display = "none";
        startGame();
      } else {
        // ja nav force un tomēr <2, nesaucam par kļūdu
        if (!force && v.length < 2) return;

        showWelcomeHint(intro.wrongHint);
        welcomeInput.value = "";
        welcomeInput.focus();
      }
    }

    welcomeInput.addEventListener("compositionstart", () => {
      isComposing = true;
    });

    welcomeInput.addEventListener("compositionend", () => {
      isComposing = false;
      tryValidateWelcome();
    });

    welcomeInput.addEventListener("input", () => {
      if (isComposing) return; // kamēr veido ā/ē/ģ utt. – neko nedaram
      tryValidateWelcome();
    });

    welcomeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        tryValidateWelcome(true);
      }
    });

    setTimeout(() => welcomeInput.focus(), 0);
  }

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
      disk.setInteractive(true);
    } else {
      feedback.innerHTML =
        `Klikšķini uz diska stūrī, lai atvērtu. Kad pareizi — centrā parādīsies <strong>OK</strong>.`;
      disk.setInteractive(true);
    }
  }

  // sākuma stāvoklis
  disk.setInteractive(false);
  disk.setInteractive(true);
  setupWelcome();

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

    // vizuāli atgriež
    disk.setInteractive(true);
    resultMsg.textContent = "";

    // atstāj disku stūrī (spēlētājs pats atver)
    closeDisk();
  });
})();
