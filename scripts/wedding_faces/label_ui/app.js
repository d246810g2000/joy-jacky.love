let photos = [];
let currentIndex = 0;
let currentPhoto = null;
let activeFaceId = null;
let isLabeling = false;
let drawMode = false;
let drawStart = null;
let drawRectEl = null;
let selectedHostGuest = null;

const HIDDEN_STATUSES = new Set(["not_face", "skipped", "staff"]);
const PENDING_STATUSES = new Set(["unknown", "suggested"]);

const el = (id) => document.getElementById(id);

function isHiddenFace(face) {
  return HIDDEN_STATUSES.has(face.status);
}

function isModalOpen() {
  return !el("label-modal").classList.contains("hidden");
}

function faceDisplayParts(face) {
  if (face.status === "confirmed" && face.name) {
    if (face.companionOfName) {
      const table = face.table ? `第 ${face.table} 桌` : "";
      return {
        primary: face.name,
        secondary: `${face.companionOfName} 眷${table ? ` · ${table}` : ""}`,
      };
    }
    if (face.table) return { primary: face.name, secondary: `第 ${face.table} 桌` };
    return { primary: face.name, secondary: null };
  }
  if (face.status === "suggested" && face.suggestion) {
    return { primary: `可能是 ${face.suggestion}？`, secondary: null };
  }
  if (face.status === "staff" || face.status === "not_face") {
    return { primary: "不是臉", secondary: null };
  }
  return { primary: null, secondary: null };
}

function applyLocalFaceStatus(faceId, status, label = null, applyCluster = false) {
  const face = currentPhoto?.faces?.find((f) => f.faceId === faceId);
  if (!face) return;

  const targets = applyCluster && face.clusterId
    ? currentPhoto.faces.filter((f) => f.clusterId === face.clusterId)
    : [face];

  for (const target of targets) {
    if (status === "not_face" && target.status === "confirmed") continue;
    target.status = status;
    target.suggestion = null;
    target.suggestionScore = null;
    if (status === "confirmed" && label) {
      target.name = label.name;
      target.guestId = label.guestId ?? null;
      target.table = label.table ?? null;
      target.companionOfGuestId = label.companionOfGuestId ?? null;
      target.companionOfName = label.companionOfName ?? null;
      target.nameType = label.nameType ?? null;
    } else if (status === "staff") {
      target.name = "非賓客";
      target.guestId = null;
      target.table = null;
      target.companionOfGuestId = null;
      target.companionOfName = null;
      target.nameType = "staff";
    } else if (status === "not_face" || status === "skipped") {
      target.name = null;
      target.guestId = null;
      target.table = null;
      target.companionOfGuestId = null;
      target.companionOfName = null;
      target.nameType = null;
    }
  }

  renderFaces();
  renderPeopleStrip();
  updatePhotoMeta();
}

function guestToLabel(guest) {
  return {
    name: guest.name,
    guestId: guest.id,
    table: guest.table ?? null,
    companionOfGuestId: null,
    companionOfName: null,
    nameType: "guest",
  };
}

function personToLabel(person) {
  if (person.source === "known" || person.nameType === "companion" || person.nameType === "custom") {
    return {
      name: person.name,
      guestId: null,
      table: person.table ?? null,
      companionOfGuestId: person.companionOfGuestId ?? null,
      companionOfName: person.companionOfName ?? null,
      nameType: person.nameType || (person.companionOfName ? "companion" : "custom"),
    };
  }
  return guestToLabel(person);
}

function customToLabel(name, hostGuest = null) {
  const trimmed = (name || "").trim();
  return {
    name: trimmed, // may be empty → server auto-names 「某某眷」
    guestId: null,
    table: hostGuest?.table ?? null,
    companionOfGuestId: hostGuest?.id ?? null,
    companionOfName: hostGuest?.name ?? null,
    nameType: hostGuest ? "companion" : "custom",
  };
}

function resetCustomPanel(face = null) {
  selectedHostGuest = null;
  el("custom-name").value = face?.name && face.nameType !== "guest" ? face.name : "";
  el("host-search").value = "";
  el("host-results").innerHTML = "";
  updateCustomHint();
}

