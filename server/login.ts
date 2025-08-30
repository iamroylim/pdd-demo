// login.ts - 使用工作流引擎的多账号管理系统

import { Browser } from 'puppeteer';
import {
  createAndConfigurePage,
  initBrowser,
  saveAccountCookies,
} from './utils';
import { executeWorkflow, WorkflowStep } from './workflow';

const instanceMap = new Map<
  string,
  { browser: Browser; page: any; timer: NodeJS.Timeout }
>();

// 登录工作流步骤
const getLoginWorkflow = (mobile: string): WorkflowStep[] => [
  {
    action: 'goto',
    value: 'https://mobile.pinduoduo.com/login.html',
    description: '访问登录页面',
  },
  {
    action: 'scroll',
    value: 100,
    description: '随机滚动页面',
  },
  {
    action: 'wait',
    item: '.phone-login',
    timeout: 5000,
    description: '等待登录按钮',
  },
  {
    action: 'click',
    item: '.phone-login',
    timeout: 5000,
    description: '点击登录按钮',
  },
  { action: 'sleep', value: 3000, description: '等待页面响应' },
  {
    action: 'click',
    item: '.phone-login',
    timeout: 5000,
    description: '再次点击登录按钮',
  },
  {
    action: 'wait',
    item: '.internation-code-input',
    timeout: 5000,
    description: '等待国际区号输入框',
  },
  {
    action: 'focus',
    item: '.internation-code-input',
    timeout: 5000,
    description: '聚焦国际区号输入框',
  },
  {
    action: 'evaluate',
    value: "document.querySelector('.internation-code-input').select()",
    description: '全选输入框内容',
  },
  { action: 'type', value: '86', description: '输入国际区号' },
  {
    action: 'wait',
    item: '#phone-number',
    timeout: 5000,
    description: '等待手机号输入框1',
  },
  {
    action: 'input',
    item: '#phone-number',
    value: mobile,
    timeout: 5000,
    description: '输入手机号到phone-number',
  },
  {
    action: 'wait',
    item: '#user-mobile',
    timeout: 5000,
    description: '等待手机号输入框2',
  },
  {
    action: 'input',
    item: '#user-mobile',
    value: mobile,
    timeout: 5000,
    description: '输入手机号到user-mobile',
  },
  {
    action: 'wait',
    item: '#code-button',
    timeout: 5000,
    description: '等待获取验证码按钮1',
  },
  {
    action: 'click',
    item: '#code-button',
    timeout: 5000,
    description: '点击获取验证码按钮1',
  },
  {
    action: 'wait',
    item: '#captcha-btn',
    timeout: 5000,
    description: '等待获取验证码按钮2',
  },
  {
    action: 'click',
    item: '#captcha-btn',
    timeout: 5000,
    description: '点击获取验证码按钮2',
  },
  {
    action: 'screenshot',
    value: (mobile: string) => `screenshots/${mobile}_captcha.png`,
    description: '截图保存验证码页面',
  },
];

// 第一步：打开登录页面并输入手机号
export async function initLogin(mobile: string) {
  console.log(`[${mobile}] 开始初始化登录流程...`);

  console.log(`[${mobile}] 启动浏览器...`);
  const browser = await initBrowser();
  console.log(`[${mobile}] 浏览器已启动`);

  const page = await createAndConfigurePage(browser, false);
  console.log(`[${mobile}] 新页面已创建`);

  // 执行登录工作流
  const workflow = getLoginWorkflow(mobile);

  // 替换截图路径中的动态值
  const screenshotStep = workflow.find((step) => step.action === 'screenshot');
  if (screenshotStep && typeof screenshotStep.value === 'function') {
    screenshotStep.value = (screenshotStep.value as any)(mobile);
  }

  await executeWorkflow(page, workflow, mobile);

  // 设置3分钟后自动销毁浏览器实例
  const timer = setTimeout(() => {
    console.log(`[${mobile}] 浏览器实例已超时，正在自动销毁...`);
    browser.close();
    instanceMap.delete(mobile);
  }, 3 * 60 * 1000); // 3分钟

  instanceMap.set(mobile, { browser, page, timer });

  // 获取页面HTML内容
  const pageHtml = await page.content();

  console.log(`[${mobile}] 初始化登录完成，请输入验证码`);

  return {
    browser,
    page,
    captchaImagePath: `screenshots/${mobile}_captcha.png`,
    pageHtml,
  };
}

// 完成登录工作流步骤
const getCompleteLoginWorkflow = (
  mobile: string,
  code: string
): WorkflowStep[] => [
  {
    action: 'wait',
    item: '#input-code',
    timeout: 3000,
    description: '等待验证码输入框1',
  },
  {
    action: 'input',
    item: '#input-code',
    value: code,
    description: '输入验证码到input-code',
  },
  {
    action: 'wait',
    item: '#captcha',
    timeout: 3000,
    description: '等待验证码输入框2',
  },
  {
    action: 'input',
    item: '#captcha',
    value: code,
    description: '输入验证码到captcha',
  },
  {
    action: 'wait',
    item: '.agreement-icon',
    timeout: 3000,
    description: '等待协议图标',
  },
  { action: 'click', item: '.agreement-icon', description: '点击协议图标' },
  {
    action: 'wait',
    item: 'button[type="submit"]',
    timeout: 3000,
    description: '等待登录按钮1',
  },
  {
    action: 'click',
    item: 'button[type="submit"]',
    description: '点击登录按钮1',
  },
  {
    action: 'wait',
    item: '#submit-btn',
    timeout: 3000,
    description: '等待登录按钮2',
  },
  { action: 'click', item: '#submit-btn', description: '点击登录按钮2' },
  { action: 'sleep', value: 2000, description: '等待页面响应' },
  {
    action: 'scroll',
    value: 100,
    description: '滚动到页面顶部',
  },
];

// 第二步：输入验证码并完成登录
export async function completeLogin(mobile: string, code: string) {
  const instance = instanceMap.get(mobile);
  if (!instance) {
    throw new Error('请先调用initLogin初始化登录');
  }
  const { browser, page, timer } = instance;

  // 清除定时器
  clearTimeout(timer);

  try {
    console.log(`[${mobile}] 开始执行完成登录工作流...`);

    // 使用工作流引擎执行登录步骤
    const workflow = getCompleteLoginWorkflow(mobile, code);
    await executeWorkflow(page, workflow, mobile);

    // 等待页面导航完成
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 10000,
      });
      console.log(`[${mobile}] 页面导航完成`);
    } catch (navError) {
      console.warn(`[${mobile}] 等待导航超时，继续执行...`);
    }

    // 获取cookies
    const cookies = await page.cookies();

    // 为每个账号单独保存cookies
    saveAccountCookies(mobile, cookies);
    console.log(`[${mobile}] Cookie 已保存，共 ${cookies.length} 个`);
  } catch (error) {
    console.error(`[${mobile}] 完成登录失败:`, error);
    throw error;
  } finally {
    // 关闭浏览器
    await browser.close();

    // 清空实例
    instanceMap.delete(mobile);
    console.log(`[${mobile}] 浏览器实例已关闭`);
  }
}
