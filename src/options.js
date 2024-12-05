(() => {
  const _els = {
    buttons: {
      add: document.getElementById("btn-add"),
      export: document.getElementById("btn-export"),
      import: document.getElementById("btn-import"),
      save: document.getElementById("save-changes"),
    },
    messages: {
      import: document.getElementById("msg-import"),
      save: document.getElementById("msg-save"),
    },
    fields: {
      blink: document.getElementById("field-blink"),
      import: document.getElementById("field-import"),
    },
    tables: {
      patterns: document.querySelector("tbody"),
    },
  };

  const _iconChoices = [
    "⚠️", "⭐", "❌", "✅", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
    "🔵", "🟢", "🟡", "🟠", "🔴", "🟣", "🟤", "⚪", "⚫", "🟩", "🟦", "🟧", "🟨", "🟥", "🟪", "🟫",
  ];

  const _isValidDomain = (domain) => {
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  };

  const handleSave = async () => {
    const blinkEnabled = _els.fields.blink.checked;

    const patterns = Array.from(
      _els.tables.patterns.querySelectorAll("tr")
    )
      .filter(
        (row) => row.querySelector("input[type='text']").value.trim() !== ""
      )
      .map((row) => {
        const [domainInput, colorInput, iconInput, productionInput] =
          row.querySelectorAll("input, select");
        const domain = domainInput.value.trim();
        if (!_isValidDomain(domain)) {
          throw new Error(`${domain} is an invalid domain.`);
        }
        return {
          domain,
          color: colorInput.value,
          icon: iconInput.value,
          banner: productionInput.checked,
        };
      });

    await browser.storage.sync.set({ patterns, blinkEnabled });
  };

  const initDrag = () => {
    const tbody = _els.tables.patterns;
    let draggedRow;

    tbody.addEventListener("dragstart", (e) => {
      draggedRow = e.target;
      e.target.style.opacity = 0.5;
    });

    tbody.addEventListener("dragend", (e) => {
      e.target.style.opacity = "";
    });

    tbody.addEventListener("dragover", (e) => {
      e.preventDefault();
      const targetRow = e.target.closest("tr");
      if (targetRow && targetRow !== draggedRow) {
        tbody.insertBefore(
          draggedRow,
          e.clientY >
            targetRow.getBoundingClientRect().top + targetRow.offsetHeight / 2
            ? targetRow.nextSibling
            : targetRow
        );
      }
    });
  };

  const initSettings = async () => {
    const { blinkEnabled = false } = await browser.storage.sync.get(
      "blinkEnabled"
    );
    _els.fields.blink.checked = blinkEnabled;
  };

  const initTable = () => {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <th scope="column">Domain</th>
      <th scope="column">Color</th>
      <th scope="column">Icon</th>
      <th scope="column">Banner</th>
      <th scope="column"></th>
    `;
    thead.appendChild(tr);
    _els.tables.patterns.insertAdjacentElement("beforebegin", thead);
  };

  const initTableData = async () => {
    const { patterns = [] } = await browser.storage.sync.get("patterns");
    if (!patterns.length) return;
    patterns
      .filter((pattern) => pattern.domain)
      .forEach((pattern) => onAddRow(pattern));
  };

  const onAddRow = ({
    domain = "",
    color = "",
    icon = "",
    banner = false,
  } = {}) => {
    const elm = document.createElement("tr");
    elm.draggable = true;
    elm.innerHTML = `
      <td><input type="text" placeholder="Root Domain (e.g., example.com)" value="${
        domain ?? ""
      }" /></td>
      <td><input type="color" value="${color}" /></td>
      <td><select>
        <option value="" selected>--</option>
        ${_iconChoices
          .map(
            (e) =>
              `<option value="${e}" ${
                e === icon ? "selected" : ""
              }>${e}</option>`
          )
          .join("")}
      </select></td>
      <td><label><input type="checkbox" ${
        banner ? "checked" : ""
      } /><span class="sr">Display Banner?</span></label></td>
      <td><button class="remove">Remove</button></td>
    `;
    elm
      .querySelector(".remove")
      .addEventListener("click", () => elm.remove());
    _els.tables.patterns.appendChild(elm);
    elm.querySelector('input[type="text"]').focus();
  };

  const onExportClick = async () => {
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
      _els.messages.save.textContent =
        "Error exporting JSON. Please try again.";
    }
  };

  const onImportClick = async () => {
    const jsonText = _els.fields.import.value.trim();
    if (!jsonText) {
      _els.messages.import.textContent = "Please paste JSON data.";
      return;
    }
    try {
      const importedData = JSON.parse(jsonText);
      if (!Array.isArray(importedData)) {
        _els.messages.import.textContent = "JSON data must be an array.";
        return;
      }
      _els.tables.patterns.innerHTML = "";
      importedData.forEach((pattern) =>
        onAddRow({
          domain: pattern.domain || "",
          color: pattern.color || "#000000",
          icon: pattern.icon || _iconChoices[0],
          banner: pattern.banner || false,
        })
      );
      await handleSave();
      _els.messages.import.textContent = "JSON imported and saved.";
    } catch (e) {
      console.error(e);
      _els.messages.import.textContent =
        "Invalid JSON data. Please check your input.";
    }
  };

  const onSaveClick = async () => {
    try {
      await handleSave();
      _els.messages.save.textContent = "Changes saved.";
      setTimeout(() => {
        _els.messages.save.textContent = "";
      }, 3000);
    } catch (error) {
      _els.messages.save.textContent = `Error saving changes: ${error.message}`;
    }
  };

  _els.buttons.export.addEventListener("click", onExportClick);
  _els.buttons.import.addEventListener("click", onImportClick);
  _els.buttons.save.addEventListener("click", onSaveClick);
  _els.buttons.add.addEventListener("click", () => onAddRow());

  document.addEventListener("DOMContentLoaded", () => {
    initTable();
    initTableData();
    initSettings();
    initDrag();
  });
})();