function updateCustomHint() {
  const hint = el("custom-table-hint");
  const typed = el("custom-name").value.trim();
  if (selectedHostGuest) {
    const autoName = typed || `${selectedHostGuest.name}眷`;
    hint.textContent = typed
      ? `將標為「${typed}」· ${selectedHostGuest.name} 眷 · 第 ${selectedHostGuest.table ?? "—"} 桌`
      : `未填姓名 → 自動命名「${autoName}」· 第 ${selectedHostGuest.table ?? "—"} 桌`;
    hint.classList.add("selected");
  } else {
    hint.textContent = "可只選正賓不填姓名（自動「某某眷」），或自填姓名";
    hint.classList.remove("selected");
  }
}

function unnamedPendingFaces(faces = currentPhoto?.faces || []) {
  return faces.filter(
    (f) => !isHiddenFace(f) && (f.status === "unknown" || f.status === "suggested")
  );
}

async function finalizeCurrentPhoto() {
  if (!currentPhoto?.id) return { cleared: 0 };
  if (!unnamedPendingFaces().length) return { cleared: 0 };

  return fetchJSON(`/api/photo/${currentPhoto.id}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

async function refreshPhotoList() {
  const mode = el("mode-select").value;
  photos = await fetchJSON(`/api/photos?mode=${mode}`);
  if (!photos.length) {
    el("photo-title").textContent = "沒有符合的照片";
    el("photo-meta").textContent = "";
    currentPhoto = null;
    updateScrubber();
  }
  return photos;
}

function photoFullyLabeled() {
  return currentPhoto?.id && unnamedPendingFaces().length === 0;
}

/** 待標記模式下離開已完成的照片：重載清單並找到下一張。 */
async function leaveCompletedPendingPhoto(delta, leavingId, oldIds, oldIdx) {
  await refreshPhotoList();
  if (!photos.length) return;

  let nextId = null;
  if (delta > 0) {
    for (let i = oldIdx + 1; i < oldIds.length; i++) {
      if (oldIds[i] !== leavingId && photos.some((p) => p.id === oldIds[i])) {
        nextId = oldIds[i];
        break;
      }
    }
    if (!nextId) nextId = photos[0].id;
  } else {
    for (let i = oldIdx - 1; i >= 0; i--) {
      if (oldIds[i] !== leavingId && photos.some((p) => p.id === oldIds[i])) {
        nextId = oldIds[i];
        break;
      }
    }
    if (!nextId) nextId = photos[photos.length - 1].id;
  }

  const idx = photos.findIndex((p) => p.id === nextId);
  await showPhoto(idx >= 0 ? idx : 0);
}

async function navigatePhoto(delta) {
  if (isModalOpen() || isLabeling) return;
  if (!currentPhoto || !photos.length) {
    await showPhoto(currentIndex + delta);
    return;
  }

  const mode = el("mode-select").value;
  const leavingId = currentPhoto.id;
  const oldIds = photos.map((p) => p.id);
  const oldIdx = currentIndex;
  const done = photoFullyLabeled();

  // 還沒全部標記完：只翻頁，不自動排除、不變已標記
  if (mode === "pending" && !done) {
    await showPhoto(currentIndex + delta);
    return;
  }

  // 畫面人都標完了：離開時重載清單，此張才進已標記
  if (mode === "pending" && done) {
    isLabeling = true;
    try {
      await loadProgress();
      await leaveCompletedPendingPhoto(delta, leavingId, oldIds, oldIdx);
    } finally {
      isLabeling = false;
    }
    return;
  }

  await showPhoto(currentIndex + delta);
}

async function goToPhotoIndex(targetIndex) {
  if (isModalOpen() || isLabeling || !photos.length) return;
  const clamped = Math.max(0, Math.min(targetIndex, photos.length - 1));
  if (clamped === currentIndex) return;

  const mode = el("mode-select").value;
  const leavingId = currentPhoto?.id;
  const oldIds = photos.map((p) => p.id);
  const oldIdx = currentIndex;
  const done = photoFullyLabeled();

  if (mode === "pending" && done && leavingId) {
    isLabeling = true;
    try {
      await loadProgress();
      await refreshPhotoList();
      if (!photos.length) return;
      // 目標 index 可能因清單縮短而需夾住；盡量對到原目標之後的照片
      let nextId = null;
      for (let i = clamped; i < oldIds.length; i++) {
        if (oldIds[i] !== leavingId && photos.some((p) => p.id === oldIds[i])) {
          nextId = oldIds[i];
          break;
        }
      }
      if (!nextId) {
        for (let i = clamped - 1; i >= 0; i--) {
          if (oldIds[i] !== leavingId && photos.some((p) => p.id === oldIds[i])) {
            nextId = oldIds[i];
            break;
          }
        }
      }
      const idx = nextId
        ? photos.findIndex((p) => p.id === nextId)
        : Math.max(0, Math.min(clamped, photos.length - 1));
      await showPhoto(idx >= 0 ? idx : 0);
    } finally {
      isLabeling = false;
    }
    return;
  }

  await showPhoto(clamped);
}

async function clearUnnamedFaces() {
  if (isLabeling || !currentPhoto) return;
  if (isModalOpen()) closeLabelModal();

  const targets = unnamedPendingFaces();
  if (!targets.length) {
    alert("此張沒有未命名人臉可排除（已是已標記狀態）。");
    return;
  }

  isLabeling = true;
  const photoId = currentPhoto.id;
  try {
    const result = await finalizeCurrentPhoto();
    const cleared = result.cleared || 0;
    if (!cleared) {
      alert("沒有排除任何臉，請再試一次。");
      return;
    }

    await loadProgress();

    const mode = el("mode-select").value;
    await loadPhotos();

    if (mode !== "pending") {
      const idx = photos.findIndex((p) => p.id === photoId);
      if (idx >= 0) await showPhoto(idx);
    }
  } catch (err) {
    alert(err.message || "排除失敗");
    await showPhoto(currentIndex);
  } finally {
    isLabeling = false;
  }
}

async function repredictCurrentPhoto() {
  if (isLabeling || !currentPhoto) return;
  if (isModalOpen()) closeLabelModal();

  isLabeling = true;
  const photoId = currentPhoto.id;
  try {
    el("progress-text").textContent = "重新預測中…";
    const result = await fetchJSON(`/api/photo/${photoId}/repredict`, {
      method: "POST",
    });
    if (result.progress) {
      // loadProgress will refresh text
    }
    await loadProgress();
    await loadPhotos();
    const idx = photos.findIndex((p) => p.id === photoId);
    if (idx >= 0) {
      await showPhoto(idx);
    } else {
      // 重新預測後可能又變回待標記；切到待標記找它
      el("mode-select").value = "pending";
      await loadPhotos();
      const pendingIdx = photos.findIndex((p) => p.id === photoId);
      if (pendingIdx >= 0) await showPhoto(pendingIdx);
    }
  } catch (err) {
    alert(err.message || "重新預測失敗");
    await showPhoto(currentIndex);
  } finally {
    isLabeling = false;
  }
}

function isPendingFace(face) {
  return PENDING_STATUSES.has(face.status || "unknown");
}

function visibleFaces(faces = currentPhoto?.faces || []) {
  return faces.filter((face) => !isHiddenFace(face));
}

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function loadProgress() {
  const p = await fetchJSON("/api/progress");
  if (p.totalFaces) {
    el("progress-text").textContent =
      `臉 ${Math.round((p.namedFaceRate || 0) * 100)}% · 照片 ${Math.round((p.photoNameRate || 0) * 100)}%`;
  } else {
    el("progress-text").textContent = "尚未擴散";
  }
}

async function loadPhotos() {
  await refreshPhotoList();
  if (photos.length === 0) return;
  const saved = parseInt(sessionStorage.getItem(scrubStorageKey()) || "", 10);
  if (!Number.isNaN(saved) && saved >= 0 && saved < photos.length) {
    currentIndex = saved;
  } else if (currentIndex >= photos.length) {
    currentIndex = 0;
  }
  await showPhoto(currentIndex);
}

function scrubStorageKey() {
  return `label-ui-index-${el("mode-select").value}`;
}

function saveScrubIndex() {
  try {
    sessionStorage.setItem(scrubStorageKey(), String(currentIndex));
  } catch (_) { /* ignore */ }
}

function updateScrubber(previewIndex = null) {
  const scrub = el("photo-scrubber");
  const jump = el("photo-jump");
  const pos = el("scrub-position");
  const btnJump = el("btn-jump");
  const total = photos.length;

  if (!total) {
    scrub.disabled = true;
    jump.disabled = true;
    btnJump.disabled = true;
    pos.textContent = "— / —";
    return;
  }

  const idx = previewIndex != null
    ? Math.max(0, Math.min(previewIndex, total - 1))
    : currentIndex;
  const photo = photos[idx];

  scrub.disabled = false;
  jump.disabled = false;
  btnJump.disabled = false;
  scrub.min = 1;
  scrub.max = total;
  scrub.value = idx + 1;
  jump.min = 1;
  jump.max = total;
  jump.value = idx + 1;
  pos.textContent = `${idx + 1} / ${total} · ${photo?.id || "—"}`;
}

async function jumpToPhoto() {
  if (isModalOpen() || isLabeling || !photos.length) return;
  const n = parseInt(el("photo-jump").value, 10);
  if (Number.isNaN(n)) return;
  await goToPhotoIndex(n - 1);
}

function updatePhotoMeta() {
  const faces = currentPhoto?.faces || [];
  const shown = visibleFaces(faces);
  const pending = shown.filter(isPendingFace);
  const hidden = faces.length - shown.length;
  const hiddenNote = hidden > 0 ? ` · 已排除 ${hidden}` : "";
  el("photo-meta").textContent =
    `待標記 ${pending.length} · 可見 ${shown.length} 張臉${hiddenNote} · 全部標完再下一張才會進已標記 · S 排除剩餘未命名 · R 重新預測 · M 框選臉`;
}

async function showPhoto(index) {
  if (!photos.length) return;
  currentIndex = Math.max(0, Math.min(index, photos.length - 1));
  const p = photos[currentIndex];
  currentPhoto = await fetchJSON(`/api/photo/${p.id}`);

  el("photo-title").textContent = `${p.id} · ${p.time || "—"} · ${p.stageId || ""}`;

  const img = el("photo-img");
  const paintFaces = () => renderFaces();
  img.onload = paintFaces;
  img.src = currentPhoto.imageUrl + "?t=" + Date.now();
  paintFaces();

  updatePhotoMeta();
  renderPeopleStrip();
  updateScrubber();
  saveScrubIndex();
}

function syncOverlayLayers() {
  const img = el("photo-img");
  const layer = el("face-layer");
  const drawLayer = el("draw-layer");
  if (!img.clientWidth || !img.clientHeight) return;
  const w = `${img.clientWidth}px`;
  const h = `${img.clientHeight}px`;
  layer.style.width = w;
  layer.style.height = h;
  drawLayer.style.width = w;
  drawLayer.style.height = h;
}

function setDrawMode(on) {
  drawMode = on;
  el("btn-draw-face").classList.toggle("active", on);
  el("photo-stage").classList.toggle("draw-mode", on);
  el("draw-layer").setAttribute("aria-hidden", on ? "false" : "true");
  if (!on) cancelDraw();
}

function cancelDraw() {
  drawStart = null;
  if (drawRectEl) {
    drawRectEl.remove();
    drawRectEl = null;
  }
}

function pointerToNorm(e) {
  const layer = el("draw-layer");
  const rect = layer.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

function updateDrawRect(start, end) {
  if (!drawRectEl) return;
  const bx = Math.min(start.x, end.x);
  const by = Math.min(start.y, end.y);
  const bw = Math.abs(end.x - start.x);
  const bh = Math.abs(end.y - start.y);
  drawRectEl.style.left = `${bx * 100}%`;
  drawRectEl.style.top = `${by * 100}%`;
  drawRectEl.style.width = `${bw * 100}%`;
  drawRectEl.style.height = `${bh * 100}%`;
}

function setupDrawLayer() {
  const layer = el("draw-layer");

  layer.addEventListener("pointerdown", (e) => {
    if (!drawMode || isLabeling || isModalOpen() || !currentPhoto) return;
    e.preventDefault();
    layer.setPointerCapture(e.pointerId);
    drawStart = pointerToNorm(e);
    if (drawRectEl) drawRectEl.remove();
    drawRectEl = document.createElement("div");
    drawRectEl.className = "draw-rect";
    layer.appendChild(drawRectEl);
    updateDrawRect(drawStart, drawStart);
  });

  layer.addEventListener("pointermove", (e) => {
    if (!drawStart || !drawRectEl) return;
    updateDrawRect(drawStart, pointerToNorm(e));
  });

  const finishDraw = async (e) => {
    if (!drawStart || !currentPhoto) return;
    if (layer.hasPointerCapture(e.pointerId)) {
      layer.releasePointerCapture(e.pointerId);
    }
    const end = pointerToNorm(e);
    const bx = Math.min(drawStart.x, end.x);
    const by = Math.min(drawStart.y, end.y);
    const bw = Math.abs(end.x - drawStart.x);
    const bh = Math.abs(end.y - drawStart.y);
    cancelDraw();
    if (bw < 0.02 || bh < 0.02) return;

    isLabeling = true;
    try {
      const result = await fetchJSON(`/api/photo/${currentPhoto.id}/faces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box: [bx, by, bw, bh] }),
      });
      await showPhoto(currentIndex);
      const face = currentPhoto.faces.find((f) => f.faceId === result.face.faceId);
      if (face) openLabelModal(face);
    } catch (err) {
      alert(err.message);
    } finally {
      isLabeling = false;
    }
  };

  layer.addEventListener("pointerup", finishDraw);
  layer.addEventListener("pointercancel", () => cancelDraw());
}

