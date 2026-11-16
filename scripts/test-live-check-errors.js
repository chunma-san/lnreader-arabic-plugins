import assert from 'node:assert/strict';
import { isNetworkOrBlockError } from './live-check-errors.js';
assert.equal(isNetworkOrBlockError({ status: 429 }).inconclusive, true);

assert.equal(
  isNetworkOrBlockError(new Error('Captcha error, please open in webview'))
    .inconclusive,
  true,
);
assert.equal(
  isNetworkOrBlockError(
    new Error(
      'Captcha error, please open in webview (or the website has changed url)',
    ),
  ).inconclusive,
  true,
);
for (const message of [
  'Could not reach site (404) try to open in webview.',
  'No chapters returned',
  'Cannot find package esbuild',
]) {
  assert.equal(isNetworkOrBlockError(new Error(message)).inconclusive, false);
}
assert.equal(
  isNetworkOrBlockError({
    response: { status: 200, headers: { 'cf-ray': 'x' } },
  }).inconclusive,
  false,
);
assert.equal(
  isNetworkOrBlockError({ response: { status: 403 } }).inconclusive,
  true,
);
console.log(
  'Live checker distinguishes explicit blocks from source and setup failures.',
);
