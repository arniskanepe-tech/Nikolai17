// assets/disk.js
// Disku komponents ar 3 grozāmiem riņķiem + 1 fiksētu simbolu gredzenu.
// + Centrā poga "Pārbaudīt" (klikšķis -> callback).
// Izmanto: window.DiskGameDisk.create({ canvas, targetSlot, symbols })

(function(){
  const SECTORS = 9;
  const TAU = Math.PI * 2;
  const STEP = TAU / SECTORS;

  // slot 0 = 12:00
  // FIX: +1 sektora kompensācija, lai nolasīšana sakrīt ar renderu
  function angleToTopIndex(angle){
    const idx = Math.round(-angle / STEP) + 1; // <<< KOMPENSĀCIJA +1
    return ((idx % SECTORS) + SECTORS) % SECTORS;
  }

  function roundRect(ctx, x, y, w, h, r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function create(opts){
    const canvas = opts.canvas;
    const ctx = canvas.getContext("2d");

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // ===== STATUS (centra teksts) =====
    let statusText = "?";
    let statusOk = false;

    // ===== “Pārbaudīt” poga =====
    // Poga augšā, lai apakšējā kartīte nepārklāj.
    const checkBtn = {
      r: 62,
      y: -62,
      label: "Pārbaudīt",
    };
    let onCheck = null;

    // ===== ārējais fiksētais simbolu gredzens =====
    const symbols = opts.symbols || ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];
    let targetSlot = Number.isInteger(opts.targetSlot) ? opts.targetSlot : 0;

    const fixedRing = {
      r0: 410,
      r1: 455,
      color: "#0b0f14",
      text: "#e5e7eb"
    };

    // ===== grozāmie riņķi =====
    const rings = [
      { name:'white', color:'#f8fafc', text:'#0f172a', r0:300, r1:395, angle: 0, digits:[1,2,3,4,5,6,7,8,9] },
      { name:'red',   color:'#d32f2f', text:'#ffffff', r0:220, r1:300, angle: 0, digits:[1,2,3,4,5,6,7,8,9] },
      { name:'blue',  color:'#1e88e5', text:'#0b1020', r0:140, r1:220, angle: 0, digits:[1,2,3,4,5,6,7,8,9] },
    ];

    const center = { r:140 };

    // ===== interaction =====
    let interactive = false;
    let activeRing = null;
    let startAngle = 0;
    let startRingAngle = 0;

    // auto-rotate when not interactive
    let autoAngle = 0;

    function ringValueAtSlot(ring, slot){
      const topIdx = angleToTopIndex(ring.angle);
      const idx = (topIdx + slot) % SECTORS;
      return ring.digits[idx];
    }

    function getCodeAtSlot(slot){
      const a = ringValueAtSlot(rings[0], slot);
      const b = ringValueAtSlot(rings[1], slot);
      const c = ringValueAtSlot(rings[2], slot);
      return `${a}${b}${c}`;
    }

    function drawFixedOuterRing(){
      ctx.beginPath();
      ctx.arc(0,0, fixedRing.r1, 0, TAU);
      ctx.arc(0,0, fixedRing.r0, 0, TAU, true);
      ctx.fillStyle = fixedRing.color;
      ctx.fill("evenodd");

      for(let i=0;i<SECTORS;i++){
        const a0 = i*STEP + (-Math.PI/2);
        const a1 = a0 + STEP;
        const mid = (a0+a1)/2;

        // robeža
        ctx.beginPath();
        ctx.moveTo(Math.cos(a0)*fixedRing.r0, Math.sin(a0)*fixedRing.r0);
        ctx.lineTo(Math.cos(a0)*fixedRing.r1, Math.sin(a0)*fixedRing.r1);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(255,255,255,.14)";
        ctx.stroke();

        // target highlight + bultiņa
        if(i === targetSlot){
          ctx.save();
          ctx.beginPath();
          ctx.arc(0,0, (fixedRing.r0+fixedRing.r1)/2, a0+0.06, a1-0.06);
          ctx.lineWidth = 9;
          ctx.strokeStyle = "rgba(212,162,74,.95)";
          ctx.stroke();
          ctx.restore();

          ctx.save();
          const r = fixedRing.r1 + 18;
          ctx.translate(Math.cos(mid)*r, Math.sin(mid)*r);
          ctx.rotate(mid + Math.PI/2);
          ctx.fillStyle = "rgba(212,162,74,.98)";
          ctx.font = "900 26px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("▼", 0, 0);
          ctx.restore();
        }

        // simbols
        const rr = (fixedRing.r0+fixedRing.r1)/2;
        const x = Math.cos(mid)*rr;
        const y = Math.sin(mid)*rr;

        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(mid + Math.PI/2);
        ctx.fillStyle = fixedRing.text;
        ctx.font = (i===targetSlot) ? "900 34px system-ui" : "800 32px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbols[i] ?? "•", 0, 0);
        ctx.restore();
      }
    }

    function drawRing(ring){
      ctx.save();
      ctx.rotate(ring.angle);

      for(let i=0;i<SECTORS;i++){
        const a0 = i*STEP + (-Math.PI/2);
        const a1 = a0 + STEP;

        ctx.beginPath();
        ctx.arc(0,0, ring.r1, a0, a1);
        ctx.arc(0,0, ring.r0, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = ring.color;
        ctx.fill();

        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,.26)";
        ctx.stroke();

        const mid = (a0+a1)/2;
        const rr = (ring.r0+ring.r1)/2;
        const x = Math.cos(mid)*rr;
        const y = Math.sin(mid)*rr;

        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(mid + Math.PI/2);
        ctx.fillStyle = ring.text;
        ctx.font = "900 44px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(ring.digits[i]), 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }

    function drawCenter(){
      // melnais centrs
      ctx.beginPath();
      ctx.arc(0,0, center.r, 0, TAU);
      ctx.fillStyle = "#0b0f14";
      ctx.fill();

      // status plāksnīte
      ctx.save();
      ctx.rotate(0.45);
      roundRect(ctx, -78, -40, 156, 80, 14);
      ctx.fillStyle = "#101826";
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#d4a24a";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = statusOk ? "#34d399" : "#e5e7eb";
      ctx.font = statusOk ? "900 54px system-ui" : "900 58px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(statusText, 26, -6);

      // “Pārbaudīt” poga (tikai, kad interactive)
      if (interactive){
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, checkBtn.y, checkBtn.r, 0, TAU);
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.stroke();

        ctx.fillStyle = "#e5e7eb";
        ctx.font = "800 20px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(checkBtn.label, 0, checkBtn.y);
        ctx.restore();
      }
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.save();
      ctx.translate(cx, cy);

      drawFixedOuterRing();
      rings.forEach(drawRing);
      drawCenter();

      // axle
      ctx.beginPath();
      ctx.arc(0,0, 18, 0, TAU);
      ctx.fillStyle = "#111827";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      ctx.restore();
    }

    function getPointerPos(e){
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      return {x,y};
    }

    function pickRing(x,y){
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx,dy);
      for(const ring of rings){
        if(r >= ring.r0 && r <= ring.r1) return ring;
      }
      return null;
    }

    function pointAngle(x,y){
      return Math.atan2(y - cy, x - cx);
    }

    function snapToSector(ring){
      ring.angle = Math.round(ring.angle / STEP) * STEP;
    }

    function isCheckButtonHit(x,y){
      const dx = x - cx;
      const dy = y - (cy + checkBtn.y);
      return Math.hypot(dx,dy) <= checkBtn.r;
    }

    function onDown(e){
      e.stopPropagation();
      if(!interactive) return;
      e.preventDefault();

      const {x,y} = getPointerPos(e);

      // Poga “Pārbaudīt”
      if (isCheckButtonHit(x,y)){
        if (typeof onCheck === "function") onCheck();
        return;
      }

      const ring = pickRing(x,y);
      if(!ring) return;

      activeRing = ring;
      startAngle = pointAngle(x,y);
      startRingAngle = ring.angle;

      window.addEventListener('pointermove', onMove, {passive:false});
      window.addEventListener('pointerup', onUp, {passive:false});
      window.addEventListener('pointercancel', onUp, {passive:false});
    }

    function onMove(e){
      if(!activeRing) return;
      e.preventDefault();

      const {x,y} = getPointerPos(e);
      activeRing.angle = startRingAngle + (pointAngle(x,y) - startAngle);
    }

    function onUp(e){
      if(!activeRing) return;
      e.preventDefault();

      snapToSector(activeRing);
      activeRing = null;

      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    }

    canvas.addEventListener('pointerdown', onDown, {passive:false});

    function tick(){
      if(!interactive){
        autoAngle += 0.0022;
        rings.forEach((r, idx) => {
          r.angle = autoAngle * (1 + idx * 0.06);
        });
      }
      draw();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    return {
      setInteractive(v){ interactive = !!v; },
      setTargetSlot(slot){ targetSlot = ((slot%SECTORS)+SECTORS)%SECTORS; },
      getTargetSlot(){ return targetSlot; },
      getCodeAtTarget(){ return getCodeAtSlot(targetSlot); },
      getCodeAtSlot,
      renderStatus(text, ok){
        statusText = text;
        statusOk = !!ok;
      },
      setOnCheck(fn){
        onCheck = (typeof fn === "function") ? fn : null;
      }
    };
  }

  window.DiskGameDisk = { create };
})();