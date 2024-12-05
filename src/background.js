(() => {

  const normalizeDomain = (domain) => domain.replace(/^www\./, "");

  const findMatchingPattern = (patterns, tabUrl) => {
    return patterns.find((pattern) => {
      const normalizedPatternDomain = normalizeDomain(pattern.domain);
      const normalizedTabDomain = normalizeDomain(tabUrl.hostname);
      return (
        normalizedTabDomain === normalizedPatternDomain ||
        normalizedTabDomain.endsWith(`.${normalizedPatternDomain}`)
      );
    });
  };

  const handleTab = async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;

    const { patterns = [] } = await browser.storage.sync.get("patterns");
    const tabUrl = new URL(tab.url);

    const matchedPattern = findMatchingPattern(patterns, tabUrl);

    if (matchedPattern) {
      setTimeout(() => {
        browser.tabs.sendMessage(tabId, {
          color: matchedPattern.color,
          icon: matchedPattern.icon,
          banner: matchedPattern.banner,
        });
      }, 100);
    }
  };

  // Register tab update listener
  browser.tabs.onUpdated.addListener(handleTab);

})();
