import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  ExternalLink,
  Github,
  Mail,
  Search,
  Share2,
  Sparkles,
  Star,
  Workflow
} from "lucide-react";
import "./styles.css";

const projects = [
  {
    id: "01",
    name: "learn-likecc",
    tagline: "Claude Code 源码逆向恢复",
    description:
      "GitHub 上公开的 Claude Code 逆向工程项目。通过 Source Map 分析恢复 5.1 万+ 行源代码，进行架构拆解与可运行版本重建。",
    image: "/project-learn-likecc.svg",
    url: "https://github.com/Harzva/learn-likecc",
    topics: ["逆向工程", "source-map", "claude-code", "mcp-protocol"],
    stats: "182 stars / 37 forks"
  },
  {
    id: "02",
    name: "codex-managed-agent",
    tagline: "多智能体管理框架",
    description:
      "用于协调多个 AI 智能体的编排系统，覆盖生命周期管理、状态同步与控制平面原语。",
    image: "/project-codex-agent.svg",
    url: "https://github.com/Harzva/codex-managed-agent",
    topics: ["多智能体", "control-plane", "cli-tool"],
    stats: "Agent orchestration"
  },
  {
    id: "03",
    name: "like-code",
    tagline: "定制化 Claude Code 分支",
    description:
      "支持路由模型与多智能体的 Claude Code 分支，通过统一 CLI 接口管理多个 LLM 提供商。",
    image: "/project-like-code.svg",
    url: "https://github.com/Harzva/like-code",
    topics: ["claude-code", "routing", "multi-agent"],
    stats: "TypeScript"
  },
  {
    id: "04",
    name: "meta-agent",
    tagline: "智能体编排基础设施",
    description:
      "元层级智能体设计与控制平面架构，用于分布式智能体系统和智能体间通信协议层。",
    image: "/project-meta-agent.svg",
    url: "https://github.com/Harzva/meta-agent",
    topics: ["meta-agent", "protocol", "a2a"],
    stats: "Architecture"
  },
  {
    id: "05",
    name: "loloop-skill",
    tagline: "可复用认知技能模块",
    description:
      "面向 Agent 工作流的技能模块实验，将可复用认知步骤沉淀为可组合的工程资产。",
    image: "/project-skills.svg",
    url: "https://github.com/Harzva/loloop-skill",
    topics: ["skill", "workflow", "agent"],
    stats: "Reusable skills"
  },
  {
    id: "06",
    name: "everything-agent-cli-to-claude-code",
    tagline: "跨平台 CLI 适配器",
    description:
      "将多模型 CLI 能力整合到 Claude Code 为中心的工作流，降低工具链切换成本。",
    image: "/project-cli-adapter.svg",
    url: "https://github.com/Harzva/everything-agent-cli-to-claude-code",
    topics: ["adapter", "cli", "toolchain"],
    stats: "Integration"
  }
];