function renderFaces() {
  const layer = el("face-layer");
  layer.innerHTML = "";
  const img = el("photo-img");
  if (!img.clientWidth || !img.clientHeight) return;

  syncOverlayLayers();

  const displayW = img.clientWidth;
  const displayH = img.clientHeight;

  visibleFaces().forEach((face, i) => {
    const [bx, by, bw, bh] = face.box;
    const size = Math.max(48, Math.min(110, Math.min(bw * displayW, bh * displayH) * 1.15));

    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = `face-hotspot ${face.status || "unknown"}`;
    hotspot.style.left = `${(bx + bw / 2) * 100}%`;
    hotspot.style.top = `${(by + bh / 2) * 100}%`;
    hotspot.dataset.faceId = face.faceId;
    hotspot.setAttribute("aria-label", `臉 ${i + 1}`);

    const circle = document.createElement("div");
    circle.className = "face-circle";
    circle.style.width = circle.style.height = `${size}px`;

    if (face.status === "confirmed" && face.cropUrl) {
      const crop = document.createElement("img");
      crop.src = face.cropUrl;
      crop.alt = face.name || "";
      circle.appendChild(crop);
    } else if (face.cropUrl) {
      const crop = document.createElement("img");
      crop.src = face.cropUrl;
      crop.alt = "";
      circle.style.opacity = "0.85";
      circle.appendChild(crop);
    } else {
      circle.innerHTML = '<span class="qmark">?</span>';
    }

    hotspot.appendChild(circle);

    const labelParts = faceDisplayParts(face);

    if (labelParts.primary) {
      const wrap = document.createElement("div");
      wrap.className = "face-label-wrap";
      const label = document.createElement("span");
      label.className = "face-label";
      label.textContent = labelParts.primary;
      wrap.appendChild(label);
      if (labelParts.secondary) {
        const sub = document.createElement("span");
        sub.className = "face-label-sub";
        sub.textContent = labelParts.secondary;
        wrap.appendChild(sub);
      }
      hotspot.appendChild(wrap);
    }

    hotspot.addEventListener("click", () => openLabelModal(face));
    layer.appendChild(hotspot);
  });
}

