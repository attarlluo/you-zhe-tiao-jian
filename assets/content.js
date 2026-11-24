import {english, t} from './i18n.js';
import {exerciseText, topicText} from './content.en.js';

const google = t('https://developers.google.cn', 'https://developers.google.com') + '/machine-learning/crash-course/';
const sklearn = 'https://scikit-learn.org/stable/';
const d2l = t('https://zh.d2l.ai/', 'https://d2l.ai/');
const googleLanguage = t('?hl=zh-cn', '?hl=en');

export const sources = {
  split: [t('scikit-learn · 常见陷阱与数据泄漏', 'scikit-learn · Common pitfalls and data leakage'), sklearn + 'common_pitfalls.html#data-leakage'],
  scale: [t('scikit-learn · 数据预处理', 'scikit-learn · Preprocessing'), sklearn + 'modules/preprocessing.html'],
  linear: [t('Google · 线性回归', 'Google · Linear regression'), google + 'linear-regression' + googleLanguage],
  gradient: [t('《动手学深度学习》· 梯度下降', 'Dive into Deep Learning · Gradient descent'), d2l + 'chapter_optimization/gd.html'],
  logistic: [t('Google · 逻辑回归', 'Google · Logistic regression'), google + 'logistic-regression' + googleLanguage],
  metrics: [t('Google · 准确率、精确率与召回率', 'Google · Accuracy, precision, and recall'), google + 'classification/accuracy-precision-recall' + googleLanguage],
  generalization: [t('Google · 泛化与过拟合', 'Google · Generalization and overfitting'), google + 'overfitting' + googleLanguage],
  trees: [t('scikit-learn · 决策树', 'scikit-learn · Decision trees'), sklearn + 'modules/tree.html'],
  ensemble: [t('scikit-learn · 集成方法', 'scikit-learn · Ensemble methods'), sklearn + 'modules/ensemble.html'],
  cluster: ['scikit-learn · K-means', sklearn + 'modules/clustering.html#k-means'],
  pca: [t('scikit-learn · 主成分分析', 'scikit-learn · Principal component analysis'), sklearn + 'modules/decomposition.html#principal-component-analysis-pca'],
  neural: [t('《动手学深度学习》· 多层感知机', 'Dive into Deep Learning · Multilayer perceptrons'), d2l + 'chapter_multilayer-perceptrons/mlp.html'],
  conv: [t('PyTorch · Conv2d 输出尺寸', 'PyTorch · Conv2d output shapes'), 'https://docs.pytorch.org/docs/2.15/generated/torch.nn.Conv2d.html']
};

export const stages = [t('数据与基础', 'Data and foundations'), t('监督学习', 'Supervised learning'), t('评估与表示', 'Evaluation and representations'), t('神经网络', 'Neural networks')];

function topic(id, title, column, depends_on, summary, pitfall, reading) {
  if (english) [title, summary, pitfall] = topicText[id];
  return {id, title, column, depends_on, summary, pitfall, sources: reading};
}

