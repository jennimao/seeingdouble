const console = require('./console');


window.addEventListener('load', () => {
  let scriptElem = document.createElement('script');
  scriptElem.setAttribute('type', 'text/javascript');
  scriptElem.textContent = `(() => {
      window.__nflxMultiSubsExtId = ${JSON.stringify(chrome.runtime.id)};
    })();`;
  document.body.appendChild(scriptElem);

  const scriptsToInject = ['nflxmultisubs.min.js'];
  scriptsToInject.forEach(scriptName => {
    const scriptElem = document.createElement('script');
    scriptElem.setAttribute('type', 'text/javascript');
    scriptElem.setAttribute('src', chrome.runtime.getURL(scriptName));
    document.head.appendChild(scriptElem);
    console.log(`Injected: ${scriptName}`);
  });
});