'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const pending = new Map();
let serial = 0;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9393', '--user-data-dir=' + path.join(ROOT, '.chrome-measure'), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  let ws;
  try {
    let tabs;
    for (let i = 0; i < 60; i++) {
      try { tabs = await (await fetch('http://127.0.0.1:9393/json')).json(); break; } catch (_) { await sleep(100); }
    }
    ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => ws.addEventListener('open', resolve));
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    });
    const send = (method, params) => new Promise((resolve, reject) => {
      const id = ++serial;
      pending.set(id, message => message.error ? reject(Error(message.error.message)) : resolve(message.result));
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception.description);
      return result.result.value;
    };
    await evaluate(`document.body.innerHTML = '<label style="display:block;width:280px;margin:20px"><select id="category">' + Array.from({length:38}, (_, i) => '<option value="'+i+'">Category '+i+'</option>').join('') + '</select></label>';`);
    await evaluate('var style=document.createElement("style");style.textContent=' + JSON.stringify(fs.readFileSync(path.join(ROOT, 'public/css/scrollbars.css'), 'utf8')) + ';document.head.appendChild(style)');
    for (const file of ['dropdowns.js', 'scrollbars.js']) await evaluate(fs.readFileSync(path.join(ROOT, 'public/js', file), 'utf8'));
    // 使用實際 Modal 控制器檢查初始焦點、Tab 邊界及 Escape 返回。
    await evaluate(`var D=document,$=function(id){return D.getElementById(id);},S={repaintAll:function(){}},navChanged=function(){};var host=document.createElement('div');host.id='modal-fixture';host.innerHTML='<button id="modal-opener">Open</button><div id="focus-modal" class="settings-modal" role="dialog"><div id="focus-panel" tabindex="-1"><button id="focus-first">First</button><button id="focus-last">Last</button></div></div><button id="focus-outside">Outside</button>';document.body.appendChild(host);`);
    await evaluate(fs.readFileSync(path.join(ROOT,'public/js/app/modal.js'),'utf8').replace(/^import .*;$/gm,'').replace(/export /g,''));
    await evaluate('document.getElementById("modal-opener").focus();window.testModal=makeModal("focus-modal","focus-panel","modal-opener");testModal.open();');
    await sleep(50);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
    if(await evaluate('document.activeElement.id')!=='focus-last') throw Error('Initial Shift+Tab escaped modal focus trap');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    if(await evaluate('document.activeElement.id')!=='focus-first') throw Error('Tab must wrap to first modal action');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    if(await evaluate('testModal.isOpen()||document.activeElement.id!=="modal-opener"')) throw Error('Escape must close modal and restore opener');
    await evaluate('document.getElementById("modal-fixture").remove()');
    console.log('PASS initial Shift+Tab, Tab wrap and Escape focus restoration');

    for (const [width, height] of [[360,640],[844,390],[768,1024],[1024,768],[1440,900]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await evaluate('document.getElementById("category-button").click()');
      await sleep(100);
      const rail = await evaluate(`(()=>{var r=document.querySelector('.scroll-rail[aria-controls="category-list"][data-axis="y"]');var b=r.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+8,end:b.bottom-8,hidden:r.hidden};})()`);
      if (rail.hidden) throw Error('Missing dropdown scrollbar');
      await send('Input.dispatchMouseEvent', { type:'mousePressed', x:rail.x, y:rail.y, button:'left', clickCount:1 });
      await send('Input.dispatchMouseEvent', { type:'mouseMoved', x:rail.x, y:rail.end, button:'left', buttons:1 });
      await send('Input.dispatchMouseEvent', { type:'mouseReleased', x:rail.x, y:rail.end, button:'left', clickCount:1 });
      const state = await evaluate('({hidden:document.getElementById("category-list").hidden,scroll:document.getElementById("category-list").scrollTop})');
      if (state.hidden || state.scroll < 100) throw Error(width+'x'+height+': scrollbar drag closed dropdown or failed to scroll: '+JSON.stringify(state));
      await evaluate('document.getElementById("category-button").click()');
      console.log('PASS dropdown thumb drag '+width+'x'+height);
    }
    await evaluate(`var background=document.createElement('div');background.id='scroll-background';background.className='screen';background.style.cssText='position:fixed;left:0;top:0;width:200px;height:100px;overflow:auto';background.innerHTML='<div style="height:400px">Background</div>';document.body.appendChild(background);var modal=document.createElement('div');modal.id='test-modal';modal.className='settings-modal open';modal.style.cssText='position:fixed;inset:0;z-index:100';modal.innerHTML='<div id="scroll-modal" class="settings-body" style="width:200px;height:100px;overflow:auto"><div style="height:400px">Modal</div></div>';document.body.appendChild(modal);`);
    await sleep(100);
    const activeRails=await evaluate(`Array.from(document.querySelectorAll('.scroll-rail:not([hidden])')).map(function(r){return r.getAttribute('aria-controls');})`);
    if(activeRails.includes('scroll-background')||!activeRails.includes('scroll-modal')) throw Error('Modal must hide background scrollbars');
    await evaluate('document.getElementById("test-modal").remove()');
    await sleep(100);
    if(!await evaluate(`!!document.querySelector('.scroll-rail[aria-controls="scroll-background"]:not([hidden])')`)) throw Error('Background scrollbar must return after closing modal');
    await evaluate(`var drawer=document.createElement('aside');drawer.id='scroll-drawer';drawer.className='game-aside open';drawer.style.cssText='position:fixed;inset:0 auto 0 0;width:240px;z-index:80;background:white';drawer.innerHTML='<div id="drawer-body" class="aside-body" style="height:100px;overflow:auto"><div style="height:400px">Drawer</div></div>';document.body.appendChild(drawer);`);
    await sleep(100);
    const drawerRails=await evaluate(`Array.from(document.querySelectorAll('.scroll-rail:not([hidden])')).map(function(r){return r.getAttribute('aria-controls');})`);
    if(drawerRails.includes('scroll-background')||!drawerRails.includes('drawer-body')) throw Error('Phone drawer leaves background scrollbar visible');
    await evaluate('document.getElementById("scroll-drawer").style.position="relative"');
    await sleep(100);
    if(!await evaluate(`!!document.querySelector('.scroll-rail[aria-controls="scroll-background"]:not([hidden])')`)) throw Error('Desktop sidebar must preserve other scrollbars');
    await evaluate('document.getElementById("scroll-drawer").remove()');
    console.log('PASS phone drawer hides background rails; desktop sidebar preserves them');
    await evaluate('document.getElementById("scroll-background").remove()');
    console.log('PASS modal hides background rails and restores them on close');
    await evaluate('var style=document.createElement("style");style.textContent='+JSON.stringify(fs.readFileSync(path.join(ROOT,'public/css/lobby-chat.css'),'utf8'))+';document.head.appendChild(style)');
    await evaluate(fs.readFileSync(path.join(ROOT,'public/js/lobby-chat.js'),'utf8'));
    await evaluate('window.chat=LobbyChat.create({game:"scroll-check",active:function(){return true;}});chat.setConnected(true);chat.open();chat.history(Array.from({length:50},function(_,i){return {name:"Player",text:"Message "+i,time:Date.now()};}));');
    await sleep(200);
    const bounds=await evaluate('(()=>{var log=document.querySelector(".lc-log");log.scrollTop=log.scrollHeight;log.dispatchEvent(new Event("scroll"));var track=document.querySelector(".lc-track").getBoundingClientRect(),thumb=document.querySelector(".lc-thumb").getBoundingClientRect();return {track:track.bottom,thumb:thumb.bottom};})()');
    if(bounds.thumb>bounds.track+1) throw Error('Lobby chat thumb leaves track at bottom: '+JSON.stringify(bounds));
    console.log('PASS lobby chat thumb remains inside track at bottom');
    await evaluate('chat.close();var feed=document.createElement("ul");feed.id="reverse-feed";feed.className="guessfeed";feed.style.cssText="position:fixed;left:20px;top:20px;width:200px;height:160px;display:flex;flex-direction:column-reverse;overflow:auto;margin:0;padding:0";for(var i=0;i<40;i++){var li=document.createElement("li");li.style.flex="0 0 40px";li.textContent="Guess "+i;feed.appendChild(li);}document.body.appendChild(feed);');
    await sleep(100);
    const reverse=await evaluate(`(()=>{var r=document.querySelector('.scroll-rail[aria-controls="reverse-feed"][data-axis="y"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.bottom-10,end:r.top+5};})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:reverse.x,y:reverse.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:reverse.x,y:reverse.end,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:reverse.x,y:reverse.end,button:'left',clickCount:1});
    if(await evaluate('document.getElementById("reverse-feed").scrollTop')>-100) throw Error('Reverse guess feed cannot scroll to older records');
    console.log('PASS reverse guess feed scrolls to older records');
    await evaluate(`document.querySelector('.scroll-rail[aria-controls="reverse-feed"][data-axis="y"]').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
    if (await evaluate('document.getElementById("reverse-feed").scrollTop') !== 0) throw Error('End must reach latest guess');
    await sleep(50);
    await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: reverse.x, y: reverse.y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: reverse.x, y: reverse.end }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    if (await evaluate('document.getElementById("reverse-feed").scrollTop') > -100) throw Error('Touch drag must reach older guesses');
    console.log('PASS guess feed keyboard End and touch drag');
    // 真實 DOM 與 renderAside：比分變動會重排玩家列，焦點仍應留在相同玩家。
    await evaluate(`var app={mode:'online',conn:{status:'connected'},view:{you:{id:'me',role:'player',can:{kick:true}},room:{code:'ABCD',phase:'playing',members:[{id:'me',name:'Me',role:'player'},{id:'other',name:'Other',role:'player'}]},game:{phase:'drawing',you:{isDrawer:false},players:[{id:'me',name:'Me',score:0},{id:'other',name:'Other',score:0}]}}};window.I18N={t:function(key){return key;}};$=function(id){var el=document.getElementById(id);if(!el){el=document.createElement(id==='scorelist'?'ol':'div');el.id=id;document.body.appendChild(el);}return el;};S.face=function(){return '';};var PHASE_LABEL={drawing:'Drawing'},esc=function(value){return String(value);},drawerName=function(){return 'Me';},canDoText=function(){return '';},indexOfPlayer=function(){return 0;},moodOf=function(){return 'happy';},renderRecent=function(){};`);
    const overlay=fs.readFileSync(path.join(ROOT,'public/js/app/overlay.js'),'utf8');
    await evaluate(overlay.slice(overlay.indexOf('export function renderAside()'),overlay.indexOf('export function canDoText(')).replace(/export /g,''));
    await evaluate(`renderAside();document.querySelector('#scorelist [data-kick="other"]').focus();app.view.game.players[1].score=100;renderAside();`);
    if(await evaluate('document.activeElement.dataset.kick')!=='other') throw Error('Score update loses focused player action');
    console.log('PASS score updates preserve the focused player action');
    await evaluate(`var updatedModal=document.createElement('div');updatedModal.id='update-modal';updatedModal.className='settings-modal';updatedModal.innerHTML='<div id="update-panel" tabindex="-1"><button>Cancel</button></div>';document.body.appendChild(updatedModal);window.updateModal=makeModal('update-modal','update-panel',null);updateModal.open();`);
    await sleep(50);
    await evaluate('app.view.game.players[1].score=200;renderAside();updateModal.close();');
    if(await evaluate('document.activeElement.dataset.kick')!=='other') throw Error('Closing confirmation after score update loses return focus');
    console.log('PASS confirmation restores updated player button after live score changes');


  } finally { if (ws) ws.close(); chrome.kill(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
