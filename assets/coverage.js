import {t} from './i18n.js';

// Scope of this original demo, rather than a curriculum or an exam syllabus.
const rows={
  data:[['按独立单位划分，识别分组泄漏','Split by independent units; detect group leakage'],['样本数计算、按人切分自查','Split counts and a grouped-split self-check'],['时间序列切分、完整交叉验证实验','Time-series splits and a complete cross-validation experiment']],
  prep:[['训练统计量的正向与反变换','Forward and inverse transforms using training statistics'],['z 值、反变换与尺度差值','z-scores, inverse transforms and scaled differences'],['缺失值、类别编码、完整 pipeline','Missing values, categorical encoding and complete pipelines']],
  gradient:[['按旧参数计算梯度并更新','Compute the gradient at the old parameter and update'],['一次更新、过大步幅变式','One update and an overshoot variant'],['多参数梯度、多步收敛与优化器','Multivariable gradients, convergence and optimizers']],
  linear:[['区分残差、MSE 与常数基线','Distinguish residuals, MSE and a constant baseline'],['残差计算、最优常数','Residual calculations and the best constant'],['拟合多变量回归、残差诊断','Fit multivariable regression and diagnose residuals']],
  logistic:[['概率、阈值与自然对数损失','Probabilities, decision thresholds and natural-log loss'],['sigmoid、类别与两种标签损失','Sigmoid, classes and loss for both labels'],['参数拟合、校准与 ROC/PR 全曲线','Parameter fitting, calibration and full ROC/PR curves']],
  trees:[['加权不纯度与集成投票','Weighted impurity and ensemble votes'],['Gini 下降、硬投票','Gini decrease and hard voting'],['完整树构建、剪枝与森林训练','Full tree construction, pruning and forest training']],
  metrics:[['明确每种指标的分母','Identify each metric’s denominator'],['混淆矩阵、阈值变更','Confusion matrices and a changed threshold'],['F1、PR/ROC、代价和多分类评价','F1, PR/ROC, costs and multiclass evaluation']],
  generalization:[['分开拟合、选择和最终评价','Separate fitting, selection and final evaluation'],['训练验证差距、选择流程自查','Train-validation gaps and a workflow self-check'],['学习曲线、调参实验与不确定性','Learning curves, tuning experiments and uncertainty']],
  cluster:[['分配与均值更新使用相同分组','Use the same assignments for center and loss updates'],['一维中心与损失更新','One-dimensional center and loss updates'],['多维、平局、空簇与初始化比较','Multidimensional data, ties, empty clusters and initialization']],
  pca:[['区分解释方差和投影坐标','Distinguish explained variance and projection coordinates'],['比例、内积与重建坐标','Ratios, dot products and reconstruction'],['从数据构造协方差、求特征向量','Build covariance matrices and compute eigenvectors']],
  neural:[['区分线性边界与非线性组合','Distinguish linear boundaries and nonlinear combinations'],['XOR 前向、自查线性不可分','XOR forward pass and a separability self-check'],['反向传播、训练与更大网络','Backpropagation, training and larger networks']],
  conv:[['分开空间尺寸、通道与参数量','Separate spatial dimensions, channels and parameters'],['尺寸和参数、窗口坐标','Shapes, parameter counts and window coordinates'],['真实卷积数值、分组/膨胀/反向传播','Actual convolution values, groups, dilation and backpropagation']]
};

export function coverageFor(id){
  const [goal,prepared,remaining]=rows[id];
  return {goal:t(...goal),prepared:t(...prepared),remaining:t(...remaining)};
}
