export function normalizeQuery(query) {
  return String(query ?? "")
    .trim()
    .toLowerCase();
}

export function textMatches(text, normalizedQuery) {
  if (!normalizedQuery) return true;
  return String(text ?? "")
    .toLowerCase()
    .includes(normalizedQuery);
}

function getItemText(el) {
  const textEl = el.querySelector(":scope > .item .text");
  return textEl ? textEl.textContent || "" : "";
}

function setHidden(el, hidden) {
  if (hidden) {
    el.dataset.sidebarFilterHidden = "true";
    el.style.display = "none";
  } else {
    delete el.dataset.sidebarFilterHidden;
    el.style.removeProperty("display");
  }
}

/**
 * @param {ParentNode} root
 * @param {string} query
 * @returns {{ matchCount: number }}
 */
export function applySidebarFilter(root, query) {
  const q = normalizeQuery(query);
  const items = [...root.querySelectorAll(".VPSidebarItem")];

  if (!q) {
    resetSidebarFilter(root);
    return { matchCount: items.length };
  }

  const selfMatch = new Map();
  for (const el of items) {
    selfMatch.set(el, textMatches(getItemText(el), q));
  }

  const keep = new Set();
  let matchCount = 0;

  for (const el of items) {
    if (!selfMatch.get(el)) continue;
    matchCount += 1;
    keep.add(el);
    // ancestors
    let parent = el.parentElement;
    while (parent && parent !== root) {
      if (parent.classList?.contains("VPSidebarItem")) {
        keep.add(parent);
        parent.classList.remove("collapsed");
      }
      parent = parent.parentElement;
    }
    // if group title matched, keep all descendants
    for (const child of el.querySelectorAll(".VPSidebarItem")) {
      keep.add(child);
    }
  }

  for (const el of items) {
    setHidden(el, !keep.has(el));
  }

  return { matchCount };
}

/**
 * @param {ParentNode} root
 */
export function resetSidebarFilter(root) {
  for (const el of root.querySelectorAll(".VPSidebarItem")) {
    delete el.dataset.sidebarFilterHidden;
    el.style.removeProperty("display");
  }
}
