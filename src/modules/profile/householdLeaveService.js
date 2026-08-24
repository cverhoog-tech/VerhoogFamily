const ELIGIBLE_OWNER_ROLES = new Set(['owner', 'admin', 'adult']);

function householdContext() {
  const context = window.HouseholdContext;
  if (!context || typeof context.snapshot !== 'function' || typeof context.capture !== 'function') {
    throw new Error('HOUSEHOLD_CONTEXT_REQUIRED');
  }
  const snapshot = context.snapshot();
  if (!snapshot || !snapshot.ready || !snapshot.uid || !snapshot.householdId) {
    throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
  }
  return { context, snapshot, token: context.capture() };
}

function database() {
  if (window.fbDb && typeof window.fbDb.ref === 'function') return window.fbDb;
  if (window.firebase && typeof window.firebase.database === 'function') return window.firebase.database();
  throw new Error('FIREBASE_DATABASE_REQUIRED');
}

function ensureCurrent(context, token) {
  if (!context || typeof context.isCurrent !== 'function' || !context.isCurrent(token)) {
    throw new Error('STALE_HOUSEHOLD_CONTEXT');
  }
}

function normalizeMembers(raw) {
  return raw && typeof raw === 'object' ? raw : {};
}

function successorCandidates(members, currentUid) {
  return Object.keys(members)
    .map((uid) => ({ uid, ...(members[uid] || {}) }))
    .filter((member) => member.uid !== currentUid && member.status === 'active' && ELIGIBLE_OWNER_ROLES.has(member.role))
    .sort((a, b) => {
      const rank = { owner: 0, admin: 1, adult: 2 };
      const roleDiff = (rank[a.role] ?? 9) - (rank[b.role] ?? 9);
      if (roleDiff) return roleDiff;
      return Number(a.joinedAt || 0) - Number(b.joinedAt || 0);
    })
    .map((member) => ({
      uid: member.uid,
      name: String(member.name || member.email || 'Gezinslid'),
      role: member.role,
    }));
}

export async function getHouseholdLeavePlan() {
  const { context, snapshot, token } = householdContext();
  const db = database();
  const householdId = snapshot.householdId;
  const uid = snapshot.uid;

  const [metaSnap, membersSnap, userSnap] = await Promise.all([
    db.ref(`families/${householdId}/meta`).once('value'),
    db.ref(`families/${householdId}/members`).once('value'),
    db.ref(`users/${uid}`).once('value'),
  ]);
  ensureCurrent(context, token);

  const meta = metaSnap.val() || {};
  const members = normalizeMembers(membersSnap.val());
  const userData = userSnap.val() || {};
  const currentMember = members[uid];
  if (!currentMember || currentMember.status !== 'active') {
    throw new Error('ACTIVE_MEMBERSHIP_REQUIRED');
  }

  const isOwner = currentMember.role === 'owner' || meta.ownerUid === uid;
  const candidates = successorCandidates(members, uid);

  return {
    uid,
    householdId,
    householdName: String(meta.name || 'dit gezin'),
    role: currentMember.role || 'adult',
    isOwner,
    requiresOwnershipTransfer: isOwner,
    candidates,
    canLeave: !isOwner || candidates.length > 0,
    activeHouseholdId: userData.activeHouseholdId || null,
    legacyFamilyId: userData.familyId || null,
  };
}

async function clearPresence(db, householdId, uid) {
  try {
    const ref = db.ref(`families/${householdId}/presence/${uid}`);
    try {
      const disconnect = typeof ref.onDisconnect === 'function' ? ref.onDisconnect() : null;
      if (disconnect && typeof disconnect.cancel === 'function') await disconnect.cancel();
    } catch (error) {}
    if (typeof ref.remove === 'function') await ref.remove();
  } catch (error) {}
}

function clearHouseholdGlobals() {
  try { window.fbFamilyId = null; } catch (error) {}
}

