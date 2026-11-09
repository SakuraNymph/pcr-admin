# PcrAdmin

PcrAdmin is the administration panel for a Princess Connect! Re:Dive (PCR) game assistance platform.

It is built on top of [Vben Admin](https://github.com/vbenjs/vue-vben-admin), with Vue 3, TypeScript, Vite, and Element Plus.

The frontend works with a separately deployed Laravel API backend.

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- pnpm Monorepo
- Turbo

## Features

The administration panel provides management tools for the PCR platform, including:

- Game character data management
- Boss data management
- Game team and guide management
- User and guild management
- Platform configuration

Features are continuously evolving.

## Project Structure

The main application is located in `apps/web-ele`.

This repository retains the original Vben Admin monorepo structure and shared packages.

## Requirements

- Node.js version specified in `.node-version`
- pnpm (managed through Corepack)
- A separately deployed Laravel API backend

## Getting Started

```bash
git clone https://github.com/SakuraNymph/pcr-admin.git
cd pcr-admin
corepack enable
pnpm install
```

Start the Element Plus application:

```bash
pnpm dev:ele
```

Build for production:

```bash
pnpm build:ele
```

Configure the backend API address in the application's environment configuration before running the application.

## Documentation

- [简体中文说明](./README.zh-CN.md)

## License and Attribution

This project is based on [Vben Admin](https://github.com/vbenjs/vue-vben-admin).

The original Vben Admin project is licensed under the MIT License. The original copyright and license notices are retained in this repository.

PcrAdmin's additional development and modifications are maintained separately from the original Vben Admin project.

Thanks to the Vben Admin contributors for their excellent open-source work.