const papers = [
  {
    id: "g2d",
    title: "G2D: Discriminative-Generative Collaborative Inference",
    titleCn: "G2D：判别-生成协同推理",
    venue: "arXiv",
    year: "2025",
    tier: "Preprint",
    role: "First Author",
    cover: "/papers/g2d_main_page1.png",
    figures: ["/figures_clean/g2d_fig3_p5.png", "/figures_clean/g2d_fig2_p2.png", "/figures_clean/g2d_fig4_p6.png"],
    summary:
      "将 CLIP 判别式能力与 LVLM 生成式开放词汇能力结合，通过条件验证器缓解生成幻觉并提升零样本分类稳定性。",
    motivation:
      "传统 CLIP 类方法判别稳定但语义开放性不足，LVLM 生成式方法开放词汇能力强但容易幻觉。G2D 的核心问题意识是：零样本分类不应在判别式和生成式之间二选一，而应让生成器提出候选、判别器负责验证。",
    method:
      "方法上以生成式模型负责候选语义扩展，再通过 CLIP 条件验证器对生成结果进行约束和路由。这样既保留开放词汇能力，又用判别式分数控制错误传播。",
    experiments:
      "实验重点比较不同 generator backbone 在多个数据集上的迁移表现，并通过定性样例分析路由决策：何时跟随 VLM、何时跟随 CLIP，以及二者一致时的稳定收益。",
    highlights: ["判别-生成协同框架", "CLIP 条件验证器", "开放词汇零样本分类", "多 backbone 迁移验证"],
    tags: ["Zero-Shot", "CLIP", "LVLM"]
  },
  {
    id: "mope",
    title: "Preserving Text Space Integrity via Mixture of Pretrained Experts",
    titleCn: "通过预训练专家混合保持文本空间完整性",
    venue: "Neurocomputing",
    year: "2025",
    tier: "Q1",
    role: "First Author",
    cover: "/papers/mope_page1.png",
    figures: ["/caption_crops/mope/page_008_figure_caption_crop_01.png", "/caption_crops/mope/page_009_figure_caption_crop_01.png", "/caption_crops/mope/page_009_figure_caption_crop_02.png"],
    summary:
      "构建多预训练专家融合框架，在不破坏 CLIP 文本空间的前提下提升组合零样本学习的泛化能力。",
    motivation:
      "组合零样本学习中的 prompt-learning 方法通常会改变文本空间，并且面对新任务时需要重新学习提示。MoPE 的出发点是保持预训练文本空间完整性，用专家混合来替代对文本编码器的破坏性调整。",
    method:
      "框架由多个文本/视觉专家和 Multi-Expert Fusion Module 组成，各专家保持冻结或轻量适配，在 logit/metric 空间完成融合，从而让不同专家自然覆盖不同属性-对象子空间。",
    experiments:
      "实验覆盖 UT-Zappos、C-GQA、AO-Clevr 等组合基准，重点验证专家融合、文本空间保持和不同融合位置对 seen/unseen 组合的影响。",
    highlights: ["预训练专家混合", "文本空间完整性", "组合零样本学习", "动态专家融合"],
    tags: ["CZSL", "MoE", "CLIP"]
  },
  {
    id: "textaug",
    title: "Text Augmentation for Vision",
    titleCn: "面向视觉的文本增强",
    venue: "Knowledge-Based Systems",
    year: "2026",
    tier: "Q1",
    role: "First Author",
    cover: "/papers/textaug_page1.png",
    figures: ["/caption_crops/textaug/page_009_figure_caption_crop_01.png", "/caption_crops/textaug/page_005_figure_caption_crop_01.png", "/caption_crops/textaug/page_007_figure_caption_crop_01.png"],
    summary:
      "利用类别文本描述增强小样本视觉学习，并通过模态偏好感知机制自适应调节视觉与文本信息。",
    motivation:
      "极少样本场景下，视觉样本不足导致模型容易过拟合。文本描述提供了类别属性、形状、颜色和语义先验，但直接混合视觉和文本又会造成模态目标冲突。",
    method:
      "方法将文本描述作为训练补充，并通过交替模态监督让模型在视觉和文本之间学习更稳定的共享表示；模态偏好模块再判断当前任务更依赖视觉还是文本。",
    experiments:
      "实验分析 1-shot/5-shot 场景下文本增强的收益，并通过 t-SNE、跨数据集和跨类别实验验证模态偏好机制的泛化能力。",
    highlights: ["文本增强视觉学习", "交替模态监督", "模态偏好感知", "小样本分类"],
    tags: ["Few-Shot", "Text Augmentation", "VLM"]
  },
  {
    id: "ldc",
    title: "Logits DeConfusion",
    titleCn: "Logits DeConfusion",
    venue: "CVPR",
    year: "2025",
    tier: "CCF-A",
    role: "Co-Author",
    cover: "/papers/ldc_page1.png",
    figures: ["/caption_crops/ldc/page_001_figure_caption_crop_01.png", "/caption_crops/ldc/page_004_figure_caption_crop_01.png", "/caption_crops/ldc/page_007_figure_caption_crop_01.png"],
    summary:
      "围绕 logits 层的混淆问题建模，提升视觉识别模型在复杂类别关系下的判别可靠性。",
    motivation:
      "视觉分类中很多错误并不来自特征完全失效，而来自 logits 层对相近类别的混淆。LDC 聚焦最后决策空间，试图在不大幅改变主干网络的情况下缓解类别间误判。",
    method:
      "方法从 logits 分布和类别关系入手，对混淆项进行显式建模与解耦，使模型输出更符合真实类别边界。",
    experiments:
      "实验通过主结果表、消融表和模块可视化展示 logits 去混淆对不同数据集和不同模型设置的稳定提升。",
    highlights: ["Logits 层建模", "类别混淆解耦", "CVPR 2025", "判别可靠性"],
    tags: ["CVPR", "Recognition", "Logits"]
  },
  {
    id: "promptvad",
    title: "PromptVAD: Prompt-Based Video Anomaly Detection",
    titleCn: "PromptVAD：基于提示的视频异常检测",
    venue: "TNNLS",
    year: "2023",
    tier: "Q1",
    role: "Co-Author",
    cover: "/papers/promptvad_page1.png",
    figures: ["/caption_crops/promptvad/page_010_figure_caption_crop_01.png", "/caption_crops/promptvad/page_001_figure_caption_crop_01.png", "/caption_crops/promptvad/page_011_table_caption_crop_02.png"],
    summary:
      "将提示学习引入视频异常检测任务，增强模型对异常语义与视频时序线索的表达能力。",
    motivation:
      "视频异常检测难点在于异常事件稀缺、语义边界模糊且长视频噪声高。PromptVAD 试图用提示机制引导模型关注异常相关语义。",
    method:
      "方法将 prompt 表达与视频编码器结合，通过异常语义提示和解码模块对时序片段进行建模。",
    experiments:
      "实验包含 ShanghaiTech、UCF-Crime 等基准，并通过消融表验证提示模块、decoder 和定义设计对性能的贡献。",
    highlights: ["视频异常检测", "Prompt learning", "时序语义建模", "TNNLS"],
    tags: ["Video", "Anomaly Detection", "Prompt"]
  },
  {
    id: "minent",
    title: "MinEnt: Minimum Entropy for Self-Supervised Representation Learning",
    titleCn: "MinEnt：面向自监督表征学习的最小熵方法",
    venue: "Pattern Recognition",
    year: "2023",
    tier: "Q1",
    role: "Co-Author",
    cover: "/papers/minent_page1.png",
    figures: ["/caption_crops/minent/page_009_figure_caption_crop_03.png", "/caption_crops/minent/page_007_table_caption_crop_04.png", "/caption_crops/minent/page_007_table_caption_crop_01.png"],
    summary:
      "通过最小熵原则改进自监督表征学习的聚类与特征一致性，提升下游识别性能。",
    motivation:
      "自监督学习需要在没有标签的情况下形成稳定类别结构。MinEnt 从熵最小化角度约束表示分布，使特征聚合更明确。",
    method:
      "方法在自监督训练流程中引入最小熵目标，鼓励模型产生更确定、更可分的表示。",
    experiments:
      "实验包含 CIFAR、ImageNet 等设置，并通过归一化、收敛曲线和主结果表分析不同模块的作用。",
    highlights: ["自监督学习", "最小熵", "表征聚类", "Pattern Recognition"],
    tags: ["SSL", "Representation", "Entropy"]
  },
  {
    id: "lf2cs",
    title: "LF2CS: Learning Features into Clustering Space",
    titleCn: "LF2CS：将特征学习到聚类空间",
    venue: "ECCV",
    year: "2022",
    tier: "CCF-A",
    role: "Co-Author",
    cover: "/papers/lf2cs_page1.png",
    figures: ["/caption_crops/lf2cs/page_014_figure_caption_crop_02.png", "/caption_crops/lf2cs/page_005_figure_caption_crop_01.png", "/caption_crops/lf2cs/page_002_figure_caption_crop_01.png"],
    summary:
      "面向小样本图像分类，将特征空间结构化到聚类空间，提升类别间可分性与少样本泛化。",
    motivation:
      "小样本分类中，普通特征空间容易受少量样本噪声影响。LF2CS 的核心判断是：特征不仅要可区分，还要能在聚类空间中形成稳定结构。",
    method:
      "方法通过任务编码和聚类空间约束，将类别特征映射到更适合少样本判别的空间。",
    experiments:
      "实验展示了维度分析、收敛曲线和聚类空间效果，验证方法在少样本设置下的稳定性。",
    highlights: ["ECCV 2022", "小样本分类", "聚类空间", "任务编码"],
    tags: ["ECCV", "Few-Shot", "Clustering"]
  },
  {
    id: "mmkt",
    title: "Text Generation and Multi-Modal Knowledge Transfer",
    titleCn: "文本生成与多模态知识迁移",
    venue: "Pattern Recognition",
    year: "2025",
    tier: "Q1",
    role: "Co-Author",
    cover: "/papers/mmkt_page1.png",
    figures: ["/caption_crops/mmkt/page_009_figure_caption_crop_02.png", "/caption_crops/mmkt/page_009_figure_caption_crop_01.png", "/caption_crops/mmkt/page_010_figure_caption_crop_01.png"],
    summary:
      "通过文本生成和多模态知识迁移增强小样本目标检测中的语义监督和类别泛化能力。",
    motivation:
      "小样本目标检测不仅缺少图像样本，也缺少可迁移的类别语义。文本生成可以补充类别描述，多模态迁移则帮助检测模型利用这些语义。",
    method:
      "方法生成类别文本描述，并将文本知识迁移到视觉检测框架中，强化少样本类别的语义表示。",
    experiments:
      "实验重点展示框架图、文本描述样例和检测可视化，说明多模态知识对目标定位和分类的帮助。",
    highlights: ["小样本检测", "文本生成", "多模态知识迁移", "语义增强"],
    tags: ["Detection", "Few-Shot", "Multimodal"]
  },
  {
    id: "acl",
    title: "Augmentative Contrastive Learning for One-Shot Object Detection",
    titleCn: "面向单样本目标检测的增强式对比学习",
    venue: "Neurocomputing",
    year: "2022",
    tier: "Q1",
    role: "Co-Author",
    cover: "/papers/acl_page1.png",
    figures: ["/caption_crops/acl/page_009_figure_caption_crop_01.png", "/caption_crops/acl/page_008_figure_caption_crop_04.png", "/caption_crops/acl/page_006_table_caption_crop_01.png"],
    summary:
      "为单样本目标检测构建增强式对比学习框架，改善极少样本条件下的目标表征。",
    motivation:
      "单样本目标检测只有极少监督，模型很难学习稳定的类别边界。增强式对比学习通过构造更丰富的正负关系来缓解样本不足。",
    method:
      "框架结合数据增强、鼓励/约束机制与对比目标，提升单样本条件下目标特征的判别性。",
    experiments:
      "实验通过 COCO seen 类别、效率表和整体框架图分析方法在检测精度和训练成本上的平衡。",
    highlights: ["One-shot detection", "对比学习", "数据增强", "效率分析"],
    tags: ["One-Shot", "Detection", "Contrastive"]
  },
  {
    id: "viltclip",
    title: "ViLT-CLIP: Video and Language Tuning CLIP",
    titleCn: "ViLT-CLIP：视频语言调优 CLIP",
    venue: "AAAI",
    year: "2024",
    tier: "CCF-A",
    role: "Co-Author",
    cover: "/papers/viltclip_page1.png",
    figures: ["/caption_crops/viltclip/page_008_table_caption_crop_01.png", "/caption_crops/viltclip/page_009_figure_caption_crop_03.png", "/caption_crops/viltclip/page_004_figure_caption_crop_01.png"],
    summary:
      "面向视频理解任务调优 CLIP 的视觉-语言表示，提升少样本视频分类与检索能力。",
    motivation:
      "CLIP 在图像-文本对齐上表现强，但直接迁移到视频任务时缺少时序建模。ViLT-CLIP 关注如何在少样本视频场景中保留语言先验并补足时间维度。",
    method:
      "方法通过视频语言调优和多模态 prompt learning，将视频特征与文本表示对齐。",
    experiments:
      "实验包含少样本视频分类、文本-视频检索和架构对比，验证视频语言调优的有效性。",
    highlights: ["AAAI 2024", "视频语言调优", "CLIP", "少样本视频理解"],
    tags: ["AAAI", "Video", "CLIP"]
  },
  {
    id: "kdtpl",
    title: "LLM Knowledge-Driven Target Prototype Learning",
    titleCn: "LLM 知识驱动的目标原型学习",
    venue: "Knowledge-Based Systems",
    year: "2025",
    tier: "Q1",
    role: "Co-Author",
    cover: "/papers/kdtpl_page1.png",
    figures: ["/caption_crops/kdtpl/page_012_figure_caption_crop_01.png", "/caption_crops/kdtpl/page_011_figure_caption_crop_02.png", "/caption_crops/kdtpl/page_013_figure_caption_crop_01.png"],
    summary:
      "引入大语言模型知识增强少样本分割中的目标原型构建，改善语义先验与视觉特征对齐。",
    motivation:
      "少样本分割的目标原型往往只来自少量支持图，容易偏离真实类别语义。LLM 提供的知识先验可以帮助构建更稳健的目标原型。",
    method:
      "方法结合 LLM 知识、视觉支持特征和混合原型机制，生成更可靠的类别表示，并用于查询图分割。",
    experiments:
      "实验通过原型比较、先验掩码、混合原型和消融表展示知识驱动原型学习的贡献。",
    highlights: ["少样本分割", "LLM 知识先验", "目标原型", "KBS"],
    tags: ["Segmentation", "LLM", "Prototype"]
  }
];

