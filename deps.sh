#!/bin/bash
set -e

# 更新系统包
echo "更新系统包..."
sudo yum update -y

# 安装基础依赖（包含ca-certificates）
echo "安装基础系统依赖（含证书支持）..."
sudo yum install -y \
  alsa-lib \
  atk \
  ca-certificates \
  cups-libs \
  gtk3 \
  libXcomposite \
  libXcursor \
  libXdamage \
  libXext \
  libXi \
  libXrandr \
  libXrender \
  libXtst \
  pango \
  xorg-x11-fonts-100dpi \
  xorg-x11-fonts-75dpi \
  xorg-x11-fonts-cyrillic \
  xorg-x11-fonts-misc \
  xorg-x11-fonts-Type1 \
  xorg-x11-utils

# 更新证书存储
echo "更新SSL证书存储..."
sudo update-ca-trust extract

# 安装字体包（解决中文显示问题）
echo "安装字体支持..."
sudo yum install -y \
  liberation-fonts \
  ipa-gothic-fonts \
  ipa-mincho-fonts \
  ipa-pgothic-fonts \
  ipa-pmincho-fonts

# 安装Chrome浏览器
echo "安装Chrome浏览器..."
sudo amazon-linux-extras install epel -y
sudo yum install -y https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

# 验证Chrome安装
echo "验证Chrome版本..."
google-chrome --version || { echo "Chrome安装失败"; exit 1; }

# 安装Node.js 18.x（长期支持版本）
read -p "是否需要安装Node.js 18.x? (y/n) " install_node
if [ "$install_node" = "y" ] || [ "$install_node" = "Y" ]; then
  echo "安装Node.js 18.x..."
  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
  sudo yum install -y nodejs
  echo "验证Node.js版本..."
  node -v || { echo "Node.js安装失败"; exit 1; }
  echo "验证npm版本..."
  npm -v || { echo "npm安装失败"; exit 1; }
fi

echo "所有依赖安装完成！"
echo "可以通过 npm install puppeteer 安装Puppeteer了"
