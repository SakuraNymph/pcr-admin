# AGENTS.md

本文件适用于本仓库及其全部子目录。本项目是 pnpm monorepo，但实际业务管理后台是 `apps/web-ele`。

## 通用开发规则

1. 修改代码前先检查当前实现及相关调用关系，不要仅凭文件名推测功能。
2. 遵循最小修改原则，只处理当前需求涉及的代码，不进行无关重构。
3. 不擅自删除现有功能、修改数据库数据或执行破坏性操作。
4. 需求不明确、接口契约存在冲突或需要改变数据库结构时，先与用户讨论方案。
5. 修改前检查相关调用方，修改后根据项目条件进行适当的语法、类型或功能检查。
6. 不要将密码、Token、API Key、数据库凭据等敏感信息写入文档、日志或提交内容。
7. 不要把尚未验证的推测写成确定事实。
8. 不要擅自安装依赖、升级框架或更改构建工具。

## 项目范围

- 实际管理后台是 `apps/web-ele`。
- `apps/web-antd`、`apps/web-naive`、`apps/web-tdesign`、`playground` 等属于 monorepo 中的其他示例应用。
- 除非用户明确要求，不要修改其他示例子应用。
- 业务代码主要位于 `apps/web-ele/src`。
- 共享能力位于 `packages`；修改共享包前必须搜索所有使用方，避免影响其他应用。

## 技术栈与版本来源

- 技术栈：Vue 3、TypeScript、Vite、Element Plus、Pinia、Vue Router。
- 使用 pnpm workspace 和 Turbo 管理 monorepo。
- 具体版本以根 `package.json`、`apps/web-ele/package.json`、`pnpm-workspace.yaml` 的 catalog 和 `pnpm-lock.yaml` 为准。
- 根 `package.json` 当前声明 Node `^20.19.0 || ^22.18.0 || ^24.0.0` 和 `pnpm@10.33.0`。
- 不要把 catalog 约束当作已安装精确版本。
- 不要在没有必要时修改 monorepo 根依赖、升级依赖或更改构建工具。

## 关键配置与目录

- `apps/web-ele/package.json`：应用脚本和依赖。
- `apps/web-ele/vite.config.ts`：开发服务器、允许主机和 `/api` 代理。
- `apps/web-ele/tsconfig.json`：继承 `@vben/tsconfig/web-app.json`，`#/*` 映射到 `src/*`。
- `apps/web-ele/src/api/request.ts`：请求客户端、拦截器和 Token 注入。
- `apps/web-ele/src/api/core`：业务 API 模块。
- `apps/web-ele/src/router`：核心路由、动态路由和访问控制。
- `apps/web-ele/src/store`：应用级认证状态。
- `apps/web-ele/src/views`：业务页面。
- `apps/web-ele/src/layouts`：基础布局和认证布局。
- `apps/web-ele/src/adapter`：Element Plus、表单和表格适配。

## 请求与认证现状

- 实际 API 基础地址来自 `VITE_GLOB_API_URL`，不是 `VITE_APP_BASE_API`。
- 开发环境当前使用 `/api`；Vite 将 `/api` 代理到 `http://lara.test/api/admin`，并移除请求路径开头的 `/api`。
- 请求拦截器添加 `Authorization: Bearer <token>` 和 `Accept-Language`。
- 响应拦截器以业务字段 `status === 0` 判断成功，并自动取出 `data`。
- 错误提示依次尝试 `error`、`msg`、第一条 `errors`、`message`。
- 401 会触发重新认证；是否刷新 Token 由 `preferences.app.enableRefreshToken` 决定。
- Access Token、Refresh Token、权限码等存储在 Pinia access store 中并持久化。
- 登录成功后调用 `/login`，保存 `accessToken`，再并行请求 `/info` 和 `/codes`。
- 退出登录调用 `/logout`，重置 store 并跳转登录页。
- `accessMode` 当前为 `backend`；动态菜单从 Laravel `/menus` 获取并转换为路由。
- 页面操作使用 `hasAccessByCodes([...])` 根据后端权限码控制显示。