export async function leaveHousehold(options = {}) {
  const plan = await getHouseholdLeavePlan();
  const context = window.HouseholdContext;
  const current = context && typeof context.snapshot === 'function' ? context.snapshot() : null;
  if (!current || current.uid !== plan.uid || current.householdId !== plan.householdId || !current.ready) {
    throw new Error('STALE_HOUSEHOLD_CONTEXT');
  }

  let successor = null;
  if (plan.isOwner) {
    successor = plan.candidates.find((candidate) => candidate.uid === options.successorUid) || null;
    if (!successor) throw new Error('HOUSEHOLD_OWNER_SUCCESSOR_REQUIRED');
  }

  const db = database();
  await clearPresence(db, plan.householdId, plan.uid);

  const now = Date.now();
  const updates = {};
  if (successor) {
    updates[`families/${plan.householdId}/meta/ownerUid`] = successor.uid;
    updates[`families/${plan.householdId}/meta/updatedAt`] = now;
    updates[`families/${plan.householdId}/members/${successor.uid}/role`] = 'owner';
    updates[`families/${plan.householdId}/members/${successor.uid}/updatedAt`] = now;
  }

  updates[`families/${plan.householdId}/members/${plan.uid}`] = null;
  updates[`users/${plan.uid}/households/${plan.householdId}`] = null;
  if (plan.activeHouseholdId === plan.householdId) updates[`users/${plan.uid}/activeHouseholdId`] = null;
  if (plan.legacyFamilyId === plan.householdId) updates[`users/${plan.uid}/familyId`] = null;

  const token = context.capture();
  ensureCurrent(context, token);
  await db.ref().update(updates);

  clearHouseholdGlobals();
  try {
    window.dispatchEvent(new CustomEvent('familyapp:household-left', {
      detail: {
        householdId: plan.householdId,
        uid: plan.uid,
        successorUid: successor ? successor.uid : null,
      },
    }));
  } catch (error) {}

  if (window.AuthenticatedSessionController && typeof window.AuthenticatedSessionController.resume === 'function') {
    await window.AuthenticatedSessionController.resume();
  } else if (window.FamilyHousehold && typeof window.FamilyHousehold.showOnboarding === 'function') {
    window.FamilyHousehold.showOnboarding();
  }

  return {
    householdId: plan.householdId,
    successorUid: successor ? successor.uid : null,
    successorName: successor ? successor.name : null,
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function closeDialog() {
  const dialog = document.querySelector('[data-household-leave-dialog]');
  if (dialog) dialog.remove();
}

function dialogShell(inner) {
  return `
    <div data-household-leave-dialog style="position:fixed;inset:0;z-index:10120;background:rgba(15,23,42,.52);display:flex;align-items:flex-end;justify-content:center">
      <div style="width:100%;max-width:480px;background:var(--c-surface);border-radius:26px 26px 0 0;padding:18px 18px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -18px 50px rgba(0,0,0,.24)">
        <div style="width:42px;height:4px;border-radius:999px;background:var(--c-border);margin:0 auto 16px"></div>
        ${inner}
      </div>
    </div>`;
}

function renderPlanDialog(plan) {
  const name = escapeHtml(plan.householdName);
  const candidateMarkup = plan.isOwner && plan.candidates.length
    ? `
      <div style="margin:14px 0 4px">
        <div style="font-size:12px;font-weight:800;color:var(--c-text2);margin-bottom:8px">Eigenaarschap overdragen aan</div>
        <div style="display:grid;gap:8px">
          ${plan.candidates.map((candidate, index) => `
            <label style="display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid var(--c-border);border-radius:13px;background:var(--c-surface2);cursor:pointer">
              <input type="radio" name="household-successor" value="${escapeHtml(candidate.uid)}" ${index === 0 ? 'checked' : ''} style="accent-color:var(--c-primary)">
              <span style="flex:1;min-width:0"><b style="display:block;font-size:13px;color:var(--c-text)">${escapeHtml(candidate.name)}</b><small style="font-size:11px;color:var(--c-text2)">${escapeHtml(candidate.role)}</small></span>
            </label>`).join('')}
        </div>
      </div>`
    : '';

  const ownerBlocked = plan.isOwner && !plan.canLeave;
  const explanation = ownerBlocked
    ? 'Je bent eigenaar van dit gezin. Voeg eerst een volwassen gezinslid toe of maak iemand beheerder; daarna kun je het eigenaarschap overdragen en het gezin verlaten.'
    : plan.isOwner
      ? `Je bent eigenaar van <b>${name}</b>. Kies eerst wie het eigenaarschap overneemt. Daarna wordt jouw lidmaatschap verwijderd.`
      : `Je staat op het punt <b>${name}</b> te verlaten. Je account blijft bestaan, maar gedeelde taken, boodschappen, agenda en andere gezinsdata zijn daarna niet meer voor jou zichtbaar.`;

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <div style="width:46px;height:46px;border-radius:15px;background:#fee2e2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:22px">↗</div>
      <div><h2 style="margin:0 0 3px;font-size:19px;color:var(--c-text)">Gezin verlaten?</h2><p style="margin:0;color:var(--c-text2);font-size:12px">Deze actie verandert alleen je lidmaatschap.</p></div>
    </div>
    <p style="margin:12px 0;color:var(--c-text2);font-size:13px;line-height:1.55">${explanation}</p>
    ${candidateMarkup}
    <div data-household-leave-error style="min-height:18px;margin-top:8px;color:#dc2626;font-size:12px"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
      <button type="button" data-household-leave-cancel style="min-height:44px;border:1px solid var(--c-border);border-radius:13px;background:var(--c-surface2);color:var(--c-text);font-size:13px;font-weight:800">Annuleren</button>
      <button type="button" data-household-leave-confirm ${ownerBlocked ? 'disabled' : ''} style="min-height:44px;border:0;border-radius:13px;background:${ownerBlocked ? 'var(--c-border)' : '#dc2626'};color:#fff;font-size:13px;font-weight:800;opacity:${ownerBlocked ? '.65' : '1'}">${ownerBlocked ? 'Overdracht nodig' : 'Gezin verlaten'}</button>
    </div>`;
}

async function openLeaveDialog() {
  closeDialog();
  document.body.insertAdjacentHTML('beforeend', dialogShell(`
    <div style="padding:8px 2px 10px;text-align:center;color:var(--c-text2);font-size:13px">Gezinsgegevens controleren…</div>`));

  const dialog = document.querySelector('[data-household-leave-dialog]');
  if (!dialog) return;
  dialog.onclick = (event) => { if (event.target === dialog) closeDialog(); };

  try {
    const plan = await getHouseholdLeavePlan();
    const sheet = dialog.firstElementChild;
    if (!sheet || !document.body.contains(dialog)) return;
    sheet.innerHTML = `<div style="width:42px;height:4px;border-radius:999px;background:var(--c-border);margin:0 auto 16px"></div>${renderPlanDialog(plan)}`;

    const cancel = sheet.querySelector('[data-household-leave-cancel]');
    if (cancel) cancel.onclick = closeDialog;

    const confirm = sheet.querySelector('[data-household-leave-confirm]');
    const errorEl = sheet.querySelector('[data-household-leave-error]');
    if (confirm && !confirm.disabled) {
      confirm.onclick = async () => {
        confirm.disabled = true;
        confirm.textContent = 'Bezig…';
        if (errorEl) errorEl.textContent = '';
        const selected = sheet.querySelector('input[name="household-successor"]:checked');
        try {
          const result = await leaveHousehold({ successorUid: selected ? selected.value : null });
          closeDialog();
          const message = result.successorName
            ? `Eigenaarschap overgedragen aan ${result.successorName}. Je hebt het gezin verlaten.`
            : 'Je hebt het gezin verlaten.';
          if (typeof window.showToast === 'function') window.showToast(message);
        } catch (error) {
          if (errorEl) errorEl.textContent = error && error.message === 'HOUSEHOLD_OWNER_SUCCESSOR_REQUIRED'
            ? 'Kies eerst wie het eigenaarschap overneemt.'
            : 'Kon het gezin niet verlaten. Probeer opnieuw.';
          confirm.disabled = false;
          confirm.textContent = 'Gezin verlaten';
        }
      };
    }
  } catch (error) {
    const sheet = dialog.firstElementChild;
    if (!sheet) return;
    sheet.innerHTML = `
      <div style="width:42px;height:4px;border-radius:999px;background:var(--c-border);margin:0 auto 16px"></div>
      <h2 style="margin:0 0 7px;font-size:18px;color:var(--c-text)">Gezin verlaten</h2>
      <p style="margin:0 0 14px;color:var(--c-text2);font-size:13px;line-height:1.5">Er is geen actief gezinslidmaatschap beschikbaar om te verlaten.</p>
      <button type="button" data-household-leave-cancel style="width:100%;min-height:44px;border:0;border-radius:13px;background:var(--c-primary);color:#fff;font-size:13px;font-weight:800">Sluiten</button>`;
    const cancel = sheet.querySelector('[data-household-leave-cancel]');
    if (cancel) cancel.onclick = closeDialog;
  }
}

function renderSection(container) {
  const target = container && container.querySelector('.profile-target');
  if (!target || target.querySelector('[data-household-leave-section]')) return;

  const section = document.createElement('section');
  section.className = 'profile-card';
  section.setAttribute('data-household-leave-section', '');
  section.style.padding = '16px';
  section.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
      <div style="width:42px;height:42px;border-radius:14px;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">⌂</div>
      <div style="min-width:0;flex:1">
        <h2 style="margin:0 0 4px">Gezin</h2>
        <p style="margin:0;color:var(--c-text2);font-size:12px;line-height:1.45">Verlaat het huidige gezin zonder je FamilyApp-account te verwijderen.</p>
      </div>
    </div>
    <button type="button" data-leave-household style="width:100%;min-height:44px;border:1px solid #fecaca;border-radius:13px;background:#fff5f5;color:#dc2626;font-size:13px;font-weight:800;padding:11px 14px">Gezin verlaten</button>`;

  const settings = target.querySelector('.profile-settings-card');
  if (settings) target.insertBefore(section, settings);
  else target.appendChild(section);

  const button = section.querySelector('[data-leave-household]');
  if (button) button.onclick = openLeaveDialog;
}

export function mountHouseholdLeave(container) {
  if (!container) return;
  renderSection(container);
  if (container.__familyHouseholdLeaveObserver) return;

  const observer = new MutationObserver(() => renderSection(container));
  observer.observe(container, { childList: true });
  container.__familyHouseholdLeaveObserver = observer;
}
