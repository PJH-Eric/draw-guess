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
  } finally { if (ws) ws.close(); chrome.kill(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
