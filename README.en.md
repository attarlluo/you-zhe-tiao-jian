# 有这条件 · A Self-study Workbench

[简体中文](README.md) · **English**

[**Open the live demo**](https://attarlluo.github.io/you-zhe-tiao-jian/) to try an experiment, explore the resource map or start an exercise in your browser.

> We didn’t have this back then. Now we do. What shall we learn?

A self-study workbench that turns a moment of curiosity into something you can try, practise and revisit. Pick a resource, plan a short study session, or return to an exercise when it is due. **Machine learning is the subject of the current public demo.** The site interface is in Chinese.

## What you can do

- **Run an experiment.** Move the XOR weights to see misclassifications, change a decision threshold to compare precision and recall, or adjust stride and padding to see which part of the input a convolution uses.
- **Explore the resource map.** Browse 30 public resources across four intersecting topic areas. Resources with more than one topic drift between their matching areas. Draw one at random, filter by topic, or switch to the full list.
- **Plan and review.** Work through 12 topics and 24 original exercises. Numerical exercises support automatic checks, and open questions include a self-check rubric. Record where you got stuck and return for a scheduled review.

## Run locally

1. On Windows, double-click [Start-Learning.cmd](Start-Learning.cmd). On other systems, run the command below from the project directory. Substitute `python3` if that is the command your system uses.
2. Open [http://127.0.0.1:4330/](http://127.0.0.1:4330/) in your browser. From the home page you can open the [study workbench](study.html) or the [resource map](explore.html).

```bash
python -m http.server 4330 --bind 127.0.0.1
```

The live demo runs on GitHub Pages. You can also serve this directory over HTTP to run it locally. The site and experiments run without a build step, an account or an AI API. Linked resources open on their original sites.

Answers, drafts and review history stay in the current browser. Export a JSON backup from the workbench's resources and records page before clearing site data or switching devices. Importing a backup merges its attempt history. You can also use it to bring your progress from the local site to the online version.

Select the home page’s “Try one exercise” button to jump to the next task, with due reviews first. For a short demo, take the three-minute tour and compare the single-layer and two-layer models. After you submit an exercise, the review page shows when to come back.

## Copyright and credits

**All rights in the project's original code, page designs, explanations, exercises and illustrations are reserved unless expressly granted.** For republication, distribution of adaptations or commercial use of original material, contact the rights holder through the repository for written permission first. Uses permitted by applicable law, GitHub's platform terms or the third-party licenses below remain subject to their respective terms. [GitHub's repository licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

The explanations, exercises and demo data use original examples. Further reading links to the authors or publishers, including the following sources.

- [Google Machine Learning Crash Course (Simplified Chinese)](https://developers.google.cn/machine-learning/crash-course?hl=zh-cn)
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Dive into Deep Learning (Chinese edition)](https://zh.d2l.ai/)
- [PyTorch Conv2d documentation](https://docs.pytorch.org/docs/2.15/generated/torch.nn.Conv2d.html)

| Third-party material | Source and license |
| --- | --- |
| Lucide icons | [Lucide v0.468.0](https://github.com/lucide-icons/lucide/releases/tag/0.468.0) · [Bundled license notices](assets/LUCIDE-LICENSE.txt) |
| Local font subsets | [Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc) · [SIL OFL](assets/fonts/sans-OFL.txt) / [Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc) · [SIL OFL](assets/fonts/serif-OFL.txt) |
| TensorFlow Playground thumbnail | Resized screenshot of the [tensorflow/playground](https://github.com/tensorflow/playground) output plot · [Apache 2.0](assets/art/PLAYGROUND-APACHE-2.0.txt) |
| t-SNE thumbnail | Cropped and resized screenshot from [How to Use t-SNE Effectively](https://distill.pub/2016/misread-tsne/) by Martin Wattenberg, Fernanda Viégas and Ian Johnson · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |

The classification illustration on the home page and the other resource covers were made for this project. Third-party videos, textbooks and interactive tools open on their original sites and follow their respective terms.
