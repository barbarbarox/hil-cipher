/**
 * Hill Cipher Simulator — UI Controller
 * Handles tab navigation, form interactions, step rendering, and export
 */

// ─── STATE ────────────────────────────────────────────────
const state = {
  encMatrixSize: 2,
  decMatrixSize: 2,
  history: JSON.parse(localStorage.getItem('hillCipherHistory') || '[]'),
  animationDelay: 200
};

// ─── DOM READY ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMatrixToggles();
  initEncryptTab();
  initDecryptTab();
  initHistoryTab();
  renderHistory();
});

// ═══════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ═══════════════════════════════════════════════════════════

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ═══════════════════════════════════════════════════════════
//  MATRIX SIZE TOGGLES
// ═══════════════════════════════════════════════════════════

function initMatrixToggles() {
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const size = parseInt(btn.dataset.size);
      btn.parentElement.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (target === 'enc') {
        state.encMatrixSize = size;
        rebuildMatrixGrid('enc-matrix', size);
      } else {
        state.decMatrixSize = size;
        rebuildMatrixGrid('dec-matrix', size);
      }
    });
  });
}

function rebuildMatrixGrid(gridId, size) {
  const grid = document.getElementById(gridId);
  grid.className = `matrix-grid size-${size}`;
  grid.innerHTML = '';
  const defaults2 = [3, 3, 2, 5];
  const defaults3 = [6, 24, 1, 13, 16, 10, 20, 17, 15];
  const defaults = size === 2 ? defaults2 : defaults3;
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('input');
    cell.className = 'matrix-cell';
    cell.type = 'number';
    cell.min = '0';
    cell.max = '25';
    cell.value = defaults[i] || 0;
    grid.appendChild(cell);
  }
}

function readMatrix(gridId, size) {
  const cells = document.querySelectorAll(`#${gridId} .matrix-cell`);
  const matrix = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      matrix[i][j] = parseInt(cells[i * size + j].value) || 0;
    }
  }
  return matrix;
}

