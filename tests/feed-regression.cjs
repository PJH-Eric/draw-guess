'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync('public/js/app/feed.js', 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, '');
const context = { window: {}, app: { view: { room: { summary: [] }, you: { id: 'me' } }, feed: [
  { kind: 'guess', from: '甲', text: '嘴巴', at: 1 },
  { kind: 'guess', from: '乙', text: '笑臉', at: 2 },
  { kind: 'turn', key: 'turn-start', at: 3 }
] } };
vm.createContext(context);
vm.runInContext(source, context);
const messages = context.recentEvents().filter(item => item.kind === 'guess');
assert.equal(messages[0].text, '甲 猜「嘴巴」');
assert.equal(messages[1].text, '乙 猜「笑臉」');
console.log('PASS 猜題紀錄保留每則訊息文字，不受後續系統事件覆蓋');
