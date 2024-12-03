const elements = {
  addPatternBtn: document.getElementById("add-pattern"),
  importBtn: document.getElementById("import-btn"),
  importFeedback: document.getElementById("import-feedback"),
  jsonImport: document.getElementById("json-import"),
  patternsContainer: document.getElementById("patterns"),
  savePatternsBtn: document.getElementById("save-patterns"),
};

const iconChoices = [
  "⚠️",
  "⭐",
  "❌",
  "✅",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "🔵",
  "🟢",
  "🟡",
  "🟠",
  "🔴",
  "🟣",
  "🟤",
  "⚪",
  "⚫",
  "🟩",
  "🟦",
  "🟧",
  "🟨",
  "🟥",
  "🟪",
  "🟫",
];

const createAppendTableHeader = () => {
  // Create table heading and add to elements.patternsContainer.appendChild(elm).
  const elm = document.createElement("tr");
  elm.className = "pattern";
  elm.innerHTML = `
  <th>Domain</th>
  <th>Color</th>
  <th>Emoji</th>
  <th>Flag</th>
  <th></th>
`;
  elements.patternsContainer.insertAdjacentElement("beforebegin", elm);
};

const loadPatternData = async () => {
  const { patterns = [] } = await browser.storage.sync.get("patterns");
  if (!patterns.length) {
    return;
  }
  createAppendTableHeader();
  patterns
    .filter((pattern) => pattern.domain)
    .forEach(({ domain, color, emoji, isProduction }) =>
      onCreatePattern(domain, color, emoji, isProduction)
    );
};

const onCreatePattern = async (
  domain = "",
  color = "#000000",
  emoji = iconChoices[0],
  isProduction = false
) => {
  const elm = document.createElement("tr");
  elm.className = "pattern";
  elm.innerHTML = `
	<td>
    <input type="text" placeholder="Root Domain (e.g., example.com)" value="${domain}" />
  </td>
	<td><input type="color" value="${color}" /></td>
	<td><select>
		${iconChoices
      .map(
        (e) =>
          `<option value="${e}" ${e === emoji ? "selected" : ""}>${e}</option>`
      )
      .join("")}
	</select></td>
	<td><label><span class="sr">Flag</span><input type="checkbox" ${
    isProduction ? "checked" : ""
  } /></label></td>
	<td><button id="remove-pattern">Remove</button></td>
  `;

  elm
    .querySelector("#remove-pattern")
    .addEventListener("click", () => elm.remove());

  elements.patternsContainer.appendChild(elm);
};

const onImportJSON = async () => {
  const jsonText = elements.jsonImport.value.trim();

  if (!jsonText) {
    elements.importFeedback.textContent = "Please paste JSON data.";
    return;
  }

  try {
    const importedData = JSON.parse(jsonText);
    const defaultColor = "#000000";
    const defaultEmoji = iconChoices[0];
    if (!Array.isArray(importedData)) {
      elements.importFeedback.textContent = "JSON data must be an array.";
      return;
    }
    elements.patternsContainer.innerHTML = "";
    importedData.forEach(
      ({
        domain = "",
        color = defaultColor,
        emoji = defaultEmoji,
        isProduction = false,
      }) => {
        const validEmoji = iconChoices.includes(emoji) ? emoji : defaultEmoji;
        onCreatePattern(domain, color, validEmoji, isProduction);
      }
    );
    const patterns = Array.from(
      elements.patternsContainer.querySelectorAll(".pattern")
    ).map((row) => {
      const [domainInput, colorInput, emojiInput, productionInput] =
        row.querySelectorAll("input, select");
      if (!domainInput) {
        return null;
      }
      return {
        domain: domainInput.value.trim(),
        color: colorInput.value,
        emoji: emojiInput.value,
        isProduction: productionInput.checked,
      };
    });

    await browser.storage.sync.set({ patterns });
    elements.importFeedback.textContent = "Patterns imported and saved!";
  } catch (e) {
    console.error(e);
    elements.importFeedback.textContent =
      "Invalid JSON data. Please check your input.";
  }
};

const onSavePatterns = async () => {
  const patterns = Array.from(
    elements.patternsContainer.querySelectorAll(".pattern")
  )
    .filter((row) => {
      const domainInput = row.querySelector("input[type='text']");
      return domainInput && domainInput.value.trim() !== "";
    })
    .map((row) => {
      const [domainInput, colorInput, emojiInput, productionInput] =
        row.querySelectorAll("input, select");
      return {
        domain: domainInput.value.trim(),
        color: colorInput.value,
        emoji: emojiInput.value,
        isProduction: productionInput.checked,
      };
    });

  await browser.storage.sync.set({ patterns });
  console.log(await browser.storage.sync.get("patterns"));
  alert("Patterns saved!");
};

document.addEventListener("DOMContentLoaded", loadPatternData);

elements.addPatternBtn.addEventListener("click", () =>
  onCreatePattern("", "", "", false)
);
elements.importBtn.addEventListener("click", onImportJSON);
elements.savePatternsBtn.addEventListener("click", onSavePatterns);
