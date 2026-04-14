# moegirlpedia-mediawiki-api

一个用于访问萌娘百科（Moegirlpedia）MediaWiki API 的 Node.js 命令行工具，同时也是 OpenClaw 可调用的 skill 运行时。

这个仓库的目标不是提供一个通用 SDK，而是提供一组稳定、可脚本化、默认输出 JSON 的预定义操作，用于在已经完成身份认证的前提下查询萌百页面、分类、监视列表和最近更改数据。

## 项目定位

- 适合在自动化脚本、智能体工作流、命令行排查任务中直接调用；
- 所有命令都输出结构化 JSON，便于二次处理；
- 需要登录后访问，适合处理匿名访问受限、需要监视列表权限或需要绕过站点风控的场景；
- 当前包在 package.json 中标记为 private，默认按源码仓库使用，而不是作为公开 npm 包分发。

## 主要能力

- 搜索页面并返回分页信息；
- 获取页面原始 Wikitext 或解析后的 HTML；
- 获取页面所属分类；
- 获取分类成员列表；
- 获取页面摘要、URL 和保护信息；
- 汇总当前账号监视列表中的最近改动；
- 用启发式规则筛出值得关注的最近更改，并生成简报。

## 环境要求

- Node.js 24.11 或更高版本；
- npm；
- 能访问萌娘百科 API 的网络环境；
- 一个可用的萌娘百科账号及 Bot Password。

## 认证配置

运行前必须设置以下环境变量：

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| MOEGIRLPEDIA_USERNAME | 是 | 萌娘百科用户名，通常建议使用 BotPassword 对应的账号名。 |
| MOEGIRLPEDIA_BOT_PASSWORD | 是 | 萌娘百科 Bot Password。不要填主密码。 |

推荐在 shell 中先导出变量：

```bash
export MOEGIRLPEDIA_USERNAME='ExampleBot@OpenClaw'
export MOEGIRLPEDIA_BOT_PASSWORD='your-bot-password'
```

如果任一变量缺失，程序会直接报错并退出。

## 安装与构建

如果你只是本地使用这个仓库，推荐直接按下面的方式安装：

```bash
npm ci
npm run build
```

构建完成后，CLI 入口为：

```bash
node dist/index.js
```

仓库也提供了一个便捷脚本：

```bash
bash scripts/run.sh help
```

这个脚本会在缺少依赖时自动执行 npm install，在缺少构建产物时自动执行 npm run build，然后再运行 CLI。对临时调用很方便，但在 CI 或可重复构建场景中，通常更建议显式执行 npm ci 和 npm run build。

## 快速开始

### 查看帮助

```bash
bash scripts/run.sh help
```

### 搜索页面

```bash
bash scripts/run.sh search '东方Project' --limit 5
```

### 获取页面源码

```bash
bash scripts/run.sh get-page '博丽灵梦'
```

### 获取页面 HTML

```bash
bash scripts/run.sh get-page '博丽灵梦' --format html
```

### 获取分类成员

```bash
bash scripts/run.sh get-category-members '东方Project角色' --type page --limit 100
```

### 获取监视列表简报

```bash
bash scripts/run.sh watchlist-brief --hours 24
```

### 获取最近更改告警简报

```bash
bash scripts/run.sh recent-changes-brief --hours 12 --large-delete-threshold 3000
```

## CLI 约定

通用调用格式如下：

```bash
moegirlpedia-mediawiki-api <operation> [positionals] [--options]
```

在本仓库中，最常见的调用方式是：

```bash
node dist/index.js <operation> [positionals] [--options]
```

或：

```bash
bash scripts/run.sh <operation> [positionals] [--options]
```

参数解析规则：

- 支持 `--key value` 和 `--key=value` 两种写法。
- 纯开关参数会被解析为布尔值。
- 某些筛选项支持用逗号或 `|` 分隔多个值，例如 `--namespace 0,14`。
- 当用户输入不合法时，程序会抛出 UsageError，并返回命令级别的用法提示。

退出码约定：

| 退出码 | 含义 |
| --- | --- |
| 0 | 成功，或显示帮助后正常退出。 |
| 1 | 未知命令或运行时错误。 |
| 2 | 参数错误。 |

## 命令总览