export const topics = [
  topic('data', '数据划分与数据泄漏', 0, [],
    '训练集用来拟合参数，验证集用来选模型，测试集在选择结束后估计表现。先确认样本之间独立，再决定怎么切分。',
    '同一人、设备或时间窗口产生的样本如果被打散，测试分数可能过高。', ['split']),
  topic('prep', '标准化与预处理', 0, ['data'],
    '标准化把 x 转换为 (x − μ) / σ。只在训练集估计变换参数，验证和测试都用同一组参数。',
    '单独对测试集重新估计均值、方差，会改变模型看到的特征尺度。', ['scale', 'split']),
  topic('gradient', '梯度下降与学习率', 0, [],
    '梯度给出当前位置损失上升的方向。更新 w ← w − η∇L(w)，移动多远取决于学习率 η。',
    '学习率太大可能越过最小点，甚至让损失越来越高。', ['gradient']),
  topic('linear', '线性回归与均方误差', 1, ['gradient'],
    '用特征的加权和预测连续值，再通过残差衡量误差。先用只预测均值的模型建立参照。',
    '均方误差是平方后再平均。正负残差不能先抵消。', ['linear']),
  topic('logistic', '逻辑回归与概率阈值', 1, ['linear'],
    '线性得分经过 sigmoid 变成 0 到 1 之间的分数。训练损失和部署时的分类阈值可以分别考虑。',
    '输出 0.8 不一定意味着长期真实命中率就是 80%。概率校准需要单独检验。', ['logistic', 'metrics']),
  topic('trees', '决策树与随机森林', 1, ['data'],
    '决策树每次按一个条件划分样本。随机森林训练多个有差异的树并汇总预测，常能降低单棵深树的方差。',
    '训练集划分得很纯，模型仍可能在新数据上犯错。', ['trees', 'ensemble']),
  topic('metrics', '混淆矩阵与分类指标', 2, ['logistic'],
    '精确率问预测正例有多少是真的，召回率问真实正例有多少被找到了。阈值改变这两类错误的分布。',
    '少数类很稀少时，全部预测成多数类也可能得到很高准确率。', ['metrics']),
  topic('generalization', '泛化、正则化与模型选择', 2, ['data', 'linear'],
    '比较训练和验证表现，借此区分欠拟合与过拟合。用验证集做复杂度选择，最后才评估保留测试集。',
    '用测试结果反复调模型，会把测试集变成事实上的验证集。', ['generalization', 'split']),
  topic('cluster', 'K-means 与聚类', 2, ['prep'],
    '先把每个样本分给最近的中心，再用组内均值重算中心。重复两步可降低组内平方距离。',
    '初始化和特征尺度会影响结果。簇编号只是标签。', ['cluster', 'scale']),
  topic('pca', 'PCA 与降维', 2, ['prep'],
    '把居中后的数据投影到方差较大的互相正交方向。解释方差比描述保留程度。',
    '在拟合 PCA 前，要先决定是否标准化。高方差方向也不一定最有利于分类。', ['pca']),
  topic('neural', '神经网络、激活与 XOR', 3, ['gradient', 'logistic'],
    '一层线性决策对应一个超平面。把多个阈值单元组合起来，可以得到 XOR 这样的非线性分类区域。',
    '堆叠多个纯线性变换仍是线性变换。单独加层数无法得到这里的非线性表达。', ['neural']),
  topic('conv', '卷积窗口与输出形状', 3, ['neural'],
    '卷积窗口在输入上滑动。步幅决定窗口的间隔，填充改变可访问的边缘。在步幅为正整数且有完整窗口时，输出尺寸由向下取整得到。',
    '空间输出高宽、输出通道数和可训练参数量是三件不同的事。', ['conv'])
];

export const thresholdSamples = [
  [.95, 1], [.88, 0], [.82, 1], [.73, 1], [.68, 0],
  [.61, 0], [.57, 1], [.42, 0], [.29, 1], [.18, 0]
];

function numeric(topic_id, id, title, minutes, question, hint, answer, values, skill_id = id) {
  if (english) [title, question, hint, answer] = exerciseText[id];
  return {
    topic_id, id, title, minutes, question, hints: [hint], answer, skill_id,
    check: {type:'numeric', values, tolerance:.005}
  };
}

function open(topic_id, id, title, minutes, question, hint, answer, rubric) {
  if (english) [title, question, hint, answer, rubric] = exerciseText[id];
  return {topic_id, id, title, minutes, question, hints:[hint], answer, rubric, check:{type:'self'}, skill_id:id};
}

