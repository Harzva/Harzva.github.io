#开集任务 #蒸馏 
> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [mp.weixin.qq.com](https://mp.weixin.qq.com/s/MtNeCdvEd-LhCnC92yrEEg)

目前的**开集场景理解算法**可以有效地对名<font color="#ff0000">词指称的对象</font>进行目标检测或实例分割，但<font color="#ff0000">如何理解动词</font>指称仍是一片蓝海。因此，本文研究了<font color="#ff0000">面向特定任务的目标检测及实例分割问题</font>，旨在从一幅图片中找出最适用于<font color="#ff0000">某一以动词描述的动作任务的物体。</font>比如，您告诉机器人去寻找一个可以 “用来挖洞” 的东西，此算法就能帮您挑选一个最合适的。

为了解决这个问题，本文提出了 TOIST，利用注意力机制自然地对多个可选物体之间的偏好关系进行建模，并提出了一种<font color="#ff0000">全新的名词 - 代词蒸馏框架</font>。现在有很多成功的大规模视觉 - 语言预训练模型，但是他们<font color="#ff0000">只关注名词</font>。本方法将<font color="#ff0000">名词指称模型中的知识蒸馏到代词媒介上，从而取得更好的动词理解效果</font>。

**![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuJfIJ3CURicn3GMuLkmnuFp60SoKG3aPHJ3vyXvxnnfib5dzApL3wpRSg/640?wx_fmt=png)**
-----------------------------------------------------------------------------------------------------------------------------------------------------

> 论文链接：
> 
> _https://arxiv.org/abs/2210.10775_  
> 代码链接：
> 
> _https://github.com/AIR-DISCOVER/TOIST_

**![图片](https://mmbiz.qpic.cn/mmbiz_gif/ibaXaPIy7jV0qMBsb1dzQgpADYpxzdmULq5EYyPSD9r6hBb7rQMOAibyJDTlMPG3pl6UVic4icGPib6MMve5EsoD37A/640?wx_fmt=gif&wxfrom=5&wx_lazy=1)** 
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**一、****研究背景**
--------------

基于大规模视觉 - 语言预训练模型 [1-3]，名词指称理解模型取得了巨大的进步。如图 1 左上角所示，这些算法以名词作为输入，生成目标框或实例掩码。然而，在智能服务机器人等现实应用程序中，系统输入通常以动词短语的形式出现，现代视觉 - 语言模型能否有**效理解动词指称**仍未被探索。

为此，我们关注**面向任务的检测问题**。如图 1 右上角所示，算法<font color="#ff0000">框出桌上的餐叉，因为它们适合用来涂抹黄油的任务</font>。为了提供更精细的定位，我们进一步将问题拓展到实例分割（图 1 底部），以服务于下游机器人交互应用。

名词指称理解数据集旨在减少歧义 [4]，而面向任务的检测或分割的一个有趣而具有挑战性的特点是我们必须<font color="#ff0000">面对甚至利用这种歧义</font>。如图 1 底部所示，当我们想要站在某个物体上时，椅子是更好的选择，因为沙发比较软，桌子比较重因而难以移动。而当需要舒适地坐着时，沙发显然是最好的选择。总之，能够满足动词要求的物体是不确定的，算法需要建模**物体间的偏好关系**。

现有方法 [5] 采用两阶段流程：<span style="background:#b1ffff">首先检测出所有物体，而后对物体进行排序</span>。****而我们基于 Transformer 架构提出了 **TOIST 模型**，利用注意力机制，在检测物体的同时自然地建模了候选对象之间的相对偏好关系。

由于 Transformer 需要大量数据训练 [6-7]，而获取大规模具有偏好关系的动词指称数据比较困难，我们进一步探索了利用名词指称模型中的知识的可能。具体而言，我们提出了**从名词到代词的蒸馏框架**，利用代词作为媒介，从通过聚类得到的名词特征原型中蒸馏知识，从而提升模型对动词的理解能力。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUku6DeKAcDOEHmpkUejlxW9KibNBelXDFJia7WRIAVr4mPkYmfUWISGO1YQ/640?wx_fmt=png)

###### 图 1：问题形式示意

  

---

**二、****解决方法**
--------------

### **TOIST 模型架构**

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUku0osQr12qL2JEAhaeqt4ju3XmNS6jzjGrryU2CHOyqPdBE3rY9y30LA/640?wx_fmt=png)

###### 图 2：TOIST 框架图

