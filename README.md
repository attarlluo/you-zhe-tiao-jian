# 有这条件

**简体中文** · [English](README.en.md)

[**在线打开「有这条件」**](https://attarlluo.github.io/you-zhe-tiao-jian/?lang=zh) · [**English demo**](https://attarlluo.github.io/you-zhe-tiao-jian/?lang=en)

> 以前没这条件。现在有了，学点什么？

一个从兴趣开始、靠练习和复测继续往下学的自学工作台。好奇时可以去海洋球捞一个主题，想系统学时可以按时间预算排练习，做完就有反馈和下次复测时间。**机器学习是当前公开演示的学科。**

## 可以做什么

- **玩实验。** 拖动 XOR 的权重观察错分，调整阈值看精确率和召回率，或改变步幅和填充看卷积窗口怎么移动。
- **逛资源。** 30 个公开资源分布在四个主题区域。跨主题的球会在有关区域间移动。可以随机捞球、按主题筛选，或切到完整清单。
- **安排与复测。** 12 个主题、24 道自编练习。数值题可以核对，开放题有自查清单。作答后记下卡点，系统安排复测。

## 本地运行

1. Windows 上双击 [Start-Learning.cmd](Start-Learning.cmd)。其他系统可在项目目录运行下方命令。若系统使用 `python3`，把命令中的 `python` 换成 `python3`。
2. 打开 [http://127.0.0.1:4330/](http://127.0.0.1:4330/) 进入首页。从首页可以去[复习工作台](study.html)或[学习海洋球](explore.html)。

```bash
python -m http.server 4330 --bind 127.0.0.1
```

这是静态网站，在线版由 GitHub Pages 托管，也可以照上面的步骤在本地运行。页面和实验无需构建、账号或 AI API。外部资料在点开链接后由原网站提供。

页面顶部的 **English / 简体中文** 可切换全站语言，包含实验反馈、练习和海洋球说明。切换时会保留当前页面和已经保存的进度。也可以直接分享带 `?lang=en` 或 `?lang=zh` 的地址。

作答、草稿和复测记录保存在当前浏览器。清理站点数据或换设备前，在工作台的「资料与记录」导出 JSON。导入会合并作答历史。从本地版切换到网页版时，也可以用这个方式带上原有进度。

想开始就点首页的「先做一题」，工作台会直接打开下一项练习，优先复测到期题。也可以先走一遍「3 分钟导学」，看单层模型怎样错分，再切换两层模型。做完题后，复测页会提示下一次回来的时间。

## 版权与出处

**本项目原创代码、页面设计、讲解、练习和插图的未授予权利予以保留。** 如要转载、分发改编版本或商业使用原创内容，请先通过仓库联系权利人取得书面授权。适用法律、GitHub 的平台条款和第三方许可证已允许的使用，按各自条件执行。 [GitHub 关于仓库许可的说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

主题讲解、题目和实验数据使用自编示例。延伸阅读链接到原作者或机构网站，包括以下资料。

- [Google 机器学习速成课程（简体中文）](https://developers.google.cn/machine-learning/crash-course?hl=zh-cn)
- [scikit-learn 用户指南](https://scikit-learn.org/stable/user_guide.html)
- [《动手学深度学习》](https://zh.d2l.ai/)
- [PyTorch Conv2d 文档](https://docs.pytorch.org/docs/2.15/generated/torch.nn.Conv2d.html)

| 第三方素材 | 来源与适用许可 |
| --- | --- |
| Lucide 图标 | [Lucide v0.468.0](https://github.com/lucide-icons/lucide/releases/tag/0.468.0) · [随包许可声明](assets/LUCIDE-LICENSE.txt) |
| 本地字体子集 | [Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc) · [SIL OFL](assets/fonts/sans-OFL.txt) / [Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc) · [SIL OFL](assets/fonts/serif-OFL.txt) |
| TensorFlow Playground 封面 | 来自 [tensorflow/playground](https://github.com/tensorflow/playground) 预测输出图的截图，已缩放 · [Apache 2.0](assets/art/PLAYGROUND-APACHE-2.0.txt) |
| t-SNE 封面 | 截自 Martin Wattenberg、Fernanda Viégas、Ian Johnson 的 [How to Use t-SNE Effectively](https://distill.pub/2016/misread-tsne/)，已裁切缩放 · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |

首页分类图及其余资源封面为本项目绘制。外部视频、教材和互动工具在原站打开，适用各自的使用条款。