export const units = [
  numeric('data', 'split-count', '切分一份 240 条样本的数据', 3,
    '假设 240 条样本相互独立。按 60%／20%／20% 划分。依次输入训练、验证、测试的样本数。',
    '每个集合的样本数等于总样本数乘以对应比例。',
    '240×0.6 = 144，240×0.2 = 48。三个集合的大小是 144、48、48，总数仍为 240。', [144,48,48]),
  open('data', 'split-group', '同一人的数据应该怎么分？', 6,
    '你有 40 位受试者，每人 12 条测量记录。目标是预测新受试者。随机打散所有记录后，测试精度很高。解释可能的原因，并提出切分方式。',
    '想想测试集里出现的每一位受试者，模型以前是否已经见过他。',
    '同一人的记录有相关性。按受试者分组做切分或交叉验证，保证任何一个人的记录只在一个集合里。',
    ['指出独立单位是受试者','解释按记录切分可能泄漏个体特征','提出按人分组并保留独立测试集']),
  numeric('prep', 'scale-forward', '用训练集的均值和标准差变换', 4,
    '训练集估计出均值 μ = 12、标准差 σ = 2。测试样本的原值是 17。依次输入它的 z 值，以及 z = −1.5 对应的原值。',
    '标准化用 (x − μ) / σ，反变换用 μ + zσ。',
    '前者是 (17 − 12)/2 = 2.5。后者是 12 + (−1.5)×2 = 9。', [2.5,9], 'standardize'),
  numeric('prep', 'scale-variant', '标准化变式：变换后差多少？', 4,
    '训练集的均值为 20、标准差为 5。测试样本 A=15、B=30。依次输入 A 的 z 值、B 的 z 值和 z_B − z_A。',
    '两条测试样本都用训练集同一组参数。',
    'z_A = (15−20)/5 = −1，z_B = (30−20)/5 = 2。二者相差 3。', [-1,2,3], 'standardize'),
  numeric('gradient', 'gradient-step', '手算一次梯度更新', 5,
    '损失 L(w) = (w − 4)²，起点 w = 1，学习率 0.25。依次输入更新后的 w 和更新后的损失。',
    '梯度是 2(w−4)。将起点代入再做减法。',
    '在 w=1 时，梯度为 −6。更新后 w=1−0.25×(−6)=2.5，损失是 (2.5−4)²=2.25。', [2.5,2.25], 'gradient-update'),
  numeric('gradient', 'gradient-overshoot', '学习率太大时发生什么？', 5,
    '损失 L(w) = (w + 2)²，起点 w = 2，学习率 1.25。依次输入更新后的 w 和新损失。',
    '先算出梯度，再比较这一步前后的损失大小。',
    '梯度为 8，所以 w=2−1.25×8=−8。损失变为 (−8+2)²=36，高于原来的 16。', [-8,36], 'gradient-update'),
  numeric('linear', 'mse', '正负残差不会抵消 MSE', 4,
    '三个样本的预测分别是 4、7、9，真实值是 5、5、10。依次输入平均残差（预测减真实）和均方误差。',
    '先写残差向量，再把每个残差分别平方。',
    '残差是 −1、2、−1，平均为 0。MSE 为 (1+4+1)/3=2。', [0,2]),
  numeric('linear', 'mean-baseline', '只预测一个常数的基线', 5,
    '标签为 2、5、11。模型对所有样本只预测同一个常数。依次输入使训练 MSE 最小的常数和对应 MSE。',
    '对常数求导，或回忆平方损失下的最优常数。',
    '最优常数是均值 6；此时 MSE=(16+1+25)/3=14。', [6,14]),
  numeric('logistic', 'logit-threshold', '0.75 会被判成正类吗？', 4,
    '已知线性得分 z = ln(3)。经 sigmoid 得到概率 p。规定 p ≥ 0.8 才判正类。依次输入 p 和类别（0 或 1）。',
    'sigmoid(z)=1/(1+e⁻ᶻ)，e⁻ˡⁿ⁽³⁾=1/3。',
    'p = 1/(1+1/3) = 0.75。0.75 小于 0.8，所以预测类别是 0。', [.75,0]),
  numeric('logistic', 'log-loss', '用二元交叉熵惩罚错预测', 5,
    '模型输出正类概率 p=0.25。用自然对数，依次输入真实标签为 1 和为 0 时的对数损失。结果保留三位小数。',
    'y=1 时损失为 −ln(p)，y=0 为 −ln(1−p)。',
    '−ln(0.25)≈1.386，−ln(0.75)≈0.288。预测给正例的概率更低，因此正例的损失更大。', [Math.log(4),-Math.log(.75)]),
  numeric('trees', 'gini-split', '一次树分裂降低多少不纯度？', 6,
    '父节点 3 正 3 负。分裂后左边 2 正 0 负，右边 1 正 3 负。输入父节点的 Gini 不纯度和分裂带来的加权下降量。',
    'Gini = 1 − Σpᵢ²，子节点按样本数占比加权。',
    '父节点 Gini=0.5。左侧为 0，右侧为 0.375。加权子节点为 2/6×0 + 4/6×0.375=0.25，下降 0.25。', [.5,.25]),
  numeric('trees', 'tree-vote', '五棵树如何给出分类？', 3,
    '假设这套集成使用硬投票，五票为 1、0、1、1、0。依次输入最终类别和正类票数占比。',
    '正类票数除以总票数，超过一半就选 1。',
    '三票给正类，最终类别为 1，占比 0.6。这个硬投票占比通常不能直接当作已校准概率。', [1,.6]),
  numeric('metrics', 'confusion', '同一模型有三种不同的分数', 5,
    '有 TP=15、FP=5、FN=10、TN=70。依次输入精确率、召回率和准确率。用 0 到 1 的小数。',
    '精确率用预测正例作分母，召回率用真实正例作分母。',
    '精确率为 15/20=0.75，召回率为 15/25=0.6，准确率为 (15+70)/100=0.85。', [.75,.6,.85]),
  numeric('metrics', 'threshold-tradeoff', '抬高阈值少报了谁？', 5,
    '阈值实验有 10 个样本。把阈值从 0.60 提高到 0.80。依次输入新阈值下的 FP、FN，以及召回率。取 p ≥ 阈值为正类。',
    '到实验里查看分数。0.80 及以上只有 0.95、0.88、0.82，其中 0.88 对应负例。',
    '新阈值下 TP=2、FP=1、FN=3、TN=4，召回率为 2/5=0.4。', [1,3,.4]),
  numeric('generalization', 'train-val-gap', '比较两组训练和验证误差', 4,
    '模型 A 的训练／验证错误率为 0.02／0.19，B 为 0.11／0.12。依次输入 A、B 的泛化差距（验证减训练）。',
    '每个模型分别用验证错误率减去自己的训练错误率。',
    'A 为 0.17，B 为 0.01。就这次验证结果而言 B 的错误率更低；最终比较仍要看合适的实验划分。', [.17,.01]),
  open('generalization', 'model-selection', '什么时候能打开测试集？', 6,
    '你要在 3 个正则化强度和 2 个特征方案中选择。写出从划分数据到报告最终结果的流程，以及预处理放在哪里。',
    '把「拟合参数」「挑方案」「估计最终表现」分别放到对应数据上。',
    '先保留测试集。用训练与验证或训练内的交叉验证挑方案；每折只在训练部分拟合预处理。选定后按预定方案重训，再评估保留测试集。',
    ['测试集在调参期间保持隔离','预处理每折只拟合训练子集','用验证指标选模型，然后独立报告测试结果']),
  numeric('cluster', 'kmeans-step', '给两个簇更新中心', 5,
    '一维样本是 0、3、8、10，初始中心是 1 和 9。按最近中心分配，再求组内均值。按从小到大输入两个新中心。',
    '0 和 3 离第一个中心更近；其余两点分到第二个。',
    '两个组分别是 {0,3} 和 {8,10}，均值为 1.5 和 9。', [1.5,9], 'kmeans-step'),
  numeric('cluster', 'kmeans-loss', '一次更新前后的聚类损失', 6,
    '样本为 1、2、6、9，初始中心为 0 和 8。做一次分配后，分别用旧中心和更新后的中心计算组内距离平方和。依次输入两次损失。',
    '分组为 {1,2} 与 {6,9}，新中心是 1.5 与 7.5。',
    '旧中心下平方和为 1+4+4+1=10；新中心下为 0.25+0.25+2.25+2.25=5。', [10,5], 'kmeans-step'),
  numeric('pca', 'pca-variance', '保留一到两个主成分能留下多少？', 4,
    '协方差矩阵的三个特征值由大到小是 9、4、2。依次输入只留第一项、保留前两项的解释方差比，答案用 0 到 1 的小数。',
    '分母是全部特征值之和。',
    '总方差为 15。两种保留比例分别为 9/15=0.6 和 13/15≈0.867。', [.6,13/15]),
  numeric('pca', 'pca-project', '把一个点投影到主方向', 6,
    '二维居中向量 x=(2,0)，唯一保留方向 v=(1,1)/√2。依次输入坐标 x·v 和投影后的二维坐标。',
    '先求内积 s，再算 s·v。',
    '内积为 √2，乘回单位向量得到 (1,1)。', [Math.sqrt(2),1,1]),
  numeric('neural', 'xor-forward', '手算 XOR 网络的隐藏层', 4,
    '两个隐藏单元分别表示「至少一个输入是 1」与「两个输入都是 1」。当 x=(1,1) 时，依次输入两个隐藏量和 XOR 输出；再输入 x=(1,0) 时的 XOR 输出。',
    '输出只有在第一个隐藏量为 1、第二个为 0 时才是 1。',
    '(1,1) 时两个隐藏量都为 1，输出 0；(1,0) 时隐藏量为 1、0，输出 1。', [1,1,0,1]),
  open('neural', 'xor-proof', '用反例解释线性模型的极限', 6,
    'XOR 的两类各占正方形的一条对角线的端点。解释为什么一条直线无法把两类完全分开，再说明增加隐藏单元在改变什么。',
    '分别画连接同类端点的线段，比较它们在平面上的位置。',
    '两条同类线段在正方形中心相交。线性决策的半平面是凸的，若能分开两类，两条线段就必须在互不重叠的一边。组合两个阈值可以做出中间带状区域。',
    ['指出对角线交点','解释同一半平面内线段仍留在半平面','说明多阈值可组合多个边界']),
  numeric('conv', 'conv-shape', '算输出尺寸和卷积参数', 6,
    '输入高×宽为 7×9，有 2 个输入通道。普通卷积有 4 个 3×3 输出滤波器、步幅 2、每边填充 1、膨胀率 1，每个输出通道含一个偏置。依次输入输出 H、W、C 和参数量。',
    '空间维度分别使用 ⌊(N+2P−K)/S⌋+1。每个滤波器覆盖全部输入通道。',
    'H=4、W=5、C=4。每个过滤器有 2×3×3 个权重和 1 个偏置，总计 4×(18+1)=76。', [4,5,4,76]),
  numeric('conv', 'conv-window', '输出格对应哪个输入窗口？', 5,
    '输入为 6×6，卷积核为 3×3，步幅 2、填充 1。零起始下标，设输出格为 (2,1)。在原输入坐标里依次输入窗口的起始行、起始列、结束行和结束列（含两端）。',
    '窗口起点是 (输出行×步幅−填充, 输出列×步幅−填充)。',
    '起点=(3,1)，窗口沿两维覆盖 3 格，终点=(5,3)。', [3,1,5,3])
];
