# PcrAdmin

PCR 游戏辅助平台管理后台，基于 [Vben Admin](https://github.com/vbenjs/vue-vben-admin) 二次开发，使用 Vue 3、TypeScript、Vite 和 Element Plus 构建。

本项目是 PCR 游戏辅助平台的管理员端，配合独立的 Laravel 后端 API 使用。

## 项目说明

- 项目名称：PcrAdmin
- 项目类型：Web 管理后台
- 前端框架：Vue 3
- 管理后台基础框架：[Vben Admin](https://github.com/vbenjs/vue-vben-admin)
- UI 组件库：Element Plus
- 开发语言：TypeScript
- 构建工具：Vite
- 包管理工具：pnpm
- 后端服务：Laravel API

## 功能介绍

管理后台用于维护 PCR 游戏辅助平台的数据和业务功能，包括：

- 游戏角色及相关数据管理
- Boss 数据管理
- 游戏作业及相关数据管理
- 用户及公会相关管理
- 平台业务配置管理

具体功能以项目实际开发进度为准。

## 项目结构

本项目保留了 Vben Admin 的 Monorepo 项目结构，当前主要使用 Element Plus 管理端。

```text
vue-vben-admin/
├── apps/
│   └── web-ele/          # PcrAdmin 管理端
├── packages/             # Vben Admin 公共组件及基础包
├── internal/             # 内部工具及配置
├── scripts/              # 项目脚本
├── docs/                 # 文档相关
├── package.json
├── pnpm-workspace.yaml
└── README.zh-CN.md
```

## 环境要求

- Node.js：请使用项目 `.node-version` 指定的版本
- pnpm：使用 Corepack 管理 pnpm 版本
- 后端：需要单独部署并运行对应的 Laravel API 服务

## 安装与运行

### 1. 获取项目

```bash
git clone <你的 GitHub 仓库地址>
cd <项目目录>
```

### 2. 启用 pnpm

```bash
corepack enable
```

### 3. 安装依赖

在项目根目录执行：

```bash
pnpm install
```

### 4. 配置开发环境

在 `apps/web-ele` 目录下创建对应的环境配置文件。

根据实际部署情况配置后端 API 地址。不要将包含本地环境信息或敏感配置的 `.env` 文件提交到 GitHub。

### 5. 启动开发服务器

回到项目根目录执行：

```bash
pnpm dev:ele
```

### 6. 构建生产版本

```bash
pnpm build:ele
```

## 后端 API

本项目不包含 Laravel 后端代码。

后端 API 需要单独部署，并在前端开发环境中配置对应的 API 地址。

## 开源协议与版权声明

本项目基于 [Vben Admin](https://github.com/vbenjs/vue-vben-admin) 二次开发。

Vben Admin 原项目遵循 MIT License，本项目保留原项目的许可证及版权声明。

原项目版权归 Vben 及其原作者所有。PcrAdmin 的二次开发内容由本项目维护者负责。

## 致谢

感谢 [Vben Admin](https://github.com/vbenjs/vue-vben-admin) 提供的优秀开源管理后台框架。
