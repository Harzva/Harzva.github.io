(function(root){
  'use strict';

  var current=null, sequence=0;
  var FALLBACK_AVATARS=['orbit','sprout','pebble','wink','luma','nook','peek'];

  function tr(zh,en){return root.OpenBotI18n&&typeof root.OpenBotI18n.t==='function'?root.OpenBotI18n.t(zh,en):zh;}
  function node(tag,className,content){
    var el=root.document.createElement(tag);
    if(className)el.className=className;
    if(content!==undefined&&content!==null)el.textContent=String(content);
    return el;
  }
  function valueText(value,fallback){
    if(value===undefined||value===null||value==='')return fallback||'';
    if(typeof value==='object')return String(value.message||value.reason||value.name||'');
    return String(value);
  }
  function displayHostMessage(value){
    var raw=valueText(value,'');
    if(raw.indexOf('当前空间会话只支持 API BOT')===0)return tr('当前空间会话只支持 API BOT；Codex 配置会保留，可在独立 BOT 对话中连接使用。','Space conversations support API BOTs only. Codex configuration is preserved and can be used after connecting it in a standalone BOT conversation.');
    if(raw.indexOf('当前空间会话不支持原生智能体')===0)return tr('当前空间会话不支持原生智能体；请从对应 BOT 的智能体设置连接后，在独立 BOT 对话中使用。','Space conversations do not support native agents. Connect the agent in its BOT settings, then use it in a standalone BOT conversation.');
    if(raw.indexOf('当前空间会话尚未接通远端节点 BOT')===0)return tr('当前空间会话尚未接通远端节点 BOT。','Remote-node BOTs are not yet connected to space conversations.');
    return raw;
  }
  function array(value){return Array.isArray(value)?value:[];}
  function countLabel(value,zh,en){
    if(value===undefined||value===null||value==='')return tr('未知','Unknown');
    return Number.isFinite(Number(value))?String(Number(value))+tr(zh,en):tr('未知','Unknown');
  }
  function makeButton(label,className,action){
    var button=node('button',className||'',label);button.type='button';
    if(typeof action==='function')button.addEventListener('click',action);
    return button;
  }
  function appendTextList(parent,items,className){
    var rows=array(items).map(function(item){return valueText(item,'');}).filter(Boolean);
    if(!rows.length)return;
    var list=node('ul',className||'ob-wp-list');
    rows.forEach(function(text){list.appendChild(node('li','',text));});
    parent.appendChild(list);
  }
  function briefText(value){
    if(value===undefined||value===null||value==='')return '';
    if(typeof value==='string'||typeof value==='number')return String(value);
    if(typeof value==='boolean')return value?tr('是','Yes'):tr('否','No');
    if(Array.isArray(value))return value.map(briefText).filter(Boolean).join(' · ');
    if(typeof value==='object'){
      var text=valueText(value,'');
      if(text)return text;
      try{return JSON.stringify(value);}catch(_error){return '';}
    }
    return String(value);
  }
  function briefFact(parent,label,value,fallback){
    var row=node('div','ob-wp-brief-fact');
    row.append(node('span','ob-wp-meta-label',label),node('p','ob-wp-brief-value',briefText(value)||fallback||tr('预览未列出','Not listed in preview')));
    parent.appendChild(row);return row;
  }
  function workflowStepTitle(step,index){
    return valueText(step&&step.workflowName,'')||valueText(step&&step.workflowId,'')||valueText(step&&step.action,'')||tr('步骤 '+(index+1),'Step '+(index+1));
  }
  function sourceReferenceText(reference){
    if(typeof reference==='string'||typeof reference==='number')return String(reference);
    if(!reference||typeof reference!=='object')return '';
    var label=valueText(reference.title||reference.name||reference.label||reference.path||reference.uri||reference.ref||reference.id,'');
    var kind=valueText(reference.kind||reference.type,'');
    return label?(kind?label+' · '+kind:label):briefText(reference);
  }
  function approvalText(value){
    if(value===true)return tr('需要人工确认','Human confirmation required');
    if(value===false)return tr('未标记人工确认；仍以实际权限与宿主审批为准','No human gate is marked; actual permissions and host approvals still apply');
    if(value&&typeof value==='object'){
      var detail=valueText(value.description||value.detail||value.label||value.summary||value.message||value.reason||value.name,'');
      if(value.required===true)return tr('需要人工确认','Human confirmation required')+(detail?' · '+detail:'');
      if(value.required===false)return tr('未标记人工确认；仍以实际权限与宿主审批为准','No human gate is marked; actual permissions and host approvals still apply')+(detail?' · '+detail:'');
    }
    return briefText(value);
  }
  function benchmarkPlanFrom(value){
    if(!value||typeof value!=='object')return null;
    if(value.benchmarkPlan&&typeof value.benchmarkPlan==='object')return value.benchmarkPlan;
    if(value.benchmark&&typeof value.benchmark==='object')return value.benchmark;
    if(value.draft&&value.draft.benchmarkPlan&&typeof value.draft.benchmarkPlan==='object')return value.draft.benchmarkPlan;
    return null;
  }
  function benchmarkState(value){
    var states={
      'draft':tr('草案','Draft'),
      'needs-subject-confirmation':tr('待本人确认','Needs personal confirmation'),
      'not-run':tr('未运行','Not run'),
      'pending':tr('待确认','Pending confirmation'),
      'proposed':tr('拟定','Proposed'),
      'needs-baseline':tr('待建立基线','Baseline needed'),
      'not-selected':tr('未选择样本','Sample not selected'),
      'unreviewed':tr('未审阅','Unreviewed')
    };
    return states[String(value||'')]||briefText(value);
  }
  function benchmarkFieldLabel(value){
    var labels={
      'schemaVersion':tr('方案版本','Plan version'),
      'scope':tr('范围','Scope'),
      'subject':tr('对象','Subject'),
      'profileDigest':tr('档案摘要','Profile digest'),
      'ruleVersion':tr('规则版本','Rule version'),
      'status':tr('状态','Status'),
      'reviewerRole':tr('审核角色','Reviewer role'),
      'requiredArtifacts':tr('要求的验收材料','Required acceptance artifacts'),
      'artifacts':tr('材料','Artifacts'),
      'requiresHumanReview':tr('必须人工审阅','Human review required'),
      'missingEvidence':tr('缺失证据时','When evidence is missing'),
      'noImplicitExecution':tr('不自动执行','No implicit execution'),
      'frozenInputs':tr('冻结输入','Frozen inputs'),
      'inputVersion':tr('输入版本','Input version'),
      'outputEvidence':tr('输出证据','Output evidence'),
      'reviewer':tr('审阅人','Reviewer'),
      'reviewerVersion':tr('审阅人版本','Reviewer version'),
      'policyVersion':tr('策略版本','Policy version'),
      'resultVersion':tr('结果版本','Result version'),
      'taskVersion':tr('任务版本','Task version'),
      'approvalVersion':tr('审批版本','Approval version'),
      'version':tr('版本','Version'),
      'required':tr('必填','Required'),
      'name':tr('名称','Name'),
      'label':tr('字段','Field'),
      'description':tr('说明','Description'),
      'sourceRefs':tr('提案依据（不是文件授权）','Proposal references (not file access)')
    };
    return labels[String(value)]||String(value);
  }
  function appendBenchmarkValue(parent,value){
    if(value===undefined||value===null||value==='')return false;
    if(Array.isArray(value)){
      if(!value.length)return false;
      var list=node('ul','ob-wp-benchmark-data-list');
      value.forEach(function(item){
        var row=node('li','');
        if(item&&typeof item==='object'&&!Array.isArray(item)){
          Object.keys(item).forEach(function(key){
            var field=node('div','ob-wp-benchmark-data-field');
            field.appendChild(node('strong','',benchmarkFieldLabel(key)));
            appendBenchmarkValue(field,item[key]);row.appendChild(field);
          });
        }else appendBenchmarkValue(row,item);
        if(row.childNodes.length)list.appendChild(row);
      });
      if(!list.childElementCount)return false;
      parent.appendChild(list);return true;
    }
    if(typeof value==='object'){
      var fields=node('dl','ob-wp-benchmark-data');
      Object.keys(value).forEach(function(key){
        var field=value[key];if(field===undefined||field===null||field==='')return;
        fields.append(node('dt','',benchmarkFieldLabel(key)));
        var dd=node('dd',''),displayValue=field;
        if(key==='missingEvidence'&&field==='not-evaluated')displayValue=tr('不作评价','Not evaluated');
        else if(typeof field==='boolean')displayValue=field?tr('是','Yes'):tr('否','No');
        appendBenchmarkValue(dd,displayValue);fields.appendChild(dd);
      });
      if(!fields.childElementCount)return false;
      parent.appendChild(fields);return true;
    }
    parent.appendChild(node('span','',briefText(value)));return true;
  }
  function appendBenchmarkReferences(parent,references){
    var labels=array(references).map(sourceReferenceText).filter(Boolean);
    if(!labels.length)return;
    var details=node('details','ob-wp-benchmark-provenance');details.appendChild(node('summary','',tr('查看提案依据（不是文件授权）','View proposal references (not file access)')));
    var list=node('ul','ob-wp-benchmark-source-list');labels.forEach(function(label){list.appendChild(node('li','',label));});details.appendChild(list);parent.appendChild(details);
  }
  function benchmarkRecordField(value){
    var labels={
      input:tr('输入','Input'),inputs:tr('输入','Inputs'),inputVersion:tr('输入版本','Input version'),frozenInputs:tr('冻结输入','Frozen inputs'),
      inputDigests:tr('输入摘要','Input digests'),holdoutRefs:tr('留出样本引用','Holdout references'),sampleSelectionRules:tr('样本选择规则','Sample selection rules'),
      sampleAuthorization:tr('样本授权','Sample authorization'),sampleFreeze:tr('样本冻结','Sample freeze'),sampleScenarioMapping:tr('样本场景映射','Sample-to-scenario mapping'),configuration:tr('执行配置','Execution configuration'),
      harnessVersion:tr('Harness 版本','Harness version'),modelVersion:tr('模型版本','Model version'),ruleVersion:tr('规则版本','Rule version'),
      output:tr('产物','Artifact'),outputs:tr('产物','Artifacts'),outputEvidence:tr('产物证据','Output evidence'),resultEvidence:tr('结果证据','Result evidence'),evidence:tr('证据','Evidence'),
      reviewer:tr('审阅人','Reviewer'),reviewerVersion:tr('审阅人版本','Reviewer version'),reviewedAt:tr('审阅时间','Reviewed at'),approvalActor:tr('审批人','Approval actor'),
      approvalObject:tr('审批对象','Approval object'),approvalScope:tr('审批范围','Approval scope'),approvalTime:tr('审批时间','Approval time'),approvalDecision:tr('审批结论','Approval decision'),
      taskVersion:tr('任务版本','Task version'),resultVersion:tr('结果版本','Result version'),policyVersion:tr('策略版本','Policy version'),approvalVersion:tr('审批版本','Approval version'),
      executionTimeline:tr('执行时间线','Execution timeline'),blockedActionEvidence:tr('阻断动作证据','Blocked-action evidence'),comparisonProtocol:tr('对比方案','Comparison protocol'),
      measurementProtocol:tr('测量方案','Measurement protocol'),failureClassification:tr('失败分类','Failure classification'),adoptionDecision:tr('采用决策','Adoption decision'),
      elapsedTime:tr('耗时','Elapsed time'),reworkCount:tr('返工次数','Rework count'),status:tr('状态','Status'),timestamp:tr('记录时间','Recorded at')
    };
    var key=String(value||'');
    return labels[key]||key.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/^./,function(letter){return letter.toUpperCase();});
  }
  function appendBenchmarkRecordFields(parent,fields){
    var values=array(fields);if(!values.length)return false;
    var list=node('ul','ob-wp-benchmark-record-fields');
    values.forEach(function(field){var label=benchmarkRecordField(field);if(label)list.appendChild(node('li','',label));});
    if(!list.childElementCount)return false;
    parent.appendChild(list);return true;
  }
  function benchmarkMetricText(metric){
    var unit=metric.unit?tr(' '+briefText(metric.unit),' '+briefText(metric.unit)):'';
    var baseline=metric.baseline===undefined||metric.baseline===null?tr('待建立','Needs baseline'):briefText(metric.baseline)+unit;
    var target=metric.target===undefined||metric.target===null?tr('未设置','Not set'):briefText(metric.target)+unit;
    var status=metric.status?benchmarkState(metric.status):'';
    return tr('基线：','Baseline: ')+baseline+tr(' · 目标：',' · Target: ')+target+(status?' · '+status:'');
  }
  function appendBenchmarkCase(parent,benchmarkCase,index,habits,options){
    if(!benchmarkCase||typeof benchmarkCase!=='object')return;
    options=options||{};
    var item=node('li','ob-wp-benchmark-case');
    var details=node('details','ob-wp-benchmark-case-details');
    var summary=node('summary','');
    summary.append(node('strong','',valueText(benchmarkCase.title,tr('未命名验收用例','Untitled acceptance case'))),node('span','ob-wp-benchmark-case-state',benchmarkState(benchmarkCase.status||'not-run')));
    details.appendChild(summary);
    if(benchmarkCase.scenarioKind)details.appendChild(node('p','ob-wp-benchmark-meta',tr('场景：','Scenario: ')+(benchmarkCase.scenarioKind==='workflow'?tr('工作流','Workflow'):benchmarkCase.scenarioKind==='role-first-result'?tr('角色首个结果','Role first result'):briefText(benchmarkCase.scenarioKind))));
    if(benchmarkCase.scenarioKind==='workflow'&&options.showWorkflowScopeNote!==false)details.appendChild(node('p','ob-wp-benchmark-note',tr('这是完整流程级验收标准；本 BOT 的分工见上方工作流步骤，不表示此 BOT 独自负责全部步骤。','These are acceptance criteria for the full workflow. This BOT’s assigned work is in the workflow steps above; the BOT is not individually responsible for every step.')));
    if(benchmarkCase.workflowName||benchmarkCase.workflowId)details.appendChild(node('p','ob-wp-benchmark-meta',tr('关联流程：','Workflow: ')+(benchmarkCase.workflowName||benchmarkCase.workflowId)));
    if(benchmarkCase.task)details.appendChild(node('p','ob-wp-benchmark-task',briefText(benchmarkCase.task)));
    var habitRefs=array(benchmarkCase.habitRefs),linkedHabits=habitRefs.map(function(id){return array(habits).find(function(habit){return habit&&String(habit.id)===String(id);});}).filter(Boolean);
    if(habitRefs.length){
      var habitSection=node('section','ob-wp-benchmark-case-section');habitSection.appendChild(node('h6','',tr('关联习惯提案（待本人确认）','Related habit proposals (awaiting personal confirmation)')));
      if(linkedHabits.length){
        var linkedList=node('ul','ob-wp-benchmark-data-list');linkedHabits.forEach(function(habit){linkedList.appendChild(node('li','',valueText(habit.name||habit.id,tr('未命名习惯提案','Untitled habit proposal'))+' · '+benchmarkState(habit.status||'needs-subject-confirmation')));});habitSection.appendChild(linkedList);
      }else habitSection.appendChild(node('p','ob-wp-benchmark-meta',tr('本提案未匹配到已列出的习惯条目；引用：','No listed habit matched these references: ')+habitRefs.join(' · ')));
      details.appendChild(habitSection);
    }
    function addCaseList(label,items){
      var texts=array(items).map(briefText).filter(Boolean);if(!texts.length)return;
      var section=node('section','ob-wp-benchmark-case-section');section.appendChild(node('h6','',label));
      var list=node('ul','ob-wp-benchmark-data-list');texts.forEach(function(text){list.appendChild(node('li','',text));});section.appendChild(list);details.appendChild(section);
    }
    addCaseList(tr('需要输入','Required inputs'),benchmarkCase.inputs);
    addCaseList(tr('预期输出','Expected outputs'),benchmarkCase.expectedOutputs);
    var criteria=array(benchmarkCase.criteria);
    if(criteria.length){
      var criteriaSection=node('section','ob-wp-benchmark-case-section');criteriaSection.appendChild(node('h6','',tr('拟定验收标准','Proposed acceptance criteria')));
      var criteriaList=node('ul','ob-wp-benchmark-data-list');
      criteria.forEach(function(criterion){
        if(!criterion||typeof criterion!=='object')return;
        var row=node('li','');row.appendChild(node('strong','',valueText(criterion.label||criterion.id,tr('未命名标准','Unnamed criterion'))));
        if(criterion.check)row.appendChild(node('p','',briefText(criterion.check)));
        if(criterion.status)row.appendChild(node('p','ob-wp-benchmark-meta',tr('状态：','Status: ')+benchmarkState(criterion.status)));
        var evidence=array(criterion.evidence).map(briefText).filter(Boolean);
        if(evidence.length){var evidenceLabel=node('p','ob-wp-benchmark-meta',tr('所需证据：','Evidence to collect: ')+evidence.join(' · '));row.appendChild(evidenceLabel);}
        appendBenchmarkReferences(row,criterion.sourceRefs);
        criteriaList.appendChild(row);
      });
      if(criteriaList.childElementCount)criteriaSection.appendChild(criteriaList);details.appendChild(criteriaSection);
    }
    addCaseList(tr('人工检查点','Human checkpoints'),benchmarkCase.humanGates);
    var metrics=array(benchmarkCase.metrics);
    if(metrics.length){
      var metricSection=node('section','ob-wp-benchmark-case-section');metricSection.appendChild(node('h6','',tr('待基线指标','Metrics awaiting a baseline')));
      var metricList=node('ul','ob-wp-benchmark-data-list');metrics.forEach(function(metric){if(metric&&typeof metric==='object')metricList.appendChild(node('li','',valueText(metric.label||metric.id,tr('未命名指标','Unnamed metric'))+' · '+benchmarkMetricText(metric)));});
      metricSection.appendChild(metricList);details.appendChild(metricSection);
    }
    var sample=benchmarkCase.sample&&typeof benchmarkCase.sample==='object'?benchmarkCase.sample:{};
    var sampleRefs=array(sample.inputRefs).length+array(sample.holdoutRefs).length;
    details.appendChild(node('p','ob-wp-benchmark-meta',tr('样本：','Sample: ')+benchmarkState(sample.status||'not-selected')+(sampleRefs?tr(' · 已列出 ',' · ')+sampleRefs+tr(' 个引用',' reference(s)'):tr(' · 尚未选择输入或留出样本',' · Input and holdout samples are not selected'))));
    if(benchmarkCase.approval!==undefined)details.appendChild(node('p','ob-wp-benchmark-meta',tr('审批：','Approval: ')+benchmarkState(benchmarkCase.approval)));
    appendBenchmarkReferences(details,benchmarkCase.sourceRefs);
    item.appendChild(details);parent.appendChild(item);
  }
  function appendBenchmarkPlan(parent,plan,options){
    if(!plan||typeof plan!=='object')return null;
    options=options||{};
    var cases=array(plan.cases),habits=array(plan.habits),metrics=cases.reduce(function(count,item){return count+array(item&&item.metrics).length;},0);
    var panel=node('section','ob-wp-benchmark');
    panel.appendChild(node('h4','',options.title||tr('个人 Benchmark','Personal Benchmark')));
    var scope=plan.scope==='personal'?tr('个人','Personal'):briefText(plan.scope)||tr('未声明','Not declared');
    var headerFacts=[tr('范围：','Scope: ')+scope,cases.length+tr(' 个验收用例提案',' acceptance case proposal(s)'),habits.length+tr(' 条习惯提案',' habit proposal(s)'),metrics+tr(' 项待基线指标',' metric(s) awaiting baseline')];
    panel.appendChild(node('p','ob-wp-benchmark-summary',headerFacts.join(' · ')));
    panel.appendChild(node('p','ob-wp-benchmark-note',tr('用例尚未运行；习惯待本人确认。这里是个人方案，不是团队或部门验收，也不会自动执行、评分或授予权限。','Cases have not been run and habits await personal confirmation. This is a personal plan, not team or department acceptance; it does not execute, score or grant permissions.')));
    var disclosure=node('details','ob-wp-benchmark-more');
    disclosure.appendChild(node('summary','',options.disclosureLabel||tr('查看用例、习惯与后续验收记录','View cases, habits and future acceptance records')));
    if(cases.length){
      var caseSection=node('section','ob-wp-benchmark-section');caseSection.appendChild(node('h5','',tr('验收用例提案','Acceptance case proposals')));
      var caseList=node('ol','ob-wp-benchmark-cases');cases.forEach(function(item,index){appendBenchmarkCase(caseList,item,index,habits);});
      caseSection.appendChild(caseList);disclosure.appendChild(caseSection);
    }
    if(habits.length){
      var habitSection=node('section','ob-wp-benchmark-section');habitSection.appendChild(node('h5','',tr('待本人确认的习惯提案','Habit proposals awaiting personal confirmation')));
      habitSection.appendChild(node('p','ob-wp-benchmark-note',tr('这些是习惯提案，尚未由本人确认。','These are proposed habits that have not been confirmed by the person.')));
      var habitList=node('ul','ob-wp-benchmark-habits');
      habits.forEach(function(habit){
        if(!habit||typeof habit!=='object')return;
        var item=node('li','');item.appendChild(node('strong','',valueText(habit.name||habit.id,tr('未命名习惯提案','Untitled habit proposal'))));
        if(habit.description)item.appendChild(node('p','',briefText(habit.description)));
        var metadata=[];if(habit.confidence!==undefined&&habit.confidence!==null&&habit.confidence!=='')metadata.push(tr('提案置信度：','Proposal confidence: ')+briefText(habit.confidence));
        if(habit.status)metadata.push(benchmarkState(habit.status));
        if(metadata.length)item.appendChild(node('p','ob-wp-benchmark-meta',metadata.join(' · ')));
        appendBenchmarkReferences(item,habit.sourceRefs);habitList.appendChild(item);
      });
      habitSection.appendChild(habitList);disclosure.appendChild(habitSection);
    }
    if(plan.acceptancePolicy!==undefined&&plan.acceptancePolicy!==null){
      var policySection=node('section','ob-wp-benchmark-section');policySection.appendChild(node('h5','',tr('验收策略提案','Acceptance policy proposal')));
      appendBenchmarkValue(policySection,plan.acceptancePolicy);disclosure.appendChild(policySection);
    }
    if(plan.recordFields!==undefined&&plan.recordFields!==null&&plan.recordFields!==''){
      var recordSection=node('section','ob-wp-benchmark-section');recordSection.appendChild(node('h5','',tr('后续验收记录字段','Fields for future acceptance records')));
      recordSection.appendChild(node('p','ob-wp-benchmark-note',tr('这是未来记录需要填写的字段，不表示已经产生验收证据。','These fields describe future records; they are not evidence that acceptance has occurred.')));
      appendBenchmarkRecordFields(recordSection,plan.recordFields);disclosure.appendChild(recordSection);
    }
    if(plan.schemaVersion||plan.subject||plan.status||plan.profileDigest||plan.ruleVersion){
      var provenance=node('details','ob-wp-benchmark-provenance');provenance.appendChild(node('summary','',tr('查看提案来源与版本','View proposal provenance and versions')));
      var versionSection=node('p','ob-wp-benchmark-meta');
      var versions=[];if(plan.schemaVersion)versions.push(tr('方案版本：','Plan schema: ')+briefText(plan.schemaVersion));if(plan.subject)versions.push(tr('对象：','Subject: ')+briefText(plan.subject));if(plan.status)versions.push(tr('方案状态：','Plan status: ')+benchmarkState(plan.status));if(plan.profileDigest)versions.push(tr('档案摘要：','Profile digest: ')+briefText(plan.profileDigest));if(plan.ruleVersion)versions.push(tr('规则版本：','Rule version: ')+briefText(plan.ruleVersion));
      versionSection.textContent=versions.join(' · ');provenance.appendChild(versionSection);disclosure.appendChild(provenance);
    }
    var sourceRefs=array(plan.sourceRefs);if(sourceRefs.length){var sourceSection=node('section','ob-wp-benchmark-section');appendBenchmarkReferences(sourceSection,sourceRefs);disclosure.appendChild(sourceSection);}
    panel.appendChild(disclosure);parent.appendChild(panel);return panel;
  }
  function appendRoleBenchmark(parent,plan,roleId,selected){
    if(!plan||typeof plan!=='object')return null;
    var related=array(plan.cases).filter(function(item){return array(item&&item.roleIds).some(function(id){return String(id)===String(roleId);});});
    var section=node('section','ob-wp-benchmark-role');section.appendChild(node('h4','',tr('个人 Benchmark · 本角色用例','Personal Benchmark · Cases for this role')));
    var status=node('p','ob-wp-benchmark-note');
    function updateSelection(isSelected){status.textContent=isSelected?tr('已选入本次初始化。以下仅列出角色关联用例；仍需人工确认后才能用于验收。','Selected for this setup. Only cases linked to this role are listed; they still need human confirmation before acceptance.'):tr('此 BOT 未选入本次初始化；以下角色用例不会随本次创建，整体覆盖可能不完整。','This BOT is excluded from setup, so its role cases will not be included and coverage may be incomplete.');}
    updateSelection(selected);section.appendChild(status);
    if(related.length){
      section.appendChild(node('p','ob-wp-benchmark-note',tr('以下标准覆盖关联个人任务的完整验收；本 BOT 只承担上方工作步骤或首个交付物所界定的职责，并非每个 BOT 都负责全部步骤。','The criteria below cover the full linked personal task. This BOT is responsible only for work assigned in the workflow steps or defined by the first deliverable above; this does not make every BOT responsible for every step.')));
      section.appendChild(node('p','ob-wp-benchmark-summary',related.length+tr(' 个关联用例 / 全部 ',' related case(s) / ')+array(plan.cases).length));
      var list=node('ol','ob-wp-benchmark-cases');related.forEach(function(item,index){appendBenchmarkCase(list,item,index,array(plan.habits),{showWorkflowScopeNote:false});});section.appendChild(list);
    }else section.appendChild(node('p','ob-wp-benchmark-note',tr('此角色没有关联的验收用例提案。','No acceptance case proposals are linked to this role.')));
    parent.appendChild(section);section._updateSelection=updateSelection;return section;
  }
  function appendWorkflowStep(parent,step,index){
    var item=node('li','ob-wp-brief-step');
    item.appendChild(node('h5','',workflowStepTitle(step,index)));
    if(step.workflowId&&step.workflowName)item.appendChild(node('p','ob-wp-brief-step-meta',step.workflowId));
    if(step.action)briefFact(item,tr('动作','Action'),step.action);
    if(step.input)briefFact(item,tr('需要输入','Required input'),step.input);
    if(step.output)briefFact(item,tr('输出','Output'),step.output);
    if(step.humanGate!==undefined&&step.humanGate!==null&&step.humanGate!=='')briefFact(item,tr('人工关口','Human checkpoint'),approvalText(step.humanGate));
    parent.appendChild(item);
  }
  function appendBotBrief(parent,brief){
    var panel=node('section','ob-wp-brief');
    panel.appendChild(node('h4','',tr('工作流与资料','Workflow and materials')));
    if(!brief||typeof brief!=='object'){
      panel.appendChild(node('p','ob-wp-brief-scope',tr('本预览未提供工作流、技能或资料详情；未列出不代表已安装或已配置。文件读取根目录也未由预览提供。','This preview did not provide workflow, skill or material details; an omission is not evidence of installation or configuration. File-read roots were not provided either.')));
      parent.appendChild(panel);return;
    }
    var details=brief;
    var steps=array(details.steps),skills=array(details.skills),materials=array(details.materials),sources=array(details.sourceRefs),firstStep=steps[0]||{};
    var roleSkills=skills.filter(function(skill){return skill&&skill.scope==='role';});
    var workflowSkills=skills.filter(function(skill){return skill&&skill.scope==='workflow';});
    var otherSkills=skills.filter(function(skill){return skill&&skill.scope!=='role'&&skill.scope!=='workflow';});
    var firstOutput=details.firstResult||firstStep.output;
    var checkpoint=details.confirmation!==undefined&&details.confirmation!==null&&details.confirmation!==''?details.confirmation:firstStep.humanGate;
    if(firstStep.workflowName||firstStep.workflowId)panel.appendChild(node('p','ob-wp-brief-workflow',tr('关联流程：','Workflow: ')+(firstStep.workflowName||firstStep.workflowId)));
    var summary=node('div','ob-wp-brief-summary');
    briefFact(summary,tr('首步行动','First action'),firstStep.action);
    briefFact(summary,tr('需要输入','Required input'),firstStep.input);
    briefFact(summary,tr('首个输出','First output'),firstOutput);
    briefFact(summary,tr('审批点','Approval checkpoint'),approvalText(checkpoint));
    panel.appendChild(summary);
    var fileAccess=details.fileAccess&&typeof details.fileAccess==='object'?details.fileAccess:{};
    var rootStatus=fileAccess.status==='unconfigured'?tr('未配置','Not configured'):briefText(fileAccess.status)||tr('未由预览提供','Not provided by preview');
    var requestedRoots=array(fileAccess.requestedRoots).map(sourceReferenceText).filter(Boolean);
    var rootCopy=requestedRoots.length?tr('；申请的根目录（尚未授权）：','; requested roots (not authorized): ')+requestedRoots.join(' · '):tr('；未列出申请的根目录','; no requested roots listed');
    panel.appendChild(node('p','ob-wp-brief-scope',tr('规划能力：','Planned capabilities: ')+roleSkills.length+tr(' 项；参与流程的候选技能：','; workflow skill candidates: ')+workflowSkills.length+tr(' 项；资料候选：','; material candidates: ')+materials.length+tr(' 项。当前共享/个人技能与文档配置请查看 BOT 详情。',' items. Check BOT details for configured shared/personal skills and documents.')));
    panel.appendChild(node('p','ob-wp-brief-scope',tr('文件读取根目录：','File-read roots: ')+rootStatus+rootCopy+tr('。提案依据不授予文件读取权限。','; proposal references do not grant file access.')));
    var hasDetails=steps.length||skills.length||materials.length||sources.length||requestedRoots.length;
    if(hasDetails){
      var more=node('details','ob-wp-brief-more');
      more.appendChild(node('summary','',tr('查看步骤、规划能力、候选技能与资料','View steps, planned capabilities, candidate skills and materials')));
      if(steps.length){
        var stepSection=node('section','ob-wp-brief-section');
        stepSection.appendChild(node('h5','',tr('工作步骤','Workflow steps')));
        var stepList=node('ol','ob-wp-brief-steps');
        steps.forEach(function(step,index){if(step&&typeof step==='object')appendWorkflowStep(stepList,step,index);});
        stepSection.appendChild(stepList);more.appendChild(stepSection);
      }
      function appendSkillGroup(title,items,kind){
        if(!items.length)return;
        var skillSection=node('section','ob-wp-brief-section');
        skillSection.appendChild(node('h5','',title));
        if(kind==='workflow')skillSection.appendChild(node('p','ob-wp-brief-disclaimer',tr('这些是流程相关候选项，不代表已安装、已分配或可直接调用。','These are workflow-related candidates, not evidence of installation, assignment or availability.')));
        var skillList=node('ul','ob-wp-brief-skills');
        items.forEach(function(skill){
          if(!skill||typeof skill!=='object')return;
          var item=node('li','ob-wp-brief-skill');
          item.appendChild(node('strong','',valueText(skill.name||skill.id,tr('未命名技能','Unnamed skill'))));
          if(skill.summary)item.appendChild(node('p','',briefText(skill.summary)));
          if(skill.workflowName||skill.workflowId)item.appendChild(node('p','ob-wp-brief-skill-meta',tr('关联流程：','Workflow: ')+(skill.workflowName||skill.workflowId)));
          var metadata=[];
          if(kind==='workflow')metadata.push(skill.coverage==='reuse'?tr('覆盖：可复用','Coverage: reusable'):skill.coverage==='partial'?tr('覆盖：部分','Coverage: partial'):skill.coverage?tr('覆盖：','Coverage: ')+briefText(skill.coverage):'');
          if(skill.scope==='role'){
            if(skill.presence!==undefined&&skill.presence!==null&&skill.presence!==''&&skill.presence!=='needs-design-and-tool-validation')metadata.push(tr('状态：','Status: ')+briefText(skill.presence));
            if(skill.sourceLevel==='capability-specification')metadata.push(tr('来源：能力规格','Source: capability specification'));
            else if(skill.sourceLevel!==undefined&&skill.sourceLevel!==null&&skill.sourceLevel!=='')metadata.push(tr('来源层级：','Source level: ')+briefText(skill.sourceLevel));
          }else{
            if(skill.presence!==undefined&&skill.presence!==null&&skill.presence!=='')metadata.push(tr('状态描述：','Descriptor: ')+briefText(skill.presence));
            if(skill.sourceLevel!==undefined&&skill.sourceLevel!==null&&skill.sourceLevel!=='')metadata.push(tr('来源层级：','Source level: ')+briefText(skill.sourceLevel));
          }
          if(metadata.filter(Boolean).length)item.appendChild(node('p','ob-wp-brief-skill-meta',metadata.filter(Boolean).join(' · ')));
          skillList.appendChild(item);
        });
        skillSection.appendChild(skillList);more.appendChild(skillSection);
      }
      appendSkillGroup(tr('规划能力 / 待设计验证','Planned capabilities / validation pending'),roleSkills,'role');
      appendSkillGroup(tr('参与流程的候选技能','Candidate skills used in workflows'),workflowSkills,'workflow');
      appendSkillGroup(tr('未分类技能候选','Unclassified skill candidates'),otherSkills,'other');
      if(materials.length){
        var materialSection=node('section','ob-wp-brief-section');
        materialSection.appendChild(node('h5','',tr('资料候选 / 未接入','Material candidates / not connected')));
        var materialList=node('ul','ob-wp-brief-materials');
        materials.forEach(function(material){
          if(!material||typeof material!=='object')return;
          var item=node('li','ob-wp-brief-material');
          item.appendChild(node('strong','',valueText(material.name||material.id,tr('未命名资料','Unnamed material'))));
          item.appendChild(node('span','ob-wp-brief-material-status',material.status==='unreviewed'?tr('资料候选 / 未接入','Material candidate / not connected'):briefText(material.status)||tr('未接入状态未提供','Connection state not provided')));
          if(material.description)item.appendChild(node('p','',briefText(material.description)));
          var refs=array(material.sourceRefs).map(sourceReferenceText).filter(Boolean);
          if(refs.length)item.appendChild(node('p','ob-wp-brief-source-meta',tr('提案依据（不是文件授权）：','Proposal references (not file access): ')+refs.join(' · ')));
          materialList.appendChild(item);
        });
        materialSection.appendChild(materialList);more.appendChild(materialSection);
      }
      if(sources.length){
        var sourceSection=node('section','ob-wp-brief-section');
        sourceSection.appendChild(node('h5','',tr('提案依据（不是文件授权）','Proposal references (not file access)')));
        var sourceList=node('ul','ob-wp-brief-source-list');
        sources.forEach(function(reference){var label=sourceReferenceText(reference);if(label)sourceList.appendChild(node('li','',label));});
        if(sourceList.childElementCount)sourceSection.appendChild(sourceList);
        more.appendChild(sourceSection);
      }
      if(requestedRoots.length){
        var rootsSection=node('section','ob-wp-brief-section');
        rootsSection.appendChild(node('h5','',tr('文件读取根目录请求（尚未授权）','Requested file-read roots (not authorized)')));
        appendTextList(rootsSection,requestedRoots,'ob-wp-brief-source-list');more.appendChild(rootsSection);
      }
      panel.appendChild(more);
    }
    parent.appendChild(panel);
  }
  function cloneBrief(value){
    if(!value||typeof value!=='object')return null;
    try{return JSON.parse(JSON.stringify(value));}catch(_error){return null;}
  }
  function cloneDraft(source){
    var draft=source&&typeof source==='object'?source:{};
    return {
      name:String(draft.name||''),
      leaderRoleId:String(draft.leaderRoleId||''),
      benchmarkPlan:cloneBrief(draft.benchmarkPlan),
      bots:array(draft.bots).map(function(sourceBot,index){
        var bot=sourceBot&&typeof sourceBot==='object'?sourceBot:{};
        var roleId=String(bot.roleId||('role-'+(index+1)));
        var avatar=String(bot.avatar||'');
        if(!avatar&&root.OpenBotAvatars&&root.OpenBotAvatars.defaultForId)avatar=root.OpenBotAvatars.defaultForId(roleId);
        if(!avatar)avatar=FALLBACK_AVATARS[index%FALLBACK_AVATARS.length];
        return {
          roleId:roleId,
          name:String(bot.name||''),
          persona:String(bot.persona||''),
          avatar:avatar,
          color:String(bot.color||''),
          executorId:String(bot.executorId||'dsh'),
          model:String(bot.model||''),
          selected:bot.selected!==false,
          requirements:array(bot.requirements).slice(),
          reason:String(bot.reason||''),
          brief:cloneBrief(bot.brief)
        };
      })
    };
  }
  function avatarIds(){
    var ids=root.OpenBotAvatars&&Array.isArray(root.OpenBotAvatars.ids)?root.OpenBotAvatars.ids:FALLBACK_AVATARS;
    return ids.map(String);
  }
  function avatarLabel(id){
    return root.OpenBotAvatars&&typeof root.OpenBotAvatars.label==='function'?root.OpenBotAvatars.label(id):String(id);
  }
  function executorLabel(id){
    if(id==='pi')return 'Pi Agent Core';
    if(id==='agent:codex')return 'Codex CLI';
    if(id==='dsh')return 'DSH';
    return String(id||tr('未选择 Harness','No harness selected'));
  }
  function setAvatarPreview(holder,id,color){
    holder.replaceChildren();
    if(root.OpenBotAvatars&&typeof root.OpenBotAvatars.markup==='function'){
      holder.innerHTML=root.OpenBotAvatars.markup(id,color,{size:'header'});
      return;
    }
    holder.appendChild(node('span','ob-wp-avatar-fallback',avatarLabel(id).slice(0,1)));
  }
  function setStatus(session,message,tone){
    session.status.textContent=message||'';
    session.status.hidden=!message;
    session.status.dataset.tone=tone||'info';
  }
  function setActions(session,buttons){
    session.actions.replaceChildren();
    buttons.forEach(function(button){session.actions.appendChild(button);});
  }
  function makeSession(titleText,descriptionText){
    if(current&&current.dialog.open)current.close(false);
    var doc=root.document,opener=doc.activeElement,dialog=node('dialog','ob-wp-dialog');
    var id='ob-wp-'+(++sequence),titleId=id+'-title',descriptionId=id+'-description';
    var header=node('header','ob-wp-header');
    var title=node('h2','',titleText);title.id=titleId;
    var closeButton=makeButton(tr('关闭','Close'),'ob-wp-close',function(){dialog.close();});
    closeButton.setAttribute('aria-label',tr('关闭','Close'));
    header.append(title,closeButton);
    var description=node('p','ob-wp-dialog-description',descriptionText);description.id=descriptionId;
    var body=node('div','ob-wp-body');
    var footer=node('footer','ob-wp-footer'),status=node('p','ob-wp-message');
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;
    var actions=node('div','ob-wp-actions');footer.append(status,actions);
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby',titleId);dialog.setAttribute('aria-describedby',descriptionId);
    dialog.append(header,description,body,footer);doc.body.appendChild(dialog);
    var session={dialog:dialog,title:title,description:description,body:body,footer:footer,status:status,actions:actions,opener:opener,restoreFocus:true,close:function(restore){
      session.restoreFocus=restore!==false;
      if(dialog.open)dialog.close();else finish();
    }};
    function finish(){
      if(current===session)current=null;
      dialog.remove();
      if(session.restoreFocus&&opener&&opener.isConnected&&typeof opener.focus==='function')opener.focus();
    }
    dialog.addEventListener('close',finish,{once:true});
    dialog.addEventListener('cancel',function(){session.restoreFocus=true;});
    current=session;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    closeButton.focus();
    return session;
  }
  function callCallback(callback,arg){
    if(typeof callback!=='function')return;
    try{var result=callback(arg);if(result&&typeof result.catch==='function')result.catch(function(){});}catch(_error){}
  }
  function openSettings(session,callback,payload){
    session.close(false);
    callCallback(callback,payload);
  }
  function displayStatus(status){
    var known={applied:tr('已应用','Applied'),pending:tr('等待处理','Pending'),queued:tr('已排队','Queued'),resetting:tr('重置处理中','Resetting'),failed:tr('失败','Failed'),initializing:tr('初始化未完成','Setup incomplete'),reset:tr('重置已完成','Reset complete'),cancelled:tr('已取消','Cancelled')};
    var key=String(status||'');
    return known[key]||key||tr('未知','Unknown');
  }
  function pushCallout(parent,title,body,tone){
    var section=node('section','ob-wp-callout'+(tone?' is-'+tone:''));
    if(title)section.appendChild(node('h3','',title));
    if(body)section.appendChild(node('p','',body));
    parent.appendChild(section);return section;
  }
  function snapshotBoolean(value,enabled,disabled){
    if(value===true)return enabled;
    if(value===false)return disabled;
    return tr('未返回','Not reported');
  }
  function appendBotSnapshot(parent,detail){
    var section=node('section','ob-wp-live-snapshot');
    section.appendChild(node('h4','',tr('当前空间 BOT 实例','Current space BOT instance')));
    if(!detail||detail.exists!==true){
      var error=detail&&detail.error?String(detail.error):tr('宿主未返回此空间实例。','The host did not return this space instance.');
      pushCallout(section,tr('空间实例未找到或不可读取','Space instance missing or unavailable'),error+tr('。原 BOT 设置不能替代此空间实例。','. Original BOT settings are not a substitute for this space instance.'),'warning');
      parent.appendChild(section);return;
    }
    var facts=node('dl','ob-wp-facts');
    var execution=detail.execution||{};
    var executionKind=execution.kind==='native'?tr('Codex CLI','Codex CLI'):execution.kind;
    var authState=execution.authentication==='unverified'?tr('未验证','Unverified'):execution.authentication;
    [['名称','Name',detail.name],['实例 ID','Instance ID',detail.instanceId],['修订','Revision',detail.revision],['执行方式','Execution kind',executionKind],['执行器 ID','Executor ID',execution.agentId],['Harness','Harness',execution.harness],['模型','Model',execution.model],['提供方','Provider',execution.providerName],['连接凭据已配置','Connection credentials configured',execution.connectionConfigured===undefined?undefined:snapshotBoolean(execution.connectionConfigured,tr('是','Yes'),tr('否','No'))],['认证状态','Authentication status',authState]].forEach(function(row){
      if(row[2]===undefined||row[2]===null||row[2]==='')return;
      facts.append(node('dt','',tr(row[0],row[1])),node('dd','',row[2]));
    });
    section.appendChild(facts);
    if(execution.authentication==='unverified')section.appendChild(node('p','ob-wp-live-note',tr('连接凭据存在状态不代表认证已成功。','Credential presence does not mean authentication succeeded.')));
    if(execution.unsupportedReason)pushCallout(section,tr('执行方式说明','Execution note'),displayHostMessage(execution.unsupportedReason),'warning');
    var permissions=detail.permissions||{},permissionFacts=node('dl','ob-wp-facts');
    [
      ['工具调用','Tool use',snapshotBoolean(permissions.toolsEnabled,tr('已开启','Enabled'),tr('关闭','Off'))],
      ['容器','Container',snapshotBoolean(permissions.containerEnabled,tr('已开启','Enabled'),tr('关闭','Off'))],
      ['读取策略（宿主返回）','Read policy (from host)',permissions.readPolicy],
      ['工作目录策略（宿主返回）','Working-directory policy (from host)',permissions.cwdPolicy],
      ['原生 CLI 策略','Native CLI policy',permissions.cliPolicy==='native-policy-not-os-sandbox'?tr('宿主/系统策略；不是 OS 沙箱','Host/OS policy; not an OS sandbox'):permissions.cliPolicy]
    ].forEach(function(row){if(row[2]===undefined||row[2]===null||row[2]==='')return;permissionFacts.append(node('dt','',tr(row[0],row[1])),node('dd','',row[2]));});
    if(permissionFacts.childElementCount){section.appendChild(node('h5','ob-wp-live-heading',tr('空间实例权限与策略','Instance permissions and policies')));section.appendChild(permissionFacts);}
    if(permissions.cliPolicy==='native-policy-not-os-sandbox')pushCallout(section,tr('原生 CLI 边界','Native CLI boundary'),tr('原生 CLI 按宿主与操作系统策略运行；此标记不是 OS 沙箱，也不代表执行已验证。','Native CLI follows host and operating-system policy; this flag is not an OS sandbox and does not mean execution was verified.'),'warning');
    var skills=array(detail.skills),skillSection=node('section','ob-wp-live-section');
    skillSection.appendChild(node('h5','',tr('当前空间实例技能','Skills in this space instance')));
    if(skills.length){
      var skillList=node('ul','ob-wp-live-list');
      skills.forEach(function(skill){
        var source=skill.source==='instance'?tr('空间实例专属','Instance-specific'):skill.source==='shared'?tr('共享技能','Shared skill'):valueText(skill.source,tr('来源未返回','Source not reported'));
        var line=valueText(skill.name||skill.id,tr('未命名技能','Unnamed skill'))+' · '+source;
        if(skill.source==='shared'&&skill.version)line+=tr(' · 版本 ',' · version ')+skill.version;
        if(skill.descriptionPresent!==undefined)line+=skill.descriptionPresent?tr(' · 有说明',' · description present'):tr(' · 无说明',' · no description');
        skillList.appendChild(node('li','',line));
      });
      skillSection.appendChild(skillList);
    }else skillSection.appendChild(node('p','ob-wp-live-note',tr('宿主快照未返回技能条目。','The host snapshot returned no skill entries.')));
    section.appendChild(skillSection);
    var files=array(detail.files),fileSection=node('section','ob-wp-live-section');
    fileSection.appendChild(node('h5','',tr('空间文件（仅清单元数据）','Space files (metadata only)')));
    fileSection.appendChild(node('p','ob-wp-live-note',tr('不读取或显示文件正文。','File contents are not read or displayed.')));
    if(files.length){
      var fileList=node('ul','ob-wp-live-list');
      files.forEach(function(file){fileList.appendChild(node('li','',valueText(file.name,tr('未命名文件','Unnamed file'))+tr(' · ',' · ')+countLabel(file.bytes,' 字节',' bytes')+tr(' · 修订 ',' · revision ')+valueText(file.revision,tr('未知','Unknown'))));});
      fileSection.appendChild(fileList);
    }else fileSection.appendChild(node('p','ob-wp-live-note',tr('宿主当前未返回文件条目。','The host returned no file entries.')));
    section.appendChild(fileSection);
    var knowledge=array(detail.knowledge),knowledgeSection=node('section','ob-wp-live-section');
    knowledgeSection.appendChild(node('h5','',tr('共享知识条目（不显示正文）','Shared knowledge entries (no content shown)')));
    if(knowledge.length){
      var knowledgeList=node('ul','ob-wp-live-list');
      knowledge.forEach(function(item){knowledgeList.appendChild(node('li','',valueText(item.title||item.id,tr('未命名条目','Unnamed entry'))+tr(' · 版本 ',' · version ')+valueText(item.version,tr('未知','Unknown'))+tr(' · 正文：',' · content: ')+(item.hasContent?tr('存在','present'):tr('未返回','not reported'))));});
      knowledgeSection.appendChild(knowledgeList);
    }else knowledgeSection.appendChild(node('p','ob-wp-live-note',tr('宿主当前未返回共享知识条目。','The host returned no shared knowledge entries.')));
    section.appendChild(knowledgeSection);
    var shared=detail.shared||{},sharedFacts=node('dl','ob-wp-facts');
    [['共享资源版本','Shared asset version',shared.version],['有更新','Update available',snapshotBoolean(shared.updateAvailable,tr('是','Yes'),tr('否','No'))]].forEach(function(row){if(row[2]===undefined||row[2]===null||row[2]==='')return;sharedFacts.append(node('dt','',tr(row[0],row[1])),node('dd','',row[2]));});
    if(sharedFacts.childElementCount){section.appendChild(node('h5','ob-wp-live-heading',tr('共享资源状态','Shared assets')));section.appendChild(sharedFacts);}
    if(shared.error)pushCallout(section,tr('共享资源读取状态','Shared asset status'),shared.error,'warning');
    var original=detail.originalBot||{},originalFacts=node('dl','ob-wp-facts');
    originalFacts.append(node('dt','',tr('原 BOT 是否存在','Original BOT exists')),node('dd','',snapshotBoolean(original.exists,tr('是','Yes'),tr('否','No'))));
    if(original.agentId)originalFacts.append(node('dt','',tr('原 BOT 执行器 ID','Original BOT agent ID')),node('dd','',original.agentId));
    originalFacts.append(node('dt','',tr('原 BOT 是否需设置','Original BOT needs setup')),node('dd','',snapshotBoolean(original.needsSetup,tr('是','Yes'),tr('否','No'))));
    section.appendChild(node('h5','ob-wp-live-heading',tr('原 BOT（独立于空间实例）','Original BOT (separate from this instance)')));
    section.appendChild(node('p','ob-wp-live-note',tr('下方“原 BOT 模型设置”只打开原 BOT 配置，不会覆盖这里的空间实例。','Original BOT model settings below do not overwrite this space instance.')));
    section.appendChild(originalFacts);
    var directory=detail.directoryScope||{};
    section.appendChild(node('h5','ob-wp-live-heading',tr('目录登记范围','Registered directory scope')));
    if(directory.status!=='inspected'){
      section.appendChild(node('p','ob-wp-live-scope-warning',tr('目录授权尚未读取；此导入未新增目录授权。','Directory authorization has not been inspected; this import added no directory grants.')));
    }else{
      var roots=array(directory.roots);
      section.appendChild(node('p','ob-wp-live-note',tr('宿主已检查目录登记与关联。登记关系不替代工具审批或系统权限；此导入未新增目录授权。','The host inspected registered directories and associations. Registration does not replace tool approval or OS permissions; this import added no directory grants.')));
      if(roots.length){
        var rootList=node('ul','ob-wp-live-roots');
        var associationLabels={direct:tr('此 BOT 直接关联','Direct to this BOT'),project:tr('项目关联','Project-linked'),'space-only':tr('仅空间登记，未发现 BOT/项目关联','Space-only; no BOT/project link found')};
        roots.forEach(function(rootInfo){
          var row=node('li','ob-wp-live-root');
          row.appendChild(node('span','ob-wp-live-root-label',valueText(rootInfo.name||rootInfo.id,tr('未命名目录','Unnamed directory'))+' · '+(associationLabels[rootInfo.association]||valueText(rootInfo.association,tr('关系未返回','Association not reported')))+(rootInfo.status?' · '+rootInfo.status:'')));
          if(rootInfo.path){var path=node('details','ob-wp-path-details');path.append(node('summary','',tr('查看登记路径','View registered path')),node('code','ob-wp-path',rootInfo.path));row.appendChild(path);}
          rootList.appendChild(row);
        });
        section.appendChild(rootList);
      }else section.appendChild(node('p','ob-wp-live-scope-warning',tr('已检查登记清单，当前没有返回根目录条目；这不声明操作系统层级的访问边界。','The inspected registry returned no roots; this does not claim an operating-system access boundary.')));
    }
    parent.appendChild(section);
  }
  function appendBotInstanceDetails(parent,botId,bot,batch,session,invoke,detailsByBot,benchmarkOverride){
    var disclosure=node('details','ob-wp-instance-details');
    disclosure.appendChild(node('summary','',tr('BOT详情','BOT details')));
    var body=node('div','ob-wp-instance-details-body'),status=node('p','ob-wp-instance-status'),refresh=makeButton(tr('刷新 BOT 详情','Refresh BOT details'),'ob-wp-secondary'),content=node('div','ob-wp-instance-content');
    body.append(status,refresh,content);disclosure.appendChild(body);
    var busy=false;
    function render(snapshot){
      content.replaceChildren();
      appendBotBrief(content,bot.brief);
      appendRoleBenchmark(content,benchmarkOverride||benchmarkPlanFrom(batch),bot.roleId,true);
      appendBotSnapshot(content,snapshot);
    }
    function currentSnapshot(){return detailsByBot&&detailsByBot[botId]||null;}
    async function inspect(force){
      if(busy)return;
      var cached=currentSnapshot();
      if(cached&&!force){render(cached);status.textContent=tr('显示当前批次返回的空间实例快照。','Showing the space instance snapshot returned with this batch.');return;}
      if(typeof invoke!=='function'){
        render(null);status.textContent=tr('实际空间实例未读取：宿主检查接口不可用。','Live instance not inspected: the host inspection API is unavailable.');return;
      }
      busy=true;refresh.disabled=true;status.textContent=tr('正在读取此空间实例详情…','Reading this space instance…');
      try{
        var result=await invoke('inspect',{batchId:batch.batchId});
        if(!result||result.ok!==true)throw new Error(valueText(result&&result.message,tr('宿主未返回实例快照。','The host did not return an instance snapshot.')));
        if(result.batchId&&batch.batchId&&result.batchId!==batch.batchId)throw new Error(tr('检查结果批次不匹配，未显示。','Inspection batch did not match; result not shown.'));
        Object.keys(detailsByBot).forEach(function(key){delete detailsByBot[key];});
        Object.assign(detailsByBot,result.botDetails&&typeof result.botDetails==='object'?result.botDetails:{});
        var snapshot=currentSnapshot();
        render(snapshot);
        status.textContent=snapshot?tr('已读取空间实例快照。','Space instance snapshot read.'):tr('未返回此 BOT 的空间实例；原 BOT 设置不会代替该实例。','No space instance was returned for this BOT; original BOT settings are not a substitute.');
      }catch(error){
        render(null);status.textContent=(error&&error.message?error.message+' · ':'')+tr('空间实例检查失败；可刷新重试。','Could not inspect the space instance. Refresh to retry.');
      }finally{busy=false;refresh.disabled=false;}
    }
    disclosure.addEventListener('toggle',function(){
      if(parent.classList&&parent.classList.contains('ob-wp-bot-card'))parent.classList.toggle('has-expanded-details',disclosure.open);
      if(disclosure.open)inspect(false);
    });
    refresh.addEventListener('click',function(){inspect(true);});
    parent.appendChild(disclosure);
    if(batch&&batch.botDetails&&batch.botDetails[botId])render(batch.botDetails[botId]);
    else render(null);
    return disclosure;
  }
  function appendBotSettings(parent,batch,session,onOpenSettings,onOpenResources,invoke,expanded,benchmarkOverride){
    var bots=array(batch&&batch.draft&&batch.draft.bots).filter(function(bot){return bot&&bot.selected!==false;});
    var botIds=array(batch&&batch.botIds);
    if(!bots.length&&botIds.length)bots=botIds.map(function(id){return {roleId:id,name:id,selected:true};});
    if(!bots.length)return;
    var details=node('details','ob-wp-bot-settings');details.open=!!expanded;
    details.appendChild(node('summary','',tr('BOT 详情与设置','BOT details and settings')+' · '+bots.length));
    appendBenchmarkPlan(details,benchmarkOverride||benchmarkPlanFrom(batch));
    var detailsByBot=Object.assign({},batch&&batch.botDetails||{});
    var list=node('div','ob-wp-bot-cards');
    bots.forEach(function(bot,index){
      var botId=botIds[index]||bot.roleId||bot.id;
      var card=node('article','ob-wp-bot-card'),head=node('div','ob-wp-bot-card-head');
      if(bot.avatar){var avatar=node('span','ob-wp-bot-link-avatar');setAvatarPreview(avatar,bot.avatar,bot.color);head.appendChild(avatar);}
      head.appendChild(node('strong','',bot.name||bot.roleId||botId||tr('未命名 BOT','Unnamed BOT')));card.appendChild(head);
      appendBotInstanceDetails(card,botId,bot,batch,session,invoke,detailsByBot,benchmarkOverride);
      var actions=node('div','ob-wp-bot-card-actions');
      if(typeof onOpenSettings==='function')actions.appendChild(makeButton(tr('原 BOT 模型设置','Original BOT model settings'),'ob-wp-secondary',function(){
        openSettings(session,onOpenSettings,{botId:botId,batch:batch,roleId:bot.roleId,bot:bot});
      }));
      if(typeof onOpenResources==='function')actions.appendChild(makeButton(tr('本空间资料与技能','Space files and skills'),'ob-wp-secondary',function(){
        openSettings(session,onOpenResources,{batch:batch,botId:botId});
      }));
      if(actions.childElementCount)card.appendChild(actions);
      list.appendChild(card);
    });
    details.appendChild(list);parent.appendChild(details);return details;
  }
  function renderPreviewWarnings(parent,preview,allowExisting){
    var conflicts=array(preview.conflicts),warnings=array(preview.warnings),errors=array(preview.errors);
    if(conflicts.length){
      var conflictBox=pushCallout(parent,allowExisting?tr('已有名称匹配','Existing name matches'):tr('需要先处理的冲突','Conflicts to resolve'),allowExisting?tr('继续同一初始化批次会复用原记录；宿主仍会校验批次所有权。','Continuing this setup batch reuses its existing record; the host will still verify batch ownership.'):tr('宿主报告了冲突；当前不能应用此方案。','The host reported conflicts. This plan cannot be applied yet.'),allowExisting?'warning':'danger');
      appendTextList(conflictBox,conflicts);
    }
    if(errors.length){
      var errorBox=pushCallout(parent,tr('预览未通过','Preview needs attention'),'', 'danger');appendTextList(errorBox,errors);
    }
    if(warnings.length){
      var warningBox=node('details','ob-wp-callout ob-wp-warning-details is-warning');
      var important=warnings.find(function(item){return /空间会话|空间群聊|群聊|space conversations|group chat/i.test(valueText(item,''));});
      var summaryText=important?tr('提醒：','Note: ')+displayHostMessage(important):tr('提醒 · '+warnings.length+' 项','Warnings · '+warnings.length);
      warningBox.appendChild(node('summary','',summaryText));
      appendTextList(warningBox,warnings.map(displayHostMessage));
      parent.appendChild(warningBox);
    }
  }
  function addField(labelText,control,className){
    var label=node('label','ob-wp-field'+(className?' '+className:''));
    label.append(node('span','ob-wp-field-label',labelText),control);return label;
  }
  function createRoleCard(bot,index,draft,session,refreshActionState){
    var card=node('section','ob-wp-role');card.dataset.roleId=bot.roleId;
    var header=node('div','ob-wp-role-head');
    var include=node('input','');include.type='checkbox';include.checked=bot.selected;include.dataset.includeRole=bot.roleId;
    var includeLabel=node('label','ob-wp-include');includeLabel.append(include,node('span','',tr('加入此方案','Include in plan')));
    var avatar=node('button','ob-wp-role-avatar');avatar.type='button';setAvatarPreview(avatar,bot.avatar,bot.color);
    var heading=node('div','ob-wp-role-heading');
    var roleName=node('h3','ob-wp-role-title',bot.name||bot.roleId);roleName.dataset.roleTitle=bot.roleId;
    heading.appendChild(roleName);
    var leaderLabel=node('label','ob-wp-leader');
    var leader=node('input','');leader.type='radio';leader.name='ob-wp-leader-'+sequence;leader.value=bot.roleId;leader.checked=draft.leaderRoleId===bot.roleId;leader.disabled=!bot.selected;leader.dataset.leaderRole=bot.roleId;
    leaderLabel.append(leader,node('span','',tr('空间负责人','Workspace lead')));
    var editor=node('div','ob-wp-role-editor');editor.id='ob-wp-role-editor-'+sequence+'-'+index;editor.hidden=true;
    function settingsLabel(){return tr('打开 '+(bot.name||bot.roleId)+' 设置','Open settings for '+(bot.name||bot.roleId));}
    function toggleEditor(){editor.hidden=!editor.hidden;toggle.setAttribute('aria-expanded',String(!editor.hidden));avatar.setAttribute('aria-expanded',String(!editor.hidden));}
    var toggle=makeButton(tr('设置','Settings'),'ob-wp-role-toggle',toggleEditor);
    toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',editor.id);
    avatar.setAttribute('aria-label',settingsLabel());avatar.setAttribute('aria-expanded','false');avatar.setAttribute('aria-controls',editor.id);avatar.addEventListener('click',toggleEditor);
    header.append(includeLabel,avatar,heading,leaderLabel,toggle);card.appendChild(header);
    var roleId=node('code','ob-wp-role-id',bot.roleId);
    var guidance=node('div','ob-wp-role-guidance');
    var reason=node('div','ob-wp-reason');
    reason.append(node('span','ob-wp-meta-label',tr('推荐原因','Why recommended')),node('p','',bot.reason||tr('未提供推荐原因。','No recommendation reason was provided.')));
    guidance.appendChild(reason);
    var requirementRows=array(bot.requirements);
    var todo=node('div','ob-wp-todo');
    todo.appendChild(node('span','ob-wp-meta-label',tr('待配置项','Needs setup')));
    if(requirementRows.length)appendTextList(todo,requirementRows,'ob-wp-todo-list');
    else todo.appendChild(node('p','',tr('预览未列出额外前提；账号与知识库仍未连接。','No additional requirements were listed; accounts and knowledge sources remain unconnected.')));
    guidance.appendChild(todo);
    appendBotBrief(guidance,bot.brief);
    var roleBenchmark=appendRoleBenchmark(guidance,draft.benchmarkPlan,bot.roleId,bot.selected);
    var fieldset=node('fieldset','ob-wp-fields');fieldset.disabled=!bot.selected;
    fieldset.appendChild(roleId);
    var nameInput=node('input','ob-wp-control');nameInput.type='text';nameInput.maxLength=40;nameInput.value=bot.name;nameInput.required=true;nameInput.dataset.botField='name';nameInput.dataset.roleId=bot.roleId;
    fieldset.appendChild(addField(tr('名称','Name'),nameInput));
    var personaInput=node('textarea','ob-wp-control');personaInput.rows=4;personaInput.maxLength=8000;personaInput.value=bot.persona;personaInput.dataset.botField='persona';personaInput.dataset.roleId=bot.roleId;
    fieldset.appendChild(addField(tr('人设与职责','Persona and responsibility'),personaInput,'ob-wp-field-wide'));
    var avatarSelect=node('select','ob-wp-control');avatarSelect.dataset.botField='avatar';avatarSelect.dataset.roleId=bot.roleId;
    avatarIds().forEach(function(id){var option=node('option','',avatarLabel(id));option.value=id;avatarSelect.appendChild(option);});
    if(!avatarIds().includes(bot.avatar)){var fallback=node('option','',avatarLabel(bot.avatar));fallback.value=bot.avatar;avatarSelect.appendChild(fallback);}
    avatarSelect.value=bot.avatar;
    fieldset.appendChild(addField(tr('头像','Avatar'),avatarSelect));
    var executorSelect=node('select','ob-wp-control');executorSelect.dataset.botField='executorId';executorSelect.dataset.roleId=bot.roleId;
    [
      ['dsh',tr('DSH（本机 Harness）','DSH (local harness)')],
      ['pi',tr('Pi Agent Core','Pi Agent Core')],
      ['agent:codex',tr('Codex CLI','Codex CLI')]
    ].forEach(function(entry){var option=node('option','',entry[1]);option.value=entry[0];executorSelect.appendChild(option);});
    if(!Array.from(executorSelect.options).some(function(option){return option.value===bot.executorId;})){
      var unsupported=node('option','',tr('当前选择：','Current selection: ')+bot.executorId);unsupported.value=bot.executorId;executorSelect.appendChild(unsupported);
    }
    executorSelect.value=bot.executorId;
    fieldset.appendChild(addField(tr('主 Harness','Primary harness'),executorSelect));
    var modelInput=node('input','ob-wp-control');modelInput.type='text';modelInput.maxLength=120;modelInput.value=bot.model;modelInput.placeholder=tr('可留空；按 Harness 设置模型','Optional; configure model in the harness');modelInput.dataset.botField='model';modelInput.dataset.roleId=bot.roleId;
    fieldset.appendChild(addField(tr('模型 ID','Model ID'),modelInput));
    var boundary=node('p','ob-wp-access-state',tr('工具、屏幕与容器：关闭 · 知识与账号：未连接','Tools, screen and containers: off · knowledge and accounts: not connected'));
    fieldset.appendChild(boundary);
    editor.append(guidance,fieldset);card.appendChild(editor);
    var configSummary=node('span','ob-wp-role-config-summary');configSummary.dataset.roleConfig=bot.roleId;
    function updateConfigSummary(){configSummary.textContent=executorLabel(bot.executorId)+' · '+(bot.model?bot.model:tr('模型待配置','Model not set'));}
    updateConfigSummary();heading.appendChild(configSummary);
    function sync(){
      include.checked=bot.selected;
      leader.checked=draft.leaderRoleId===bot.roleId;leader.disabled=!bot.selected;
      fieldset.disabled=!bot.selected;
      roleName.textContent=bot.name||bot.roleId;
      avatar.setAttribute('aria-label',settingsLabel());
      avatarSelect.value=bot.avatar;setAvatarPreview(avatar,bot.avatar,bot.color);
    }
    include.addEventListener('change',function(){
      var selectedCount=draft.bots.filter(function(item){return item.selected;}).length;
      if(!include.checked&&selectedCount<=1){include.checked=true;setStatus(session,tr('至少保留一个 BOT。','Keep at least one BOT in the plan.'),'warning');return;}
      bot.selected=include.checked;
      if(roleBenchmark&&roleBenchmark._updateSelection)roleBenchmark._updateSelection(bot.selected);
      if(!bot.selected&&draft.leaderRoleId===bot.roleId){var next=draft.bots.find(function(item){return item.selected;});draft.leaderRoleId=next?next.roleId:'';}
      sync();
      session.body.querySelectorAll('[data-leader-role]').forEach(function(input){
        var related=draft.bots.find(function(item){return item.roleId===input.dataset.leaderRole;});
        input.checked=draft.leaderRoleId===input.dataset.leaderRole;input.disabled=!related||!related.selected;
      });
      setStatus(session,'','info');refreshActionState();
    });
    leader.addEventListener('change',function(){if(leader.checked){draft.leaderRoleId=bot.roleId;setStatus(session,'','info');refreshActionState();}});
    [nameInput,personaInput,avatarSelect,executorSelect,modelInput].forEach(function(control){
      var eventName=control.tagName==='SELECT'?'change':'input';
      control.addEventListener(eventName,function(){
        bot[control.dataset.botField]=control.value;
        if(control===nameInput){roleName.textContent=bot.name||bot.roleId;avatar.setAttribute('aria-label',settingsLabel());}
        if(control===avatarSelect)setAvatarPreview(avatar,bot.avatar,bot.color);
        if(control===executorSelect||control===modelInput)updateConfigSummary();
        refreshActionState();
      });
    });
    card._sync=sync;
    return card;
  }
  function renderExistingPreview(session,existing,onOpenSettings,onOpenResources,invoke,preview,onApplied){
    var body=session.body;
    var applied=existing.status==='applied';
    var message=applied?tr('这批方案已经应用，不会再次创建。','This plan has already been applied and will not create another batch.'):tr('已有此方案的批次记录。先在管理列表确认当前状态，再继续操作。','A batch record already exists for this plan. Check its current state in the management list before continuing.');
    pushCallout(body,applied?tr('已有初始化结果','Existing setup'):tr('已有批次记录','Existing batch'),message,'warning');
    var benchmarkUpdate=preview&&preview.benchmarkUpdate&&preview.benchmarkUpdate.benchmarkPlan&&typeof preview.benchmarkUpdate.benchmarkPlan==='object'?preview.benchmarkUpdate.benchmarkPlan:null;
    var benchmarkUpdateNotice=null;
    if(applied&&benchmarkUpdate)benchmarkUpdateNotice=pushCallout(body,tr('个人 Benchmark 有更新待审阅','Personal Benchmark update to review'),tr('下方展示本次提案。提交只更新个人 Benchmark 目录，不会重新创建 BOT、重置空间或更改账户配置。','The proposal is shown below. Submitting updates only the personal Benchmark catalog; it does not recreate BOTs, reset the space or change account settings.'),'info');
    var facts=node('dl','ob-wp-facts');
    [['批次 ID','Batch ID',existing.batchId],['状态','Status',displayStatus(existing.status)],['工作区','Workspace',existing.name],['Space ID','Space ID',existing.spaceId],['BOT 数','BOTs',array(existing.botIds).length]].forEach(function(row){
      if(row[2]===undefined||row[2]===null||row[2]==='')return;
      facts.append(node('dt','',tr(row[0],row[1])),node('dd','',row[2]));
    });
    body.appendChild(facts);
    if(existing.backupPath){var location=node('details','ob-wp-path-details');location.append(node('summary','',tr('查看备份位置','View backup location')),node('code','ob-wp-path',existing.backupPath));body.appendChild(location);}
    var settings=applied?appendBotSettings(body,existing,session,onOpenSettings,onOpenResources,invoke,true,benchmarkUpdate):null;
    if(!applied||!benchmarkUpdate)return null;
    if(!String(preview.previewToken||'')){
      pushCallout(body,tr('无法提交更新','Update unavailable'),tr('此更新预览没有有效令牌。请取消并重新导入原方案文件以生成新预览。','This update preview has no valid token. Cancel and reimport the original plan to generate a fresh preview.'),'danger');
      return null;
    }
    var updateButton=makeButton(benchmarkPlanFrom(existing)?tr('更新个人 Benchmark','Update personal Benchmark'):tr('补充个人 Benchmark','Add personal Benchmark'),'ob-wp-primary');
    var busy=false;
    updateButton.addEventListener('click',async function(){
      if(busy||updateButton.disabled)return;
      busy=true;updateButton.disabled=true;setStatus(session,tr('正在保存个人 Benchmark…','Saving personal Benchmark…'),'info');
      try{
        if(typeof invoke!=='function')throw new Error(tr('宿主工作区接口不可用。','The host workspace interface is unavailable.'));
        var result=await invoke('update-benchmark',{previewToken:preview.previewToken});
        var confirmed=!!(result&&result.ok===true&&(result.benchmarkUpdated===true||result.duplicate===true));
        var resultBatch=result&&result.batch,storedPlan=benchmarkPlanFrom(resultBatch);
        var validBatch=!!(resultBatch&&resultBatch.batchId===existing.batchId&&resultBatch.status==='applied'&&storedPlan);
        if(!confirmed||!validBatch){
          busy=false;updateButton.disabled=false;
          var fallback=!confirmed?tr('宿主尚未确认 Benchmark 更新。可用同一预览重试，或取消后重新导入。','The host has not confirmed the Benchmark update. Retry with this preview or cancel and reimport.'):tr('更新回执缺少此已应用批次的已保存目录，结果未确认。请刷新批次状态或重新导入。','The receipt did not include the stored catalog for this applied batch. The result is unconfirmed; refresh batch status or reimport.');
          setStatus(session,valueText(result&&result.message,fallback),'error');return;
        }
        if(benchmarkUpdateNotice)benchmarkUpdateNotice.remove();
        if(settings)settings.remove();
        settings=appendBotSettings(body,resultBatch,session,onOpenSettings,onOpenResources,invoke,true,storedPlan);
        callCallback(onApplied,result);
        updateButton.textContent=result.duplicate?tr('个人 Benchmark 已保存','Personal Benchmark saved'):tr('个人 Benchmark 已更新','Personal Benchmark updated');
        setStatus(session,result.duplicate?tr('这是同一更新的幂等回执；宿主返回已保存目录。','This is an idempotent receipt for the same update; the host returned the stored catalog.'):tr('宿主已确认个人 Benchmark 更新。BOT 与账户配置未重建或更改。','The host confirmed the personal Benchmark update. BOTs and account settings were not recreated or changed.'),'success');
      }catch(error){
        busy=false;updateButton.disabled=false;
        setStatus(session,(error&&error.message?error.message+' · ':'')+tr('更新结果未确认。保留此预览，可重试或取消后重新导入。','The update result is unconfirmed. This preview is preserved; retry or cancel and reimport.'),'error');
      }
    });
    return updateButton;
  }
  function openPreview(options){
    options=options||{};
    var preview=options.preview||{},draft=cloneDraft(preview.draft),existing=preview.existing||null;
    if(!draft.bots.some(function(bot){return bot.roleId===draft.leaderRoleId&&bot.selected;})){
      var firstSelected=draft.bots.find(function(bot){return bot.selected;});draft.leaderRoleId=firstSelected?firstSelected.roleId:'';
    }
    var session=makeSession(tr('审阅 BOT 方案','Review BOT plan'),tr('调整名称、职责和 Harness 后再写入本地工作区。','Review names, responsibilities and harnesses before writing to the local workspace.'));
    var footerCancel=makeButton(tr('取消','Cancel'),'ob-wp-secondary',function(){session.close();});
    var applyButton=makeButton(tr('初始化空间','Initialize workspace'),'ob-wp-primary');
    var busy=false;
    var resuming=!!(existing&&existing.status==='initializing');
    function valid(){
      return preview.ok===true&&(!existing||resuming)&&(resuming||array(preview.conflicts).length===0)&&String(preview.previewToken||'').length>0&&draft.name.trim().length>0&&draft.bots.some(function(bot){return bot.selected;})&&draft.bots.some(function(bot){return bot.roleId===draft.leaderRoleId&&bot.selected;});
    }
    function refreshActionState(){applyButton.disabled=busy||!valid();}
    pushCallout(session.body,'',tr('初始化只创建可编辑的 BOT 配置。工具、屏幕与容器权限保持关闭；知识来源和账号仍未连接。真实任务尚未验收。','Setup creates editable BOT configurations only. Tools, screen and container permissions stay off; knowledge sources and accounts remain unconnected. Real tasks have not been verified.'),'info');
    renderPreviewWarnings(session.body,preview,resuming);
    function showApplied(result){
      callCallback(options.onApplied,result);
      session.body.replaceChildren();
      pushCallout(session.body,tr('初始化方案已写入','Plan applied'),tr('Bot Studio 已返回已应用批次回执。账号仍未连接，真实任务尚未验收。','Bot Studio returned an applied batch receipt. Accounts remain unconnected and real tasks have not been verified.'),'success');
      var facts=node('dl','ob-wp-facts');
      [['批次 ID','Batch ID',result.batch.batchId],['状态','Status',displayStatus(result.batch.status)],['工作区','Workspace',result.batch.name],['Space ID','Space ID',result.batch.spaceId],['BOT 数','BOTs',array(result.batch.botIds).length]].forEach(function(row){if(row[2]!==undefined&&row[2]!==null&&row[2]!=='')facts.append(node('dt','',tr(row[0],row[1])),node('dd','',row[2]));});
      session.body.appendChild(facts);
      session.body.appendChild(node('p','ob-wp-access-state',tr('账号/知识源未连接；工具/屏幕/容器权限未授予。','Accounts and knowledge sources are unconnected; tools, screen and containers are not enabled.')));
      var settingsBatch=result.batch.draft?result.batch:Object.assign({},result.batch,{draft:draft});
      appendBotSettings(session.body,settingsBatch,session,options.onOpenSettings,options.onOpenResources,options.invoke,true);
      setActions(session,[makeButton(tr('完成','Done'),'ob-wp-primary',function(){session.close();})]);setStatus(session,'','info');
    }
    async function applyPlan(){
      if(busy||!valid())return;
      busy=true;applyButton.disabled=true;setStatus(session,resuming?tr('正在继续同一初始化批次…','Resuming the same setup batch…'):tr('正在初始化空间…','Initializing workspace…'),'info');
      try{
        if(typeof options.invoke!=='function')throw new Error(tr('宿主工作区接口不可用。','The host workspace interface is unavailable.'));
        var result=await options.invoke('apply',{previewToken:preview.previewToken,draft:draft});
        if(result&&result.ok===false){busy=false;setStatus(session,valueText(result.message,tr('应用失败；草稿仍保留，可用同一预览令牌重试或取消。','Could not apply. The draft is preserved; retry with the same preview token or cancel.')),'error');refreshActionState();return;}
        if(!result||result.ok!==true){busy=false;setStatus(session,tr('没有收到应用结果。保留当前草稿与预览令牌，可安全重试或取消。','No application result was received. This draft and preview token are preserved; retry safely or cancel.'),'error');refreshActionState();return;}
        if(result.batch&&result.batch.batchId&&result.batch.status==='applied'){
          showApplied(result);return;
        }
        busy=false;setStatus(session,tr('批次尚未返回“已应用”状态。可用相同预览令牌和草稿继续初始化，或取消。','The batch is not yet marked applied. Continue with the same preview token and draft, or cancel.'),'warning');refreshActionState();
      }catch(error){
        busy=false;setStatus(session,(error&&error.message?error.message+' · ':'')+tr('草稿和预览令牌仍可用；同一请求可安全重试或取消。','The draft and preview token remain available; safely retry the same request or cancel.'),'error');refreshActionState();
      }
    }
    applyButton.addEventListener('click',applyPlan);
    if(existing){
      if(resuming){
        pushCallout(session.body,tr('初始化尚未完成','Setup is incomplete'),tr('继续操作会使用相同预览令牌和草稿，沿用这个耐久批次，不新建第二批。','Continue with the same preview token and draft. Bot Studio will reuse this durable batch instead of creating another.'),'warning');
        renderExistingPreview(session,existing,options.onOpenSettings,options.onOpenResources,options.invoke,preview,options.onApplied);
        applyButton.textContent=tr('继续初始化','Continue setup');
        setActions(session,[footerCancel,applyButton]);refreshActionState();return session.dialog;
      }
      var existingSettings=renderExistingPreview(session,existing,options.onOpenSettings,options.onOpenResources,options.invoke,preview,options.onApplied);
      setActions(session,[footerCancel].concat(existingSettings?[existingSettings]:[]));
      refreshActionState();
      return session.dialog;
    }
    if(!String(preview.previewToken||''))pushCallout(session.body,tr('预览已失效','Preview unavailable'),tr('预览令牌缺失；请取消并重新导入方案。','The preview token is missing. Cancel and import the plan again.'),'danger');
    var workspaceName=node('input','ob-wp-control');workspaceName.type='text';workspaceName.maxLength=120;workspaceName.required=true;workspaceName.value=draft.name;workspaceName.dataset.workspaceName='true';
    var planHeader=node('div','ob-wp-plan-header-row');
    planHeader.appendChild(addField(tr('工作区名称','Workspace name'),workspaceName,'ob-wp-workspace-name'));
    var selectedSummary=node('p','ob-wp-selection-summary');planHeader.appendChild(selectedSummary);
    session.body.appendChild(planHeader);
    appendBenchmarkPlan(session.body,draft.benchmarkPlan);
    workspaceName.addEventListener('input',function(){draft.name=workspaceName.value;refreshActionState();});
    function updateSelectedSummary(){
      selectedSummary.textContent=tr('已选择 ','Selected ')+draft.bots.filter(function(bot){return bot.selected;}).length+tr(' / '+draft.bots.length+' 个 BOT',' / '+draft.bots.length+' BOTs');
    }
    updateSelectedSummary();
    var botList=node('div','ob-wp-role-list');
    if(!draft.bots.length)pushCallout(botList,tr('没有 BOT 可配置','No BOTs to configure'),tr('预览没有返回角色清单。请取消并重新生成方案。','The preview returned no roles. Cancel and regenerate the plan.'),'danger');
    var roleCards=draft.bots.map(function(bot,index){return createRoleCard(bot,index,draft,session,function(){refreshActionState();});});
    roleCards.forEach(function(card){botList.appendChild(card);});
    session.body.appendChild(botList);
    session.body.addEventListener('input',function(){updateSelectedSummary();});
    session.body.addEventListener('change',function(event){if(event.target.matches('[data-include-role]'))updateSelectedSummary();});
    setActions(session,[footerCancel,applyButton]);
    refreshActionState();
    return session.dialog;
  }

  function resetSummaryView(parent,summary){
    var facts=node('dl','ob-wp-facts');
    [['空间','Workspace',summary.name],['BOT','BOTs',countLabel(summary.botCount,' 个',' bots')],['保留的历史消息','Messages retained',countLabel(summary.messageCount,' 条',' messages')],['保留的执行记录','Execution records retained',countLabel(summary.taskCount,' 条',' records')],['保留的空间任务','Workspace tasks retained',countLabel(summary.unifiedTaskCount||0,' 项',' tasks')],['保留的记忆','Memories retained',countLabel(summary.memoryCount,' 项',' memories')],['备份目录','Backup root',summary.backupRoot]].forEach(function(row){
      if(row[2]===undefined||row[2]===null||row[2]==='')return;
      facts.append(node('dt','',tr(row[0],row[1])),node('dd','',row[2]));
    });
    parent.appendChild(facts);
  }
  function manage(options){
    options=options||{};
    var session=makeSession(tr('工作区方案管理','Workspace plan management'),tr('查看已应用方案，并为单个初始化批次预览安全重置范围。','Review applied plans and preview the reset scope for one setup batch.'));
    var batches=[],pendingReset=null,lastResult=null,loading=false,currentReset=null;
    function footerClose(){return makeButton(tr('关闭','Close'),'ob-wp-secondary',function(){session.close();});}
    function showManageError(error){
      session.body.replaceChildren();
      pushCallout(session.body,tr('无法读取批次','Could not load batches'),error&&error.message||tr('请重试。','Try again.'),'danger');
      setStatus(session,'','error');
      setActions(session,[makeButton(tr('重试','Retry'),'ob-wp-primary',loadList),footerClose()]);
    }
    function batchRow(batch){
      var article=node('article','ob-wp-batch');
      var top=node('div','ob-wp-batch-head');top.append(node('h3','',batch.name||tr('未命名工作区','Untitled workspace')),node('span','ob-wp-state',displayStatus(batch.status)));article.appendChild(top);
      var meta=[];
      if(batch.spaceId)meta.push(tr('Space ID：','Space ID: ')+batch.spaceId);
      if(batch.batchId)meta.push(tr('批次：','Batch: ')+batch.batchId);
      meta.push(tr('BOT ','BOTs ')+array(batch.botIds).length);
      article.appendChild(node('p','ob-wp-batch-meta',meta.join(' · ')));
      if(batch.backupPath){var path=node('details','ob-wp-path-details');path.append(node('summary','',tr('查看备份位置','View backup location')),node('code','ob-wp-path',batch.backupPath));article.appendChild(path);}
      if(batch.status==='applied')appendBotSettings(article,batch,session,options.onOpenSettings,options.onOpenResources,options.invoke,false);
      var buttons=node('div','ob-wp-batch-actions');
      if(batch.status==='initializing'){
        if(typeof options.onContinueImport==='function')buttons.appendChild(makeButton(tr('重新导入原方案以继续','Reimport original plan to continue'),'ob-wp-secondary',function(){openSettings(session,options.onContinueImport,{batch:batch});}));
        else article.appendChild(node('p','ob-wp-batch-meta',tr('重新导入原方案文件即可继续此批次。','Reimport the original plan file to continue this batch.')));
      }
      if(batch.status==='applied'){
        var resetButton=makeButton(tr('预览重置…','Preview reset…'),'ob-wp-secondary',function(){previewReset(batch);});
        resetButton.disabled=loading||!!pendingReset;
        resetButton.title=pendingReset?tr('已有重置待处理。','A reset is already pending.'):'';
        buttons.appendChild(resetButton);
      }
      if(buttons.childElementCount)article.appendChild(buttons);return article;
    }
    function renderList(){
      session.title.textContent=tr('工作区方案管理','Workspace plan management');
      session.body.replaceChildren();
      if(pendingReset){
        var description=typeof pendingReset==='object'?valueText(pendingReset.message||pendingReset.status,''):'';
        pushCallout(session.body,tr('重置等待宿主处理','Reset pending with host'),description||tr('已有一个重置请求在处理中。请等待应用重启并在返回后查看状态。','A reset request is already in progress. Wait for the app to restart, then review its status.'),'warning');
      }
      if(lastResult&&lastResult.status==='reset'){
        pushCallout(session.body,tr('重置已完成','Reset complete'),lastResult.message||tr('宿主在重启后返回了重置完成记录。','The host returned a completed reset record after restart.'),'success');
        if(lastResult.backupPath){var completedBackup=node('details','ob-wp-path-details');completedBackup.append(node('summary','',tr('查看备份位置','View backup location')),node('code','ob-wp-path',lastResult.backupPath));session.body.appendChild(completedBackup);}
      }else if(lastResult&&lastResult.status==='cancelled'){
        pushCallout(session.body,tr('重置已取消','Reset cancelled'),(lastResult.message?lastResult.message+' · ':'')+tr('本次没有完成重置。若仍需重置，请重新预览范围后再试。','This reset did not complete. If you still want to reset, preview the scope again before retrying.'),'warning');
      }
      if(!batches.length){pushCallout(session.body,tr('还没有已应用的工作区方案','No applied workspace plans'),tr('完成一次方案应用后，批次会出现在这里。','Applied setup batches appear here.'),'info');}
      batches.forEach(function(batch){session.body.appendChild(batchRow(batch));});
      setActions(session,[makeButton(tr('刷新','Refresh'),'ob-wp-secondary',loadList),footerClose()]);
    }
    async function loadList(){
      if(loading)return;loading=true;setStatus(session,tr('正在读取方案批次…','Loading setup batches…'),'info');
      session.actions.querySelectorAll('button').forEach(function(button){button.disabled=true;});
      try{
        if(typeof options.invoke!=='function')throw new Error(tr('宿主工作区接口不可用。','The host workspace interface is unavailable.'));
        var result=await options.invoke('list',{});
        if(!result||result.ok!==true)throw new Error(valueText(result&&result.message,tr('无法读取方案列表。','Could not read the setup list.')));
        batches=array(result.batches);pendingReset=result.pendingReset||null;lastResult=result.lastResult||null;loading=false;setStatus(session,'','info');renderList();
      }catch(error){loading=false;showManageError(error);}
    }
    function renderResetPreview(batch,preview){
      currentReset={batch:batch,preview:preview};
      session.title.textContent=tr('预览空间重置','Preview workspace reset');
      session.body.replaceChildren();
      var summary=preview.summary||{};
      pushCallout(session.body,tr('重置范围','Reset scope'),tr('只移除此初始化批次创建的 BOT 和专属空间。重置开始前会先生成并验证完整备份；历史消息、任务和记忆归档，工作文件保留。其他空间及 Codex、DSH、Pi 的账户配置保留。Bot Studio 将安全退出并重启。','This removes only the BOTs and dedicated space created by this setup batch. A complete backup is created and verified first; historical messages, tasks and memories are archived; work files are retained. Other spaces and Codex, DSH and Pi account settings are kept. Bot Studio will safely quit and restart.'),'warning');
      resetSummaryView(session.body,summary);
      var conflicts=array(preview.conflicts);
      if(conflicts.length){var box=pushCallout(session.body,tr('当前无法重置','Reset is unavailable'),tr('宿主发现冲突；请取消操作并先解决。','The host found conflicts. Cancel and resolve them first.'),'danger');appendTextList(box,conflicts);}
      var ack=node('input','');ack.type='checkbox';ack.dataset.resetAcknowledgement='true';
      var ackLabel=node('label','ob-wp-reset-ack');ackLabel.append(ack,node('span','',tr('我已核对重置范围和备份要求。','I have reviewed the reset scope and backup requirement.')));session.body.appendChild(ackLabel);
      var retry=makeButton(tr('返回批次列表','Back to batches'),'ob-wp-secondary',function(){renderList();});
      var resetButton=makeButton(tr('备份并重启重置','Back up and restart to reset'),'ob-wp-danger');
      var busy=false;
      function update(){resetButton.disabled=busy||!ack.checked||conflicts.length>0||!preview.resetToken;}
      ack.addEventListener('change',update);resetButton.addEventListener('click',async function(){
        if(busy||!ack.checked||conflicts.length||!preview.resetToken)return;
        busy=true;update();setStatus(session,tr('正在请求宿主确认…','Requesting host confirmation…'),'info');
        try{
          if(typeof options.invoke!=='function')throw new Error(tr('宿主工作区接口不可用。','The host workspace interface is unavailable.'));
          var result=await options.invoke('reset',{resetToken:preview.resetToken,confirmation:'确认重置这个空间'});
          if(!result||result.ok!==true){
            busy=false;ack.checked=false;update();
            if(result&&(result.canceled||result.cancelled)){setStatus(session,tr('已取消；空间未重置。返回列表后可重新预览范围再试。','Cancelled. The space was not reset. Return to the list and preview the scope again to retry.'),'info');return;}
            setStatus(session,valueText(result&&result.message,tr('宿主没有安排重置；可重试或返回。','The host did not queue the reset. Retry or go back.')),'error');return;
          }
          session.body.replaceChildren();
          pushCallout(session.body,tr('正在安全退出并重启','Safely quitting and restarting'),tr('重置已交给宿主排队。备份验证和清理结果会在重启后通过批次列表回读；当前还不是完成回执。','The host queued the reset. Backup verification and cleanup results will be read from the batch list after restart; this is not yet a completion receipt.'),'warning');
          var resetState=typeof result.state==='object'&&result.state?result.state.status||result.state.phase||result.state.state:'';
          if(resetState||typeof result.state==='string')session.body.appendChild(node('p','ob-wp-reset-state',tr('宿主状态：','Host state: ')+valueText(resetState||result.state,'')));
          setStatus(session,'','info');
          setActions(session,[makeButton(tr('刷新批次状态','Refresh batch status'),'ob-wp-secondary',loadList),footerClose()]);
          pendingReset=result.pendingReset||{status:'pending'};
        }catch(error){
          busy=false;ack.checked=false;update();
          pushCallout(session.body,tr('没有收到重置回执','No reset receipt'),tr('备份和重置状态尚未确认。返回并刷新批次列表；只有在确认没有待处理重置后，再重新预览。','Backup and reset status are unconfirmed. Return and refresh the batch list; preview again only after confirming no reset is pending.'),'danger');
          setStatus(session,error&&error.message||tr('请求结果未知。','The request outcome is unknown.'),'error');
          setActions(session,[makeButton(tr('返回并刷新','Back and refresh'),'ob-wp-secondary',loadList),footerClose()]);
        }
      });
      setActions(session,[retry,resetButton]);update();
    }
    async function previewReset(batch){
      if(loading||pendingReset)return;loading=true;setStatus(session,tr('正在预览重置范围…','Previewing reset scope…'),'info');
      try{
        if(typeof options.invoke!=='function')throw new Error(tr('宿主工作区接口不可用。','The host workspace interface is unavailable.'));
        var preview=await options.invoke('reset-preview',{batchId:batch.batchId});
        if(!preview||preview.ok!==true)throw new Error(valueText(preview&&preview.message,tr('无法生成重置预览。','Could not preview the reset.')));
        loading=false;setStatus(session,'','info');renderResetPreview(batch,preview);
      }catch(error){loading=false;setStatus(session,error&&error.message||tr('无法预览重置。','Could not preview the reset.'),'error');renderList();setStatus(session,error&&error.message||tr('无法预览重置。','Could not preview the reset.'),'error');}
    }
    setActions(session,[footerClose()]);
    loadList();
    return session.dialog;
  }

  root.OpenBotWorkspacePlan={open:openPreview,manage:manage};
})(window);
