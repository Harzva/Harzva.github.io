
![](3-论文写作/attachments/images_pdfs/BT%20loss_image_1.png)
![](3-论文写作/attachments/images_pdfs/BT%20loss_image_2.png)
近期重新看了一篇工作 Self-Supervised Learning via Maximum Entropy Coding (MEC)，文中提到对于 Batch-wise 和 Feature-wise 对比学习优化目标是统一的，只是不同的表达形式，并也拿 Barlow Twins 为例做了简单的解释。
![](3-论文写作/attachments/images_pdfs/BT%20loss_image_3.png)

于是，又重新回去看了一遍 Barlow Twins，首先论文提出的算法结构非常简单，最终优化目标便是基于 Encoder + Projector 所获得的特征向量，并且没有 Momentum Encoder，Stop Gradient 等大部分对比学习所使用的的训练技巧。而且不在追求很大的batch size就可以提高性能。这些可以回过头来看，会清楚很多。

to dyy
首先，大瑶的方法是属于Feature-wise。
然后再区分Batch-wise 和 Feature-wise 这两个的区别 
![](3-论文写作/attachments/images_pdfs/BT%20loss_image_4.png)
**Batch-wise（ Instance-level Contrastive loss，一般不是方阵，除了clip（方阵）**：如上图
如 MoCo，SimCLR 等均是在 batch 维度上构建相似度矩阵。
说白了就是同一批次不同实instance互负样本，同一图片的instance互为正样本，缺点同一batch的类别相同的instance也被当做负样本对待了。例如 clip的  clip loss 都是一一对应的。 这类方法往往需要很大的batchsize，因为InfoNCE估计的互信息 往往是baised, 需要极大的batch size才能降低 bais（为什么请看参考链接）.

**Feature-wise （ cluster-level contrastive loss，方阵）**：这里的cluster其实就是特征维度
是要求每个channel 都有一些含义，这些含义是互相独立的。目的在于每一个特征的维度最好有独立的含义，从而尝试获得信息量更加丰富的特征表达。
Batch-wise（instance-level loss）方法有一个比较强的假设就是一个mini-batch里面没有相同class的样本（一个batch），否则GT就不是对角矩阵了；而Barlow Twins不需要这个假设，因为他的要求是特征分布，Barlow twins 基于Barlow原则认为特征是冗余的，目的是降低冗余度 ，那么只要feature channel 之间（比如 512 维）不相关就行。所以从这个角度说，Barlow Twins 更像一个[正则项](https://www.zhihu.com/search?q=%E6%AD%A3%E5%88%99%E9%A1%B9&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A1838122296%7D)。此外BT和batch无关就可以避免了Batch-wise方法都要求机器可以跑的了很大的batch，否则效果不好。而BT方法只需要feature channel  大一些就好。给每一个特征维度赋予自己的独有的属性。


 BT里面batchsize 是2048 特征维度是8192最后中是8192x8192，意思就是说第i个图片的第n个维度和第j个图片的第n个维度，或者说batch中所有图片的第n个维度是相关的。也就是说特征维度（属性？）应该之间应该是解耦的，无关的，来达到去冗余的目的。所以咱们的方法同一特征包含同一batch好多图片的信息是合理的。
  
  
但是不同的是咱们的oneshot任务回多一个proposal 的维度。这个维度这里是128，那么。batch x c（BT） →batch x 128xc（ours） → 128batch x c（ours）这时候和BT其实是一样的。这个proposal 就相当于起到了扩大batch的作用。其实就相当与128batch（1024）个图片，相当于batch=1024的BT学习方法。这里我们自己的设备其实是很难将batch设为很大的，通过这种间接的将batch增大感觉也是有好处的。

BT他这个是对比自监督然后被用到下游任务微调，特征维度之间的解耦看来是有效果的。

突然想到之前想过的方法可以叫class-wise，也是对角朕，更新类别原型做类别之间的去冗余。


BT缺点：大BZ的反向影响。方法虽然在小BZ上效果优于BYOL，但略逊于SimCLR。随着BZ加大，此方法的性能反而下降。

![](3-论文写作/attachments/images_pdfs/BT%20loss_image_5.png)
该方法叫《Contrastive Clustering》属于深度聚类的Deep Clustering方法，李硕师兄的无监督聚类方法也属于Deep Clustering。显式的展现了实例层次（instance-level）和集群层次（cluster-level）的对比学习。其实也就是Feature-wise和batch-wise 同时都用了具体可见。[【Deep Clustering】Contrastive Clustering - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/360930917)

[从正负样本解耦看对比学习为何需要large batch size训练 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/474374316#:~:text=%E8%BF%99%E5%B0%B1%E6%98%AF%E5%AF%B9%E6%AF%94%E5%AD%A6%E4%B9%A0%E5%BE%80%E5%BE%80%E9%9C%80%E8%A6%81%E5%A4%A7batch%20size%E7%9A%84%E5%8E%9F%E5%9B%A0%E3%80%82%20%E9%82%A3%E4%B9%88%E9%97%AE%E9%A2%98%E6%9D%A5%E4%BA%86%EF%BC%8C%E6%97%A2%E7%84%B6%20epsilon%20%E5%BE%88%E5%B0%8F%E5%AF%BC%E8%87%B4%20log%20%281%2B,%28n-1%29epsilon%29%20%E8%B6%8B%E8%BF%91%E4%BA%8E0%EF%BC%8C%E9%82%A3%E4%B9%88%E6%88%91%E4%BB%AC%E5%B9%B2%E8%84%86%E6%8A%8A1%E5%8E%BB%E6%8E%89%EF%BC%8C%E5%8F%98%E6%88%90%20log%20%28%28n-1%29epsilon%29%20%EF%BC%8C%E8%BF%99%E6%A0%B7%E5%B0%B1%E7%AE%97%20epsilon%20%E5%B0%8F%EF%BC%8Cn%E5%B0%8F%EF%BC%8C%E6%A2%AF%E5%BA%A6%E4%B9%9F%E4%BC%9A%E5%BE%88%E5%A4%A7%EF%BC%8C%E4%B8%8D%E4%BC%9A%E5%AF%BC%E8%87%B4%E6%A8%A1%E5%9E%8B%E5%AD%A6%E4%B8%8D%E5%87%BA%E6%9D%A5%E7%9A%84%E9%97%AE%E9%A2%98%E3%80%82)


[[clip和BT]]
[[自监督对比学习的泛化性理论]]


附录：
pixel-wise，patch-wise，image-wise的含义如下

pixel-wise字面上的理解一样，一张图片是由一个个pixel组成的，这个是图像的基本单位，像素级别的（分割）

image-wise图像级别，比如一张图片的标签是狗，是对整个图片的标注（分类）

patch-wise介于像素级别和图像级别的区域，也就是块，每个patch都是由好多个pixel组成的
