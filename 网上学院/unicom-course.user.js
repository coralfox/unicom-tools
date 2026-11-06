// ==UserScript==
// @name         联通网上学院-刷课程，可倍速（界面整理版）
// @namespace    https://gitee.com/coralfox/unicom-tools
// @version      3.8
// @updateURL    https://gitee.com/coralfox/unicom-tools/raw/main/unicom-course.meta.js
// @downloadURL  https://gitee.com/coralfox/unicom-tools/raw/main/unicom-course.user.js
// @supportURL   https://gitee.com/coralfox/unicom-tools
// @description  联通网上学院刷课程视频。仅在“主题专栏”内页与课程播放页生效（/training/pc/ 下），其余页面不注入。[界面整理：紧凑布局一屏放下、直接读取网站分页自动识别当前页、完整/迷你/隐藏三种形态、分区折叠、运行日志默认收起、位置记忆、按钮与参数均有说明] [油猴菜单：显示/隐藏面板、完整/迷你切换、三种刷课模式切换、全部学习、使用说明] [功能整理：默认勾选未学完课程；“全部学习”与“开始刷课”并排，点击先弹确认框；获取课程期间自动禁用按钮避免误操作]
// @author       ZouYs,coralfox,CountZero
// @match        https://campus.chinaunicom.cn/training/pc/*
// @match        https://m.campus.chinaunicom.cn/training/pc/*
// @icon         data:image/x-icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwDlACcA5QAnAOUAJwDlACcA5QAnAOUAAAAAACcA5QAnAOUAJwDlACcA5QAnAOUAJwDlACcA5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwDlACcA5QAnAOUAJwDlBScA5RonAOUXJwDlAycA5QAnAOUAJwDlACcA5QAnAOUKJwDlHicA5RQnAOUBJwDlACcA5QAnAOUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcA5QAnAOUAJwDlAicA5UInAOWmJwDlzycA5cwnAOWeJwDlOCcA5QAnAOUJJwDlXCcA5bcnAOXTJwDlyicA5Y0nAOUgJwDlACcA5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwDlACcA5QAnAOVQJwDl5ScA5f8nAOX/JwDl/ycA5f8nAOXcJwDlVScA5YAnAOX1JwDl/ycA5f8nAOX/JwDl/ycA5bwnAOUiJwDlACcA5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnAOUAJwDlEycA5cInAOX/JwDl/ScA5eEnAOXjJwDl/icA5f8nAOXvJwDl9ycA5f8nAOX6JwDl2icA5esnAOX/JwDl/ycA5YAnAOUCJwDlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcA5QAnAOU7JwDl7ScA5f8nAOXKJwDlKCcA5S0nAOW4JwDl/ycA5f8nAOX/JwDl+icA5YwnAOUYJwDlVCcA5e4nAOX/JwDlvicA5RAnAOUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwDlACcA5UQnAOXwJwDl/ycA5bQnAOUGJwDlDCcA5ZonAOX/JwDl/ycA5f8nAOXwJwDlVycA5QAnAOUsJwDl4icA5f8nAOXIJwDlEycA5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnAOUAJwDlIScA5dsnAOX/JwDl8ycA5XMnAOVqJwDl9ycA5f8nAOX/JwDl/ycA5f8nAOXRJwDlOycA5aAnAOX+JwDl/ycA5Z0nAOUGJwDlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcA5QAnAOUAJwDlACcA5QAnAOUAJwDlACcA5QAnAOUEJwDlfCcA5fonAOX/JwDl8icA5Z4nAOXGJwDl9ycA5ZonAOW5JwDl8icA5aMnAOW1JwDl/CcA5f8nAOXlJwDlQicA5QAnAOUAJwDlACcA5QAnAOUAJwDlACcA5QAAAAAAJwDlACcA5QAnAOUZJwDlPicA5UQnAOUkJwDlAicA5QAnAOUNJwDlhycA5fknAOX/JwDl8CcA5Z4nAOVqJwDlDScA5R8nAOV8JwDlvycA5f8nAOX/JwDl6CcA5V0nAOUCJwDlACcA5QwnAOU0JwDlRicA5TInAOUKJwDlACcA5QAnAOUDJwDlVScA5cgnAOXyJwDl+CcA5dgnAOWDJwDlFCcA5QwnAOVaJwDlnScA5fgnAOX/JwDl8icA5XInAOUEJwDlHycA5bMnAOX/JwDl/ycA5egnAOWSJwDlQScA5QAnAOU1JwDlrScA5eknAOX6JwDl5ycA5aYnAOUpJwDlACcA5VcnAOXnJwDl/ycA5f8nAOX/JwDl/ycA5f0nAOWlJwDllCcA5fInAOWkJwDlnicA5fknAOX/JwDl8icA5YcnAOW2JwDl/ycA5f8nAOXpJwDlmicA5dMnAOXbJwDlfCcA5dMnAOX/JwDl/ycA5f8nAOX/JwDl/ycA5bonAOUdJwDlwycA5f8nAOX+JwDlvScA5aEnAOXsJwDl/ycA5f8nAOX+JwDl/ycA5ewnAOVSJwDlhycA5fgnAOX/JwDl/ScA5f8nAOX/JwDl6ScA5WInAOWSJwDl/ycA5f8nAOX9JwDl/ycA5f8nAOXWJwDllicA5d8nAOX/JwDl+ycA5XMnAOX3JwDl/ycA5eMnAOUxJwDlAicA5WonAOX2JwDl/ycA5f8nAOX9JwDlgScA5QYnAOULJwDlmicA5f8nAOX/JwDl/ycA5fInAOVlJwDlACcA5SMnAOXHJwDl/ycA5f8nAOX/JwDl2icA5TsnAOUAJwDlcycA5f4nAOX/JwDloCcA5fQnAOX/JwDl6ScA5UQnAOUVJwDljScA5fsnAOX/JwDl/ycA5f4nAOWjJwDlFCcA5R8nAOW4JwDl/ycA5f8nAOX/JwDl9ycA5XYnAOUFJwDlQScA5dsnAOX/JwDl/ycA5f8nAOXiJwDlUScA5Q8nAOWHJwDl/ycA5f8nAOWcJwDltCcA5f8nAOX/JwDl3icA5c8nAOX6JwDl/ycA5fcnAOXyJwDl/ycA5e8nAOVuJwDlsycA5f8nAOX/JwDl8CcA5fonAOX/JwDl8ycA5XgnAOWUJwDl/ycA5f8nAOXvJwDl/ScA5f8nAOXrJwDlyicA5fAnAOX/JwDl8ycA5WAnAOU+JwDl1ScA5f8nAOX/JwDl/ycA5f8nAOXyJwDldycA5WUnAOXcJwDloycA5b8nAOX/JwDl/ycA5d0nAOVXJwDliicA5fknAOX/JwDl8icA5ZEnAOWxJwDluicA5UgnAOWzJwDl/ycA5f8nAOX/JwDl/ycA5f4nAOWcJwDlECcA5QAnAOU5JwDlpScA5dMnAOXZJwDlvCcA5VsnAOUGJwDlAScA5U8nAOXAJwDl/ycA5f8nAOXdJwDlTCcA5QAnAOUMJwDljScA5fgnAOX/JwDl8ScA5Y8nAOUoJwDlACcA5RwnAOWGJwDlyicA5donAOXIJwDlficA5RUnAOUAJwDlACcA5QAnAOUFJwDlHicA5SQnAOUPJwDlACcA5QAnAOUgJwDlsicA5f8nAOX/JwDl2ycA5YYnAOWAJwDlGCcA5UAnAOWbJwDlpicA5fgnAOX/JwDl+CcA5YYnAOUJJwDlACcA5QAnAOUWJwDlJicA5RQnAOUAJwDlACcA5QAAAAAAJwDlACcA5QAnAOUAJwDlACcA5QAnAOUAJwDlCCcA5ZwnAOX/JwDl/ycA5dwnAOWBJwDl0CcA5f0nAOW4JwDl2CcA5f8nAOW5JwDloicA5fgnAOX/JwDl9CcA5VgnAOUAJwDlACcA5QAnAOUAJwDlACcA5QAnAOUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcA5QAnAOUsJwDl5icA5f8nAOXjJwDlSicA5U0nAOXoJwDl/ycA5f8nAOX/JwDl/ycA5csnAOUyJwDliScA5fonAOX/JwDlqycA5QonAOUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwDlACcA5UgnAOXxJwDl/ycA5a0nAOUAJwDlAScA5YsnAOX+JwDl/ycA5f8nAOXvJwDlUycA5QAnAOUlJwDl2ycA5f8nAOXIJwDlEycA5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnAOUAJwDlMicA5eonAOX/JwDl1icA5U0nAOVXJwDl1ScA5f8nAOX/JwDl/ycA5fwnAOWzJwDlPycA5XgnAOX0JwDl/ycA5bUnAOUNJwDlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcA5QAnAOUOJwDlsicA5f8nAOX/JwDl8CcA5fMnAOX/JwDl/ycA5dQnAOXqJwDl/ycA5f4nAOXsJwDl9ycA5f8nAOX7JwDlbScA5QAnAOUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwDlACcA5QAnAOU1JwDlyScA5f8nAOX/JwDl/ycA5f4nAOW7JwDlLScA5V4nAOXhJwDl/ycA5f8nAOX/JwDl+CcA5ZonAOURJwDlACcA5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnAOUAJwDlACcA5QAnAOUjJwDldycA5a8nAOWqJwDlbicA5RsnAOUAJwDlAScA5TcnAOWLJwDlsycA5aEnAOVdJwDlDicA5QAnAOUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnAOUAJwDlACcA5QAnAOUAJwDlAScA5QEnAOUAJwDlACcA5QAnAOUAJwDlACcA5QAnAOUBJwDlACcA5QAnAOUAJwDlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////gQH//gAAf/wAAH/8AAA//AAAP/wAAD/8AAA//AAAPwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAfwAAD/8AAA//AAAP/wAAD/8AAA//AAAf/4AAP////////////////8=
// @require      https://cdn.jsdelivr.net/npm/jsencrypt@2.3.1/bin/jsencrypt.min.js
// @require      https://fastly.jsdelivr.net/npm/jsencrypt@2.3.1/bin/jsencrypt.min.js
// @connect      campus.chinaunicom.cn
// @connect      app.campus.chinaunicom.cn
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  // ==================== 全局状态 ====================
  var readyCheck = false;                 // 课程信息是否已就绪
  var LOG_LIMIT = 5;                      // 日志区保留条数
  var UI_POS_KEY = "ldx_ui_pos_v3";       // 面板位置记忆
  var UI_VIEW_KEY = "ldx_ui_view_v3";     // 面板显示形态记忆
  var HELP_POS_KEY = "ldx_help_pos_v3";   // 说明窗口位置记忆
  var launcherBtn = null;
  var mainPanel = null;                   // 当前主面板（供油猴菜单命令操作）
  var panelKind = "topic";                // topic / single
  var renderedKind = "none";              // 已经渲染的面板类型，用于路由切换时重建
  var helpPanel = null;
  var helpKind = "topic";

  var MODE_NAME = { serial: "非并发", concurrent: "并发", aggressive: "激进" };
  // 面板内一行摘要（完整说明见“使用说明”窗口）
  var MODE_SHORT = {
    serial: "逐章串行，最稳但最慢",
    concurrent: "每批 5 章并发，约 32 秒一轮",
    aggressive: "多批并行，速度最快",
  };
  var MODE_DESC = {
    serial: "逐章串行提交，最稳定；每门课按“睡眠”秒数等待，速度最慢。",
    concurrent: "每批同时提交 5 个章节，一轮结束后冷却约 32 秒，失败自动重试，速度较快。",
    aggressive: "多个批次同时推进，速度最快；请求较密集，网络差时失败率略高。",
  };
  var COLOR_MAP = {
    red: "#d32f2f", green: "#2e7d32", blue: "#1565c0",
    orange: "#ef6c00", yellow: "#b8860b",
  };
  var API_PAGE_SIZE = 8; // 接口固定每页 8 门（最稳定）

  // ==================== 主入口 ====================
  // 只在“主题专栏”内页（#/web/ind_ThemeCourses）与课程播放页生效
  function detectRoute() {
    var href = window.location.href;
    if (/course_courseDetails\/\d+/.test(href)) return "single";
    if (href.includes("ind_ThemeCourses")) return "topic";
    return "none";
  }

  function initializeScript() {
    var kind = detectRoute();
    if (kind === "none") {
      setUIVisible(false); // 其它页面不显示面板，避免干扰
      return;
    }
    if (mainPanel && renderedKind === kind) {
      setUIVisible(true);  // 同一路由内跳转，保留面板与已加载的课程
      return;
    }
    if (mainPanel) teardownUI(); // 专栏页 ↔ 课程播放页：旧面板不适用，重建
    injectUIStyles();
    if (kind === "single") {
      renderSingleCourseUI(window.location.href.match(/course_courseDetails\/(\d+)/)[1]);
    } else {
      renderTopicUI();
    }
    renderedKind = kind;
    registerMenuCommands();
  }

  // 移除脚本自己注入的界面，重置列表状态（不影响网站页面本身）
  function teardownUI() {
    stopWatchSitePagination();
    document.querySelectorAll(".ldx-panel, .ldx-launcher").forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    mainPanel = null;
    launcherBtn = null;
    helpPanel = null;
    renderedKind = "none";
    cList = [];
    allCount = 0;
    topicParams = {};
    readyCheck = false;
  }

  function setUIVisible(visible) {
    if (!mainPanel) return;
    if (visible) {
      restorePanelView(mainPanel);
      return;
    }
    mainPanel.style.display = "none";
    if (launcherBtn) launcherBtn.style.display = "none";
    if (helpPanel) helpPanel.style.display = "none";
  }

  // ==================== 油猴菜单 ====================
  // 在 Tampermonkey 面板里的“脚本名称”下提供快捷操作，不用再找面板上的按钮
  var menuRegistered = false;

  function registerMenuCommands() {
    if (menuRegistered || typeof GM_registerMenuCommand !== "function") return;
    menuRegistered = true;

    GM_registerMenuCommand("显示 / 隐藏面板", function () {
      if (!mainPanel) return;
      var hidden = mainPanel.style.display === "none";
      setPanelView(mainPanel, hidden ? "full" : "hidden");
    });

    GM_registerMenuCommand("完整 / 迷你 切换", function () {
      if (!mainPanel) return;
      setPanelView(mainPanel, mainPanel.classList.contains("ldx-mini") ? "full" : "mini");
    });

    // 三种刷课模式：菜单里选一项即生效，与面板上的单选保持同步
    GM_registerMenuCommand("刷课模式：非并发", function () { applyMode("serial"); });
    GM_registerMenuCommand("刷课模式：并发", function () { applyMode("concurrent"); });
    GM_registerMenuCommand("刷课模式：激进", function () { applyMode("aggressive"); });

    GM_registerMenuCommand("全部学习（整栏未学完课程）", function () {
      if (panelKind !== "topic") return; // 单课程页没有这个功能
      var btn = document.getElementById("btn-learn-all");
      if (btn) btn.click();
    });

    GM_registerMenuCommand("使用说明", function () { openHelp(panelKind); });
  }

  // 菜单切换模式：勾选对应 radio 并触发 change，让面板与说明文字同步更新
  function applyMode(mode) {
    var name = panelKind === "single" ? "singleBrushMode" : "brushMode";
    var radio = document.querySelector('input[name="' + name + '"][value="' + mode + '"]');
    if (!radio) return;
    radio.checked = true;
    var ev = document.createEvent("HTMLEvents");
    ev.initEvent("change", true, false);
    radio.dispatchEvent(ev);
  }

  // ==================== 通用 UI 基础设施 ====================
  function injectUIStyles() {
    if (document.getElementById("ldx-style")) return;
    var style = document.createElement("style");
    style.id = "ldx-style";
    style.textContent = `
      .ldx-panel{position:fixed;left:20px;top:60px;display:flex;flex-direction:column;
        background:#f5f6f8;border:1px solid #cfd5dd;border-radius:8px;z-index:2147483000;
        box-shadow:0 8px 24px rgba(0,0,0,.18);color:#222;font:12px/1.5 "Microsoft YaHei",Arial,sans-serif;
        max-height:calc(100vh - 20px);}
      .ldx-head{display:flex;align-items:center;justify-content:space-between;gap:8px;
        padding:5px 8px;background:linear-gradient(180deg,#2196f3,#1c85dc);color:#fff;
        border-radius:7px 7px 0 0;cursor:move;user-select:none;}
      .ldx-head .ldx-title{font-weight:700;font-size:13px;letter-spacing:.5px;}
      .ldx-head-btns button{border:0;background:rgba(255,255,255,.22);color:#fff;width:20px;height:20px;
        border-radius:4px;cursor:pointer;font-size:12px;line-height:20px;padding:0;margin-left:4px;}
      .ldx-head-btns button:hover{background:rgba(255,255,255,.45);}
      .ldx-mini-strip{display:none;align-items:center;gap:6px;padding:4px 8px;font-size:11px;color:#455a64;}
      .ldx-mini-strip #miniStatus{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .ldx-mini-bar{flex:1;height:8px;background:#e2e7ee;border-radius:4px;overflow:hidden;}
      .ldx-mini-bar>div{height:100%;width:0;background:#4caf50;}
      .ldx-panel.ldx-mini .ldx-mini-strip{display:flex;}
      .ldx-panel.ldx-mini .ldx-body{display:none;}
      .ldx-body{padding:6px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:5px;}
      .ldx-sec{border:1px solid #e0e4ea;border-radius:6px;background:#fff;overflow:hidden;flex:none;}
      .ldx-sec-head{display:flex;align-items:center;justify-content:space-between;
        padding:2px 8px;background:#eef2f7;font-weight:700;color:#1e5f9e;cursor:pointer;font-size:12px;}
      .ldx-sec-head:hover{background:#e6edf6;}
      .ldx-caret{font-style:normal;font-size:10px;color:#8091a5;transition:transform .15s;}
      .ldx-sec.collapsed .ldx-caret{transform:rotate(-90deg);}
      .ldx-sec.collapsed .ldx-sec-body{display:none;}
      .ldx-sec-body{padding:4px 7px;}
      .ldx-row{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-bottom:5px;}
      .ldx-row:last-child{margin-bottom:0;}
      .ldx-btn{border:0;border-radius:4px;padding:3px 9px;font-size:12px;line-height:1.4;
        color:#fff;background:#2196f3;cursor:pointer;white-space:nowrap;}
      .ldx-btn:hover{filter:brightness(1.08);}
      .ldx-btn:disabled{opacity:.55;cursor:not-allowed;}
      .ldx-btn-green{background:#2e9d55;}
      .ldx-btn-orange{background:#ef6c00;}
      .ldx-btn-plain{background:#eef2f7;color:#33506d;border:1px solid #d6dde6;}
      .ldx-btn-plain:hover{background:#e2e9f2;filter:none;}
      .ldx-field{display:inline-flex;align-items:center;gap:3px;font-size:12px;color:#3c4d61;}
      .ldx-field input{width:48px;padding:2px 4px;border:1px solid #cfd5dd;border-radius:3px;
        font-size:12px;color:#222;background:#fff;}
      .ldx-field input[type=number]{width:40px;}
      .ldx-field input[type=checkbox]{width:auto;padding:0;margin:0;border:0;background:none;}
      .ldx-field input:disabled{background:#eef2f7;color:#8a97a8;}
      .ldx-hint{font-size:11px;color:#8794a5;line-height:1.5;}
      .ldx-modes label{display:inline-flex;align-items:center;gap:3px;margin-right:8px;
        font-size:12px;cursor:pointer;color:#33506d;}
      .ldx-modes input{margin:0;}
      .ldx-list{list-style:none;margin:0;padding:0;max-height:115px;overflow-y:auto;overflow-x:hidden;
        border:1px solid #e3e8ef;border-radius:4px;background:#fbfcfe;}
      .ldx-list li{display:flex;align-items:center;gap:5px;padding:2px 5px;font-size:12px;
        border-bottom:1px dashed #eef1f5;}
      .ldx-list li:last-child{border-bottom:0;}
      .ldx-list li input{flex:none;margin:0;}
      .ldx-list li span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .ldx-bar{height:14px;background:#dfe5ec;border:1px solid #ccd4de;border-radius:7px;overflow:hidden;}
      .ldx-bar>div{height:100%;width:0;background:linear-gradient(90deg,#66bb6a,#2e7d32);
        transition:width .3s;}
      .ldx-bar-num{flex:none;font-size:11px;color:#5a6a7d;margin:0;}
      .ldx-status{flex:1;min-width:0;font-size:12px;line-height:1.4;color:#c62828;word-break:break-word;}
      .ldx-log{height:78px;overflow-y:auto;overflow-x:hidden;padding:1px 5px;background:#fff;
        border:1px solid #e3e8ef;border-radius:4px;}
      .ldx-log-row{font-size:11px;line-height:1.6;color:#333;overflow-wrap:anywhere;word-break:break-word;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      .ldx-log-row.ldx-log-long{font-size:10px;}
      .ldx-log-time{color:#96a0b0;}
      .ldx-launcher{position:fixed;left:0;top:150px;width:34px;height:54px;border:0;
        border-radius:0 8px 8px 0;background:#2196f3;color:#fff;font-size:13px;font-weight:700;
        cursor:pointer;z-index:2147483000;display:none;padding:0;line-height:1.25;
        box-shadow:2px 2px 8px rgba(0,0,0,.2);}
      .ldx-launcher:hover{background:#1c85dc;}
      .ldx-help .ldx-body{gap:6px;}
      .ldx-help h4{margin:8px 0 2px;font-size:13px;color:#1e5f9e;}
      .ldx-help p,.ldx-help li{font-size:12px;line-height:1.6;color:#3c4d61;margin:2px 0;}
      .ldx-help ul,.ldx-help ol{margin:2px 0;padding-left:18px;}
      .ldx-help b{color:#d84315;}
      .ldx-help .ldx-note{color:#8794a5;font-size:11px;}
      .ldx-mask{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;z-index:2147483001;}
      .ldx-confirm{width:280px;background:#fff;border-radius:8px;overflow:hidden;
        box-shadow:0 10px 30px rgba(0,0,0,.28);color:#222;
        font:12px/1.6 "Microsoft YaHei",Arial,sans-serif;}
      .ldx-confirm-head{padding:6px 10px;background:linear-gradient(180deg,#2196f3,#1c85dc);
        color:#fff;font-weight:700;font-size:13px;}
      .ldx-confirm-body{padding:10px 10px 4px;}
      .ldx-confirm-body p{margin:0 0 6px;}
      .ldx-confirm-tip{color:#8794a5;font-size:11px;}
      .ldx-confirm-foot{display:flex;justify-content:flex-end;gap:6px;padding:4px 10px 10px;}
    `;
    document.head.appendChild(style);
  }

  function buildPanel(title, width, bodyHTML, kind) {
    injectUIStyles();
    panelKind = kind;
    var panel = document.createElement("div");
    panel.className = "ldx-panel";
    panel.style.width = width + "px";
    panel.innerHTML =
      '<div class="ldx-head">' +
        '<span class="ldx-title">' + title + '</span>' +
        '<span class="ldx-head-btns">' +
          '<button id="ldx-btn-help" title="使用说明：按钮与参数的含义">?</button>' +
          '<button id="ldx-btn-mini" title="切换迷你模式（只保留进度）">－</button>' +
          '<button id="ldx-btn-hide" title="隐藏面板（点左侧圆钮重新展开）">✕</button>' +
        '</span>' +
      '</div>' +
      '<div class="ldx-mini-strip">' +
        '<span id="miniStatus">待机</span>' +
        '<div class="ldx-mini-bar"><div id="miniProgress"></div></div>' +
        '<span id="miniNum">0%</span>' +
      '</div>' +
      '<div class="ldx-body">' + bodyHTML + '</div>';
    document.body.appendChild(panel);

    launcherBtn = document.createElement("button");
    launcherBtn.className = "ldx-launcher";
    launcherBtn.innerText = "刷课";
    launcherBtn.title = "展开联通网上学院助手面板";
    launcherBtn.addEventListener("click", function () { setPanelView(panel, "full"); });
    document.body.appendChild(launcherBtn);
    mainPanel = panel;

    makeDraggable(panel, panel.querySelector(".ldx-head"), UI_POS_KEY);
    restorePanelPos(panel, UI_POS_KEY);
    restorePanelView(panel);

    panel.querySelector("#ldx-btn-mini").addEventListener("click", function () {
      setPanelView(panel, panel.classList.contains("ldx-mini") ? "full" : "mini");
    });
    panel.querySelector("#ldx-btn-hide").addEventListener("click", function () {
      setPanelView(panel, "hidden");
    });
    panel.querySelector("#ldx-btn-help").addEventListener("click", function () {
      openHelp(kind);
    });
    bindSectionCollapse(panel);
    return panel;
  }

  function bindSectionCollapse(root) {
    root.querySelectorAll(".ldx-sec-head").forEach(function (head) {
      head.addEventListener("click", function () {
        head.parentElement.classList.toggle("collapsed");
      });
    });
  }

  // full（完整）/ mini（迷你）/ hidden（隐藏为左侧圆钮）
  function setPanelView(panel, view) {
    panel.classList.toggle("ldx-mini", view === "mini");
    panel.style.display = view === "hidden" ? "none" : "flex";
    if (launcherBtn) launcherBtn.style.display = view === "hidden" ? "block" : "none";
    var miniBtn = panel.querySelector("#ldx-btn-mini");
    if (miniBtn) {
      miniBtn.innerText = view === "mini" ? "＋" : "－";
      miniBtn.title = view === "mini" ? "恢复完整面板" : "切换迷你模式（只保留进度）";
    }
    try { localStorage.setItem(UI_VIEW_KEY, view); } catch (err) {}
  }

  function restorePanelView(panel) {
    var view = "full";
    try { view = localStorage.getItem(UI_VIEW_KEY) || "full"; } catch (err) {}
    setPanelView(panel, view);
  }

  function restorePanelPos(el, key) {
    var pos = null;
    try { pos = JSON.parse(localStorage.getItem(key) || "null"); } catch (err) {}
    if (!pos || typeof pos.left !== "number" || typeof pos.top !== "number") {
      if (key === UI_POS_KEY) { el.style.left = "20px"; el.style.top = "60px"; }
    } else {
      el.style.left = Math.max(0, Math.min(pos.left, window.innerWidth - 80)) + "px";
      el.style.top = Math.max(0, Math.min(pos.top, window.innerHeight - 50)) + "px";
    }
    // 渲染后若面板底部超出视口，则上移，保证整块都能看到
    setTimeout(function () {
      var maxTop = window.innerHeight - el.offsetHeight - 8;
      if (maxTop > 0 && el.offsetTop > maxTop) el.style.top = maxTop + "px";
      if (el.offsetTop < 0) el.style.top = "8px";
    }, 0);
  }

  function makeDraggable(element, handle, posKey) {
    var dragging = false;
    var startX = 0, startY = 0, baseLeft = 0, baseTop = 0;

    handle.addEventListener("mousedown", function (ev) {
      if (ev.target.tagName === "BUTTON") return; // 点到标题栏按钮时不拖动
      var rect = element.getBoundingClientRect();
      dragging = true;
      startX = ev.clientX;
      startY = ev.clientY;
      baseLeft = rect.left;
      baseTop = rect.top;
      ev.preventDefault();
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    function onMove(ev) {
      if (!dragging) return;
      var left = baseLeft + ev.clientX - startX;
      var top = baseTop + ev.clientY - startY;
      left = Math.max(0, Math.min(left, window.innerWidth - 80));
      top = Math.max(0, Math.min(top, window.innerHeight - 40));
      element.style.left = left + "px";
      element.style.top = top + "px";
    }

    function onUp() {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      try {
        localStorage.setItem(posKey, JSON.stringify({
          left: element.offsetLeft,
          top: element.offsetTop,
        }));
      } catch (err) {}
    }
  }

  // ==================== 进度 / 日志 ====================
  // 开始刷课时自动展开日志分区（默认收起，避免面板过长）
  function expandLogSection() {
    var log = document.getElementById("ldx-log");
    var sec = log ? log.closest(".ldx-sec") : null;
    if (sec) sec.classList.remove("collapsed");
  }

  function setProgress(pgr) {
    pgr = Math.max(0, Math.min(100, Math.round(Number(pgr) || 0)));
    var bar = document.getElementById("myProgress");
    var num = document.getElementById("progrssNum");
    var miniBar = document.getElementById("miniProgress");
    var miniNum = document.getElementById("miniNum");
    if (bar) bar.style.width = pgr + "%";
    if (num) num.innerText = pgr + "%";
    if (miniBar) miniBar.style.width = pgr + "%";
    if (miniNum) miniNum.innerText = pgr + "%";
  }

  function pushLog(text, color) {
    var list = document.getElementById("ldx-log");
    if (!list) return;
    var d = new Date();
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    var time = (d.getMonth() + 1) + "月" + d.getDate() + "日 " +
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());

    var row = document.createElement("div");
    row.className = "ldx-log-row" + (text.length > 42 ? " ldx-log-long" : "");
    row.style.color = color;
    row.title = "[" + time + "] " + text;

    var timeSpan = document.createElement("span");
    timeSpan.className = "ldx-log-time";
    timeSpan.innerText = time + "  ";
    row.appendChild(timeSpan);
    row.appendChild(document.createTextNode(text));

    list.appendChild(row);
    while (list.children.length > LOG_LIMIT) list.removeChild(list.firstChild);
    list.scrollTop = list.scrollHeight;
  }

  function showLog(info, color, lock) {
    var text = info == null ? "" : String(info);
    var cssColor = COLOR_MAP[color] || color || "#333";
    var waitInfo = document.getElementById("waitInfo");
    if (waitInfo) {
      waitInfo.innerText = text;
      waitInfo.style.color = cssColor;
    }
    var miniStatus = document.getElementById("miniStatus");
    if (miniStatus) {
      miniStatus.innerText = text.length > 20 ? text.slice(0, 20) + "…" : text;
      miniStatus.title = text;
    }
    pushLog(text, cssColor);
    readyCheck = !lock;
  }

  // 获取课程列表期间把“开始刷课/全部学习”锁住，避免列表未就绪时误操作
  var topicBusy = false;

  function setTopicLoading(busy) {
    topicBusy = busy;
    var begin = document.getElementById("btn-begin");
    var all = document.getElementById("btn-learn-all");
    if (begin) {
      if (begin.innerText === "刷课中…") {
        // 正在刷课时不覆盖按钮状态，交给 beginSelected 自己恢复
      } else if (busy) {
        begin.disabled = true;
        begin.innerText = "获取课程中…";
      } else {
        begin.disabled = false;
        begin.innerText = "开始刷课";
      }
    }
    if (all) all.disabled = busy;
  }

  // 确认弹窗：返回 Promise<boolean>，取消/点遮罩/Esc 都视为取消
  function confirmBox(title, message, tip, okText) {
    injectUIStyles();
    return new Promise(function (resolve) {
      var mask = document.createElement("div");
      mask.className = "ldx-mask";
      mask.innerHTML =
        '<div class="ldx-confirm">' +
          '<div class="ldx-confirm-head">' + title + '</div>' +
          '<div class="ldx-confirm-body">' +
            '<p>' + message + '</p>' +
            (tip ? '<p class="ldx-confirm-tip">' + tip + '</p>' : '') +
          '</div>' +
          '<div class="ldx-confirm-foot">' +
            '<button class="ldx-btn ldx-btn-plain" data-act="cancel">取消</button>' +
            '<button class="ldx-btn ldx-btn-green" data-act="ok">' + (okText || "确认") + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(mask);

      function done(v) {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
        document.removeEventListener("keydown", onKey, true);
        resolve(v);
      }
      function onKey(ev) {
        if (ev.key === "Escape") done(false);
      }
      document.addEventListener("keydown", onKey, true);
      mask.addEventListener("click", function (ev) {
        if (ev.target === mask) { done(false); return; }
        var act = ev.target.getAttribute && ev.target.getAttribute("data-act");
        if (act === "ok") done(true);
        else if (act === "cancel") done(false);
      });
    });
  }

  // ==================== 模式选择 ====================
  function getCheckedMode(name) {
    var radio = document.querySelector('input[name="' + name + '"]:checked');
    return radio ? radio.value : "serial";
  }

  function pickBeginFn(mode) {
    if (mode === "aggressive") return beginAggressive;
    if (mode === "concurrent") return beginConcurrent;
    return beginSerial;
  }

  function bindModeDesc() {
    var desc = document.getElementById("mode-desc");
    var radios = document.querySelectorAll('input[name="brushMode"], input[name="singleBrushMode"]');
    if (!desc) return;
    var refresh = function () {
      var mode = getCheckedMode("brushMode");
      if (!document.querySelector('input[name="brushMode"]')) mode = getCheckedMode("singleBrushMode");
      desc.innerText = MODE_SHORT[mode] || "";
    };
    radios.forEach(function (r) { r.addEventListener("change", refresh); });
    refresh();
  }

  function getToken() {
    var part = document.cookie.split("token=")[1];
    return part ? part.split(";")[0] : "";
  }

  function getColumnIdFromUrl() {
    var query = window.location.href.split("?")[1];
    return (query && query.split("=")[1]) || "";
  }

  // ==================== 单课程页面 UI ====================
  function renderSingleCourseUI(courseId) {
    var body =
      '<div class="ldx-sec">' +
        '<div class="ldx-sec-head"><span>刷课模式</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body">' +
          '<div class="ldx-row ldx-modes">' +
            '<label title="逐章提交，最稳定">' +
              '<input type="radio" name="singleBrushMode" value="serial" checked>非并发</label>' +
            '<label title="分批并发提交，失败自动重试">' +
              '<input type="radio" name="singleBrushMode" value="concurrent">并发</label>' +
            '<label title="多批并行，速度最快">' +
              '<input type="radio" name="singleBrushMode" value="aggressive">激进</label>' +
            '<label class="ldx-field" title="每门课之间的等待秒数，建议不小于 1 秒">' +
              '睡眠<input id="sleeptime" type="number" min="1" step="1" value="1">秒</label>' +
          '</div>' +
          '<div id="mode-desc" class="ldx-hint"></div>' +
        '</div>' +
      '</div>' +
      '<div class="ldx-sec">' +
        '<div class="ldx-sec-head"><span>开始与进度</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body">' +
          '<div class="ldx-row">' +
            '<button id="btn-begin-single" class="ldx-btn ldx-btn-green" ' +
              'title="获取本课程全部章节并提交学习时长">刷当前课程</button>' +
            '<button id="btn-help" class="ldx-btn ldx-btn-plain" ' +
              'title="查看按钮与参数说明">使用说明</button>' +
          '</div>' +
          '<div class="ldx-bar"><div id="myProgress"></div></div>' +
          '<div class="ldx-row" style="margin:2px 0 4px;">' +
            '<span id="waitInfo" class="ldx-status">正在准备…</span>' +
            '<span id="progrssNum" class="ldx-bar-num">0%</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ldx-sec collapsed">' +
        '<div class="ldx-sec-head"><span>运行日志</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body"><div id="ldx-log" class="ldx-log"></div></div>' +
      '</div>';

    buildPanel("联通网上学院助手 · 单课程", 300, body, "single");
    bindModeDesc();
    document.getElementById("btn-help").addEventListener("click", function () {
      openHelp("single");
    });

    var btn = document.getElementById("btn-begin-single");
    btn.addEventListener("click", async function () {
      btn.disabled = true;
      btn.innerText = "正在处理…";
      setProgress(0);
      expandLogSection();
      showLog("正在获取课程章节…", "blue", true);

      try {
        var kpoints = await getCourseInfo(courseId);
        if (!kpoints || kpoints.length === 0) {
          showLog("未获取到章节，请确认已登录且停留在课程页", "red", false);
          btn.disabled = false;
          btn.innerText = "刷当前课程";
          return;
        }

        var mode = getCheckedMode("singleBrushMode");
        var singleCourse = { id: courseId, child: kpoints };
        showLog("[" + MODE_NAME[mode] + "] 共 " + kpoints.length + " 个章节，开始…", "orange", true);
        var result = await pickBeginFn(mode)([singleCourse], kpoints.length);

        if (result !== 0) {
          showLog("当前课程已完成", "green", false);
          btn.innerText = "已完成";
        } else {
          showLog("中断，请查看日志后重试", "red", false);
          btn.disabled = false;
          btn.innerText = "刷当前课程";
        }
      } catch (error) {
        showLog("出错：" + error.message, "red", false);
        btn.disabled = false;
        btn.innerText = "刷当前课程";
      }
    });
  }

  // ==================== 专栏页面 UI ====================
  function renderTopicUI() {
    var body =
      '<div class="ldx-sec">' +
        '<div class="ldx-sec-head"><span>课程列表</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body">' +
          '<div class="ldx-row">' +
            '<button id="btn-select-all" class="ldx-btn ldx-btn-plain" ' +
              'title="勾选列表中的全部课程">全选</button>' +
            '<button id="btn-select-unfinished" class="ldx-btn ldx-btn-plain" ' +
              'title="只勾选进度未满 100% 的课程">选未学完</button>' +
            '<button id="btn-deselect-all" class="ldx-btn ldx-btn-plain" ' +
              'title="取消勾选全部课程">全不选</button>' +
            '<span id="c-selected" class="ldx-hint" title="只有勾选的课程会被刷">已选 0 门</span>' +
          '</div>' +
          '<ul id="ul" class="ldx-list"><li class="ldx-hint">正在获取课程列表…</li></ul>' +
        '</div>' +
      '</div>' +
      '<div class="ldx-sec">' +
        '<div class="ldx-sec-head"><span>专栏与分页</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body">' +
          '<div class="ldx-row">' +
            '<label class="ldx-field" title="专栏ID：网址 ? 后面的数字，换成其它专栏 ID 可刷其它专栏">' +
              '专栏ID<input id="c-id" type="text" value="' + getColumnIdFromUrl() + '"></label>' +
            '<label class="ldx-field" title="当前页：自动模式下取自网站分页的高亮页码；取消自动识别后可手动指定">' +
              '当前页<input id="c-cur" type="number" min="1" step="1" value="1"></label>' +
            '<label class="ldx-field" title="页课程数：自动模式下固定为接口每页 8 门">' +
              '页课程数<input id="c-size" type="number" min="1" step="1" value="8"></label>' +
          '</div>' +
          '<div class="ldx-row">' +
            '<span class="ldx-hint" title="该专栏的全部课程数量（只读）">总课程数 <b id="c-total">0</b></span>' +
            '<button id="btn-update" class="ldx-btn" ' +
              'title="按上面的专栏ID、当前页、页课程数重新拉取课程列表；改了参数必须点它">更新课程</button>' +
            '<label class="ldx-field" title="自动识别：读取课程列表自己的分页条高亮页码，并持续跟随网站翻页；读不到页码时才用页面课程名逐页反查接口">' +
              '<input type="checkbox" id="auto-page" checked>自动识别</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ldx-sec">' +
        '<div class="ldx-sec-head"><span>刷课模式</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body">' +
          '<div class="ldx-row ldx-modes">' +
            '<label title="逐章串行提交，最稳定">' +
              '<input type="radio" name="brushMode" value="serial" checked>非并发</label>' +
            '<label title="分批并发提交，失败自动重试">' +
              '<input type="radio" name="brushMode" value="concurrent">并发</label>' +
            '<label title="多批并行，速度最快">' +
              '<input type="radio" name="brushMode" value="aggressive">激进</label>' +
            '<label class="ldx-field" title="睡眠时间：非并发模式下每门课程之间的等待秒数">' +
              '睡眠<input id="sleeptime" type="number" min="1" step="1" value="1">秒</label>' +
          '</div>' +
          '<div id="mode-desc" class="ldx-hint"></div>' +
        '</div>' +
      '</div>' +
      '<div class="ldx-sec">' +
        '<div class="ldx-sec-head"><span>开始与进度</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body">' +
          '<div class="ldx-row">' +
            '<button id="btn-begin" class="ldx-btn ldx-btn-green" ' +
              'title="开始刷列表里已勾选的课程">开始刷课</button>' +
            '<button id="btn-learn-all" class="ldx-btn ldx-btn-orange" ' +
              'title="一键全部学习：读取专栏总课程数，加载全部课程，自动勾选未学完的课程，切到激进模式并立即开始（点击后会先弹确认框）">全部学习</button>' +
            '<button id="btn-help" class="ldx-btn ldx-btn-plain" ' +
              'title="查看按钮与参数说明">使用说明</button>' +
          '</div>' +
          '<div class="ldx-bar"><div id="myProgress"></div></div>' +
          '<div class="ldx-row" style="margin:2px 0 4px;">' +
            '<span id="waitInfo" class="ldx-status">正在准备…</span>' +
            '<span id="progrssNum" class="ldx-bar-num">0%</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ldx-sec collapsed">' +
        '<div class="ldx-sec-head"><span>运行日志</span><i class="ldx-caret">▾</i></div>' +
        '<div class="ldx-sec-body"><div id="ldx-log" class="ldx-log"></div></div>' +
      '</div>';

    buildPanel("联通网上学院助手", 330, body, "topic");
    bindModeDesc();
    bindTopicControls();
    initTopicData();
  }

  function updateSelectedCount() {
    var el = document.getElementById("c-selected");
    if (!el) return;
    var count = document.querySelectorAll(".course-checkbox:checked").length;
    el.innerText = "已选 " + count + " 门";
  }

  function bindTopicControls() {
    document.getElementById("btn-help").addEventListener("click", function () {
      openHelp("topic");
    });
    document.getElementById("auto-page").addEventListener("change", function () {
      syncAutoPageUI();
      if (isAutoPage()) {
        // 重新打开自动识别：立刻读一次当前页，并恢复跟随
        detectAndFillPage().then(function () {
          watchSitePagination();
          if (!topicBusy) {
            setTopicLoading(true);
            update().finally(function () { setTopicLoading(false); });
          }
        });
      } else {
        stopWatchSitePagination();
      }
    });

    // 勾选辅助
    document.getElementById("btn-select-all").addEventListener("click", function () {
      document.querySelectorAll(".course-checkbox").forEach(function (cb) { cb.checked = true; });
      updateSelectedCount();
    });
    document.getElementById("btn-deselect-all").addEventListener("click", function () {
      document.querySelectorAll(".course-checkbox").forEach(function (cb) { cb.checked = false; });
      updateSelectedCount();
    });
    document.getElementById("btn-select-unfinished").addEventListener("click", function () {
      checkUnfinished();
    });
    document.getElementById("ul").addEventListener("change", function (ev) {
      if (ev.target.classList.contains("course-checkbox")) updateSelectedCount();
    });

    // 更新课程
    var btnUpdate = document.getElementById("btn-update");
    btnUpdate.addEventListener("click", function () {
      btnUpdate.disabled = true;
      btnUpdate.innerText = "更新中…";
      setTopicLoading(true);
      update().finally(function () {
        btnUpdate.disabled = false;
        btnUpdate.innerText = "更新课程";
        setTopicLoading(false);
      });
    });

    // 全部学习：先确认，再整栏加载 → 勾选未学完 → 激进模式 → 开始
    var btnLearnAll = document.getElementById("btn-learn-all");
    btnLearnAll.addEventListener("click", function () {
      if (btnLearnAll.disabled) return;
      var btnBeginNow = document.getElementById("btn-begin");
      if (btnBeginNow && btnBeginNow.disabled) {
        showLog("正在获取课程或刷课中，请等本次流程结束再操作", "orange", false);
        return;
      }
      if (!getToken()) {
        showLog("未获取到登录 token，请确认已登录后刷新页面", "red", false);
        return;
      }
      var totalEl = document.getElementById("c-total");
      var total = totalEl ? totalEl.innerText : "0";
      confirmBox(
        "全部学习确认",
        "将一次性加载本专栏全部课程（当前已知总课程数 " + total + " 门），自动勾选未学完的课程，切换为“激进”模式并立即开始刷课。",
        "课程较多时请求较密集，可能需要较长时间；中途可刷新页面停止。",
        "开始全部学习"
      ).then(function (ok) {
        if (!ok) return;
        setTopicLoading(true);
        btnLearnAll.innerText = "准备中…";
        expandLogSection();
        learnAll().finally(function () {
          btnLearnAll.disabled = false;
          btnLearnAll.innerText = "全部学习";
          setTopicLoading(false);
        });
      });
    });

    // 开始刷课
    var btnBegin = document.getElementById("btn-begin");
    btnBegin.addEventListener("click", function () {
      beginSelected();
    });
  }

  // 判断课程是否未学完（进度未满 100%）
  function isUnfinished(course) {
    var play = Number(course.playTime);
    var total = Number(course.totalPlayTime);
    if (!isFinite(play) || !isFinite(total) || total <= 0) return true;
    return play / total < 1;
  }

  // 勾选列表中所有未学完的课程
  function checkUnfinished() {
    var count = 0;
    document.querySelectorAll(".course-checkbox").forEach(function (cb) {
      var li = cb.closest("li");
      var span = li ? li.querySelector("span") : null;
      var text = span ? (span.textContent || "") : "";
      var m = text.match(/已看[：:](\d+\.?\d*)%/);
      var unfinished = !(m && parseFloat(m[1]) >= 100);
      cb.checked = unfinished;
      if (unfinished) count++;
    });
    updateSelectedCount();
    return count;
  }

  // 按勾选状态开始刷课
  function beginSelected() {
    if (!readyCheck) {
      showLog("课程信息尚未就绪，等状态变绿后再开始", "orange", false);
      return;
    }
    var btnBegin = document.getElementById("btn-begin");
    var selectedIds = Array.from(document.querySelectorAll(".course-checkbox:checked"))
      .map(function (cb) { return cb.dataset.courseId; });
    var selectedCourses = cList.filter(function (course) {
      return selectedIds.indexOf(String(course.id)) >= 0;
    });
    if (selectedCourses.length === 0) {
      showLog("请先在课程列表中勾选要刷的课程", "orange", false);
      return;
    }
    var total = 0;
    selectedCourses.forEach(function (course) {
      total += (course.child && course.child.length) || 0;
    });
    if (total === 0) {
      showLog("所选课程暂无可刷章节，请点“更新课程”后重试", "orange", false);
      return;
    }

    var mode = getCheckedMode("brushMode");
    btnBegin.disabled = true;
    btnBegin.innerText = "刷课中…";
    setProgress(0);
    expandLogSection();
    showLog("[" + MODE_NAME[mode] + "] 开始处理 " + selectedCourses.length + " 门课程…", "blue", true);

    return pickBeginFn(mode)(selectedCourses, total).then(function (v) {
      btnBegin.disabled = false;
      btnBegin.innerText = "开始刷课";
      if (v !== 0) showLog("本次刷课已完成", "green", false);
      else showLog("刷课中断，请查看日志后重试", "red", false);
    }).catch(function (err) {
      btnBegin.disabled = false;
      btnBegin.innerText = "开始刷课";
      showLog("出错：" + err.message, "red", false);
    });
  }

  // 全部学习：按专栏总课程数加载全部课程，切激进模式，勾选未学完并开始
  async function learnAll() {
    showLog("正在获取专栏全部课程…", "blue", true);

    // 激进模式
    var radio = document.querySelector('input[name="brushMode"][value="aggressive"]');
    if (radio) {
      radio.checked = true;
      var ev = document.createEvent("HTMLEvents");
      ev.initEvent("change", true, false);
      radio.dispatchEvent(ev);
    }

    // 先取总数，再按总数设置当前页/页课程数
    var first;
    try {
      first = await fetchCoursePage(1);
    } catch (err) {
      showLog("获取课程列表失败：" + err.message, "red", false);
      return;
    }
    var totalCount = (first.entity && first.entity.page && first.entity.page.totalResultSize) || 0;
    if (totalCount === 0) {
      showLog("专栏内没有获取到课程，请检查专栏ID", "red", false);
      return;
    }

    var cur = document.getElementById("c-cur");
    var size = document.getElementById("c-size");
    // 关闭“自动识别”，否则页课程数会被重置为接口每页 8 门
    var auto = document.getElementById("auto-page");
    if (auto) auto.checked = false;
    stopWatchSitePagination();
    syncAutoPageUI();
    if (cur) cur.value = 1;
    if (size) size.value = totalCount;

    topicParams = buildTopicParams();
    var v = await getData(url, topicParams);
    if (!v || v === 0) {
      showLog("课程加载失败，请稍后重试", "red", false);
      return;
    }
    cList = v;
    allCount = await statistics();
    if (allCount === 0) {
      showLog("全部课程都没有可刷章节，请检查专栏ID", "red", false);
      return;
    }

    var checked = checkUnfinished();
    if (checked === 0) {
      showLog("全部 " + totalCount + " 门课程都已学完，无需刷课", "green", false);
      return;
    }
    showLog("已加载 " + totalCount + " 门课程，未学完 " + checked + " 门，开始激进模式刷课…", "blue", false);
    await beginSelected();
  }

  function buildTopicParams() {
    return {
      token: getToken(),
      timestamp: Math.floor(Date.now() / 1000),
      companyId: window.localStorage.getItem("companyId") || 0,
      from: "WEB",
      organizationId: window.localStorage.getItem("organizationId") || 0,
      randomStr: randomStrFuc(),
      id: (document.getElementById("c-id").value || "").trim(),
      subjectId: "",
      status: 1,
      name: "",
      currentPage: document.getElementById("c-cur").value,
      pageSize: document.getElementById("c-size").value,
      total: 0,
    };
  }

  // ---------- 当前页 / 页课程数：自动识别 ----------
  function isAutoPage() {
    var cb = document.getElementById("auto-page");
    return !cb || cb.checked;
  }

  // 自动模式：当前页、页课程数置灰；页课程数固定为接口每页数量
  function syncAutoPageUI() {
    var auto = isAutoPage();
    var cur = document.getElementById("c-cur");
    var size = document.getElementById("c-size");
    if (cur) cur.disabled = auto;
    if (size) {
      size.disabled = auto;
      if (auto) size.value = API_PAGE_SIZE;
    }
  }

  // 读取网站分页里高亮的页码：<li class="number active">2</li>
  // 统一走 readActivePage()：它会先定位课程列表自己的分页条，避免被页面上其它列表的分页干扰
  function getPageNumberFromDOM() {
    return readActivePage();
  }

  // 读取页面上已显示（非隐藏占位）的课程标题
  function getVisibleCourseTitles() {
    var titles = [];
    document.querySelectorAll(".item-title").forEach(function (el) {
      var li = el.closest("li");
      if (li && (li.style.display === "none" || li.hidden)) return;
      var title = (el.getAttribute("title") || el.textContent || "").replace(/\s+/g, "");
      if (title) titles.push(title);
    });
    return titles;
  }

  // 取页面正文（排除脚本自己的面板，避免用自己列表的课程名造成误判）
  function getPageText() {
    var clone = document.body.cloneNode(true);
    clone.querySelectorAll(".ldx-panel, .ldx-launcher").forEach(function (node) {
      if (node.parentNode) node.parentNode.removeChild(node);
    });
    return (clone.textContent || "").replace(/\s+/g, "");
  }

  async function fetchCoursePage(page) {
    var base = buildTopicParams();
    var params = {
      token: base.token,
      timestamp: Math.floor(Date.now() / 1000),
      companyId: base.companyId,
      from: base.from,
      organizationId: base.organizationId,
      randomStr: randomStrFuc(),
      id: base.id,
      subjectId: "",
      status: 1,
      name: "",
      currentPage: page,
      pageSize: API_PAGE_SIZE,
      total: 0,
    };
    return await request(url.courseList, encryptData(params, false));
  }

  // 统计某一接口页里有多少课程正显示在页面上
  function countMatchedCourses(list, titles, pageText) {
    var matched = 0;
    for (var i = 0; i < list.length; i++) {
      var name = (list[i].name || "").replace(/\s+/g, "");
      if (!name) continue;
      if (titles.length) {
        for (var t = 0; t < titles.length; t++) {
          if (titles[t].indexOf(name) >= 0 || name.indexOf(titles[t]) >= 0) {
            matched++;
            break;
          }
        }
      } else if (pageText.indexOf(name) >= 0) {
        matched++;
      }
    }
    return matched;
  }

  // 面板初始化可能早于网站课程列表渲染，等列表出来再识别，避免读到空页面误判
  function waitForSiteList(timeout) {
    return new Promise(function (resolve) {
      var limit = timeout || 3000;
      var start = Date.now();
      (function tick() {
        var ready = document.querySelector(".item-title") || readActivePage() > 0;
        if (ready || Date.now() - start >= limit) { resolve(); return; }
        setTimeout(tick, 150);
      })();
    });
  }

  // 优先读网站分页的 active 页码；读不到时再用页面课程名逐页反查
  // 注意：不再拿接口数据“校验”DOM 页码。element-plus 的高亮页码就是权威值，
  // 校验反而会在网站列表尚未刷新完成时误判，被错误地带到别的页。
  async function detectCurrentPage() {
    await waitForSiteList(3000);
    var domPage = getPageNumberFromDOM();
    if (domPage > 0) {
      return { page: domPage, matched: getVisibleCourseTitles().length, fromDom: true };
    }

    var titles = getVisibleCourseTitles();
    var pageText = titles.length ? "" : getPageText();
    for (var page = 1; page <= 50; page++) {
      var res = await fetchCoursePage(page);
      var list = res.entity.courseList || [];
      var matched = countMatchedCourses(list, titles, pageText);
      if (matched > 0) return { page: page, matched: matched, fromDom: false };
      if (page * API_PAGE_SIZE >= res.entity.page.totalResultSize) break;
    }
    return { page: 1, matched: 0, fromDom: false };
  }

  async function detectAndFillPage() {
    if (!isAutoPage()) return;
    try {
      var det = await detectCurrentPage();
      document.getElementById("c-cur").value = det.page;
      if (det.fromDom) {
        showLog("已自动识别当前页：第 " + det.page + " 页", "blue", true);
      } else if (det.matched > 0) {
        showLog("已自动识别当前页：第 " + det.page + " 页（按课程名核对 " + det.matched + " 门）", "blue", true);
      } else {
        showLog("未能识别当前页，已按第 1 页处理，可取消“自动识别”手动填写", "orange", true);
      }
    } catch (err) {
      showLog("当前页识别失败，已按第 1 页处理，可取消“自动识别”手动填写", "orange", true);
    }
  }

  // 网站翻页后自动跟随：定时比对分页高亮页码，变了就写回“当前页”并重新拉课程
  // 用轮询而不是 MutationObserver：分页控件可能被整块重建（重建后 observer 挂的旧节点已失效），
  // 且页面可能存在上下两个分页条，轮询能稳定覆盖所有情况。
  var followTimer = null;      // 翻页防抖
  var followPollTimer = null;  // 轮询
  var FOLLOW_POLL_MS = 1000;

  // 页面上可能不止一个分页条（推荐课程、其它列表等），要挑课程列表自己的那个
  function findCoursePager() {
    var pagers = Array.prototype.slice.call(document.querySelectorAll(".el-pagination"));
    if (!pagers.length) return null;
    var firstTitle = document.querySelector(".item-title");
    if (!firstTitle) return pagers[0];
    // 优先取位于课程列表之后的那个分页条
    for (var i = 0; i < pagers.length; i++) {
      if (pagers[i].contains(firstTitle)) continue;
      if (firstTitle.compareDocumentPosition(pagers[i]) & Node.DOCUMENT_POSITION_FOLLOWING) return pagers[i];
    }
    for (var j = 0; j < pagers.length; j++) {
      if (!pagers[j].contains(firstTitle)) return pagers[j];
    }
    return pagers[0];
  }

  function readActivePage() {
    var pager = findCoursePager();
    if (pager) {
      var act = pager.querySelector("li.number.active, .number.active, .el-pager li.active");
      if (act) {
        var n = parseInt((act.textContent || "").replace(/\D/g, ""), 10);
        if (n > 0) return n;
      }
    }
    var nodes = document.querySelectorAll(".el-pagination li.number.active, .el-pagination .number.active, .el-pagination .el-pager li.active");
    for (var i = 0; i < nodes.length; i++) {
      var num = parseInt((nodes[i].textContent || "").replace(/\D/g, ""), 10);
      if (num > 0) return num;
    }
    return 0;
  }

  // 正在刷课时不要跟随翻页，否则会重置 cList 打断刷课
  function isBrushing() {
    var begin = document.getElementById("btn-begin");
    return !!(begin && begin.innerText === "刷课中…");
  }

  function scheduleFollowPage(delay) {
    if (!isAutoPage() || !mainPanel || isBrushing()) return;
    clearTimeout(followTimer);
    followTimer = setTimeout(function () {
      // 正在拉课程就先等，等完再看页码是否又变了
      if (topicBusy) { scheduleFollowPage(800); return; }
      if (isBrushing()) return;
      var page = readActivePage();
      var cur = document.getElementById("c-cur");
      if (!page || !cur || Number(cur.value) === page) return;
      cur.value = page;
      showLog("网站已翻到第 " + page + " 页，正在同步课程…", "blue", true);
      setTopicLoading(true);
      update().catch(function (err) {
        showLog("跟随翻页失败：" + err.message, "red", false);
      }).then(function () {
        setTopicLoading(false);
        scheduleFollowPage(400);
      });
    }, delay || 400);
  }

  function watchSitePagination() {
    if (followPollTimer) return;
    followPollTimer = setInterval(function () {
      var cur = document.getElementById("c-cur");
      if (!cur || !isAutoPage() || !mainPanel) return;
      var page = readActivePage();
      if (page && page !== Number(cur.value)) scheduleFollowPage(300);
    }, FOLLOW_POLL_MS);
  }

  function stopWatchSitePagination() {
    clearTimeout(followTimer);
    followTimer = null;
    clearInterval(followPollTimer);
    followPollTimer = null;
  }

  async function initTopicData() {
    syncAutoPageUI();
    setTopicLoading(true);

    if (!window.location.href.includes("ind_ThemeCourses")) {
      setTopicLoading(false);
      showLog("当前页可能不是专栏内页，确认专栏ID后点“更新课程”", "orange", false);
      return;
    }

    showLog("正在获取课程列表，请稍等…", "blue", true);
    try {
      await detectAndFillPage();
      topicParams = buildTopicParams();
      var v = await getData(url, topicParams);
      if (!v || v === 0) return;
      cList = v;
      allCount = await statistics();
      if (allCount > 0) {
        showLog("课程信息已获取，可以开始刷课", "green", false);
      } else {
        showLog("没有获取到可刷章节，请检查专栏ID", "red", false);
      }
    } finally {
      setTopicLoading(false);
      watchSitePagination();
    }
  }

  // ==================== 使用说明 ====================
  function helpBodyHTML(kind) {
    if (kind === "single") {
      return (
        '<h4>用途</h4>' +
        '<p>在课程播放页直接提交本课程全部章节的学习时长，无需手动改代码。</p>' +
        '<h4>操作步骤</h4>' +
        '<ol><li>确认状态栏提示可以开始；</li>' +
        '<li>选择刷课模式；</li>' +
        '<li>点“刷当前课程”，等进度到 100% 即可。</li></ol>' +
        '<h4>按钮说明</h4>' +
        '<ul>' +
        '<li><b>刷当前课程</b>：获取本课程全部章节并逐段提交学习时长。</li>' +
        '<li><b>使用说明</b>：打开本窗口。</li>' +
        '<li><b>－ / ✕</b>：－ 切换迷你模式；✕ 隐藏面板，点左侧“刷课”圆钮恢复。</li>' +
        '</ul>' +
        '<h4>油猴菜单</h4>' +
        '<p>点击浏览器工具栏的油猴图标，在本脚本名称下可直接操作：显示/隐藏面板、完整/迷你切换、刷课模式（非并发/并发/激进）、使用说明。</p>' +
        '<h4>模式说明</h4>' +
        '<ul>' +
        '<li><b>非并发</b>：' + MODE_DESC.serial + '</li>' +
        '<li><b>并发</b>：' + MODE_DESC.concurrent + '</li>' +
        '<li><b>激进</b>：' + MODE_DESC.aggressive + '</li>' +
        '</ul>' +
        '<h4>声明</h4>' +
        '<p>请勿恶意大量刷课，优质课程请认真学习。</p>'
      );
    }
    return (
      '<h4>使用位置</h4>' +
      '<p>在“主题专栏”中进入任意专栏（页面中间显示“欢迎 XXX”）后使用；进入课程播放页会自动切换为单课程助手。</p>' +
      '<h4>操作流程</h4>' +
      '<ol><li>等状态栏变绿，表示课程列表已获取（获取期间“开始刷课”“全部学习”为禁用状态）；</li>' +
      '<li>列表默认只勾选未学完的课程，可再手动增删；</li>' +
      '<li>选择刷课模式；</li>' +
      '<li>点“开始刷课”，进度到 100% 即完成；想一次刷完整个专栏就点旁边的“全部学习”（会先弹确认框）。</li></ol>' +
      '<h4>按钮说明</h4>' +
      '<ul>' +
      '<li><b>更新课程</b>：按“专栏ID / 当前页 / 页课程数”重新获取列表；改了参数必须点一次。</li>' +
      '<li><b>开始刷课</b>：只刷列表中已勾选的课程。获取课程期间按钮禁用，避免列表未就绪时误操作。</li>' +
      '<li><b>全部学习</b>：与“开始刷课”并排。点击后先弹出确认框，确认后自动读取专栏总课程数、一次性加载全部课程、勾选未学完的课程，切到“激进”模式并立即开始刷课。</li>' +
      '<li><b>全选 / 选未学完 / 全不选</b>：批量勾选；“选未学完”会跳过进度 100% 的课程。列表默认只勾选未学完的课程。</li>' +
      '<li><b>使用说明</b>：打开本窗口。</li>' +
      '<li><b>运行日志</b>：默认收起，开始刷课时自动展开，保留最近 5 条。</li>' +
      '<li><b>－ / ✕</b>：－ 切换迷你模式（只留进度）；✕ 隐藏面板，点左侧“刷课”圆钮恢复。</li>' +
      '</ul>' +
      '<h4>油猴菜单</h4>' +
      '<p>点击浏览器工具栏的油猴图标，在本脚本名称下可直接操作：显示/隐藏面板、完整/迷你切换、刷课模式（非并发/并发/激进）、全部学习、使用说明。菜单与面板保持同步。</p>' +
      '<h4>参数说明</h4>' +
      '<ul>' +
      '<li><b>专栏ID</b>：网址 ? 后面的数字，换成其它专栏 ID 即可刷其它专栏。</li>' +
      '<li><b>当前页 / 页课程数</b>：勾选“自动识别”时会读取课程列表分页条里高亮的页码，并在你于网站上翻页后自动跟随、重新拉取对应课程；读不到高亮页码时才用页面课程名逐页反查接口。页课程数固定为接口每页 8 门，两个输入框置灰；取消勾选后可手动填写，翻页也不会跟随。“全部学习”会自动取消自动识别，把页课程数设为专栏总课程数。</li>' +
      '<li><b>睡眠时间</b>：非并发模式下每门课之间的等待秒数，建议不小于 1 秒。</li>' +
      '<li><b>专栏总课程数</b>：只读，用来判断分页范围。</li>' +
      '</ul>' +
      '<h4>刷课模式</h4>' +
      '<ul>' +
      '<li><b>非并发</b>：' + MODE_DESC.serial + '</li>' +
      '<li><b>并发</b>：' + MODE_DESC.concurrent + '</li>' +
      '<li><b>激进</b>：' + MODE_DESC.aggressive + '</li>' +
      '</ul>' +
      '<p class="ldx-note">单次提交的学习时长上限为 179 秒（服务端限制）；单个视频最多重试 5 轮。</p>' +
      '<h4>常见问题</h4>' +
      '<ul>' +
      '<li>列表一直为空：确认已登录、专栏ID 正确，然后点“更新课程”。</li>' +
      '<li>按钮点了没反应：等状态栏变绿后再操作。</li>' +
      '<li>进度长时间不动：处于轮次冷却（约 32 秒）中，属正常现象。</li>' +
      '</ul>' +
      '<h4>声明</h4>' +
      '<p>请勿恶意大量刷课。脚本只为节省时间、减少无效挂机，优质课程请认真学习。</p>'
    );
  }

  function openHelp(kind) {
    helpKind = kind || "topic";
    if (!helpPanel) {
      helpPanel = document.createElement("div");
      helpPanel.className = "ldx-panel ldx-help";
      helpPanel.style.width = "380px";
      helpPanel.style.maxHeight = "78vh";
      helpPanel.style.left = "400px";
      helpPanel.style.top = "120px";
      helpPanel.innerHTML =
        '<div class="ldx-head">' +
          '<span class="ldx-title">使用说明</span>' +
          '<span class="ldx-head-btns">' +
            '<button id="ldx-help-close" title="关闭说明">✕</button>' +
          '</span>' +
        '</div>' +
        '<div class="ldx-body" id="ldx-help-body"></div>';
      document.body.appendChild(helpPanel);
      makeDraggable(helpPanel, helpPanel.querySelector(".ldx-head"), HELP_POS_KEY);
      restorePanelPos(helpPanel, HELP_POS_KEY);
      helpPanel.querySelector("#ldx-help-close").addEventListener("click", function () {
        helpPanel.style.display = "none";
      });
    }
    helpPanel.querySelector("#ldx-help-body").innerHTML = helpBodyHTML(helpKind);
    helpPanel.style.display = "flex";
  }



  // ———————————————————— 以下为通用核心函数，两个UI模式共用 ————————————————————

  //随机参数
  function randomStrFuc() {
    for (
      var n = 32,
      t = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
         "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
         "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
      ],
      e = "",
      c = 0; c < n; c++
    ) {
      var u = parseInt(61 * Math.random() + "");
      e += t[u];
    }
    return e;
  }
  //md5加密
  var ERROR = "input is invalid type",
  WINDOW = "object" == typeof window,
  root = WINDOW ? window : {},
  WEB_WORKER =
  (root.JS_MD5_NO_WINDOW && (WINDOW = !1),
   !WINDOW && "object" == typeof self),
   NODE_JS =
   !root.JS_MD5_NO_NODE_JS &&
   "object" == typeof process &&
   process.versions &&
   process.versions.node,
   COMMON_JS =
   (NODE_JS ? (root = global) : WEB_WORKER && (root = self),
    !root.JS_MD5_NO_COMMON_JS &&
    "object" == typeof module &&
    module.exports),
    ARRAY_BUFFER =
    !root.JS_MD5_NO_ARRAY_BUFFER && "undefined" != typeof ArrayBuffer,
    HEX_CHARS = "0123456789abcdef".split(""),
 EXTRA = [128, 32768, 8388608, -2147483648],
 SHIFT = [0, 8, 16, 24],
 OUTPUT_TYPES = [
   "hex",
   "array",
   "digest",
   "buffer",
   "arrayBuffer",
   "base64",
 ],
 BASE64_ENCODE_CHAR =
 "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(
   ""
 ),
 blocks = [],
 buffer8,
 buffer,
 buffer8,
 blocks,
 createOutputMethod =
 (ARRAY_BUFFER &&
 ((buffer = new ArrayBuffer(68)),
  (buffer8 = new Uint8Array(buffer)),
  (blocks = new Uint32Array(buffer))),
  (!root.JS_MD5_NO_NODE_JS && Array.isArray) ||
  (Array.isArray = function (t) {
    return "[object Array]" === Object.prototype.toString.call(t);
  }),
  !ARRAY_BUFFER ||
  (!root.JS_MD5_NO_ARRAY_BUFFER_IS_VIEW && ArrayBuffer.isView) ||
  (ArrayBuffer.isView = function (t) {
    return (
      "object" == typeof t &&
      t.buffer &&
      t.buffer.constructor === ArrayBuffer
    );
  }));
 // md5 实现（用于生成签名）
 function Md5(t) {
   t ?
   ((blocks[0] =
   blocks[16] =
   blocks[1] =
   blocks[2] =
   blocks[3] =
   blocks[4] =
   blocks[5] =
   blocks[6] =
   blocks[7] =
   blocks[8] =
   blocks[9] =
   blocks[10] =
   blocks[11] =
   blocks[12] =
   blocks[13] =
   blocks[14] =
   blocks[15] =
   0),
    (this.blocks = blocks),
    (this.buffer8 = buffer8)) :
    ARRAY_BUFFER ?
    ((t = new ArrayBuffer(68)),
     (this.buffer8 = new Uint8Array(t)),
     (this.blocks = new Uint32Array(t))) :
     (this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
 (this.h0 =
 this.h1 =
 this.h2 =
 this.h3 =
 this.start =
 this.bytes =
 this.hBytes =
 0),
 (this.finalized = this.hashed = !1),
 (this.first = !0);
 }
 Md5.prototype.update = function (t) {
   if (!this.finalized) {
     var e,
     n = typeof t;
     if ("string" != n) {
       if ("object" != n) throw ERROR;
       if (null === t) throw ERROR;
       if (ARRAY_BUFFER && t.constructor === ArrayBuffer)
         t = new Uint8Array(t);
       else if (
         !(Array.isArray(t) || (ARRAY_BUFFER && ArrayBuffer.isView(t)))
       )
         throw ERROR;
         e = !0;
     }
     for (
       var i, r, o = 0, a = t.length, s = this.blocks, l = this.buffer8; o < a;

     ) {
       if (
         (this.hashed &&
         ((this.hashed = !1),
          (s[0] = s[16]),
          (s[16] =
          s[1] =
          s[2] =
          s[3] =
          s[4] =
          s[5] =
          s[6] =
          s[7] =
          s[8] =
          s[9] =
          s[10] =
          s[11] =
          s[12] =
          s[13] =
          s[14] =
          s[15] =
          0)),
          e)
       )
         if (ARRAY_BUFFER)
           for (r = this.start; o < a && r < 64; ++o) l[r++] = t[o];
           else
             for (r = this.start; o < a && r < 64; ++o)
               s[r >> 2] |= t[o] << SHIFT[3 & r++];
       else if (ARRAY_BUFFER)
         for (r = this.start; o < a && r < 64; ++o)
           (i = t.charCodeAt(o)) < 128 ?
           (l[r++] = i) :
           (i < 2048 ?
           (l[r++] = 192 | (i >> 6)) :
           (i < 55296 || 57344 <= i ?
           (l[r++] = 224 | (i >> 12)) :
           ((i =
           65536 +
           (((1023 & i) << 10) | (1023 & t.charCodeAt(++o)))),
            (l[r++] = 240 | (i >> 18)),
            (l[r++] = 128 | ((i >> 12) & 63))),
            (l[r++] = 128 | ((i >> 6) & 63))),
            (l[r++] = 128 | (63 & i)));
           else
             for (r = this.start; o < a && r < 64; ++o)
               (i = t.charCodeAt(o)) < 128 ?
               (s[r >> 2] |= i << SHIFT[3 & r++]) :
               (i < 2048 ?
               (s[r >> 2] |= (192 | (i >> 6)) << SHIFT[3 & r++]) :
               (i < 55296 || 57344 <= i ?
               (s[r >> 2] |= (224 | (i >> 12)) << SHIFT[3 & r++]) :
               ((i =
               65536 +
               (((1023 & i) << 10) | (1023 & t.charCodeAt(++o)))),
                (s[r >> 2] |= (240 | (i >> 18)) << SHIFT[3 & r++]),
                (s[r >> 2] |=
                (128 | ((i >> 12) & 63)) << SHIFT[3 & r++])),
                (s[r >> 2] |= (128 | ((i >> 6) & 63)) << SHIFT[3 & r++])),
                (s[r >> 2] |= (128 | (63 & i)) << SHIFT[3 & r++]));
               (this.lastByteIndex = r),
 (this.bytes += r - this.start),
 64 <= r ?
 ((this.start = r - 64), this.hash(), (this.hashed = !0)) :
 (this.start = r);
     }
     return (
       4294967295 < this.bytes &&
       ((this.hBytes += (this.bytes / 4294967296) << 0),
        (this.bytes = this.bytes % 4294967296)),
             this
     );
   }
 };
 (Md5.prototype.finalize = function () {
   var t, e;
   this.finalized ||
   ((this.finalized = !0),
    ((t = this.blocks)[(e = this.lastByteIndex) >> 2] |= EXTRA[3 & e]),
    56 <= e &&
    (this.hashed || this.hash(),
     (t[0] = t[16]),
     (t[16] =
     t[1] =
     t[2] =
     t[3] =
     t[4] =
     t[5] =
     t[6] =
     t[7] =
     t[8] =
     t[9] =
     t[10] =
     t[11] =
     t[12] =
     t[13] =
     t[14] =
     t[15] =
     0)),
    (t[14] = this.bytes << 3),
    (t[15] = (this.hBytes << 3) | (this.bytes >>> 29)),
    this.hash());
 }),
 (Md5.prototype.hash = function () {
   var t,
   e,
   n,
   i,
   r,
   o = this.blocks,
   a = this.first ?
   ((((a =
   ((t =
   ((((t = o[0] - 680876937) << 7) | (t >>> 25)) - 271733879) <<
   0) ^
   ((e =
   ((((e =
   (-271733879 ^
   ((n =
   ((((n =
   (-1732584194 ^ (2004318071 & t)) +
   o[1] -
   117830708) <<
   12) |
   (n >>> 20)) +
   t) <<
   0) &
   (-271733879 ^ t))) +
   o[2] -
   1126478375) <<
   17) |
   (e >>> 15)) +
   n) <<
   0) &
   (n ^ t))) +
   o[3] -
   1316259209) <<
   22) |
   (a >>> 10)) +
   e) <<
   0 :
   ((t = this.h0),
    (a = this.h1),
    (e = this.h2),
    ((((a +=
    ((t =
    ((((t +=
    ((n = this.h3) ^ (a & (e ^ n))) + o[0] - 680876936) <<
    7) |
    (t >>> 25)) +
    a) <<
    0) ^
    ((e =
    ((((e +=
    (a ^
    ((n =
    ((((n += (e ^ (t & (a ^ e))) + o[1] - 389564586) <<
    12) |
    (n >>> 20)) +
    t) <<
    0) &
    (t ^ a))) +
    o[2] +
    606105819) <<
    17) |
    (e >>> 15)) +
    n) <<
    0) &
    (n ^ t))) +
    o[3] -
    1044525330) <<
    22) |
    (a >>> 10)) +
    e) <<
    0);
   (a =
   ((((a +=
   ((t =
   ((((t += (n ^ (a & (e ^ n))) + o[4] - 176418897) << 7) |
   (t >>> 25)) +
   a) <<
   0) ^
   ((e =
   ((((e +=
   (a ^
   ((n =
   ((((n += (e ^ (t & (a ^ e))) + o[5] + 1200080426) << 12) |
   (n >>> 20)) +
   t) <<
   0) &
   (t ^ a))) +
   o[6] -
   1473231341) <<
   17) |
   (e >>> 15)) +
   n) <<
   0) &
   (n ^ t))) +
   o[7] -
   45705983) <<
   22) |
   (a >>> 10)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((t =
   ((((t += (n ^ (a & (e ^ n))) + o[8] + 1770035416) << 7) |
   (t >>> 25)) +
   a) <<
   0) ^
   ((e =
   ((((e +=
   (a ^
   ((n =
   ((((n += (e ^ (t & (a ^ e))) + o[9] - 1958414417) <<
   12) |
   (n >>> 20)) +
   t) <<
   0) &
   (t ^ a))) +
   o[10] -
   42063) <<
   17) |
   (e >>> 15)) +
   n) <<
   0) &
   (n ^ t))) +
   o[11] -
   1990404162) <<
   22) |
   (a >>> 10)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((t =
   ((((t += (n ^ (a & (e ^ n))) + o[12] + 1804603682) << 7) |
   (t >>> 25)) +
   a) <<
   0) ^
   ((e =
   ((((e +=
   (a ^
   ((n =
   ((((n += (e ^ (t & (a ^ e))) + o[13] - 40341101) <<
   12) |
   (n >>> 20)) +
   t) <<
   0) &
   (t ^ a))) +
   o[14] -
   1502002290) <<
   17) |
   (e >>> 15)) +
   n) <<
   0) &
   (n ^ t))) +
   o[15] +
   1236535329) <<
   22) |
   (a >>> 10)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   (e &
   ((t =
   ((((t += (e ^ (n & (a ^ e))) + o[1] - 165796510) << 5) |
   (t >>> 27)) +
   a) <<
   0) ^
   a))) +
   o[6] -
   1069501632) <<
   9) |
   (n >>> 23)) +
   t) <<
   0) ^
   (t &
   ((e =
   ((((e += (t ^ (a & (n ^ t))) + o[11] + 643717713) << 14) |
   (e >>> 18)) +
   n) <<
   0) ^
   n))) +
   o[0] -
   373897302) <<
   20) |
   (a >>> 12)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   (e &
   ((t =
   ((((t += (e ^ (n & (a ^ e))) + o[5] - 701558691) << 5) |
   (t >>> 27)) +
   a) <<
   0) ^
   a))) +
   o[10] +
   38016083) <<
   9) |
   (n >>> 23)) +
   t) <<
   0) ^
   (t &
   ((e =
   ((((e += (t ^ (a & (n ^ t))) + o[15] - 660478335) << 14) |
   (e >>> 18)) +
   n) <<
   0) ^
   n))) +
   o[4] -
   405537848) <<
   20) |
   (a >>> 12)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   (e &
   ((t =
   ((((t += (e ^ (n & (a ^ e))) + o[9] + 568446438) << 5) |
   (t >>> 27)) +
   a) <<
   0) ^
   a))) +
   o[14] -
   1019803690) <<
   9) |
   (n >>> 23)) +
   t) <<
   0) ^
   (t &
   ((e =
   ((((e += (t ^ (a & (n ^ t))) + o[3] - 187363961) << 14) |
   (e >>> 18)) +
   n) <<
   0) ^
   n))) +
   o[8] +
   1163531501) <<
   20) |
   (a >>> 12)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   (e &
   ((t =
   ((((t += (e ^ (n & (a ^ e))) + o[13] - 1444681467) <<
   5) |
   (t >>> 27)) +
   a) <<
   0) ^
   a))) +
   o[2] -
   51403784) <<
   9) |
   (n >>> 23)) +
   t) <<
   0) ^
   (t &
   ((e =
   ((((e += (t ^ (a & (n ^ t))) + o[7] + 1735328473) << 14) |
   (e >>> 18)) +
   n) <<
   0) ^
   n))) +
   o[12] -
   1926607734) <<
   20) |
   (a >>> 12)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((r =
   (n =
   ((((n +=
   ((i = a ^ e) ^
   (t =
   ((((t += (i ^ n) + o[5] - 378558) << 4) | (t >>> 28)) +
   a) <<
   0)) +
   o[8] -
   2022574463) <<
   11) |
   (n >>> 21)) +
   t) <<
   0) ^ t) ^
   (e =
   ((((e += (r ^ a) + o[11] + 1839030562) << 16) | (e >>> 16)) +
   n) <<
   0)) +
   o[14] -
   35309556) <<
   23) |
   (a >>> 9)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((r =
   (n =
   ((((n +=
   ((i = a ^ e) ^
   (t =
   ((((t += (i ^ n) + o[1] - 1530992060) << 4) |
   (t >>> 28)) +
   a) <<
   0)) +
   o[4] +
   1272893353) <<
   11) |
   (n >>> 21)) +
   t) <<
   0) ^ t) ^
   (e =
   ((((e += (r ^ a) + o[7] - 155497632) << 16) | (e >>> 16)) +
   n) <<
   0)) +
   o[10] -
   1094730640) <<
   23) |
   (a >>> 9)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((r =
   (n =
   ((((n +=
   ((i = a ^ e) ^
   (t =
   ((((t += (i ^ n) + o[13] + 681279174) << 4) |
   (t >>> 28)) +
   a) <<
   0)) +
   o[0] -
   358537222) <<
   11) |
   (n >>> 21)) +
   t) <<
   0) ^ t) ^
   (e =
   ((((e += (r ^ a) + o[3] - 722521979) << 16) | (e >>> 16)) +
   n) <<
   0)) +
   o[6] +
   76029189) <<
   23) |
   (a >>> 9)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((r =
   (n =
   ((((n +=
   ((i = a ^ e) ^
   (t =
   ((((t += (i ^ n) + o[9] - 640364487) << 4) |
   (t >>> 28)) +
   a) <<
   0)) +
   o[12] -
   421815835) <<
   11) |
   (n >>> 21)) +
   t) <<
   0) ^ t) ^
   (e =
   ((((e += (r ^ a) + o[15] + 530742520) << 16) | (e >>> 16)) +
   n) <<
   0)) +
   o[2] -
   995338651) <<
   23) |
   (a >>> 9)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   ((t =
   ((((t += (e ^ (a | ~n)) + o[0] - 198630844) << 6) |
   (t >>> 26)) +
   a) <<
   0) |
   ~e)) +
   o[7] +
   1126891415) <<
   10) |
   (n >>> 22)) +
   t) <<
   0) ^
   ((e =
   ((((e += (t ^ (n | ~a)) + o[14] - 1416354905) << 15) |
   (e >>> 17)) +
   n) <<
   0) |
   ~t)) +
   o[5] -
   57434055) <<
   21) |
   (a >>> 11)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   ((t =
   ((((t += (e ^ (a | ~n)) + o[12] + 1700485571) << 6) |
   (t >>> 26)) +
   a) <<
   0) |
   ~e)) +
   o[3] -
   1894986606) <<
   10) |
   (n >>> 22)) +
   t) <<
   0) ^
   ((e =
   ((((e += (t ^ (n | ~a)) + o[10] - 1051523) << 15) |
   (e >>> 17)) +
   n) <<
   0) |
   ~t)) +
   o[1] -
   2054922799) <<
   21) |
   (a >>> 11)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   ((t =
   ((((t += (e ^ (a | ~n)) + o[8] + 1873313359) << 6) |
   (t >>> 26)) +
   a) <<
   0) |
   ~e)) +
   o[15] -
   30611744) <<
   10) |
   (n >>> 22)) +
   t) <<
   0) ^
   ((e =
   ((((e += (t ^ (n | ~a)) + o[6] - 1560198380) << 15) |
   (e >>> 17)) +
   n) <<
   0) |
   ~t)) +
   o[13] +
   1309151649) <<
   21) |
   (a >>> 11)) +
   e) <<
   0),
   (a =
   ((((a +=
   ((n =
   ((((n +=
   (a ^
   ((t =
   ((((t += (e ^ (a | ~n)) + o[4] - 145523070) << 6) |
   (t >>> 26)) +
   a) <<
   0) |
   ~e)) +
   o[11] -
   1120210379) <<
   10) |
   (n >>> 22)) +
   t) <<
   0) ^
   ((e =
   ((((e += (t ^ (n | ~a)) + o[2] + 718787259) << 15) |
   (e >>> 17)) +
   n) <<
   0) |
   ~t)) +
   o[9] -
   343485551) <<
   21) |
   (a >>> 11)) +
   e) <<
   0),
   this.first ?
   ((this.h0 = (t + 1732584193) << 0),
    (this.h1 = (a - 271733879) << 0),
    (this.h2 = (e - 1732584194) << 0),
    (this.h3 = (n + 271733878) << 0),
    (this.first = !1)) :
    ((this.h0 = (this.h0 + t) << 0),
     (this.h1 = (this.h1 + a) << 0),
     (this.h2 = (this.h2 + e) << 0),
     (this.h3 = (this.h3 + n) << 0));
 }),
 (Md5.prototype.hex = function () {
   this.finalize();
   var t = this.h0,
   e = this.h1,
   n = this.h2,
   i = this.h3;
   return (
     HEX_CHARS[(t >> 4) & 15] +
     HEX_CHARS[15 & t] +
     HEX_CHARS[(t >> 12) & 15] +
     HEX_CHARS[(t >> 8) & 15] +
     HEX_CHARS[(t >> 20) & 15] +
     HEX_CHARS[(t >> 16) & 15] +
     HEX_CHARS[(t >> 28) & 15] +
     HEX_CHARS[(t >> 24) & 15] +
     HEX_CHARS[(e >> 4) & 15] +
     HEX_CHARS[15 & e] +
     HEX_CHARS[(e >> 12) & 15] +
     HEX_CHARS[(e >> 8) & 15] +
     HEX_CHARS[(e >> 20) & 15] +
     HEX_CHARS[(e >> 16) & 15] +
     HEX_CHARS[(e >> 28) & 15] +
     HEX_CHARS[(e >> 24) & 15] +
     HEX_CHARS[(n >> 4) & 15] +
     HEX_CHARS[15 & n] +
     HEX_CHARS[(n >> 12) & 15] +
     HEX_CHARS[(n >> 8) & 15] +
     HEX_CHARS[(n >> 20) & 15] +
     HEX_CHARS[(n >> 16) & 15] +
     HEX_CHARS[(n >> 28) & 15] +
     HEX_CHARS[(n >> 24) & 15] +
     HEX_CHARS[(i >> 4) & 15] +
     HEX_CHARS[15 & i] +
     HEX_CHARS[(i >> 12) & 15] +
     HEX_CHARS[(i >> 8) & 15] +
     HEX_CHARS[(i >> 20) & 15] +
     HEX_CHARS[(i >> 16) & 15] +
     HEX_CHARS[(i >> 28) & 15] +
     HEX_CHARS[(i >> 24) & 15]
   );
 }),
 (Md5.prototype.toString = Md5.prototype.hex),
 (Md5.prototype.digest = function () {
   this.finalize();
   var t = this.h0,
   e = this.h1,
   n = this.h2,
   i = this.h3;
   return [
     255 & t,
     (t >> 8) & 255,
  (t >> 16) & 255,
  (t >> 24) & 255,
  255 & e,
  (e >> 8) & 255,
  (e >> 16) & 255,
  (e >> 24) & 255,
  255 & n,
  (n >> 8) & 255,
  (n >> 16) & 255,
  (n >> 24) & 255,
  255 & i,
  (i >> 8) & 255,
  (i >> 16) & 255,
  (i >> 24) & 255,
   ];
 }),
 (Md5.prototype.array = Md5.prototype.digest),
 (Md5.prototype.arrayBuffer = function () {
   this.finalize();
   var t = new ArrayBuffer(16),
  e = new Uint32Array(t);
  return (
    (e[0] = this.h0),
          (e[1] = this.h1),
          (e[2] = this.h2),
          (e[3] = this.h3),
          t
  );
 }),
 (Md5.prototype.buffer = Md5.prototype.arrayBuffer),
 (Md5.prototype.base64 = function () {
   for (var t, e, n, i = "", r = this.array(), o = 0; o < 15;)
     (t = r[o++]),
  (e = r[o++]),
  (n = r[o++]),
  (i +=
  BASE64_ENCODE_CHAR[t >>> 2] +
  BASE64_ENCODE_CHAR[63 & ((t << 4) | (e >>> 4))] +
  BASE64_ENCODE_CHAR[63 & ((e << 2) | (n >>> 6))] +
  BASE64_ENCODE_CHAR[63 & n]);
  return (
    (t = r[o]),
          i +
          (BASE64_ENCODE_CHAR[t >>> 2] +
          BASE64_ENCODE_CHAR[(t << 4) & 63] +
          "==")
  );
 });

 // let cur_url = window.location.href.split('?')
 // var id = cur_url[1];
 // var token = document.cookie.split('token=')[1].split(';')[0]
 // var timestamp=Math.floor(Date.now() / 1000);
 // var companyId=window.localStorage.getItem("companyId") || 0
 // var organizationId=window.localStorage.getItem("organizationId") || 0
 // var from='WEB'
 // var randomStr= randomStrFuc()
 var publicKey =
 "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAooxomrujIP9vcxxNmS+Q1xxnaoxAfluwFvDR3+G+p84QMsePXDD67cLjJ+7n+79u2xoG7fVvDnzHDW+X5D/0/Dv9ajUaBpFQl3jqKwRiP3Lrx08seYzWIWDGHEjurbZrWGHRJNdoM7tEQPdPZftZC6iOm7kSjDIDiuqaIh9g3hqFSVQ5r15Dvae6qtREo1nDWKsf3tH6nkvVD2pIh3TBJUoGdfbPqnw/tNvzhwOX9tg7NjhZ8Yet1ctVt297G5HCwPSIBjhUKEtLYLk/8scPrzXnQpAU05m5WnHfDhfvvG2xoVXckveNvZhv6lvxTZqRkUBOI1pU16U9Tz4aDpCU7QIDAQAB";
 //加密参数并序列化、字符串化参数
 //返回对象，包含字符串参数和sign

 /**
  * 最重要的地方，破解sign参数
  * @param {*} e
  * @param {*} smp
  * @returns
  */
 //加密参数，返回包装数据，便于在接口中直接调用
 function encryptData(e, smp = true) {
   var t,
 c = "",
 r = Object.keys(e).sort();
 for (t in r) {
   var o = e[r[t]];
   null != o && (c += r[t] + "=" + o + "&");
 }
 if (smp) {
   console.log("字符串参数: " + c);
 }
 var key_md5 = new Md5(!0).update(c)["hex"]();
 if (smp) {
   console.log("key_md5: " + key_md5);
 }
 return { serString: c, sign: encodeURIComponent(encrypt(key_md5, smp)) };
 }
 //加密，获得sign
 function encrypt(key, smp = true) {
   var rsa = new JSEncrypt();
   rsa.setPublicKey(publicKey);
   var encryptedData = rsa.encrypt(key);
   if (smp) {
     console.log("sign: " + encryptedData);
   }
   return encryptedData;
 }
 //接口用参数（由 UI 初始化时填充）
 var topicParams = {};
 //接口列表
 var url = {
   courseList: "https://campus.chinaunicom.cn/training/app/themeColumn/getMyAreaInfoCourse",
 courseInfo: "https://campus.chinaunicom.cn/training/app/course/info",
 studyCourse: "https://campus.chinaunicom.cn/training/app/course/playtimeV2",
 };

 var cList = []; //展示框课程
 var allCount; //待刷课程树总数，用于进度条展示
 /**
  * @description: 统计信息，获取总数，用于进度条
  * @return {*}
  */
 async function statistics() {
   let count = 0;
   for (let ll of cList) {
     await getCourseInfo(ll.id, false).then((v) => {
       ll.child = v || [];
       count += ll.child.length;
     });
   }
   return count;
 }
 /**
  * @description: 开始按钮事件处理函数
  * @return {*}
  */
  // ========== 共享可调参数 — 在此修改 ==========
  var P_BATCH_SIZE = 5;           // 每批并发数（同一时刻最多发几个视频的请求）
  var P_INTER_BATCH_MS = 1000;    // 批次间间隔（毫秒），并发策略每批发完后暂停；激进策略每个batch错峰启动间隔
  var P_ROUND_SLEEP_MS = 32000;   // 【并发策略用】轮次冷却（毫秒），所有视频各发一次后等待多久
  var P_BATCH_COOLDOWN_MS = 32000; // 【激进策略用】batch自身冷却（毫秒），本批发完后等多久再发
  var P_MAX_STUDY = 179;          // 单次最大学习时长（秒），超过此值服务端拒绝
  var P_MAX_RETRIES = 5;          // 单个视频最多失败的轮次数（跨轮重试上限）
  var P_RETRY_PER_REQ = 1;        // 单次请求失败后的网络重试次数（传给useGMxmlhttpRequest）
  // ===============================================

  // ================== 模式一：非并发（原版逐章串行） ==================
  async function beginSerial(list, aCount) {
    setProgress(0);

    let llList = 0;
    for (let ll of list) {
      let courseId = ll.id;
      for (let kk of ll.child) {
        llList++;
        kk.courseId = courseId;
        console.log("[非并发] 正在处理 kpointId：" + kk.id);
        const sleepTimeInput = document.getElementById("sleeptime");
        const sleepDuration = sleepTimeInput ? sleepTimeInput.value * 1000 : 1000;
        await sleep(sleepDuration);
        let pgr = Math.round((llList / aCount) * 100);
        let v = await studyCourse(kk, pgr);
        if (v == 0) return 0;
        setProgress(pgr);
      }
    }
    return 1;
  }

  // ================== 模式二：并发策略（全局轮次并行） ==================
  async function beginConcurrent(list, aCount) {
    setProgress(0);

    var tasks = flattenCourseList(list);
    var totalTasks = tasks.length;
    if (totalTasks === 0) {
      showLog("所有任务已完成，无需处理", "green", false);
      return 1;
    }
    console.log("[并发策略] 共 " + totalTasks + " 个视频待处理 (批大小=" + P_BATCH_SIZE + ", 批间隔=" + P_INTER_BATCH_MS + "ms, 轮间隔=" + P_ROUND_SLEEP_MS + "ms)");

    var round = 0;
    var active = tasks.slice();

    while (active.length > 0) {
      round++;
      var pending = active.filter(function (t) { return t.failCount < P_MAX_RETRIES; });
      if (pending.length === 0) break;

      console.log("[并发策略] 第 " + round + " 轮, " + pending.length + " 个视频待发");

      for (var i = 0; i < pending.length; i += P_BATCH_SIZE) {
        var batch = pending.slice(i, i + P_BATCH_SIZE);
        if (P_INTER_BATCH_MS > 0) await sleep(P_INTER_BATCH_MS);

        await Promise.allSettled(batch.map(function (task) {
          var thisRoundTime;
          if (task.totalTime - task.accumulatedTime > P_MAX_STUDY) {
            thisRoundTime = P_MAX_STUDY;
          } else {
            thisRoundTime = task.totalTime - task.accumulatedTime;
          }
          var newAccumulated = task.accumulatedTime + thisRoundTime;
          return sendOneRequest(task, newAccumulated);
        }));
      }

      for (var j = active.length - 1; j >= 0; j--) {
        if (active[j].done || active[j].failCount >= P_MAX_RETRIES) {
          active.splice(j, 1);
        }
      }

      var doneCount = totalTasks - active.length;
      var pgr = Math.round((doneCount / totalTasks) * 100);
      setProgress(pgr);
      showLog("[并发] 第 " + round + " 轮: " + doneCount + "/" + totalTasks + " 已完成", "blue", true);

      if (active.length > 0) {
        await sleep(P_ROUND_SLEEP_MS);
      }
    }

    showLog("并发策略完成: " + totalTasks + " 个视频处理完毕", "green", false);
    return 1;
  }

  // ================== 模式三：激进并行（每batch独立冷却周期） ==================
  async function beginAggressive(list, aCount) {
    setProgress(0);

    var tasks = flattenCourseList(list);
    var totalTasks = tasks.length;
    if (totalTasks === 0) {
      showLog("所有任务已完成，无需处理", "green", false);
      return 1;
    }

    var batches = [];
    for (var i = 0; i < tasks.length; i += P_BATCH_SIZE) {
      batches.push(tasks.slice(i, i + P_BATCH_SIZE));
    }

    console.log("[激进并行] 共 " + totalTasks + " 个视频, 拆成 " + batches.length + " 个批次 (批大小=" + P_BATCH_SIZE + ", 启动间隔=" + P_INTER_BATCH_MS + "ms, 冷却=" + P_BATCH_COOLDOWN_MS + "ms)");

    function updateProgress() {
      var done = tasks.filter(function (t) { return t.done || t.failCount >= P_MAX_RETRIES; }).length;
      var pgr = Math.round((done / totalTasks) * 100);
      setProgress(pgr);
      showLog(done + "/" + totalTasks + " 已完成", "blue", true);
    }

    var workers = batches.map(function (batch, batchIndex) {
      return (async function () {
        await sleep(batchIndex * P_INTER_BATCH_MS);

        var round = 0;
        var label = "[Batch" + (batchIndex + 1) + "]";

        while (true) {
          var pending = batch.filter(function (t) {
            return !t.done && t.failCount < P_MAX_RETRIES;
          });
          if (pending.length === 0) break;

          round++;
          console.log(label + " 第" + round + "轮, " + pending.length + "个视频");
          var roundStartTime = Date.now();

          await Promise.allSettled(pending.map(function (task) {
            var thisRoundTime;
            if (task.totalTime - task.accumulatedTime > P_MAX_STUDY) {
              thisRoundTime = P_MAX_STUDY;
            } else {
              thisRoundTime = task.totalTime - task.accumulatedTime;
            }
            var newAccumulated = task.accumulatedTime + thisRoundTime;
            return sendOneRequest(task, newAccumulated);
          }));

          updateProgress();

          var remaining = batch.filter(function (t) {
            return !t.done && t.failCount < P_MAX_RETRIES;
          });
          if (remaining.length === 0) break;

          var elapsed = Date.now() - roundStartTime;
          var waitMs = P_BATCH_COOLDOWN_MS - elapsed;
          if (waitMs < 0) waitMs = 0;
          console.log(label + " 本轮耗时 " + (elapsed / 1000).toFixed(1) + "s, 等待 " + (waitMs / 1000).toFixed(1) + "s 后进入第" + (round + 1) + "轮");
          await sleep(waitMs);
        }
      })();
    });

    await Promise.all(workers);

    var finalDone = tasks.filter(function (t) { return t.done; }).length;
    var finalFailed = tasks.filter(function (t) { return !t.done && t.failCount >= P_MAX_RETRIES; }).length;
    showLog("激进并行完成: 成功" + finalDone + " 失败" + finalFailed, "green", false);
    return 1;
  }

  // ================== 共用辅助函数 ==================

  function flattenCourseList(list) {
    var tasks = [];
    for (var ci = 0; ci < list.length; ci++) {
      var course = list[ci];
      for (var ki = 0; ki < course.child.length; ki++) {
        var kk = course.child[ki];
        var subVideos = (kk.childKpointList && kk.childKpointList.length > 0) ? kk.childKpointList : [kk];
        for (var vi = 0; vi < subVideos.length; vi++) {
          var video = subVideos[vi];
          var totalTime = parseTimeString(video.time) || 0;
          if (totalTime <= 0) continue;
          if ((parseInt(video.progress) || 0) >= 100) continue;
          tasks.push({
            courseId: course.id,
            kpointId: video.id,
            name: video.name || ("kpoint_" + video.id),
            accumulatedTime: parseInt(video.userPlayTime) || 0,
            totalTime: totalTime,
            done: false,
            failCount: 0,
          });
        }
      }
    }
    return tasks;
  }

  function sendOneRequest(task, newAccumulated) {
    var study = {
      accrualType: 0,
      token: document.cookie.split("token=")[1].split(";")[0],
      timestamp: Math.floor(Date.now() / 1000),
      companyId: window.localStorage.getItem("companyId") || 0,
      from: "WEB",
      organizationId: window.localStorage.getItem("organizationId") || 0,
      randomStr: randomStrFuc(),
      type: "playback",
      kpointId: task.kpointId,
      courseId: task.courseId,
      breakpoint: newAccumulated,
      studyTime: newAccumulated,
    };

    return useGMxmlhttpRequest(url.studyCourse, encryptData(study), P_RETRY_PER_REQ)
      .then(function (res) {
        task.accumulatedTime = newAccumulated;
        if (res.entity === 100 || task.accumulatedTime >= task.totalTime) {
          task.done = true;
          console.log("  ✓ [" + task.name + "] 完成 (" + task.accumulatedTime + "s/" + task.totalTime + "s)");
        } else {
          console.log("  → [" + task.name + "] " + task.accumulatedTime + "s/" + task.totalTime + "s" + (res.entity ? " (entity=" + res.entity + ")" : ""));
        }
      })
      .catch(function (err) {
        task.failCount++;
        console.error("  ✗ [" + task.name + "] 失败(" + task.failCount + "/" + P_MAX_RETRIES + "): " + err.message);
      });
  }
 /**
  * @description: 更新课程列表（按当前参数重新拉取）
  * @return {*}
  */
 async function update() {
   setProgress(0);
   showLog("正在获取课程列表，请稍等…", "blue", true);
   await detectAndFillPage();
   topicParams = buildTopicParams();
   var v = await getData(url, topicParams);
   if (!v || v === 0) {
     showLog("课程列表更新失败，请检查专栏ID后重试", "red", false);
     return;
   }
   cList = v;
   allCount = await statistics();
   if (allCount > 0) {
     showLog("课程列表已更新，可以开始刷课", "green", false);
   } else {
     showLog("没有获取到可刷章节，请检查专栏ID", "red", false);
   }
 }
 /**
  * @description: 获取当前专栏课程信息，并展示的展示框
  * @param {*} time
  * @return {*}
  */
 async function getData(url, e) {
    try {
      // 1. 请求首页8门，获取总课程数
      var firstParams = {
        token: e.token,
        timestamp: Math.floor(Date.now() / 1000),
        companyId: e.companyId,
        from: e.from,
        organizationId: e.organizationId,
        randomStr: randomStrFuc(),
        id: e.id,
        subjectId: e.subjectId || "",
        status: e.status,
        name: e.name || "",
        currentPage: 1,
        pageSize: API_PAGE_SIZE,
        total: 0,
      };
      var firstResult = await request(url.courseList, encryptData(firstParams));
      var totalCount = firstResult.entity.page.totalResultSize;
      document.getElementById("c-total").innerText = totalCount;
      console.log("[getData] 专栏共 " + totalCount + " 门课程");

      // 2. 用户请求的范围（0-based索引）
      var userPage = parseInt(e.currentPage) || 1;
      var userSize = parseInt(e.pageSize) || 8;
      var startIndex = (userPage - 1) * userSize;
      var endIndex = startIndex + userSize;

      // 超出总课程数：显示空
      if (startIndex >= totalCount) {
        document.getElementById("ul").innerHTML = '<li><text style="color:#a5860f;">已超出总课程数（共' + totalCount + '门）</text></li>';
        return [];
      }
      endIndex = Math.min(endIndex, totalCount);

      // 3. 需要请求的API页（1-based）
      var firstApiPage = Math.floor(startIndex / API_PAGE_SIZE) + 1;
      var lastApiPage  = Math.ceil(endIndex / API_PAGE_SIZE);
      console.log("[getData] 用户: 第" + userPage + "页×" + userSize + "门 → 课程" + (startIndex+1) + "-" + endIndex + " | API页: " + firstApiPage + "-" + lastApiPage);

      // 4. 收集所有需要请求的页面（第1页已拿到，跳过）
      var remainingPages = [];
      for (var r = firstApiPage; r <= lastApiPage; r++) {
        if (r !== 1) remainingPages.push(r);
      }

      // 按 P_BATCH_SIZE 分批并发请求
      var remainingResults = [];
      for (var j = 0; j < remainingPages.length; j += P_BATCH_SIZE) {
        var batch = remainingPages.slice(j, j + P_BATCH_SIZE);
        var batchPromises = [];
        for (var b = 0; b < batch.length; b++) {
          (function (page) {
            var params = {
              token: e.token,
              timestamp: Math.floor(Date.now() / 1000),
              companyId: e.companyId,
              from: e.from,
              organizationId: e.organizationId,
              randomStr: randomStrFuc(),
              id: e.id,
              subjectId: e.subjectId || "",
              status: e.status,
              name: e.name || "",
              currentPage: page,
              pageSize: API_PAGE_SIZE,
              total: 0,
            };
            batchPromises.push(request(url.courseList, encryptData(params)));
          })(batch[b]);
        }
        var batchResults = await Promise.all(batchPromises);
        for (var bb = 0; bb < batchResults.length; bb++) {
          remainingResults.push(batchResults[bb]);
        }
      }

      // 5. 按页码顺序合并所有结果
      var orderedResults = {};
      orderedResults[1] = firstResult;
      for (var k = 0; k < remainingPages.length; k++) {
        orderedResults[remainingPages[k]] = remainingResults[k];
      }

      var allCourses = [];
      for (var pg = firstApiPage; pg <= lastApiPage; pg++) {
        var pgResult = orderedResults[pg];
        if (!pgResult) continue;
        var pgCourses = pgResult.entity.courseList;
        for (var ci = 0; ci < pgCourses.length; ci++) {
          allCourses.push(pgCourses[ci]);
        }
      }

      // 6. 切片到用户请求的范围
      var offsetInCombined = startIndex - (firstApiPage - 1) * API_PAGE_SIZE;
      var slicedCourses = allCourses.slice(offsetInCombined, offsetInCombined + userSize);

      // 7. 渲染列表
      var li = "";
      for (var si = 0; si < slicedCourses.length; si++) {
        var ii = slicedCourses[si];
        // 默认只勾选未学完的课程（进度未满 100%）
        li += '<li>' +
          '<input type="checkbox" class="course-checkbox" data-course-id="' + ii.id + '"' +
          (isUnfinished(ii) ? ' checked' : '') + '>' +
          '<span title="' + ii.name + '">' +
          '已看：' + ((ii.playTime / ii.totalPlayTime) * 100).toFixed(2) + '%  ' + ii.name +
          '</span></li>';
      }
      document.getElementById("ul").innerHTML = li || '<li class="ldx-hint">本页没有课程，请调整“当前页”或点“更新课程”</li>';
      updateSelectedCount();
      console.log("[getData] 显示了 " + slicedCourses.length + " 门课程 (总" + totalCount + "门)");
      return slicedCourses;

    } catch (error) {
      console.error(error);
      showLog(error.message + "---请刷新页面重试---持续出现，请反馈！", "red", false);
      return 0;
    }
  }
 async function sleep(time) {
   console.log("睡眠" + time / 1000 + "s");
   if (time < 1000) time = 1000;
   return await new Promise((resolve) => setTimeout(resolve, time));
 }
 //
 /**
  * @description: 获取单个课程信息
  * @param {*} id
  * @return {*}
  */
 async function getCourseInfo(id, smp = true) {
   var signleCourse = {
     token: document.cookie.split("token=")[1].split(";")[0],
 timestamp: Math.floor(Date.now() / 1000),
 companyId: window.localStorage.getItem("companyId") || 0,
 from: "WEB",
 organizationId: window.localStorage.getItem("organizationId") || 0,
 randomStr: randomStrFuc(),
 courseId: id,
   };
   var courseInfo;
   let data;
   //发送请求
   try {
     data = await request(
       url.courseInfo,
       encryptData(signleCourse, smp),
                          smp
     );
     if (smp) {
       console.log(data.entity.kpointList); // 这里打印获取的数据
     }
     courseInfo = data.entity.kpointList;
   } catch (err) {
     console.error(err);
     showLog(
       err.message + "---请刷新页面重试---持续出现，请反馈！",
       "red",
       false
     );
     return 0;
   }
   return courseInfo;
 }

 //更改课程学习时间
 async function studyCourse(courseNode, pgr = 0) {
   try {
     // 首先确定需要处理的视频列表。
     // 如果courseNode有childKpointList，则处理该列表；否则，创建一个只包含courseNode自身的列表。
     const videosToProcess = (courseNode.childKpointList && courseNode.childKpointList.length > 0) ?
     courseNode.childKpointList :
     [courseNode];

     if (videosToProcess.length > 1) {
       console.log(`课程节点 "${courseNode.name}" 包含 ${videosToProcess.length} 个子视频，将逐个处理...`);
     }

     // 父节点 courseNode 始终包含正确的 courseId。
     const parentCourseId = courseNode.courseId;

     // 遍历所有需要处理的视频。
     for (const videoNode of videosToProcess) {
       let maxStudyTime = 180; // 每次最大学习时长（秒）
       let singleStudyTime = maxStudyTime - 1; // 设置为99秒
       let courseTotalTime = parseTimeString(videoNode.time) || 0;

       // 如果视频总时长为0，则跳过此视频。
       if (courseTotalTime <= 0) {
         console.log(`跳过视频 "${videoNode.name}" (ID: ${videoNode.id})，因为其时长为0。`);
         continue; // 继续处理下一个视频
       }

       // 检查已学进度，跳过已完成或从断点继续
       const alreadyDone = parseInt(videoNode.progress) || 0;
       const alreadySeconds = parseInt(videoNode.userPlayTime) || 0;
       if (alreadyDone >= 100) {
         console.log(`跳过视频 "${videoNode.name}" (ID: ${videoNode.id})，已完成 ${alreadyDone}%。`);
         continue;
       }
       let courseTimeCache = alreadyDone > 0 ? alreadySeconds : 0;
       if (courseTimeCache >= courseTotalTime) {
         console.log(`跳过视频 "${videoNode.name}"，已学时长已达到总时长。`);
         continue;
       }
       if (courseTimeCache > 0) {
         console.log(`视频 "${videoNode.name}" 已学 ${alreadyDone}% (${courseTimeCache}s/${courseTotalTime}s)，从断点继续。`);
       }


       var study = {
         accrualType: 0,
 token: document.cookie.split("token=")[1].split(";")[0],
 timestamp: Math.floor(Date.now() / 1000),
 companyId: window.localStorage.getItem("companyId") || 0,
 from: "WEB",
 organizationId: window.localStorage.getItem("organizationId") || 0,
 randomStr: randomStrFuc(),
 type: "playback",
 kpointId: videoNode.id, // 使用当前视频的ID
 courseId: parentCourseId, // 使用父课程的ID
 breakpoint: 0,
 studyTime: 0,
       };
       console.log(`正在处理视频: "${videoNode.name}", 总时长: ${courseTotalTime}s`);
       do {
         // 累加学习时间，直到达到总时长
         if (courseTotalTime - courseTimeCache > singleStudyTime) {
           courseTimeCache += singleStudyTime;
         } else {
           courseTimeCache = courseTotalTime; // 到达最后一部分，直接设置为总时长
         }
         study.breakpoint = courseTimeCache;
         study.studyTime = courseTimeCache; // studyTime 是累积学习时长
         console.log("循环任务, 发送累计学习时长: ", study.studyTime);
         study.randomStr = randomStrFuc();
         study.timestamp = Math.floor(Date.now() / 1000);
         let res = await useGMxmlhttpRequest(
           url.studyCourse,
           encryptData(study)
         );
         await sleep(32000);

         // 如果API返回100（表示完成），则提前结束循环。
         if (res.entity === 100) {
           console.log(`视频 "${videoNode.name}" 已完成 (API报告100%)。`);
           break;
         }

         // 脚本原有的复杂进度条逻辑已移除，由外部的 begin 函数在调用后统一更新。

       } while (courseTimeCache < courseTotalTime);
       // 如果一个课程节点包含多个视频，在处理完一个后稍作等待。
       if (videosToProcess.length > 1) {
         const sleepTimeInput = document.getElementById("sleeptime");
         const sleepDuration = sleepTimeInput ? sleepTimeInput.value * 1000 : 1000;
         await sleep(sleepDuration || 1000);
       }
     } // 视频遍历结束

     return 1; // 表示整个 courseNode (包括其所有子视频) 都成功处理

   } catch (err) {
     showLog(
       err.message + "---请刷新页面重试---持续出现，请反馈！",
       "red",
       false
     );
     return 0; // 表示处理失败
   }
 }
 async function request(url, e, smp = true) {
   if (smp) {
     console.log("正在发送请求->url:" + url);
   }
   return fetch(url + "?" + e.serString + "sign=" + e.sign, {
     headers: {
       accept: "application/json, text/plain, */*",
       "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
       "content-type": "application/x-www-form-urlencoded",
       "sec-ch-ua": '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
     },
     referrer: "https://m.campus.chinaunicom.cn/",
     referrerPolicy: "strict-origin-when-cross-origin",
     body: "",
     method: "POST",
     mode: "cors",
     credentials: "omit",
   }).then(async (v) => {
     v = await v.json();
     if (v.success && v.code == 200) {
       return v;
     } else {
       throw Error("请求错误！" + v.message);
     }
   });
 }

 async function useGMxmlhttpRequest(url, e, retries) {
    if (retries === undefined) retries = 0;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        url: url + "?" + e.serString + "sign=" + e.sign,
        method: "POST",
        timeout: 30000,
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,zh-CN;q=0.7,en;q=0.3",
          "accept-Encoding": "gzip, deflate, br, zstd",
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="136", "Google Chrome";v="136"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          host: "campus.chinaunicom.cn",
          origin: "https://campus.chinaunicom.cn",
          referer: "https://campus.chinaunicom.cn/training/pc/curriculum.html",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.48 Safari/537.36",
        },
        onload: function (res) {
          try {
            var obj = JSON.parse(res.response);
            if (obj.success && obj.code == 200) {
              resolve(obj);
            } else {
              reject(new Error(obj.message || ("code=" + obj.code)));
            }
          } catch (e) {
            reject(new Error("JSON解析失败: " + e.message));
          }
        },
        onerror: function (err) {
          if (retries > 0) {
            console.warn("[网络请求失败] 剩余重试 " + retries + " 次: " + err);
            resolve(useGMxmlhttpRequest(url, e, retries - 1));
          } else {
            reject(new Error("网络请求失败: " + (err.message || err)));
          }
        },
        ontimeout: function () {
          if (retries > 0) {
            console.warn("[请求超时] 剩余重试 " + retries + " 次");
            resolve(useGMxmlhttpRequest(url, e, retries - 1));
          } else {
            reject(new Error("请求超时"));
          }
        },
      });
    });
  }

 function parseTimeString(timeStr) {
   // 如果输入为空或无效，直接返回0
   if (!timeStr) {
     return 0;
   }

   // 检查输入是否为纯数字（视为秒）
   if (!isNaN(timeStr) && !isNaN(parseFloat(timeStr))) {
     return parseInt(timeStr, 10);
   }

   let totalSeconds = 0;
   // 正则表达式，用于匹配并捕获小时、分钟和秒的数字
   // (?:(\d+)\s*小时)? 表示小时部分是可选的
   // (?:(\d+)\s*分)? 表示分钟部分是可选的
   // (?:(\d+)\s*秒)? 表示秒部分是可选的
   const regex = /(?:(\d+)\s*小时)?(?:(\d+)\s*分)?(?:(\d+)\s*秒)?/;
   const matches = timeStr.match(regex);

   if (matches) {
     // matches[1] 对应小时的数字，如果不存在则为 undefined
     const hours = parseInt(matches[1]) || 0;
     // matches[2] 对应分钟的数字
     const minutes = parseInt(matches[2]) || 0;
     // matches[3] 对应秒的数字
     const seconds = parseInt(matches[3]) || 0;

     totalSeconds = hours * 3600 + minutes * 60 + seconds;
   }

   return totalSeconds;
 }

 // [修改点]: 使用更稳定的方法来启动脚本
 if (document.readyState === "loading") {
   // 页面仍在加载，监听事件
   document.addEventListener("DOMContentLoaded", initializeScript);
 } else {
   // DOM 已加载，直接执行
   initializeScript();
 }
 // 网站是 hash 路由，切换专栏/课程时 hash 变化不会重新加载页面，需重新判断
 window.addEventListener("hashchange", initializeScript);
})();
