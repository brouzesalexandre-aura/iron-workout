/* ============================================================
   MODAL / SHEET
   ============================================================ */
const Modal = {
  open(title, bodyHTML, footerHTML) {
    const sheet = document.getElementById('sheet');
    sheet.innerHTML = `<div class="sheet-hd"><div class="grab"></div><h3>${esc(title)}</h3>
        <button class="iconbtn" onclick="Modal.close()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="sheet-bd">${bodyHTML}</div>${footerHTML ? `<div class="sheet-ft">${footerHTML}</div>` : ''}`;
    document.getElementById('overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  },
  setBody(html) { const b = document.querySelector('#sheet .sheet-bd'); if (b) b.innerHTML = html; },
  close() { document.getElementById('overlay').classList.remove('show'); document.body.style.overflow = ''; },
  confirm(title, msg, onOk, okLabel = 'Confirmer') {
    this.open(title, `<p style="font-size:14px;line-height:1.6;color:var(--muted2)">${esc(msg)}</p>`,
      `<button class="btn wide ghost" onclick="Modal.close()">Annuler</button><button class="btn wide primary" id="cfmBtn">${esc(okLabel)}</button>`);
    document.getElementById('cfmBtn').onclick = onOk;
  }
};

/* petit générateur de <select> d'options */
function opts(list, sel) { return list.map(([v, l]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`).join(''); }