function renderPeopleStrip() {
  const strip = el("people-strip");
  strip.innerHTML = "";
  visibleFaces().forEach((face) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `person-chip ${face.status || "unknown"}`;
    const img = document.createElement("img");
    img.src = face.cropUrl;
    img.alt = "";
    chip.appendChild(img);
    const text = document.createElement("span");
    const parts = faceDisplayParts(face);
    text.textContent = parts.primary || "?";
    if (parts.secondary && face.status === "confirmed") {
      text.title = parts.secondary;
    }
    chip.appendChild(text);
    chip.addEventListener("click", () => openLabelModal(face));
    strip.appendChild(chip);
  });
}

function openLabelModal(face) {
  setDrawMode(false);
  activeFaceId = face.faceId;
  el("label-modal").classList.remove("hidden");
  el("guest-search").value = "";
  el("guest-results").innerHTML = "";
  el("btn-confirm-suggestion").classList.toggle("hidden", face.status !== "suggested");
  el("apply-cluster").checked = !(
    face.manual || face.nameType === "companion" || face.nameType === "custom"
  );
  el("apply-cluster-label").textContent = face.manual
    ? "一併套用到同群（手框預設關閉）"
    : "一併套用到同群";
  resetCustomPanel(face);
  if (face.companionOfGuestId && face.companionOfName) {
    selectedHostGuest = {
      id: face.companionOfGuestId,
      name: face.companionOfName,
      table: face.table,
    };
    el("host-search").value = face.companionOfName;
    updateCustomHint();
  }
  if (face.status === "suggested") {
    el("btn-confirm-suggestion").onclick = () => confirmSuggestion(face);
  }

  searchGuests("");
  setTimeout(() => el("guest-search").focus(), 100);
}

