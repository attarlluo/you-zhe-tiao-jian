import {english, t} from './i18n.js';
import {resourceCredits, resourceText} from './resources.en.js';

export const topics = [
  {id:'math', title:t('数学与数据', 'Math and data')},
  {id:'ml', title:t('机器学习', 'Machine learning')},
  {id:'deep', title:t('深度学习', 'Deep learning'), parent:'ml'},
  {id:'ai', title:t('AI 应用与系统', 'AI systems and applications'), mapTitle:t('AI 应用', 'AI applications')}
];

export const formats = [
  {id:'play', title:t('互动实验', 'Interactive labs')},
  {id:'watch', title:t('视频与课程', 'Videos and courses')},
  {id:'read', title:t('读物与笔记', 'Readings and notes')}
];

export const resources = {
  playground: {
    format:'play', zones:['deep'],
    name:'TensorFlow Playground', short:'神经网络沙盒', by:'Daniel Smilkov、Shan Carter · 互动实验',
    url:'https://playground.tensorflow.org/#activation=tanh&dataset=spiral',
    preview:'在浏览器里训练一个小网络，观察它怎样调整决策边界。',
    first:'先用螺旋数据试一次。删掉一层，再看看训练误差和测试误差。',
    credit:'封面为本站截取的输出图。TensorFlow Playground，Apache 2.0。'
  },
  'cnn-explainer': {
    format:'play', zones:['deep'],
    name:'CNN Explainer', short:'卷积解剖', by:'Polo Club of Data Science · 互动实验',
    url:'https://poloclub.github.io/cnn-explainer/',
    preview:'沿着一张图从输入走到分类，点开每层看卷积和汇聚在做什么。',
    first:'选一张图，点第一个卷积层，再对比它的不同通道。'
  },
  'transformer-explainer': {
    format:'play', zones:['deep','ai'],
    name:'Transformer Explainer', short:'拆开 Transformer', by:'Polo Club of Data Science · 互动实验',
    url:'https://poloclub.github.io/transformer-explainer/',
    preview:'输入一句话，跟着 GPT-2 的计算过程走到下一个词。',
    first:'点击展开 Attention，再改变温度看候选词。注意力与采样发生在不同环节。'
  },
  tsne: {
    format:'play', zones:['math','ml'],
    name:'如何正确使用 t-SNE', short:'t-SNE 的错觉', by:'Wattenberg、Viégas、Johnson · Distill',
    url:'https://distill.pub/2016/misread-tsne/',
    preview:'投影看起来很像地图，但簇的远近和大小可能会误导你。',
    first:'在相同数据上切换 perplexity，比较哪些结构仍然明显。',
    credit:'封面截自 Martin Wattenberg、Fernanda Viégas、Ian Johnson 的互动图，裁切并缩放，CC BY 2.0。'
  },
  'neural-video': {
    format:'watch', zones:['deep'],
    name:'什么是神经网络？', short:'神经网络入门', by:'3Blue1Brown · 哔哩哔哩官方双语',
    url:'https://www.bilibili.com/list/88461692?bvid=BV1bx411M7Zx&oid=15532370',
    preview:'用手写数字识别带你从输入像素走到权重、偏置和神经元。',
    first:'看到一层神经元时，暂停说说它收到了什么，又输出了什么。'
  },
  'linear-video': {
    format:'watch', zones:['math'],
    name:'线性代数的本质', short:'线代就该这样看', by:'3Blue1Brown · 哔哩哔哩官方双语',
    url:'https://www.bilibili.com/list/88461692?bvid=BV1ys411472E&oid=6731067',
    preview:'把矩阵看成空间变换。适合在学习投影、PCA 和线性层之前补直觉。',
    first:'跳到「矩阵与线性变换」，只跟踪两个基向量。'
  },
  'lee-ml': {
    format:'watch', zones:['ml','deep'],
    name:'李宏毅 · 机器学习', short:'中文机器学习', by:'李宏毅 · 课程主页与视频',
    url:'https://speech.ee.ntu.edu.tw/~hylee/ml/2021-spring.php',
    preview:'中文课程串起回归、分类、神经网络与训练，页面附视频和课程安排。',
    first:'从机器学习介绍开始，先分清模型、损失和优化各负责什么。'
  },
  statquest: {
    format:'watch', zones:['math','ml'],
    name:'StatQuest 视频索引', short:'统计直觉', by:'Josh Starmer · 英文视频',
    url:'https://statquest.org/video_index.html',
    preview:'先量清一个概念，再看它在模型里的用法。索引涵盖统计和常用机器学习模型。',
    first:'在页面里找 Logistic Regression 或 Confusion Matrix，选一个当下的卡点。'
  },
  'flower-book': {
    format:'read', zones:['math','deep'],
    name:'《深度学习》花书', short:'深度学习花书', by:'Goodfellow、Bengio、Courville · 英文教材',
    url:'https://www.deeplearningbook.org/',
    preview:'从数学基础一路讲到深度前馈网络、优化和卷积的在线教材。',
    first:'先翻第 5 章 Machine Learning Basics，和工作台里的数据划分、泛化互相对照。'
  },
  d2l: {
    format:'read', zones:['deep','ml'],
    name:'《动手学深度学习》', short:'动手学深度学习', by:'张阿斯顿等 · 中文教材与代码',
    url:t('https://zh.d2l.ai/', 'https://d2l.ai/'),
    preview:'把公式、解释和可以运行的代码放在一起。适合学完直觉后亲手做一遍。',
    first:'从多层感知机开始，顺着看一遍前向传播，再尝试修改隐藏单元数。'
  },
  udl: {
    format:'read', zones:['deep','math'],
    name:'Understanding Deep Learning', short:'理解深度学习', by:'Simon J. D. Prince · 英文教材',
    url:'https://udlbook.github.io/udlbook/',
    preview:'从浅层网络开始，用图和习题逐渐建立对现代深度模型的理解。',
    first:'先读浅层神经网络，画出一层 ReLU 在一维上能做出的折线。'
  },
  'illustrated-transformer': {
    format:'read', zones:['deep','ai'],
    name:'图解 Transformer', short:'图解注意力', by:'Jay Alammar · 可视化文章',
    url:'https://jalammar.github.io/illustrated-transformer/',
    preview:'用逐层图解串起词嵌入、注意力和编码器／解码器。',
    first:'找到 Query、Key、Value 那一段，试着说出三者分别在做什么。'
  },
  'seeing-theory': {
    format:'play', zones:['math'],
    name:'Seeing Theory', short:'看得见的概率', by:'Daniel Kunin 等 · Brown University',
    url:'https://seeing-theory.brown.edu/',
    preview:'用骰子、点云和连续分布理解概率、推断和回归。',
    first:'从「Basic Probability」的随机事件开始，看看重复次数怎样影响频率。'
  },
  'math-for-ml': {
    format:'read', zones:['math','ml'],
    name:'Mathematics for Machine Learning', short:'机器学习数学', by:'Deisenroth、Faisal、Ong · 教材作者站',
    url:'https://mml-book.com/',
    preview:'把线性代数、概率和优化接到 PCA、回归与支持向量机。',
    first:'把「正交投影」和 PCA 章节放在一起读，先手算一个二维例子。'
  },
  'stat-learning': {
    format:'read', zones:['math','ml'],
    name:'An Introduction to Statistical Learning', short:'统计学习 · Python', by:'James、Witten、Hastie、Tibshirani、Taylor · 教材作者站',
    url:'https://www.statlearning.com/',
    preview:'用统计视角读经典模型，Python 和 R 版本都附上机练习。',
    first:'读完回归章节后，做它的实验，把训练和测试误差分开画。'
  },
  'google-ml': {
    format:'watch', zones:['math','ml'],
    name:'机器学习速成课程', short:'Google 机器学习', by:'Google for Developers · 简体中文',
    url:t('https://developers.google.cn/machine-learning/crash-course?hl=zh-cn', 'https://developers.google.com/machine-learning/crash-course?hl=en'),
    preview:'把损失、数据质量、阈值和实际系统拆成可单独学习的单元。',
    first:'做分类模块的阈值练习，试着说明什么时候宁可多报。'
  },
  'sklearn-mooc': {
    format:'watch', zones:['ml'],
    name:'scikit-learn MOOC', short:'scikit-learn 实战', by:'Inria · 公开课程',
    url:'https://inria.github.io/scikit-learn-mooc/',
    preview:'跟着笔记和练习搭建数据预处理、交叉验证和模型评估流程。',
    first:'从预测建模流程入手，追踪预处理究竟在哪一部分数据上拟合。'
  },
  'pair-fairness': {
    format:'play', zones:['math','ml','ai'],
    name:'Measuring Fairness', short:'公平性怎么量？', by:'Google PAIR · 交互文章',
    url:'https://pair.withgoogle.com/explorables/measuring-fairness/',
    preview:'在同一批数据上换一种公平性标准，比较模型决策如何改变。',
    first:'切换标准后，观察哪组人的错误率变了，再想哪个指标贴合实际任务。'
  },
  'pair-calibration': {
    format:'play', zones:['math','ml'],
    name:'Are Model Predictions Probabilities?', short:'分数能当概率吗？', by:'Google PAIR · 交互文章',
    url:'https://pair.withgoogle.com/explorables/uncertainty-calibration/',
    preview:'用校准图理解预测分数和实际发生频率的关系。',
    first:'找到预测分数约为 0.8 的一组，比较它的预测分数与真实频率。'
  },
  'zero-to-hero': {
    format:'watch', zones:['deep','ai'],
    name:'Neural Networks: Zero to Hero', short:'手写神经网络', by:'Andrej Karpathy · 作者课程页',
    url:'https://karpathy.ai/zero-to-hero.html',
    preview:'从标量自动求导和小语言模型一路手写到 GPT 与分词器。',
    first:'先跟 micrograd 做一个三步计算图，自己核对每条边的梯度。'
  },
  'vision-notes': {
    format:'read', zones:['deep','ml'],
    name:'计算机视觉深度学习讲义', short:'视觉模型讲义', by:'Stanford · CS231n 官方课程笔记',
    url:'https://cs231n.github.io/',
    preview:'把图像分类、卷积层、训练检查和迁移学习串起来。',
    first:'读 Convolutional Neural Networks 的空间尺寸部分，再和卷积实验对照。'
  },
  'pytorch-basics': {
    format:'read', zones:['deep','ml'],
    name:'PyTorch · Learn the Basics', short:'PyTorch 训练环', by:'PyTorch 官方教程',
    url:'https://docs.pytorch.org/tutorials/beginner/basics/intro.html',
    preview:'串起张量、数据集、模型、自动求导、优化和模型保存。',
    first:'把同一个批次的前向、损失、反向和更新按顺序写下来。'
  },
  'diffusion-explainer': {
    format:'play', zones:['deep','ai'],
    name:'Diffusion Explainer', short:'扩散模型在画什么？', by:'Polo Club of Data Science · 互动实验',
    url:'https://poloclub.github.io/diffusion-explainer/',
    preview:'看文本和噪声怎样在多个去噪步骤里变成图像。',
    first:'选一个自带的示例，沿着去噪步骤比较中间图像。'
  },
  'feature-visualization': {
    format:'read', zones:['deep'],
    name:'Feature Visualization', short:'神经元在找什么？', by:'Olah、Mordvintsev、Schubert · Distill',
    url:'https://distill.pub/2017/feature-visualization/',
    preview:'通过优化输入看不同神经元偏好什么形状、纹理和局部结构。',
    first:'比较浅层与深层的图，分清可视化的刺激和模型实际看到的样本。'
  },
  'hf-llm': {
    format:'watch', zones:['deep','ai'],
    name:'Hugging Face LLM Course', short:'语言模型工具箱', by:'Hugging Face 官方课程',
    url:'https://huggingface.co/learn/llm-course/chapter1/1',
    preview:'从 Transformer 的工作方式进入分词、数据集与微调流程。',
    first:'在分词章节找同一个词在不同上下文下的切分，观察空格的影响。'
  },
  'berkeley-ai': {
    format:'read', zones:['ai'],
    name:'Introduction to Artificial Intelligence', short:'搜索也能做 AI', by:'UC Berkeley · 公开教材',
    url:'https://inst.eecs.berkeley.edu/~cs188/textbook/',
    preview:'把状态空间搜索、约束求解和决策过程放回 AI 的地图里。',
    first:'选一张小迷宫，对比广度优先和 A* 会先探索哪些状态。'
  },
  alphago: {
    format:'read', zones:['deep','ai'],
    name:'AlphaGo', short:'AI 怎么下围棋？', by:'Google DeepMind · 项目主页',
    url:'https://deepmind.google/research/alphago/',
    preview:'用围棋案例理解神经网络、树搜索和自我对弈如何配合。',
    first:'试着分别解释「下一步看哪里」和「这个局面有多好」。'
  },
  'rl-spinning-up': {
    format:'read', zones:['math','ml','ai'],
    name:'Spinning Up · 强化学习概念', short:'强化学习的第一步', by:'OpenAI · 概念文档',
    url:'https://spinningup.openai.com/en/latest/spinningup/rl_intro.html',
    preview:'用状态、动作、策略和回报说明智能体怎样从反馈中学习。',
    first:'把走迷宫写成状态、动作、奖励和终止条件。只看概念部分即可。'
  },
  'agent-design': {
    format:'read', zones:['ai'],
    name:'Building Effective AI Agents', short:'什么时候要用 Agent？', by:'Anthropic · 工程文章',
    url:'https://www.anthropic.com/research/building-effective-agents',
    preview:'看提示串联、路由与自主决策分别适合什么任务。',
    first:'给一个文件整理任务画出预定流程，再标出确实需要模型作决定的地方。'
  },
  'nist-ai': {
    format:'read', zones:['ai'],
    name:'AI Risk Management Framework', short:'AI 风险怎么落地？', by:'美国 NIST · 公开框架',
    url:'https://www.nist.gov/itl/ai-risk-management-framework',
    preview:'从目标、测量和持续管理出发，了解可信 AI 的评估与责任。',
    first:'拿一个自动筛选案例做练习，写下出错时谁最可能受影响、怎样发现错误。'
  }
};

if (english) {
  for (const [id, resource] of Object.entries(resources)) {
    const [name, short, by, preview, first] = resourceText[id];
    Object.assign(resource, {name, short, by, preview, first});
    if (resource.credit) resource.credit = resourceCredits[id];
  }
}
