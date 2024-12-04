(() => {

  let isModified = false;

  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  const maybeApplyBanner = (message) => {
    if (message.banner) {
      const banner = document.createElement('div');
      const bannerStyles = {
        all: 'unset',
        backgroundColor: message.color ?? '#000000',
        color: getContrastColor(message.color ?? '#000000'),
        left: '0',
        padding: '8px',
        position: 'fixed',
        textAlign: 'center',
        top: '0',
        width: '100%',
        zIndex: '9999',
      };
      Object.assign(banner.style, bannerStyles);
      banner.textContent = message.text || 'Production Environment';
      document.body.prepend(banner);
    }
  };

  const modifyPageTitle = (message, blinkEnabled) => {
    const originalTitle = document.title;
    const emojiTitle = `${message.emoji ?? ''} ${originalTitle}`;

    if (message.banner && blinkEnabled) {
      let isEmojiVisible = true;
      setInterval(() => {
        document.title = isEmojiVisible ? emojiTitle : originalTitle;
        isEmojiVisible = !isEmojiVisible;
      }, 1000); // Toggle every 1 second
    } else {
      document.title = emojiTitle;
    }
  };

  const onMessageHandler = async (message) => {
    if (message && !isModified) {
      const { blinkEnabled = false } = await browser.storage.sync.get("blinkEnabled");
      modifyPageTitle(message, blinkEnabled);
      maybeApplyBanner(message);
      isModified = true;
    }
  };

  const resetIsModified = () => {
    isModified = false;
  };

  // Register event listeners
  browser.runtime.onMessage.addListener(onMessageHandler);
  window.addEventListener('beforeunload', resetIsModified);

})();