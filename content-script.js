browser.runtime.onMessage.addListener((message) => {
  if (message.color) {
    document.title = message.emoji
      ? `${message.emoji} ${document.title}`
      : document.title;
    if (message.isProduction) {
      document.body.style.borderTop = `8px solid ${message.color}`;
    }
  }
});