| 命令 | 作用 | 常用参数 |
| --- | --- | --- |
| search | 搜索页面 | `<query>`、`--limit`、`--continue-token` |
| get-page | 获取页面内容 | `<title>`、`--format` |
| get-categories | 获取页面所属分类 | `<title>`、`--limit`、`--continue-token` |
| get-category-members | 获取分类成员 | `<category>`、`--type`、`--limit`、`--continue-token` |
| get-page-info | 获取页面摘要和元数据 | `<title>` |
| watchlist-brief | 获取监视列表改动简报 | `--hours`、`--from`、`--to`、`--namespace`、`--type`、`--show`、`--user`、`--exclude-user`、`--limit`、`--continue-token` |
| recent-changes-brief | 获取最近更改告警简报 | `--hours`、`--from`、`--to`、`--namespace`、`--type`、`--show`、`--user`、`--exclude-user`、`--tag`、`--limit`、`--large-edit-threshold`、`--large-delete-threshold`、`--suspicious-keywords`、`--continue-token` |

## 命令详解

### 1. search

用途：搜索萌娘百科页面。

用法：

```bash
bash scripts/run.sh search <query> [--limit 10] [--continue-token TOKEN]
```

说明：

- 默认返回 10 条结果，最小 1，最大 50。
- 返回结果中的 snippetHtml 保留 MediaWiki 返回的 HTML 片段。
- snippetText 会去掉 HTML 标签，适合直接阅读或后处理。
- 支持分页。

主要返回字段：

- operation：固定为 `search`。
- query：实际搜索词。
- totalHits：总命中数。
- items：搜索结果数组。
- pagination：分页信息。

### 2. get-page

用途：读取页面正文。

用法：

```bash
bash scripts/run.sh get-page <title> [--format wikitext|html]
```

说明：

- 默认返回 Wikitext。
- 指定 `--format html` 时，会返回 MediaWiki parse 接口输出的 HTML。
- 返回值同时包含章节目录信息 sections。
- 页面标题会自动跟随重定向解析。

主要返回字段：

- operation：固定为 `get-page`。
- title：请求使用的标题。
- displayTitle：显示标题。
- revid：页面修订版本号。
- format：`wikitext` 或 `html`。
- content：正文内容。
- sections：章节数组。

### 3. get-categories

用途：列出页面所属分类。

用法：

```bash
bash scripts/run.sh get-categories <title> [--limit 50] [--continue-token TOKEN]
```

说明：

- 默认返回 50 条，最小 1，最大 500。
- hidden 字段表示该分类是否为隐藏分类。
- timestamp 为 MediaWiki 返回的分类时间戳，可能为空。
- 支持分页。

主要返回字段：

- operation：固定为 `get-categories`。
- requestedTitle：输入标题。
- pageTitle：解析后的页面标题。
- categories：分类数组。
- pagination：分页信息。

### 4. get-category-members

用途：列出某个分类下的页面、子分类或文件。

用法：

```bash
bash scripts/run.sh get-category-members <category> [--type page|subcat|file] [--limit 50] [--continue-token TOKEN]
```

说明：

- 如果输入不带 `Category:` 前缀，程序会自动补齐。
- `--type` 支持单个值，也支持逗号或 `|` 分隔多个值。
- 默认返回 50 条，最小 1，最大 500。
- 支持分页。

主要返回字段：

- operation：固定为 `get-category-members`。
- category：归一化后的分类标题。
- members：分类成员数组。
- pagination：分页信息。

### 5. get-page-info

用途：获取页面摘要与基础元信息。

用法：

```bash
bash scripts/run.sh get-page-info <title>
```

说明：

- extract 返回页面引言的纯文本摘要。
- fullUrl 和 editUrl 分别对应查看地址和编辑地址。
- protection 返回保护配置列表。

主要返回字段：

- operation：固定为 `get-page-info`。
- requestedTitle：输入标题。
- title：解析后的页面标题。
- displayTitle：显示标题。
- pageId：页面 ID。
- extract：纯文本摘要。
- fullUrl：页面 URL。
- editUrl：编辑 URL。
- protection：保护配置数组。

### 6. watchlist-brief

用途：按页面聚合当前登录账号监视列表中的最近改动。

用法：