const detailAnalysis = {
  g2d: {
    motivation: [
      "这篇工作的关键价值在于重新审视零样本分类的范式分工。CLIP 类判别模型擅长稳定打分，但它依赖预设类别文本，遇到细粒度语义或开放词汇变化时容易受限；LVLM/生成式模型可以产生更丰富的语义描述，却缺少足够可靠的判别边界。",
      "因此，G2D 不是简单地把两个模型做 ensemble，而是把任务拆成“生成候选”和“验证候选”两个阶段。这个拆法更接近真实推理流程：先扩大语义搜索空间，再用可靠的判别器收束答案。"
    ],
    method: [
      "方法的核心是条件验证器。生成器负责提供开放词汇候选，判别器负责检查候选是否与图像一致，并在多个候选之间做路由决策。这样可以利用 LVLM 的语义覆盖能力，同时避免把生成式幻觉直接当作分类结果。",
      "从工程角度看，这类设计也有较强可扩展性：生成器可以替换为不同大小的 VLM，判别器可以继续使用 CLIP 系列模型，系统通过验证层吸收不同 backbone 的差异。"
    ],
    experiments: [
      "实验重点不是只报一个平均准确率，而是比较不同 generator backbone、不同数据集和不同路由场景下的稳定性。定性样例展示了模型何时应相信 VLM，何时应回退到 CLIP，这比单纯堆结果更能说明方法机制。",
      "如果后续继续加强，最值得补的是失败案例分析：哪些类别最容易让生成器幻觉，哪些细粒度差异仍然需要更强的视觉判别器。"
    ]
  },
  mope: {
    motivation: [
      "MoPE 关注的是组合零样本学习中的一个核心矛盾：模型既需要适应属性-对象组合，又不能破坏预训练 CLIP 文本空间。很多 prompt-learning 方法为了适配任务会学习新的提示，但这可能牺牲原本通用的文本语义结构。",
      "这篇工作的思路是保留文本空间，转而在专家层做组合适配。也就是说，不把通用知识改坏，而是在外围设计多个专家来吸收不同子空间的差异。"
    ],
    method: [
      "方法上，多个预训练专家分别提供不同视角的表征或打分，再通过融合模块动态加权。这个设计适合 CZSL，因为属性-对象组合天然不是单一分布，不同专家可以自然负责不同组合区域。",
      "最值得强调的是“融合发生在哪里”。如果过早融合，可能混淆文本和视觉空间；如果在 logit 或 metric 层融合，则可以让各专家保持独立判断，再在决策层统一。"
    ],
    experiments: [
      "实验应重点看 seen/unseen 之间的平衡，而不是只看 seen 类精度。MoPE 的价值在于提升 unseen composition 的泛化，同时控制 seen 类性能不明显下降。",
      "图表中专家框架、可视化检索和结果表能形成完整证据链：为什么要多专家、专家如何融合、融合后是否真的改善组合泛化。"
    ]
  },
  textaug: {
    motivation: [
      "Text Augmentation for Vision 的问题意识很直接：小样本视觉学习缺的是监督，而文本恰好提供了低成本语义监督。类别的外观、属性、上下文和判别线索，很多时候可以通过文本补充。",
      "但文本不是万能的。视觉样本和文本描述属于不同模态，强行统一优化可能让两边都变差。因此论文真正要解决的不是“加文本”，而是“如何有节制地使用文本”。"
    ],
    method: [
      "交替模态监督的意义在于避免模型同时吞入混合信号。视觉和文本轮流进入训练流程，模型被迫学习跨模态一致的核心语义，而不是记住某个模态里的表面特征。",
      "模态偏好模块进一步判断当前任务更依赖视觉细节还是文本语义。这个设计使方法不是固定比例融合，而是按任务动态调整。"
    ],
    experiments: [
      "实验分析应重点看 1-shot 场景，因为这是文本增强最可能发挥作用的地方。样本越少，文本先验越有价值；样本变多后，视觉监督本身会逐渐补足。",
      "t-SNE、跨数据集和跨类别实验能说明模型是否真的学到了更稳健的表示，而不只是对某个 benchmark 调参成功。"
    ]
  },
  ldc: {
    motivation: [
      "LDC 的切入点很工程化：很多分类错误并非来自 backbone 完全看不懂图像，而是最后 logits 空间对相似类别的关系处理不清。直接优化最终决策层，往往比重训整个表示空间更高效。",
      "这种问题在细粒度分类、多类别长尾和相似语义类别中尤其明显。模型的特征已经包含信息，但 logits 分布没有把边界拉开。"
    ],
    method: [
      "方法围绕 logits 层进行去混淆，通过建模类别间混淆关系来校正输出分布。它关注的是决策空间的结构，而不是单纯提高特征维度或增加模型容量。",
      "这种设计的好处是可插拔，理论上可以接到不同分类模型后面；风险是如果上游特征本身严重不足，logits 层校正也无法凭空恢复信息。"
    ],
    experiments: [
      "实验部分需要同时看主结果和消融。主结果证明有效，消融证明提升来自去混淆机制本身，而不是训练技巧或额外参数。",
      "如果图表中包含类别混淆矩阵或曲线，读者可以更直观看到方法是否真的减少了相近类别之间的错误传播。"
    ]
  },
  promptvad: {
    motivation: [
      "视频异常检测难在异常本身没有稳定定义：同一个动作在不同场景可能正常，也可能异常。PromptVAD 的价值在于用 prompt 显式注入异常语义，让模型不只看视觉变化，也理解异常概念。",
      "长视频还存在大量背景片段，异常片段稀疏且标签弱。提示机制可以作为注意力引导，帮助模型把有限监督聚焦到更可能异常的时序区域。"
    ],
    method: [
      "方法将 prompt 与视频时序编码结合，通过 decoder 或相关模块把异常语义映射到片段级判断。这里的关键不是 prompt 文本本身，而是 prompt 如何参与时序建模。",
      "如果 prompt 只作为静态标签，它的作用有限；如果它能影响片段表示和异常分数，就能真正改变检测过程。"
    ],
    experiments: [
      "实验应重点看不同数据集上的泛化，因为异常检测数据集差异很大。ShanghaiTech 和 UCF-Crime 的场景、视频长度和异常类型都不同。",
      "消融表尤其重要：它能证明 prompt、decoder、定义设计是否各自有效，而不是整体框架偶然提升。"
    ]
  },
  minent: {
    motivation: [
      "MinEnt 从自监督学习的表示分布出发：没有标签时，模型需要自己形成稳定类别结构。如果输出分布过于混乱，后续分类或聚类都会受影响。",
      "最小熵思想的直觉是让模型在表示和预测上更确定，减少模棱两可的中间状态。但过度最小熵也可能导致塌缩，所以关键是如何与自监督目标平衡。"
    ],
    method: [
      "方法把最小熵约束放入自监督训练流程，让模型在保持数据增强一致性的同时形成更清晰的类别倾向。",
      "它不是简单追求低熵，而是在 representation learning 中引导特征空间更可分。这个设计适合和现有 SSL 框架组合。"
    ],
    experiments: [
      "实验要看两个层面：一是下游分类性能是否提升，二是表示空间是否更稳定。收敛曲线、归一化实验和 ImageNet 结果都能支撑这两个问题。",
      "如果某些数据集收益较小，可能说明原 SSL baseline 已经足够强，或最小熵约束需要更细的权重调度。"
    ]
  },
  lf2cs: {
    motivation: [
      "LF2CS 面向小样本分类的核心挑战：每类样本极少，普通特征空间容易被单个样本噪声影响。将特征学习到聚类空间，可以让类别结构更稳定。",
      "它强调的不是更复杂的 backbone，而是让特征空间本身更适合 few-shot 判别。这个思路对小样本任务很重要。"
    ],
    method: [
      "方法通过任务编码和聚类空间约束，把支持集和查询集映射到更有类别结构的空间。这样分类不再只依赖点对点距离，而是依赖更稳定的簇结构。",
      "聚类空间的优势在于能吸收样本内变化，减少个别支持样本偏差对决策边界的影响。"
    ],
    experiments: [
      "实验中的维度分析和收敛曲线很关键，它们说明方法不是只在结果表上有效，而是确实改变了训练动态和空间结构。",
      "作为 ECCV 工作，它的价值在于把小样本分类问题从 metric learning 推进到更结构化的 feature-to-clustering-space 视角。"
    ]
  },
  mmkt: {
    motivation: [
      "小样本目标检测同时缺少视觉样本和语义描述。MMKT 的动机是：检测器不应只从几张图里学习类别，还应利用文本生成出的类别知识。",
      "文本描述可以补充目标的外观、上下文和判别属性，尤其对低样本类别有帮助。"
    ],
    method: [
      "方法先生成类别文本描述，再把这些语义知识迁移到视觉检测框架中。多模态知识迁移的关键是让文本信息帮助分类头和定位表示，而不是只作为附加说明。",
      "这种设计本质上把类别知识从语言空间转移到检测模型中，使少样本类别拥有更丰富的先验。"
    ],
    experiments: [
      "实验图中的框架图、文本描述样例和检测可视化共同说明方法路径：文本如何生成、如何进入模型、最终如何影响检测结果。",
      "如果继续扩展，可以进一步分析生成文本质量与检测性能的关系，判断哪些文本属性最有用。"
    ]
  },
  acl: {
    motivation: [
      "单样本目标检测只有一个或极少样本，最大问题是正样本变化覆盖不足。增强式对比学习试图通过构造更多对比关系，扩大可学习信号。",
      "这类任务不只是分类难，定位也难。模型既要知道目标是什么，又要在复杂背景中定位它。"
    ],
    method: [
      "方法结合数据增强和对比学习目标，让模型在不同增强视图之间保持类别一致，同时拉开目标与背景、正类与负类的距离。",
      "鼓励/约束机制可以理解为对表示空间的双向塑形：鼓励同类靠近，约束干扰项不要混入。"
    ],
    experiments: [
      "实验表格中的 seen 类结果和效率分析都很重要。单样本检测方法如果只提升精度但训练或推理成本过高，实际价值会受限。",
      "框架图和效率表结合起来，能说明方法在效果和成本之间的工程平衡。"
    ]
  },
  viltclip: {
    motivation: [
      "CLIP 的强项是图像-文本对齐，但视频任务多了时间维度。ViLT-CLIP 的动机是保留 CLIP 的语言先验，同时补足视频时序理解能力。",
      "少样本视频理解尤其依赖预训练知识，因为每个动作类别的视频样本不足，直接训练视频模型成本高且容易过拟合。"
    ],
    method: [
      "方法通过视频语言调优和多模态 prompt learning，让视频片段表示与文本语义更好对齐。重点不是把图像 CLIP 简单逐帧应用，而是让时间信息参与对齐过程。",
      "这种方式可以同时服务少样本视频分类和文本-视频检索，因为二者都依赖跨模态一致表示。"
    ],
    experiments: [
      "实验中的 few-shot video 表和 text-video retrieval 表分别验证分类与检索能力。架构对比图则说明它相对普通 CLIP 迁移的结构差异。",
      "后续可以继续看更长视频、更复杂动作组合和跨数据集迁移，验证方法是否能扩展到真实视频理解场景。"
    ]
  },
  kdtpl: {
    motivation: [
      "少样本分割的核心是原型质量。支持图太少时，原型往往只覆盖目标的一小部分外观，容易偏离真实类别。KD-TPL 用 LLM 知识补充语义先验。",
      "大语言模型提供的是类别层知识，不是像素级标注。如何把语言先验转化为有用的视觉原型，是这篇工作的关键问题。"
    ],
    method: [
      "方法结合 LLM 知识、支持图视觉特征和混合原型机制，构建更稳健的目标表示。它不是用 LLM 直接分割图像，而是用 LLM 改善原型学习。",
      "混合原型可以缓解单一视觉原型的偏差，把语义先验和视觉证据结合起来。"
    ],
    experiments: [
      "图表中的原型比较、先验掩码、混合原型和消融表能形成完整解释：知识如何进入、原型如何变化、最终性能如何提升。",
      "这类方法的重点不只是最终 mIoU，还包括是否对不同类别、不同支持样本质量保持稳定。"
    ]
  }
};

