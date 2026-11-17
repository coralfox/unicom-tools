// ==UserScript==
// @name         通通惠答自动化助手
// @namespace    http://tampermonkey.net/
// @version      4.6
// @description  定时自动执行通通惠答对话循环，含配置面板、进度追踪、保活机制
// @author       Coralfox,Trae
// @match        https://aiportal.chinaunicom.cn/portal/v1/page/modules/index/index.html
// @match        https://tongtong.chinaunicom.cn:8888/tongtong-web/*
// @match        https://aiportal.chinaunicom.cn/*
// @match        https://uac.sso.chinaunicom.cn/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        unsafeWindow
// @connect      aiportal.chinaunicom.cn
// @connect      tongtong.chinaunicom.cn
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ============================================================
  //  SECTION 1: 配置（所有可调整参数集中在此）
  // ============================================================
  const DEFAULTS = {
    // --- 页面URL ---
    OA_HOME_URL:
      "https://aiportal.chinaunicom.cn/portal/v1/page/modules/index/index.html",
    HUIXIE_URL_TEMPLATE:
      "https://tongtong.chinaunicom.cn:8888/tongtong-web/?sso={sso}#/chat",

    // --- 执行核心 ---
    MAX_COUNT: 1000, // 总循环次数
    ANSWER_TIMEOUT: 60, // 等待AI回答超时(秒)
    CYCLE_INTERVAL: 2, // 每轮间隔(秒)
    TYPE_DELAY: 25, // 打字延迟(ms)

    // --- 定时执行 ---
    SCHEDULE_ENABLED: true, // 是否启用定时
    SCHEDULE_TIME: "09:00", // 定时执行时间 HH:MM

    // --- 保活 ---
    KEEP_ALIVE_INTERVAL: 300, // 保活间隔(秒) — 每日任务完成后隔多久发一次问句

    // --- 惠答页面元素选择器 ---
    INPUT_SELECTOR: 'div.editor-content[contenteditable="true"]',
    SEND_BTN_SELECTOR: 'button.ant-btn.css-1p3hq3p[class*="bg-[#C20000]"]',

    // --- 通知配置 ---
    NOTIFY_TYPE: "none", // none / feishu / pushplus / dingtalk / custom
    NOTIFY_TIMEOUT: 300, // 等待超时(秒)
    NOTIFY_INTERVAL: 3, // 轮询间隔(秒)

    // 飞书
    FEISHU_WEBHOOK: "",

    // PushPlus
    PUSHPLUS_TOKEN: "",

    // 钉钉
    DINGTALK_WEBHOOK: "",
    DINGTALK_SECRET: "",

    // 自定义HTTP
    CUSTOM_NOTIFY_URL: "",
    CUSTOM_NOTIFY_HEADERS: "", // JSON格式请求头
    CUSTOM_NOTIFY_METHOD: "POST", // POST / GET

    // --- 其他 ---
    SSO_ID: "1783573766409",
    PHONE: "",
  };

  // 持久化存储的key
  const STORE = {
    CFG: "th_cfg", // 用户配置
    RUNNING: "th_running",
    PAUSED: "th_paused",
    COUNT: "th_count",
    ROUND: "th_round",
    PHASE: "th_phase",
    START_TIME: "th_start_time",
    SESSION_START_TIME: "th_session_start_time",
    LOGS: "th_logs",
    TAB_ID: "th_active_tab",
    TAB_TIME: "th_active_tab_time", // 标签锁时间戳
    SCHEDULE_TRIGGERED: "th_schedule_triggered", // 今日是否已触发
    STOPPED: "th_stopped", // 是否刚停止，用于下次启动时发送初始消息
    LAST_DATE: "th_last_date", // 上次启动日期，用于每日重置进度
  };

  // ============================================================
  //  SECTION 2: 问句库
  // ============================================================
  const QUESTIONS = [
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
    "请在120字以内解答：中国联通公共知识、总书记指示批示、二十届四中全会精神相关知识咨询。",
    "请在100字以内解答：提供流程挖掘、优化及治理体系构建问答。",
    "请在100字以内解答：提供不动产（建筑、土地、构筑物等）专业知识咨询。",
    "请在100字以内解答：提供管理域各系统操作手册和常见问题的知识咨询。",
    "请在80字以内解答：中国联通集团各专业线规章制度咨询。",
    "请在80字以内解答：供应链专业线知识咨询。",
    "请在80字以内解答：科技创新专业知识咨询。",
    "请在80字以内解答：党建、团务知识咨询。",
  ];

  // ============================================================
  //  SECTION 3: 运行时状态
  // ============================================================
  const MY_TAB_ID = Date.now() + "_" + Math.random().toString(36).substr(2, 8);

  const STATE = {
    running: false,
    paused: false,
    count: 0,
    round: 0,
    phase: "idle",
    log: [],
    startTime: null,
    sessionStartTime: null,
    lastActivity: Date.now(),
    keepAliveTimer: null,
    scheduleTimer: null,
    timeline: [], // 时间节点 [{label,ts}]
  };

  // 当前生效配置（从DEFAULTS + 持久化合并）
  let CFG = {};

  function loadConfig() {
    const saved = GM_getValue(STORE.CFG, {});
    CFG = Object.assign({}, DEFAULTS, saved);
  }

  function saveConfig() {
    GM_setValue(STORE.CFG, CFG);
  }

  function saveState() {
    GM_setValue(STORE.RUNNING, STATE.running);
    GM_setValue(STORE.PAUSED, STATE.paused);
    GM_setValue(STORE.COUNT, STATE.count);
    GM_setValue(STORE.ROUND, STATE.round);
    GM_setValue(STORE.PHASE, STATE.phase);
    GM_setValue(STORE.START_TIME, STATE.startTime);
    GM_setValue(STORE.SESSION_START_TIME, STATE.sessionStartTime);
    GM_setValue(STORE.LOGS, STATE.log.slice(-100));
    GM_setValue(STORE.TAB_ID, MY_TAB_ID);
    GM_setValue(STORE.TAB_TIME, Date.now());
  }

  function loadPersistedState() {
    STATE.running = GM_getValue(STORE.RUNNING, false);
    STATE.paused = GM_getValue(STORE.PAUSED, false);
    STATE.count = GM_getValue(STORE.COUNT, 0);
    STATE.round = GM_getValue(STORE.ROUND, 0);
    STATE.phase = GM_getValue(STORE.PHASE, "idle");
    STATE.startTime = GM_getValue(STORE.START_TIME, null);
    STATE.sessionStartTime = GM_getValue(STORE.SESSION_START_TIME, null);
    const savedLogs = GM_getValue(STORE.LOGS, []);
    if (savedLogs.length > 0) STATE.log = savedLogs;
  }

  function clearPersistedState() {
    GM_setValue(STORE.RUNNING, false);
    GM_setValue(STORE.PAUSED, false);
    GM_setValue(STORE.COUNT, 0);
    GM_setValue(STORE.ROUND, 0);
    GM_setValue(STORE.PHASE, "idle");
    GM_setValue(STORE.START_TIME, null);
    GM_setValue(STORE.SESSION_START_TIME, null);
    GM_setValue(STORE.TAB_ID, "");
    GM_setValue(STORE.TAB_TIME, 0);
  }

  function isMyTabActive() {
    const activeTab = GM_getValue(STORE.TAB_ID, "");
    if (activeTab === MY_TAB_ID || activeTab === "") return true;
    // 旧标签超过2分钟未更新，视为已失效，自动清除
    const lastTime = GM_getValue(STORE.TAB_TIME, 0);
    if (Date.now() - lastTime > 120000) {
      GM_setValue(STORE.TAB_ID, "");
      GM_setValue(STORE.TAB_TIME, 0);
      return true;
    }
    return false;
  }

  function claimTab() {
    GM_setValue(STORE.TAB_ID, MY_TAB_ID);
    GM_setValue(STORE.TAB_TIME, Date.now());
  }

  // ============================================================
  //  SECTION 4: 工具函数
  // ============================================================
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function randomQuestion() {
    return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  }

  function addLog(msg, level = "INFO") {
    const time = new Date().toLocaleTimeString();
    STATE.log.push({ time, msg, level });
    if (STATE.log.length > 200) STATE.log.shift();
    saveState();
    updateUI();
  }

  function setPhase(phase) {
    STATE.phase = phase;
    saveState();
    updateUI();
  }

  function setStatus(text) {
    const el = document.getElementById("th-status");
    if (el) el.textContent = text;
    // 同步浮动面板状态
    const fpStatus = document.getElementById("fp-status");
    if (fpStatus) {
      fpStatus.textContent = text;
      fpStatus.className = "fp-status";
      if (STATE.running && !STATE.paused) fpStatus.classList.add("running");
      else if (STATE.paused) fpStatus.classList.add("paused");
      else if (text.includes("完成")) fpStatus.classList.add("done");
      else fpStatus.classList.add("idle");
    }
    // 同步迷你模式状态颜色
    const panel = document.getElementById("th-panel");
    if (!panel || !panel.classList.contains("th-mini")) return;
    panel.classList.remove(
      "status-idle",
      "status-running",
      "status-paused",
      "status-error",
    );
    if (STATE.running && !STATE.paused) panel.classList.add("status-running");
    else if (STATE.paused) panel.classList.add("status-paused");
    else if (text.includes("错误") || text.includes("失败"))
      panel.classList.add("status-error");
    else panel.classList.add("status-idle");
  }

  // ============================================================
  //  SECTION 5: UI面板
  // ============================================================
  function createUI() {
    GM_addStyle(`
      #th-panel {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 340px;
        max-height: 92vh;
        overflow-y: auto;
        background: #1e1e2e;
        border: 1px solid #444;
        border-radius: 8px;
        color: #cdd6f4;
        font-size: 12px;
        font-family: 'Microsoft YaHei', sans-serif;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        padding: 0;
        transition: all 0.3s;
      }
      /* 迷你模式：圆形状态指示器 */
      #th-panel.th-mini {
        width: 52px; height: 52px; max-height: 52px;
        overflow: hidden; border-radius: 50%; cursor: pointer;
      }
      #th-panel.th-mini .th-header,
      #th-panel.th-mini .th-body { display: none !important; }
      /* toggle / 迷你按钮（完整模式） */
      #th-toggle {
        background: none; border: 1px solid #585b70; color: #a6adc8;
        font-size: 10px; cursor: pointer;
        height: 22px; line-height: 20px; text-align: center;
        padding: 0 8px; border-radius: 4px;
      }
      #th-toggle:hover { background: #313244; color: #cdd6f4; border-color: #89b4fa; }
      /* 迷你模式圆形按钮 */
      #th-panel.th-mini #th-toggle {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 52px; height: 52px; line-height: 52px;
        font-size: 11px; padding: 0; border: none;
        border-radius: 50%; color: #fff; font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      }
      /* 迷你状态颜色 */
      #th-panel.th-mini.status-idle #th-toggle { background: linear-gradient(135deg, #585b70, #6c7086); }
      #th-panel.th-mini.status-running #th-toggle { background: linear-gradient(135deg, #a6e3a1, #94e2d5); color: #1e1e2e; text-shadow: none; animation: th-pulse 2s infinite; }
      #th-panel.th-mini.status-paused #th-toggle { background: linear-gradient(135deg, #fab387, #f9e2af); color: #1e1e2e; text-shadow: none; }
      #th-panel.th-mini.status-error #th-toggle { background: linear-gradient(135deg, #f38ba8, #eba0ac); }
      @keyframes th-pulse {
        0%, 100% { box-shadow: 0 2px 12px rgba(166,227,161,0.4); }
        50% { box-shadow: 0 2px 20px rgba(166,227,161,0.7); }
      }
      .th-header {
        background: #313244; padding: 6px 10px;
        border-bottom: 1px solid #444;
        font-weight: bold; font-size: 13px;
        display: flex; align-items: center;
      }
      .th-header-title { flex: 1; white-space: nowrap; }
      .th-header-center { flex: 0 0 auto; }
      .th-header-right { flex: 0 0 auto; display: flex; align-items: center; gap: 4px; }
      .th-body { padding: 10px; }
      .th-section {
        margin-bottom: 8px; padding: 8px;
        background: #313244; border-radius: 6px;
      }
      .th-section h4 {
        margin: 0 0 6px 0; font-size: 11px;
        color: #a6adc8; text-transform: uppercase;
        cursor: pointer; user-select: none;
        display: flex; align-items: center; gap: 4px;
      }
      .th-section h4:hover { color: #cdd6f4; }
      .th-section-arrow {
        font-size: 10px; transition: transform 0.2s; margin-left: auto;
      }
      .th-section-arrow.collapsed { transform: rotate(-90deg); }
      .th-section-body { overflow: hidden; transition: max-height 0.3s; }
      .th-section-body.th-collapsed { max-height: 0 !important; display: none; }
      .th-row {
        display: flex; align-items: center;
        margin-bottom: 4px; gap: 6px;
      }
      .th-row label {
        min-width: 70px; font-size: 11px; color: #a6adc8;
      }
      .th-row input, .th-row select {
        flex: 1; background: #1e1e2e; border: 1px solid #585b70;
        color: #cdd6f4; padding: 3px 6px; border-radius: 4px;
        font-size: 11px; outline: none;
      }
      .th-row input:focus, .th-row select:focus { border-color: #89b4fa; }
      .th-row input[type="checkbox"] {
        flex: none; width: 14px; height: 14px; margin: 0;
      }
      .th-btn {
        padding: 10px 24px; border: none; border-radius: 6px;
        cursor: pointer; font-size: 14px; font-weight: bold;
        transition: all 0.2s; min-width: 80px;
      }
      .th-btn:active { transform: scale(0.96); }
      .th-btn-primary { background: #89b4fa; color: #1e1e2e; }
      .th-btn-primary:hover { background: #b4d0fb; }
      .th-btn-danger { background: #f38ba8; color: #1e1e2e; }
      .th-btn-danger:hover { background: #f5a0bd; }
      .th-btn-warn { background: #fab387; color: #1e1e2e; }
      .th-btn-warn:hover { background: #fbc49e; }
      .th-btn-success { background: #a6e3a1; color: #1e1e2e; }
      .th-btn-success:hover { background: #bceeb8; }
      .th-btn-sm { padding: 3px 8px; font-size: 10px; }
      .th-btn-group { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
      /* 浮动进度面板 */
      #th-float-progress {
        display: none; position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 420px; height: 400px;
        background: linear-gradient(145deg, rgba(24,24,37,0.97), rgba(30,30,46,0.97));
        border: 1px solid rgba(137,180,250,0.3);
        border-radius: 16px; padding: 18px 22px;
        z-index: 999999; font-family: 'Microsoft YaHei', sans-serif;
        font-size: 13px; color: #cdd6f4;
        box-shadow: 0 0 40px rgba(137,180,250,0.08), 0 12px 48px rgba(0,0,0,0.6);
        backdrop-filter: blur(16px);
        display: flex; flex-direction: column;
      }
      #th-float-progress .fp-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px; font-weight: bold; font-size: 15px;
        flex-shrink: 0;
      }
      #th-float-progress .fp-status {
        font-size: 12px; padding: 3px 10px; border-radius: 12px;
        font-weight: bold; letter-spacing: 1px;
      }
      .fp-status.idle { background: #585b70; color: #cdd6f4; }
      .fp-status.running { background: #a6e3a1; color: #1e1e2e; animation: fp-pulse 2s infinite; }
      .fp-status.paused { background: #fab387; color: #1e1e2e; }
      .fp-status.done { background: #89b4fa; color: #1e1e2e; }
      @keyframes fp-pulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(166,227,161,0.4); }
        50% { box-shadow: 0 0 0 6px rgba(166,227,161,0); }
      }
      #th-float-progress .fp-section-label {
        font-size: 10px; color: #6c7086; margin: 6px 0 2px;
        text-transform: uppercase; letter-spacing: 1px;
        flex-shrink: 0;
      }
      #th-float-progress .fp-bar-wrap {
        width: 100%; height: 10px; background: rgba(255,255,255,0.05);
        border-radius: 5px; overflow: hidden; margin: 4px 0;
        flex-shrink: 0;
      }
      #th-float-progress .fp-bar {
        height: 100%; background: linear-gradient(90deg, #89b4fa, #a6e3a1);
        border-radius: 5px; transition: width 0.5s;
        box-shadow: 0 0 8px rgba(137,180,250,0.3);
      }
      #th-float-progress .fp-info {
        display: flex; justify-content: space-between; font-size: 11px;
        color: #a6adc8; margin: 3px 0 4px 0;
        flex-shrink: 0;
      }
      #th-float-progress .fp-steps {
        display: flex; align-items: flex-start; justify-content: space-between;
        margin: 6px 0; flex-shrink: 0; position: relative;
      }
      #th-float-progress .fp-steps::before {
        content: ''; position: absolute; top: 10px; left: 10%; right: 10%;
        height: 2px; background: #313244; z-index: 0;
      }
      #th-float-progress .fp-step {
        display: flex; flex-direction: column; align-items: center;
        position: relative; z-index: 1; flex: 1;
      }
      #th-float-progress .fp-step-dot {
        width: 20px; height: 20px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: bold; color: #fff;
        background: #313244; border: 2px solid #585b70;
        transition: all 0.3s;
      }
      #th-float-progress .fp-step.done .fp-step-dot {
        background: #89b4fa; border-color: #89b4fa;
        box-shadow: 0 0 8px rgba(137,180,250,0.4);
      }
      #th-float-progress .fp-step.active .fp-step-dot {
        background: #fab387; border-color: #fab387;
        box-shadow: 0 0 8px rgba(250,179,135,0.4);
        animation: fp-dot-pulse 1.5s infinite;
      }
      @keyframes fp-dot-pulse {
        0%,100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
      #th-float-progress .fp-step-label {
        font-size: 10px; color: #6c7086; margin-top: 4px;
        white-space: nowrap;
      }
      #th-float-progress .fp-step.done .fp-step-label { color: #89b4fa; }
      #th-float-progress .fp-step.active .fp-step-label { color: #fab387; font-weight: bold; }
      #th-float-progress .fp-log {
        flex: 1; overflow-y: auto;
        font-family: Consolas, monospace; font-size: 11px; line-height: 1.6;
        color: #6c7086; border-top: 1px solid rgba(255,255,255,0.06);
        padding-top: 6px; margin-top: 4px;
      }
      #th-float-progress .fp-log::-webkit-scrollbar { width: 3px; }
      #th-float-progress .fp-log::-webkit-scrollbar-thumb { background: #45475a; border-radius: 2px; }
      #th-float-progress .fp-log .log-INFO { color: #89b4fa; }
      #th-float-progress .fp-log .log-SUCCESS { color: #a6e3a1; }
      #th-float-progress .fp-log .log-WARN { color: #fab387; }
      #th-float-progress .fp-log .log-ERROR { color: #f38ba8; }
      #th-float-progress .fp-log .log-ACTION { color: #cba6f7; }
      .th-progress-wrap {
        width: 100%; height: 18px;
        background: #1e1e2e; border-radius: 9px;
        overflow: hidden; margin: 6px 0; position: relative;
      }
      .th-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #89b4fa, #a6e3a1);
        border-radius: 9px; transition: width 0.5s;
      }
      .th-progress-text {
        position: absolute; top: 0; left: 0; right: 0;
        line-height: 18px; text-align: center;
        font-size: 10px; font-weight: bold;
        text-shadow: 0 0 2px rgba(0,0,0,0.5);
      }
      .log-INFO { color: #89b4fa; }
      .log-SUCCESS { color: #a6e3a1; }
      .log-WARN { color: #fab387; }
      .log-ERROR { color: #f38ba8; }
      .log-ACTION { color: #cba6f7; }
      /* 设置模态面板 */
      #th-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000000; }
      .th-modal-overlay { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(0,0,0,0.6); }
      .th-modal-content { width: 400px; max-height: 85vh; overflow-y: auto; background: #1e1e2e; border: 1px solid #444; border-radius: 10px; color: #cdd6f4; font-size: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
      .th-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #313244; border-bottom: 1px solid #444; font-weight: bold; font-size: 13px; border-radius: 10px 10px 0 0; }
      .th-modal-body { padding: 12px; }
      .th-modal-footer { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid #444; justify-content: flex-end; }
      .th-notify-group { display: none; }
      .th-notify-group.th-notify-show { display: block; }
    `);

    const panel = document.createElement("div");
    panel.id = "th-panel";
    panel.innerHTML = `
      <!-- 顶部栏：标题 | 状态 | 设置 | 迷你 -->
      <div class="th-header">
        <span class="th-header-title">🤖 通通惠答自动化</span>
        <span class="th-header-center" id="th-status" style="font-size:13px;color:#a6e3a1;font-weight:bold">就绪</span>
        <div class="th-header-right">
          <button id="th-btn-settings" style="background:none;border:1px solid #585b70;color:#a6adc8;font-size:10px;cursor:pointer;padding:2px 6px;border-radius:3px">⚙️ 设置</button>
          <button id="th-toggle" title="迷你">迷你</button>
        </div>
      </div>
      <div class="th-body">

        <!-- 进度（可折叠） -->
        <div class="th-section">
          <h4 data-section="progress">📊 进度 <span class="th-section-arrow">▼</span></h4>
          <div class="th-section-body" id="th-sec-progress">
            <div class="th-progress-wrap">
              <div class="th-progress-bar" id="th-progress" style="width:0%"></div>
              <div class="th-progress-text" id="th-progress-text">0 / ${CFG.MAX_COUNT}</div>
            </div>
            <div class="th-row">
              <label>已完成:</label>
              <span id="th-count">0</span>
              <span style="margin-left:auto;font-size:10px;color:#a6adc8">
                剩余 <span id="th-remain-count" style="color:#fab387">0</span> 轮
              </span>
            </div>
            <div class="th-row">
              <label>剩余时间:</label>
              <span id="th-eta" style="font-size:10px;color:#a6e3a1">--</span>
            </div>
            <div class="th-row">
              <label>当前轮:</label>
              <span id="th-round">0</span>
              <span style="margin-left:auto;font-size:10px" id="th-phase">空闲</span>
            </div>
            <div class="th-row">
              <label>下次定时:</label>
              <span id="th-next-schedule" style="font-size:10px;color:#fab387">--</span>
            </div>
          </div>
        </div>

        <!-- 控制（可折叠） -->
        <div class="th-section">
          <h4 data-section="control">🎮 控制 <span class="th-section-arrow">▼</span></h4>
          <div class="th-section-body" id="th-sec-control">
            <div class="th-btn-group">
              <button class="th-btn th-btn-primary" id="th-btn-start">▶ 开始</button>
              <button class="th-btn th-btn-warn" id="th-btn-pause">⏸ 暂停</button>
              <button class="th-btn th-btn-danger" id="th-btn-stop">⏹ 停止</button>
            </div>

          </div>
        </div>

        <!-- 快捷操作（可折叠） -->
        <div class="th-section">
          <h4 data-section="nav">🚀 快捷操作 <span class="th-section-arrow">▼</span></h4>
          <div class="th-section-body" id="th-sec-nav">
            <div class="th-btn-group" style="gap:6px">
              <button class="th-btn th-btn-sm" id="th-btn-oa" style="flex:1;background:linear-gradient(135deg,#585b70,#45475a);color:#cdd6f4;border:1px solid #6c7086;box-shadow:0 1px 3px rgba(0,0,0,0.2)">🏠 打开OA</button>
              <button class="th-btn th-btn-sm" id="th-btn-huixie" style="flex:1;background:linear-gradient(135deg,#585b70,#45475a);color:#cdd6f4;border:1px solid #6c7086;box-shadow:0 1px 3px rgba(0,0,0,0.2)">✍️ 打开惠答</button>
            </div>
          </div>
        </div>

      </div>
    `;
    document.body.appendChild(panel);

    // ---- 浮动进度面板 ----
    const floatProg = document.createElement("div");
    floatProg.id = "th-float-progress";
    floatProg.innerHTML = `
      <div class="fp-header">
        <span>🤖 通通惠答自动化</span>
        <span class="fp-status idle" id="fp-status">就绪</span>
      </div>
      <div class="fp-section-label">问答进度</div>
      <div class="fp-bar-wrap"><div class="fp-bar" id="fp-bar" style="width:0%"></div></div>
      <div class="fp-info">
        <span id="fp-count">已完成 0 / 剩余 0</span>
        <span id="fp-round">轮次: 0</span>
      </div>
      <div class="fp-section-label">时间节点</div>
      <div class="fp-steps" id="fp-timeline">
        <div class="fp-step"><div class="fp-step-dot">1</div><div class="fp-step-label">发问</div></div>
        <div class="fp-step"><div class="fp-step-dot">2</div><div class="fp-step-label">回答完成</div></div>
        <div class="fp-step"><div class="fp-step-dot">3</div><div class="fp-step-label">停止动画</div></div>
        <div class="fp-step"><div class="fp-step-dot">4</div><div class="fp-step-label">下一轮</div></div>
      </div>
      <div class="fp-section-label">时间进度</div>
      <div class="fp-bar-wrap" style="background:rgba(255,255,255,0.05)">
        <div class="fp-bar" id="fp-time-bar" style="width:0%;background:linear-gradient(90deg,#fab387,#f9e2af);box-shadow:0 0 8px rgba(250,179,135,0.3)"></div>
      </div>
      <div class="fp-info">
        <span id="fp-elapsed">已用 --</span>
        <span id="fp-eta">剩余 --</span>
      </div>
      <div class="fp-log" id="fp-log"></div>
    `;
    document.body.appendChild(floatProg);

    // ---- 设置模态面板 ----
    const modal = document.createElement("div");
    modal.id = "th-modal";
    modal.innerHTML = `
      <div class="th-modal-overlay" id="th-modal-overlay">
        <div class="th-modal-content">
          <div class="th-modal-header">
            <span>⚙️ 设置</span>
            <button id="th-modal-close" style="background:none;border:1px solid #585b70;color:#a6adc8;font-size:14px;cursor:pointer;padding:2px 6px;border-radius:3px">✕</button>
          </div>
          <div class="th-modal-body">
            <div class="th-section" style="margin-bottom:10px">
              <h4>⚙️ 基础配置</h4>
              <div class="th-section-body">
                <div class="th-row"><label>手机号:</label><input type="text" id="th-phone" placeholder="OA登录手机号"></div>
                <div class="th-row"><label>验证码:</label><input type="text" id="th-code" placeholder="登录验证码"></div>
                <div class="th-row"><label>SSO ID:</label><input type="text" id="th-sso" placeholder="7位数字" maxlength="7" style="flex:1"><button class="th-btn th-btn-sm" id="th-btn-random-sso" style="background:#585b70;color:#cdd6f4;flex:none;padding:3px 8px;font-size:10px">🎲 随机</button></div>
              </div>
            </div>
            <div class="th-section" style="margin-bottom:10px">
              <h4>📢 通知配置</h4>
              <div class="th-section-body">
                <div class="th-row"><label>通知方式:</label>
                  <select id="th-notify-type">
                    <option value="none" ${CFG.NOTIFY_TYPE === "none" ? "selected" : ""}>关闭</option>
                    <option value="feishu" ${CFG.NOTIFY_TYPE === "feishu" ? "selected" : ""}>飞书</option>
                    <option value="pushplus" ${CFG.NOTIFY_TYPE === "pushplus" ? "selected" : ""}>PushPlus</option>
                    <option value="dingtalk" ${CFG.NOTIFY_TYPE === "dingtalk" ? "selected" : ""}>钉钉</option>
                    <option value="custom" ${CFG.NOTIFY_TYPE === "custom" ? "selected" : ""}>自定义HTTP</option>
                  </select>
                </div>
                <div style="font-size:10px;color:#6c7086;margin:-2px 0 6px 76px">选择通知方式后将显示对应的配置项（Token/Webhook等）</div>
                <div class="th-row"><label>等待超时(s):</label><input type="number" id="th-notify-timeout" min="10" max="900" value="${CFG.NOTIFY_TIMEOUT}"></div>
                <div class="th-row"><label>轮询间隔(s):</label><input type="number" id="th-notify-interval" min="1" max="60" value="${CFG.NOTIFY_INTERVAL}"></div>
                <!-- 飞书 -->
                <div class="th-notify-group" data-notify="feishu">
                  <div class="th-row"><label>飞书Webhook:</label><input type="text" id="th-feishu-webhook" placeholder="群机器人Webhook地址"></div>
                </div>
                <!-- PushPlus -->
                <div class="th-notify-group" data-notify="pushplus">
                  <div class="th-row"><label>PushPlus Token:</label><input type="text" id="th-pushplus-token" placeholder="PushPlus用户Token"></div>
                </div>
                <!-- 钉钉 -->
                <div class="th-notify-group" data-notify="dingtalk">
                  <div class="th-row"><label>钉钉Webhook:</label><input type="text" id="th-dingtalk-webhook" placeholder="群机器人Webhook地址"></div>
                  <div class="th-row"><label>钉钉密钥:</label><input type="text" id="th-dingtalk-secret" placeholder="签名密钥（可选）"></div>
                </div>
                <!-- 自定义 -->
                <div class="th-notify-group" data-notify="custom">
                  <div class="th-row"><label>通知URL:</label><input type="text" id="th-custom-url" placeholder="HTTP接口地址"></div>
                  <div class="th-row"><label>请求方式:</label>
                    <select id="th-custom-method">
                      <option value="POST" ${CFG.CUSTOM_NOTIFY_METHOD === "POST" ? "selected" : ""}>POST</option>
                      <option value="GET" ${CFG.CUSTOM_NOTIFY_METHOD === "GET" ? "selected" : ""}>GET</option>
                    </select>
                  </div>
                  <div class="th-row"><label>请求头(JSON):</label><input type="text" id="th-custom-headers" placeholder='{"Authorization":"Bearer xxx"}'></div>
                </div>
              </div>
            </div>
            <div class="th-section">
              <h4>🔧 执行配置</h4>
              <div class="th-section-body">
                <div class="th-row"><label>总次数:</label><input type="number" id="th-cfg-max" min="1" max="9999" value="${CFG.MAX_COUNT}"></div>
                <div class="th-row"><label>回答超时(s):</label><input type="number" id="th-cfg-timeout" min="5" max="300" value="${CFG.ANSWER_TIMEOUT}"></div>
                <div class="th-row"><label>轮间隔(s):</label><input type="number" id="th-cfg-interval" min="1" max="60" value="${CFG.CYCLE_INTERVAL}"></div>
                <div class="th-row"><label>定时执行:</label><input type="checkbox" id="th-cfg-schedule-en" ${CFG.SCHEDULE_ENABLED ? "checked" : ""}><input type="time" id="th-cfg-schedule-time" value="${CFG.SCHEDULE_TIME}" style="flex:1"></div>
              </div>
            </div>
          </div>
          <div class="th-modal-footer">
            <button class="th-btn th-btn-primary" id="th-cfg-save">💾 保存</button>
            <button class="th-btn" id="th-modal-cancel" style="background:#585b70;color:#cdd6f4">取消</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // ---- 每个区域的折叠功能 ----
    panel.querySelectorAll(".th-section h4").forEach((h4) => {
      h4.addEventListener("click", () => {
        const sectionName = h4.getAttribute("data-section");
        const body = document.getElementById("th-sec-" + sectionName);
        const arrow = h4.querySelector(".th-section-arrow");
        if (body) {
          body.classList.toggle("th-collapsed");
          if (arrow) arrow.classList.toggle("collapsed");
        }
      });
    });

    // ---- 模式切换：完整 / 迷你 ----
    const toggleBtn = document.getElementById("th-toggle");

    function setMode(mode) {
      panel.classList.remove(
        "th-mini",
        "status-idle",
        "status-running",
        "status-paused",
        "status-error",
      );
      if (mode === "mini") {
        panel.classList.add("th-mini");
        toggleBtn.textContent = "展开";
        // 设置运行状态颜色
        if (STATE.running && !STATE.paused)
          panel.classList.add("status-running");
        else if (STATE.paused) panel.classList.add("status-paused");
        else if (STATE.running && STATE.count >= CFG.MAX_COUNT)
          panel.classList.add("status-running");
        else panel.classList.add("status-idle");
      }
      GM_setValue("th_panel_mode", mode);
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMode(panel.classList.contains("th-mini") ? "show" : "mini");
    });

    // 迷你模式下点击面板也切回完整模式
    panel.addEventListener("click", (e) => {
      if (panel.classList.contains("th-mini")) {
        e.stopPropagation();
        setMode("show");
      }
    });

    // 恢复上次模式
    setMode(GM_getValue("th_panel_mode", "show"));

    // ---- 模态面板打开/关闭 ----
    function openModal() {
      modal.style.display = "block";
    }
    function closeModal() {
      modal.style.display = "none";
    }
    document
      .getElementById("th-btn-settings")
      .addEventListener("click", openModal);
    document
      .getElementById("th-modal-close")
      .addEventListener("click", closeModal);
    document
      .getElementById("th-modal-cancel")
      .addEventListener("click", closeModal);
    document
      .getElementById("th-modal-overlay")
      .addEventListener("click", (e) => {
        if (e.target === document.getElementById("th-modal-overlay"))
          closeModal();
      });

    // ---- 业务事件绑定 ----
    document
      .getElementById("th-btn-start")
      .addEventListener("click", startAutomation);
    document
      .getElementById("th-btn-pause")
      .addEventListener("click", togglePause);
    document
      .getElementById("th-btn-stop")
      .addEventListener("click", stopAutomation);
    document.getElementById("th-btn-oa").addEventListener("click", () => {
      window.location.href = CFG.OA_HOME_URL;
    });
    document.getElementById("th-btn-huixie").addEventListener("click", () => {
      const url = CFG.HUIXIE_URL_TEMPLATE.replace("{sso}", CFG.SSO_ID);
      window.open(url, "tongtong_chat");
    });
    document
      .getElementById("th-btn-random-sso")
      .addEventListener("click", () => {
        const randomId = String(Math.floor(1000000 + Math.random() * 9000000));
        document.getElementById("th-sso").value = randomId;
        addLog(`SSO ID已随机生成: ${randomId}`, "INFO");
      });
    document
      .getElementById("th-cfg-save")
      .addEventListener("click", saveSettings);

    // 加载保存值到输入框
    document.getElementById("th-phone").value = CFG.PHONE || "";
    document.getElementById("th-sso").value = CFG.SSO_ID;
    document.getElementById("th-feishu-webhook").value =
      CFG.FEISHU_WEBHOOK || "";
    document.getElementById("th-pushplus-token").value =
      CFG.PUSHPLUS_TOKEN || "";
    document.getElementById("th-dingtalk-webhook").value =
      CFG.DINGTALK_WEBHOOK || "";
    document.getElementById("th-dingtalk-secret").value =
      CFG.DINGTALK_SECRET || "";
    document.getElementById("th-custom-url").value =
      CFG.CUSTOM_NOTIFY_URL || "";
    document.getElementById("th-custom-method").value =
      CFG.CUSTOM_NOTIFY_METHOD || "POST";
    document.getElementById("th-custom-headers").value =
      CFG.CUSTOM_NOTIFY_HEADERS || "";

    // ---- 通知方式切换显示对应配置 ----
    function updateNotifyFields() {
      const type = document.getElementById("th-notify-type").value;
      document.querySelectorAll(".th-notify-group").forEach((g) => {
        g.classList.toggle("th-notify-show", g.dataset.notify === type);
      });
    }
    document
      .getElementById("th-notify-type")
      .addEventListener("change", updateNotifyFields);
    // 初始显示
    updateNotifyFields();
  } // end createUI

  // ============================================================
  //  SECTION 6: 更新UI
  // ============================================================
  function updateUI() {
    const pct = Math.min(100, (STATE.count / CFG.MAX_COUNT) * 100);
    const bar = document.getElementById("th-progress");
    const text = document.getElementById("th-progress-text");
    const countEl = document.getElementById("th-count");
    const roundEl = document.getElementById("th-round");
    const phaseEl = document.getElementById("th-phase");
    const etaEl = document.getElementById("th-eta");
    const scheduleEl = document.getElementById("th-next-schedule");

    const remainCount = CFG.MAX_COUNT - STATE.count;
    if (bar) bar.style.width = pct + "%";
    if (text) text.textContent = `${STATE.count} / ${CFG.MAX_COUNT}`;
    if (countEl) countEl.textContent = STATE.count;
    const remainCountEl = document.getElementById("th-remain-count");
    if (remainCountEl) remainCountEl.textContent = remainCount;
    if (roundEl) roundEl.textContent = STATE.round;
    if (phaseEl) {
      const names = {
        idle: "空闲",
        login: "登录中",
        navigate: "导航中",
        chat: "对话中",
        keepalive: "保活中",
      };
      phaseEl.textContent = names[STATE.phase] || STATE.phase;
    }
    // 剩余时间：基于历史平均每轮 × 剩余轮次
    if (etaEl) {
      if (STATE.startTime && STATE.count > 0) {
        const elapsed = Date.now() - STATE.startTime;
        const perItem = elapsed / STATE.count;
        const remainSec = Math.floor((remainCount * perItem) / 1000);
        etaEl.textContent = formatTime(remainSec);
      } else {
        etaEl.textContent = "--";
      }
    }
    // 下次定时倒计时
    if (scheduleEl) {
      if (CFG.SCHEDULE_ENABLED && CFG.SCHEDULE_TIME) {
        const now = new Date();
        const [h, m] = CFG.SCHEDULE_TIME.split(":").map(Number);
        let next = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          h,
          m,
          0,
        );
        if (next <= now) next.setDate(next.getDate() + 1);
        const diffSec = Math.floor((next - now) / 1000);
        scheduleEl.textContent = `倒计时 ${formatTime(diffSec)}`;
      } else {
        scheduleEl.textContent = "未启用";
      }
    }

    // 更新浮动进度面板
    updateFloatProgress(pct);
  }

  function updateFloatProgress(pct) {
    const fp = document.getElementById("th-float-progress");
    if (!fp) return;
    fp.style.display = STATE.running || STATE.paused ? "flex" : "none";
    const bar = document.getElementById("fp-bar");
    if (bar) bar.style.width = pct + "%";
    const remainCount = CFG.MAX_COUNT - STATE.count;
    const countEl = document.getElementById("fp-count");
    if (countEl)
      countEl.textContent = `已完成 ${STATE.count} / 剩余 ${remainCount}`;
    const roundEl = document.getElementById("fp-round");
    if (roundEl) roundEl.textContent = `轮次: ${STATE.round}`;

    // 时间节点 — 步骤进度条
    const timelineEl = document.getElementById("fp-timeline");
    if (timelineEl) {
      const stepNames = ["发问", "回答完成", "停止动画", "下一轮"];
      const doneSet = new Set((STATE.timeline || []).map((n) => n.label));
      let activeIdx = stepNames.findIndex((s) => !doneSet.has(s));
      if (activeIdx === -1) activeIdx = stepNames.length - 1;
      timelineEl.innerHTML = stepNames
        .map((name, i) => {
          let cls = "";
          if (doneSet.has(name)) cls = "done";
          else if (i === activeIdx) cls = "active";
          const dot = doneSet.has(name) ? "✓" : i + 1;
          const ts = (STATE.timeline || []).find((n) => n.label === name);
          const timeStr = ts
            ? `<br><span style="font-size:9px;color:#585b70">${formatTimeHMS(ts.ts)}</span>`
            : "";
          return `<div class="fp-step ${cls}"><div class="fp-step-dot">${dot}</div><div class="fp-step-label">${name}${timeStr}</div></div>`;
        })
        .join("");
    }

    // 时间进度条：已用时间 = 本次(session)，剩余时间 = 历史平均 × 剩余
    const timeBar = document.getElementById("fp-time-bar");
    const elapsedEl = document.getElementById("fp-elapsed");
    const etaEl = document.getElementById("fp-eta");
    // 本次已用时间
    if (STATE.sessionStartTime) {
      const sessionElapsed = Math.floor(
        (Date.now() - STATE.sessionStartTime) / 1000,
      );
      if (elapsedEl)
        elapsedEl.textContent = `已用 ${formatTime(sessionElapsed)}`;
    } else {
      if (elapsedEl) elapsedEl.textContent = "已用 --";
    }
    // 剩余时间（基于历史平均）
    if (STATE.startTime && STATE.count > 0) {
      const totalElapsed = Date.now() - STATE.startTime;
      const perItem = totalElapsed / STATE.count;
      const remainSec = Math.floor((remainCount * perItem) / 1000);
      if (etaEl) etaEl.textContent = `剩余 ${formatTime(remainSec)}`;
      // 时间进度条：本次已用 / (本次已用 + 预估剩余)
      if (STATE.sessionStartTime) {
        const sessionElapsed = Date.now() - STATE.sessionStartTime;
        const sessionRemain = remainSec * 1000;
        const totalSession = sessionElapsed + sessionRemain;
        const timePct =
          totalSession > 0
            ? Math.min(100, (sessionElapsed / totalSession) * 100)
            : 0;
        if (timeBar) timeBar.style.width = timePct + "%";
      }
    } else {
      if (etaEl) etaEl.textContent = "剩余 --";
      if (timeBar) timeBar.style.width = "0%";
    }

    // 浮动日志：显示最近3条
    const logEl = document.getElementById("fp-log");
    if (logEl) {
      const recent = STATE.log.slice(-5);
      logEl.innerHTML = recent
        .map((l) => `<div class="log-${l.level}">[${l.time}] ${l.msg}</div>`)
        .join("");
    }
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}小时${m}分钟`;
    if (m > 0) return `${m}分钟${s}秒`;
    return `${s}秒`;
  }

  function formatTimeHMS(ts) {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // ============================================================
  //  SECTION 6.5: 配置读写
  // ============================================================
  function saveSettings() {
    CFG.MAX_COUNT =
      parseInt(document.getElementById("th-cfg-max").value) || 1000;
    CFG.ANSWER_TIMEOUT =
      parseInt(document.getElementById("th-cfg-timeout").value) || 60;
    CFG.CYCLE_INTERVAL =
      parseInt(document.getElementById("th-cfg-interval").value) || 5;
    CFG.SCHEDULE_ENABLED =
      document.getElementById("th-cfg-schedule-en").checked;
    CFG.SCHEDULE_TIME =
      document.getElementById("th-cfg-schedule-time").value || "09:00";
    CFG.PHONE = document.getElementById("th-phone").value.trim();
    CFG.SSO_ID =
      document.getElementById("th-sso").value.trim() || "1783573766409";
    // 通知配置
    CFG.NOTIFY_TYPE = document.getElementById("th-notify-type").value;
    CFG.NOTIFY_TIMEOUT =
      parseInt(document.getElementById("th-notify-timeout").value) || 300;
    CFG.NOTIFY_INTERVAL =
      parseInt(document.getElementById("th-notify-interval").value) || 3;
    CFG.FEISHU_WEBHOOK = document
      .getElementById("th-feishu-webhook")
      .value.trim();
    CFG.PUSHPLUS_TOKEN = document
      .getElementById("th-pushplus-token")
      .value.trim();
    CFG.DINGTALK_WEBHOOK = document
      .getElementById("th-dingtalk-webhook")
      .value.trim();
    CFG.DINGTALK_SECRET = document
      .getElementById("th-dingtalk-secret")
      .value.trim();
    CFG.CUSTOM_NOTIFY_URL = document
      .getElementById("th-custom-url")
      .value.trim();
    CFG.CUSTOM_NOTIFY_METHOD =
      document.getElementById("th-custom-method").value;
    CFG.CUSTOM_NOTIFY_HEADERS = document
      .getElementById("th-custom-headers")
      .value.trim();
    saveConfig();
    addLog("配置已保存", "SUCCESS");
    updateUI();
    const modalEl = document.getElementById("th-modal");
    if (modalEl) modalEl.style.display = "none";
  }

  function resetSettings() {
    CFG = Object.assign({}, DEFAULTS);
    saveConfig();
    document.getElementById("th-cfg-max").value = CFG.MAX_COUNT;
    document.getElementById("th-cfg-timeout").value = CFG.ANSWER_TIMEOUT;
    document.getElementById("th-cfg-interval").value = CFG.CYCLE_INTERVAL;
    document.getElementById("th-cfg-schedule-en").checked =
      CFG.SCHEDULE_ENABLED;
    document.getElementById("th-cfg-schedule-time").value = CFG.SCHEDULE_TIME;
    document.getElementById("th-phone").value = CFG.PHONE || "";
    document.getElementById("th-sso").value = CFG.SSO_ID;
    document.getElementById("th-notify-type").value = CFG.NOTIFY_TYPE;
    document.getElementById("th-notify-timeout").value = CFG.NOTIFY_TIMEOUT;
    document.getElementById("th-notify-interval").value = CFG.NOTIFY_INTERVAL;
    document.getElementById("th-feishu-webhook").value =
      CFG.FEISHU_WEBHOOK || "";
    document.getElementById("th-pushplus-token").value =
      CFG.PUSHPLUS_TOKEN || "";
    document.getElementById("th-dingtalk-webhook").value =
      CFG.DINGTALK_WEBHOOK || "";
    document.getElementById("th-dingtalk-secret").value =
      CFG.DINGTALK_SECRET || "";
    document.getElementById("th-custom-url").value =
      CFG.CUSTOM_NOTIFY_URL || "";
    document.getElementById("th-custom-method").value =
      CFG.CUSTOM_NOTIFY_METHOD || "POST";
    document.getElementById("th-custom-headers").value =
      CFG.CUSTOM_NOTIFY_HEADERS || "";
    // 触发通知字段显示更新
    document
      .getElementById("th-notify-type")
      .dispatchEvent(new Event("change"));
    addLog("配置已恢复默认", "WARN");
    const modalEl = document.getElementById("th-modal");
    if (modalEl) modalEl.style.display = "none";
  }

  // ============================================================
  //  SECTION 7: 页面操作
  // ============================================================
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error("未找到"));
      }, timeout);
    });
  }

  function findElementByText(text) {
    const all = document.querySelectorAll(
      'button, a, span, div, p, li, input, label, [role="button"], [role="tab"], [role="menuitem"]',
    );
    for (const el of all) {
      const t = el.textContent?.trim() || "";
      if (t.includes(text) && t.length < 100) return el;
    }
    return null;
  }

  function findClickableByText(text) {
    const btns = document.querySelectorAll(
      'button, a, [role="button"], [role="tab"], input[type="button"]',
    );
    for (const el of btns) {
      const t = el.textContent?.trim() || "";
      if (t.includes(text) && t.length < 50) return el;
    }
    return findElementByText(text);
  }

  async function typeText(el, text) {
    el.focus();
    el.click();
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(el, "");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await delay(CFG.TYPE_DELAY);
    for (const char of text) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        ).set;
        setter.call(el, el.value + char);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        document.execCommand("insertText", false, char);
      }
      STATE.lastActivity = Date.now();
      await delay(CFG.TYPE_DELAY + Math.random() * 50);
    }
  }

  async function clickElement(el) {
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await delay(300);
    el.click();
    STATE.lastActivity = Date.now();
    return true;
  }

  // ============================================================
  //  SECTION 8: 远程交互 (飞书Webhook + jsonblob中转)
  // ============================================================

  // ============================================================
  //  SECTION 8: 多渠道通知
  // ============================================================

  /**
   * 每日任务完成时发送通知
   */
  async function sendCompletionNotify() {
    const type = CFG.NOTIFY_TYPE;
    if (type === "none") return;

    const totalSec = STATE.startTime
      ? Math.floor((Date.now() - STATE.startTime) / 1000)
      : 0;
    const avgSec = STATE.count > 0 ? (totalSec / STATE.count).toFixed(1) : 0;
    const todayStr = new Date().toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    });
    const nowTime = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const nextTime = CFG.SCHEDULE_TIME || "09:00";

    const isPushPlus = type === "pushplus";
    let content;

    if (isPushPlus) {
      // PushPlus 使用 HTML 模板
      content = `
<div style="font-family: 'Microsoft YaHei', sans-serif; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: #fff;">
  <h2 style="margin: 0 0 12px; font-size: 20px;">🎉 每日任务已完成</h2>
  <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
    <table style="width: 100%; font-size: 14px; line-height: 2;">
      <tr><td style="color: rgba(255,255,255,0.8);">📅 日期</td><td style="font-weight: bold;">${todayStr}</td></tr>
      <tr><td style="color: rgba(255,255,255,0.8);">⏰ 完成时间</td><td style="font-weight: bold;">${nowTime}</td></tr>
      <tr><td style="color: rgba(255,255,255,0.8);">📊 完成轮次</td><td style="font-weight: bold; font-size: 18px; color: #ffd700;">${STATE.count} / ${CFG.MAX_COUNT}</td></tr>
      <tr><td style="color: rgba(255,255,255,0.8);">⏱️ 总耗时</td><td style="font-weight: bold;">${formatTime(totalSec)}</td></tr>
      <tr><td style="color: rgba(255,255,255,0.8);">⚡ 平均每轮</td><td style="font-weight: bold;">${avgSec}秒</td></tr>
    </table>
  </div>
  <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; font-size: 13px;">
    <div style="font-weight: bold; margin-bottom: 6px;">📋 后续计划</div>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
      <li>当前已进入<b>保活模式</b>，每 ${CFG.KEEP_ALIVE_INTERVAL} 秒发送一次保活问句</li>
      <li>次日 <b>${nextTime}</b> 自动重置进度并开始新一轮任务</li>
    </ul>
  </div>
  <div style="text-align: center; margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.5);">通通惠答自动化 v4.6 · ${nowTime}</div>
</div>`;
    } else {
      // 其他渠道使用纯文本
      content = [
        `【每日任务完成】`,
        `日期: ${todayStr}`,
        `完成时间: ${nowTime}`,
        `完成轮次: ${STATE.count} / ${CFG.MAX_COUNT}`,
        `总耗时: ${formatTime(totalSec)}`,
        `平均每轮: ${avgSec}秒`,
        ``,
        `后续计划:`,
        `- 已进入保活模式，每${CFG.KEEP_ALIVE_INTERVAL}秒发送保活问句`,
        `- 次日${nextTime}自动重置并开始新一轮`,
      ].join("\n");
    }

    addLog("发送完成通知...", "ACTION");
    await notifySend(content, isPushPlus);
  }

  /**
   * 统一发送通知，根据 NOTIFY_TYPE 路由到对应渠道
   */
  async function notifySend(text, isHTML = false) {
    const type = CFG.NOTIFY_TYPE;
    if (type === "none") {
      addLog("通知已关闭", "INFO");
      return false;
    }
    if (type === "feishu") return sendFeishu(text);
    if (type === "pushplus") return sendPushplus(text, isHTML);
    if (type === "dingtalk") return sendDingtalk(text);
    if (type === "custom") return sendCustom(text);
    addLog(`未知通知类型: ${type}`, "ERROR");
    return false;
  }

  function sendFeishu(text) {
    const webhook = CFG.FEISHU_WEBHOOK;
    if (!webhook) {
      addLog("未配置飞书Webhook", "WARN");
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: webhook,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ msg_type: "text", content: { text } }),
        onload: (r) => {
          try {
            const resp = JSON.parse(r.responseText);
            if (resp.code === 0 || resp.StatusCode === 0) {
              addLog("飞书通知已发送", "SUCCESS");
              resolve(true);
            } else {
              addLog(`飞书发送失败: ${resp.msg || r.status}`, "ERROR");
              resolve(false);
            }
          } catch (e) {
            addLog("飞书响应异常", "ERROR");
            resolve(false);
          }
        },
        onerror: () => {
          addLog("飞书请求错误", "ERROR");
          resolve(false);
        },
      });
    });
  }

  function sendPushplus(text, isHTML = false) {
    const token = CFG.PUSHPLUS_TOKEN;
    if (!token) {
      addLog("未配置PushPlus Token", "WARN");
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://www.pushplus.plus/send",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({
          token,
          title: "🤖 通通惠答 - 每日任务完成",
          content: text,
          template: isHTML ? "html" : "txt",
        }),
        onload: (r) => {
          if (r.status === 200) {
            addLog("PushPlus通知已发送", "SUCCESS");
            resolve(true);
          } else {
            addLog(`PushPlus发送失败: ${r.status}`, "ERROR");
            resolve(false);
          }
        },
        onerror: () => {
          addLog("PushPlus请求错误", "ERROR");
          resolve(false);
        },
      });
    });
  }

  function genDingtalkSign(secret) {
    const timestamp = Date.now();
    const stringToSign = timestamp + "\n" + secret;
    const encoder = new TextEncoder();
    return crypto.subtle
      .importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      )
      .then((key) =>
        crypto.subtle.sign("HMAC", key, encoder.encode(stringToSign)),
      )
      .then((buf) => ({
        timestamp,
        sign: btoa(String.fromCharCode(...new Uint8Array(buf))),
      }));
  }

  function sendDingtalk(text) {
    const webhook = CFG.DINGTALK_WEBHOOK;
    if (!webhook) {
      addLog("未配置钉钉Webhook", "WARN");
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      const send = (body) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: webhook,
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify(body),
          onload: (r) => {
            try {
              const resp = JSON.parse(r.responseText);
              if (resp.errcode === 0) {
                addLog("钉钉通知已发送", "SUCCESS");
                resolve(true);
              } else {
                addLog(`钉钉发送失败: ${resp.errmsg}`, "ERROR");
                resolve(false);
              }
            } catch (e) {
              addLog("钉钉响应异常", "ERROR");
              resolve(false);
            }
          },
          onerror: () => {
            addLog("钉钉请求错误", "ERROR");
            resolve(false);
          },
        });
      };
      const body = { msgtype: "text", text: { content: text } };
      if (CFG.DINGTALK_SECRET) {
        genDingtalkSign(CFG.DINGTALK_SECRET)
          .then(({ timestamp, sign }) => {
            const sep = webhook.includes("?") ? "&" : "?";
            const signedUrl = `${webhook}${sep}timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
            GM_xmlhttpRequest({
              method: "POST",
              url: signedUrl,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify(body),
              onload: (r) => {
                try {
                  const resp = JSON.parse(r.responseText);
                  if (resp.errcode === 0) {
                    addLog("钉钉通知已发送", "SUCCESS");
                    resolve(true);
                  } else {
                    addLog(`钉钉发送失败: ${resp.errmsg}`, "ERROR");
                    resolve(false);
                  }
                } catch (e) {
                  addLog("钉钉响应异常", "ERROR");
                  resolve(false);
                }
              },
              onerror: () => {
                addLog("钉钉请求错误", "ERROR");
                resolve(false);
              },
            });
          })
          .catch(() => {
            addLog("钉钉签名失败", "ERROR");
            resolve(false);
          });
      } else {
        send(body);
      }
    });
  }

  function sendCustom(text) {
    const url = CFG.CUSTOM_NOTIFY_URL;
    if (!url) {
      addLog("未配置自定义通知URL", "WARN");
      return Promise.resolve(false);
    }
    const method = (CFG.CUSTOM_NOTIFY_METHOD || "POST").toUpperCase();
    let headers = {};
    try {
      headers = JSON.parse(CFG.CUSTOM_NOTIFY_HEADERS || "{}");
    } catch (e) {}
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method,
        url,
        headers: { "Content-Type": "application/json", ...headers },
        data: method === "POST" ? JSON.stringify({ msg: text }) : null,
        onload: (r) => {
          if (r.status >= 200 && r.status < 300) {
            addLog("自定义通知已发送", "SUCCESS");
            resolve(true);
          } else {
            addLog(`自定义通知失败: ${r.status}`, "ERROR");
            resolve(false);
          }
        },
        onerror: () => {
          addLog("自定义通知请求错误", "ERROR");
          resolve(false);
        },
      });
    });
  }

  /**
   * 询问用户是否在线：发送通知 + 等待用户登录
   * 返回: true=用户已登录继续执行, false=超时/未配置
   */
  async function askUserOnline() {
    if (CFG.NOTIFY_TYPE === "none") return false;

    addLog("发送通知，等待用户登录...", "ACTION");
    await notifySend(
      "🤖 通通惠答\n定时任务触发，OA需要登录。请在浏览器中完成登录，脚本将自动继续。",
    );

    const pollTimeout = CFG.NOTIFY_TIMEOUT * 1000;
    const pollInterval = CFG.NOTIFY_INTERVAL * 1000;
    const start = Date.now();

    addLog(`等待用户登录 (超时${CFG.NOTIFY_TIMEOUT}秒)...`, "INFO");

    while (Date.now() - start < pollTimeout) {
      if (!STATE.running) return false;
      await delay(pollInterval);

      if (isLoggedIn()) {
        addLog("检测到用户已登录", "SUCCESS");
        return true;
      }
      const manualCode = document.getElementById("th-code")?.value?.trim();
      if (manualCode && /^\d{4,6}$/.test(manualCode)) {
        addLog("面板已输入验证码，继续执行", "SUCCESS");
        return true;
      }
    }

    addLog("等待用户登录超时", "WARN");
    return false;
  }

  /**
   * 请求验证码：发送通知 + 等待面板输入
   * 返回: 验证码字符串 或 null
   */
  async function askUserCode() {
    if (CFG.NOTIFY_TYPE === "none") return null;

    addLog("发送通知，等待验证码...", "ACTION");
    await notifySend(
      "🤖 通通惠答\n已触发获取验证码，请在脚本面板中输入收到的验证码。",
    );

    const pollTimeout = CFG.NOTIFY_TIMEOUT * 1000;
    const pollInterval = CFG.NOTIFY_INTERVAL * 1000;
    const start = Date.now();

    while (Date.now() - start < pollTimeout) {
      if (!STATE.running) return null;
      await delay(pollInterval);

      const manualCode = document.getElementById("th-code")?.value?.trim();
      if (manualCode && /^\d{4,6}$/.test(manualCode)) {
        addLog(`使用面板输入的验证码: ${manualCode}`, "SUCCESS");
        return manualCode;
      }
    }

    addLog("等待验证码超时", "WARN");
    return null;
  }

  // ============================================================
  //  SECTION 9: 登录
  // ============================================================
  async function manualLogin() {
    addLog("执行手动登录...", "ACTION");
    try {
      const phone = document.getElementById("th-phone").value.trim();
      const code = document.getElementById("th-code").value.trim();
      if (!phone || !code) {
        addLog("请填写手机号和验证码", "WARN");
        return;
      }

      if (
        window.location.href.includes("login") ||
        window.location.href.includes("cas")
      ) {
        const phoneInputs = document.querySelectorAll(
          'input[type="tel"], input[type="text"]',
        );
        let phoneInput = null;
        for (const inp of phoneInputs) {
          const ph = inp.placeholder || "";
          if (
            ph.includes("手机") ||
            ph.includes("号码") ||
            inp.type === "tel"
          ) {
            phoneInput = inp;
            break;
          }
        }
        if (!phoneInput && phoneInputs.length > 0) phoneInput = phoneInputs[0];
        if (phoneInput) {
          await typeText(phoneInput, phone);
          addLog("已输入手机号", "SUCCESS");
        }

        const codeInputs = document.querySelectorAll(
          'input[type="text"], input[type="number"]',
        );
        const codeInput =
          codeInputs.length > 0 ? codeInputs[codeInputs.length - 1] : null;
        if (codeInput) {
          await typeText(codeInput, code);
          addLog("已输入验证码", "SUCCESS");
        }

        await delay(500);
        const loginBtn =
          findClickableByText("登录") || findClickableByText("登 录");
        if (loginBtn) {
          await clickElement(loginBtn);
          addLog("已点击登录", "SUCCESS");
          await delay(3000);
        }
      } else {
        addLog("当前不在登录页，跳转OA首页", "WARN");
        window.location.href = CFG.OA_HOME_URL;
      }
    } catch (e) {
      addLog(`登录失败: ${e.message}`, "ERROR");
    }
  }

  function isLoggedIn() {
    if (window.location.href.includes("aiportal.chinaunicom.cn/portal")) {
      const apps = document.querySelectorAll(".app-name");
      for (const app of apps) {
        if (app.textContent?.trim()) return true;
      }
    }
    if (window.location.href.includes("tongtong.chinaunicom.cn")) return true;
    if (
      window.location.href.includes("login") ||
      window.location.href.includes("cas")
    )
      return false;
    return false;
  }

  // ============================================================
  // SECTION 10: 导航到惠答
  // ============================================================
  function isOnChatPage() {
    const href = window.location.href;
    return (
      href.includes("/tongtong-web/") &&
      (href.includes("#/chat") || href.includes("#/rich"))
    );
  }

  /**
   * 强制将惠答页面路由切换到 #/chat
   * 平台默认落地 #/rich，通过修改 hash 实现
   */
  function forceRouteToChat() {
    if (window.location.hash !== "#/chat") {
      addLog("强制切换路由到 #/chat", "ACTION");
      window.location.hash = "#/chat";
      // 如果平台立刻重定向回 #/rich，监听 hashchange 再次切换
      let attempts = 0;
      const checker = setInterval(() => {
        if (window.location.hash === "#/chat" || attempts > 5) {
          clearInterval(checker);
          return;
        }
        window.location.hash = "#/chat";
        attempts++;
      }, 500);
    }
  }

  function goToHuiXie() {
    const url = CFG.HUIXIE_URL_TEMPLATE.replace("{sso}", CFG.SSO_ID);
    // 使用唯一窗口名，避免重复打开时替换已有标签页
    const winName = "tongtong_chat_" + Date.now();
    const newWin = window.open(url, winName);
    if (!newWin || newWin.closed) {
      const a = document.createElement("a");
      a.href = url;
      a.target = winName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // ============================================================
  //  SECTION 10: 对话操作
  // ============================================================
  async function findInputBox() {
    let el = document.querySelector(CFG.INPUT_SELECTOR);
    if (el) return el;
    const fallbacks = [
      '[contenteditable="true"]',
      "textarea",
      ".editor-content",
    ];
    for (const sel of fallbacks) {
      el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  async function findSendButton() {
    let el = document.querySelector(CFG.SEND_BTN_SELECTOR);
    if (el) return el;
    el = findClickableByText("发送");
    if (el) return el;
    const input = await findInputBox();
    if (input) {
      const container =
        input.closest('div[class*="editor"]') || input.parentElement;
      if (container) {
        const btn = container.querySelector("button");
        if (btn) return btn;
      }
    }
    return null;
  }

  async function sendMessage(text) {
    const input = await findInputBox();
    if (!input) {
      addLog("未找到输入框", "ERROR");
      return false;
    }
    await typeText(input, text);
    await delay(500);
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        keyCode: 13,
        bubbles: true,
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keyup", { key: "Enter", keyCode: 13, bubbles: true }),
    );
    await delay(500);
    const sendBtn = await findSendButton();
    if (sendBtn) await clickElement(sendBtn);
    addLog("已发送", "ACTION");
    STATE.count++;
    saveState();
    updateUI();
    return true;
  }

  // 拦截页面 console.log / console.info 检测AI回答完成
  // 新版页面（2026后）改用 axios，回答流（SSE）结束后会打印：
  //   console.log("data", { basicParam:{code:"AS0000",msg:"成功"}, serviceParam:{code:"AS0000",...}, attachedInfo:null })
  // 实测该日志在 SSE 最后一个 chunk 之后约 100~200ms 出现，可作为回答完成信号。
  // 旧版 {role:"assistant",status:"done",isLoading:false} 格式保留作为兜底匹配。
  // 注意：脚本运行在沙箱中，需通过 unsafeWindow 拦截页面真实的 console
  let _answerDoneCb = null;
  (function () {
    const pageConsole = unsafeWindow.console;
    const origLog = pageConsole.log.bind(pageConsole);
    const origInfo = pageConsole.info.bind(pageConsole);
    pageConsole.log = function (...args) {
      origLog(...args);
      if (!_answerDoneCb) return;
      checkAnswerDone(args);
    };
    pageConsole.info = function (...args) {
      origInfo(...args);
      if (!_answerDoneCb) return;
      checkAnswerDone(args);
    };
    function checkAnswerDone(args) {
      for (const arg of args) {
        try {
          const data = typeof arg === "string" ? JSON.parse(arg) : arg;
          if (!data || typeof data !== "object") continue;
          // 新版完成信号：basicParam.code === "AS0000"
          if (data.basicParam && data.basicParam.code === "AS0000") {
            _answerDoneCb(data);
            return;
          }
          // 旧版兼容：{role:"assistant",status:"done",isLoading:false}
          if (
            data.role === "assistant" &&
            data.status === "done" &&
            data.isLoading === false
          ) {
            _answerDoneCb(data);
            return;
          }
        } catch (_) {
          // 非JSON，忽略
        }
      }
    }
  })();

  async function waitForAnswer() {
    addLog("等待AI回答...", "INFO");
    const timeoutMs = CFG.ANSWER_TIMEOUT * 1000;

    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        _answerDoneCb = null;
        addLog("等待回答超时，继续执行", "WARN");
        resolve(true);
      }, timeoutMs);

      _answerDoneCb = (data) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        addLog("AI回答完成", "SUCCESS");
        // 点击停止按钮提前结束动画，以便继续下一步
        const stopBtn = document.querySelector(
          'img.stop-image, img[class*="stop"]',
        );
        if (stopBtn) {
          stopBtn.click();
          addLog("已点击停止按钮，结束动画", "INFO");
        }
        resolve(true);
      };
    });
  }

  // ============================================================
  //  SECTION 11: 保活
  // ============================================================
  function startKeepAlive() {
    if (STATE.keepAliveTimer) clearInterval(STATE.keepAliveTimer);
    STATE.keepAliveTimer = setInterval(() => {
      if (STATE.paused || !STATE.running) return;
      addLog("保活: 发送问句...", "ACTION");
      const question = randomQuestion();
      sendMessage(question);
      STATE.lastActivity = Date.now();
    }, CFG.KEEP_ALIVE_INTERVAL * 1000);
    addLog("保活已启动", "SUCCESS");
  }

  function stopKeepAlive() {
    if (STATE.keepAliveTimer) {
      clearInterval(STATE.keepAliveTimer);
      STATE.keepAliveTimer = null;
    }
  }

  // ============================================================
  //  SECTION 12: 定时调度
  // ============================================================
  function getTodayDateStr() {
    return new Date().toLocaleDateString();
  }

  function startScheduleWatcher() {
    if (STATE.scheduleTimer) clearInterval(STATE.scheduleTimer);
    STATE.scheduleTimer = setInterval(() => {
      if (!CFG.SCHEDULE_ENABLED) return;
      if (STATE.running) return; // 已在运行中不重复触发

      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${h}:${m}`;

      if (currentTime === CFG.SCHEDULE_TIME) {
        const todayStr = getTodayDateStr();
        const triggeredToday = GM_getValue(STORE.SCHEDULE_TRIGGERED, "");
        if (triggeredToday !== todayStr) {
          GM_setValue(STORE.SCHEDULE_TRIGGERED, todayStr);
          addLog(`⏰ 定时触发！当前时间 ${currentTime}`, "SUCCESS");
          // 如果不在问答页面，先设置状态再跳转
          STATE.running = true;
          saveState();
          if (!isOnChatPage()) {
            addLog("跳转至问答页面...", "INFO");
            goToHuiXie();
          } else {
            startAutomation();
          }
        }
      }
    }, 30000); // 每30秒检查一次
  }

  function stopScheduleWatcher() {
    if (STATE.scheduleTimer) {
      clearInterval(STATE.scheduleTimer);
      STATE.scheduleTimer = null;
    }
  }

  // ============================================================
  //  SECTION 13: 主控制
  // ============================================================
  async function startAutomation() {
    if (!isMyTabActive()) {
      addLog("接管执行权...", "WARN");
      claimTab();
    }
    if (STATE.running && !STATE.paused) {
      addLog("已在运行", "WARN");
      return;
    }

    if (STATE.paused) {
      STATE.paused = false;
      claimTab();
      saveState();
      addLog("已恢复", "SUCCESS");
      setStatus("运行中");
      updateUI();
      return;
    }

    STATE.running = true;
    STATE.paused = false;
    STATE.startTime = STATE.startTime || Date.now();
    STATE.sessionStartTime = Date.now();
    STATE.lastActivity = Date.now();
    // 随机生成新的 SSO ID
    CFG.SSO_ID = String(
      Math.floor(Math.random() * 9000000000000 + 1000000000000),
    );
    addLog(`SSO: ${CFG.SSO_ID}`, "INFO");
    claimTab();
    saveState();
    addLog("🚀 开始执行", "SUCCESS");
    setStatus("运行中");

    try {
      // 检查登录
      if (!isLoggedIn()) {
        setPhase("login");

        if (CFG.NOTIFY_TYPE !== "none") {
          addLog("未登录，发送通知并等待...", "WARN");
          const online = await askUserOnline();
          if (!online) {
            addLog("用户未响应，跳转OA首页...", "WARN");
            window.location.href = CFG.OA_HOME_URL;
            stopAutomation();
            return;
          }
          addLog("跳转到OA首页...", "INFO");
          window.location.href = CFG.OA_HOME_URL;
          return;
        } else {
          addLog("未登录，跳转OA首页...", "WARN");
          window.location.href = CFG.OA_HOME_URL;
          addLog("登录后脚本会自动恢复", "WARN");
          stopAutomation();
          return;
        }
      }

      // 如果在登录页且已配置通知，执行远程登录流程
      if (
        (window.location.href.includes("login") ||
          window.location.href.includes("cas")) &&
        CFG.NOTIFY_TYPE !== "none" &&
        STATE.running
      ) {
        addLog("检测到登录页，执行远程登录...", "ACTION");
        await delay(2000);

        const phone =
          document.getElementById("th-phone")?.value?.trim() || CFG.PHONE;
        if (phone) {
          const phoneInputs = document.querySelectorAll(
            'input[type="tel"], input[type="text"]',
          );
          let phoneInput = null;
          for (const inp of phoneInputs) {
            const ph = inp.placeholder || "";
            if (
              ph.includes("手机") ||
              ph.includes("号码") ||
              inp.type === "tel"
            ) {
              phoneInput = inp;
              break;
            }
          }
          if (!phoneInput && phoneInputs.length > 0)
            phoneInput = phoneInputs[0];
          if (phoneInput) {
            await typeText(phoneInput, phone);
            addLog("已输入手机号", "SUCCESS");
          }

          const codeBtn =
            findClickableByText("获取验证码") ||
            findClickableByText("获取") ||
            findClickableByText("验证码");
          if (codeBtn) {
            await clickElement(codeBtn);
            addLog("已点击获取验证码", "SUCCESS");
          }

          const code = await askUserCode();
          if (code) {
            const codeInputs = document.querySelectorAll(
              'input[type="text"], input[type="number"]',
            );
            const codeInput =
              codeInputs.length > 0 ? codeInputs[codeInputs.length - 1] : null;
            if (codeInput) {
              await typeText(codeInput, code);
              addLog("已输入验证码", "SUCCESS");
            }
            await delay(500);

            const loginBtn =
              findClickableByText("登录") || findClickableByText("登 录");
            if (loginBtn) {
              await clickElement(loginBtn);
              addLog("已点击登录，等待跳转...", "SUCCESS");
              await delay(5000);
              // 登录成功后先回OA首页，后续会自动跳转惠答
              window.location.href = CFG.OA_HOME_URL;
              return;
            }
          } else {
            addLog("未收到验证码，等待手动操作", "WARN");
            return;
          }
        }
        addLog("手机号为空，等待手动登录...", "WARN");
        return;
      }

      // 如果在惠答页面，强制路由到 #/chat
      if (!isOnChatPage()) {
        setPhase("navigate");
        addLog("跳转至问答页面...", "INFO");
        goToHuiXie();
        return; // 新标签打开，当前标签等待或结束
      }
      setPhase("chat");
      forceRouteToChat();
      await delay(3000);

      // 主循环
      while (STATE.running && STATE.count < CFG.MAX_COUNT) {
        if (STATE.paused) {
          addLog("已暂停...", "WARN");
          await new Promise((r) => {
            const iv = setInterval(() => {
              if (!STATE.paused || !STATE.running) {
                clearInterval(iv);
                r();
              }
            }, 500);
          });
          if (!STATE.running) break;
          addLog("已恢复", "SUCCESS");
        }

        saveState();

        STATE.round++;
        const question = randomQuestion();
        addLog(`第 ${STATE.round} / ${CFG.MAX_COUNT} 轮`, "INFO");
        await sendMessage(question);
        // 发送成功后记录发问时间节点，时间与"已发送"日志一致
        STATE.timeline = [{ label: "发问", ts: Date.now() }];
        await waitForAnswer();
        STATE.timeline.push({ label: "回答完成", ts: Date.now() });
        STATE.lastActivity = Date.now();

        // 停止动画由 waitForAnswer 内部点击，此处只记录时间节点
        STATE.timeline.push({ label: "停止动画", ts: Date.now() });
        updateUI();

        const jitter = Math.random() * 2000;
        await delay(CFG.CYCLE_INTERVAL * 1000 + jitter);
        STATE.timeline.push({ label: "下一轮", ts: Date.now() });
        updateUI();
      }

      if (STATE.count >= CFG.MAX_COUNT) {
        addLog(
          `🎉 完成 ${CFG.MAX_COUNT} 次，今日任务结束，进入保活模式`,
          "SUCCESS",
        );
        setStatus(`完成${CFG.MAX_COUNT}轮`);
        // 发送完成通知
        await sendCompletionNotify();
        // 每日任务完成，进入保活：每隔一段时间发送一道保活问句
        addLog("启动保活，直至次日重置...", "INFO");
        startKeepAlive();
      } else {
        stopKeepAlive();
      }
    } catch (e) {
      addLog(`执行出错: ${e.message}`, "ERROR");
      stopKeepAlive();
    }

    if (!(STATE.count >= CFG.MAX_COUNT)) {
      STATE.running = false;
      setPhase("idle");
      saveState();
    }
    updateUI();
  }

  function togglePause() {
    if (!STATE.running) {
      addLog("未运行", "WARN");
      return;
    }
    STATE.paused = !STATE.paused;
    saveState();
    addLog(STATE.paused ? "已暂停" : "已恢复", "SUCCESS");
    setStatus(STATE.paused ? "已暂停" : "运行中");
    updateUI();
  }

  function stopAutomation() {
    STATE.running = false;
    STATE.paused = false;
    stopKeepAlive();
    clearPersistedState();
    GM_setValue(STORE.STOPPED, true);
    addLog("⏹ 已停止", "WARN");
    setStatus("已停止");
    setPhase("idle");
    updateUI();
  }

  // ============================================================
  //  SECTION 14: 初始化
  // ============================================================
  function init() {
    loadConfig();
    loadPersistedState();

    // 每日进度重置：日期变化时清除上一天的计数
    const today = new Date().toLocaleDateString();
    const lastDate = GM_getValue(STORE.LAST_DATE, "");
    if (lastDate !== today) {
      STATE.count = 0;
      STATE.round = 0;
      STATE.startTime = null;
      STATE.sessionStartTime = null;
      STATE.timeline = [];
      clearPersistedState();
      GM_setValue(STORE.LAST_DATE, today);
      addLog(`新的一天(${today})，进度已重置`, "SUCCESS");
    }

    createUI();
    addLog("通通惠答自动化 v4.6 已加载", "SUCCESS");
    addLog(`当前: ${window.location.href}`, "INFO");

    // 启动定时检查
    startScheduleWatcher();

    // 自动恢复
    if (STATE.running && !STATE.paused) {
      if (STATE.count >= CFG.MAX_COUNT) {
        // 每日任务已完成，进入保活模式
        addLog("每日任务已完成，进入保活模式", "INFO");
        setStatus(`完成${CFG.MAX_COUNT}轮`);
        claimTab();
        startKeepAlive();
        return;
      }
      if (isOnChatPage()) {
        addLog(
          `检测到运行中(${STATE.count}/${CFG.MAX_COUNT})，2秒后自动恢复...`,
          "WARN",
        );
        forceRouteToChat();
        setTimeout(() => {
          STATE.running = false; // 重置使 startAutomation 能正常进入
          claimTab(); // 强制接管标签锁，避免旧标签残留阻止
          startAutomation();
        }, 2000);
      } else {
        addLog(`运行中但不在问答页，跳转中...`, "WARN");
        claimTab(); // 跳转前接管标签锁
        setTimeout(() => goToHuiXie(), 2000);
      }
    }

    if (window.location.href.includes("login")) {
      addLog("检测到登录页", "WARN");
      if (CFG.PHONE) document.getElementById("th-phone").value = CFG.PHONE;
    }
  }

  GM_registerMenuCommand("显示/隐藏面板", () => {
    const panel = document.getElementById("th-panel");
    if (panel)
      panel.style.display = panel.style.display === "none" ? "block" : "none";
  });
  GM_registerMenuCommand("停止自动化", stopAutomation);

  // 页面关闭/跳转时清除标签锁，避免残留阻止新标签页
  window.addEventListener("beforeunload", () => {
    const activeTab = GM_getValue(STORE.TAB_ID, "");
    if (activeTab === MY_TAB_ID) {
      GM_setValue(STORE.TAB_ID, "");
      GM_setValue(STORE.TAB_TIME, 0);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    requestAnimationFrame(() => requestAnimationFrame(init));
  }
})();
