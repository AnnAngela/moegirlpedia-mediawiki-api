---
name: moegirlpedia-mediawiki-api
description: 经过身份认证访问萌娘百科（Moegirlpedia）的 MediaWiki API，用于页面搜索、获取页面内容、分类、分类成员、页面摘要、监视列表简报及最近更改简报。当 OpenClaw 需要获取萌娘百科数据，且必须先登录以避开权限限制或防火墙拦截时，请使用此项。
compatibility: Requires Node.js 24.11+, npm, internet access, and the environment variables MOEGIRLPEDIA_USERNAME and MOEGIRLPEDIA_BOT_PASSWORD.
metadata: {"openclaw":{"requires":{"env":["MOEGIRLPEDIA_USERNAME","MOEGIRLPEDIA_BOT_PASSWORD"],"bins":["bash","node","npm"]},"primaryEnv":"MOEGIRLPEDIA_BOT_PASSWORD"}}
---

# 萌娘百科 MediaWiki API

当您需要通过 MediaWiki API 获取萌娘百科经过身份认证的数据时，请使用此技能（skill）。

## 命令

通过附带的脚本运行命令：

```bash
bash {baseDir}/scripts/run.sh <operation> [arguments] [--options]
```

可用操作：

- `search <query> [--limit 10] [--continue-token TOKEN]`
- `get-page <title> [--format wikitext|html]`
- `get-categories <title> [--limit 50] [--continue-token TOKEN]`
- `get-category-members <category> [--type page|subcat|file] [--limit 50] [--continue-token TOKEN]`
- `get-page-info <title>`
- `watchlist-brief [--hours 24] [--from ISO] [--to ISO] [--limit 50] [--namespace 0,14] [--continue-token TOKEN]`
- `recent-changes-brief [--hours 24] [--from ISO] [--to ISO] [--limit 100] [--large-edit-threshold 5000] [--large-delete-threshold 2000] [--continue-token TOKEN]`

## 分页

支持分页的操作会在 `pagination` 字段下返回一个 JSON 对象：

- `hasMore`：是否有更多结果可用
- `continue`：原始的 MediaWiki 续页有效载荷（payload）
- `continueToken`：经过 base64url 编码的令牌（token），您可以通过 `--continue-token` 将其传回

除非用户明确要求提供更多内容，否则请勿自动获取下一页。

## 输出

所有命令均向标准输出（stdout）打印结构化的 JSON 数据。简报式（Brief-style）命令还会包含一个 `brief` 数组，提供简明的摘要信息行。

## 示例

```bash
bash {baseDir}/scripts/run.sh search "东方Project"
bash {baseDir}/scripts/run.sh get-page "博丽灵梦" --format html
bash {baseDir}/scripts/run.sh get-categories "博丽灵梦"
bash {baseDir}/scripts/run.sh get-category-members "东方Project角色" --type page --limit 100
bash {baseDir}/scripts/run.sh get-page-info "博丽灵梦"
bash {baseDir}/scripts/run.sh watchlist-brief --hours 24
bash {baseDir}/scripts/run.sh recent-changes-brief --hours 12 --large-delete-threshold 3000
```

## 机器人密码轮换提醒

在使用此技能之前，请检查 OpenClaw 的 memory.md 文件中是否存在 `moegirlpedia_bot_password_last_rotated` 记录。

- 如果缺失该记录，请在完成当前任务后询问用户上一次轮换密码的日期并进行记录。
- 如果距今已超过 90 天，请提醒用户前往 `https://mzh.moegirl.org.cn/Special:BotPasswords` 轮换机器人（bot）密码，并更新 `MOEGIRLPEDIA_BOT_PASSWORD`。
- 成功轮换后，请将 memory.md 中的 `moegirlpedia_bot_password_last_rotated` 更新为当前日期。

该提醒必须由 OpenClaw 处理，而非由 Node.js 运行时（runtime）处理。