const thoughtArticles = [
  {
    id: "token-to-product",
    number: "01",
    title: "Token to Product",
    label: "从模型调用到可交付结果",
    cover: "/thought_covers/token-to-product.png",
    text: "我更关心 token 用完之后留下了什么：代码、页面、脚本、数据、文章，还是只留下一段聊天记录。Agent 能不能进入真实工作流，取决于它能否把一次调用转成可复用的产品结果。",
    lead: "token 成本当然要看，但更应该记录 token 的产出。一次调用如果只解决当前问题，就是消耗；如果沉淀成组件、流程、案例、文章或客户能看到的功能，就可以继续复用。",
    sections: [
      {
        title: "先看调用之后留下了什么",
        paragraphs: [
          "我不想只统计用了多少 token，而是统计它完成了哪些工作：改了哪些文件、跑了哪些验证、生成了哪些素材、推进了哪个模块。",
          "Agent 的价值不在于回答得多长，而在于能不能接住一个任务，把输入、执行、验证和结果整理成下一次还能用的东西。"
        ]
      },
      {
        title: "转换链路：token -> product -> attention -> dollar",
        paragraphs: [
          "第一步是 token 到 product：调用结果能不能变成一个可运行能力。第二步是 product 到 attention：这个能力能不能被别人看懂、试用、讨论。第三步是 attention 到 dollar：关注能不能进一步变成付费、合作、用户增长或职业机会。",
          "所以我需要同时优化三件事：产品功能、展示方式、转化入口。只把模型用得更熟，还不够。"
        ]
      },
      {
        title: "可以记录的指标",
        paragraphs: [
          "每次 Agent 工作流结束后，可以记录几个结果：减少了多少重复操作，是否形成模板，是否能放进作品集，是否让产品更接近用户需求。",
          "如果一次调用只解决了一次性问题，它就是成本；如果它留下了组件、文章、脚本、案例、数据集或流程文档，就值得继续维护。"
        ]
      }
    ],
    takeaways: ["记录 token 的产出和复用情况。", "Agent 要进入真实工作流，结果要可验证。", "产品、展示和转化入口需要一起设计。"]
  },
  {
    id: "app-context-engineering",
    number: "02",
    title: "APP as Context Engineering",
    label: "APP 即上下文工程（结构化更强的上下文）",
    text: "APP 不能只看成一组页面和按钮。用户打开产品时，已经带着身份、权限、偏好、历史动作和当前任务。产品体验好不好，很大程度上取决于这些信息有没有被正确保存、传递和使用。",
    lead: "我说 APP 是上下文工程，是想把产品设计和工程实现放在一起看：前端保存状态，后端传递请求信息，数据层记录行为，AI 功能再使用这些信息理解用户意图。",
    sections: [
      {
        title: "上下文远不止对话文本",
        paragraphs: [
          "在 AI 语境里，上下文经常被理解成 prompt 和多轮对话。但在产品里，它还包括身份、权限、设备、偏好、实时位置、历史操作、未完成任务和消费周期。",
          "一个产品如果每次都让用户重新说明自己是谁、刚才做到了哪一步，就说明上下文没有接住。状态保存、跨端同步、权限传递、推荐反馈，都是这个问题的一部分。"
        ]
      },
      {
        title: "功能要和状态管理一起看",
        paragraphs: [
          "同类 APP 的基础功能往往差不多，差距经常出在上下文处理上。外卖产品需要处理地址、口味、时间和配送状态；导航产品需要处理位置、路况、车型限制和目的地。",
          "常见问题也很具体：跨端不同步、表单状态丢失、权限割裂、重复推荐、把一次搜索误判成长期偏好。这些都不是文案问题，而是状态和数据流设计问题。"
        ]
      },
      {
        title: "编程语言也是上下文工程",
        paragraphs: [
          "上下文工程不应该只限制在自然语言里。编程语言里的作用域、类型、闭包、模块、栈帧、请求链路，也是在管理执行所需的信息边界。",
          "做 AI 功能时，这两部分要能接上：用户侧的对话、文件、偏好和任务状态，要能进入代码侧的权限、数据、工具调用和审计链路。否则 AI 功能会和产品主流程脱节。"
        ]
      }
    ],
    takeaways: ["APP 要保存并传递用户任务状态。", "上下文包括身份、权限、历史动作和当前任务。", "AI 功能要接入产品已有的数据流和权限体系。"]
  },
  {
    id: "build-to-understand",
    number: "03",
    title: "Build to Understand",
    label: "做了产品，不等于懂产品",
    text: "很多时候，功能能做出来，但不一定能讲清楚为什么这么做。这里的差距包括产品目标、业务链路、架构选择、底层机制和替代方案。",
    lead: "我更认可用项目倒逼学习。先把问题做出来，再回头补产品背景、源码机制、架构取舍和复盘记录。这样学到的东西更容易留在自己的体系里。",
    sections: [
      {
        title: "认知差：能做不等于能讲清",
        paragraphs: [
          "常见状态是：需求来了，照着做，功能上线，然后切到下一个任务。代码跑通了，但产品为什么这样设计、业务链路怎么闭合、底层机制有什么限制，并没有沉淀下来。",
          "会用框架不等于懂原理，能完成页面不等于能设计系统，能调用 API 不等于理解能力边界。这个差距需要靠复盘和追问补上。"
        ]
      },
      {
        title: "开发前补上下文，开发中追原理",
        paragraphs: [
          "拿到需求时先问产品上下文：用户痛点是什么，现有方案有什么短板，上下游链路怎么流转，成功指标是什么。没有这些问题，写代码会变成局部执行。",
          "开发过程中再追技术上下文：这段代码解决什么问题，为什么选这个方案，底层运行机制是什么，换一种方案会有什么成本。追问清楚之后，交付才会变成经验。"
        ]
      },
      {
        title: "项目倒逼学习",
        paragraphs: [
          "不是等学完再做，而是在真实项目里遇到不懂的地方，再补源码、补架构、补原理。真实问题会给学习划范围，避免漫无目的地看资料。",
          "Agent 可以帮忙查资料、读源码、跑验证、整理复盘，但判断仍然要自己做：哪些问题值得追，哪些结论需要写进知识库，哪些经验可以变成下一次的模板。"
        ]
      }
    ],
    takeaways: ["交付功能之后，还要能解释清楚。", "用项目倒逼学习，比脱离场景地学更有效。", "复盘是把经验转化为认知资产的关键动作。"]
  },
  {
    id: "process-is-content",
    number: "04",
    title: "Process is Content",
    label: "过程即亮点，过程即文章",
    text: "作品集不能只放最终截图。需求拆解、技术路线、失败回退、关键取舍、验证截图和复盘文章，都能说明一个人怎么做判断。",
    lead: "产品结果要展示，开发过程也要记录。过程记录不是流水账，而是把问题、方案、证据和结论整理出来，方便别人判断你的工程能力，也方便自己以后复用。",
    sections: [
      {
        title: "过程是产品的第二层价值",
        paragraphs: [
          "只展示最终产品，信息量不够。需求如何拆解、为什么选这个技术路线、踩了什么坑、怎么验证、怎么回退，这些内容更能说明判断过程。",
          "对于个人作品集来说，一个功能截图只能说明做出来了；一篇过程复盘能说明你怎么定义问题、怎么调度工具、怎么处理不确定性。"
        ]
      },
      {
        title: "过程如何变成文章",
        paragraphs: [
          "每次产品迭代都可以沉淀四类素材：问题定义、方案对比、执行证据、复盘结论。问题定义说明你看到了什么，方案对比说明你怎么判断，执行证据说明你真的做了，复盘结论说明你学到了什么。",
          "这些内容可以变成技术文章、项目日志、演示脚本、知识库条目和简历材料。它们不需要夸张表达，关键是要有事实、截图、代码和验证结果。"
        ]
      },
      {
        title: "边做边分享边构建知识库",
        paragraphs: [
          "比较适合我的循环是：做产品 -> 实践落地 -> 梳理沉淀 -> 分享输出 -> 搭建知识库 -> 查漏补缺 -> 用到下一轮产品。",
          "这条路径可以避免做完就忘，也能避免只学习不落地。每一次分享都要求把模糊经验讲清楚，每一次知识库沉淀都能减少下一次重复摸索。"
        ]
      }
    ],
    takeaways: ["过程可以传播，也可以转化为职业信用。", "复盘文章要包含问题、方案、证据和结论。", "知识库是产品迭代留下的长期资产。"]
  }
];

