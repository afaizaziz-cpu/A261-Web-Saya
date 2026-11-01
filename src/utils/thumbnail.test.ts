import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUrl,
  isValidUrl,
  getCleanDomain,
  generateWebsiteThumbnail,
  getCleanFallbackThumbnail,
} from './thumbnail';

test('normalizeUrl prepends https:// if missing and trims spaces', () => {
  assert.equal(normalizeUrl('  myproject.com  '), 'https://myproject.com');
  assert.equal(normalizeUrl('http://example.com'), 'http://example.com');
  assert.equal(normalizeUrl('https://demo.vercel.app'), 'https://demo.vercel.app');
  assert.equal(normalizeUrl(''), '');
});

test('isValidUrl detects valid and invalid URLs', () => {
  assert.equal(isValidUrl('https://react.dev'), true);
  assert.equal(isValidUrl('portfolio.web.app'), true);
  assert.equal(isValidUrl('not-a-valid-url'), false);
  assert.equal(isValidUrl(''), false);
});

test('getCleanDomain strips protocol and www prefix', () => {
  assert.equal(getCleanDomain('https://www.google.com/search'), 'google.com');
  assert.equal(getCleanDomain('http://portfolio.vercel.app'), 'portfolio.vercel.app');
});

test('generateWebsiteThumbnail creates encoded screenshot url', () => {
  const url = generateWebsiteThumbnail('https://example.com');
  assert.ok(url.includes('api.microlink.io'));
  assert.ok(url.includes('https%3A%2F%2Fexample.com'));
});

test('getCleanFallbackThumbnail returns svg data uri', () => {
  const svg = getCleanFallbackThumbnail('Projek React');
  assert.ok(svg.startsWith('data:image/svg+xml'));
  assert.ok(svg.includes('Projek%20React'));
});
