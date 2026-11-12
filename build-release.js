// 把开发版脚本转成发布版：升版本、注入 Gitee 更新地址、同步订阅文件。
// 只读开发版源码，产物统一写到 dist\<目录>\ 下，源目录一个字节都不动。
//
// 用法：
//   node build-release.js                              按 patch 自增（3.8 -> 3.9）
//   node build-release.js --version 3.9                指定版本
//   node build-release.js --only 网上学院              只构建一个目标
//
// 考试答题助手不在发布链里：它不带更新地址，只由本地 sctl 维护，别在这里加回来。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

/* GitHub 是主仓库、Gitee 是镜像；但脚本里的更新地址只能写 Gitee：
   raw.githubusercontent.com 国内不可达，油猴拉不到更新。 */
const RAW = 'https://gitee.com/coralfox/unicom-tools/raw/main';

/* 一个脚本一条配置。目录名同时是 URL 里的一段路径，中文会被转义。 */
const TARGETS = [
  {
    name: '网上学院',
    dir: '网上学院',
    file: 'unicom-course.user.js',
    sub: 'unicom-course.user.sub.js'   // 带订阅文件的项目才写这一项
  }
];

const HEAD_OPEN = '// ==UserScript==';
const HEAD_CLOSE = '// ==/UserScript==';

/* ---------- 小工具 ---------- */

const read = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); // 去掉 BOM，保证头部从第一行开始

const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

/* 逐段转义，保留 / 作为分隔符；中文目录名、中文文件名都靠这一步 */
function urlOf() {
  return RAW + '/' + Array.prototype.slice.call(arguments).map(encodeURIComponent).join('/');
}

/* 3.8 -> 3.9，5.11 -> 5.12：只动最后一段，前面保持开发者写的语义 */
function bumpPatch(ver) {
  const parts = ver.split('.');
  const last = parts.length - 1;
  if (!/^\d+$/.test(parts[last])) throw new Error('版本号末段不是数字，无法自增：' + ver);
  parts[last] = String(Number(parts[last]) + 1);
  return parts.join('.');
}

/* 切出元数据块：首行 ==UserScript== 到 ==/UserScript==，其余原样保留 */
function splitHeader(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== HEAD_OPEN) throw new Error('首行不是 ' + HEAD_OPEN + '，不是标准用户脚本');
  const close = lines.findIndex((l) => l.trim() === HEAD_CLOSE);
  if (close < 0) throw new Error('找不到 ' + HEAD_CLOSE);
  return {
    header: lines.slice(0, close + 1).join('\n'),
    rest: lines.slice(close + 1).join('\n')
  };
}

const verOf = (header) => {
  const m = header.match(/^\/\/\s*@version\s+(\S+)/m);
  if (!m) throw new Error('头部没有 @version');
  return m[1];
};

/* 改版本 + 注入更新地址。开发版里若残留 @updateURL/@downloadURL 先删掉，保证只有一条。
   不再单独产 .meta.js：两条地址写同一条完整脚本，油猴和 ScriptCat 都能自己读元数据块。 */
function patchHeader(header, ver, url) {
  const out = [];
  let versioned = false;
  header.split('\n').forEach((line) => {
    if (/^\/\/\s*@(updateURL|downloadURL)\s/.test(line)) return;
    if (/^\/\/\s*@version\s/.test(line)) {
      out.push('// @version      ' + ver);
      out.push('// @updateURL    ' + url);
      out.push('// @downloadURL  ' + url);
      versioned = true;
      return;
    }
    out.push(line);
  });
  if (!versioned) throw new Error('头部没有 @version，没法定位注入位置');
  return out.join('\n');
}

/* 订阅文件只改 @scriptUrl，其余说明文字原样带过去 */
function patchSub(text, scriptUrl) {
  const out = [];
  let placed = false;
  text.split('\n').forEach((line) => {
    if (/^\/\/\s*@scriptUrl\s/.test(line)) {
      if (!placed) {
        out.push('// @scriptUrl    ' + scriptUrl);
        placed = true;
      }
      return;
    }
    out.push(line);
    if (/^\/\/\s*@version\s/.test(line) && !placed) {
      out.push('// @scriptUrl    ' + scriptUrl);
      placed = true;
    }
  });
  if (!placed) throw new Error('订阅文件没有可插入 @scriptUrl 的位置');
  return out.join('\n');
}

function check(name, file) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    console.log('  node --check  ' + name + '  OK');
  } catch (e) {
    throw new Error('语法检查失败：' + name + '\n' + (e.stderr || e.message));
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error('自检失败：' + msg);
}

/* ---------- 参数 ---------- */

function parseArgs(argv) {
  const opt = { version: null, only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--version') opt.version = argv[++i];
    else if (argv[i] === '--only') opt.only = argv[++i];
    else throw new Error('未知参数：' + argv[i]);
  }
  if (opt.version && !/^\d+(\.\d+)*$/.test(opt.version)) {
    throw new Error('--version 只接受数字和点：' + opt.version);
  }
  return opt;
}