const analysisArticles = [
  {
    id: "ai-product-growth",
    number: "01",
    category: "产品分析",
    title: "如何打造一个优质的 AI 产品",
    collectionTitle: "优质 AI 产品分析",
    subtitle: "强需求、极简体验、强分发，比技术复杂度更重要",
    cover: "/article_covers/less-is-more-framework.png",
    summary:
      "这是一个产品分析集合，后续会持续放入 AI 产品、独立开发、增长和分发案例。当前文章讨论如何从真实需求、极简体验、及格发布和渠道宣发出发，做出更容易被用户理解和使用的 AI 产品。",
    thesis:
      "优质 AI 产品不是先堆功能，而是先找到一个用户愿意立刻行动的理由。这个理由可以来自省钱、赚钱、省时间、降低麻烦，也可以来自一个原本没人意识到的垂直场景。",
    flow: [
      ["Need", "找到用户会立刻行动的需求"],
      ["MVP", "用最小路径验证付费或留存"],
      ["Onboarding", "让用户 3 秒内理解价值"],
      ["Distribution", "内容验证后用广告或渠道放大"],
      ["LTV", "把获客变成长期用户资产"]
    ],
    cases: [
      {
        name: "Payout",
        point: "帮用户自动发现并申请集体诉讼赔偿。",
        insight:
          "用户愿意付费，不是因为 AI 技术本身，而是因为潜在收益 88-147 美元显著高于订阅费，并且省掉了查找、判断、申请的麻烦。它把“我可能有钱可以领”这个原本隐藏的需求放到用户眼前。"
      },
      {
        name: "AI 语音笔记",
        point: "录音、转文字、云端同步，极少功能也能做出高收入。",
        insight:
          "用户不是为功能清单付费，而是为按下录音键之后“说完即所得”的流畅体验付费。极简产品的难点不是少做功能，而是敢把非核心路径砍掉，并持续投放验证 ROI。"
      },
      {
        name: "Stagetimer",
        point: "把普通倒计时做进演讲、发布会、直播和培训的专业流程。",
        insight:
          "手机计时器到处都是，但专业活动需要远程同步、精准提醒、悄悄话、流程展示和断网可用。Lucas 先解决自己的活动痛点，再通过免费版、社区反馈、Powered by 水印和 SEO，把一个小工具做成 4400+ 付费用户、月收入 1.5 万美元以上的独立产品。"
      }
    ],
    mobileFigures: [
      {
        src: "/article_covers/ai-product-formula-mobile.png",
        title: "优质 AI 产品公式",
        caption: "小而美、强需求、强分发、极简体验，核心是让用户快速感知价值。"
      },
      {
        src: "/article_covers/ai-product-cases-mobile.png",
        title: "三个简单产品案例",
        caption: "Payout、AI 语音笔记和垂直计时器都说明：简单产品也需要够狠的需求表达。"
      }
    ],
    sections: [
      {
        title: "1. 优质产品通常从一个简单需求开始",
        paragraphs: [
          "很多优质产品并不复杂。它们的共同点是把一个用户已经有、但没有被很好承接的需求做得很直接。Payout 抓的是“可能有钱可以领”，录音转文字抓的是“我不想整理文字”，Stagetimer 抓的是“专业活动不能因为计时失控而影响流程”。",
          "这里的关键不是 AI 有多强，而是用户看到产品后能不能立刻明白：这东西能帮我赚钱、省钱、省时间，或者少做一件麻烦事。"
        ]
      },
      {
        title: "2. 需求也可以被创造",
        paragraphs: [
          "很多时候，用户不是没有需求，而是不知道这个需求可以被产品化。Payout 的价值就在这里：大多数人并不知道自己可能符合某些赔偿申请条件。产品把隐藏信息整理成清晰入口，需求就被激活了。",
          "所以定义需求时不能只问“用户现在说想要什么”，还要问“有什么收益、权益、效率或机会是用户不知道自己可以获得的”。当产品把这个机会放到眼前，需求才会从模糊变成明确。"
        ]
      },
      {
        title: "3. 极简不是简单，而是只保留付费动作",
        paragraphs: [
          "录音转文字 App 的案例说明，极简产品不等于没有设计。它只保留录音、转写、同步三步，但这三步必须顺。用户不为“功能很多”付费，而是为“我刚好需要，而且现在就能完成”付费。",
          "Stagetimer 也是同样逻辑。它早期甚至不需要登录，打开链接就能用。核心不是做一个全能活动管理系统，而是先把远程同步、精准提醒、离线可用这几件事做顺。一个可执行标准是：新用户能不能在 3 秒内理解价值，在 30 秒内完成核心动作，在第一次使用后看到明确结果。"
        ]
      },
      {
        title: "4. 及格发布主义：60 分先出去",
        paragraphs: [
          "less is more and 60 is 100，不是说降低标准，而是说早期目标不是一次做到满分，而是用 60 分的产品和内容去验证 100 分的方向。不要总想着 100 分再发布、100 分再宣传。产品和内容都需要先出去，才知道用户是否看得懂、是否愿意试、是否愿意付费。",
          "这件事要祛魅。社交媒体发布内容不应该有太大心理负担，这次表达不好，下次换标题、换角度、换平台继续发。低质量宣传不是低价值宣传，而是低门槛、低阻力、高频率地把价值说出去。像写论文一样，先及格，再根据反馈继续改。",
          "这和打造优质 AI 产品是一致的：先写一句清楚的价值主张，做一个能跑通核心动作的 MVP，发布到 3 个以上用户聚集的平台，记录点击、咨询、留资、付费和反馈，再迭代表达和功能。没有反馈的完美，价值很难成立。"
        ]
      },
      {
        title: "5. 分发能力决定上限",
        paragraphs: [
          "现在 code is cheap。做出产品只是开始，后面还要解决内容、渠道、广告、转化和复购。Payout 这类产品的路径是内容先行：先让垂直领域博主生产 UGC 验证需求，再把有效内容直接投广告放大。",
          "Stagetimer 的分发路径更适合独立开发者参考：先做免费版，去活动策划群、演讲者论坛、Reddit 的 r/livesound 和 r/publicspeaking 找真实用户反馈；再用 Powered by 水印让每次直播、发布会都变成曝光；最后围绕 stage timer、remote countdown 这类关键词做教程和 SEO，形成长期自然流量。",
          "这和 3E 准则是同一个方向：Easy to See 让用户先看懂，Easy to Use 让用户能快速完成核心动作，Easy to Grace 让体验稳定、顺滑、愿意继续用。很多好农产品卖不出去，不是产品不行，而是缺渠道、缺平台、缺宣发。软件产品也是一样，没有分发，产品很容易停在“能做但没人知道”。"
        ]
      },
      {
        title: "6. 垂直人群要够窄，也要够大",
        paragraphs: [
          "Stagetimer 不是给所有人做计时器，而是给演讲、发布会、直播、培训和活动公司做流程控制。这个人群足够垂直，所以需求明确；但它又覆盖企业年会、高校、培训、直播、发布会，市场并不小。",
          "这类机会通常有三个特征：第一，大公司觉得太小，不会优先做；第二，用户工作流明确，愿意为稳定性和省心付费；第三，产品在使用场景里天然可见，比如水印、链接、模板、导出结果都能带来传播。"
        ]
      },
      {
        title: "7. 本土化不要照搬功能，要迁移场景",
        paragraphs: [
          "Payout 在国内未必能原样复制，但场景可以迁移：补贴查询、退款提醒、消费维权、医保报销、会员扣费提醒、航班延误权益、平台补偿申请，都属于“用户可能有权益，但不知道或嫌麻烦”的场景。Stagetimer 也可以迁移到中文会议、培训机构、直播间、路演、社群分享和企业内训。",
          "技术栈也不必照搬。国内可以用微信生态做冷启动，用公众号、视频号、小程序承接转化，用微信支付替代订阅系统，用国内云服务替代海外基础设施。需求本质不变，入口和合规方式要换。"
        ]
      },
      {
        title: "8. 最容易死在三个地方",
        paragraphs: [
          "第一是把流水当利润。广告投放能快速放大，但如果没有 LTV 计算，产品可能只是替广告平台打工。第二是过早堆功能，核心爽感没有打穿就开始做复杂系统。第三是没有第二曲线，获客之后不知道怎么留存和扩展。",
          "Stagetimer 的反面提醒是：垂直工具不能只停留在免费好用，还要设计付费边界、客户背书和长期入口。否则用户来了也可能只是临时使用一次。我的判断顺序会放成：先验证真实需求，再做最小 MVP，再优化新用户引导，再放大分发，最后才考虑复杂功能和长期生态。"
        ]
      }
    ],
    actions: [
      "先用内容和小规模付费测试验证需求，不要先写完整产品。",
      "把核心路径压到 1-3 个动作，让用户第一次使用就看到结果。",
      "用 60 分 MVP 和 60 分内容先发布，降低宣传心理负担，优先换取真实反馈。",
      "为每个产品建立广告 ROI、转化率、留存率和 LTV 记录。",
      "优先找垂直人群：圈子足够大、痛点明确、大公司暂时看不上，并且产品在使用场景里可见。",
      "产品发布不是结束，要提前设计内容分发、渠道放大和第二增长曲线。"
    ]
  }
];

