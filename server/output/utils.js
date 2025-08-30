"use strict";
// utils.ts - 公共工具函数
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountCookiesPath = getAccountCookiesPath;
exports.initBrowser = initBrowser;
exports.createAndConfigurePage = createAndConfigurePage;
exports.setPageCookies = setPageCookies;
exports.saveAccountCookies = saveAccountCookies;
exports.getAllLoggedInAccounts = getAllLoggedInAccounts;
exports.getAccountCookies = getAccountCookies;
exports.removeAccount = removeAccount;
exports.extractSchemaFromPage = extractSchemaFromPage;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
// 确保cookies目录存在
const COOKIES_DIR = path.join(__dirname, 'cookies');
if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
}
// 获取账号cookies文件路径
function getAccountCookiesPath(mobile) {
    return path.join(COOKIES_DIR, `${mobile}.json`);
}
// 初始化浏览器实例
async function initBrowser() {
    return await puppeteer_1.default.launch({
        headless: true, // 改为非headless模式，更像真实用户
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--remote-debugging-port=9222',
            '--lang=zh-CN,zh,en-US,en',
            '--font-render-hinting=none',
            '--disable-font-subpixel-positioning',
            // 反检测参数
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins-discovery',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-ipc-flooding-protection',
            '--enable-features=NetworkService,NetworkServiceLogging',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--password-store=basic',
            '--use-mock-keychain',
            '--window-size=1920,1080',
            '--start-maximized',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        ],
        ignoreDefaultArgs: [
            '--enable-automation',
            '--disable-extensions',
            '--disable-default-apps',
        ],
    });
}
// 创建并配置页面
async function createAndConfigurePage(browser, useConfig) {
    const page = await browser.newPage();
    // 设置真实浏览器的headers
    await page.setExtraHTTPHeaders({
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,zh;q=0.8,zh-CN;q=0.7',
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-tt-env': 'ppe_pick_bill',
        'x-use-ppe': '1',
    });
    // if (useConfig) {
    // 使用iOS Chrome User-Agent，更像真实iPhone用户
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.0.0 Mobile/15E148 Safari/604.1');
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        isLandscape: false,
    });
    // }
    // 注入脚本绕过webdriver检测
    await page.evaluateOnNewDocument(() => {
        // 绕过webdriver检测
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
        // 绕过chrome检测
        Object.defineProperty(navigator, 'chrome', {
            get: () => ({
                runtime: {},
                loadTimes: () => ({}),
                csi: () => ({}),
            }),
        });
        // 模拟真实用户的屏幕信息
        Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
        Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
        // 模拟插件信息
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                {
                    name: 'Chrome PDF Viewer',
                    filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
                },
                { name: 'Native Client', filename: 'internal-nacl-plugin' },
            ],
        });
        // 模拟语言
        Object.defineProperty(navigator, 'languages', {
            get: () => ['zh-CN', 'zh', 'en-US', 'en'],
        });
        // 模拟时区
        Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
            value: () => ({ timeZone: 'Asia/Shanghai' }),
        });
    });
    // 添加随机延迟和鼠标移动
    await page.evaluateOnNewDocument(() => {
        // 模拟鼠标移动
        let lastTime = Date.now();
        const moveMouse = () => {
            const now = Date.now();
            if (now - lastTime > Math.random() * 5000 + 1000) {
                lastTime = now;
                const event = new MouseEvent('mousemove', {
                    bubbles: true,
                    clientX: Math.random() * window.innerWidth,
                    clientY: Math.random() * window.innerHeight,
                });
                document.dispatchEvent(event);
            }
        };
        setInterval(moveMouse, 1000);
    });
    return page;
}
// 设置页面cookies
async function setPageCookies(page, mobile) {
    const cookiesPath = getAccountCookiesPath(mobile);
    if (!fs.existsSync(cookiesPath)) {
        throw new Error('请先登录');
    }
    const cookies = JSON.parse(fs.readFileSync(cookiesPath).toString());
    await page.setCookie(...cookies);
}
// 保存账号cookies
function saveAccountCookies(mobile, cookies) {
    const cookiesPath = getAccountCookiesPath(mobile);
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
}
// 获取所有已登录账号
function getAllLoggedInAccounts() {
    if (!fs.existsSync(COOKIES_DIR)) {
        return [];
    }
    const files = fs.readdirSync(COOKIES_DIR);
    return files
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.basename(file, '.json'));
}
// 获取指定账号的cookies
function getAccountCookies(mobile) {
    const cookiesPath = getAccountCookiesPath(mobile);
    if (!fs.existsSync(cookiesPath)) {
        return null;
    }
    const cookiesData = fs.readFileSync(cookiesPath, 'utf8');
    return JSON.parse(cookiesData);
}
// 删除指定账号
function removeAccount(mobile) {
    const cookiesPath = getAccountCookiesPath(mobile);
    if (fs.existsSync(cookiesPath)) {
        fs.unlinkSync(cookiesPath);
        return true;
    }
    return false;
}
// 提取页面中的schema链接
async function extractSchemaFromPage(page, schemaPrefix) {
    let schema = '';
    // 1. 抓取所有 a 标签的 href
    const aLinks = await page.$$eval('a', (as) => as.map((a) => a.href));
    const schemaLinks = aLinks.filter((link) => link.includes(schemaPrefix));
    if (schemaLinks.length > 0) {
        schema = schemaLinks[0];
    }
    // 2. 检查 window.location.href
    if (!schema) {
        const pageUrl = await page.evaluate(() => window.location.href);
        if (pageUrl.includes(schemaPrefix)) {
            schema = pageUrl;
        }
    }
    // 3. 检查 img src
    if (!schema) {
        const imgSrcs = await page.$$eval('img', (imgs) => imgs.map((img) => img.src));
        const imgSchemaLinks = imgSrcs.filter((src) => src.includes(schemaPrefix));
        if (imgSchemaLinks.length > 0) {
            schema = imgSchemaLinks[0];
        }
    }
    // 4. 检查 iframe src
    if (!schema) {
        const iframeSrcs = await page.$$eval('iframe', (iframes) => iframes.map((f) => f.src));
        const iframeSchemaLinks = iframeSrcs.filter((src) => src.includes(schemaPrefix));
        if (iframeSchemaLinks.length > 0) {
            schema = iframeSchemaLinks[0];
        }
    }
    // 5. 检查页面内所有文本内容（兜底）
    if (!schema) {
        const bodyText = await page.evaluate(() => document.body.innerText);
        const textSchemaLinks = (bodyText.match(new RegExp(`${schemaPrefix}[\\w\\-\\/\\?#=&%.]+`, 'g')) ||
            []).filter((link) => link.includes(schemaPrefix));
        if (textSchemaLinks.length > 0) {
            schema = textSchemaLinks[0];
        }
    }
    return schema;
}
