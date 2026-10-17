import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { followPreviewLink, goBackPreview, navigatePreview } from '../src/features/access/navigation.ts';

let entries;
let index;
let hashChanges;
beforeEach(() => {
  entries = [{ url: '/#/sign-in/patient', state: null }];
  index = 0;
  hashChanges = 0;
  const target = new EventTarget();
  globalThis.HashChangeEvent = class extends Event {};
  globalThis.window = Object.assign(target, {
    location: { pathname: '/', search: '', hash: '#/sign-in/patient' },
    history: {
      get state() { return entries[index].state; },
      pushState(state, unused, url) {
        entries.splice(index + 1);
        entries.push({ state, url });
        index++;
        window.location.hash = url.slice(url.indexOf('#'));
      },
      replaceState(state, unused, url) {
        entries[index] = { state, url };
        window.location.hash = url.slice(url.indexOf('#'));
      },
      back() { index--; },
    },
  });
  window.addEventListener('hashchange', () => hashChanges++);
});

test('direct-entry Back stays in APIP and replaces the entry with its safe parent', () => {
  goBackPreview('/patient/home');
  assert.equal(index, 0);
  assert.equal(entries.length, 1);
  assert.equal(window.location.hash, '#/patient/home');
  assert.equal(hashChanges, 1);
});

test('route Back follows the previous in-app screen', () => {
  navigatePreview('/patient/home');
  navigatePreview('/preview/adr-report');
  goBackPreview('/');
  assert.equal(index, 1);
  assert.equal(entries[index].url, '/#/patient/home');
});

test('repeated Home clicks do not add duplicate history entries', () => {
  navigatePreview('/');
  navigatePreview('/');
  assert.equal(entries.length, 2);
  assert.equal(hashChanges, 1);
});

test('a draft leave guard can cancel both link navigation and route Back', () => {
  navigatePreview('/preview/adr-report');
  window.addEventListener('apip:before-navigate', (event) => event.preventDefault());
  navigatePreview('/');
  goBackPreview('/patient/home');
  assert.equal(index, 1);
  assert.equal(entries.length, 2);
  assert.equal(window.location.hash, '#/preview/adr-report');
});

test('modified and middle-click links retain native browser behaviour', () => {
  for (const input of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    followPreviewLink({ button: 0, ...input, preventDefault() { assert.fail('native navigation intercepted'); } }, '/');
  }
  assert.equal(entries.length, 1);
});

test('ordinary links use tracked in-app navigation', () => {
  let prevented = false;
  followPreviewLink({ button: 0, preventDefault() { prevented = true; } }, '/patient/home');
  assert.ok(prevented);
  assert.equal(window.location.hash, '#/patient/home');
  assert.equal(hashChanges, 1);
});