const avatarWallItems = [
  ["Soft Studio", "avatar-set-01-soft-studio.svg"],
  ["Glasses Office", "avatar-set-02-glasses-office.svg"],
  ["Dark Badge", "avatar-set-03-dark-badge.svg"],
  ["Minimal Line", "avatar-set-04-minimal-line.svg"],
  ["Green Jacket", "avatar-set-05-green-jacket.svg"],
  ["White Shirt", "avatar-set-06-white-shirt.svg"],
  ["Warm Shop", "avatar-set-07-warm-shop.svg"],
  ["Side Angle", "avatar-set-08-side-angle.svg"],
  ["Blue Cap", "avatar-set-09-blue-cap.svg"],
  ["Bucket Hat", "avatar-set-10-yellow-bucket.svg"],
  ["Noir Glasses", "avatar-set-11-noir-glasses.svg"],
  ["Circle Clean", "avatar-set-12-circular-clean.svg"],
  ["ID Photo", "avatar-set-13-id-photo.svg"],
  ["Flat Sticker", "avatar-set-14-flat-sticker.svg"],
  ["Tech Avatar", "avatar-set-15-tech-avatar.svg"],
  ["High Contrast", "avatar-set-16-high-contrast.svg"],
  ["Soft Square", "avatar-set-17-soft-square.svg"],
  ["Pencil Wash", "avatar-set-18-pencil-wash.svg"],
  ["Closeup", "avatar-set-19-cropped-closeup.svg"],
  ["Hero Gradient", "avatar-set-20-hero-gradient.svg"],
  ["Premium Outline", "avatar-outline-premium.svg"],
  ["Profile Card", "avatar-profile-card.svg"],
  ["Realistic Vector", "avatar-realistic-vector.svg"],
  ["App Icon", "avatar-app-icon.svg"]
];

function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const paper = useMemo(() => {
    if (!route.startsWith("/paper/")) return null;
    return papers.find((item) => item.id === route.replace("/paper/", ""));
  }, [route]);

  const thought = useMemo(() => {
    if (!route.startsWith("/thought/")) return null;
    return thoughtArticles.find((item) => item.id === route.replace("/thought/", ""));
  }, [route]);

  const analysisArticle = useMemo(() => {
    if (!route.startsWith("/article/")) return null;
    return analysisArticles.find((item) => item.id === route.replace("/article/", ""));
  }, [route]);

  if (paper) {
    return <PaperDetail paper={paper} />;
  }

  if (thought) {
    return <ThoughtDetail article={thought} />;
  }

  if (analysisArticle) {
    return <ArticleAnalysisDetail article={analysisArticle} />;
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <PersonalSnapshot />
        <AgentProjects />
        <Research />
        <ArticleAnalysis />
        <VibePrinciples />
        <Experience />
        <AvatarWall />
        <Contact />
      </main>
    </>
  );
}

function getRoute() {
  return window.location.hash.replace(/^#/, "") || "/";
}

function navigate(hash) {
  window.location.hash = hash;
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top">Harzva</a>
      <nav>
        <a href="#projects">项目</a>
        <a href="#publications">论文</a>
        <a href="#articles">文章</a>
        <a href="#vibe">AE 思考</a>
        <a href="#contact">联系我</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-copy">
        <p className="eyebrow">AI Agent Infrastructure / Vision-Language Research</p>
        <h1>郝泽华 Harzva</h1>
        <p className="hero-lead">
          计算机科学博士生，研究小样本学习、组合零样本学习与视觉语言模型；同时构建面向 Claude Code 生态的 Agent 工具链和控制平面。
        </p>
        <div className="hero-actions">
          <a className="primary-button" href="#projects">
            <Workflow size={18} />
            Agent 项目
          </a>
          <a className="secondary-button" href="#publications">
            <BookOpen size={18} />
            论文成果
          </a>
          <a className="secondary-button" href="https://harzva.github.io/" target="_blank" rel="noreferrer">
            <ExternalLink size={18} />
            GitHub Pages 预览
          </a>
          <a className="secondary-button" href="https://github.com/Harzva/Harzva.github.io" target="_blank" rel="noreferrer">
            <Github size={18} />
            网站仓库
          </a>
        </div>
        <div className="hero-metrics" aria-label="homepage overview">
          <div>
            <span>06</span>
            <strong>Agent 项目</strong>
            <small>工具链 / 协议 / 技能</small>
          </div>
          <div>
            <span>11</span>
            <strong>论文研究</strong>
            <small>FSL / CZSL / VLM</small>
          </div>
          <div>
            <span>04</span>
            <strong>AE 思考</strong>
            <small>产品 / 过程 / 认知</small>
          </div>
        </div>
      </div>
      <div className="hero-panel">
        <div className="hero-url-pill">harzva.github.io</div>
        <img src="/hero-illustration.png" alt="Harzva portfolio illustration" />
        <div className="hero-portrait-caption">
          <span>Harzva</span>
          <span>Research x Agent Engineering</span>
        </div>
      </div>
    </section>
  );
}