function closeLabelModal() {
  el("label-modal").classList.add("hidden");
  activeFaceId = null;
  selectedHostGuest = null;
}

function renderGuestListItem(g, onPick) {
  const li = document.createElement("li");
  const score = g.matchScore || 0;
  const scoreLabel = score >= 0.75
    ? `<span class="match-badge high">${Math.round(score * 100)}% 相似</span>`
    : score >= 0.55
      ? `<span class="match-badge mid">${Math.round(score * 100)}% 可能</span>`
      : score > 0
        ? `<span class="match-badge low">${Math.round(score * 100)}%</span>`
        : "";
  const count = g.labelCount || 0;
  const countLabel = count > 0 ? `<span class="count-badge">入庫 ${count}</span>` : "";
  const tablePart = g.table ? `第 ${g.table} 桌` : "";
  const bits = [tablePart, g.side, g.relation].filter(Boolean);
  li.innerHTML = `<div class="guest-row"><span>${g.name}</span><span class="guest-badges">${countLabel}${scoreLabel}</span></div><div class="sub">${bits.join(" · ") || "—"}</div>`;
  li.addEventListener("click", () => onPick(g));
  return li;
}

async function searchGuests(q) {
  const faceId = activeFaceId || "";
  const guests = await fetchJSON(
    `/api/guests?q=${encodeURIComponent(q)}&faceId=${encodeURIComponent(faceId)}`
  );
  const ul = el("guest-results");
  ul.innerHTML = "";
  const trimmed = q.trim();

  if (!guests.length && !trimmed) {
    ul.innerHTML = '<li class="empty-hint">尚無相似推薦，請搜尋賓客／已建眷屬，或下方只選正賓</li>';
    return;
  }

  if (trimmed.length >= 2) {
    const createLi = document.createElement("li");
    createLi.className = "create-custom";
    createLi.textContent = `以「${trimmed}」標記為新姓名（攜眷 / 自填）`;
    createLi.addEventListener("click", () => {
      el("custom-name").value = trimmed;
      el("custom-name").focus();
      updateCustomHint();
    });
    ul.appendChild(createLi);
  }

  guests.forEach((g) => {
    ul.appendChild(renderGuestListItem(g, (person) => submitLabel(personToLabel(person))));
  });
}

