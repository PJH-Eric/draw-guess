'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync('public/js/app/game-settings.js', 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, '');
let confirmation, callback, sent = [];
const context = {
  window: { I18N: { t: (key, params) => params ? key + ':' + params.name : key }, Online: { send: (event, data) => sent.push({ event, target: data.target }) } },
  Sound: { play() {} }, toast() {},
  modals: { game: { isOpen: () => false } },
  askConfirm(options, action) { confirmation = options; callback = action; },
  app: { mode: 'online', view: null }
};
vm.createContext(context);
vm.runInContext(source, context);
function reset() {
  sent = []; callback = null; confirmation = null;
  context.app.mode = 'online';
  context.app.view = { room: { code: 'ABCD', members: [{id:'me',name:'自己',role:'player'}, {id:'other',name:'指定玩家',role:'player'}] }, you: { id:'me', can:{kick:true} } };
}
reset();
context.confirmKick('other');
assert.equal(confirmation.text, 'kick.confirmText:指定玩家');
assert.equal(sent.length, 0, '確認前不得發送投票');
callback();
assert.deepEqual(sent, [{event:'room:kick', target:'other'}]);
for (const invalidate of [
  () => { context.app.view.room.code = 'EFGH'; },
  () => { context.app.view.room.members = []; },
  () => { context.app.view.you.can.kick = false; },
  () => { context.app.mode = 'solo'; }
]) {
  reset(); context.confirmKick('other'); invalidate(); callback();
  assert.equal(sent.length, 0, '確認期間換房、玩家離開或權限失效不得送出舊操作');
}
for (const target of ['me', 'missing']) {
  reset(); context.confirmKick(target); assert.equal(callback, null);
}
console.log('PASS 投票確認：指定對象、確認前不送票、自己不可踢、換房／離席／權限失效時取消舊操作');
