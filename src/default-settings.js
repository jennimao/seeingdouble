const kDefaultSettings = {
  upperBaselinePos: 0.15,
  lowerBaselinePos: 0.85,
  primaryImageScale: 0.75,
  primaryImageOpacity: 1,
  primaryTextScale: 0.95,
  primaryTextOpacity: 1,
  primaryTextColor: "#ffffff",
  secondaryImageScale: 0.5,
  secondaryImageOpacity: 1,
  secondaryTextScale: 1.0,
  secondaryTextStroke: 2.0,
  secondaryTextOpacity: 1,
  secondaryTextColor: "#ffffff",
  secondaryLanguageMode: 'audio', // disabled, audio, last (last used language)
  secondaryLanguageLastUsed: undefined, // bcp47 code of the last used language 
  secondaryLanguageLastUsedIsCaption: undefined,
};

module.exports = kDefaultSettings;