async function searchHosts(q) {
  const guests = await fetchJSON(
    `/api/guests?q=${encodeURIComponent(q)}&hostsOnly=1`
  );
  const ul = el("host-results");
  ul.innerHTML = "";
  guests.forEach((g) => {
    const li = renderGuestListItem(g, (host) => {
      selectedHostGuest = host;
      el("host-search").value = host.name;
      ul.innerHTML = "";
      const picked = document.createElement("li");
      picked.className = "host-selected";
      picked.innerHTML = `<div class="guest-row"><span>${host.name}</span></div><div class="sub">第 ${host.table ?? "—"} 桌 · 點一下可重選 · 可不填姓名直接確認</div>`;
      picked.addEventListener("click", () => {
        selectedHostGuest = null;
        el("host-search").value = "";
        el("host-search").focus();
        updateCustomHint();
        searchHosts("");
      });
      ul.appendChild(picked);
      updateCustomHint();
    });
    ul.appendChild(li);
  });
}

async function submitLabel(label, status = "confirmed") {
  const faceId = activeFaceId;
  if (!faceId || isLabeling) return;

  isLabeling = true;
  const applyCluster = el("apply-cluster").checked;
  closeLabelModal();
  applyLocalFaceStatus(faceId, status, label, applyCluster);

  const body = label
    ? { ...label, applyCluster, status, autoPropagate: status === "confirmed" }
    : { applyCluster, status, autoPropagate: false };

  try {
    const result = await fetchJSON(`/api/face/${faceId}/label`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (result.face?.status !== status) {
      throw new Error(`標記失敗：伺服器回傳 ${result.face?.status || "未知"}，請重新整理頁面或重啟 label_server.py`);
    }

    await loadProgress();
    await showPhoto(currentIndex);
  } catch (err) {
    alert(err.message);
    await showPhoto(currentIndex);
  } finally {
    isLabeling = false;
  }
}

async function labelFace(guest, status = "confirmed") {
  if (status === "not_face" || status === "skipped" || status === "staff") {
    // 非賓客併入「不是臉」：一律當沒興趣排除
    await submitLabel(null, "not_face");
    return;
  }
  await submitLabel(personToLabel(guest), status);
}

function submitCustomLabel() {
  const name = el("custom-name").value.trim();
  if (!name && !selectedHostGuest) {
    alert("請輸入姓名，或先選擇「隨誰出席」正賓（不填姓名會自動命名為「某某眷」）");
    el("custom-name").focus();
    return;
  }
  submitLabel(customToLabel(name, selectedHostGuest));
}

async function confirmSuggestion(face) {
  await fetchJSON(`/api/face/${face.faceId}/label`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: face.suggestion,
      guestId: face.guestId,
      table: face.table,
      applyCluster: el("apply-cluster").checked,
      status: "confirmed",
      autoPropagate: true,
    }),
  });
  closeLabelModal();
  await loadProgress();
  await showPhoto(currentIndex);
}