所提出的网络总体框架如图 2 所示。输入为一张彩色图片 ![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuHyhibP1Nhia2xqqjf4vMlM2tTnn8icL0iauM7x4zGMUfcvRus2ftejBIMQ/640?wx_fmt=png)和一段文本 ![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuIlwIIyvI0BKVv555yZOkEiaxtEmdNnPxmiacYnVvt7pCpJickrPttnplQ/640?wx_fmt=png)。![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuIlwIIyvI0BKVv555yZOkEiaxtEmdNnPxmiacYnVvt7pCpJickrPttnplQ/640?wx_fmt=png)描述了一个特定任务。网络输出为目标框![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuafDeMuVr71hrdc4D7XgF98vuLPXSAhKLLcwMhqtfKJIQa1MvTlyFSg/640?wx_fmt=png)、实例掩码![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUku6xqTaeFW0cojMzmuSSibCIkhVPJ22KNhjC3fuKJHC69RguIrQHzK8iaA/640?wx_fmt=png)、偏好程度![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUku4TzX0jG6292ibPCxpwcSNicyK72ZS0OQ13oePfOYF1avfYGW7r5ubl4Q/640?wx_fmt=png)。网络的预测过程刻画了对能够承担特定任务的物体的检测，同时建模了不同物体之间的偏好关系。

对于特定任务如 “dig hole”，文本输入![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuIlwIIyvI0BKVv555yZOkEiaxtEmdNnPxmiacYnVvt7pCpJickrPttnplQ/640?wx_fmt=png)可以为动词 - 名词形式如 “dig hole with skateboard”，其中“skateboard” 为目标物体的类型，也可以为动词 - 代词形式如“dig hole with something”。前者在模型推理阶段破坏了目标不可知性，但可用于在所提出的名词 - 代词蒸馏框架下提升后者。对于单一的 TOIST 模型，我们采用动词 - 代词形式的![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuIlwIIyvI0BKVv555yZOkEiaxtEmdNnPxmiacYnVvt7pCpJickrPttnplQ/640?wx_fmt=png)。

如图 2 底部所示，TOIST 包含三个主要模块。多模态编码器（棕色）从图像输入![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuDyL9U0dLLlgI6p7rpSlxvq9TmWq8HgxpNXEfXwjmKcyXohw1mu5WEg/640?wx_fmt=png)和文本输![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuIlwIIyvI0BKVv555yZOkEiaxtEmdNnPxmiacYnVvt7pCpJickrPttnplQ/640?wx_fmt=png)中提取 token 特征。Transformer 编码器（绿色）聚合两种模态的特征。Transformer 解码器（蓝色）预测出最适合给定任务的物体。其中 logit head 输出![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuoJC0DjMbeerDA8M1377ZoiaPWPG77PuvQ8FMQ1llCC3D4ziap0tNry1Q/640?wx_fmt=png)个物体的 logits 分布![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkump9Q3LRqHicUrM4dXnzWMhZkaHyvoaUbpeYHDYTMc2v8wBs4xicpH5mQ/640?wx_fmt=png)。 ![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuiauVExAuntmLN6IZyCnwHTP8G1MOCicKYrfQ4YIy38Du6iakE5DKCMlKQ/640?wx_fmt=png)分别对应![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkumNrsRhdPR6Earf0L0gfC08Dqto7s7n5C1fibPbiaBZFWKfeqbV1ZD1KA/640?wx_fmt=png)个输入的文本 token，衡量了物体和各个文本 token 相匹配的概率。最后一维![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuWecFicwicd9GwHJjXe0Eh6jg4jqaSTTiaNxFWvbeK1VuTb4vIUS1GajMw/640?wx_fmt=png)代表 “不是物体” 的 logit。我们将预测出的每个物体的偏好程度![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuQvQ15uUNibu4kPqJNhOosI2LibKP28Uz0odia53kgerpO8cjjodUBmzPA/640?wx_fmt=png)定义为![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuV7NvhmTBSicaZAsfH8pq18WVI4IMmhF8FV8YjhYyplghGcxRcWCt49Q/640?wx_fmt=png)。

训练过程中，我们使用 L1、GIoU[8]，Dice/F-1[9]、Focal[10]，soft-token、contrastive alignment[11] 等损失函数来分别监督目标检测、分割、分类（建立物体和词语间的对应关系）：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuohMdOhFicW4cWtVkHfxKydzHEhaxeVzicfnKVKR9AJy6mib4jvpial7PhQ/640?wx_fmt=png)

### **名词 - 代词蒸馏框架**

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuc63yiag1xzBpKqxn35tKkekuhXjIf0jhhxwkJum0BeDGPrgRN8FBndw/640?wx_fmt=png)

###### 图 3：带有名词 - 代词蒸馏的 TOIST 的总体框架图

我们同时训练两个 TOIST 模型，教师模型和学生模型的文本输入分别为动词 - 名词形式、动词 - 代词形式。名词 - 代词蒸馏包括两部分：**聚类蒸馏和偏好蒸馏**。