function setMatrix(gridId, matrix) {
  const size = matrix.length;
  const cells = document.querySelectorAll(`#${gridId} .matrix-cell`);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      cells[i * size + j].value = matrix[i][j];
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  ENCRYPT TAB
// ═══════════════════════════════════════════════════════════

function initEncryptTab() {
  document.getElementById('btn-encrypt').addEventListener('click', performEncrypt);
  document.getElementById('btn-enc-random').addEventListener('click', () => {
    const key = hillCipher.generateRandomKey(state.encMatrixSize);
    setMatrix('enc-matrix', key);
    rebuildMatrixGrid('enc-matrix', state.encMatrixSize);
    setMatrix('enc-matrix', key);
  });
  document.getElementById('btn-enc-demo').addEventListener('click', () => {
    state.encMatrixSize = 2;
    document.querySelectorAll('[data-target="enc"]').forEach(b => {
      b.classList.toggle('active', b.dataset.size === '2');
    });
    rebuildMatrixGrid('enc-matrix', 2);
    setMatrix('enc-matrix', [[3, 3], [2, 5]]);
    document.getElementById('enc-plaintext').value = 'HELP';
    performEncrypt();
  });
  document.getElementById('btn-enc-clear').addEventListener('click', () => {
    document.getElementById('enc-plaintext').value = '';
    document.getElementById('enc-output').innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#x1F4E5;</div>
        <p class="empty-state__text">Masukkan plaintext dan kunci,<br>lalu tekan <strong>Enkripsi</strong></p>
      </div>`;
    document.getElementById('enc-error').innerHTML = '';
  });
}

function performEncrypt() {
  const plaintext = document.getElementById('enc-plaintext').value;
  const keyMatrix = readMatrix('enc-matrix', state.encMatrixSize);
  const errorEl = document.getElementById('enc-error');
  const outputEl = document.getElementById('enc-output');
  errorEl.innerHTML = '';

  if (!plaintext.trim()) {
    errorEl.innerHTML = '<div class="error-msg">&#x26A0; Plaintext tidak boleh kosong</div>';
    return;
  }

  const validation = hillCipher.validateKey(keyMatrix);
  if (!validation.valid) {
    errorEl.innerHTML = `<div class="error-msg">&#x26A0; ${validation.error}</div>`;
    return;
  }

  const result = hillCipher.encrypt(plaintext, keyMatrix);
  renderSteps(outputEl, result.steps, 'encrypt');
  addHistory('encrypt', plaintext, result.ciphertext, keyMatrix);
}

// ═══════════════════════════════════════════════════════════
//  DECRYPT TAB
// ═══════════════════════════════════════════════════════════

function initDecryptTab() {
  document.getElementById('btn-decrypt').addEventListener('click', performDecrypt);
  document.getElementById('btn-dec-random').addEventListener('click', () => {
    const key = hillCipher.generateRandomKey(state.decMatrixSize);
    rebuildMatrixGrid('dec-matrix', state.decMatrixSize);
    setMatrix('dec-matrix', key);
  });
  document.getElementById('btn-dec-demo').addEventListener('click', () => {
    state.decMatrixSize = 2;
    document.querySelectorAll('[data-target="dec"]').forEach(b => {
      b.classList.toggle('active', b.dataset.size === '2');
    });
    rebuildMatrixGrid('dec-matrix', 2);
    setMatrix('dec-matrix', [[3, 3], [2, 5]]);
    document.getElementById('dec-ciphertext').value = 'HIAT';
    performDecrypt();
  });
  document.getElementById('btn-dec-clear').addEventListener('click', () => {
    document.getElementById('dec-ciphertext').value = '';
    document.getElementById('dec-output').innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#x1F510;</div>
        <p class="empty-state__text">Masukkan ciphertext dan kunci,<br>lalu tekan <strong>Dekripsi</strong></p>
      </div>`;
    document.getElementById('dec-error').innerHTML = '';
  });
}

function performDecrypt() {
  const ciphertext = document.getElementById('dec-ciphertext').value;
  const keyMatrix = readMatrix('dec-matrix', state.decMatrixSize);
  const errorEl = document.getElementById('dec-error');
  const outputEl = document.getElementById('dec-output');
  errorEl.innerHTML = '';

  if (!ciphertext.trim()) {
    errorEl.innerHTML = '<div class="error-msg">&#x26A0; Ciphertext tidak boleh kosong</div>';
    return;
  }

  const validation = hillCipher.validateKey(keyMatrix);
  if (!validation.valid) {
    errorEl.innerHTML = `<div class="error-msg">&#x26A0; ${validation.error}</div>`;
    return;
  }

  const result = hillCipher.decrypt(ciphertext, keyMatrix);
  if (result.error) {
    errorEl.innerHTML = `<div class="error-msg">&#x26A0; ${result.error}</div>`;
    return;
  }

  renderSteps(outputEl, result.steps, 'decrypt');
  addHistory('decrypt', result.plaintext, ciphertext, keyMatrix);
}

// ═══════════════════════════════════════════════════════════
//  STEP RENDERING
// ═══════════════════════════════════════════════════════════

function renderSteps(container, steps, mode) {
  container.innerHTML = '';
  steps.forEach((step, index) => {
    const card = document.createElement('div');
    card.className = 'step-card';
    card.style.animationDelay = `${index * state.animationDelay}ms`;

    let content = `
      <div>
        <span class="step-card__number">${index + 1}</span>
        <span class="step-card__title">${step.title}</span>
      </div>
      <p class="step-card__desc">${step.description}</p>`;

    content += renderStepData(step, mode);
    card.innerHTML = content;
    container.appendChild(card);
  });
}

function renderStepData(step, mode) {
  const d = step.data;
  switch (step.id) {
    case 'prepare': return renderPrepare(d);
    case 'convert': return renderConversion(d, mode);
    case 'blocks': return renderBlocks(d);
    case 'key': return renderKeyMatrix(d);
    case 'determinant': return renderDeterminant(d);
    case 'detInverse': return renderDetInverse(d);
    case 'cofactor': return renderMatrixStep(d.cofactorMatrix, 'Kofaktor', 'inverse');
    case 'adjugate': return renderMatrixStep(d.adjugate, 'Adjoin', 'inverse');
    case 'inverse': return renderInverseMatrix(d);
    case 'multiply': return renderMultiplication(d, mode);
    case 'result': return renderResult(d, mode);
    default: return '';
  }
}

function renderPrepare(d) {
  let html = `<div class="calc-line">Teks asli: <strong>"${d.original}"</strong></div>`;
  html += `<div class="calc-line">Setelah dibersihkan: <strong class="calc-highlight">"${d.cleaned}"</strong></div>`;
  if (d.paddingAdded) {
    html += `<div class="calc-line">Setelah padding: <strong class="calc-highlight--green">"${d.padded}"</strong> (ditambah 'X' agar kelipatan ${d.blockSize})</div>`;
  }
  return html;
}

function renderConversion(d, mode) {
  const colorClass = mode === 'encrypt' ? '' : '--orange';
  let html = '<div class="conv-table">';
  d.conversionTable.forEach(item => {
    html += `<div class="conv-item conv-item${colorClass}">
      <span class="conv-item__char">${item.char}</span>
      <span class="conv-item__arrow">▼</span>
      <span class="conv-item__num">${item.num}</span>
    </div>`;
  });
  html += '</div>';
  return html;
}

function renderBlocks(d) {
  let html = '<div class="blocks-row">';
  d.blocks.forEach((block, i) => {
    html += `<div class="block-chip">
      <span class="block-chip__label">Blok ${i + 1}:</span>
      [${d.blockChars[i].split('').join(', ')}] = [${block.join(', ')}]
    </div>`;
  });
  html += '</div>';
  return html;
}

function renderKeyMatrix(d) {
  return renderMatrixHTML(d.keyMatrix, 'key');
}

function renderDeterminant(d) {
  let html = `<div class="formula">${d.formula}</div>`;
  html += `<div class="calc-line">det(K) = <strong class="calc-highlight">${d.determinant}</strong></div>`;
  html += `<div class="calc-line">det(K) mod 26 = <strong class="calc-highlight">${d.detMod26}</strong></div>`;
  return html;
}

function renderDetInverse(d) {
  let html = `<div class="calc-line">${d.detMod26} × <strong class="calc-highlight--purple">${d.detInverse}</strong> = ${d.detMod26 * d.detInverse} ≡ ${(d.detMod26 * d.detInverse) % 26} (mod 26)</div>`;
  html += `<div class="calc-line">Invers modular determinan: <strong class="calc-highlight--purple">${d.detInverse}</strong></div>`;
  return html;
}

function renderMatrixStep(matrix, label, variant) {
  let html = `<div class="calc-line">Matriks ${label}:</div>`;
  html += renderMatrixHTML(matrix, variant);
  return html;
}

function renderInverseMatrix(d) {
  let html = `<div class="formula">K⁻¹ = ${d.detInverse} × adj(K) mod 26</div>`;
  html += `<div class="calc-line">Matriks Invers K⁻¹:</div>`;
  html += renderMatrixHTML(d.inverseMatrix, 'inverse');
  return html;
}

function renderMultiplication(d, mode) {
  const ms = d.multiplicationSteps;
  const variant = mode === 'encrypt' ? 'key' : 'inverse';
  const resultVariant = mode === 'encrypt' ? 'cipher' : 'plain';
  let html = '';

  ms.forEach((block) => {
    html += `<div style="margin:12px 0; padding:12px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border);">`;
    html += `<div class="calc-line"><strong>Blok ${block.blockIndex + 1}: [${block.blockChars}]</strong></div>`;

    // Show matrix × vector = raw → mod result
    html += `<div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:8px 0;">`;
    html += renderMatrixHTML(d.keyMatrix, variant);
    html += `<span class="text-mono" style="font-size:1.2rem; color:var(--text-muted);">×</span>`;
    html += renderVectorHTML(block.inputVector, mode === 'encrypt' ? 'plain' : 'cipher');
    html += `<span class="text-mono" style="font-size:1.2rem; color:var(--text-muted);">=</span>`;
    html += renderVectorHTML(block.raw, 'key');
    html += `<span class="text-mono" style="font-size:0.8rem; color:var(--text-muted);">mod 26 =</span>`;
    html += renderVectorHTML(block.modded, resultVariant);
    html += `</div>`;

    // Detail calc per row
    block.details.forEach((row, i) => {
      const terms = row.terms.map(t => `${t.a}×${t.b}`).join(' + ');
      const products = row.terms.map(t => t.product).join(' + ');
      html += `<div class="calc-line" style="font-size:0.8rem;">&nbsp;&nbsp;Baris ${i + 1}: ${terms} = ${products} = <strong>${row.sum}</strong> mod 26 = <strong class="calc-highlight">${row.modResult}</strong></div>`;
    });

    html += `</div>`;
  });

  return html;
}

function renderResult(d, mode) {
  const text = mode === 'encrypt' ? d.ciphertext : d.plaintext;
  const label = mode === 'encrypt' ? 'Ciphertext' : 'Plaintext';
  const colorClass = mode === 'encrypt' ? '--cipher' : '--plain';
  const convColor = mode === 'encrypt' ? '--orange' : '--green';

  let html = '<div class="conv-table">';
  d.resultConversion.forEach(item => {
    html += `<div class="conv-item conv-item${convColor}">
      <span class="conv-item__num">${item.num}</span>
      <span class="conv-item__arrow">▼</span>
      <span class="conv-item__char">${item.char}</span>
    </div>`;
  });
  html += '</div>';

  html += `<div class="result-box">
    <div class="result-box__label">${label}</div>
    <div class="result-box__text result-box__text${colorClass}">${text}</div>
    <div class="result-box__actions">
      <button class="btn btn--secondary btn--small" onclick="copyText('${text}')">Copy</button>
      <button class="btn btn--secondary btn--small" onclick="exportTxt('${mode}', '${text}')">Export TXT</button>
      <button class="btn btn--secondary btn--small" onclick="exportPdf('${mode}', '${text}')">Export PDF</button>
    </div>
  </div>`;

  return html;
}

// ═══════════════════════════════════════════════════════════
//  MATRIX / VECTOR HTML HELPERS
// ═══════════════════════════════════════════════════════════

function renderMatrixHTML(matrix, variant) {
  const n = matrix.length;
  let html = `<div class="matrix-display matrix-display--${variant}">`;
  html += `<span class="matrix-display__bracket">[</span>`;
  html += `<div class="matrix-display__grid cols-${n}">`;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      html += `<span class="matrix-display__cell">${matrix[i][j]}</span>`;
    }
  }
  html += `</div>`;
  html += `<span class="matrix-display__bracket">]</span>`;
  html += `</div>`;
  return html;
}

function renderVectorHTML(vector, variant) {
  let html = `<div class="matrix-display matrix-display--${variant}">`;
  html += `<span class="matrix-display__bracket">[</span>`;
  html += `<div class="matrix-display__grid cols-1">`;
  vector.forEach(v => {
    html += `<span class="matrix-display__cell">${v}</span>`;
  });
  html += `</div>`;
  html += `<span class="matrix-display__bracket">]</span>`;
  html += `</div>`;
  return html;
}

// ═══════════════════════════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════════════════════════

function initHistoryTab() {
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    state.history = [];
    localStorage.setItem('hillCipherHistory', '[]');
    renderHistory();
  });
  document.getElementById('btn-export-all-txt').addEventListener('click', exportAllTxt);
  document.getElementById('btn-export-all-pdf').addEventListener('click', exportAllPdf);
}