function PersonalSnapshot() {
  const traits = [
    ["喜欢先建框架", "我会尝试把零散经验整理成概念和结构，再用这些结构反过来检查项目。这个过程还在磨合中，需要避免概念先行、落地不足。"],
    ["重视产品落地", "我不只关心技术能不能跑通，也关心它能不能做成作品、文章、项目入口，最后被别人理解和使用。"],
    ["靠输出逼自己学", "我会用复盘、文章和知识库整理过程。这个习惯适合长期积累，也能暴露哪些地方其实还没有想清楚。"],
    ["研究和工程并行", "我现在同时在做论文、源码分析、Agent 工具链和个人作品集。方向是清楚的，但需要控制每条线的投入比例。"]
  ];
  const risks = [
    "我的想法增长很快，容易同时开太多主题。",
    "我的观点需要持续落到可运行页面、代码、案例和文章里。",
    "我需要固定节奏复盘，不然做完一个项目后容易直接切到下一个。"
  ];

  return (
    <section className="section snapshot-section">
      <div className="snapshot-lead">
        <p className="eyebrow">current state</p>
        <h2>个人状态与性格分析</h2>
        <p>
          我目前正在尝试向“研究型产品工程师”靠近：一边做论文和源码分析，一边把 Agent 项目、作品集和文章整理成可展示的个人系统。
        </p>
      </div>
      <div className="snapshot-grid">
        {traits.map(([title, desc]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>
      <div className="snapshot-state">
        <div>
          <h3>当前阶段</h3>
          <p>
            我正在从“能做一些 Agent 项目”继续往前走，希望逐步把项目讲清楚、做完整，并尽量长期维护。下一步不继续增加观点数量，先把 1-2 个观点绑定到具体产品、文章和长期知识库。
          </p>
        </div>
        <div>
          <h3>需要约束的风险</h3>
          <ul>
            {risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AvatarWall() {
  return (
    <section className="section avatar-wall-section">
      <div className="section-head avatar-wall-head">
        <p className="eyebrow">virtual persona</p>
        <h2>动漫小人物展示墙</h2>
        <p>
          我把虚拟形象做成一组不同场景和风格的头像变体，用在作品集、文章封面、项目入口和社交账号中，保持个人识别度。
        </p>
      </div>
      <div className="portrait-gallery">
        <figure>
          <img src="/portrait_assets/ai-realistic-portrait-mole-fuller-face.png" alt="Harzva realistic portrait" />
          <figcaption>
            <span>Realistic Portrait</span>
            <span>更接近真人照片的个人形象，适合正式介绍和身份页。</span>
          </figcaption>
        </figure>
        <figure>
          <img src="/portrait_assets/ai-virtual-portrait.png" alt="Harzva clean virtual portrait" />
          <figcaption>
            <span>Clean Virtual Portrait</span>
            <span>偏正式的虚拟头像，可用于项目入口、论文页和社交资料。</span>
          </figcaption>
        </figure>
        <figure>
          <img src="/portrait_assets/anime-life-portrait.png" alt="Harzva anime selfie portrait" />
          <figcaption>
            <span>Anime Life Portrait</span>
            <span>更生活化的动漫自拍形象，适合文章、随笔和轻量展示。</span>
          </figcaption>
        </figure>
      </div>
      <div className="avatar-wall">
        {avatarWallItems.map(([label, file]) => (
          <article className="avatar-tile" key={file}>
            <img src={`/portrait_assets/${file}`} alt={`Harzva avatar ${label}`} loading="lazy" />
            <span>{label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AgentProjects() {
  return (
    <section id="projects" className="section dark-section">
      <div className="section-head">
        <p className="eyebrow">Agent Stack</p>
        <h2>我的 Agent 项目</h2>
        <p>{'覆盖「学习层 -> 工具层 -> 协议层 -> 技能层 -> 适配层」的五层架构。'}</p>
      </div>
      <div className="project-list">
        {projects.map((project) => (
          <article className="project-row" key={project.id}>
            <div className="project-media">
              <img src={project.image} alt={project.name} />
              <div className="project-stat">
                <Star size={16} />
                <span>{project.stats}</span>
              </div>
            </div>
            <div className="project-copy">
              <span className="number">{project.id}</span>
              <h3>{project.name}</h3>
              <p className="muted">{project.tagline}</p>
              <p>{project.description}</p>
              <div className="tags">
                {project.topics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
              <a className="text-link light" href={project.url} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                访问项目
                <ArrowRight size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Research() {
  return (
    <section id="publications" className="section">
      <div className="section-head">
        <p className="eyebrow">Publications</p>
        <h2>论文与研究</h2>
        <p>11 篇学术论文，覆盖 Few-Shot Learning、Zero-Shot Learning、Vision-Language Models 与 AI Agent Infrastructure。</p>
      </div>
      <div className="paper-grid">
        {papers.map((paper) => (
          <article className="paper-card" key={paper.id}>
            <button className="paper-image" onClick={() => navigate(`/paper/${paper.id}`)}>
              <img src={paper.cover} alt={paper.titleCn} />
            </button>
            <div className="paper-body">
              <div className="paper-meta">
                <span>{paper.venue}</span>
                <span>{paper.year}</span>
                <span>{paper.tier}</span>
              </div>
              <h3>{paper.titleCn}</h3>
              <p>{paper.title}</p>
              <div className="tags compact">
                {paper.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button className="text-link" onClick={() => navigate(`/paper/${paper.id}`)}>
                查看详情
                <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArticleAnalysis() {
  const article = analysisArticles[0];

  return (
    <section id="articles" className="section article-analysis-section">
      <div className="section-head">
        <p className="eyebrow">article analysis</p>
        <h2>文章专题</h2>
        <p>记录 AI 产品与独立开发案例，关注需求、体验、分发和商业化路径。</p>
      </div>
      <article className="analysis-feature-card" onClick={() => navigate(`/article/${article.id}`)}>
        <div className="analysis-feature-image">
          <img src={article.cover} alt={`${article.title} 配图`} />
        </div>
        <div className="analysis-feature-copy">
          <div className="card-meta">
            <span>COLLECTION {article.number}</span>
            <span>{article.category}</span>
          </div>
          <h3>{article.collectionTitle}</h3>
          <p className="muted">当前文章：{article.title}</p>
          <p>{article.summary}</p>
          <div className="collection-count">
            <span>1 篇文章</span>
            <span>持续更新</span>
          </div>
          <div className="analysis-chip-row">
            {article.flow.map(([label]) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <button className="text-link thought-link" onClick={(event) => {
            event.stopPropagation();
            navigate(`/article/${article.id}`);
          }}>
            阅读分析
            <ArrowRight size={16} />
          </button>
        </div>
      </article>
    </section>
  );
}

function VibePrinciples() {
  const contextLayers = [
    ["静态信息", "身份、权限、偏好、设备、账号体系，决定用户能做什么、默认看到什么。"],
    ["当前场景", "时间、地点、环境、实时状态、当前任务，决定产品此刻应该给什么反馈。"],
    ["行为链路", "历史操作、决策轨迹、未完成动作、需求周期，决定产品能不能接住连续任务。"],
    ["隐性需求", "没有直接说出口的目标、习惯、阈值和痛点，决定产品能不能少让用户重复说明。"]
  ];

  const languageLayers = [
    ["自然语言", "对话历史、上传文件、角色设定、用户偏好，影响模型如何理解任务。"],
    ["编程语言", "作用域、类型、闭包、模块、栈帧、请求链路，决定程序如何执行。"],
    ["产品行为", "页面状态、表单草稿、跨端同步、推荐反馈、权限边界，决定用户任务能否连续。"]
  ];

  const learningLoop = [
    ["补上下文", "开发前先搞清产品目标、用户痛点、上下游链路和行业主流解法。"],
    ["边做边溯源", "开发中追问三层：代码做了什么、为什么这么做、底层机制是什么。"],
    ["复盘成文章", "开发后沉淀方案亮点、不足、踩坑、替代方案和验证结果。"],
    ["知识库反哺", "把项目过程变成长期素材库，再反过来提升下一轮产品设计和工程判断。"]
  ];

  const threeEPrinciples = [
    ["Easy to See", "第一眼就能看懂。信息层级清晰，价值表达直接，用户不用猜这个产品解决什么问题。"],
    ["Easy to Use", "上手路径足够短。核心动作清楚，交互反馈及时，用户能顺利完成第一次使用。"],
    ["Easy to Grace", "用起来顺滑、稳定、有余地。状态切换自然，异常处理不打断，体验让用户愿意继续使用。"]
  ];

  const valueEnds = [
    ["前端：发现力", "场景洞察、市场调研、痛点挖掘和赛道选择。选对问题，比单纯更快地写代码更重要。"],
    ["后端：放大器", "产品包装、价值传递、宣发引流和商业化落地。让产品被看见、被使用、被传播，决定产品能走多远。"]
  ];

  return (
    <section id="vibe" className="section vibe-section">
      <div className="section-head">
        <p className="eyebrow">agentic engineering 思考</p>
        <h2>从 token 到产品，从过程到认知</h2>
        <p>这里记录我对 Agent 开发的几个判断：一次调用要尽量留下产品结果，开发过程要能复盘，观点最终要回到可运行的项目里。</p>
      </div>

      <div className="thought-grid">
        {thoughtArticles.map((item) => (
          <article className="thought-card thought-card-clickable" key={item.title} onClick={() => navigate(`/thought/${item.id}`)}>
            <div className="card-meta">
              <span>{item.number}</span>
              <span>AE</span>
            </div>
            <h3>{item.title}</h3>
            <p className="muted">{item.label}</p>
            <p>{item.text}</p>
            <button className="text-link thought-link" onClick={(event) => {
              event.stopPropagation();
              navigate(`/thought/${item.id}`);
            }}>
              阅读文章
              <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>

      <div className="conversion-strip">
        {["token", "product", "attention", "dollar"].map((step, index) => (
          <div className="conversion-step" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <div className="context-essay">
        <div>
          <p className="eyebrow">core thesis</p>
          <h3>APP 即上下文工程（结构化更强的上下文）</h3>
          <p>
            我把 APP 理解成上下文工程，是因为产品需要同时提供功能、保存状态、传递权限和记录用户任务。用户是谁、有什么权限、刚才做了什么、当前任务到哪一步，都会影响下一次交互。
          </p>
          <p>
            这个问题不只出现在 AI 对话里。外卖要处理地址、口味和配送状态，导航要处理位置、路况和目的地，电商要处理搜索、浏览、购买和售后。体验差的时候，往往是这些状态断了或被误用。
          </p>
        </div>
        <div className="context-list">
          {contextLayers.map(([title, desc]) => (
            <article key={title}>
              <h4>{title}</h4>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="section-head subhead">
        <p className="eyebrow">technical details</p>
        <h2>上下文不只属于自然语言</h2>
        <p>上下文不只存在于 prompt。代码里的作用域、类型、模块、请求链路，产品里的页面状态、权限和历史行为，也都在解决“当前这一步应该怎么执行”的问题。</p>
      </div>

      <div className="language-grid">
        {languageLayers.map(([title, desc], index) => (
          <article key={title}>
            <div className="value-icon">{index === 0 ? <Search /> : index === 1 ? <Code2 /> : <Workflow />}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>

      <div className="three-e-panel">
        <div>
          <p className="eyebrow">3E principle</p>
          <h3>3E：Easy to See / Use / Grace</h3>
          <p>
            老版本的三E准则是从“看见、使用、优雅体验”三层看产品。现在依然适用：用户先要看懂，再要能用，最后才会因为顺滑、稳定和细节愿意留下。
          </p>
        </div>
        <div className="three-e-list">
          {threeEPrinciples.map(([title, desc]) => (
            <article key={title}>
              <h4>{title}</h4>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="value-ends-panel">
        <div>
          <p className="eyebrow">two-sided value</p>
          <h3>两端价值理论</h3>
          <p>
            不是执行力不重要，而是 coding 技术不再是主要护城河。执行力仍然重要，但执行对象要从“只写代码”扩展到发现问题、设计体验、验证需求和放大分发。
          </p>
        </div>
        <div className="value-ends-grid">
          {valueEnds.map(([title, desc]) => (
            <article key={title}>
              <h4>{title}</h4>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="learning-loop">
        <div>
          <p className="eyebrow">learning loop</p>
          <h3>边做产品，边构建知识库</h3>
          <p>
            做出功能之后，还要能讲清楚为什么这样做、哪里踩坑、怎么验证、下次怎么复用。这个复盘过程会把项目经验变成自己的知识库。
          </p>
        </div>
        <div className="loop-steps">
          {learningLoop.map(([title, desc], index) => (
            <article key={title}>
              <span>{index + 1}</span>
              <div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="quote-box dark">过程也值得展示。需求拆解、技术路线、失败回退、验证截图和复盘结论，都能说明一个项目是怎么做出来的。</div>
    </section>
  );
}

function Experience() {
  return (
    <section className="section dark-section compact-section">
      <div className="section-head">
        <p className="eyebrow">Profile</p>
        <h2>研究与工程双线</h2>
      </div>
      <div className="timeline">
        <div>
          <span>2021 - 至今</span>
          <h3>西安电子科技大学 · 计算机科学博士生</h3>
          <p>研究小样本学习、组合零样本学习、视觉语言模型与多模态智能。</p>
        </div>
        <div>
          <span>2025 - 至今</span>
          <h3>AI Agent 开发者</h3>
          <p>围绕 Claude Code、MCP、多智能体控制平面和技能模块构建开源工具链。</p>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section contact-section">
      <div>
        <p className="eyebrow">Contact</p>
        <h2>联系我</h2>
        <p>欢迎围绕 AI Agent 基础设施、视觉语言模型、学术合作和开源项目交流。</p>
      </div>
      <div className="contact-actions">
        <a className="primary-button" href="https://github.com/Harzva" target="_blank" rel="noreferrer">
          <Github size={18} />
          GitHub
        </a>
        <a className="secondary-button" href="mailto:626609967@qq.com">
          <Mail size={18} />
          Email
        </a>
      </div>
    </section>
  );
}

function ThoughtDetail({ article }) {
  return (
    <main className="thought-detail">
      <button className="back-button" onClick={() => navigate("/")}>
        <ArrowLeft size={18} />
        返回作品集
      </button>
      <section className="thought-hero">
        <p className="eyebrow">agentic engineering / essay {article.number}</p>
        <h1>{article.title}</h1>
        <p className="thought-subtitle">{article.label}</p>
        <p>{article.lead}</p>
        {article.cover && (
          <figure className="thought-cover">
            <img src={article.cover} alt={`${article.title} 配图`} />
          </figure>
        )}
      </section>

      <section className="thought-body">
        {article.sections.map((section, index) => (
          <article className="thought-section" key={section.title}>
            <div className="thought-section-index">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="detail-section">
        <h2>提炼成方法</h2>
        <div className="thought-takeaways">
          {article.takeaways.map((item, index) => (
            <article key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ArticleAnalysisDetail({ article }) {
  return (
    <main className="thought-detail article-detail">
      <button className="back-button" onClick={() => navigate("/")}>
        <ArrowLeft size={18} />
        返回作品集
      </button>
      <section className="thought-hero article-hero">
        <p className="eyebrow">{article.category} / case study {article.number}</p>
        <h1>{article.title}</h1>
        <p className="thought-subtitle">{article.subtitle}</p>
        <p>{article.thesis}</p>
        <figure className="thought-cover article-cover">
          <img src={article.cover} alt={`${article.title} 配图`} />
        </figure>
      </section>

      <section className="article-flow">
        {article.flow.map(([label, desc], index) => (
          <article key={label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{label}</h2>
            <p>{desc}</p>
          </article>
        ))}
      </section>

      <section className="article-case-grid">
        {article.cases.map((item) => (
          <article key={item.name}>
            <p className="eyebrow">case</p>
            <h2>{item.name}</h2>
            <p className="case-point">{item.point}</p>
            <p>{item.insight}</p>
          </article>
        ))}
      </section>

      <section className="detail-section mobile-figure-section">
        <h2>案例图解</h2>
        <div className="mobile-figure-row">
          {article.mobileFigures.map((figure) => (
            <figure key={figure.src}>
              <img src={figure.src} alt={figure.title} />
              <figcaption>
                <span>{figure.title}</span>
                <span>{figure.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="thought-body article-body">
        {article.sections.map((section, index) => (
          <article className="thought-section" key={section.title}>
            <div className="thought-section-index">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="detail-section">
        <h2>未来行动指南</h2>
        <div className="thought-takeaways">
          {article.actions.map((item, index) => (
            <article key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function PaperDetail({ paper }) {
  const analysis = detailAnalysis[paper.id];
  const renderParagraphs = (items, fallback) => (items || [fallback]).map((item) => <p key={item}>{item}</p>);

  return (
    <main className="paper-detail">
      <button className="back-button" onClick={() => navigate("/")}>
        <ArrowLeft size={18} />
        返回作品集
      </button>
      <section className="paper-hero">
        <div>
          <p className="eyebrow">{paper.venue} · {paper.year} · {paper.role}</p>
          <h1>{paper.titleCn}</h1>
          <p>{paper.title}</p>
          <div className="tags">
            {paper.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <img src={paper.cover} alt={paper.titleCn} />
      </section>
      <section className="detail-section">
        <h2>论文概览</h2>
        <p>{paper.summary}</p>
      </section>
      <section className="analysis-grid">
        <article>
          <div className="analysis-icon">
            <Search size={22} />
          </div>
          <h2>动机与问题分析</h2>
          <div className="analysis-copy">{renderParagraphs(analysis?.motivation, paper.motivation)}</div>
        </article>
        <article>
          <div className="analysis-icon">
            <Workflow size={22} />
          </div>
          <h2>方法详解</h2>
          <div className="analysis-copy">{renderParagraphs(analysis?.method, paper.method)}</div>
        </article>
        <article>
          <div className="analysis-icon">
            <Sparkles size={22} />
          </div>
          <h2>实验分析</h2>
          <div className="analysis-copy">{renderParagraphs(analysis?.experiments, paper.experiments)}</div>
        </article>
      </section>
      <section className="detail-section">
        <h2>核心贡献</h2>
        <div className="highlight-list">
          {paper.highlights.map((item, index) => (
            <div key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="detail-section">
        <h2>如何阅读这篇论文</h2>
        <div className="reading-notes">
          <p>
            如果快速阅读，建议先看首页摘要和方法框架图，再读动机图，最后看实验主表和消融表。这样能先建立问题意识，再判断方法是否真的解决了问题。
          </p>
          <p>
            如果深入复现，建议重点关注输入输出定义、核心模块的训练目标、消融设置和失败案例。论文中的图表不只是展示结果，也能帮助判断哪些模块是必要的，哪些只是辅助增强。
          </p>
          <p>
            对作品集展示来说，这篇论文最适合呈现三点：它解决了什么具体研究痛点，方法结构有什么可解释性，实验是否形成从主结果到消融再到可视化的闭环证据。
          </p>
        </div>
      </section>
      <section className="detail-section">
        <h2>关键图表</h2>
        <div className="figure-grid">
          {paper.figures.map((figure, index) => (
            <figure key={figure}>
              <img src={figure} alt={`${paper.titleCn} figure`} />
              <figcaption>
                {index === 0 ? "方法框架 / 主图" : index === 1 ? "动机或模块细节" : "实验结果 / 消融分析"}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