**聚类蒸馏。**我们建立了一个存储名词特征的文本特征库，每个特定任务对应一个队列。在训练过程中，将教师模型处理后的名词对应的特征更新到对应任务的特征队列中。更新后的特征队列通过 K-means 聚类得到 K 个聚类中心。而后将学生模型中代词对应的特征![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuQOXGq7mUt2O5w33qxDvO5f5sasLkg9nzKglicWaktI5ZC8f0EC6Ot3A/640?wx_fmt=png)替换为该特征距离最近的聚类中心![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuLco6ZuKQ5tgVIZV9dm501LOyM5IibWhVCYiaWSekJRAC2DjxRSBDHAJw/640?wx_fmt=png)。并使用 L2 损失拉近两者的距离：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuwtYOJbY77zUXibHClJ1nod2pbk7jiaKxgTJCKnQwezPre4ibh1iaQib4R8w/640?wx_fmt=png)

在推理阶段，学生模型直接利用最终的文本特征库生成聚类中心以替换代词特征。

**偏好蒸馏。**我们对模型预测的候选对象的偏好程度信息进行蒸馏。利用 logit head 预测的 logit 值，首先定义候选对象被最终选中与否的概率分布为 ![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuh60u6iblkyoTDerf0G0d3ibdouEnb1LkH1Gy4T6ibuaiblJicHIicKIYdsdQ/640?wx_fmt=png)。其中

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUku6uDBbLjfUreNqK69kf5KA35nfJQ9Yj4r2jb2jMJS4Jwgxf8Sn1uITQ/640?wx_fmt=png)

对于教师模型和学生模型对同一个样本分别预测的所有对象![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuLxcO4icjqUZ52xtxodkZhcQ2qUO6oxH3epgIC2BicVQ6F2EzF2LoXiaBg/640?wx_fmt=png)，我们利用匈牙利算法找到一个双边匹配关系 ![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuicZm7mBUE6XNnGDh00cdERrrD4emW4f3teCg0VVZIzVtNMfL4r7ib2LA/640?wx_fmt=png)，使整体相似程度最高。而后利用 KL - 散度使对应对象间的被选中概率分布趋于一致：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkugiaf4u8DaSQMR1dNZYOiblUS2E78LbV2PoXljgF2ibMlE4NSngc0yhMrA/640?wx_fmt=png)

从而实现对偏好程度的蒸馏。

**三、****实验结果**
--------------

我们在 COCO-Tasks 数据集 [5] 上进行了实验。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuvIr5TNxY0SxJh4IdBeg6esTqIcibsYuB8fPEZRvA2ptAtmgzWlpdnPQ/640?wx_fmt=png)

结果表明，与现有方法相比，名词 - 代词蒸馏框架下的 TOIST 模型取得了 SOTA 结果，证明了该方法在面向任务的实例分割问题上的有效性。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkucCBVW63LyNqxDKsmMfeXzaoia0OruNZRx3pKvdqgn8YyNDCCoYrZW4g/640?wx_fmt=png)

###### 图 4：TOIST 模型在 COCO-Tasks 上的可视化结果

从可视化结果（图 4）中可以看到，TOIST 甚至给出了一些比真实标签更准确的预测。如（b）中，没用物体被标注，但 TOIST 敏锐地检测到两个水瓶可以完成这项任务；（c）中，TOIST 预测出比真实标签更准确的分割结果。

我们进一步从三个方面分析我们的架构设计。

**注意力机制。**为了证明 TOIST 中的注意力机制可以自然地建模偏好关系，我们训练了两个 TOIST 模型，唯一的区别在于其中一个模型在解码器中不包含自注意力层。如图 5 所示，从解码器各层的预测结果来看，随着解码器层数的增加，目标候选对象之间的偏好关系逐渐通过自注意力提取出来。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuG2kUpt1lJGjhMYXoe1JcpAsSkl9atGuVgTHV3qaYVgu9ujATs3C5yg/640?wx_fmt=png)

###### 图 5：注意力机制的影响

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkuUHBD2utickCibiatB42JdDaYOBibLj3kTBmHd8sJeyy2ynfbkibvx1mv6Ig/640?wx_fmt=png)

**聚类蒸馏。**关于蒸馏方法的消融实现表明聚类蒸馏可以提升学生 TOIST 模型的性能（CCR、CL 相关两列）。从图 6 中，我们还可以看到，它能够使学生模型减少动词 - 代词指称的歧义（第一行），并能更好地对目标框中的像素进行分割（第二行）。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUku8Rlzjycl9SRpnicFqiaZicGwcGianAU8lRSUVlwx3yLMuD70niax2Pias7rg/640?wx_fmt=png)

###### 图 6：预测结果和代词的注意力图的可视化