## 页面与 API 组织

- API 模块位于 `apps/web-ele/src/api/core`，包括管理员、认证、Dashboard、游戏角色、菜单、权限、角色、系统日志、作业和用户管理。
- `api/core/index.ts` 只统一导出部分模块；其他模块可能由页面直接导入。
- 业务页面按 `dashboard`、`game`、`system`、`user`、`_core` 等目录组织。
- 动态业务菜单主要来自 Laravel；静态路由模块中仍保留 `dashboard`、`demos`、`test`、`vben` 等模板路由。
- 修改页面时先检查现有路由、API 模块、组件、权限码和后端返回结构，优先复用现有实现。

## 与 Laravel 的接口约定

- 管理后台连接 Laravel 后端，主要使用 `/api/admin/*` 接口。
- 修改接口时检查 Laravel 的实际路由、HTTP 方法、请求参数、返回字段和权限规则。
- 不要只根据前端 TypeScript 类型判断接口契约；Laravel Controller、Request 和中间件才是后端行为的依据。
- 公共 API 变更必须检查 uni-app 用户端是否也受影响。
- Laravel 标准响应为 `{status, code, msg, data}`，本请求客户端会自动解包 `data`。
- Laravel 验证失败为 `{message, errors}`；错误拦截器已有读取 `errors` 的逻辑。
- 不要在前端重新引入与现有响应信封冲突的自动解包逻辑。

## 修改检查清单

1. 确认需求属于 `apps/web-ele`，而不是其他示例应用或共享包。
2. 阅读相关页面、API 模块、store、路由、权限码和共享组件。
3. 对照 Laravel 实际路由与请求验证，确认参数和响应字段。
4. 检查认证、动态菜单和 `hasAccessByCodes` 权限控制。
5. 检查 401、验证错误和业务 `status!=0` 的现有处理。
6. 只修改当前需求涉及的文件，不进行无关重构。
7. 在依赖和 pnpm 环境可用时，对 `apps/web-ele` 执行适当的类型检查或构建检查；不要为此擅自安装依赖。
8. 修改共享包前检查整个 monorepo 的使用方，并优先避免影响其他应用。

## 待核实事项

以下是已发现的潜在不一致，尚未确认或修复。不要在无关任务中顺带改动：

- `apps/web-ele/.env.production` 的 `VITE_GLOB_API_URL` 仍指向 Vben 官方 mock 地址，不是 Laravel。
- 前端存在 `/auth/refresh` 调用，但当前 Laravel `routes/api.php` 没有对应路由。
- Laravel `/info` 返回 Admin 模型字段，而 Vben `UserInfo` 类型要求 `avatar`、`realName`、`userId`、`username` 等字段，类型契约可能不匹配。
- 菜单状态切换只发送 `{status}`，而 Laravel `UpdateMenuRequest` 要求 `parent_id`、`type`、`name`、`title`；运行时结果尚未验证。
- `deleteMenu(id)` 的单 ID 分支会生成 `DELETE /menus/:id`，Laravel 仅提供接收 `ids` 数组的 `DELETE /api/admin/menus`；当前菜单页使用数组形式，现有 UI 路径兼容。
- `analytics.ts` 的类型声明包含额外的 `data` 包装，但请求客户端已经解包 `data`；类型与运行时结构可能不一致。
- 后端菜单 `component` 字符串能否全部被动态组件解析，尚未做运行时验证。

## 跨项目协作

- Laravel 是唯一后端和数据库所有者。
- Vue 管理后台与 uni-app 用户端是两个独立前端，不直接互相调用。
- 开发某个前端功能时，只在必要时修改 Laravel；不要顺带修改另一个前端。
- 修改公共 API 时，检查所有相关调用方，避免接口参数或响应字段不兼容。
- 三个项目分别维护自己的 `AGENTS.md`，不要求合并成一个共同文件。