/* ---------- 主流程 ---------- */

const opt = parseArgs(process.argv.slice(2));
let targets = TARGETS;
if (opt.only) {
  targets = TARGETS.filter((t) => t.name === opt.only || t.dir === opt.only);
  if (!targets.length) {
    const hint = opt.only === '考试答题助手'
      ? '考试答题助手不在发布链里（不带更新地址，只由本地 sctl 维护）'
      : '可选：' + TARGETS.map((t) => t.name).join(' / ');
    throw new Error('没有这个发布目标：' + opt.only + '；' + hint);
  }
}

const report = [];

targets.forEach(function (t) {
  const srcFile = path.join(ROOT, t.dir, t.file);
  const srcHash = sha256(srcFile);

  const raw = read(srcFile);
  const head = splitHeader(raw);
  const oldVer = verOf(head.header);
  const ver = opt.version || bumpPatch(oldVer);

  const mainUrl = urlOf(t.dir, t.file);

  const header = patchHeader(head.header, ver, mainUrl);
  const stamp = '// 发布版 v' + ver + '，由 build-release.js 生成；改代码请改开发版 ' + t.file + '，不要直接改这里。';
  const text = header + '\n' + stamp + '\n' + head.rest;

  /* 产物结构跟源目录一一对应 */
  const outDir = path.join(DIST, t.dir);
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, t.file);
  fs.writeFileSync(outFile, text, 'utf8');

  const files = [{ name: t.file, p: outFile, size: Buffer.byteLength(text, 'utf8') }];

  let subFile = null;
  if (t.sub) {
    const subSrc = path.join(ROOT, t.dir, t.sub);
    const subText = patchSub(read(subSrc), mainUrl);
    subFile = path.join(outDir, t.sub);
    fs.writeFileSync(subFile, subText, 'utf8');
    files.push({ name: t.sub, p: subFile, size: Buffer.byteLength(subText, 'utf8') });
  }

  /* ---- 自检 ---- */
  console.log('[' + t.name + '] ' + oldVer + ' -> ' + ver);
  files.forEach((f) => check(f.name, f.p));

  const outText = fs.readFileSync(outFile, 'utf8');
  assert(outText.indexOf(header + '\n') === 0, '元数据块不在产物开头');

  const one = (re) => (outText.match(re) || []).length;
  assert(one(/^\/\/\s*@updateURL\s+/gm) === 1, '@updateURL 不是正好一条');
  assert(one(/^\/\/\s*@downloadURL\s+/gm) === 1, '@downloadURL 不是正好一条');
  assert(one(/^\/\/\s*@version\s+/gm) === 1, '@version 不是正好一条');
  assert(outText.indexOf('// @version      ' + ver) > 0, '版本号没写进 @version');

  /* 两条地址必须完全一样，且就是 dist 里这个文件的可下载地址 */
  const upd = (outText.match(/^\/\/\s*@updateURL\s+(\S+)/m) || [])[1];
  const dl = (outText.match(/^\/\/\s*@downloadURL\s+(\S+)/m) || [])[1];
  assert(upd === dl, '@updateURL 与 @downloadURL 不一致');
  assert(upd === mainUrl, '地址与预期不符：' + upd);
  const relOut = path.relative(DIST, outFile).split(path.sep).join('/');
  assert(decodeURIComponent(upd.slice(RAW.length + 1)) === relOut, '地址与 dist 结构对不上：' + relOut);
  assert(!/\.meta\.js$/.test(upd), '地址仍指向 meta 文件');
  assert(!fs.existsSync(path.join(DIST, relOut.replace(/\.user\.js$/, '.meta.js'))), 'dist 里还残留 meta 文件');

  if (subFile) {
    const subText = fs.readFileSync(subFile, 'utf8');
    assert((subText.match(/^\/\/\s*@scriptUrl\s+/gm) || []).length === 1, '订阅文件 @scriptUrl 不是正好一条');
    assert(subText.indexOf(mainUrl) > 0, '订阅文件 @scriptUrl 没指向发布版主脚本');
  }

  assert(sha256(srcFile) === srcHash, '开发版源文件在构建过程中被改动了');
  console.log('  源文件 SHA256 未变  ' + srcHash.slice(0, 16) + '…');

  report.push({ t: t, ver: ver, files: files, mainUrl: mainUrl });
});

/* ---- 汇总 ---- */
console.log('\n产物清单：');
report.forEach(function (r) {
  r.files.forEach((f) => console.log('  ' + path.relative(ROOT, f.p) + '  ' + f.size + ' bytes'));
});

console.log('\nGitee 地址（@updateURL 与 @downloadURL 相同）：');
report.forEach(function (r) {
  console.log('  ' + r.mainUrl);
});
