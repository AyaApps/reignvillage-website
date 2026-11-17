import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function fixture() {
  const timers = [];
  const handlers = new Map();
  const links = ['/events/', '/events/submit/'].map(href => ({
    href, handlers: new Map(),
    addEventListener(type, callback) { this.handlers.set(type, callback); },
  }));
  let focused = null;
  const summary = { focus() { focused = summary; } };
  const disclosure = {
    open: true,
    contains(node) { return node === summary || links.includes(node); },
    querySelector() { return summary; },
    querySelectorAll() { return links; },
    getClientRects() { return [{}]; },
    addEventListener(type, callback) { handlers.set(type, callback); },
  };
  const windowHandlers = new Map();
  const documentHandlers = new Map();
  const document = {
    head: { append() {} }, createElement() { return {}; },
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === '.navigation-disclosure' ? [disclosure] : []; },
    addEventListener(type, callback) { documentHandlers.set(type, callback); },
  };
  vm.runInNewContext(readFileSync(new URL('../site.js', import.meta.url), 'utf8'), {
    document, window: { addEventListener(type, callback) { windowHandlers.set(type, callback); } },
    setTimeout(callback) { timers.push(callback); },
  });
  return { disclosure, handlers, links, windowHandlers, documentHandlers,
    flush() { while (timers.length) timers.shift()(); }, focused: () => focused, summary };
}

test('Events and Submit survive pointer blur until native link activation completes', () => {
  for (const index of [0, 1]) {
    const f = fixture();
    // Some pointer/touch paths blur the summary with no related focus target.
    f.handlers.get('focusout')({ relatedTarget: null });
    assert.equal(f.disclosure.open, true, 'pointerdown must not hide the link before click');
    f.links[index].handlers.get('click')();
    assert.equal(f.disclosure.open, true, 'keep the target rendered during native activation');
    f.flush();
    assert.equal(f.disclosure.open, false, 'dismiss after activation');
  }
});

test('internal focus stays open; keyboard exit and Escape dismiss predictably', () => {
  const f = fixture();
  f.handlers.get('focusout')({ relatedTarget: f.links[0] });
  assert.equal(f.disclosure.open, true);
  f.handlers.get('focusout')({ relatedTarget: {} });
  assert.equal(f.disclosure.open, false);
  f.disclosure.open = true;
  f.handlers.get('keydown')({ key: 'Escape', preventDefault() {} });
  assert.equal(f.disclosure.open, false);
  assert.equal(f.focused(), f.summary);
});

test('outside click and back/forward restore clear stale menus', () => {
  const f = fixture();
  f.documentHandlers.get('click')({ target: {} });
  assert.equal(f.disclosure.open, false);
  f.disclosure.open = true;
  f.windowHandlers.get('pageshow')({ persisted: true });
  assert.equal(f.disclosure.open, false);
});
