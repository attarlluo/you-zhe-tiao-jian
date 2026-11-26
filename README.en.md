# Now We Can (有这条件) · A Self-study Workbench

[简体中文](README.md) · **English**

[**Open the English demo**](https://attarlluo.github.io/you-zhe-tiao-jian/?lang=en) · [**简体中文演示**](https://attarlluo.github.io/you-zhe-tiao-jian/?lang=zh)

> We didn’t have this back then. Now we do. What shall we learn?

A self-study workbench that turns a moment of curiosity into something you can try, practise and revisit. Pick a resource, plan a short study session, or return to an exercise when it is due. **Machine learning is the subject of the current public demo.**

## What you can do

- **Run an experiment.** Move the XOR weights to see misclassifications, change a decision threshold to compare precision and recall, or adjust stride and padding to see which part of the input a convolution uses.
- **Explore the resource map.** Browse 30 public resources across four intersecting topic areas. Resources with more than one topic drift between their matching areas. Draw one at random, filter by topic, or switch to the full list.
- **Plan and review.** Work through 12 topics and 24 original exercises. Numerical exercises support automatic checks, and open questions include a self-check rubric. Record where you got stuck and return for a scheduled review.

Expand “What does this demo cover, and what is still missing?” on the workbench overview to see each topic’s goals, prepared exercises and remaining gaps. Introductory practice is not complete curriculum coverage or evidence of mastery.

Numerical feedback distinguishes matching, incorrect, blank and invalid fields. Fractions are supported; use `?` to skip a field. Counts and classes are checked exactly, with separate tolerances for rounded decimals. Matching numbers still need a reasoning check. Open-ended self-assessment does not count as independently verified evidence.

Three follow-up exercises are reserved by default. They become eligible for the plan at least 20 hours after an attempt at the related introductory exercise, replacing a due question of the same skill where possible. You can also reveal them manually in Practice. The sequence is a suggested route; it does not infer weaknesses without attempts.

## Run locally

1. On Windows, double-click [Start-Learning.cmd](Start-Learning.cmd). On other systems, run the command below from the project directory. Substitute `python3` if that is the command your system uses.
2. Open [http://127.0.0.1:4330/](http://127.0.0.1:4330/) in your browser. From the home page you can open the [study workbench](study.html) or the [resource map](explore.html).

```bash
python -m http.server 4330 --bind 127.0.0.1
```

The live demo runs on GitHub Pages. You can also serve this directory over HTTP to run it locally. The site and experiments run without a build step, an account or an AI API. Linked resources open on their original sites.

Use **English / 简体中文** at the top of any page to switch the language of the labs, exercises, feedback, and resource descriptions. Your current page and saved progress carry over. Add `?lang=en` or `?lang=zh` to share a link in that language.

Answers, drafts and review history stay in the current browser. Export a JSON backup from the workbench's resources and records page before clearing site data or switching devices. Importing a backup merges its attempt history. You can also use it to bring your progress from the local site to the online version.

Hint and solution exposure persists across saves and retries. Clearing the input does not make an assisted question independent. Reading a solution later does not rewrite a previously saved attempt. Different questions and delayed reviews provide additional evidence, rather than proving mastery of a whole topic.

The 2026-11-27 update preserves old answers, recorded grades and IDs, and still accepts older JSON backups. Current independent-result counts conservatively exclude recorded assistance or old answers that fail the current field rules. Historical scores are not silently rewritten. Reading or assistance outside the recorded interface cannot be inferred.

Select the home page’s “Try one exercise” button to jump to the next task, with due reviews first. For a short demo, take the three-minute tour and compare the single-layer and two-layer models. After you submit an exercise, the review page shows when to come back.

## Verification

Run `node --test tests/learning.test.mjs`. The 28 checks include independent calculations for all 21 numerical exercises, field tolerances, fractions and blanks, assistance evidence, reserved follow-ups, budgets and old/new backup merges. Separate checks use fresh browser contexts for both languages, answer recovery, error notes, imports and exports, labs, resource balls and mobile layouts. No personal learning records were used. These checks verify software behavior and the listed numerical targets, rather than learning outcomes or a complete curriculum.

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
