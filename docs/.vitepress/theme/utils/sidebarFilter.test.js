import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  normalizeQuery,
  textMatches,
  applySidebarFilter,
  resetSidebarFilter,
} from "./sidebarFilter.js";

describe("normalizeQuery", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeQuery("  Hello "), "hello");
  });
});

describe("textMatches", () => {
  it("matches substring case-insensitively", () => {
    assert.equal(textMatches("Promise 原理", "promise"), true);
    assert.equal(textMatches("Promise 原理", "原理"), true);
    assert.equal(textMatches("Promise 原理", "vue"), false);
  });

  it("empty query matches everything", () => {
    assert.equal(textMatches("任意标题", ""), true);
  });
});

function makeSidebarDom() {
  const dom = new JSDOM(`<!DOCTYPE html><body>
    <nav class="nav">
      <section class="VPSidebarItem level-0 collapsed">
        <div class="item"><p class="text">面试</p></div>
        <div class="items">
          <div class="VPSidebarItem level-1">
            <div class="item"><p class="text">闭包</p></div>
          </div>
          <div class="VPSidebarItem level-1">
            <div class="item"><p class="text">原型链</p></div>
          </div>
        </div>
      </section>
      <section class="VPSidebarItem level-0">
        <div class="item"><p class="text">网络</p></div>
        <div class="items">
          <div class="VPSidebarItem level-1">
            <div class="item"><p class="text">HTTP</p></div>
          </div>
        </div>
      </section>
    </nav>
  </body>`);
  return dom.window.document.querySelector(".nav");
}

describe("applySidebarFilter", () => {
  it("keeps ancestors when a child matches and expands collapsed parent", () => {
    const root = makeSidebarDom();
    const result = applySidebarFilter(root, "闭包");
    assert.equal(result.matchCount, 1);

    const interview = root.querySelectorAll(".VPSidebarItem.level-0")[0];
    const network = root.querySelectorAll(".VPSidebarItem.level-0")[1];
    const closure = interview.querySelectorAll(".VPSidebarItem.level-1")[0];
    const proto = interview.querySelectorAll(".VPSidebarItem.level-1")[1];

    assert.equal(interview.dataset.sidebarFilterHidden, undefined);
    assert.equal(interview.classList.contains("collapsed"), false);
    assert.equal(closure.dataset.sidebarFilterHidden, undefined);
    assert.equal(proto.dataset.sidebarFilterHidden, "true");
    assert.equal(network.dataset.sidebarFilterHidden, "true");
  });

  it("when group title matches, keeps the whole group visible", () => {
    const root = makeSidebarDom();
    const result = applySidebarFilter(root, "网络");
    assert.ok(result.matchCount >= 1);

    const network = root.querySelectorAll(".VPSidebarItem.level-0")[1];
    const http = network.querySelector(".VPSidebarItem.level-1");
    assert.equal(network.dataset.sidebarFilterHidden, undefined);
    assert.equal(http.dataset.sidebarFilterHidden, undefined);

    const interview = root.querySelectorAll(".VPSidebarItem.level-0")[0];
    assert.equal(interview.dataset.sidebarFilterHidden, "true");
  });

  it("returns matchCount 0 when nothing matches", () => {
    const root = makeSidebarDom();
    const result = applySidebarFilter(root, "zzz-no-hit");
    assert.equal(result.matchCount, 0);
    for (const el of root.querySelectorAll(".VPSidebarItem")) {
      assert.equal(el.dataset.sidebarFilterHidden, "true");
    }
  });
});

describe("resetSidebarFilter", () => {
  it("clears hidden marks", () => {
    const root = makeSidebarDom();
    applySidebarFilter(root, "闭包");
    resetSidebarFilter(root);
    for (const el of root.querySelectorAll(".VPSidebarItem")) {
      assert.equal(el.dataset.sidebarFilterHidden, undefined);
      assert.notEqual(el.style.display, "none");
    }
  });
});
