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

/** @type {WeakMap<Element, string>} */
const textCache = new WeakMap();

function getItemText(el) {
  const cached = textCache.get(el);
  if (cached != null) return cached;
  const textEl = el.querySelector(":scope > .item .text");
  const text = textEl ? textEl.textContent || "" : "";
  textCache.set(el, text);
  return text;
}

function setHidden(el, hidden) {
  const wasHidden = el.dataset.sidebarFilterHidden === "true";
  if (hidden === wasHidden) {
    // Still sync match highlight below; hidden flag unchanged.
    return wasHidden;
  }
  if (hidden) {
    el.dataset.sidebarFilterHidden = "true";
    el.setAttribute("aria-hidden", "true");
  } else {
    delete el.dataset.sidebarFilterHidden;
    el.removeAttribute("aria-hidden");
  }
  return hidden;
}

function setMatch(el, matched) {
  const wasMatched = el.dataset.sidebarFilterMatch === "true";
  if (matched === wasMatched) return;
  if (matched) el.dataset.sidebarFilterMatch = "true";
  else delete el.dataset.sidebarFilterMatch;
}

function expandForFilter(el) {
  if (!el.classList.contains("collapsed")) return;
  el.classList.remove("collapsed");
  el.dataset.sidebarFilterExpanded = "true";
}

/**
 * @param {ParentNode} root
 * @param {string} query
 * @returns {{ matchCount: number }}
 */
export function applySidebarFilter(root, query) {
  const q = normalizeQuery(query);
  const items = root.querySelectorAll(".VPSidebarItem");

  if (!q) {
    resetSidebarFilter(root);
    return { matchCount: items.length };
  }

  if (root && root.dataset) {
    root.dataset.sidebarFiltering = "true";
  }

  /** @type {Set<Element>} */
  const keep = new Set();
  let matchCount = 0;

  for (const el of items) {
    if (!textMatches(getItemText(el), q)) continue;
    matchCount += 1;
    keep.add(el);

    let parent = el.parentElement;
    while (parent && parent !== root) {
      if (parent.classList?.contains("VPSidebarItem")) {
        keep.add(parent);
        expandForFilter(parent);
      }
      parent = parent.parentElement;
    }

    // Group title hit → keep whole subtree
    for (const child of el.querySelectorAll(".VPSidebarItem")) {
      keep.add(child);
    }
  }

  for (const el of items) {
    const visible = keep.has(el);
    setHidden(el, !visible);
    setMatch(el, visible && textMatches(getItemText(el), q));
  }

  return { matchCount };
}

/**
 * @param {ParentNode} root
 */
export function resetSidebarFilter(root) {
  if (root && root.dataset) {
    delete root.dataset.sidebarFiltering;
  }

  const items = root.querySelectorAll(
    ".VPSidebarItem[data-sidebar-filter-hidden], .VPSidebarItem[data-sidebar-filter-match], .VPSidebarItem[data-sidebar-filter-expanded]"
  );

  for (const el of items) {
    if (el.dataset.sidebarFilterExpanded === "true") {
      el.classList.add("collapsed");
      delete el.dataset.sidebarFilterExpanded;
    }
    delete el.dataset.sidebarFilterHidden;
    delete el.dataset.sidebarFilterMatch;
    el.removeAttribute("aria-hidden");
  }
}