```bash
bash scripts/run.sh watchlist-brief \
  [--hours 24] \
  [--from ISO-8601] \
  [--to ISO-8601] \
  [--limit 50] \
  [--namespace 0,14] \
  [--type edit|new|log] \
  [--show FILTERS] \
  [--user USERNAME] \
  [--exclude-user USERNAME] \
  [--continue-token TOKEN]
```

说明：

- 默认统计最近 24 小时。
- `--from` 和 `--to` 使用 ISO-8601 时间格式。
- 如果提供 `--hours` 且未提供 `--from`，则从当前时间往前回溯对应小时数。
- `--namespace`、`--type`、`--show` 支持逗号或 `|` 分隔多个值。
- 返回值除了原始分组数据，还会包含可直接展示的 brief 摘要数组。
- 支持分页。

主要返回字段：

- operation：固定为 `watchlist-brief`。
- timeRange：实际使用的时间范围。
- filters：本次请求生效的筛选条件。
- summary：总改动数、页面数和参与用户汇总。
- pages：按页面分组后的改动列表。
- brief：中文摘要行数组。
- pagination：分页信息。

### 7. recent-changes-brief

用途：从最近更改中筛出值得关注的改动，并按页面聚合。

用法：

```bash
bash scripts/run.sh recent-changes-brief \
  [--hours 24] \
  [--from ISO-8601] \
  [--to ISO-8601] \
  [--limit 100] \
  [--namespace 0,14] \
  [--type edit|new|log] \
  [--show FILTERS] \
  [--user USERNAME] \
  [--exclude-user USERNAME] \
  [--tag TAG] \
  [--large-edit-threshold 5000] \
  [--large-delete-threshold 2000] \
  [--suspicious-keywords spam,test,广告,侵权,外链,清空,删除,copyvio] \
  [--continue-token TOKEN]
```

当前实现会将命中以下任一条件的更改视为“需要关注”：

- 大量新增内容。
- 大量删除内容。
- 新建页面。
- 匿名用户编辑。
- 未巡查编辑。
- 指定日志类型：abusefilter、block、delete、import、move、protect、rights、upload。
- 编辑摘要或标签中命中可疑关键词。

说明：

- 默认统计最近 24 小时。
- 默认大编辑阈值为 5000 字节，大删除阈值为 2000 字节。
- `--suspicious-keywords` 支持逗号或 `|` 分隔多个关键词；未提供时使用内置默认值。
- 返回结果只包含命中规则的改动，不会返回全部 recent changes。
- 支持分页。

主要返回字段：

- operation：固定为 `recent-changes-brief`。
- timeRange：实际使用的时间范围。
- filters：本次请求生效的筛选条件。
- ruleSet：本次告警规则配置。
- summary：告警总数、页面总数、原因统计和参与用户汇总。
- pages：按页面分组后的告警列表。
- brief：中文摘要行数组。
- pagination：分页信息。

## 输出格式

所有命令都向标准输出打印 JSON，并使用 2 空格缩进。

典型返回格式如下：

```json
{
  "operation": "search",
  "items": [],
  "pagination": {
    "hasMore": false,
    "continue": null,
    "continueToken": null
  }
}
```

摘要类命令还会额外返回：

- brief：供人类或智能体快速阅读的摘要文本数组。
- summary：汇总统计。
- pages：按页面聚合后的明细。

## 分页机制

支持分页的命令会返回一个 pagination 对象：

| 字段 | 含义 |
| --- | --- |
| hasMore | 是否还有下一页。 |
| continue | MediaWiki 原始续页对象。 |
| continueToken | 将原始续页对象进行 base64url 编码后的字符串。 |

继续获取下一页时，直接把上一次返回的 continueToken 传回去即可：

```bash
bash scripts/run.sh search '博丽' --continue-token '上一次返回的令牌'
```

约定：

- 调用方应将 continueToken 视为不透明字符串，不要自行构造。
- 本项目不会自动翻页，是否继续请求由调用方决定。

## OpenClaw / Skill 集成

这个仓库包含一个根目录下的 SKILL.md，用于向 OpenClaw 描述该工具的能力、环境依赖和推荐调用方式。

推荐集成方式：

1. 在运行环境中准备好 Node.js、npm 和网络访问。
2. 配置好 MOEGIRLPEDIA_USERNAME 与 MOEGIRLPEDIA_BOT_PASSWORD。
3. 让上层代理通过 `bash scripts/run.sh <operation> ...` 调用本仓库。

