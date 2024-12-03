const handleTab = async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  const { patterns = [] } = await browser.storage.sync.get("patterns");
  const tabUrl = new URL(tab.url);
  const normalizeDomain = (domain) => {
    return domain.replace(/^www\./, "");
  };
  const matchedPattern = patterns.find((pattern) => {
    const normalizedPatternDomain = normalizeDomain(pattern.domain);
    const normalizedTabDomain = normalizeDomain(tabUrl.hostname);
    return (
      normalizedTabDomain === normalizedPatternDomain ||
      normalizedTabDomain.endsWith(`.${normalizedPatternDomain}`)
    );
  });
  if (matchedPattern) {
    setTimeout(() => {
      browser.tabs.sendMessage(tabId, {
        color: matchedPattern.color,
        emoji: matchedPattern.emoji,
        isProduction: matchedPattern.isProduction,
      });
    }, 100);
  }
}

browser.tabs.onUpdated.addListener(handleTab);
