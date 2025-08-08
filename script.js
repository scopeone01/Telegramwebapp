(function(){
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.expand();
    tg.enableClosingConfirmation();
  }

  function sendData(obj){
    const data = JSON.stringify(obj);
    if (tg && tg.sendData) {
      tg.sendData(data);
    } else {
      alert("sendData: " + data);
    }
  }

  document.querySelectorAll('.btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const payload = btn.getAttribute('data-action');
      try {
        const obj = JSON.parse(payload);
        sendData(obj);
      } catch(e) {
        console.error('Invalid action payload', e);
      }
    });
  });

  document.getElementById('saveLimits')?.addEventListener('click', () => {
    const phmin = document.getElementById('phmin').value;
    const phmax = document.getElementById('phmax').value;
    const tmin  = document.getElementById('tmin').value;
    const tmax  = document.getElementById('tmax').value;
    const hmin  = document.getElementById('hmin').value;
    const hmax  = document.getElementById('hmax').value;

    const cmds = [];
    if (phmin) cmds.push(`/set phmin ${phmin}`);
    if (phmax) cmds.push(`/set phmax ${phmax}`);
    if (tmin)  cmds.push(`/set tmin ${tmin}`);
    if (tmax)  cmds.push(`/set tmax ${tmax}`);
    if (hmin)  cmds.push(`/set hmin ${hmin}`);
    if (hmax)  cmds.push(`/set hmax ${hmax}`);

    if (cmds.length === 0) return;
    sendData({ type: 'batch', commands: cmds });
  });
})();


