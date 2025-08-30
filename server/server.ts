import to from 'await-to-js';
import { completeLogin, initLogin } from './login';
import {
  getAccountCookies,
  getAllLoggedInAccounts,
  removeAccount,
} from './utils';

import * as fs from 'fs';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import send from 'koa-send';
import * as path from 'path';
import { order } from './order';
// 导入登录和下单功能模块

// 定义请求体接口

const app = new Koa();
const router = new Router();

// 使用 bodyparser 中间件
app.use(bodyParser());

// 获取所有已登录账号
router.get('/accounts', async (ctx) => {
  const accounts = getAllLoggedInAccounts();
  ctx.status = 200;
  ctx.body = { accounts };
});

// 获取指定账号的cookies
router.get('/account/:mobile/cookies', async (ctx) => {
  const { mobile } = ctx.params;
  const cookies = getAccountCookies(mobile);

  if (!cookies) {
    ctx.status = 404;
    ctx.body = { error: '账号未登录或cookies不存在' };
    return;
  }

  ctx.status = 200;
  ctx.body = { cookies };
});

// 删除指定账号
router.delete('/account/:mobile', async (ctx) => {
  const { mobile } = ctx.params;
  const success = removeAccount(mobile);

  if (!success) {
    ctx.status = 404;
    ctx.body = { error: '账号不存在' };
    return;
  }

  ctx.status = 200;
  ctx.body = { message: '账号删除成功' };
});

// 添加新账号
// 第一步：发送手机号，触发获取验证码
router.post('/login/step1', async (ctx) => {
  console.log('ctx.request', ctx.request.body);
  const { mobile } = ctx.request.body;
  const [err, result] = await to(initLogin(mobile));
  if (err) {
    ctx.status = 500;
    ctx.body = { error: '初始化登录失败', details: err.message };
  } else {
    ctx.status = 200;

    ctx.body = { message: '请输入验证码', data: result };
  }
});

// 第二步：完成登录
router.post('/login/step2', async (ctx) => {
  const { mobile, captcha } = ctx.request.body;
  const [err, result] = await to(completeLogin(mobile, captcha));
  if (err) {
    ctx.status = 500;
    ctx.body = { error: '登录失败', details: err.message };
  } else {
    ctx.status = 200;
    ctx.body = { message: '登录成功' };
  }
});

// 下单接口
router.post('/order', async (ctx) => {
  const { mobile, url, payType } = ctx.request.body;
  const [err, result] = await to(
    order({
      mobile,
      url,
      payType,
    })
  );
  if (err) {
    ctx.status = 500;
    ctx.body = {
      details: err.message,
      err_no: -1,
    };
  } else {
    ctx.status = 200;
    ctx.body = { err_no: 0, data: result };
  }
});

// batchOrder
router.post('/batchOrder', async (ctx) => {
  const { mobile, url, payType, count } = ctx.request.body;
  const results: any[] = [];
  for (let i = 0; i < count; i++) {
    const [err, result] = await to(
      order({
        mobile,
        url,
        payType,
      })
    );
    if (!err) {
      results.push(result);
    }
  }
  ctx.status = 200;
  ctx.body = { err_no: 0, data: results };
});

// 目录浏览服务 - 提供/screenshots目录浏览
import serveIndex from 'koa-serve-index';
app.use(serveIndex(path.join(__dirname, 'screenshots')));

// 静态文件服务 - 提供验证码截图访问
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/screenshots/')) {
    const filePath = path.join(__dirname, ctx.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      await send(ctx, ctx.path, { root: __dirname });
      return;
    }
  }
  await next();
});

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器正在运行在 http://localhost:${PORT}`);
});
