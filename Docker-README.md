# Docker 部署指南

## 快速开始

### 方法1：使用Docker Compose（推荐）

```bash
# 构建并启动服务
docker-compose up --build

# 后台运行
docker-compose up -d --build
```

### 方法2：使用Dockerfile

```bash
# 使用最终版本（Node 18 + Chrome）
docker build -f Dockerfile.final -t pdd-demo .
docker run -p 3000:3000 pdd-demo

# 或者使用buildkite/puppeteer镜像
docker build -t pdd-demo .
docker run -p 3000:3000 pdd-demo

# 或者使用简化版本
docker build -f Dockerfile.simple -t pdd-demo-simple .
docker run -p 3000:3000 pdd-demo-simple
```

## 修复构建错误

如果之前遇到Debian buster仓库404错误，我们已经：

1. **升级到Debian Bookworm**：
   - 使用`node:18-bookworm`替代过时的buster
   - 修复了所有仓库404问题

2. **修复GPG密钥问题**：
   - 使用新的GPG密钥格式
   - 修复了签名验证问题

3. **提供多个构建选项**：
   - `Dockerfile.minimal`：使用官方Puppeteer镜像（推荐）
   - `Dockerfile.final`：使用Node 18 + Chrome
   - `Dockerfile.simple`：使用Node 18-slim + Chrome

## 解决权限问题

如果你遇到 "Running as root without --no-sandbox" 错误，我们已经做了以下配置：

1. **Dockerfile中**：
   - 使用非root用户运行（pptruser）
   - 添加了所有必要的Chrome参数

2. **puppeteer配置中**：
   - 添加了`--no-sandbox`和`--disable-setuid-sandbox`
   - 使用`headless: true`模式运行

## 环境变量

- `NODE_ENV=production`
- `PORT=3000`

## 数据持久化

cookies目录会被挂载到容器中，确保登录状态持久化：

```yaml
volumes:
  - ./cookies:/app/server/cookies
```

## 调试

如果仍然遇到问题，可以尝试：

```bash
# 查看容器日志
docker logs pdd-demo-container

# 进入容器调试
docker exec -it pdd-demo-container bash

# 手动测试Chrome
node -e "const puppeteer = require('puppeteer'); puppeteer.launch({headless: true, args: ['--no-sandbox']}).then(browser => console.log('Chrome started successfully')).catch(console.error)"
```