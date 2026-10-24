/**
 * quadrant.js — Dental Quadrant (/q) Palmer Notation Module for PrescribePro-Rx
 *
 * Implements Palmer dental notation cross chips inside clinical prescription fields.
 * Tokens are stored as standard ASCII strings: {{q:UR=...;UL=...;LR=...;LL=...}}
 */
(function(root) {
  'use strict';

  const TOKEN_REGEX = /\{\{q:UR=([1-8A-E]{0,8});UL=([1-8A-E]{0,8});LR=([1-8A-E]{0,8});LL=([1-8A-E]{0,8})\}\}/g;

  function cleanCell(val) {
    if (!val) return '';
    return String(val).toUpperCase().replace(/[^1-8A-E]/g, '').slice(0, 8);
  }

  function makeToken(ur, ul, lr, ll) {
    return `{{q:UR=${cleanCell(ur)};UL=${cleanCell(ul)};LR=${cleanCell(lr)};LL=${cleanCell(ll)}}}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function chipHTML(ur, ul, lr, ll) {
    const sUR = cleanCell(ur);
    const sUL = cleanCell(ul);
    const sLR = cleanCell(lr);
    const sLL = cleanCell(ll);
    return `<span class="dq"><i class="ur">${escapeHtml(sUR)}</i><i class="ul">${escapeHtml(sUL)}</i><i class="lr">${escapeHtml(sLR)}</i><i class="ll">${escapeHtml(sLL)}</i></span>`;
  }

  function renderRich(str) {
    if (!str) return '';
    const safe = escapeHtml(str);
    const re = new RegExp(TOKEN_REGEX.source, 'g');
    return safe.replace(re, (match, ur, ul, lr, ll) => {
      return chipHTML(ur, ul, lr, ll);
    });
  }

  function plain(str) {
    if (!str) return '';
    const re = new RegExp(TOKEN_REGEX.source, 'g');
    return String(str).replace(re, (match, ur, ul, lr, ll) => {
      const parts = [];
      const sUR = cleanCell(ur);
      const sUL = cleanCell(ul);
      const sLR = cleanCell(lr);
      const sLL = cleanCell(ll);
      if (sUR) parts.push(`UR ${sUR}`);
      if (sUL) parts.push(`UL ${sUL}`);
      if (sLR) parts.push(`LR ${sLR}`);
      if (sLL) parts.push(`LL ${sLL}`);
      return parts.length ? `[${parts.join(' | ')}]` : '[Quadrant]';
    });
  }

  function parse(str) {
    if (!str) return [];
    const segments = [];
    let lastIdx = 0;
    const re = new RegExp(TOKEN_REGEX.source, 'g');
    let m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > lastIdx) {
        segments.push({ type: 'text', value: str.slice(lastIdx, m.index) });
      }
      segments.push({
        type: 'quad',
        ur: cleanCell(m[1]),
        ul: cleanCell(m[2]),
        lr: cleanCell(m[3]),
        ll: cleanCell(m[4])
      });
      lastIdx = re.lastIndex;
    }
    if (lastIdx < str.length) {
      segments.push({ type: 'text', value: str.slice(lastIdx) });
    }
    return segments;
  }

  function getChipInputs(chip) {
    return {
      ur: chip.querySelector('input.ur'),
      ul: chip.querySelector('input.ul'),
      lr: chip.querySelector('input.lr'),
      ll: chip.querySelector('input.ll')
    };
  }

  function getChipLastFilledInput(chip) {
    const inps = getChipInputs(chip);
    const order = [inps.ll, inps.lr, inps.ul, inps.ur];
    for (let i = 0; i < order.length; i++) {
      const inp = order[i];
      if (inp && inp.value && inp.value.length > 0) return inp;
    }
    return null;
  }

  function isChipEmpty(chip) {
    const inps = getChipInputs(chip);
    return (!inps.ur || !inps.ur.value) &&
           (!inps.ul || !inps.ul.value) &&
           (!inps.lr || !inps.lr.value) &&
           (!inps.ll || !inps.ll.value);
  }

  function removeChipAndSetCaret(chip, onChange) {
    const parent = chip.parentNode;
    if (!parent) return;

    const next = chip.nextSibling;
    if (next && next.nodeType === 3 && next.textContent === '\u200B') {
      next.remove();
    }

    let caretNode;
    let caretOffset = 0;

    const prev = chip.previousSibling;
    if (prev && prev.nodeType === 3) {
      caretNode = prev;
      caretOffset = prev.textContent.length;
    } else {
      caretNode = document.createTextNode('\u200B');
      parent.insertBefore(caretNode, chip);
      caretOffset = 0;
    }

    chip.remove();

    if (typeof window !== 'undefined' && window.getSelection && caretNode) {
      const sel = window.getSelection();
      if (sel) {
        try {
          const range = document.createRange();
          range.setStart(caretNode, caretOffset);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {}
      }
    }

    if (onChange) onChange();
  }

  function handleChipInputBackspace(currentInp, chip, onChange) {
    if (currentInp.value.length > 0 && currentInp.selectionStart > 0) {
      return false; // let browser delete one char
    }

    const lastFilled = getChipLastFilledInput(chip);
    if (lastFilled) {
      lastFilled.focus();
      lastFilled.value = lastFilled.value.slice(0, -1);
      lastFilled.style.width = Math.max(1, lastFilled.value.length + 0.6) + 'ch';
      const newPos = lastFilled.value.length;
      lastFilled.setSelectionRange(newPos, newPos);
      if (onChange) onChange();
      return true;
    }

    removeChipAndSetCaret(chip, onChange);
    return true;
  }

  function handleChipInputKeydown(e, inp, chip, onChange) {
    const inps = getChipInputs(chip);

    if (e.key === 'Backspace') {
      if (handleChipInputBackspace(inp, chip, onChange)) {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.shiftKey) {
        if (inp === inps.ur && inps.ul) inps.ul.focus();
        else if (inp === inps.ul && inps.lr) inps.lr.focus();
        else if (inp === inps.lr && inps.ll) inps.ll.focus();
        else exitChip(chip, true);
      } else {
        if (inp === inps.ll && inps.lr) inps.lr.focus();
        else if (inp === inps.lr && inps.ul) inps.ul.focus();
        else if (inp === inps.ul && inps.ur) inps.ur.focus();
        else exitChip(chip, false);
      }
      return;
    }

    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      exitChip(chip, true);
      return;
    }

    if (e.key === 'ArrowRight' && inp.selectionStart === inp.value.length) {
      if (inp === inps.ur && inps.ul) { e.preventDefault(); inps.ul.focus(); inps.ul.setSelectionRange(0, 0); }
      else if (inp === inps.lr && inps.ll) { e.preventDefault(); inps.ll.focus(); inps.ll.setSelectionRange(0, 0); }
      else if (inp === inps.ul || inp === inps.ll) { e.preventDefault(); exitChip(chip, true); }
      return;
    }

    if (e.key === 'ArrowLeft' && inp.selectionStart === 0) {
      if (inp === inps.ul && inps.ur) { e.preventDefault(); inps.ur.focus(); inps.ur.setSelectionRange(inps.ur.value.length, inps.ur.value.length); }
      else if (inp === inps.ll && inps.lr) { e.preventDefault(); inps.lr.focus(); inps.lr.setSelectionRange(inps.lr.value.length, inps.lr.value.length); }
      else if (inp === inps.ur || inp === inps.lr) { e.preventDefault(); exitChip(chip, false); }
      return;
    }
  }

  function exitChip(chip, forward) {
    const parent = chip.parentNode;
    if (!parent || typeof window === 'undefined') return;

    let targetNode;
    let targetOffset = 0;

    if (forward) {
      let next = chip.nextSibling;
      if (!next || next.nodeType !== 3) {
        next = document.createTextNode('\u200B');
        parent.insertBefore(next, chip.nextSibling);
      }
      targetNode = next;
      targetOffset = next.textContent.startsWith('\u200B') ? 1 : 0;
    } else {
      let prev = chip.previousSibling;
      if (!prev || prev.nodeType !== 3) {
        prev = document.createTextNode('\u200B');
        parent.insertBefore(prev, chip);
      }
      targetNode = prev;
      targetOffset = prev.textContent.length;
    }

    const sel = window.getSelection();
    if (sel && targetNode) {
      try {
        const range = document.createRange();
        range.setStart(targetNode, targetOffset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}
    }
  }

  function createEditChip(ur, ul, lr, ll, onChange) {
    const chip = document.createElement('span');
    chip.className = 'dq dq-edit';
    chip.contentEditable = 'false';
    chip.setAttribute('data-quad', '1');

    const cells = ['ur', 'ul', 'lr', 'll'];
    const initVals = { ur: cleanCell(ur), ul: cleanCell(ul), lr: cleanCell(lr), ll: cleanCell(ll) };

    cells.forEach(c => {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = c;
      inp.maxLength = 8;
      inp.inputMode = 'text';
      inp.autocapitalize = 'characters';
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      inp.placeholder = c.toUpperCase();
      inp.value = initVals[c];
      inp.setAttribute('aria-label', `${c.toUpperCase()} quadrant cell`);

      const updateWidth = () => {
        inp.style.width = Math.max(1, inp.value.length + 0.6) + 'ch';
      };
      updateWidth();

      inp.addEventListener('input', () => {
        const cleaned = cleanCell(inp.value);
        if (inp.value !== cleaned) inp.value = cleaned;
        updateWidth();
        if (onChange) onChange();
      });

      inp.addEventListener('keydown', (e) => {
        handleChipInputKeydown(e, inp, chip, onChange);
      });

      inp.addEventListener('beforeinput', (e) => {
        if (e.inputType === 'deleteContentBackward') {
          if (handleChipInputBackspace(inp, chip, onChange)) {
            e.preventDefault();
          }
        }
      });

      chip.appendChild(inp);
    });

    return chip;
  }

  function getPrecedingChipAtSelection(editor) {
    if (typeof window === 'undefined') return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return null;

    const container = range.startContainer;
    const offset = range.startOffset;

    if (container.nodeType === 3) {
      const textBefore = container.textContent.slice(0, offset);
      const visibleBefore = textBefore.replace(/\u200B/g, '');
      if (visibleBefore.length > 0) return null;

      let prev = container.previousSibling;
      while (prev && prev.nodeType === 3 && !prev.textContent.replace(/\u200B/g, '')) {
        prev = prev.previousSibling;
      }
      if (prev && prev.classList && prev.classList.contains('dq')) {
        return prev;
      }
    } else if (container.nodeType === 1) {
      if (offset > 0) {
        let prev = container.childNodes[offset - 1];
        if (prev && prev.classList && prev.classList.contains('dq')) {
          return prev;
        }
        if (prev && prev.nodeType === 3 && !prev.textContent.replace(/\u200B/g, '')) {
          let prevPrev = prev.previousSibling;
          if (prevPrev && prevPrev.classList && prevPrev.classList.contains('dq')) {
            return prevPrev;
          }
        }
      }
    }

    return null;
  }

  function checkForSlashQ(editor, onChange) {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return;

    const node = range.startContainer;
    if (node.nodeType !== 3) return;

    const offset = range.startOffset;
    const textBefore = node.textContent.slice(0, offset);

    const match = /(?:^|[\s\u200B])(\/[qQ])$/.exec(textBefore);
    if (match) {
      const slashIndex = offset - 2;
      const beforeSlash = node.textContent.slice(0, slashIndex);
      const afterCursor = node.textContent.slice(offset);

      node.textContent = beforeSlash;

      const chip = createEditChip('', '', '', '', onChange);
      const spacer = document.createTextNode('\u200B' + afterCursor);

      const parent = node.parentNode;
      parent.insertBefore(chip, node.nextSibling);
      parent.insertBefore(spacer, chip.nextSibling);

      const urInput = chip.querySelector('input.ur');
      if (urInput) {
        setTimeout(() => urInput.focus(), 15);
      }

      if (onChange) onChange();
    }
  }

  function serializeEditor(editor) {
    let result = '';
    const walk = (node) => {
      if (!node) return;
      if (node.nodeType === 3) {
        result += node.textContent.replace(/\u200B/g, '');
      } else if (node.nodeType === 1) {
        if (node.classList && node.classList.contains('dq')) {
          const inps = getChipInputs(node);
          result += makeToken(
            inps.ur ? inps.ur.value : '',
            inps.ul ? inps.ul.value : '',
            inps.lr ? inps.lr.value : '',
            inps.ll ? inps.ll.value : ''
          );
        } else if (node.tagName === 'BR') {
          result += '\n';
        } else if (node.tagName === 'DIV' || node.tagName === 'P') {
          if (result && !result.endsWith('\n')) result += '\n';
          node.childNodes.forEach(walk);
        } else {
          node.childNodes.forEach(walk);
        }
      }
    };
    editor.childNodes.forEach(walk);
    return result;
  }

  function renderEditorFromValue(editor, value, onChange) {
    editor.innerHTML = '';
    if (!value) return;

    const segments = parse(value);
    segments.forEach(seg => {
      if (seg.type === 'text') {
        const lines = seg.value.split('\n');
        lines.forEach((line, idx) => {
          if (idx > 0) editor.appendChild(document.createElement('br'));
          if (line) editor.appendChild(document.createTextNode(line));
        });
      } else if (seg.type === 'quad') {
        const chip = createEditChip(seg.ur, seg.ul, seg.lr, seg.ll, onChange);
        editor.appendChild(chip);
        editor.appendChild(document.createTextNode('\u200B'));
      }
    });
  }

  function insertChipAtSelection(editor, onChange) {
    editor.focus();
    const sel = window.getSelection();
    let range;
    if (sel && sel.rangeCount && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();

    const chip = createEditChip('', '', '', '', onChange);
    const spacer = document.createTextNode('\u200B');

    range.insertNode(spacer);
    range.insertNode(chip);

    const ur = chip.querySelector('input.ur');
    if (ur) setTimeout(() => ur.focus(), 20);

    if (onChange) onChange();
  }

  function insertBrAtCursor(editor) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const br = document.createElement('br');
    range.insertNode(br);

    range.setStartAfter(br);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function overrideTextareaValue(textarea, editor, onChange) {
    let isInternalUpdate = false;
    const proto = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    if (!proto || typeof proto.get !== 'function' || typeof proto.set !== 'function') {
      return () => {
        textarea.value = serializeEditor(editor);
      };
    }

    Object.defineProperty(textarea, 'value', {
      configurable: true,
      get() {
        return proto.get.call(this);
      },
      set(val) {
        proto.set.call(this, val);
        if (!isInternalUpdate) {
          renderEditorFromValue(editor, val, onChange);
        }
      }
    });

    return () => {
      isInternalUpdate = true;
      try {
        proto.set.call(textarea, serializeEditor(editor));
      } finally {
        isInternalUpdate = false;
      }
    };
  }

  function upgrade(textarea) {
    if (!textarea || textarea.dataset.rxQuadUpgraded === 'true') return;

    const wrap = document.createElement('div');
    wrap.className = 'rx-quad-wrap';

    const editor = document.createElement('div');
    editor.className = 'rx-quad-editor';
    editor.contentEditable = 'true';
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('data-placeholder', textarea.getAttribute('placeholder') || '');

    const label = textarea.parentNode ? textarea.parentNode.querySelector('label') : null;
    if (label) {
      editor.setAttribute('aria-label', label.textContent.trim());
    }

    const mobBtn = document.createElement('button');
    mobBtn.type = 'button';
    mobBtn.className = 'rx-quad-btn';
    mobBtn.title = 'Insert dental quadrant (/q)';
    mobBtn.textContent = '🦷 Quadrant';

    wrap.appendChild(editor);
    wrap.appendChild(mobBtn);

    textarea.parentNode.insertBefore(wrap, textarea);
    textarea.classList.add('rx-quad-hidden');
    textarea.dataset.rxQuadUpgraded = 'true';

    let syncTextarea;

    const onChange = () => {
      if (syncTextarea) syncTextarea();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    };

    syncTextarea = overrideTextareaValue(textarea, editor, onChange);

    renderEditorFromValue(editor, textarea.value, onChange);

    mobBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      insertChipAtSelection(editor, onChange);
    });

    editor.addEventListener('input', (e) => {
      if (e.isComposing) return;
      checkForSlashQ(editor, onChange);
      onChange();
    });

    editor.addEventListener('compositionend', () => {
      checkForSlashQ(editor, onChange);
      onChange();
    });

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        insertBrAtCursor(editor);
        onChange();
        return;
      }

      if (e.key === 'Backspace') {
        const precedingChip = getPrecedingChipAtSelection(editor);
        if (precedingChip) {
          e.preventDefault();
          const lastFilled = getChipLastFilledInput(precedingChip);
          if (lastFilled) {
            lastFilled.focus();
            lastFilled.value = lastFilled.value.slice(0, -1);
            lastFilled.style.width = Math.max(1, lastFilled.value.length + 0.6) + 'ch';
            const newPos = lastFilled.value.length;
            lastFilled.setSelectionRange(newPos, newPos);
            onChange();
          } else {
            removeChipAndSetCaret(precedingChip, onChange);
          }
        }
      }
    });

    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (text) {
        const segments = parse(text);
        if (segments.some(s => s.type === 'quad')) {
          segments.forEach(s => {
            if (s.type === 'text') {
              document.execCommand('insertText', false, s.value);
            } else if (s.type === 'quad') {
              const chip = createEditChip(s.ur, s.ul, s.lr, s.ll, onChange);
              const sel = window.getSelection();
              if (sel && sel.rangeCount) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(chip);
                range.setStartAfter(chip);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          });
        } else {
          document.execCommand('insertText', false, text);
        }
        onChange();
      }
    });
  }

  function init() {
    const targets = document.querySelectorAll('textarea.rx-quad');
    targets.forEach(ta => {
      try {
        upgrade(ta);
      } catch (err) {
        console.error('[QUAD] Failed to upgrade textarea:', ta, err);
        ta.classList.remove('rx-quad-hidden');
      }
    });
  }

  const RxQuad = {
    makeToken,
    parse,
    chipHTML,
    renderRich,
    plain,
    upgrade,
    init,
    _renderEditorFromValue: renderEditorFromValue
  };

  root.RxQuad = RxQuad;
})(typeof window !== 'undefined' ? window : this);
