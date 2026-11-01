import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission } from './validation';

test('validateSubmission flags empty fields', () => {
  const result = validateSubmission({
    nama: '',
    noMatrik: '',
    tajukWeb: '',
    linkLamanWeb: '',
    slidePdfUrl: '',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.nama);
  assert.ok(result.errors.noMatrik);
  assert.ok(result.errors.tajukWeb);
  assert.ok(result.errors.linkLamanWeb);
  assert.ok(result.errors.slidePdfUrl);
});

test('validateSubmission passes when all 5 required fields are provided', () => {
  const result = validateSubmission({
    nama: 'Muhammad Amirul',
    noMatrik: '1210452',
    tajukWeb: 'Sistem Pengurusan Pelajar',
    linkLamanWeb: 'https://amirul.dev',
    slidePdfUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
  });

  assert.equal(result.valid, true);
  assert.equal(Object.keys(result.errors).length, 0);
});
