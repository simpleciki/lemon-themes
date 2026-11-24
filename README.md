# Lemon Themes · 柠檬主题

[English](README.en.md)

给 Claude 桌面 App 换上手绘风的皮肤：两侧飘着贴纸，右下角有一只会眨眼、会打瞌睡的小吉祥物，输入框上方是一条看得懂的用量条。

> 截图待补

## 现在有的主题

| 主题 | 画风 | 会做什么 |
|---|---|---|
| **lemon-bear 柠檬小熊** | 绘本彩铅贴纸：奶油格纹、柠檬、雏菊、蜜蜂和一只戴黄贝雷帽的蜂蜜色小熊 | 小熊坐着眨眼、轻轻摇头；10 分钟没动静会趴下睡觉冒 zzz；点它会跳一下冒爱心；你夸它、提交成功、测试通过时撒花 |

## 用量条能看到什么

模型、思考强度、上下文用量（一杯柠檬水，水位就是用量）、本次 Token、子 agent 次数、按 API 价折算的等价金额（估算，不是账单），以及 5 小时和每周额度与重置时间。`/lemon` 打开详细面板。

## 安装

需要 Claude Code 2.1.330 或更新的版本（背景点击事件 `ui.pointer` 从这一版才有）。

在终端里的 Claude Code 对话框输入：

```
/plugin install lemon-bear --marketplace simpleciki/lemon-themes
```

问「Add marketplace?」时回 `y`，范围选 user。也可以在命令行里装：

```bash
claude plugin install lemon-bear --marketplace simpleciki/lemon-themes
```

桌面 App 里 `/plugin` 不能用：点输入框旁边的 +，选 Plugins，Add marketplace 填 `simpleciki/lemon-themes`，再 Add plugin。

装好后新开的会话就是柠檬小熊。背景只在桌面 App 和手机 App 上显示；终端里只有用量条。

## 做一套新主题

见 [skills/make-theme/SKILL.md](skills/make-theme/SKILL.md)。先读 [docs/LESSONS.md](docs/LESSONS.md)：里面是 App 实际能播什么、不能播什么。

## 目录

| 路径 | 内容 |
|---|---|
| `plugins/<主题>/` | 插件本体 |
| `art-src/<主题>/` | 原画和每张图的提示词记录，以及 `theme-build.json` |
| `tools/build_theme.py` | 把原画切开、描成矢量，生成插件要的数据 |
| `docs/LESSONS.md` | 踩坑记录 |

## 许可证

MIT，见 [LICENSE](LICENSE)。`make-colors.js` 来自 Claude Code 的插件编写工具包，不在 MIT 范围内，见 [NOTICE](NOTICE)。
