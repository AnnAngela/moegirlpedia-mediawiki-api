# 添加操作

本项目将每个预定义的操作保存在 `src/operations` 目录下的独立文件中。

## 步骤

1. 创建一个导出 `OperationDefinition` 的新文件。
2. 仅从位置参数（`positionals`）和选项（`options`）中解析输入。
3. 发起一次 MediaWiki API 请求并返回结构化的 JSON 数据。
4. 如果 API 存在分页，请返回由 `buildPagination(...)` 生成的 `pagination`，并且切勿自动跟进（auto-follow）分页。
5. 在 `src/operations/index.ts` 中注册新操作。
6. 在 `test/operations` 目录下添加单元测试。
7. 更新 `SKILL.md`，以便 OpenClaw 能够发现并使用新命令。

## 指南

- 保持运行时输出稳定，并遵循 JSON 优先（JSON-first）原则。
- 遇到无效的用户输入时，抛出 `UsageError`。
- 优先使用 `src/helpers.ts` 中的辅助函数来处理选项解析、时间范围和延续令牌（continuation tokens）。
- 如果操作会生成摘要（digest）或总结（summary），请同时包含原始的结构化数据和一个供智能体（agent）快速阅读的 `brief` 数组。
