// ==UserSubscribe==
// @name         联通网上学院-刷课助手订阅
// @namespace    https://gitee.com/coralfox/unicom-tools
// @version      1.0.1
// @description  一键订阅联通网上学院刷课助手。订阅后脚本的更新、下架都会自动同步，不用再手动导入。
// @author       CountZero
// @connect      app.campus.chinaunicom.cn
// @connect      campus.chinaunicom.cn
// @scriptUrl    https://gitee.com/coralfox/unicom-tools/raw/main/unicom-course.user.js
// ==/UserSubscribe==

/*
 * ───────────────────────────── 使用说明（这段注释不会被执行） ─────────────────────────────
 *
 * 1. 文件名与存放（Gitee 模式）
 *    本文件必须叫 xxx.user.sub.js，并且必须通过 https 访问。
 *    Gitee 仓库需为「公开」。本项目的默认分支是 main（不是 master），所有地址统一用 main。
 *    直链格式：https://gitee.com/<用户名>/<仓库名>/raw/<分支>/<文件名>
 *    注意：raw 直链里的文件名必须是英文（中文名会被转义成 %E4%B8%AD…，部分客户端取不到）。
 *
 * 2. 头信息要点
 *    - 首行必须是 ==UserSubscribe==，不是 ==UserScript==，否则会被当成普通脚本。
 *    - @scriptUrl 每行一个脚本，写几个就订阅几个，顺序无关。
 *    - @connect 必须把「所有被订阅脚本要用到的域名」写全。
 *      官方规定：订阅的 @connect 会覆盖被订阅脚本自身的 @connect，
 *      订阅里漏写一个域名，所有脚本都会跨域失败。
 *
 * 3. 更新行为
 *    - 首次安装会弹确认框，之后安装 / 更新 / 删除全部静默，只弹通知。
 *    - 订阅本身按本文件的 @version 触发检查；被订阅脚本各自按自己的 @version 更新。
 *      → 只改脚本内容不升脚本版本号，订阅者不会收到变化。
 *    - 从本文件里删掉某条 @scriptUrl，订阅者本地对应脚本会被自动卸载。
 *    - 只有 @connect 发生改变时，才会重新弹窗让用户确认权限。
 *
 * 4. Gitee 仓库里应该放哪些文件（全部放仓库根目录）
 *    unicom-course.user.js        正式脚本（含 @updateURL / @downloadURL）
 *    unicom-course.meta.js        仅头信息，供更新检查用（体积小，比拉整包快）
 *    unicom-course.user.sub.js    本订阅文件（即当前这个文件）
 *    README.md                    可选，写安装说明
 *
 * 5. 上线前的自检
 *    □ 仓库是公开仓库，否则 raw 直链需要登录，油猴取不到
 *    □ 首行是 ==UserSubscribe== 且结尾有 ==/UserSubscribe==
 *    □ 所有 @scriptUrl 能在浏览器无痕窗口直接打开（返回以 ==UserScript== 开头的文本）
 *    □ @connect 覆盖了 app.campus.chinaunicom.cn（脚本接口域名）
 *    □ 改了内容就把 @version 加一（订阅和脚本各算各的）
 *    □ 用无痕窗口 + 干净浏览器实测一次订阅安装
 */

"use strict";

// 订阅文件不含执行代码，ScriptCat 只解析上面的头信息。