function addHistory(type, input, output, keyMatrix) {
  const entry = {
    type,
    input,
    output,
    keyMatrix,
    time: new Date().toLocaleString('id-ID')
  };
  state.history.unshift(entry);
  if (state.history.length > 50) state.history.pop();
  localStorage.setItem('hillCipherHistory', JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (state.history.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">&#x1F4CB;</div>
      <p class="empty-state__text">Belum ada riwayat operasi</p>
    </div>`;
    return;
  }

  container.innerHTML = state.history.map((h, i) => `
    <div class="history-item" onclick="reloadHistory(${i})">
      <div class="history-item__header">
        <span class="history-item__type history-item__type--${h.type}">
          ${h.type === 'encrypt' ? 'Enkripsi' : 'Dekripsi'}
        </span>
        <span class="history-item__time">${h.time}</span>
      </div>
      <div class="history-item__content">
        <span class="history-item__field">
          ${h.type === 'encrypt' ? 'Plain' : 'Cipher'}: <strong>${h.input}</strong>
        </span>
        <span class="history-item__field">
          ${h.type === 'encrypt' ? 'Cipher' : 'Plain'}: <strong>${h.output}</strong>
        </span>
        <span class="history-item__field">Key: <strong>[${h.keyMatrix.map(r => r.join(',')).join(' | ')}]</strong></span>
      </div>
    </div>
  `).join('');
}

function reloadHistory(index) {
  const h = state.history[index];
  const tab = h.type === 'encrypt' ? 'encrypt' : 'decrypt';

  // Switch tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');

  const size = h.keyMatrix.length;

  if (tab === 'encrypt') {
    state.encMatrixSize = size;
    document.querySelectorAll('[data-target="enc"]').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.size) === size);
    });
    rebuildMatrixGrid('enc-matrix', size);
    setMatrix('enc-matrix', h.keyMatrix);
    document.getElementById('enc-plaintext').value = h.input;
    performEncrypt();
  } else {
    state.decMatrixSize = size;
    document.querySelectorAll('[data-target="dec"]').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.size) === size);
    });
    rebuildMatrixGrid('dec-matrix', size);
    setMatrix('dec-matrix', h.keyMatrix);
    document.getElementById('dec-ciphertext').value = h.input;
    performDecrypt();
  }
}

// ═══════════════════════════════════════════════════════════
//  COPY & EXPORT
// ═══════════════════════════════════════════════════════════

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Berhasil disalin!'));
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function exportTxt(mode, resultText) {
  const label = mode === 'encrypt' ? 'Enkripsi' : 'Dekripsi';
  let content = `=== Hill Cipher ${label} ===\n`;
  content += `Hasil: ${resultText}\n`;
  content += `Waktu: ${new Date().toLocaleString('id-ID')}\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  downloadBlob(blob, `hill-cipher-${mode}-${Date.now()}.txt`);
}

function exportPdf(mode, resultText) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const label = mode === 'encrypt' ? 'Enkripsi' : 'Dekripsi';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Hill Cipher — ${label}`, 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Hasil: ${resultText}`, 20, 45);
    doc.text(`Waktu: ${new Date().toLocaleString('id-ID')}`, 20, 55);

    doc.save(`hill-cipher-${mode}-${Date.now()}.pdf`);
    showToast('PDF berhasil diunduh!');
  } catch (e) {
    showToast('Gagal membuat PDF. Coba lagi.');
  }
}

