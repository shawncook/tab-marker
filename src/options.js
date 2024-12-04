(() => {

  const elements = {
    addPatternBtn: document.getElementById("add-pattern"),
    exportBtn: document.getElementById("export-btn"),
    importBtn: document.getElementById("import-btn"),
    saveFeedback: document.getElementById("save-feedback"),
    importFeedback: document.getElementById("import-feedback"),
    jsonImport: document.getElementById("json-import"),
    patternsContainer: document.getElementById("patterns"),
    onSaveChangesBtn: document.getElementById("save-changes"),
    blinkSetting: document.getElementById("blink-setting"),
  };

  const iconChoices = [
    "⚠️", "⭐", "❌", "✅", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
    "🔵", "🟢", "🟡", "🟠", "🔴", "🟣", "🟤", "⚪", "⚫", "🟩", "🟦", "🟧", "🟨", "🟥", "🟪", "🟫",
  ];

  const createAppendTableHeader = () => {
    const elm = document.createElement("tr");
    elm.className = "pattern";
    elm.innerHTML = `
      <th>Domain</th>
      <th>Color</th>
      <th>Emoji</th>
      <th>Banner</th>
      <th></th>
    `;
    elements.patternsContainer.insertAdjacentElement("beforebegin", elm);
  };

  const isValidDomain = (domain) => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  };

  const loadPatterns = async () => {
    const { patterns = [] } = await browser.storage.sync.get("patterns");
    if (!patterns.length) return;
    createAppendTableHeader();
    patterns
      .filter((pattern) => pattern.domain)
      .forEach(({ domain, color, emoji, banner }) =>
        onCreatePattern(domain, color, emoji, banner)
      );
  };

  const loadSettings = async () => {
    const { blinkEnabled = false } = await browser.storage.sync.get("blinkEnabled");
    elements.blinkSetting.checked = blinkEnabled;
  };

  const onCreatePattern = (
    domain = "",
    color = "#000000",
    emoji = "",
    banner = false
  ) => {
    const elm = document.createElement("tr");
    elm.className = "pattern";
    elm.innerHTML = `
      <td><input type="text" placeholder="Root Domain (e.g., example.com)" value="${domain}" /></td>
      <td><input type="color" value="${color}" /></td>
      <td><select>
        <option value="" selected>--</option>
        ${iconChoices
          .map(
            (e) =>
              `<option value="${e}" ${
                e === emoji ? "selected" : ""
              }>${e}</option>`
          )
          .join("")}
      </select></td>
      <td><label><input type="checkbox" ${
        banner ? "checked" : ""
      } /><span class="sr">Display Banner?</span></label></td>
      <td><button class="remove-pattern">Remove</button></td>
    `;
    elm
      .querySelector(".remove-pattern")
      .addEventListener("click", () => elm.remove());
    elements.patternsContainer.appendChild(elm);
  };

  const onExportJSON = async () => {
    try {
      const { patterns } = await browser.storage.sync.get("patterns");
      const jsonData = JSON.stringify(patterns, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "patterns.json";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      elements.saveFeedback.textContent = "Error exporting JSON. Please try again.";
    }
  };

  const onImportJSON = async () => {
    const jsonText = elements.jsonImport.value.trim();
    if (!jsonText) {
      elements.importFeedback.textContent = "Please paste JSON data.";
      return;
    }
    try {
      const importedData = JSON.parse(jsonText);
      if (!Array.isArray(importedData)) {
        elements.importFeedback.textContent = "JSON data must be an array.";
        return;
      }
      elements.patternsContainer.innerHTML = "";
      importedData.forEach(
        ({
          domain = "",
          color = "#000000",
          emoji = iconChoices[0],
          banner = false,
        }) => onCreatePattern(domain, color, emoji, banner)
      );
      await saveChanges();
      elements.importFeedback.textContent = "JSON imported and saved.";
    } catch (e) {
      console.error(e);
      elements.importFeedback.textContent =
        "Invalid JSON data. Please check your input.";
    }
  };

  const onSaveChanges = async () => {
    try {
      await saveChanges();
      elements.saveFeedback.textContent = "Changes saved.";
      setTimeout(() => {
        elements.saveFeedback.textContent = "";
      }, 3000);
    } catch (error) {
      elements.saveFeedback.textContent = `Error saving changes: ${error.message}`;
    }
  };

  const saveChanges = async () => {

    const blinkEnabled = elements.blinkSetting.checked;

    const patterns = Array.from(
      elements.patternsContainer.querySelectorAll(".pattern")
    )
      .filter(
        (row) => row.querySelector("input[type='text']").value.trim() !== ""
      )
      .map((row) => {
        const [domainInput, colorInput, emojiInput, productionInput] =
          row.querySelectorAll("input, select");
        const domain = domainInput.value.trim();
        if (!isValidDomain(domain)) {
          throw new Error(`${domain} is an invalid domain.`);
        }
        return {

          domain,
          color: colorInput.value,
          emoji: emojiInput.value,
          banner: productionInput.checked,
        };
      });

    await browser.storage.sync.set({ patterns, blinkEnabled });
  };

  elements.importBtn.addEventListener("click", onImportJSON);
  elements.exportBtn.addEventListener("click", onExportJSON);
  elements.onSaveChangesBtn.addEventListener("click", onSaveChanges);
  elements.addPatternBtn.addEventListener("click", () => {
    onCreatePattern("", "", "", false)
  });

  document.addEventListener("DOMContentLoaded", () => {
    loadPatterns();
    loadSettings();
  });

})();