async function loadClusters() {
  const clusters = await fetchJSON("/api/clusters");
  const list = el("cluster-list");
  list.innerHTML = "";
  clusters.slice(0, 50).forEach((c) => {
    const div = document.createElement("div");
    div.className = "cluster-item";
    const label = c.name || (c.labeled && c.status === "not_face" ? "已排除" : c.clusterId);
    div.innerHTML = `<img src="${c.cropUrl}" alt="" /><div><div>${label}</div><div class="count">${c.count} 張臉</div></div>`;
    list.appendChild(div);
  });
}

el("btn-prev").addEventListener("click", () => navigatePhoto(-1));
el("btn-next").addEventListener("click", () => navigatePhoto(1));
el("btn-finish-photo").addEventListener("click", () => clearUnnamedFaces());
el("btn-repredict").addEventListener("click", () => repredictCurrentPhoto());
el("btn-draw-face").addEventListener("click", () => setDrawMode(!drawMode));
el("mode-select").addEventListener("change", () => { loadPhotos(); });
el("photo-scrubber").addEventListener("input", (e) => {
  updateScrubber(parseInt(e.target.value, 10) - 1);
});
el("photo-scrubber").addEventListener("change", async (e) => {
  if (isModalOpen() || isLabeling) return;
  await goToPhotoIndex(parseInt(e.target.value, 10) - 1);
});
el("photo-jump").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    jumpToPhoto();
  }
});
el("btn-jump").addEventListener("click", () => jumpToPhoto());
el("btn-propagate").addEventListener("click", async () => {
  await fetchJSON("/api/propagate", { method: "POST" });
  await loadProgress();
  await loadPhotos();
});
el("guest-search").addEventListener("input", (e) => searchGuests(e.target.value));
el("host-search").addEventListener("input", (e) => searchHosts(e.target.value));
el("custom-name").addEventListener("input", () => updateCustomHint());
el("btn-custom-label").addEventListener("click", () => submitCustomLabel());
el("label-modal").querySelector(".modal-backdrop").addEventListener("click", closeLabelModal);
el("btn-not-face").addEventListener("click", async () => {
  try {
    await labelFace(null, "not_face");
  } catch (err) {
    alert(err.message);
  }
});

document.addEventListener("keydown", (e) => {
  const typing =
    e.target &&
    (e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "SELECT");

  if (isModalOpen()) {
    if (e.key === "Escape") {
      closeLabelModal();
      return;
    }
    if (!typing && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      clearUnnamedFaces();
    }
    if (!typing && (e.key === "r" || e.key === "R")) {
      e.preventDefault();
      repredictCurrentPhoto();
    }
    return;
  }
  if (isLabeling) return;
  if (typing) return;

  if (e.key === "Escape") {
    if (drawMode) {
      e.preventDefault();
      setDrawMode(false);
    }
    return;
  }
  if (e.key === "m" || e.key === "M") {
    e.preventDefault();
    setDrawMode(!drawMode);
    return;
  }

  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    e.preventDefault();
    navigatePhoto(-1);
  }
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    e.preventDefault();
    navigatePhoto(1);
  }
  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    clearUnnamedFaces();
  }
  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    repredictCurrentPhoto();
  }
  if (e.key === "p" || e.key === "P") el("btn-propagate").click();
});

window.addEventListener("resize", () => { if (currentPhoto) renderFaces(); });

setupDrawLayer();
loadProgress();
loadPhotos();
loadClusters();
