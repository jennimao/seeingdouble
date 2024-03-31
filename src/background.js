const kDefaultSettings = require('./default-settings');


////////////////////////////////////////////////////////////////////////////////


let gSettings = Object.assign({}, kDefaultSettings);
let gWordBank = []

// return true if valid; otherwise return false
function validateSettings(settings) {
  const keys = Object.keys(kDefaultSettings);
  return keys.every(key => (key in settings));
}


chrome.storage.local.get(['settings'], (result) => {
  console.log('Loaded: settings=', result.settings);
  if (result.settings && validateSettings(result.settings))
    gSettings = result.settings;
  else
    saveSettings();
});

function saveSettings() {
  // hack to update opacity for existing users
  gSettings.primaryImageOpacity = 1
  gSettings.primaryTextOpacity = 1
  gSettings.secondaryImageOpacity = 1
  gSettings.secondaryTextOpacity = 1
  chrome.storage.local.set({ settings: gSettings }, () => {
    console.log('Settings: saved into local storage');
  });
}

// Initialize the word bank in Chrome storage if it doesn't exist
chrome.storage.local.get(['wordBank'], (result) => {
  console.log('Loaded: wordBank =', result.wordBank);
  if (!result.wordBank) {
      chrome.storage.local.set({ 'wordBank': [] });
  }
  else 
    saveWordBank();
});

function saveWordBank() {
  chrome.storage.local.set({ wordBank: gWordBank }, () => {
    console.log('Word Bank: saved into local storage');
  });
}

// ----------------------------------------------------------------------------

function saturateActionIconForTab(tabId) {
  chrome.browserAction.setIcon({
    tabId: tabId,
    path: {
      '16': 'icon16.png',
      '32': 'icon32.png',
    },
  });
}

function desaturateActionIconForTab(tabId) {
  chrome.browserAction.setIcon({
    tabId: tabId,
    path: {
      '16': 'icon16-gray.png',
      '32': 'icon32-gray.png',
    },
  });
}


// -----------------------------------------------------------------------------


let gExtPorts = {}; // tabId -> msgPort; for config dispatching
function dispatchSettings() {
  const keys = Object.keys(gExtPorts);
  keys.map(k => gExtPorts[k]).forEach(port => {
    try {
      port.postMessage({ settings: gSettings });
    }
    catch (err) {
      console.error('Error: cannot dispatch settings,', err);
    }
  });
}


// connected from target website (our injected agent)
function handleExternalConnection(port) {
  const tabId = port.sender && port.sender.tab && port.sender.tab.id;
  if (!tabId) return;

  gExtPorts[tabId] = port;
  console.log(`Connected: ${tabId} (tab)`);

  port.postMessage({ settings: gSettings });

  port.onMessage.addListener(msg => {
    if (msg.settings) {
      console.log('Received from injected agent: settings=', msg.settings);
      let settings = Object.assign({}, gSettings);
      settings = Object.assign(settings, msg.settings);
      if (!validateSettings(settings)) {
        gSettings = Object.assign({}, kDefaultSettings);
        port.postMessage({ settings: gSettings });
      }
      else {
        gSettings = settings;
      }
      saveSettings();
      dispatchSettings();
    }
    else if(msg.startPlayback){
      console.log('Saturate icon')
      saturateActionIconForTab(tabId);
    }
    else if(msg.stopPlayback){
      console.log('Desaturate icon')
      desaturateActionIconForTab(tabId);
    }
    else if (msg.wordBank) {
      console.log('Received from injected agent: wordBank=', msg.wordBank);
      gWordBank = msg.wordBank;
      saveWordBank();
      dispatchWordBank();
    }
    else {

    }
  });

  port.onDisconnect.addListener(() => {
    delete gExtPorts[tabId];
    console.log(`Disconnected: ${tabId} (tab)`);
  });
}

// dispatch word bank to the internal port! 
function dispatchWordBank() {
  try {
    gIntPort.postMessage({ wordBank: gWordBank });
  }
  catch (err) {
    console.error('Error: cannot dispatch word bank,', err);
  }
}


let gIntPort; 

// connected from our pop-up page
function handleInternalConnection(port) {
 const portName = port.name;
 console.log(`Connected: ${portName} (internal)`);

 gIntPort = port;

 if (portName === 'settings') {
   port.postMessage({ settings: gSettings });
   port.postMessage({ wordBank: gWordBank });

   port.onMessage.addListener(msg => {
     if (!msg.settings) {
       gSettings = Object.assign({}, kDefaultSettings);
       port.postMessage({ settings: gSettings });
     }
     else {
       console.log('Received: settings=', msg.settings);
       let settings = Object.assign({}, gSettings);
       settings = Object.assign(settings, msg.settings);
       if (!validateSettings(settings)) {
         gSettings = Object.assign({}, kDefaultSettings);
         port.postMessage({ settings: gSettings });
       }
       else {
         gSettings = settings;
       }
     }
     saveSettings();
     dispatchSettings();
   });
 }

 port.onDisconnect.addListener(() => {
   console.log(`Disconnected: ${portName} (internal)`);
 });
}


// handle connections from target website and our pop-up
if (BROWSER === 'chrome') {
  chrome.runtime.onConnectExternal.addListener(
    port => handleExternalConnection(port));

  chrome.runtime.onConnect.addListener(
    port => handleInternalConnection(port));
}
else {
  // Firefox: either from website (injected agent) or pop-up are all "internal"
  chrome.runtime.onConnect.addListener(port => {
    if (port.sender && port.sender.tab) {
      handleExternalConnection(port);
    }
    else {
      handleInternalConnection(port);
    }
  });
}