**偏好蒸馏。**图 7 展示了偏好蒸馏发挥作用的三种场景。（1）它使假阳性候选对象（棒球）的偏好程度低于筛选阈值（0.9）。（2）将假阴性对象（中间的餐勺）的偏好程度提升到筛选阈值以上。（3）将假阳性对象（餐叉）的偏好程度更新为低于真阳性对象（餐刀）的偏好程度（0.9822 > 0.9808 → 0.9495 < 0.9680）。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ibaXaPIy7jV2Gs2Nibd8H55iaPXCPFyQUkualnAiaosOQPgVzFn3UZ3m0QbiaAnicsIb0XDjjibp4mibKpHuY6ZLwiaLZXg/640?wx_fmt=png)

###### 图 7：偏好蒸馏明显有效的三种情况的例子

**四、****总结**
------------

本文研究了面向任务的实例分割问题，以探索对动词指称的理解。我们提出了一种基于 Transformer 架构的 TOIST 模型，该模型能够利用注意力机制自然地对多个可选物体之间的偏好关系进行建模。我们进一步提出了名词 - 代词蒸馏框架，通过名词教代词以促使模型理解动词。我们的算法在 COCO-Tasks 数据集上获得了 SOTA 结果。分析实验表明，我们的模型能够有效建模物体间的偏好关系，且名词 - 代词蒸馏框架行之有效。我们期望本文提出的思想和框架能够推进视觉 - 语言融合的指称理解领域的研究进展。如何有效实现对名词、代词、动词、形容词的一体化指称理解，将是一个值得继续探索的研究方向。

**参考文献**
--------

[1] Weijie Su, Xizhou Zhu, Yue Cao, Bin Li, Lewei Lu, Furu Wei, and Jifeng Dai. Vl-bert: Pre-training of generic visual-linguistic representations. In International Conference on Learning Representations, 2019.

[2] Xiujun Li, Xi Yin, Chunyuan Li, Pengchuan Zhang, Xiaowei Hu, Lei Zhang, Lijuan Wang, Houdong Hu, Li Dong, Furu Wei, et al. Oscar: Object-semantics aligned pre-training for vision-language tasks. In European Conference on Computer Vision, pages 121–137. Springer, 2020.

[3] Aishwarya Kamath, Mannat Singh, Yann LeCun, Gabriel Synnaeve, Ishan Misra, and Nicolas Carion. Mdetr-modulated detection for end-to-end multi-modal understanding. In Proceedings of the IEEE/CVF International Conference on Computer Vision, pages 1780–1790, 2021.

[4] Junhua Mao, Jonathan Huang, Alexander Toshev, Oana Camburu, Alan L Yuille, and Kevin Murphy. Generation and comprehension of unambiguous object descriptions. In Proceedings of the IEEE conference on computer vision and pattern recognition, pages 11–20, 2016.

[5] Johann Sawatzky, Yaser Souri, Christian Grund, and Jurgen Gall. What object should i use?-task driven object detection. In Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, pages 7605–7614, 2019.

[6] Tom Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, Jared D Kaplan, Prafulla Dhariwal, Arvind Neelakantan, Pranav Shyam, Girish Sastry, Amanda Askell, et al. Language models are few-shot learners. Advances in neural information processing systems, 33:1877–1901, 2020.

[7] Alexey Dosovitskiy, Lucas Beyer, Alexander Kolesnikov, Dirk Weissenborn, Xiaohua Zhai, Thomas Unterthiner, Mostafa Dehghani, Matthias Minderer, Georg Heigold, Sylvain Gelly, et al. An image is worth 16x16 words: Transformers for image recognition at scale. In International Conference on Learning Representations, 2020.

[8] Hamid Rezatofighi, Nathan Tsoi, JunYoung Gwak, Amir Sadeghian, Ian Reid, and Silvio Savarese. Generalized intersection over union: A metric and a loss for bounding box regression. In Proceedings of the IEEE/CVF conference on computer vision and pattern recognition, pages 658–666, 2019.

[9] Fausto Milletari, Nassir Navab, and Seyed-Ahmad Ahmadi. V-net: Fully convolutional neural networks for volumetric medical image segmentation. In 2016 fourth international conference on 3D vision (3DV), pages 565–571. IEEE, 2016.

[10] Tsung-Yi Lin, Priya Goyal, Ross Girshick, Kaiming He, and Piotr Dollár. Focal loss for dense object detection. In Proceedings of the IEEE international conference on computer vision, pages 2980–2988, 2017.

[11] Aishwarya Kamath, Mannat Singh, Yann LeCun, Gabriel Synnaeve, Ishan Misra, and Nicolas Carion. Mdetr-modulated detection for end-to-end multi-modal understanding. In Proceedings of the IEEE/CVF International Conference on Computer Vision, pages 1780–1790, 2021.