function exportAllTxt() {
  if (state.history.length === 0) { showToast('Tidak ada riwayat'); return; }
  let content = '=== RIWAYAT HILL CIPHER ===\n\n';
  state.history.forEach((h, i) => {
    content += `--- ${i + 1}. ${h.type === 'encrypt' ? 'Enkripsi' : 'Dekripsi'} ---\n`;
    content += `Input: ${h.input}\n`;
    content += `Output: ${h.output}\n`;
    content += `Key: [${h.keyMatrix.map(r => r.join(',')).join(' | ')}]\n`;
    content += `Waktu: ${h.time}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain' });
  downloadBlob(blob, `hill-cipher-history-${Date.now()}.txt`);
}

function exportAllPdf() {
  if (state.history.length === 0) { showToast('Tidak ada riwayat'); return; }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Riwayat Hill Cipher', 20, 25);
    let y = 45;

    doc.setFontSize(10);
    state.history.forEach((h, i) => {
      if (y > 260) { doc.addPage(); y = 25; }
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${h.type === 'encrypt' ? 'Enkripsi' : 'Dekripsi'}`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Input: ${h.input}  |  Output: ${h.output}`, 25, y + 6);
      doc.text(`Key: [${h.keyMatrix.map(r => r.join(',')).join(' | ')}]  |  ${h.time}`, 25, y + 12);
      y += 22;
    });

    doc.save(`hill-cipher-history-${Date.now()}.pdf`);
    showToast('PDF berhasil diunduh!');
  } catch (e) {
    showToast('Gagal membuat PDF. Coba lagi.');
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('File berhasil diunduh!');
}
