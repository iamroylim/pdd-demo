"use strict";
// order.js - 拼多多下单系统
Object.defineProperty(exports, "__esModule", { value: true });
exports.order = order;
const workflow_1 = require("./workflow");
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const utils_1 = require("./utils");
const tinyUrl = async (url, option) => {
    const { pre = 'd' } = option ?? {};
    const rep = await fetch('https://api.tinyurl.com/create?api_token=jEdibAllaDKoQ7Z3gPZPPOXiVqgF2eG9PobmeVjTnKo6der7Pm4mWgCB4ixx', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify({
            url,
            domain: 'tinyurl.com',
            alias: `${pre}${Date.now()}`,
            tags: 'example,link',
            expires_at: '2028-10-25 10:11:12',
            description: 'string',
        }),
    });
    return rep.json();
};
async function order(options) {
    const browser = await (0, utils_1.initBrowser)();
    const { mobile, url, payType } = options;
    console.log('🚀 ~ order ~ options:', options);
    const openPage = async () => {
        const page = await (0, utils_1.createAndConfigurePage)(browser, true);
        await (0, utils_1.setPageCookies)(page, mobile);
        return page;
    };
    let wxSchema = '';
    let zfbSchema = '';
    let wxUrl = '';
    let zfbUrl = '';
    // 微信支付工作流步骤
    const getWeChatPaymentWorkflow = (url) => [
        {
            action: 'scroll',
            value: 100,
            description: '随机滚动页面',
        },
        {
            action: 'sleep',
            value: 1000 + Math.random() * 2000,
            description: '随机等待',
        },
        { action: 'goto', value: url, description: '打开商品下单页' },
        {
            action: 'sleep',
            value: 2000 + Math.random() * 3000,
            description: '等待页面加载',
        },
        {
            action: 'scroll',
            value: 100,
            description: '模拟用户滚动行为',
        },
        {
            action: 'wait',
            item: 'span ::-p-text(微信支付)',
            timeout: 5000,
            description: '等待微信支付选项',
        },
        {
            action: 'hover',
            item: 'span ::-p-text(微信支付)',
            description: '悬停微信支付选项',
        },
        {
            action: 'sleep',
            value: 500 + Math.random() * 1000,
            description: '悬停等待',
        },
        {
            action: 'click',
            item: 'span ::-p-text(微信支付)',
            description: '点击微信支付',
        },
        {
            action: 'wait',
            item: 'span ::-p-text(立即支付)',
            timeout: 5000,
            description: '等待立即支付按钮',
        },
        {
            action: 'hover',
            item: 'span ::-p-text(立即支付)',
            description: '悬停立即支付按钮',
        },
        {
            action: 'sleep',
            value: 800 + Math.random() * 1000,
            description: '悬停等待',
        },
        {
            action: 'click',
            item: 'span ::-p-text(立即支付)',
            description: '点击立即支付',
        },
        {
            action: 'wait',
            item: 'span ::-p-text(提交订单)',
            timeout: 5000,
            description: '等待提交订单按钮',
        },
        {
            action: 'hover',
            item: 'span ::-p-text(提交订单)',
            description: '悬停提交订单按钮',
        },
        {
            action: 'sleep',
            value: 1000 + Math.random() * 1000,
            description: '悬停等待',
        },
        {
            action: 'click',
            item: 'span ::-p-text(提交订单)',
            description: '点击提交订单',
        },
        {
            // sleep 10s
            action: 'sleep',
            value: 10000,
            description: '等待跳转',
        },
    ];
    // 支付宝支付工作流步骤
    const getAlipayPaymentWorkflow = (url) => [
        {
            action: 'scroll',
            value: 100,
            description: '随机滚动页面',
        },
        {
            action: 'sleep',
            value: 1000 + Math.random() * 2000,
            description: '随机等待',
        },
        { action: 'goto', value: url, description: '打开商品下单页' },
        {
            action: 'wait',
            item: 'span ::-p-text(支付宝)',
            timeout: 15000,
            description: '等待支付宝选项',
        },
        {
            action: 'hover',
            item: 'span ::-p-text(支付宝)',
            description: '悬停支付宝选项',
        },
        {
            action: 'sleep',
            value: 500 + Math.random() * 1000,
            description: '悬停等待',
        },
        {
            action: 'click',
            item: 'span ::-p-text(支付宝)',
            description: '点击支付宝',
        },
        {
            action: 'wait',
            item: 'span ::-p-text(立即支付)',
            timeout: 10000,
            description: '等待立即支付按钮',
        },
        {
            action: 'hover',
            item: 'span ::-p-text(立即支付)',
            description: '悬停立即支付按钮',
        },
        {
            action: 'sleep',
            value: 800 + Math.random() * 1000,
            description: '悬停等待',
        },
        {
            action: 'click',
            item: 'span ::-p-text(立即支付)',
            description: '点击立即支付',
        },
    ];
    for (const type of payType) {
        const page = await openPage();
        if (type === 'wx') {
            // 1. 拦截所有请求
            page.on('request', (req) => {
                const url = req.url();
                if (url.startsWith('weixin://')) {
                    wxSchema = url;
                }
            });
            // 2. 拦截 frame 跳转
            page.on('framenavigated', (frame) => {
                const url = frame.url();
                if (url.startsWith('weixin://')) {
                    wxSchema = url;
                }
            });
            // 3. 拦截新窗口（window.open）
            page.on('targetcreated', async (target) => {
                try {
                    const url = target.url();
                    if (url.startsWith('weixin://')) {
                        wxSchema = url;
                    }
                }
                catch { }
            });
            // 4. 拦截页面 console.log
            page.on('console', (msg) => {
                const text = msg.text();
                if (text.includes('weixin://')) {
                    const match = text.match(new RegExp('weixin://([\\w\\-\\/\\?#=&%.]+)'));
                    if (match) {
                        wxSchema = match[0];
                    }
                }
            });
            // 5. 注入 JS 劫持所有 schema 跳转
            await page.evaluateOnNewDocument(() => {
                // 劫持 window.open
                const originOpen = window.open;
                window.open = function (url) {
                    if (typeof url === 'string' && url.startsWith('weixin://')) {
                        console.log('window.open 捕获到微信schema:', url);
                        window._WX_SCHEMA = url;
                    }
                    // 使用扩展运算符传递参数
                    return originOpen.apply(this, [url]);
                };
                // 劫持 location.assign/replace
                const originAssign = window.location.assign;
                window.location.assign = function (url) {
                    if (typeof url === 'string' && url.startsWith('weixin://')) {
                        console.log('window.location.assign 捕获到微信schema:', url);
                        // 赋值给全局变量
                        window._WX_SCHEMA = url;
                    }
                    // 使用扩展运算符传递参数
                    return originAssign.apply(this, [url]);
                };
                const originReplace = window.location.replace;
                window.location.replace = function (url) {
                    if (typeof url === 'string' && url.startsWith('weixin://')) {
                        console.log('window.location.replace 捕获到微信schema:', url);
                        // 赋值给全局变量
                        window._WX_SCHEMA = url;
                    }
                    // 使用扩展运算符传递参数
                    return originReplace.apply(this, [url]);
                };
                // 劫持 iframe.src
                const originSetAttribute = HTMLIFrameElement.prototype.setAttribute;
                HTMLIFrameElement.prototype.setAttribute = function (name, value) {
                    if (name === 'src' &&
                        typeof value === 'string' &&
                        value.startsWith('weixin://')) {
                        console.log('iframe.src 捕获到微信schema:', value);
                        // 赋值给全局变量
                        window._WX_SCHEMA = value;
                    }
                    // 使用扩展运算符传递参数
                    return originSetAttribute.apply(this, [name, value]);
                };
            });
            // 使用工作流执行页面操作
            const workflow = getWeChatPaymentWorkflow(url);
            const results = await (0, workflow_1.executeWorkflow)(page, workflow, mobile);
            // 兜底：在页面变量中查找 weixin://
            if (!wxSchema) {
                wxSchema = await page.evaluate(() => {
                    // 先检查全局变量
                    if (window._WX_SCHEMA)
                        return window._WX_SCHEMA;
                    // 检查所有a标签
                    const aLinks = Array.from(document.querySelectorAll('a')).map((a) => a.href);
                    const wxLink = aLinks.find((link) => link.startsWith('weixin://'));
                    if (wxLink)
                        return wxLink;
                    // 检查文本
                    const bodyText = document.body.innerText;
                    const match = bodyText.match(new RegExp('weixin://([\\w\\-\\/\\?#=&%.]+)'));
                    if (match)
                        return match[0];
                    return null;
                });
            }
        }
        else if (type === 'zfb') {
            // 使用工作流执行页面操作
            const workflow = getAlipayPaymentWorkflow(url);
            await (0, workflow_1.executeWorkflow)(page, workflow, mobile);
            // 等待跳转到支付二维码页面，增加等待时间
            await new Promise((resolve) => setTimeout(resolve, 8000 + Math.random() * 5000));
            const keyWord = 'alipay://';
            zfbSchema = await (0, utils_1.extractSchemaFromPage)(page, keyWord);
        }
    }
    await browser.close();
    if (wxSchema) {
        const data = await tinyUrl(wxSchema);
        console.log('🚀 ~ order ~ data:', data);
        wxUrl = data?.data?.tiny_url;
    }
    if (zfbSchema) {
        const data = await tinyUrl(zfbSchema);
        console.log('🚀 ~ order ~ data:', data);
        zfbUrl = data?.data?.tiny_url;
    }
    return {
        wxSchema,
        zfbSchema,
        wxUrl,
        zfbUrl,
    };
}
