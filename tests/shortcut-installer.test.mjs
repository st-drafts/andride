import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {shortcutFile} from '../src/shortcut-installer.js';
test('installer passes the original signed bytes in a File with the exact extension',async()=>{const bytes=await readFile(new URL('../public/shortcuts/and Ride Health.shortcut',import.meta.url));const file=shortcutFile(bytes);assert.equal(file.name,'and Ride Health.shortcut');assert.equal(file.type,'application/octet-stream');assert.deepEqual(Buffer.from(await file.arrayBuffer()),bytes)});
test('HTML fallback pages and empty responses cannot be passed off as shortcuts',()=>{for(const value of ['<!DOCTYPE html>'+'.'.repeat(300),'AEA1','', 'not a shortcut'.repeat(100)])assert.throws(()=>shortcutFile(new TextEncoder().encode(value)))});
