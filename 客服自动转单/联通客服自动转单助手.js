// ==UserScript==
// @name         联通客服自动转单助手
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  自动登录联通客服热线系统，支持Cookie隔离、湖北分公司自动选择、验证码本地OCR识别、多账号轮询
// @author       You
// @match        http://xx.xkf.unicom.local/cs/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_cookie
// @grant        GM_notification
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// ==/UserScript==

(function () {
  "use strict";

  // === 禁用页面的开发者工具检测(disableDevtool.js),允许打开 devtool 调试 ===
  // 必须在 document-start 时尽早执行,在 disableDevtool.js 加载前生效
  (function disableDevtoolBypass() {
    // 方法1: 用 getter/setter 劫持 window.disableDevtool
    // 读取时返回空函数,赋值时被忽略,使 disableDevtool.js 无法初始化检测
    try {
      Object.defineProperty(window, "disableDevtool", {
        get: function () {
          return function () {
            console.log("[联通客服助手] 已拦截 disableDevtool 初始化调用");
            return false;
          };
        },
        set: function () {
          console.log("[联通客服助手] 已阻止 disableDevtool 注册");
        },
        configurable: false,
      });
    } catch (e) {
      // 降级:直接赋值(可能被覆盖,但聊胜于无)
      window.disableDevtool = function () {
        return false;
      };
    }

    // 方法2: 移除 disableDevtool.js 脚本标签,阻止其加载执行
    const removeDisableDevtoolScripts = () => {
      document
        .querySelectorAll('script[src*="disableDevtool"]')
        .forEach((s) => {
          s.remove();
          console.log("[联通客服助手] 已移除 disableDevtool.js 脚本标签");
        });
    };

    // 监听 DOM 变化,拦截动态添加的 disableDevtool 脚本(如 require.js 动态加载)
    try {
      const observer = new MutationObserver(() => {
        removeDisableDevtoolScripts();
      });
      if (document.documentElement) {
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      }
    } catch (e) {}

    // DOMContentLoaded 后再清理一次
    document.addEventListener("DOMContentLoaded", () => {
      removeDisableDevtoolScripts();
    });
  })();

  const STORAGE_KEY = "unicom_accounts_v2";
  const LOG_KEY = "unicom_logs_v2";
  const COOKIE_KEY_PREFIX = "unicom_cookie_";
  const COMPANY_NAME = "湖北分公司";
  const COMPANY_ID = "71";
  // OCR 识别配置
  const MAX_OCR_ATTEMPTS = 3; // 本地 OCR 最多尝试次数
  const OCR_CHAR_WHITELIST = "0123456789"; // 验证码白名单：纯数字
  const CAPTCHA_LENGTH = 4; // 验证码预期长度

  let accounts = [];
  let logs = [];
  let currentAccountIndex = 0;
  let isRunning = false;
  let floatPanel = null;
  let captchaResolver = null;
  let tesseractWorker = null;
  let panelHiddenBySmsObserver = false; // 标记是否由短信弹窗 Observer 隐藏面板
  let globalLastClickedConfirmId = ""; // 全局兜底定时器中避免重复点击的记录

  function init() {
    loadAccounts();
    loadLogs();
    createFloatPanel();
    GM_registerMenuCommand("管理账号", showAccountManager);
    GM_registerMenuCommand("清空所有Cookie", clearAllCookies);

    // 版本日志，方便确认脚本是否更新成功
    addLog(`联通客服自动转单助手 v2.3 已加载`);

    // 全局兜底：独立于 MutationObserver 的定时器，确保弹窗出现时面板一定被隐藏
    // 同时检测账号确认弹窗并自动点击"确定"
    setInterval(() => {
      if (!floatPanel) return;
      try {
        const smsDialog = detectSmsVerifyDialog();
        const confirmDialog = detectAccountConfirmDialog();

        if (smsDialog || confirmDialog) {
          const activeDialog = smsDialog || confirmDialog;
          // 隐藏面板（6 重保险）
          floatPanel.style.setProperty("display", "none", "important");
          floatPanel.style.setProperty("visibility", "hidden", "important");
          floatPanel.style.setProperty("left", "-9999px", "important");
          floatPanel.style.setProperty("top", "-9999px", "important");
          floatPanel.style.setProperty("z-index", "-1", "important");
          floatPanel.style.setProperty("pointer-events", "none", "important");
          floatPanel.setAttribute("aria-hidden", "true");
          panelHiddenBySmsObserver = true;
          // 提高弹窗层级
          if (activeDialog && activeDialog.element) {
            activeDialog.element.style.setProperty(
              "z-index",
              "200000",
              "important",
            );
          }
          // 账号确认弹窗：自动点击"确定"重新登录
          if (confirmDialog && confirmDialog.okButton) {
            const dlgId = confirmDialog.element.id || "";
            if (globalLastClickedConfirmId !== dlgId) {
              globalLastClickedConfirmId = dlgId;
              addLog(`【全局兜底】检测到账号确认弹窗，自动点击"确定"重新登录`);
              confirmDialog.okButton.click();
            }
          }
        } else if (panelHiddenBySmsObserver) {
          // 所有弹窗已关闭，恢复面板
          floatPanel.style.removeProperty("display");
          floatPanel.style.removeProperty("visibility");
          floatPanel.style.removeProperty("left");
          floatPanel.style.removeProperty("top");
          floatPanel.style.removeProperty("z-index");
          floatPanel.style.removeProperty("pointer-events");
          floatPanel.removeAttribute("aria-hidden");
          panelHiddenBySmsObserver = false;
          globalLastClickedConfirmId = ""; // 重置点击记录
        }
      } catch (e) {
        // 忽略错误，确保持续运行
      }
    }, 100); // 100ms 间隔，确保即时响应

    if (window.location.pathname === "/cs/login.html") {
      addLog("登录页面已加载");
    }
  }

  function loadAccounts() {
    const saved = GM_getValue(STORAGE_KEY, "[]");
    try {
      accounts = JSON.parse(saved);
    } catch (e) {
      accounts = [];
    }
  }

  function saveAccounts() {
    GM_setValue(STORAGE_KEY, JSON.stringify(accounts));
  }

  function loadLogs() {
    const saved = GM_getValue(LOG_KEY, "[]");
    try {
      logs = JSON.parse(saved);
    } catch (e) {
      logs = [];
    }
  }

  function addLog(message) {
    const timestamp = new Date().toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    logs.unshift({ timestamp, message });
    if (logs.length > 100) logs.pop();
    GM_setValue(LOG_KEY, JSON.stringify(logs));
    updateLogDisplay();
  }

  function clearLogs() {
    logs = [];
    GM_setValue(LOG_KEY, "[]");
    updateLogDisplay();
  }

  function clearAllCookies() {
    accounts.forEach((acc) => {
      GM_setValue(COOKIE_KEY_PREFIX + acc.account, "");
    });
    addLog("已清空所有账号Cookie");
    alert("已清空所有账号Cookie");
  }

  function saveAccountCookie(account) {
    try {
      const cookieData = document.cookie;
      GM_setValue(COOKIE_KEY_PREFIX + account, cookieData);
      addLog(`已保存账号 ${account} 的Cookie`);
    } catch (e) {
      addLog(`保存Cookie失败: ${e.message}`);
    }
  }

  function loadAccountCookie(account) {
    try {
      const cookieData = GM_getValue(COOKIE_KEY_PREFIX + account, "");
      if (cookieData) {
        const cookies = cookieData.split(";");
        cookies.forEach((cookie) => {
          const trimmed = cookie.trim();
          if (trimmed) {
            document.cookie = trimmed + "; path=/";
          }
        });
        addLog(`已加载账号 ${account} 的Cookie`);
        return true;
      }
    } catch (e) {
      addLog(`加载Cookie失败: ${e.message}`);
    }
    return false;
  }

  function createFloatPanel() {
    if (floatPanel) return;

    GM_addStyle(`
            #unicom-float-panel {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 340px;
                background: rgba(255, 255, 255, 0.98);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                border: 1px solid #e8e8e8;
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            #unicom-float-panel.mini {
                width: 40px;
                height: 40px;
            }
            #unicom-float-panel.hidden {
                display: none !important;
            }
            #unicom-float-panel .panel-header {
                background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
                color: white;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }
            #unicom-float-panel .panel-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            #unicom-float-panel .panel-header .panel-controls {
                display: flex;
                gap: 8px;
            }
            #unicom-float-panel .panel-header .panel-controls button {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }
            #unicom-float-panel .panel-header .panel-controls button:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            #unicom-float-panel .panel-body {
                padding: 16px;
                max-height: 500px;
                overflow-y: auto;
            }
            #unicom-float-panel .account-info {
                margin-bottom: 16px;
                padding: 12px;
                background: #f5f5f5;
                border-radius: 8px;
            }
            #unicom-float-panel .account-info .account-count {
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
            }
            #unicom-float-panel .account-info .current-account {
                font-size: 14px;
                font-weight: 500;
                color: #333;
            }
            #unicom-float-panel .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                font-size: 12px;
            }
            #unicom-float-panel .status-indicator .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #999;
            }
            #unicom-float-panel .status-indicator .status-dot.running {
                background: #4caf50;
                animation: pulse 1.5s infinite;
            }
            #unicom-float-panel .status-indicator .status-dot.idle {
                background: #999;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            #unicom-float-panel .progress-bar {
                width: 100%;
                height: 6px;
                background: #e0e0e0;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 16px;
            }
            #unicom-float-panel .progress-bar .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #1a73e8, #4285f4);
                width: 0%;
                transition: width 0.3s ease;
            }
            #unicom-float-panel .btn {
                display: block;
                width: 100%;
                padding: 10px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            }
            #unicom-float-panel .btn-primary {
                background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
                color: white;
            }
            #unicom-float-panel .btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
            }
            #unicom-float-panel .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            #unicom-float-panel .btn-danger {
                background: #f44336;
                color: white;
            }
            #unicom-float-panel .btn-danger:hover {
                background: #d32f2f;
            }
            #unicom-float-panel .btn-secondary {
                background: #e0e0e0;
                color: #333;
            }
            #unicom-float-panel .btn-secondary:hover {
                background: #d0d0d0;
            }
            #unicom-float-panel .btn-success {
                background: #4caf50;
                color: white;
            }
            #unicom-float-panel .btn-success:hover {
                background: #45a049;
            }
            #unicom-float-panel .log-section {
                margin-top: 16px;
                border-top: 1px solid #e0e0e0;
                padding-top: 12px;
            }
            #unicom-float-panel .log-section .log-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 12px;
                color: #666;
            }
            #unicom-float-panel .log-section .log-header button {
                background: none;
                border: none;
                color: #1a73e8;
                cursor: pointer;
                font-size: 11px;
            }
            #unicom-float-panel .log-section .log-header button:hover {
                text-decoration: underline;
            }
            #unicom-float-panel .log-list {
                font-size: 11px;
                line-height: 1.6;
                max-height: 150px;
                overflow-y: auto;
                color: #555;
            }
            #unicom-float-panel .log-list .log-item {
                margin-bottom: 4px;
                padding-left: 8px;
                border-left: 2px solid #e0e0e0;
            }
            #unicom-float-panel .log-list .log-item .log-time {
                color: #999;
                margin-right: 8px;
            }
            #unicom-float-panel .result-section {
                margin-top: 12px;
                padding: 12px;
                background: #e3f2fd;
                border-radius: 8px;
                font-size: 12px;
            }
            #unicom-float-panel .result-section h4 {
                margin: 0 0 8px 0;
                font-size: 13px;
                color: #1565c0;
            }
            #unicom-float-panel .captcha-section {
                margin-top: 12px;
                padding: 12px;
                background: #fff3e0;
                border-radius: 8px;
                border: 1px solid #ffe0b2;
                display: none;
            }
            #unicom-float-panel .captcha-section.active {
                display: block;
            }
            #unicom-float-panel .captcha-section h4 {
                margin: 0 0 8px 0;
                font-size: 13px;
                color: #e65100;
            }
            #unicom-float-panel .captcha-section img {
                width: 100%;
                height: auto;
                border-radius: 4px;
                margin-bottom: 8px;
                border: 1px solid #ddd;
            }
            #unicom-float-panel .captcha-section input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
                margin-bottom: 8px;
            }
            #unicom-float-panel .captcha-section .captcha-status {
                font-size: 11px;
                color: #666;
                text-align: center;
            }
            #unicom-float-panel.mini .panel-body,
            #unicom-float-panel.mini .panel-header h3 {
                display: none;
            }
            #unicom-float-panel.mini .panel-header {
                padding: 0;
                border-radius: 12px;
            }
            #unicom-float-panel.mini .panel-header .panel-controls {
                width: 100%;
                height: 100%;
                justify-content: center;
            }
            #unicom-float-panel.mini .panel-header .panel-controls button {
                width: 100%;
                height: 100%;
                border-radius: 12px;
                font-size: 16px;
            }
            .unicom-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .unicom-dialog {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .unicom-dialog h3 {
                margin: 0 0 16px 0;
                font-size: 18px;
                color: #333;
            }
            .unicom-dialog p {
                margin: 0 0 20px 0;
                font-size: 14px;
                color: #666;
                line-height: 1.5;
            }
            .unicom-dialog .dialog-buttons {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .unicom-dialog button {
                padding: 8px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
            }
            .unicom-dialog .btn-confirm {
                background: #1a73e8;
                color: white;
            }
            .unicom-dialog .btn-cancel {
                background: #e0e0e0;
                color: #333;
            }
        `);

    floatPanel = document.createElement("div");
    floatPanel.id = "unicom-float-panel";
    floatPanel.innerHTML = `
            <div class="panel-header">
                <h3>联通客服助手</h3>
                <div class="panel-controls">
                    <button id="unicom-minimize-btn" title="最小化">−</button>
                    <button id="unicom-close-btn" title="隐藏">×</button>
                </div>
            </div>
            <div class="panel-body">
                <div class="account-info">
                    <div class="account-count">已配置账号: <span id="account-count">0</span></div>
                    <div class="current-account">当前账号: <span id="current-account">无</span></div>
                </div>
                <div class="status-indicator">
                    <div class="status-dot" id="status-dot"></div>
                    <span id="status-text">空闲</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
                <button class="btn btn-primary" id="start-btn">开始执行</button>
                <button class="btn btn-danger" id="stop-btn" disabled>停止执行</button>
                <button class="btn btn-secondary" id="manage-btn">管理账号</button>
                <button class="btn btn-success" id="poll-btn">轮询活跃</button>
                <div class="captcha-section" id="captcha-section">
                    <h4>验证码识别</h4>
                    <img id="captcha-img" src="" alt="验证码">
                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <input type="text" id="captcha-input" placeholder="请输入验证码" maxlength="6" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
                        <button id="captcha-submit-btn" style="background: #e65100; color: white; border: none; padding: 0 14px; border-radius: 4px; cursor: pointer; font-size: 13px; white-space: nowrap;">提交</button>
                    </div>
                    <div class="captcha-status" id="captcha-status">等待输入验证码...</div>
                </div>
                <div class="log-section">
                    <div class="log-header">
                        <span>执行日志</span>
                        <button id="clear-log-btn">清空</button>
                    </div>
                    <div class="log-list" id="log-list"></div>
                </div>
                <div class="result-section" id="result-section" style="display: none;">
                    <h4>执行结果汇总</h4>
                    <div id="result-content"></div>
                </div>
            </div>
        `;
    document.body.appendChild(floatPanel);

    document
      .getElementById("unicom-minimize-btn")
      .addEventListener("click", toggleMini);
    document
      .getElementById("unicom-close-btn")
      .addEventListener("click", toggleHidden);
    document
      .getElementById("start-btn")
      .addEventListener("click", startExecution);
    document
      .getElementById("stop-btn")
      .addEventListener("click", stopExecution);
    document
      .getElementById("manage-btn")
      .addEventListener("click", showAccountManager);
    document.getElementById("poll-btn").addEventListener("click", startPolling);
    document
      .getElementById("clear-log-btn")
      .addEventListener("click", clearLogs);

    document.getElementById("captcha-input").addEventListener("input", (e) => {
      if (captchaResolver && e.target.value.length >= CAPTCHA_LENGTH) {
        captchaResolver(e.target.value);
        captchaResolver = null;
      }
    });

    // 回车提交
    document
      .getElementById("captcha-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter" && captchaResolver) {
          const value = e.target.value.trim();
          if (value) {
            captchaResolver(value);
            captchaResolver = null;
          }
        }
      });

    // 提交按钮
    document
      .getElementById("captcha-submit-btn")
      .addEventListener("click", () => {
        if (captchaResolver) {
          const input = document.getElementById("captcha-input");
          const value = input.value.trim();
          if (value) {
            captchaResolver(value);
            captchaResolver = null;
          }
        }
      });

    floatPanel.addEventListener("dblclick", toggleMini);
    updateAccountCount();
    updateLogDisplay();

    // 独立的 MutationObserver：监听所有弹窗（短信验证/信息确认），即时隐藏/恢复悬浮面板
    // 解决 handleLoginFlow 轮询检测滞后导致弹窗被遮挡的问题
    setupDialogObserver();
  }

  // 弹窗通用监听器：短信验证弹窗 + 账号确认弹窗
  // 两种弹窗出现时都隐藏面板 + 提高弹窗层级；账号确认弹窗还自动点击"确定"
  function setupDialogObserver() {
    let lastClickedConfirmId = ""; // 记录已点过的确认弹窗ID，避免重复点击
    let checkScheduled = false;

    const forceHidePanelAndRaiseDialog = (dialogEl) => {
      if (!floatPanel) return;
      // 隐藏面板（6 重保险）
      floatPanel.style.setProperty("display", "none", "important");
      floatPanel.style.setProperty("visibility", "hidden", "important");
      floatPanel.style.setProperty("left", "-9999px", "important");
      floatPanel.style.setProperty("top", "-9999px", "important");
      floatPanel.style.setProperty("z-index", "-1", "important");
      floatPanel.style.setProperty("pointer-events", "none", "important");
      floatPanel.setAttribute("aria-hidden", "true");
      panelHiddenBySmsObserver = true;

      // 提高弹窗 z-index 到 200000（远高于面板 99999）
      if (dialogEl) {
        dialogEl.style.setProperty("z-index", "200000", "important");
      }
    };

    const forceShowPanel = () => {
      if (!floatPanel) return;
      floatPanel.style.removeProperty("display");
      floatPanel.style.removeProperty("visibility");
      floatPanel.style.removeProperty("left");
      floatPanel.style.removeProperty("top");
      floatPanel.style.removeProperty("z-index");
      floatPanel.style.removeProperty("pointer-events");
      floatPanel.removeAttribute("aria-hidden");
      panelHiddenBySmsObserver = false;
    };

    const autoClickConfirm = (confirmDialog) => {
      if (!confirmDialog || !confirmDialog.okButton) return;
      const dialogId = confirmDialog.element.id || "";
      if (lastClickedConfirmId === dialogId) return; // 已处理过
      lastClickedConfirmId = dialogId;
      addLog(`【账号确认】检测到账号冲突确认弹窗，自动点击"确定"重新登录`);
      confirmDialog.okButton.click();
    };

    const checkDialogs = () => {
      if (checkScheduled) return;
      checkScheduled = true;
      requestAnimationFrame(() => {
        checkScheduled = false;
        if (!floatPanel) return;

        const smsDialog = detectSmsVerifyDialog();
        const confirmDialog = detectAccountConfirmDialog();

        if (smsDialog) {
          // 短信验证弹窗：隐藏面板 + 提高层级
          if (!panelHiddenBySmsObserver) {
            forceHidePanelAndRaiseDialog(smsDialog.element);
            addLog(
              "【短信弹窗监听】检测到短信验证弹窗，已隐藏面板+提高弹窗层级",
            );
          } else if (smsDialog.element) {
            // 即使已隐藏，也确保弹窗层级最高
            smsDialog.element.style.setProperty(
              "z-index",
              "200000",
              "important",
            );
          }
        } else if (confirmDialog) {
          // 账号确认弹窗：隐藏面板 + 提高层级 + 自动点确定
          if (!panelHiddenBySmsObserver) {
            forceHidePanelAndRaiseDialog(confirmDialog.element);
            addLog(
              "【短信弹窗监听】检测到账号确认弹窗，已隐藏面板+提高弹窗层级",
            );
          } else if (confirmDialog.element) {
            confirmDialog.element.style.setProperty(
              "z-index",
              "200000",
              "important",
            );
          }
          autoClickConfirm(confirmDialog);
        } else if (panelHiddenBySmsObserver) {
          // 所有弹窗都已关闭 → 恢复面板
          forceShowPanel();
          lastClickedConfirmId = ""; // 重置点击记录
          addLog("【短信弹窗监听】所有弹窗已关闭，已恢复面板显示");
        }
      });
    };

    const observer = new MutationObserver(() => {
      checkDialogs();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    // 首次检查一次（防止脚本加载时弹窗已存在）
    checkDialogs();

    // 兜底：200ms 定时检查一次，确保 Observer 漏触发时仍能隐藏
    setInterval(() => {
      checkDialogs();
    }, 200);
  }

  function toggleMini() {
    floatPanel.classList.toggle("mini");
  }

  function toggleHidden() {
    floatPanel.classList.toggle("hidden");
  }

  function updateAccountCount() {
    document.getElementById("account-count").textContent = accounts.length;
  }

  function updateLogDisplay() {
    const logList = document.getElementById("log-list");
    if (!logList) return;
    const recentLogs = logs.slice(0, 5);
    logList.innerHTML = recentLogs
      .map(
        (log) => `
            <div class="log-item">
                <span class="log-time">${log.timestamp}</span>
                <span>${log.message}</span>
            </div>
        `,
      )
      .join("");
  }

  function updateStatus(status, accountName = "") {
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");
    const currentAccountSpan = document.getElementById("current-account");

    if (status === "running") {
      statusDot.classList.remove("idle");
      statusDot.classList.add("running");
      statusText.textContent = "执行中...";
      currentAccountSpan.textContent = accountName || "未知";
      document.getElementById("start-btn").disabled = true;
      document.getElementById("poll-btn").disabled = true;
      document.getElementById("stop-btn").disabled = false;
    } else {
      statusDot.classList.remove("running");
      statusDot.classList.add("idle");
      statusText.textContent = "空闲";
      currentAccountSpan.textContent = "无";
      document.getElementById("start-btn").disabled = false;
      document.getElementById("poll-btn").disabled = false;
      document.getElementById("stop-btn").disabled = true;
    }
  }

  function updateProgress(index, total) {
    const fill = document.getElementById("progress-fill");
    if (fill && total > 0) {
      fill.style.width = `${(index / total) * 100}%`;
    }
  }

  function showCaptchaSection(show) {
    const section = document.getElementById("captcha-section");
    if (show) {
      section.classList.add("active");
    } else {
      section.classList.remove("active");
      document.getElementById("captcha-input").value = "";
    }
  }

  function updateCaptchaImage(src) {
    const img = document.getElementById("captcha-img");
    if (img) img.src = src;
  }

  function updateCaptchaStatus(text) {
    const status = document.getElementById("captcha-status");
    if (status) status.textContent = text;
  }

  function showAccountManager() {
    const manager = document.createElement("div");
    manager.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 680px;
            max-width: 92vw;
            max-height: 85vh;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            z-index: 100000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99999;
        `;

    manager.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <h3 style="margin: 0; font-size: 17px;">管理账号</h3>
                <button id="close-manager" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">×</button>
            </div>
            <div style="padding: 20px; overflow-y: auto; flex: 1;">
                <div style="display: flex; gap: 10px; margin-bottom: 16px; align-items: center;">
                    <input type="text" id="new-account" placeholder="账号名称" style="flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    <input type="password" id="new-password" placeholder="密码" style="flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    <button id="add-account-btn" style="background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; white-space: nowrap;">添加账号</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 13px; color: #666;">共 ${accounts.length} 个账号</span>
                    <span style="font-size: 12px; color: #999;">双击账号可编辑</span>
                </div>
                <div id="account-list" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    ${accounts.length === 0 ? '<div style="padding: 30px; text-align: center; color: #999; font-size: 14px;">暂无账号，请在上方添加</div>' : ""}
                </div>
            </div>
        `;

    document.body.appendChild(overlay);
    document.body.appendChild(manager);

    document.getElementById("close-manager").addEventListener("click", () => {
      document.body.removeChild(manager);
      document.body.removeChild(overlay);
    });

    overlay.addEventListener("click", () => {
      document.body.removeChild(manager);
      document.body.removeChild(overlay);
    });

    document.getElementById("add-account-btn").addEventListener("click", () => {
      const account = document.getElementById("new-account").value.trim();
      const password = document.getElementById("new-password").value.trim();
      if (account && password) {
        accounts.push({ account, password });
        saveAccounts();
        renderAccountList();
        updateAccountCount();
        document.getElementById("new-account").value = "";
        document.getElementById("new-password").value = "";
      }
    });

    // 回车键快速添加
    document.getElementById("new-password").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        document.getElementById("add-account-btn").click();
      }
    });

    function renderAccountList() {
      const list = document.getElementById("account-list");
      list.innerHTML = accounts
        .map(
          (acc, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; ${index % 2 === 0 ? "background: #fafbfc;" : ""}">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 14px; font-weight: 500; color: #333;">${acc.account}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">密码: ${"*".repeat(acc.password.length)}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="edit-account-btn" data-index="${index}" style="background: #e0e0e0; color: #333; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 12px;">编辑</button>
                        <button class="delete-account-btn" data-index="${index}" style="background: #f44336; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 12px;">删除</button>
                    </div>
                </div>
            `,
        )
        .join("");

      document.querySelectorAll(".delete-account-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.target.dataset.index);
          accounts.splice(index, 1);
          saveAccounts();
          renderAccountList();
          updateAccountCount();
        });
      });

      document.querySelectorAll(".edit-account-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.target.dataset.index);
          const acc = accounts[index];
          document.getElementById("new-account").value = acc.account;
          document.getElementById("new-password").value = acc.password;
          accounts.splice(index, 1);
          saveAccounts();
          renderAccountList();
          updateAccountCount();
          document.getElementById("new-account").focus();
        });
      });
    }

    renderAccountList();
  }

  async function startExecution() {
    if (isRunning) return;
    if (accounts.length === 0) {
      alert("请先添加账号");
      return;
    }

    isRunning = true;
    currentAccountIndex = 0;
    const results = [];

    updateStatus("running");
    addLog("开始批量执行任务");

    for (let i = 0; i < accounts.length && isRunning; i++) {
      currentAccountIndex = i;
      const account = accounts[i];
      updateStatus("running", account.account);
      updateProgress(i + 1, accounts.length);

      try {
        addLog(`正在处理账号: ${account.account}`);
        const result = await executeForAccount(account);
        results.push({
          account: account.account,
          success: true,
          message: result,
        });
        addLog(`账号 ${account.account} 执行成功: ${result}`);
      } catch (error) {
        results.push({
          account: account.account,
          success: false,
          message: error.message,
        });
        addLog(`账号 ${account.account} 执行失败: ${error.message}`);
      }

      if (i < accounts.length - 1 && isRunning) {
        addLog("等待3秒后切换账号...");
        await sleep(3000);
        await logoutAndSwitch();
      }
    }

    isRunning = false;
    updateStatus("idle");
    updateProgress(0, 100);
    showResults(results);
    addLog("批量执行完成");
  }

  async function startPolling() {
    if (isRunning) return;
    if (accounts.length === 0) {
      alert("请先添加账号");
      return;
    }

    const interval = prompt("请输入轮询间隔（分钟）:", "30");
    if (!interval || isNaN(interval)) return;

    const minutes = parseInt(interval);
    addLog(`开始轮询模式，间隔 ${minutes} 分钟`);

    while (true) {
      for (let i = 0; i < accounts.length; i++) {
        if (
          !confirm(
            `是否立即登录账号: ${accounts[i].account}？\n点击取消将跳过此账号`,
          )
        ) {
          continue;
        }

        try {
          addLog(`轮询登录账号: ${accounts[i].account}`);
          await executeForAccount(accounts[i], true);
          addLog(`账号 ${accounts[i].account} 登录成功，保持活跃`);
          await sleep(minutes * 60 * 1000);
        } catch (error) {
          addLog(`账号 ${accounts[i].account} 登录失败: ${error.message}`);
        }

        await logoutAndSwitch();
      }
    }
  }

  function stopExecution() {
    isRunning = false;
    addLog("用户手动停止执行");
  }

  function showResults(results) {
    const section = document.getElementById("result-section");
    const content = document.getElementById("result-content");

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    content.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong>总账号数:</strong> ${results.length}
                <span style="margin-left: 12px; color: #4caf50;"><strong>成功:</strong> ${successCount}</span>
                <span style="margin-left: 12px; color: #f44336;"><strong>失败:</strong> ${failCount}</span>
            </div>
            <div style="max-height: 200px; overflow-y: auto; border-top: 1px solid #bbdefb; padding-top: 8px;">
                ${results
                  .map(
                    (r) => `
                    <div style="margin-bottom: 6px; padding: 6px; background: ${r.success ? "#e8f5e9" : "#ffebee"}; border-radius: 4px; font-size: 11px;">
                        <span style="font-weight: 500;">${r.account}</span>:
                        <span style="${r.success ? "color: #2e7d32;" : "color: #c62828;"}"> ${r.success ? "✓ 成功" : "✗ 失败"}</span>
                        <span style="display: block; color: #666; margin-top: 2px;">${r.message}</span>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `;

    section.style.display = "block";
  }

  async function executeForAccount(account, keepActive = false) {
    await navigateToLogin();

    await waitForElement('input[name="username"]', 10000);

    await fillLoginForm(account);

    await handleLoginFlow(account);

    if (!keepActive) {
      await performOperations(account);
    }

    return "操作完成";
  }

  async function navigateToLogin() {
    if (window.location.pathname !== "/cs/login.html") {
      addLog("导航到登录页面");
      window.location.href = "http://xx.xkf.unicom.local/cs/login.html";
      await sleep(3000);
    }
  }

  async function fillLoginForm(account) {
    addLog("填写登录表单");

    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');

    if (!usernameInput || !passwordInput) {
      throw new Error("登录元素未找到");
    }

    // 选择湖北分公司
    await selectCompany();

    // 加载账号Cookie
    loadAccountCookie(account.account);

    // 输入账号
    usernameInput.value = "";
    usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(200);

    usernameInput.value = account.account;
    usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
    addLog(`输入账号: ${account.account}`);
    await sleep(500);

    // 输入密码
    passwordInput.value = "";
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(200);

    passwordInput.value = account.password;
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    addLog("输入密码");
    await sleep(500);

    // 处理验证码
    await handleCaptcha();
  }

  async function selectCompany() {
    addLog(`选择公司: ${COMPANY_NAME}`);

    // 优先匹配 selectTree4_input（实页使用），兼容 selectTree3/5/6 等其它
    const selectInput =
      document.querySelector("#selectTree4_input") ||
      document.querySelector("#selectTree3_input") ||
      document.querySelector('[id^="selectTree"][id$="_input"]');

    const proIdInput = document.querySelector('input[name="proId"]');

    if (selectInput) {
      addLog(
        `找到公司选择框: ${selectInput.id}，当前值: "${selectInput.value}"`,
      );
      // 如果已经是湖北分公司，不用重复选择
      if (selectInput.value && selectInput.value.includes(COMPANY_NAME)) {
        addLog(`${COMPANY_NAME} 已选择，跳过`);
        return;
      }

      // 方式1: 直接设置值并触发事件
      selectInput.value = COMPANY_NAME;
      selectInput.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(200);
    }

    if (proIdInput) {
      proIdInput.value = COMPANY_ID;
      proIdInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // 方式2: 展开下拉并点击"湖北分公司"树节点
    let hubeiItem = null;
    const possibleSelectors = [
      "#selectTree4_tree_20_a",
      "#selectTree3_tree_20_a",
      "#selectTree5_tree_20_a",
    ];
    for (const sel of possibleSelectors) {
      hubeiItem = document.querySelector(sel);
      if (hubeiItem) {
        addLog(`通过选择器 "${sel}" 找到湖北分公司节点`);
        break;
      }
    }

    // 方式3: 遍历全部列表项，通过文本定位"湖北分公司"（最稳）
    if (!hubeiItem) {
      const allListItems = document.querySelectorAll(
        'li, [role="listitem"], .listitem, [id*="tree_"] a, [id*="tree_"] span',
      );
      for (const el of allListItems) {
        const text = (el.textContent || "").trim();
        if (text === COMPANY_NAME) {
          hubeiItem = el;
          addLog(`通过文本匹配找到湖北分公司: <${el.tagName}>`);
          break;
        }
      }
    }

    if (hubeiItem) {
      hubeiItem.click();
      addLog("已点击湖北分公司节点");
    } else {
      addLog("未找到湖北分公司树节点，直接尝试下拉按钮触发");
      // 尝试点击公司选择框旁边的下拉按钮
      if (selectInput) {
        // 触发 focus 事件
        selectInput.focus();
        selectInput.dispatchEvent(new Event("focus", { bubbles: true }));
        // 有些选择器需要点击相邻按钮
        const siblingBtn = selectInput.parentElement
          ? selectInput.parentElement.querySelector(
              'button, [onclick*="toggle"], [class*="btn"], [class*="selBtn"]',
            )
          : null;
        if (siblingBtn) {
          siblingBtn.click();
          addLog("已点击公司下拉按钮，等待树展开");
          await sleep(1500);
          // 再次尝试文本查找
          const allItems = document.querySelectorAll(
            'li, [role="listitem"], a, span',
          );
          for (const el of allItems) {
            if ((el.textContent || "").trim() === COMPANY_NAME) {
              el.click();
              addLog("下拉展开后点击湖北分公司");
              break;
            }
          }
        }
      }
    }

    addLog("公司选择流程结束，等待验证码加载...");
    await sleep(1500);
  }

  async function handleCaptcha() {
    const captchaInput = document.querySelector(
      'input[name="verificationCode"]',
    );
    if (!captchaInput) return;

    // 等待验证码图片加载
    await sleep(800);

    let ocrAttempts = 0;
    let lastError = "";

    while (ocrAttempts < MAX_OCR_ATTEMPTS) {
      ocrAttempts++;
      addLog(`验证码识别第 ${ocrAttempts}/${MAX_OCR_ATTEMPTS} 次尝试`);

      // 提取验证码图片
      const imageData = await extractCaptchaImage();
      if (!imageData) {
        addLog("未找到验证码图片，可能此页面无需验证码");
        return;
      }

      // 在面板展示验证码图片
      updateCaptchaImage(imageData);
      showCaptchaSection(true);
      updateCaptchaStatus(`正在本地 OCR 识别...（第 ${ocrAttempts} 次）`);

      // 尝试 OCR 识别
      let ocrResult = null;
      try {
        ocrResult = await recognizeCaptchaByOCR(imageData);
      } catch (e) {
        addLog(`OCR 识别异常: ${e.message}`);
      }

      if (
        ocrResult &&
        ocrResult.text &&
        ocrResult.text.length === CAPTCHA_LENGTH
      ) {
        addLog(
          `OCR 识别成功: ${ocrResult.text}（置信度: ${ocrResult.confidence}%）`,
        );

        // 填入验证码
        captchaInput.value = "";
        captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(200);

        captchaInput.value = ocrResult.text;
        captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
        captchaInput.dispatchEvent(new Event("change", { bubbles: true }));
        addLog(`验证码已自动填入: ${ocrResult.text}`);

        showCaptchaSection(false);
        return ocrResult.text;
      }

      // OCR 识别失败或结果不符合预期
      lastError = ocrResult
        ? `识别结果"${ocrResult.text}"不符合要求`
        : "OCR 未返回结果";
      addLog(`第 ${ocrAttempts} 次识别失败: ${lastError}`);

      // 刷新验证码图片后重试
      if (ocrAttempts < MAX_OCR_ATTEMPTS) {
        addLog("刷新验证码后重试...");
        await refreshCaptcha();
        await sleep(1000);
      }
    }

    // OCR 多次失败，转人工填写
    addLog(`本地 OCR 识别 ${MAX_OCR_ATTEMPTS} 次均失败，转人工输入`);
    updateCaptchaStatus("OCR 识别失败，请手动输入验证码");

    // 重新提取最新的验证码图片展示
    const finalImageData = await extractCaptchaImage();
    if (finalImageData) {
      updateCaptchaImage(finalImageData);
    }

    const manualCode = await waitForUserCaptcha();
    if (manualCode) {
      captchaInput.value = manualCode;
      captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
      captchaInput.dispatchEvent(new Event("change", { bubbles: true }));
      addLog(`验证码已手动输入: ${manualCode}`);
    }

    showCaptchaSection(false);
    return manualCode;
  }

  // 提取验证码图片，返回 dataURL 或 src
  async function extractCaptchaImage() {
    // 1. 优先从页面 DOM 的 img 元素中查找
    let captchaImg = null;
    let matchedBy = "";

    // 实页测试: 验证码图片通常在验证码输入框附近，大小约 120x40，src 为 blob: 或 verificationCode URL
    const allImgs = Array.from(document.querySelectorAll("img"));
    addLog(`页面共找到 ${allImgs.length} 个 img 标签`);

    // 策略A: 基于 class/id/src 关键词的优先级匹配
    // 实页测试发现: <span class="verification"><img src="blob:..."></span>
    const keywordPriority = [
      // 实页最精确命中: .verification 容器内的 img
      { sel: ".verification img", by: ".verification img" },
      { sel: "span.verification img", by: "span.verification img" },
      { sel: ".verification-img img", by: ".verification-img img" },
      // src 关键词（包含 blob 不在此列，单独走策略B）
      { sel: 'img[src*="verificationcode"]', by: "src=verificationcode" },
      { sel: 'img[src*="verificationCode"]', by: "src=verificationCode" },
      { sel: 'img[src*="VerificationCode"]', by: "src=VerificationCode" },
      { sel: 'img[src*="captcha"]', by: "src=captcha" },
      { sel: 'img[src*="verify"]', by: "src=verify" },
      // class/id 关键词
      { sel: 'img[class*="code"]', by: "class*=code" },
      { sel: 'img[class*="captcha"]', by: "class*=captcha" },
      { sel: 'img[class*="verify"]', by: "class*=verify" },
      { sel: 'img[id*="code"]', by: "id*=code" },
      { sel: 'img[id*="captcha"]', by: "id*=captcha" },
      { sel: 'img[id*="verify"]', by: "id*=verify" },
      { sel: ".captcha img", by: ".captcha img" },
    ];
    for (const { sel, by } of keywordPriority) {
      const el = document.querySelector(sel);
      if (el && (el.src || el.srcset)) {
        captchaImg = el;
        matchedBy = by;
        addLog(`优先级匹配找到验证码图片: ${by}`);
        break;
      }
    }

    // 策略B: 找 src 为 blob: 的图片（实页就是这种！）
    // 实页: <span class="verification"><img src="blob:http://xx.xkf.unicom.local/uuid"></span>
    if (!captchaImg) {
      const blobImgs = allImgs.filter(
        (img) => img.src && img.src.startsWith("blob:"),
      );
      addLog(`找到 ${blobImgs.length} 个 blob: 图片`);
      if (blobImgs.length > 0) {
        // 优先：在 .verification 容器内的 blob 图片
        for (const img of blobImgs) {
          const parent = img.parentElement;
          if (
            (parent &&
              parent.className &&
              parent.className.includes("verification")) ||
            (parent && parent.className && parent.className.includes("captcha"))
          ) {
            captchaImg = img;
            const w = img.naturalWidth || img.width || 0;
            const h = img.naturalHeight || img.height || 0;
            matchedBy = `verification容器内的blob图片(${w}x${h})`;
            addLog(`找到 .verification 容器内的 blob 图片 (${w}x${h})`);
            break;
          }
        }
        // 次优：blob 图片尺寸过滤（验证码一般宽高在 50-400 x 15-150 之间，放宽避免漏）
        if (!captchaImg) {
          for (const img of blobImgs) {
            const w = img.naturalWidth || img.width || 0;
            const h = img.naturalHeight || img.height || 0;
            if (
              (w >= 40 && w <= 400 && h >= 15 && h <= 150) ||
              blobImgs.length === 1
            ) {
              captchaImg = img;
              matchedBy = `blob图片(${w}x${h})`;
              addLog(`找到 blob: 验证码图片 (${w}x${h})`);
              break;
            }
          }
        }
        // 兜底：blob 图片全部不满足尺寸时，取第一个
        if (!captchaImg) {
          captchaImg = blobImgs[0];
          const w = captchaImg.naturalWidth || captchaImg.width || 0;
          const h = captchaImg.naturalHeight || captchaImg.height || 0;
          matchedBy = `blob图片兜底(${w}x${h})`;
          addLog(`兜底取第一个 blob: 图片 (${w}x${h})`);
        }
      }
    }

    // 策略C: 基于 size heuristic 找尺寸像验证码的图
    if (!captchaImg) {
      for (const img of allImgs) {
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        if (w >= 60 && w <= 300 && h >= 20 && h <= 100) {
          captchaImg = img;
          matchedBy = `尺寸匹配(${w}x${h})`;
          addLog(`通过尺寸(${w}x${h})匹配找到验证码图片`);
          break;
        }
      }
    }

    // 策略D: 直接抓取最后一个 img（验证码一般在登录按钮上面，最后加载）
    if (!captchaImg && allImgs.length > 0) {
      captchaImg = allImgs[allImgs.length - 1];
      matchedBy = "last-image fallback";
      addLog("兜底：取最后一张图片作为验证码");
    }

    // 2. 如果找到了 DOM img 元素 → 转 dataURL（tesseract 不认 blob:）
    if (captchaImg && (captchaImg.src || captchaImg.srcset)) {
      const dataUrl = await imageToDataURL(captchaImg);
      if (dataUrl) {
        addLog(`验证码图片已转换为 dataURL (${matchedBy})`);
        return dataUrl;
      }
      // dataURL 转换失败时，不直接返回 blob: src（tesseract 不支持）
      // 而是记录失败原因，让后续兜底逻辑生效
      addLog(
        `dataURL 转换失败 (${matchedBy})，src: ${captchaImg.src.substring(0, 80)}...`,
      );
    }

    // 3. 检查 canvas 验证码
    const captchaCanvas = document.querySelector(
      'canvas[id*="captcha"], canvas[class*="captcha"], canvas[class*="verify"], canvas',
    );
    if (captchaCanvas) {
      try {
        const w = captchaCanvas.width || 0;
        const h = captchaCanvas.height || 0;
        if (w >= 40 && w <= 400 && h >= 15 && h <= 150) {
          addLog(`检测到 canvas 验证码 (${w}x${h})`);
          return captchaCanvas.toDataURL("image/png");
        }
      } catch (e) {
        addLog(`canvas 转换失败: ${e.message}`);
      }
    }

    // 4. 兜底方式：直接通过 fetch 访问 verificationCode 接口拿图像
    addLog("DOM 提取验证码失败，尝试直接接口抓取...");
    const directDataUrl = await fetchCaptchaImageDirectly();
    if (directDataUrl) {
      addLog("通过直接访问 verificationCode 接口获取到验证码图片");
      return directDataUrl;
    }

    addLog("未找到任何验证码图片元素");
    return null;
  }

  // 兜底：直接fetch验证码接口并转dataURL
  async function fetchCaptchaImageDirectly() {
    try {
      // 从页面已有 visitorId cookie/localStorage 获取 visitorId
      let visitorId = "";
      try {
        visitorId =
          localStorage.getItem("visitorId") ||
          sessionStorage.getItem("visitorId") ||
          "";
      } catch (e) {}
      if (!visitorId) {
        // 从 cookie 中提取
        const visitorMatch = document.cookie.match(/visitorId[=:]\s*([^;\s]+)/);
        if (visitorMatch) visitorId = visitorMatch[1];
      }
      if (!visitorId) {
        // 页面之前没有 visitorId，生成一个随机UUID
        visitorId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      }

      const timestamp = Date.now();
      const url =
        "/cs/pvc/cert/oauth/verificationcode/verificationCode" +
        `?visitorId=${encodeURIComponent(visitorId)}&timestamp=${timestamp}`;

      addLog(`尝试直接拉取验证码: ${url.substring(0, 80)}...`);

      const resp = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      if (!resp.ok) {
        addLog(`接口请求失败: HTTP ${resp.status}`);
        return null;
      }
      const blob = await resp.blob();
      // 转 dataURL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      addLog(`直接抓取验证码异常: ${e.message}`);
      return null;
    }
  }

  // 将 img 元素转为 dataURL
  async function imageToDataURL(imgElement) {
    try {
      const src = imgElement.src;
      if (!src) return null;

      // 情况1: 已经是 dataURL 直接返回
      if (src.startsWith("data:")) {
        return src;
      }

      // blob: URL 和同源 http URL 都同时尝试 fetch + canvas 两种方式
      // 用 Promise.race 让先成功的胜出，提高成功率
      const promises = [];

      // 方式A: fetch + FileReader（适合 blob URL 已加载到内存的情况）
      if (
        src.startsWith("blob:") ||
        (src.startsWith("http") &&
          (src.includes(location.host) || src.includes("verificationcode")))
      ) {
        promises.push(
          (async () => {
            try {
              const fetchOpts = src.startsWith("http")
                ? { credentials: "include" }
                : {};
              const resp = await fetch(src, fetchOpts);
              if (resp.ok) {
                const blob = await resp.blob();
                const dataUrl = await blobToDataURL(blob);
                if (dataUrl) {
                  addLog(`fetch 方式成功 (${blob.size}字节)`);
                  return dataUrl;
                }
              }
            } catch (e) {
              addLog(`fetch 方式失败: ${e.message}`);
            }
            return null;
          })(),
        );
      }

      // 方式B: canvas 绘制 + toDataURL（适合图片已渲染到 DOM 的情况）
      promises.push(
        (async () => {
          try {
            const dataUrl = await imageToDataURLViaCanvas(imgElement);
            if (dataUrl) {
              addLog("canvas 方式成功");
            }
            return dataUrl;
          } catch (e) {
            addLog(`canvas 方式异常: ${e.message}`);
            return null;
          }
        })(),
      );

      // 等待任一成功，全部失败则返回 null
      const results = await Promise.allSettled(promises);
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          return r.value;
        }
      }
      return null;
    } catch (e) {
      addLog(`imageToDataURL 异常: ${e.message}`);
      return null;
    }
  }

  // blob 转 dataURL 辅助函数
  function blobToDataURL(blob) {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      } catch (e) {
        resolve(null);
      }
    });
  }

  // canvas 兜底方式：依赖图片完全加载
  function imageToDataURLViaCanvas(imgElement) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const drawImage = () => {
          try {
            const w = imgElement.naturalWidth || imgElement.width || 0;
            const h = imgElement.naturalHeight || imgElement.height || 0;
            if (w === 0 || h === 0) {
              addLog(
                `canvas 转换失败: 图片尺寸为 0x0 (src: ${imgElement.src.substring(0, 60)}...)`,
              );
              resolve(null);
              return;
            }
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(imgElement, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            addLog(`canvas 转换成功 (${w}x${h})`);
            resolve(dataUrl);
          } catch (e) {
            addLog(`canvas 转换异常: ${e.message}`);
            resolve(null);
          }
        };

        if (imgElement.complete && imgElement.naturalWidth > 0) {
          drawImage();
        } else {
          imgElement.addEventListener("load", drawImage, { once: true });
          imgElement.addEventListener("error", () => resolve(null), {
            once: true,
          });
          // 超时兜底
          setTimeout(() => resolve(null), 3000);
        }
      } catch (e) {
        resolve(null);
      }
    });
  }

  // 使用 tesseract.js 进行本地 OCR 识别
  async function recognizeCaptchaByOCR(imageData) {
    if (typeof Tesseract === "undefined") {
      throw new Error("Tesseract.js 未加载");
    }

    addLog("开始本地 OCR 识别...");

    const result = await Tesseract.recognize(imageData, "eng", {
      tessedit_char_whitelist: OCR_CHAR_WHITELIST,
      tessedit_pageseg_mode: "7", // 单行文本模式
      tessedit_ocr_engine_mode: "2", // OCR 引擎模式
    });

    const rawText = (result.data.text || "").trim();
    // 过滤非白名单字符
    const text = rawText.replace(/[^0-9]/g, "");
    const confidence = Math.round(result.data.confidence || 0);

    addLog(`OCR 原始结果: "${rawText}" -> 过滤后: "${text}"`);

    return { text, confidence };
  }

  // 刷新验证码图片
  async function refreshCaptcha() {
    // 方式0（最优先，实页）：点击"换一张"文本链接
    const allElements = document.querySelectorAll(
      "a, button, span, div, p, li",
    );
    let refreshBtn = null;
    for (const el of allElements) {
      const t = (el.textContent || "").trim();
      if (t === "换一张" || t === "刷新验证码" || t === "看不清") {
        refreshBtn = el;
        break;
      }
    }
    if (refreshBtn) {
      refreshBtn.click();
      addLog('已点击"换一张"刷新验证码');
      await sleep(800);
      return;
    }

    // 方式1：点击页面上任何 img 元素（一般验证码图片可点击刷新）
    const allImgs = Array.from(document.querySelectorAll("img"));
    let captchaImg = null;
    for (const img of allImgs) {
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (
        (img.src &&
          (img.src.startsWith("blob:") ||
            img.src.includes("code") ||
            img.src.includes("verify"))) ||
        (w >= 60 && w <= 300 && h >= 20 && h <= 100)
      ) {
        captchaImg = img;
        break;
      }
    }
    if (captchaImg) {
      try {
        captchaImg.click();
        addLog("已点击验证码图片刷新");
        await sleep(800);
        return;
      } catch (e) {}
    }

    // 方式2：模糊匹配刷新按钮
    refreshBtn = Array.from(
      document.querySelectorAll("a, button, span, div"),
    ).find((el) => {
      const text = (el.textContent || "").trim();
      if (
        text.includes("刷新") ||
        text.includes("换一张") ||
        text.includes("看不清") ||
        text.includes("换一换")
      ) {
        return true;
      }
      if (el.onclick) {
        const onclickStr = el.onclick.toString();
        if (
          onclickStr.includes("refresh") ||
          onclickStr.includes("change") ||
          onclickStr.includes("reload")
        ) {
          return true;
        }
      }
      return false;
    });
    if (refreshBtn) {
      refreshBtn.click();
      addLog("已点击刷新按钮(模糊匹配)");
      await sleep(800);
      return;
    }

    // 方式3：兜底取页面最后一张图点击
    if (allImgs.length > 0) {
      try {
        allImgs[allImgs.length - 1].click();
        addLog("兜底点击最后一张图片尝试刷新验证码");
        await sleep(800);
        return;
      } catch (e) {}
    }

    addLog("未找到刷新验证码的方式，等待1秒...");
    await sleep(1000);
  }

  async function waitForUserCaptcha() {
    return new Promise((resolve) => {
      captchaResolver = resolve;
      const checkInterval = setInterval(() => {
        const input = document.getElementById("captcha-input");
        if (!input || !isRunning) {
          clearInterval(checkInterval);
          if (!isRunning) resolve("");
        }
      }, 500);
    });
  }

  async function handleLoginFlow(account) {
    const MAX_LOGIN_RETRIES = 3;
    let loginRetry = 0;
    // 面板的隐藏/恢复由 setupSmsDialogObserver 统一管理，此处不再操作

    try {
      while (loginRetry < MAX_LOGIN_RETRIES) {
        loginRetry++;

        // 多种方式寻找登录按钮
        let loginBtn =
          document.querySelector("a.loginbtn") ||
          document.querySelector(".loginbtn") ||
          document.querySelector(".login_btn") ||
          document.querySelector("#loginBtn") ||
          document.querySelector(".btn-login");
        // 兜底：通过文本找
        if (!loginBtn) {
          const allClickables = document.querySelectorAll(
            "a, button, div[class*=btn], span[class*=btn]",
          );
          for (const el of allClickables) {
            const text = (el.textContent || "").trim();
            if (text === "登 录" || text === "登录" || text === "立即登录") {
              loginBtn = el;
              break;
            }
          }
        }
        if (!loginBtn) {
          throw new Error("登录按钮未找到");
        }
        addLog(
          `找到登录按钮: <${loginBtn.tagName} class="${loginBtn.className || ""}">（第 ${loginRetry} 次登录尝试）`,
        );

        loginBtn.click();
        addLog("已点击登录按钮，等待结果...");

        // 等待登录结果（短信验证场景需要更长时间，最多 120 秒）
        let captchaError = false;
        let accountError = false;
        let smsDialogDetected = false;
        let smsWaitSeconds = 0;
        const MAX_SMS_WAIT_SECONDS = 180; // 短信验证最多等 3 分钟
        const MAX_NORMAL_WAIT_SECONDS = 60; // 普通登录最多等 60 秒

        for (
          let i = 0;
          i < MAX_NORMAL_WAIT_SECONDS + MAX_SMS_WAIT_SECONDS;
          i++
        ) {
          if (!isRunning) throw new Error("执行已停止");

          // 检查是否登录成功（跳转离开登录页）
          if (window.location.pathname !== "/cs/login.html") {
            addLog("登录成功，已跳转到主页");
            saveAccountCookie(account.account);
            return;
          }

          // ★ 检测短信验证弹窗（实页: #_DialogDiv_0fk，标题"登录短信验证"，内嵌 iframe loginSms.html）
          // 面板的隐藏/恢复由 setupSmsDialogObserver 即时处理，此处只负责登录流程控制
          // 但作为双重保险，检测到弹窗时也在此处强制隐藏
          const smsDialog = detectSmsVerifyDialog();
          if (smsDialog) {
            if (!smsDialogDetected) {
              smsDialogDetected = true;
              smsWaitSeconds = 0;
              addLog(`【短信验证】检测到登录短信验证弹窗: ${smsDialog.title}`);
              // 三重保险：强制内联样式隐藏 + 提高弹窗层级
              if (floatPanel) {
                floatPanel.style.setProperty("display", "none", "important");
                floatPanel.style.setProperty(
                  "visibility",
                  "hidden",
                  "important",
                );
                floatPanel.style.setProperty("left", "-9999px", "important");
                floatPanel.style.setProperty("top", "-9999px", "important");
                floatPanel.style.setProperty("z-index", "-1", "important");
                floatPanel.style.setProperty(
                  "pointer-events",
                  "none",
                  "important",
                );
                panelHiddenBySmsObserver = true;
                addLog("【短信验证】已三重保险隐藏悬浮面板");
              }
              // 双重保障：提高弹窗 z-index
              if (smsDialog.element) {
                smsDialog.element.style.setProperty(
                  "z-index",
                  "200000",
                  "important",
                );
              }
              // 显示桌面通知提示用户
              try {
                GM_notification({
                  title: "联通客服助手 - 需要短信验证",
                  text: `账号 ${account.account} 需要短信验证，请在弹窗中点击"获取验证码"，输入短信验证码后点击"验证"按钮`,
                  timeout: 8000,
                });
              } catch (e) {}
              updateCaptchaStatus(
                "等待短信验证：请在弹窗中 获取验证码→输入→验证",
              );
              showCaptchaSection(true);
            }
            smsWaitSeconds++;
            // 超过 3 分钟仍在短信验证，放弃等待
            if (smsWaitSeconds > MAX_SMS_WAIT_SECONDS) {
              addLog("【短信验证】等待超过 3 分钟，放弃当前账号");
              throw new Error("短信验证超时（用户未完成验证）");
            }
            // 每 30 秒提醒一次
            if (smsWaitSeconds % 30 === 0 && smsWaitSeconds > 0) {
              addLog(
                `【短信验证】已等待 ${smsWaitSeconds} 秒，仍在等待用户完成验证...`,
              );
            }
            // 等待用户在弹窗中完成验证（弹窗关闭后继续）
            await sleep(1000);
            continue;
          } else if (smsDialogDetected) {
            // 弹窗已关闭（用户完成了短信验证）
            addLog("【短信验证】短信验证弹窗已关闭，继续等待登录结果");
            smsDialogDetected = false;
            // 恢复内联样式
            if (floatPanel && panelHiddenBySmsObserver) {
              floatPanel.style.removeProperty("display");
              floatPanel.style.removeProperty("visibility");
              panelHiddenBySmsObserver = false;
              addLog("【短信验证】已恢复悬浮面板显示（双重保险）");
            }
            showCaptchaSection(false);
            // 弹窗关闭后多等一会，等服务器返回跳转
            await sleep(2000);
            continue;
          }

          // 普通登录等待超时检测（没短信弹窗时，60 秒未跳转即超时）
          if (i >= MAX_NORMAL_WAIT_SECONDS) {
            addLog(
              `普通登录等待 ${MAX_NORMAL_WAIT_SECONDS} 秒未跳转，判定失败`,
            );
            break;
          }

          // 检查是否停留在登录页，但验证码已被清空 = 登录失败（通常验证码错误）
          const captchaInput = document.querySelector(
            'input[name="verificationCode"]',
          );
          if (i >= 5 && captchaInput && !captchaInput.value && !captchaError) {
            // 验证码清空但页面未跳转 = 登录失败（无论是验证码还是账号密码问题）
            addLog(
              `检测到验证码被清空，登录失败（提交后${i}秒），尝试读取错误提示`,
            );
          }

          // 综合方式检测错误
          const errorResult = detectLoginErrorMessages();
          if (errorResult.type === "captcha") {
            addLog(
              `检测到验证码错误 [${errorResult.source}]（第 ${loginRetry} 次登录失败）`,
            );
            captchaError = true;
            break;
          }
          if (errorResult.type === "account") {
            addLog(`检测到账号密码错误 [${errorResult.source}]`);
            accountError = true;
            break;
          }

          // 检查"账号登录冲突确认"弹窗并自动点击确定
          const accountConfirmDialog = detectAccountConfirmDialog();
          if (accountConfirmDialog && accountConfirmDialog.okButton) {
            if (!accountConfirmDialog._clicked) {
              accountConfirmDialog._clicked = true;
              addLog(
                `【账号确认】检测到"账号已在其他地点登录"确认弹窗，自动点击"确定"`,
              );
              accountConfirmDialog.okButton.click();
            }
          }

          await sleep(1000);
        }

        if (accountError) {
          throw new Error("账号或密码错误");
        }

        // 如果是验证码错误，刷新验证码后重新填写并重试登录
        if (captchaError && loginRetry < MAX_LOGIN_RETRIES) {
          addLog("验证码错误，刷新验证码后重新识别...");
          // 清空验证码输入框
          const captchaInput = document.querySelector(
            'input[name="verificationCode"]',
          );
          if (captchaInput) {
            captchaInput.value = "";
            captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
          // 刷新验证码图片
          await refreshCaptcha();
          await sleep(1200);
          // 重新处理验证码（OCR + 人工兜底）
          await handleCaptcha();
          continue;
        }

        // 兜底：无跳转无明确错误但达到超时次数，也认为是失败
        if (loginRetry < MAX_LOGIN_RETRIES) {
          addLog(
            `登录无响应，尝试刷新验证码重发（${loginRetry}/${MAX_LOGIN_RETRIES}）`,
          );
          await refreshCaptcha();
          await sleep(1200);
          await handleCaptcha();
          continue;
        }

        if (captchaError) {
          throw new Error("验证码多次识别失败，请检查验证码类型");
        }
      }

      throw new Error("登录超时，超过最大重试次数");
    } finally {
      // 面板恢复由 setupDialogObserver 统一管理（弹窗关闭即恢复）
      // 此处确保流程结束时若所有弹窗已不在，面板一定可见（强制清除内联样式）
      if (
        panelHiddenBySmsObserver &&
        !detectSmsVerifyDialog() &&
        !detectAccountConfirmDialog()
      ) {
        floatPanel.style.removeProperty("display");
        floatPanel.style.removeProperty("visibility");
        floatPanel.style.removeProperty("left");
        floatPanel.style.removeProperty("top");
        floatPanel.style.removeProperty("z-index");
        floatPanel.style.removeProperty("pointer-events");
        floatPanel.removeAttribute("aria-hidden");
        panelHiddenBySmsObserver = false;
        addLog("【弹窗】登录流程结束，已恢复悬浮面板显示");
      }
    }
  }

  // 检测短信验证弹窗
  // 实页结构: <div id="_DialogDiv_0fk" class="dialog_main">
  //   标题 <span id="_Title_0fk">登录短信验证</span>
  //   iframe <iframe id="_DialogFrame_0fk" src="/cs/loginSms.html?...">
  //   验证按钮 <input id="_ButtonOK_0fk" value="验证">
  function detectSmsVerifyDialog() {
    // 方式1: 精确 ID 匹配（实页用）
    // Dialog ID 后缀会变（0fk/1fk/2fk...），用属性选择器
    const dialogById = document.querySelector(
      'div[id^="_DialogDiv_"][class*="dialog_main"]',
    );
    if (dialogById) {
      // 检查标题是否包含"短信"
      const title = dialogById.querySelector(
        'span[id^="_Title_"], .dialog_title span',
      );
      const titleText = title ? title.textContent.trim() : "";
      // 检查 iframe 是否是 loginSms.html
      const iframe = dialogById.querySelector(
        'iframe[id^="_DialogFrame_"], iframe[src*="loginSms"]',
      );
      const iframeSrc = iframe ? iframe.src || iframe.getAttribute("src") : "";

      if (
        titleText.includes("短信") ||
        titleText.includes("手机验证") ||
        titleText.includes("短信验证") ||
        iframeSrc.includes("loginSms") ||
        iframeSrc.includes("smsVerify")
      ) {
        return {
          element: dialogById,
          title: titleText,
          iframeSrc: iframeSrc,
        };
      }
    }

    // 方式2: 通过 iframe src 匹配
    const smsIframe = document.querySelector(
      'iframe[src*="loginSms"], iframe[src*="smsVerify"], iframe[src*="sms"]',
    );
    if (smsIframe) {
      // 找到包含该 iframe 的最外层 dialog
      let parent = smsIframe.parentElement;
      while (parent && parent !== document.body) {
        if (
          parent.className &&
          (parent.className.includes("dialog_main") ||
            parent.className.includes("dialog") ||
            parent.id.startsWith("_DialogDiv_"))
        ) {
          return {
            element: parent,
            title: "短信验证(iframe匹配)",
            iframeSrc: smsIframe.src,
          };
        }
        parent = parent.parentElement;
      }
      // 即使没找到外层 dialog，也返回 iframe 本身
      return {
        element: smsIframe,
        title: "短信验证(iframe)",
        iframeSrc: smsIframe.src,
      };
    }

    // 方式3: 通过弹窗标题文本匹配
    const allDialogs = document.querySelectorAll(
      '.dialog_main, .dialog, [class*="dialog_main"], [id^="_DialogDiv_"]',
    );
    for (const dlg of allDialogs) {
      const text = dlg.textContent || "";
      if (
        text.includes("登录短信验证") ||
        text.includes("手机短信验证") ||
        text.includes("短信验证码")
      ) {
        // 排除"忘记密码"那种自服务短信弹窗（看是否有 loginSms iframe）
        const hasIframe = dlg.querySelector('iframe[src*="loginSms"]');
        if (hasIframe || text.includes("登录短信验证")) {
          return {
            element: dlg,
            title: "短信验证(文本匹配)",
            iframeSrc: hasIframe ? hasIframe.src : "",
          };
        }
      }
    }

    return null;
  }

  // 检测"账号登录冲突确认"弹窗
  // 实页结构: <div id="_DialogDiv_0fk" class="dialog_main">
  //   标题 <span id="_Title_0fk">信息确认</span>
  //   内容 "您的账号已在其他地点登录或者上次没有正常退出，是否重新登录？"
  //   按钮 <input id="_ButtonOK_0fk" value=" 确 定 ">
  function detectAccountConfirmDialog() {
    const dialogById = document.querySelector(
      'div[id^="_DialogDiv_"][class*="dialog_main"]',
    );
    if (!dialogById) return null;

    const title = dialogById.querySelector(
      'span[id^="_Title_"], .dialog_title span',
    );
    const titleText = title ? title.textContent.trim() : "";
    const contentText = dialogById.textContent || "";

    // 标题是"信息确认"，且内容包含"重新登录"/"其他地点登录"/"上次没有正常退出"
    const isAccountConfirm =
      titleText.includes("信息确认") &&
      (contentText.includes("重新登录") ||
        contentText.includes("其他地点登录") ||
        contentText.includes("上次没有正常退出") ||
        contentText.includes("账号已在"));

    if (isAccountConfirm) {
      const okBtn = dialogById.querySelector(
        'input[id^="_ButtonOK_"], .fillbutton',
      );
      return {
        element: dialogById,
        title: titleText,
        content: contentText.substring(0, 80),
        okButton: okBtn,
      };
    }

    // 兜底：全文本匹配
    if (
      contentText.includes("账号已在其他地点登录") ||
      contentText.includes("上次没有正常退出")
    ) {
      const okBtn = dialogById.querySelector(
        'input[id^="_ButtonOK_"], .fillbutton',
      );
      return {
        element: dialogById,
        title: "信息确认(文本匹配)",
        content: contentText.substring(0, 80),
        okButton: okBtn,
      };
    }

    return null;
  }

  // 检测页面中多种形式的登录错误提示
  function detectLoginErrorMessages() {
    // 方式1：body 文本
    const bodyText = document.body ? document.body.innerText : "";
    const captchaKeywords = [
      "验证码错误",
      "验证码不正确",
      "验证码已失效",
      "验证码过期",
      "验证码无效",
      "图形验证码",
    ];
    for (const kw of captchaKeywords) {
      if (bodyText.includes(kw)) {
        return { type: "captcha", source: `bodyText:${kw}` };
      }
    }
    const accountKeywords = [
      "密码错误",
      "账号不存在",
      "用户名或密码",
      "用户名或口令",
      "账号或密码不正确",
      "账号被锁定",
      "账户被停用",
      "密码不正确",
    ];
    for (const kw of accountKeywords) {
      if (bodyText.includes(kw)) {
        return { type: "account", source: `bodyText:${kw}` };
      }
    }

    // 方式2：toast / dialog / error / message 弹窗
    const toastSelectors = [
      '[class*="toast"]',
      '[class*="errorBox"]',
      '[class*="error-box"]',
      '[class*="errorMsg"]',
      '[class*="error-msg"]',
      '[class*="tip-error"]',
      '[class*="message-error"]',
      '[class*="pop-error"]',
      '[id*="error"]',
      '[class*="tips"] [class*="err"]',
    ];
    for (const sel of toastSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const t = (el.textContent || "").trim();
        if (!t) continue;
        if (captchaKeywords.some((k) => t.includes(k))) {
          return {
            type: "captcha",
            source: `element(${sel}):${t.substring(0, 30)}`,
          };
        }
        if (accountKeywords.some((k) => t.includes(k))) {
          return {
            type: "account",
            source: `element(${sel}):${t.substring(0, 30)}`,
          };
        }
      }
    }

    // 方式3：表单字段 label 旁边的红色提示（label.error、span[validate]）
    const fieldError = document.querySelector(
      'label.error, span.error, .field-error, [class*="invalid"]',
    );
    if (fieldError) {
      const t = (fieldError.textContent || "").trim();
      if (captchaKeywords.some((k) => t.includes(k))) {
        return { type: "captcha", source: `fieldError:${t.substring(0, 30)}` };
      }
      if (accountKeywords.some((k) => t.includes(k))) {
        return { type: "account", source: `fieldError:${t.substring(0, 30)}` };
      }
    }

    return { type: "none", source: "" };
  }

  async function performOperations(account) {
    addLog("开始执行业务操作...");

    await sleep(2000);

    // TODO: 根据实际需求修改以下操作流程
    // 以下为示例操作，需要根据实际页面结构进行修改
    // 例如：
    // 1. 点击菜单
    // 2. 填写表单
    // 3. 查询数据
    // 4. 导出结果

    addLog("业务操作执行完成");
    return "业务操作完成";
  }

  async function logoutAndSwitch() {
    addLog("保存当前账号Cookie并切换...");

    // 保存当前账号Cookie
    if (currentAccountIndex >= 0 && currentAccountIndex < accounts.length) {
      saveAccountCookie(accounts[currentAccountIndex].account);
    }

    // 清除当前Cookie
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    window.location.href = "http://xx.xkf.unicom.local/cs/login.html";
    await sleep(2000);
  }

  async function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(checkInterval);
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`等待元素超时: ${selector}`));
        }
      }, 200);
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 仅在顶层窗口运行，避免在 iframe（如 loginSms.html 短信验证弹窗）内重复创建悬浮面板
  if (window.top === window.self) {
    // document-start 时 DOM 可能未就绪,延迟到 DOMContentLoaded 再初始化面板
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  } else {
    // iframe 内不创建面板，但可在此处添加针对 iframe 页面的逻辑（如需要）
    console.log("[联通客服助手] 在 iframe 内运行，跳过面板创建");
  }
})();