如果你在为智能体新增操作，请同步更新以下内容：

- src/operations 下的实现文件。
- src/operations/index.ts 中的注册列表。
- test/operations 下的单元测试。
- 根目录 SKILL.md 中的命令说明。

## 开发

### 常用命令

```bash
npm ci
npm run build
npm run lint
npm run test
npm run test:watch
```

### 技术栈

- TypeScript。
- ESM。
- mwn，用于登录并请求 MediaWiki API。
- Vitest，用于单元测试。
- ESLint，用于静态检查。

### CI

仓库当前配置了两条 GitHub Actions 工作流：

- lint：安装依赖、构建并运行 `npm run lint`。
- test：安装依赖、构建并运行 `npm run test`。

### 发布流程

仓库提供了一个发布脚本，可以直接通过 npm 触发：

```bash
npm run release
```

如果希望显式传入版本号，也可以这样执行：

```bash
npm run release -- [<version>]
```

发布脚本会执行以下动作：

- 要求当前分支必须是默认分支，且工作区必须干净。
- 先执行 `npm run lint`，通过后再继续处理版本号和后续发布流程。
- 未传入版本号时，交互式询问目标版本号。
- 检查本地和远端是否已存在同名发布分支或 tag。
- 创建 `production/v<version>` 分支。
- 更新 package.json 与 package-lock.json 中的版本号。
- 安装依赖并重新构建 dist。
- 创建 `chore(release): v<version>` 提交和对应 tag。
- 自动推送发布分支和 tag。
- 发布成功后，切回默认分支并把 `package.json` 与 `package-lock.json` 中的版本号更新为新版本。
- 脚本结束时无论成功或失败，都会切回默认分支。
- 如果在发布分支成功推送前失败，会自动删除本地发布分支和 tag。

这个流程会把构建产物 dist 一并纳入发布提交。

当远端收到新的 `v*` tag 时，GitHub Actions 会自动构建发布包并通过 ClawHub CLI 发布到 ClawHub。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| src/client.ts | 负责读取环境变量并初始化已认证的 MediaWiki 客户端。 |
| src/helpers.ts | CLI 参数解析、时间范围处理、分页令牌处理等公共工具。 |
| src/index.ts | CLI 主入口。 |
| src/operations | 所有预定义操作的实现。 |
| test | 单元测试。 |
| scripts/run.sh | 本地运行脚本，带自动安装和自动构建。 |
| scripts/release.sh | 发布脚本。 |
| SKILL.md | 面向 OpenClaw 的技能说明。 |

## 常见问题

### 1. 提示缺少环境变量

请确认当前 shell 已设置 MOEGIRLPEDIA_USERNAME 和 MOEGIRLPEDIA_BOT_PASSWORD，且变量值没有被意外写成空字符串。

### 2. 为什么 recent-changes-brief 返回为空

这不是接口异常。这个命令只返回命中关注规则的改动。如果时间范围内没有命中规则的更改，结果会是空数组，同时 brief 中会给出“没有命中当前规则的改动”的提示。

### 3. 为什么 watchlist-brief 没有任何结果

该命令依赖当前登录账号的监视列表。如果账号没有监视任何页面，或者筛选条件过严，就会返回空结果。

### 4. continueToken 可以自己拼吗

不建议。continueToken 是对 MediaWiki 续页对象的封装，应直接复用上一次返回值。

### 5. 为什么脚本第一次运行比较慢

因为 scripts/run.sh 在缺少 node_modules 或 dist/index.js 时会自动执行安装与构建。首次执行慢属于预期行为。

## 安全建议

- 不要把 Bot Password 写入仓库。
- 不要把账号主密码当作 MOEGIRLPEDIA_BOT_PASSWORD 使用。
- 如果这是部署环境，优先使用受控的环境变量注入方式。
- 如果 Bot Password 已泄漏，请尽快在萌娘百科对应页面中轮换并更新环境变量。

## 许可证

本仓库采用 Apache License 2.0 许可证发布，详见 [LICENSE](LICENSE)。

第三方依赖仍分别受其各自许可证约束。

## 源代码

该 Skill 源代码托管于 Github 仓库：<https://github.com/AnnAngela/moegirlpedia-mediawiki-api>
