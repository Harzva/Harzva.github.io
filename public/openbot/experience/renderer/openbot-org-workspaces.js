(function(root){
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  // Compatibility for known system-owned unsupportedReason fields from workspace/meeting services.
  // Unknown and custom reasons remain source data; availability checks keep the original value.
  function reasonLabel(value){
    var copy=[
      ["该Bot的CLI/智能体会话尚未支持工作空间隔离，请选择API Bot。","This Bot’s CLI or agent session does not support space isolation yet. Choose an API Bot."],
      ["远端Bot尚未接通工作空间会话。","Remote Bots do not support space conversations yet."],
      ["会议暂不支持 CLI 或绑定智能体，请选择本机 API Bot。","Meetings do not support CLI or bound agents yet. Choose a local API Bot."],
      ["会议暂不支持远端或节点 Bot，请选择本机 API Bot。","Meetings do not support remote or node Bots yet. Choose a local API Bot."],
      ["会议不支持这个 Harness，请为 Bot 选择 DSH、Pi 或 legacy。","Meetings do not support this runtime. Choose DSH, Pi, or legacy for this Bot."]
    ];
    for(var i=0;i<copy.length;i++)if(value===copy[i][0])return tr(copy[i][0],copy[i][1]);
    return value;
  }
  function countLabel(value,zh,one,many){
    var english=typeof window==='object'&&window.OpenBotI18n&&window.OpenBotI18n.locale==='en';
    return english?new Intl.NumberFormat('en').format(Number(value))+' '+(Number(value)===1?one:(many||one+'s')):value+zh;
  }

  /*
   * This module deliberately owns a small, separate UI island.  It never
   * reads the ordinary Bot message or memory arrays.  The host supplies the
   * organization-scoped bridge; a missing method is surfaced as unavailable
   * instead of being replaced with a demo conversation.
   */
  var bridge = null;
  var onOpenBot = null;
  var initialized = false;
  var open = false;
  var lifeEpoch = 0;
  var viewEpoch = 0;
  var selectionEpoch = 0;
  var stateEpoch = 0;
  var composing = false;
  var refreshQueued = false;
  var focusBefore = null;
  var model = { revision:0, bots:[], spaces:[], instances:[] };
  var pane = null;
  var current = { spaceId:'', botId:'', mode:'group' };
  var showCreate = false;
  var stateBusy = false;
  var createDraft = { name:'', leaderBotId:'', memberBotIds:[] };
  var drafts = Object.create(null);
  var draftSelection = Object.create(null);
  var sendBusy = Object.create(null);
  var activeRuns = Object.create(null);
  var memoryUi = { open:false, editor:null, access:null };
  // Workspace Meta Profile is an independent, portable definition. Keep its
  // editor draft keyed by space so switching spaces never moves unsaved text
  // or role assignments into another workspace.
  var profileUi = { open:false, loading:false, saving:false, casConflict:false, spaceId:'', record:null, draft:null, imported:null };
  var profileDrafts = Object.create(null);
  var profileTicket = 0;
  // Shared class assets and per-space instance files use their own UI ticket.
  // Drafts are keyed by the Bot instance identity, so a late response can
  // never replace a draft from another space or mode.
  var assetsUi = {
    open:false, loading:false, busy:false, activeTab:'shared', spaceId:'', botId:'', key:'',
    catalog:null, binding:null, currentRelease:null, bindingError:'', catalogError:'', mutationNotice:'',
    files:null, filesError:'', fileLoading:false, fileConflict:false, fileConflictInfo:null, fileConflictLoading:false, fileServerSnapshot:null, fileMode:'new',
    fileName:'', fileContent:'', fileRevision:null, knowledgeDraft:'[]', skillsDraft:'[]',
    compareVersion:'', compareRelease:null, compareLoading:false
  };
  var assetsDrafts = Object.create(null);
  var assetsTicket = 0;
  var assetsUpgradeDismissed = Object.create(null);
  // Human reviewed experience candidates are bound to one space/Bot instance.
  // Keep editor drafts separate from the instance profile and class assets.
  var experienceUi = {
    loading:false,busy:false,error:'',notice:'',readbackRequired:false,stale:false,
    candidates:[],sources:[],spaceId:'',botId:'',key:'',mode:'new',selectedCandidateId:'',
    draft:null,baselineMaterial:null,baseRevision:null,baseDigest:'',source:null,
    reviewAck:false,reviewDecision:'accepted',reviewNote:'',ticket:0,sourceTicket:0,
    candidateSource:null,candidateSourceRunId:'',sourceLoadingRunId:'',sourceErrorRunId:'',sourceError:''
  };
  var experienceDrafts = Object.create(null);
  var experienceEpoch = 0;
  // Instance properties are a second, explicitly per-space editor inside the
  // existing assets surface. Keep drafts by instance identity across tab and
  // space changes; never treat class defaults as a live inheritance source.
  var instanceUi = {
    loading:false, saving:false, refreshing:false, blocked:false, conflict:false,
    spaceId:'', botId:'', scopeKey:'', key:'', instance:null, classDefaults:null,
    editableFields:[], providers:[], execution:null, baseProfile:null, baseRevision:null, draft:null,
    error:'', notice:'', conflictSnapshot:null, conflictReviewed:false,
    editVersion:0, ticket:0, advancedOpen:false, skillsOpen:false
  };
  var instanceDrafts = Object.create(null);
  var instanceScopeIndex = Object.create(null);
  var instanceTicket = 0;
  var view = 'chat';
  var chartController = null;
  var dashboardController = null;
  var dashboardSnapshot = null;
  var dashboardHealthSnapshot = null;
  var dashboardQuery = null;
  var dashboardEpoch = 0;
  var dom = Object.create(null);
  var unsubscribe = null;
  // The scoped conversation surface can temporarily leave the modal and live
  // inside the main chat column.  Keep one DOM owner so drafts, run epochs and
  // the existing scoped bridge calls are shared by both presentations.
  var inlineMounted = false;
  var inlineHost = null;
  var inlineRoot = null;
  var inlineSpaceSelect = null;
  var inlineSelectionRequired = false;
  var inlineResume = null;
  var onStateChange = null;
  var onSelectionChange = null;

  function el(tag, className, text){
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function attr(node, name, value){
    if (value === undefined || value === null) node.removeAttribute(name);
    else node.setAttribute(name, String(value));
    return node;
  }
  function button(id, className, text){
    var node = el('button', className, text);
    node.type = 'button';
    if (id) node.id = id;
    return node;
  }
  function safeText(value, fallback){
    var text = value === undefined || value === null ? '' : String(value);
    return text || (fallback || '');
  }
  function safeColor(value){
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#5b8cff';
  }
  function roleLabel(bot,role){
    if(typeof root.OpenBotRoleLabelFor==='function')return root.OpenBotRoleLabelFor(bot||null,role);
    var api=root.OpenBotRoleLabels,language=root.OpenBotI18n&&root.OpenBotI18n.locale==='en'?'en':'zh';
    if(api&&typeof api.resolveRoleLabel==='function')return api.resolveRoleLabel(root.OpenBotRoleLabelState||{},bot||null,role,language);
    return ({primary:tr('主 BOT','Memory BOT'),leader:tr('组长','Group lead'),member:tr('成员 BOT','Member BOT')})[role]||'Bot';
  }
  function normalizeRoleLabelOverrides(value){
    var api=root.OpenBotRoleLabels;
    return api&&typeof api.normalizeRoleLabels==='function'?api.normalizeRoleLabels(value):{};
  }
  function idFor(value){
    return value === undefined || value === null ? '' : String(value);
  }
  function uuid(){
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return 'org-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function apiCall(name, args){
    if (!bridge || typeof bridge[name] !== 'function') return Promise.reject(new Error(tr('工作空间服务尚未连接，请使用桌面版或重新连接节点。',"Spaces service is disconnected. Use the desktop app or reconnect the node.")));
    var result;
    try { result = args === undefined ? bridge[name]() : bridge[name](args); }
    catch (error) { return Promise.reject(error); }
    return Promise.resolve(result).then(function(value){
      if (value && value.ok === false) {
        var error = new Error(value.message || tr('工作空间请求失败',"Spaces request failed"));
        if (value.code) error.code = value.code;
        ['committed','readbackRequired','committedUncertain','commitUncertain','commitState'].forEach(function(key){if(value[key]!==undefined)error[key]=value[key];});
        throw error;
      }
      return value;
    });
  }
  function assetsKey(spaceId,botId){ return [idFor(spaceId),idFor(botId),'private'].join('|'); }
  function assetsIsCurrent(life,ticket,key){
    return open && life===lifeEpoch && assetsUi.open && ticket===assetsTicket && assetsUi.key===key && current.spaceId===assetsUi.spaceId && current.botId===assetsUi.botId && current.mode==='private';
  }
  function cloneAssetList(value){
    return Array.isArray(value) ? value.map(function(item){
      return item && typeof item==='object' ? Object.assign({},item) : item;
    }) : [];
  }
  function assetVersionText(value){
    var text=safeText(value);return !text||text==='0'?'':text;
  }
  // Keep the empty internal reference sentinel; only explicit host zero is displayed as v0.
  function assetBindingVersionLabel(binding){
    return binding&&binding.version?'v'+binding.version:binding&&binding.versionZero===true?'v0':'—';
  }
  function assetVersionValue(value){
    var number=Number(value);return Number.isSafeInteger(number)&&number>0?number:value;
  }
  function normalizeAssetKnowledge(value){
    return cloneAssetList(value).filter(function(item){return item&&typeof item==='object';}).map(function(item){
      return {id:safeText(item.id),title:safeText(item.title),text:safeText(item.text)};
    }).filter(function(item){return item.id||item.title||item.text;});
  }
  function normalizeAssetSkills(value){
    return cloneAssetList(value).filter(function(item){return item&&typeof item==='object';}).map(function(item){
      return {id:safeText(item.id),name:safeText(item.name),desc:safeText(item.desc)};
    }).filter(function(item){return item.id||item.name||item.desc;});
  }
  function normalizeAssetRelease(value){
    value=value&&typeof value==='object'?value:{};
    var knowledge=normalizeAssetKnowledge(value.knowledge),skills=normalizeAssetSkills(value.skills);
    return {version:assetVersionText(value.version),digest:safeText(value.digest),revoked:value.revoked===true,
      skillCount:Number.isSafeInteger(value.skillCount)?value.skillCount:skills.length,
      knowledgeCount:Number.isSafeInteger(value.knowledgeCount)?value.knowledgeCount:knowledge.length,
      knowledge:knowledge,skills:skills};
  }
  function normalizeAssetsSnapshot(value){
    value=value&&typeof value==='object'?value:{};
    var rawCatalog=value.catalog&&typeof value.catalog==='object'?value.catalog:{};
    var releases=Array.isArray(rawCatalog.releases)?rawCatalog.releases.map(normalizeAssetRelease).filter(function(item){return item.version; }):[];
    var rawBinding=value.binding&&typeof value.binding==='object'?value.binding:{};
    var disabled=Array.isArray(rawBinding.disabledSkillIds)?rawBinding.disabledSkillIds.map(idFor).filter(Boolean):[];
    var current=value.currentRelease&&typeof value.currentRelease==='object'?normalizeAssetRelease(value.currentRelease):null;
    return {
      catalog:{botId:idFor(rawCatalog.botId||value.botId),revision:Number.isSafeInteger(rawCatalog.revision)?rawCatalog.revision:0,
        latestVersion:assetVersionText(rawCatalog.latestVersion),releases:releases},
      binding:{version:assetVersionText(rawBinding.version),versionZero:rawBinding.version===0||rawBinding.version==='0',disabledSkillIds:disabled,instanceRevision:Number.isSafeInteger(rawBinding.instanceRevision)?rawBinding.instanceRevision:0},
      currentRelease:current,bindingError:safeText(value.bindingError)
    };
  }
  function normalizeAssetFiles(value){
    value=value&&typeof value==='object'?value:{};
    var files=Array.isArray(value.files)?value.files.filter(function(item){return item&&typeof item==='object'&&safeText(item.name);}).map(function(item){
      return {name:safeText(item.name),revision:Number.isSafeInteger(item.revision)?item.revision:0,bytes:Number.isSafeInteger(item.bytes)?item.bytes:0,sha256:safeText(item.sha256),deleted:item.deleted===true};
    }).filter(function(item){return item.deleted!==true;}):[];
    var tombstones=Array.isArray(value.tombstones)?value.tombstones.filter(function(item){return item&&typeof item==='object'&&safeText(item.name);}).map(function(item){
      return {name:safeText(item.name),revision:Number.isSafeInteger(item.revision)?item.revision:0};
    }):[];
    return {revision:Number.isSafeInteger(value.revision)?value.revision:0,files:files,tombstones:tombstones};
  }
  function assetJson(value){
    try{return JSON.stringify(value,null,2);}catch(_){return '[]';}
  }
  function parseAssetJson(value,kind){
    var parsed;
    try{parsed=JSON.parse(String(value||'').trim()||'[]');}catch(_){throw new Error(kind==='knowledge'?tr('知识必须是有效的 JSON 数组。',"Knowledge must be a valid JSON array."):tr('技能必须是有效的 JSON 数组。',"Skills must be a valid JSON array."));}
    if(!Array.isArray(parsed))throw new Error(kind==='knowledge'?tr('知识必须是 JSON 数组。',"Knowledge must be a JSON array."):tr('技能必须是 JSON 数组。',"Skills must be a JSON array."));
    // Preserve the edited payload exactly. The service owns strict shape and
    // size validation; shortening it here would silently publish different content.
    return parsed;
  }
  function supportedAssetFileName(name){ return /^[^/\\]+\.(?:md|csv|json|txt)$/i.test(String(name||'').trim()); }
  function fileTombstoneRevision(name){
    var list=assetsUi.files&&Array.isArray(assetsUi.files.tombstones)?assetsUi.files.tombstones:[],needle=String(name||'').toLocaleLowerCase('en-US');
    for(var i=0;i<list.length;i++)if(String(list[i].name).toLocaleLowerCase('en-US')===needle)return list[i].revision;
    return 0;
  }
  function activeAssetTombstone(name){
    var list=assetsUi.files&&Array.isArray(assetsUi.files.tombstones)?assetsUi.files.tombstones:[],needle=String(name||'').toLocaleLowerCase('en-US');
    for(var i=0;i<list.length;i++)if(String(list[i].name).toLocaleLowerCase('en-US')===needle)return list[i];
    return null;
  }
  function activeAssetFile(name){
    var list=assetsUi.files&&Array.isArray(assetsUi.files.files)?assetsUi.files.files:[],needle=String(name||'').toLocaleLowerCase('en-US');
    for(var i=0;i<list.length;i++)if(String(list[i].name).toLocaleLowerCase('en-US')===needle)return list[i];
    return null;
  }
  function cloneExperience(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(_){return value;}
  }
  function emptyExperienceDraft(runId){return {runId:safeText(runId),title:'',scope:'',criteria:'',knowledge:[],skills:[],reviewDecision:'accepted',reviewNote:''};}
  function experienceMaterial(draft){
    draft=draft&&typeof draft==='object'?draft:{};
    return {title:safeText(draft.title),scope:safeText(draft.scope),criteria:safeText(draft.criteria),
      knowledge:Array.isArray(draft.knowledge)?draft.knowledge.map(function(item){return {id:safeText(item&&item.id),title:safeText(item&&item.title),text:safeText(item&&item.text)};}):[],
      skills:Array.isArray(draft.skills)?draft.skills.map(function(item){return {id:safeText(item&&item.id),name:safeText(item&&item.name),desc:safeText(item&&item.desc)};}):[]};
  }
  function experienceMaterialKey(value){
    try{return JSON.stringify(experienceMaterial(value));}catch(_){return '';}
  }
  function experienceEditorKey(){return experienceUi.mode==='new'?'new':'candidate:'+idFor(experienceUi.selectedCandidateId);}
  function experienceSavedScope(key){
    var scope=experienceDrafts[key];
    if(!scope||typeof scope!=='object')scope=experienceDrafts[key]={selected:'new',editors:Object.create(null)};
    if(!scope.editors||typeof scope.editors!=='object')scope.editors=Object.create(null);
    return scope;
  }
  function experienceDraftDirty(){
    if(!experienceUi.draft)return false;
    var current=experienceMaterialKey(experienceUi.draft);
    if(experienceUi.mode==='new')return current!==experienceMaterialKey(emptyExperienceDraft(''))||!!safeText(experienceUi.draft.reviewNote);
    var candidate=experienceCurrentCandidate(),baseDecision=candidate&&candidate.review&&candidate.review.decision||'accepted';
    return current!==experienceMaterialKey(experienceUi.baselineMaterial||{})||!!safeText(experienceUi.draft.reviewNote)||safeText(experienceUi.draft.reviewDecision,'accepted')!==baseDecision;
  }
  function experienceMaterialDirty(){return !!(experienceUi.draft&&experienceUi.mode==='candidate'&&experienceMaterialKey(experienceUi.draft)!==experienceMaterialKey(experienceUi.baselineMaterial||{}));}
  function captureExperienceDraft(){
    if(!assetsUi.open||!assetsUi.key||experienceUi.key!==assetsUi.key||!experienceUi.draft)return;
    var scope=experienceSavedScope(assetsUi.key),editorKey=experienceEditorKey();
    scope.selected=editorKey;
    scope.editors[editorKey]={draft:cloneExperience(experienceUi.draft),baselineMaterial:cloneExperience(experienceUi.baselineMaterial||{}),
      baseRevision:experienceUi.baseRevision,baseDigest:experienceUi.baseDigest,stale:experienceUi.stale===true};
    scope.readbackRequired=experienceUi.readbackRequired===true;scope.pendingUnknown=cloneExperience(experienceUi.pendingUnknown||null);
  }
  function activateExperienceScope(key,spaceId,botId){
    captureExperienceDraft();
    experienceEpoch++;
    var saved=experienceDrafts[key]&&typeof experienceDrafts[key]==='object'?experienceDrafts[key]:{selected:'new',editors:Object.create(null)};
    var selected=safeText(saved.selected,'new'),mode=selected==='new'?'new':'candidate',candidateId=mode==='candidate'?selected.slice('candidate:'.length):'';
    var editor=saved.editors&&saved.editors[selected],draft=editor&&editor.draft?cloneExperience(editor.draft):emptyExperienceDraft('');
    experienceUi={loading:false,busy:false,error:'',notice:'',readbackRequired:saved.readbackRequired===true,pendingUnknown:cloneExperience(saved.pendingUnknown||null),stale:!!(editor&&editor.stale),
      candidates:[],sources:[],spaceId:idFor(spaceId),botId:idFor(botId),key:key,mode:mode,selectedCandidateId:candidateId,
      draft:draft,baselineMaterial:editor&&editor.baselineMaterial?cloneExperience(editor.baselineMaterial):mode==='new'?experienceMaterial(emptyExperienceDraft('')):null,
      baseRevision:editor&&Number.isSafeInteger(editor.baseRevision)?editor.baseRevision:null,baseDigest:safeText(editor&&editor.baseDigest),source:null,
      reviewAck:false,ticket:experienceEpoch,sourceTicket:0,candidateSource:null,candidateSourceRunId:'',sourceLoadingRunId:'',sourceErrorRunId:'',sourceError:''};
  }
  function experienceCandidate(id){return experienceUi.candidates.find(function(item){return item&&String(item.id)===String(id);})||null;}
  function experienceSource(runId){return experienceUi.sources.find(function(item){return item&&String(item.runId)===String(runId);})||null;}
  function experienceSourceOutput(source){
    if(!source||source.output===undefined||source.output===null)return '';
    if(typeof source.output==='string')return source.output;
    if(source.output&&typeof source.output.text==='string')return source.output.text;
    try{return JSON.stringify(source.output,null,2);}catch(_){return '';}
  }
  function experienceSourceMatchesCandidate(source,candidate){
    if(!source||!candidate||!candidate.source||!experienceSourceOutput(source))return false;
    return String(source.runId||'')===String(candidate.source.runId||'')&&
      String(source.outputDigest||'')===String(candidate.source.outputDigest||'')&&
      String(source.instanceId||'')===String(candidate.source.instanceId||'')&&
      Number(source.instanceRevision)===Number(candidate.source.instanceRevision)&&
      String(source.spaceId||'')===String(candidate.source.spaceId||'')&&
      String(source.botId||'')===String(candidate.source.botId||'');
  }
  function experienceCurrent(life,ticket,key,requestTicket){
    return assetsIsCurrent(life,ticket,key)&&experienceUi.key===key&&experienceUi.ticket===requestTicket;
  }
  function experienceEditorFor(mode,candidateId){
    experienceUi.mode=mode;experienceUi.selectedCandidateId=mode==='candidate'?idFor(candidateId):'';
    var key=mode==='new'?'new':'candidate:'+idFor(candidateId),scope=experienceSavedScope(experienceUi.key),saved=scope.editors[key];
    if(mode==='new'){
      experienceUi.draft=saved&&saved.draft?cloneExperience(saved.draft):emptyExperienceDraft('');
      experienceUi.baselineMaterial=saved&&saved.baselineMaterial?cloneExperience(saved.baselineMaterial):experienceMaterial(emptyExperienceDraft(''));
      experienceUi.baseRevision=null;experienceUi.baseDigest='';experienceUi.stale=false;
    }else{
      var candidate=experienceCandidate(candidateId);
      if(saved&&saved.draft){
        experienceUi.draft=cloneExperience(saved.draft);experienceUi.baselineMaterial=cloneExperience(saved.baselineMaterial||{});
        experienceUi.baseRevision=Number.isSafeInteger(saved.baseRevision)?saved.baseRevision:null;experienceUi.baseDigest=safeText(saved.baseDigest);
        experienceUi.stale=saved.stale===true||!candidate||experienceUi.baseRevision!==candidate.revision||experienceUi.baseDigest!==candidate.digest;
      }else if(candidate){
        experienceUi.draft=Object.assign(emptyExperienceDraft(candidate.source&&candidate.source.runId),experienceMaterial(candidate),{
          reviewDecision:candidate.review&&candidate.review.decision||'accepted',reviewNote:''});
        experienceUi.baselineMaterial=experienceMaterial(candidate);experienceUi.baseRevision=candidate.revision;experienceUi.baseDigest=safeText(candidate.digest);experienceUi.stale=false;
      }else{
        experienceUi.draft=emptyExperienceDraft('');experienceUi.baselineMaterial=experienceMaterial(emptyExperienceDraft(''));
        experienceUi.baseRevision=null;experienceUi.baseDigest='';experienceUi.stale=true;
      }
    }
    experienceUi.reviewAck=false;captureExperienceDraft();
  }
  function captureAssetsDraft(){
    if(!assetsUi.open||!assetsUi.key||!dom.assetsPanel||!dom.assetsPanel.isConnected)return;
    if(assetsUi.spaceId!==current.spaceId||assetsUi.botId!==current.botId||current.mode!=='private')return;
    captureExperienceDraft();
    var panel=dom.assetsPanel,knowledge=panel.querySelector('[data-assets-knowledge]'),skills=panel.querySelector('[data-assets-skills]'),name=panel.querySelector('[data-assets-file-name]'),content=panel.querySelector('[data-assets-file-content]');
    if(knowledge)assetsUi.knowledgeDraft=knowledge.value;
    if(skills)assetsUi.skillsDraft=skills.value;
    if(name)assetsUi.fileName=name.value;
    if(content)assetsUi.fileContent=content.value;
    assetsDrafts[assetsUi.key]={knowledgeDraft:assetsUi.knowledgeDraft,skillsDraft:assetsUi.skillsDraft,fileName:assetsUi.fileName,fileContent:assetsUi.fileContent,fileRevision:assetsUi.fileRevision,fileMode:assetsUi.fileMode,fileConflict:assetsUi.fileConflict};
  }
  function clearAssetsUi(){
    captureAssetsDraft();captureInstanceDraft();experienceEpoch++;experienceUi.loading=false;experienceUi.busy=false;experienceUi.ticket=experienceEpoch;experienceUi.sourceTicket++;experienceUi.candidateSource=null;experienceUi.candidateSourceRunId='';experienceUi.sourceLoadingRunId='';experienceUi.sourceErrorRunId='';experienceUi.sourceError='';assetsUi.open=false;assetsUi.loading=false;assetsUi.busy=false;assetsUi.fileLoading=false;assetsUi.catalog=null;assetsUi.binding=null;assetsUi.currentRelease=null;assetsUi.files=null;assetsUi.catalogError='';assetsUi.filesError='';assetsUi.bindingError='';assetsUi.mutationNotice='';assetsUi.fileConflict=false;assetsUi.fileConflictInfo=null;assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;assetsUi.fileRevision=null;assetsUi.fileMode='new';assetsUi.fileName='';assetsUi.fileContent='';assetsUi.compareVersion='';assetsUi.compareRelease=null;assetsUi.compareLoading=false;assetsUi.spaceId='';assetsUi.botId='';assetsUi.key='';assetsTicket++;instanceTicket++;instanceUi.ticket=instanceTicket;instanceUi.loading=false;instanceUi.saving=false;instanceUi.refreshing=false;instanceUi.blocked=false;instanceUi.conflict=false;instanceUi.spaceId='';instanceUi.botId='';instanceUi.scopeKey='';instanceUi.key='';instanceUi.instance=null;instanceUi.classDefaults=null;instanceUi.editableFields=[];instanceUi.providers=[];instanceUi.execution=null;instanceUi.baseProfile=null;instanceUi.baseRevision=null;instanceUi.draft=null;instanceUi.error='';instanceUi.notice='';instanceUi.conflictSnapshot=null;instanceUi.conflictReviewed=false;dom.assetsPanel=null;
  }
  function assetsDraftFor(key){
    var draft=assetsDrafts[key];
    return draft?{knowledgeDraft:safeText(draft.knowledgeDraft,'[]'),skillsDraft:safeText(draft.skillsDraft,'[]'),fileName:safeText(draft.fileName),fileContent:safeText(draft.fileContent),fileRevision:Number.isSafeInteger(draft.fileRevision)?draft.fileRevision:null,fileMode:draft.fileMode==='existing'?'existing':'new',fileConflict:draft.fileConflict===true}:{knowledgeDraft:'[]',skillsDraft:'[]',fileName:'',fileContent:'',fileRevision:null,fileMode:'new',fileConflict:false};
  }
  function instanceScopeKey(spaceId,botId){return [idFor(spaceId),idFor(botId)].join('|');}
  function instanceIdentityKey(spaceId,botId,instanceId){return [idFor(spaceId),idFor(botId),idFor(instanceId)].join('|');}
  function cloneInstanceValue(value){
    if(Array.isArray(value))return value.map(cloneInstanceValue);
    if(value&&typeof value==='object'){var copy={};Object.keys(value).forEach(function(key){copy[key]=cloneInstanceValue(value[key]);});return copy;}
    return value;
  }
  function stableInstanceValue(value){
    if(Array.isArray(value))return value.map(stableInstanceValue);
    if(value&&typeof value==='object'){var copy={};Object.keys(value).sort().forEach(function(key){copy[key]=stableInstanceValue(value[key]);});return copy;}
    return value;
  }
  function sameInstanceValue(a,b){return JSON.stringify(stableInstanceValue(a))===JSON.stringify(stableInstanceValue(b));}
  function normalizeInstanceProfile(value){
    value=value&&typeof value==='object'?value:{};
    return {
      name:safeText(value.name),persona:safeText(value.persona),avatar:safeText(value.avatar),color:safeColor(value.color),
      role:safeText(value.role),style:safeText(value.style),title:safeText(value.title),section:safeText(value.section),
      tags:Array.isArray(value.tags)?value.tags.filter(function(item){return item&&typeof item==='object';}).map(function(item){return {type:safeText(item.type,'custom'),label:safeText(item.label)};}).filter(function(item){return item.label;}):[],
      skills:Array.isArray(value.skills)?value.skills.filter(function(item){return item&&typeof item==='object';}).map(function(item,index){return {id:safeText(item.id,'instance-skill-'+index),name:safeText(item.name),desc:safeText(item.desc)};}).filter(function(item){return item.name||item.desc;}):[],
      model:safeText(value.model),providerId:safeText(value.providerId),temperature:Number.isFinite(Number(value.temperature))?Number(value.temperature):0.7,
      harness:safeText(value.harness),roleLabelOverrides:normalizeRoleLabelOverrides(value.roleLabelOverrides)
    };
  }
  function instanceProfileFrom(value){return normalizeInstanceProfile(value&&value.instance&&value.instance.profile);}
  function instanceEditable(field){return instanceUi.editableFields.indexOf(field)>=0;}
  function instanceScopeIsCurrent(ticket,spaceId,botId){return open&&ticket===instanceTicket&&assetsUi.open&&assetsUi.spaceId===spaceId&&assetsUi.botId===botId&&current.spaceId===spaceId&&current.botId===botId&&current.mode==='private';}
  function persistInstanceDraft(){
    if(!instanceUi.key||!instanceUi.draft)return;
    instanceDrafts[instanceUi.key]={profile:cloneInstanceValue(instanceUi.draft),baseProfile:instanceUi.baseProfile?cloneInstanceValue(instanceUi.baseProfile):null,baseRevision:Number.isSafeInteger(instanceUi.baseRevision)?instanceUi.baseRevision:null,needsReview:instanceUi.conflict===true,advancedOpen:instanceUi.advancedOpen===true,skillsOpen:instanceUi.skillsOpen===true};
    if(instanceUi.scopeKey)instanceScopeIndex[instanceUi.scopeKey]=instanceUi.key;
  }
  function captureInstanceDraft(){
    if(!assetsUi.open||!instanceUi.draft||!dom.assetsPanel||!dom.assetsPanel.isConnected)return;
    if(instanceUi.spaceId!==assetsUi.spaceId||instanceUi.botId!==assetsUi.botId)return;
    var form=dom.assetsPanel.querySelector('#org-workspaces-instance-form');if(!form)return;
    Array.prototype.forEach.call(form.querySelectorAll('[data-instance-field]'),function(control){
      var field=control.dataset.instanceField;
      if(field==='temperature')instanceUi.draft[field]=control.value===''?null:Number(control.value);
      else if(field!=='roleLabelOverrides'&&field!=='tags'&&field!=='skills')instanceUi.draft[field]=control.value;
    });
    persistInstanceDraft();
  }
  function setStatus(text, tone){
    [dom.status,dom.inlineStatus].forEach(function(target){
      if (!target) return;
      target.textContent = text ? String(text) : '';
      if (tone) target.dataset.tone = tone;
      else target.removeAttribute('data-tone');
    });
  }
  function botById(id){
    var key = idFor(id);
    for (var i=0;i<model.bots.length;i++) if (model.bots[i].id === key) return model.bots[i];
    return null;
  }
  function spaceById(id){
    var key = idFor(id);
    for (var i=0;i<model.spaces.length;i++) if (model.spaces[i].id === key) return model.spaces[i];
    return null;
  }
  function instanceFor(spaceOrId, botId){
    var spaceId=spaceOrId&&typeof spaceOrId==='object'?idFor(spaceOrId.id):idFor(spaceOrId),key=idFor(botId);
    if(!spaceId||!key||!Array.isArray(model.instances))return null;
    for(var i=0;i<model.instances.length;i++){
      var instance=model.instances[i];
      if(instance.spaceId===spaceId&&instance.botId===key)return instance;
    }
    return null;
  }
  // Class records are the directory source; an explicit space is required
  // before an instance can overlay its display identity. This keeps a card
  // rendered for space A from accidentally borrowing the current space B.
  function botForSpace(spaceOrId, botId){
    var classBot=botById(botId),instance=instanceFor(spaceOrId,botId);
    if(!classBot||!instance)return classBot;
    var scoped={id:classBot.id,name:safeText(instance.name,classBot.name),avatar:safeText(instance.avatar,classBot.avatar),
      color:safeColor(instance.color||classBot.color),model:safeText(instance.model),harness:safeText(instance.harness),
      instanceId:instance.instanceId,workspaceInstanceRevision:instance.revision,spaceId:instance.spaceId,classId:classBot.id};
    scoped.roleLabelOverrides=normalizeRoleLabelOverrides(instance.roleLabelOverrides||classBot.roleLabelOverrides);
    if(instance.sharedAssets&&typeof instance.sharedAssets==='object')scoped.sharedAssets={version:assetVersionText(instance.sharedAssets.version),disabledSkillIds:Array.isArray(instance.sharedAssets.disabledSkillIds)?instance.sharedAssets.disabledSkillIds.map(idFor).filter(Boolean):[]};
    if(Object.prototype.hasOwnProperty.call(instance,'sharedAssetsLatestVersion'))scoped.sharedAssetsLatestVersion=safeText(instance.sharedAssetsLatestVersion);
    if(Object.prototype.hasOwnProperty.call(instance,'sharedAssetsUpdateAvailable'))scoped.sharedAssetsUpdateAvailable=instance.sharedAssetsUpdateAvailable===true;
    if(Object.prototype.hasOwnProperty.call(instance,'sharedAssetsCatalogRevision'))scoped.sharedAssetsCatalogRevision=Number.isSafeInteger(instance.sharedAssetsCatalogRevision)?instance.sharedAssetsCatalogRevision:0;
    if(classBot.tags)scoped.tags=classBot.tags;
    if(Object.prototype.hasOwnProperty.call(instance,'unsupportedReason'))scoped.unsupportedReason=safeText(instance.unsupportedReason);
    else if(classBot.unsupportedReason)scoped.unsupportedReason=classBot.unsupportedReason;
    return scoped;
  }
  function normalizeState(value){
    value = value && typeof value === 'object' ? value : {};
    var next = { revision:Number.isSafeInteger(value.revision) ? value.revision : 0,
      organizationRevision:Number.isSafeInteger(value.organizationRevision) ? value.organizationRevision : 0,
      primaryBotId:idFor(value.primaryBotId), bots:[], spaces:[], instances:[], organization:null };
    (Array.isArray(value.bots) ? value.bots : []).forEach(function(raw){
      if (!raw || typeof raw !== 'object' || !raw.id) return;
      var item = {
        id:idFor(raw.id), name:safeText(raw.name, raw.id), avatar:safeText(raw.avatar, 'orbit'),
        color:safeColor(raw.color), model:safeText(raw.model), harness:safeText(raw.harness)
      };
      item.roleLabelOverrides=normalizeRoleLabelOverrides(raw.roleLabelOverrides);
      if (Object.prototype.hasOwnProperty.call(raw,'unsupportedReason')) item.unsupportedReason = safeText(raw.unsupportedReason);
      // Keep the optional field absent for legacy Bot records. The renderer
      // may normalize tags for display, but must not make an old object look
      // persisted with an empty tags array.
      if (Object.prototype.hasOwnProperty.call(raw,'tags')){
        if (root.OpenBotScope && typeof root.OpenBotScope.normalizeTags === 'function') item.tags = root.OpenBotScope.normalizeTags(raw.tags);
        else item.tags = Array.isArray(raw.tags) ? raw.tags.slice() : [];
      }
      if (next.bots.some(function(bot){ return bot.id === item.id; })) return;
      next.bots.push(item);
    });
    (Array.isArray(value.spaces) ? value.spaces : []).forEach(function(raw){
      if (!raw || typeof raw !== 'object' || !raw.id || !raw.name) return;
      var members = Array.isArray(raw.memberBotIds) ? raw.memberBotIds.map(idFor).filter(function(id){ return !!botByIdFrom(next.bots,id); }) : [];
      var leader = idFor(raw.leaderBotId);
      if (!members.length || members.indexOf(leader) < 0) return;
      next.spaces.push({
        id:idFor(raw.id), name:safeText(raw.name, tr('未命名空间',"Untitled space")), leaderBotId:leader,
        memberBotIds:members, temporaryBotIds:Array.isArray(raw.temporaryBotIds)?raw.temporaryBotIds.map(idFor):[], groupConversationId:idFor(raw.groupConversationId), tags:Array.isArray(raw.tags) ? raw.tags.slice() : []
      });
    });
    var seenInstanceIds=Object.create(null),seenInstancePairs=Object.create(null);
    (Array.isArray(value.instances) ? value.instances : []).forEach(function(raw){
      if(!raw||typeof raw!=='object')return;
      var instanceId=idFor(raw.instanceId).slice(0,300),spaceId=idFor(raw.spaceId),botId=idFor(raw.botId),classBot=botByIdFrom(next.bots,botId),space=null;
      for(var i=0;i<next.spaces.length;i++)if(next.spaces[i].id===spaceId){space=next.spaces[i];break;}
      if(!instanceId||!spaceId||!botId||!classBot||!space||space.memberBotIds.indexOf(botId)<0)return;
      var pair=spaceId+'\0'+botId;if(seenInstanceIds[instanceId]||seenInstancePairs[pair])return;
      seenInstanceIds[instanceId]=true;seenInstancePairs[pair]=true;
      var item={instanceId:instanceId,spaceId:spaceId,botId:botId,
        revision:Number.isSafeInteger(raw.revision)&&raw.revision>=0?raw.revision:0,
        name:safeText(raw.name,classBot.name).slice(0,120),avatar:safeText(raw.avatar,classBot.avatar).slice(0,300),
        color:/^#[0-9a-f]{6}$/i.test(String(raw.color||''))?String(raw.color):classBot.color,
        model:Object.prototype.hasOwnProperty.call(raw,'model')?safeText(raw.model).slice(0,160):classBot.model,
        harness:Object.prototype.hasOwnProperty.call(raw,'harness')?safeText(raw.harness).slice(0,80):classBot.harness};
      item.roleLabelOverrides=normalizeRoleLabelOverrides(raw.roleLabelOverrides||classBot.roleLabelOverrides);
      if(raw.sharedAssets&&typeof raw.sharedAssets==='object')item.sharedAssets={version:safeText(raw.sharedAssets.version),disabledSkillIds:Array.isArray(raw.sharedAssets.disabledSkillIds)?raw.sharedAssets.disabledSkillIds.map(idFor).filter(Boolean):[]};
      if(Object.prototype.hasOwnProperty.call(raw,'sharedAssetsLatestVersion'))item.sharedAssetsLatestVersion=safeText(raw.sharedAssetsLatestVersion);
      if(Object.prototype.hasOwnProperty.call(raw,'sharedAssetsUpdateAvailable'))item.sharedAssetsUpdateAvailable=raw.sharedAssetsUpdateAvailable===true;
      if(Object.prototype.hasOwnProperty.call(raw,'sharedAssetsCatalogRevision'))item.sharedAssetsCatalogRevision=Number.isSafeInteger(raw.sharedAssetsCatalogRevision)?raw.sharedAssetsCatalogRevision:0;
      if(Object.prototype.hasOwnProperty.call(raw,'unsupportedReason'))item.unsupportedReason=safeText(raw.unsupportedReason).slice(0,300);
      next.instances.push(item);
    });
    var suppliedOrganization = value.organization && typeof value.organization === 'object' ? value.organization : null;
    next.organization = {
      primaryBotId:next.primaryBotId,
      botIds:next.bots.map(function(bot){ return bot.id; }),
      spaces:next.spaces
    };
    if (suppliedOrganization && Array.isArray(suppliedOrganization.spaces)) next.organization.spaces = next.spaces;
    return next;
  }
  function botByIdFrom(list, id){
    for (var i=0;i<list.length;i++) if (list[i].id === id) return list[i];
    return null;
  }
  function normalizeView(value){
    value = value && typeof value === 'object' ? value : {};
    return {
      spaceId:idFor(value.spaceId), botId:idFor(value.botId), mode:value.mode === 'private' ? 'private' : 'group',
      conversationId:idFor(value.conversationId),
      messages:Array.isArray(value.messages) ? value.messages.filter(function(item){ return item && typeof item === 'object'; }).map(function(item){
        return { id:idFor(item.id), role:item.role === 'user' ? 'user' : 'assistant', speakerBotId:item.speakerBotId ? idFor(item.speakerBotId) : null,
          text:safeText(item.text), at:item.at, readerBotIds:Array.isArray(item.readerBotIds) ? item.readerBotIds.map(idFor) : [], runId:item.runId ? idFor(item.runId) : '' };
      }) : [],
      runs:Array.isArray(value.runs) ? value.runs.filter(function(item){ return item && typeof item === 'object'; }).map(function(item){
        return { id:idFor(item.id || item.runId), runId:idFor(item.runId || item.id), requestId:idFor(item.requestId), spaceId:idFor(item.spaceId), botId:idFor(item.botId), mode:item.mode === 'private' ? 'private' : 'group', conversationId:idFor(item.conversationId), status:safeText(item.status), error:safeText(item.error), startedAt:item.startedAt, endedAt:item.endedAt, usage:item.usage || null };
      }) : [],
      memories:Array.isArray(value.memories) ? value.memories.filter(function(item){ return item && typeof item === 'object'; }) : []
    };
  }
  function currentSpace(){ return spaceById(current.spaceId); }
  function currentBot(){ return botForSpace(current.spaceId,current.botId); }
  function conversationKey(){
    return [current.spaceId,current.botId,current.mode].join('|');
  }
  function rememberComposer(){
    if (!dom.composer) return null;
    // The selected pane may already have changed while the old textarea is
    // still mounted. Keep that draft with the pane that created it.
    var key = dom.composerKey || conversationKey();
    drafts[key] = dom.composer.value;
    draftSelection[key] = {
      start:typeof dom.composer.selectionStart === 'number' ? dom.composer.selectionStart : drafts[key].length,
      end:typeof dom.composer.selectionEnd === 'number' ? dom.composer.selectionEnd : drafts[key].length,
      focused:document.activeElement === dom.composer
    };
    return { key:key, value:drafts[key], selection:draftSelection[key] };
  }
  function avatarFor(bot, size){
    var host = el('span','org-workspaces-avatar');
    host.dataset.avatarSize = size || 'list';
    if(bot&&bot.id)host.dataset.botDragId=bot.id;
    host.setAttribute('aria-hidden','true');
    if (bot && root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function'){
      // Avatar markup is produced by the existing local avatar renderer. The
      // renderer normalizes IDs and tones before returning its trusted SVG.
      host.innerHTML = root.OpenBotAvatars.markup(bot.avatar, safeColor(bot.color), {size:size || 'list'});
    } else {
      host.textContent = Array.from(String(bot ? safeText(bot.name, '') : '').trim())[0] || '';
      if (!host.textContent || /^[?？]$/.test(host.textContent)) host.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
      host.style.background = bot ? safeColor(bot.color) : '#5b8cff';
    }
    return host;
  }
  function leaderName(space){
    var bot = space && botForSpace(space,space.leaderBotId);
    return bot ? bot.name : tr('未指定',"No ")+roleLabel(null,'leader')+tr('。',' assigned');
  }
  function statusLabel(status){
    return ({running:tr('执行中',"Running"),done:tr('已完成',"Completed"),cancelled:tr('已取消',"Canceled"),failed:tr('失败',"Failed"),interrupted:tr('已中断',"Interrupted")})[status] || tr('处理中',"Processing");
  }
  function formatTime(value){
    if (value === undefined || value === null || value === '') return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    try { return date.toLocaleTimeString(root.OpenBotI18n ? root.OpenBotI18n.locale : 'zh-CN', {hour:'2-digit',minute:'2-digit'}); }
    catch (_) { return ''; }
  }
  function memoryKindLabel(kind){
    return ({bot:tr('Bot 私有',"Private to Bot"), 'bot-space':tr('Bot × 空间',"Bot × Space"), space:tr('空间共享',"Shared in space"), shared:tr('指定 Bot 共享',"Shared with selected Bots")})[kind] || tr('记忆',"Memory");
  }
  function memoryRecords(){
    return pane && Array.isArray(pane.memories) ? pane.memories.filter(function(item){ return item && item.deleted !== true; }) : [];
  }
  function activeRun(){
    var key = conversationKey(), runId = activeRuns[key];
    var runs = pane && Array.isArray(pane.runs) ? pane.runs : [];
    if (runId){
      for (var i=0;i<runs.length;i++) if (runs[i].runId === runId && runs[i].status === 'running') return runs[i];
    }
    for (var j=runs.length-1;j>=0;j--) if (runs[j].status === 'running'){
      if (!runs[j].conversationId || runs[j].conversationId === (pane && pane.conversationId)){ activeRuns[key] = runs[j].runId; return runs[j]; }
    }
    if (runId) delete activeRuns[key];
    return null;
  }
  function activeUnsupported(){
    var bot = currentBot();
    return bot && bot.unsupportedReason ? reasonLabel(bot.unsupportedReason) : '';
  }
  function syncViewSwitch(){
    if (!dom.viewSwitch) return;
    var buttons = dom.viewSwitch.querySelectorAll('[role="tab"]');
    Array.prototype.forEach.call(buttons, function(button){
      var active = button.dataset.view === view;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }
  function destroyChart(){
    if (chartController && typeof chartController.destroy === 'function') chartController.destroy();
    chartController = null;
  }
  function destroyDashboard(){
    if (dashboardController && typeof dashboardController.destroy === 'function') dashboardController.destroy();
    dashboardController = null;
  }
  function openSpaceFromChart(target){
    var space = target && spaceById(target.spaceId);
    if (!space) return;
    view = 'chat';
    syncViewSwitch();
    rememberComposer();
    var botId = target.botId && space.memberBotIds.indexOf(idFor(target.botId)) >= 0 ? idFor(target.botId) : space.leaderBotId;
    current = { spaceId:space.id, botId:botId, mode:target.mode === 'private' ? 'private' : 'group' };
    pane = null;
    viewEpoch++;
    renderSpaces();
    renderConversation(true);
    loadCurrentView(lifeEpoch);
  }
  function openBotFromChart(botId){
    var callback = onOpenBot;
    closeDialog();
    if (typeof callback === 'function') setTimeout(function(){ callback(idFor(botId)); }, 0);
  }
  function openDashboardFromChart(target){
    var botId = target && target.botId ? idFor(target.botId) : '';
    dashboardQuery = {};
    if (target && target.view) dashboardQuery.view = target.view;
    if (botId) dashboardQuery.botId = botId;
    view = 'dashboard';
    showCreate = false;
    viewEpoch++;
    stateEpoch++;
    syncViewSwitch();
    renderMain();
    loadDashboardSnapshot(lifeEpoch);
  }
  function openBotFromDashboard(botId){
    var callback = onOpenBot;
    closeDialog();
    if (typeof callback === 'function') setTimeout(function(){ callback(idFor(botId)); }, 0);
  }
  function selectDashboardBot(botId){
    var id = idFor(botId);
    if (!id || view !== 'dashboard') return;
    dashboardQuery = Object.assign({},dashboardQuery||{}, { botId:id, scope:'class' });
    delete dashboardQuery.view;delete dashboardQuery.instanceId;delete dashboardQuery.spaceId;
    loadDashboardSnapshot(lifeEpoch);
  }
  function openSpaceFromDashboard(target){
    var spaceId = target && idFor(target.spaceId);
    if (!spaceId) return;
    // Dashboard rows are backed by the new snapshot and deliberately do not
    // hydrate the ordinary organization model. Switching to a conversation
    // is an explicit user action, so it is the point where the existing
    // orgWorkspaceState/orgWorkspaceView flow is allowed to resume.
    rememberComposer();
    view = 'chat';
    dashboardQuery = null;
    dashboardSnapshot = null;
    dashboardHealthSnapshot = null;
    dashboardEpoch++;
    showCreate = false;
    pane = null;
    current = { spaceId:spaceId, botId:idFor(target.botId), mode:target.mode === 'private' ? 'private' : 'group' };
    viewEpoch++;
    syncViewSwitch();
    renderMain();
    loadState();
  }
  function renderChartView(){
    destroyChart();
    destroyDashboard();
    var host = el('div','org-chart-host');
    host.id = 'org-chart-host';
    dom.main.appendChild(host);
    if (model.error){
      var unavailable=el('section','org-chart-service-unavailable');unavailable.id='org-chart-unavailable';unavailable.setAttribute('role','alert');
      unavailable.appendChild(el('strong','', tr('组织图暂不可用',"Organization chart unavailable")));
      unavailable.appendChild(el('span','', model.error));
      var retry=button('org-chart-retry','', tr('重试',"Retry"));retry.addEventListener('click',function(){loadState();});unavailable.appendChild(retry);host.appendChild(unavailable);return;
    }
    if (!root.OpenBotOrgChart || typeof root.OpenBotOrgChart.mount !== 'function'){
      host.appendChild(el('p','org-workspaces-error',tr('组织图模块未加载，请重新打开工作空间。',"Organization chart did not load. Reopen Spaces.")));
      return;
    }
    chartController = root.OpenBotOrgChart.mount(host, {
      snapshot:model,
      onOpenSpace:openSpaceFromChart,
      onOpenBot:openBotFromChart,
      onOpenDashboard:openDashboardFromChart,
      onRetry:function(){ loadState(); }
    });
  }
  function renderDashboardView(){
    destroyChart();
    destroyDashboard();
    var host = el('div','org-bot-dashboard-host');
    host.id = 'org-bot-dashboard-host';
    dom.main.appendChild(host);
    if (!root.OpenBotBotDashboard || typeof root.OpenBotBotDashboard.mount !== 'function') {
      host.appendChild(el('p','org-workspaces-error',tr('Bot 数据模块未加载，请重新打开工作空间。',"Bot data module did not load. Reopen Spaces.")));
      return;
    }
    dashboardController = root.OpenBotBotDashboard.mount(host, {
      snapshot:dashboardSnapshot || { loading:true },
      health:dashboardHealthSnapshot,
      query:dashboardQuery || {},
      onQueryChange:function(query){
        dashboardQuery=Object.assign({},dashboardQuery||{},query||{});
        if(dashboardQuery.range!=='custom'){delete dashboardQuery.from;delete dashboardQuery.to;}
        if(dashboardQuery.scope!=='instance')delete dashboardQuery.instanceId;
        loadDashboardSnapshot(lifeEpoch);
      },
      onOpenSpace:openSpaceFromDashboard,
      onOpenBot:openBotFromDashboard,
      onSelectBot:selectDashboardBot,
      onRefresh:function(){ loadDashboardSnapshot(lifeEpoch); }
    });
  }
  function setView(next){
    var nextView = next === 'chart' ? 'chart' : next === 'dashboard' ? 'dashboard' : 'chat';
    if (view === nextView){
      if (nextView === 'chart' && showCreate){ showCreate=false; renderMain(); }
      if (nextView === 'dashboard' && !dashboardQuery) dashboardQuery = current.botId ? { botId:current.botId } : {};
      syncViewSwitch();
      return;
    }
    rememberComposer();
    viewEpoch++;
    // The chart is an explicit browsing view. Leaving a create form must not
    // submit or mutate it; the existing createDraft remains intact so the
    // user can return to the form from the New button.
    if (nextView === 'chart' || nextView === 'dashboard') showCreate = false;
    if (nextView === 'dashboard' && !dashboardQuery) dashboardQuery = current.botId ? { botId:current.botId } : {};
    if (nextView === 'dashboard') stateEpoch++;
    view = nextView;
    syncViewSwitch();
    renderMain();
    if (view === 'dashboard') loadDashboardSnapshot(lifeEpoch);
    else loadState();
  }
  function createModal(){
    if (dom.overlay) return;
    var overlay = el('div'); overlay.id='org-workspaces-dialog'; overlay.hidden=true; overlay.setAttribute('aria-hidden','true');
    var win = el('section','org-workspaces-window'); win.setAttribute('role','dialog'); win.setAttribute('aria-modal','true'); win.setAttribute('aria-labelledby','org-workspaces-title'); win.setAttribute('aria-describedby','org-workspaces-subtitle');
    var header = el('header','org-workspaces-header');
    var heading = el('div','org-workspaces-heading');
    var title = el('h2','org-workspaces-title',tr('工作空间',"Spaces")); title.id='org-workspaces-title';
    var subtitle = el('p','org-workspaces-subtitle',tr('本工作空间只管理本机 Bot 与 Bot 空间，不代表真人团队或 Microsoft Teams；真人用户不作为 Bot 成员。记忆和会话按范围隔离。',"This workspace manages local Bots and Bot spaces only, not human teams or Microsoft Teams. Human users are not Bot members. Memory and conversations stay scoped.")); subtitle.id='org-workspaces-subtitle';
    heading.append(title,subtitle);
    var viewSwitch = el('div','org-workspaces-view-switch'); viewSwitch.setAttribute('role','tablist'); viewSwitch.setAttribute('aria-label',tr('工作空间视图',"Spaces view"));
    var chatView = button('org-workspaces-view-chat','', tr('对话',"Chat")); chatView.dataset.view='chat'; chatView.setAttribute('role','tab'); chatView.setAttribute('aria-selected','true'); chatView.addEventListener('click',function(){setView('chat');});
    var chartView = button('org-workspaces-view-chart','', tr('Bot 关系图',"Bot roles")); chartView.dataset.view='chart'; chartView.setAttribute('role','tab'); chartView.setAttribute('aria-selected','false'); chartView.addEventListener('click',function(){setView('chart');});
    var dashboardView = button('org-workspaces-view-dashboard','', tr('数据面板',"Dashboard")); dashboardView.dataset.view='dashboard'; dashboardView.setAttribute('role','tab'); dashboardView.setAttribute('aria-selected','false'); dashboardView.addEventListener('click',function(){setView('dashboard');});
    viewSwitch.append(chatView,chartView,dashboardView);
    var close = button('org-workspaces-close','org-workspaces-close','×'); close.setAttribute('aria-label',tr('关闭工作空间',"Close Spaces")); close.title=tr('关闭',"Close");
    header.append(heading,viewSwitch,close);
    var status = el('p','org-workspaces-status'); status.id='org-workspaces-status'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    var layout = el('div','org-workspaces-layout');
    var aside = el('aside','org-workspaces-spaces'); aside.setAttribute('aria-label',tr('空间列表',"Spaces list"));
    var spacesHead = el('div','org-workspaces-spaces-head');
    var spacesTitle = el('span','org-workspaces-spaces-title',tr('空间',"Space"));
    var newButton = button('org-workspaces-new','org-workspaces-new',tr('新建',"New"));
    spacesHead.append(spacesTitle,newButton);
    var spaceList = el('div','org-workspaces-space-list'); spaceList.id='org-workspaces-space-list';
    aside.append(spacesHead,spaceList);
    var main = el('main','org-workspaces-main'); main.id='org-workspaces-main';
    layout.append(aside,main);
    win.append(header,status,layout); overlay.appendChild(win); document.body.appendChild(overlay);
    overlay.dataset.botPageBlock='20';dom.overlay=overlay;dom.window=win;dom.status=status;dom.spaceList=spaceList;dom.main=main;dom.layout=layout;dom.close=close;dom.newButton=newButton;dom.viewSwitch=viewSwitch;
    syncViewSwitch();
    close.addEventListener('click',closeDialog);
    newButton.addEventListener('click',function(){
      // “新建” is a workspace-management action. If the Profile editor is
      // open, preserve its draft by space and leave the editor before showing
      // the creation form; otherwise the profile branch in renderMain would
      // correctly keep winning over the requested form.
      if(profileUi.open){captureProfileForm();if(profileUi.spaceId&&profileUi.draft)profileDrafts[profileUi.spaceId]=profileUi.draft;profileUi.open=false;profileUi.loading=false;profileUi.saving=false;profileUi.casConflict=false;profileTicket++;}
      showCreate=true; renderMain(); focusCreateName();
    });
    overlay.addEventListener('click',function(event){ if (event.target === overlay) closeDialog(); });
  }
  function renderSpaces(){
    if (dom.spaceList){
      dom.spaceList.replaceChildren();
      if (!model.spaces.length) dom.spaceList.appendChild(el('p','org-workspaces-muted',tr('还没有空间',"No spaces yet")));
      else model.spaces.forEach(function(space){
        var item = button('','org-workspaces-space-item'); item.dataset.spaceId=space.id; item.setAttribute('aria-current',String(space.id === current.spaceId));
        item.appendChild(avatarFor(botForSpace(space,space.leaderBotId),'mini'));
        var leader=botForSpace(space,space.leaderBotId);
        var copy=el('span','org-workspaces-space-copy'); copy.appendChild(el('span','org-workspaces-space-name',space.name)); copy.appendChild(el('span','org-workspaces-space-meta',roleLabel(leader,'leader')+' · '+leaderName(space))); item.appendChild(copy);
        item.appendChild(el('span','org-workspaces-count',String(space.memberBotIds.length)));
        item.addEventListener('click',function(){ selectSpace(space.id); });
        dom.spaceList.appendChild(item);
      });
    }
    renderInlineSpaceSelect();
  }
  function ensureCurrent(){
    if (!model.spaces.length){ current.spaceId=''; current.botId=''; return; }
    var space=currentSpace();
    if (!space){
      if (inlineMounted && inlineSelectionRequired){ current.spaceId=''; current.botId=''; return; }
      space=model.spaces[0]; current.spaceId=space.id; current.botId=space.leaderBotId; current.mode='group';
    }
    if (space.memberBotIds.indexOf(current.botId)<0) current.botId=space.leaderBotId;
    if (current.mode!=='private' && current.mode!=='group') current.mode='group';
  }
  function renderInlineSpaceSelect(){
    if (!inlineSpaceSelect) return;
    inlineSpaceSelect.replaceChildren();
    if (!model.spaces.length){
      var empty=el('option','',tr('没有可用空间',"No spaces available")); empty.value=''; inlineSpaceSelect.appendChild(empty);
      inlineSpaceSelect.value=''; inlineSpaceSelect.disabled=true;
    } else {
      model.spaces.forEach(function(space){
        var option=el('option','',space.name+' · '+countLabel(space.memberBotIds.length,' 个 Bot','Bot')); option.value=space.id; inlineSpaceSelect.appendChild(option);
      });
      inlineSpaceSelect.disabled=false; inlineSpaceSelect.value=current.spaceId || '';
    }
    if (inlineRoot){
      var count=inlineRoot.querySelector('.org-workspaces-inline-count');
      if (count) count.textContent=currentSpace() ? countLabel(currentSpace().memberBotIds.length,' 个 Bot','Bot') : tr('请选择一个空间',"Choose a space");
    }
  }
  function renderInlineEmpty(){
    dom.main.replaceChildren();
    dom.profilePanel=null;
    var panel=el('section','org-workspaces-inline-empty');
    panel.appendChild(el('h2','org-workspaces-empty-title',model.spaces.length?tr('选择一个空间',"Choose a space"):tr('还没有可用空间',"No spaces available yet")));
    panel.appendChild(el('p','org-workspaces-empty-note',model.spaces.length?tr('空间模式只显示所选空间的实际成员。请选择上方空间后开始这个空间的对话。',"Space mode shows only members of the selected space. Choose a space above to start chatting."):tr('当前没有空间成员范围；请先在工作空间中创建空间。',"No space is selected. Create a space in Spaces first.")));
    if (model.error) panel.appendChild(el('p','org-workspaces-error',model.error));
    dom.main.appendChild(panel);
  }
  function renderMain(options){
    options=options||{};
    ['botPage','botDropKind','botDropId','botDropLabel','botDropSpaceId'].forEach(function(key){delete dom.main.dataset[key];});
    var active = document.activeElement;
    var instanceFocus=captureInstanceFocus();
    var createFocus = active && active.closest && active.closest('#org-workspaces-create-form') ? {
      id:active.id || '', member:active.dataset && active.dataset.createMember ? active.dataset.createMember : ''
    } : null;
    captureProfileForm();
    if(options.captureAssets!==false)captureAssetsDraft();
    rememberComposer();
    destroyChart();
    destroyDashboard();
    if (dom.layout) dom.layout.classList.toggle('is-dashboard', view === 'dashboard');
    dom.main.replaceChildren();
    dom.profilePanel=null;
    if (view === 'dashboard' && !showCreate){
      renderDashboardView();
      return;
    }
    if (view === 'chart' && !showCreate){
      renderChartView();
      return;
    }
    if (assetsUi.open){
      if (assetsUi.loading&&assetsUi.activeTab!=='instance'){
        var assetsLoading=el('section','org-workspaces-assets-panel org-workspaces-assets-loading');
        assetsLoading.appendChild(el('p','org-workspaces-chat-empty',tr('正在读取当前实例资料…',"Loading this instance's assets…")));
        dom.main.appendChild(assetsLoading);dom.assetsPanel=assetsLoading;
      } else renderAssetsPanel();
      restoreInstanceFocus(instanceFocus);
      return;
    }
    if (profileUi.open){
      if (profileUi.loading){
        var loadingPanel=el('section','org-workspaces-profile-panel org-workspaces-profile-loading');
        loadingPanel.appendChild(el('h3','org-workspaces-profile-title',tr('Workspace Profile','Space Profile')));
        loadingPanel.appendChild(el('p','org-workspaces-chat-empty',tr('正在读取这个空间的 Profile…',"Loading this space's Profile…")));
        dom.main.appendChild(loadingPanel);
      } else renderProfilePanel();
      return;
    }
    if (inlineMounted){
      if (view === 'chart'){ renderChartView(); return; }
      if (!currentSpace()){ renderInlineEmpty(); return; }
      renderConversation(false);
      return;
    }
    if (showCreate || !model.spaces.length){
      renderCreatePanel();
      if (createFocus) setTimeout(function(){
        var target=createFocus.id ? document.getElementById(createFocus.id) : null;
        if (!target && createFocus.member) target=Array.prototype.find.call(dom.createPanel.querySelectorAll('input[data-create-member]'),function(input){return input.value===createFocus.member;});
        if(target && !target.disabled) target.focus({preventScroll:true});
      },0);
      return;
    }
    renderConversation(false);
  }
  function renderCreatePanel(){
    var panel=el('form','org-workspaces-create-panel'); panel.id='org-workspaces-create-form';
    panel.addEventListener('submit',submitCreate);
    panel.appendChild(el('h3','org-workspaces-create-heading',tr('新建工作空间',"New space")));
    var leadLabel=roleLabel(null,'leader'),memberLabel=roleLabel(null,'member');
    var createNote=root.OpenBotI18n&&root.OpenBotI18n.locale==='en'
      ? 'Name the space, select a '+leadLabel+', and choose its '+memberLabel+' Bots. The '+leadLabel+' is included automatically. Execution environments are requested as needed.'
      : '设置空间名称，选择'+leadLabel+'和'+memberLabel+'；'+leadLabel+'会自动计入'+memberLabel+'。执行环境按任务需要申请。';
    panel.appendChild(el('p','org-workspaces-create-note',createNote));
    var nameField=el('div','org-workspaces-field'); var nameLabel=el('label','', tr('名称',"Name")); nameLabel.htmlFor='org-workspaces-create-name'; nameField.appendChild(nameLabel); var name=el('input'); name.id='org-workspaces-create-name'; name.name='name'; name.maxLength=120; name.required=true; name.placeholder=tr('例如：产品研发',"e.g. Product development"); name.value=createDraft.name; name.addEventListener('input',function(){createDraft.name=name.value;}); nameField.appendChild(name); panel.appendChild(nameField);
    var leaderField=el('div','org-workspaces-field'); var leaderLabel=el('label','',roleLabel(null,'leader')); leaderLabel.htmlFor='org-workspaces-create-leader'; leaderField.appendChild(leaderLabel);
    var leader=el('select'); leader.id='org-workspaces-create-leader'; leader.name='leaderBotId'; leader.required=true;
    model.bots.forEach(function(bot){var option=el('option','',bot.name);option.value=bot.id;option.textContent=bot.name+(bot.unsupportedReason?tr(' · 暂不可用'," · Unavailable"):'');leader.appendChild(option);});
    if (!createDraft.leaderBotId || !botById(createDraft.leaderBotId)) createDraft.leaderBotId=model.bots[0] ? model.bots[0].id : '';
    leader.value=createDraft.leaderBotId; leader.addEventListener('change',function(){createDraft.leaderBotId=leader.value;syncCreateMembers(panel);}); leaderField.appendChild(leader); panel.appendChild(leaderField);
    var membersField=el('fieldset','org-workspaces-field'); membersField.appendChild(el('legend','',roleLabel(null,'member')));
    var memberList=el('div','org-workspaces-member-list');
    model.bots.forEach(function(bot){
      var label=el('label','org-workspaces-member-option'); var check=el('input'); check.type='checkbox';check.value=bot.id;check.dataset.createMember='true';check.checked=createDraft.memberBotIds.indexOf(bot.id)>=0 || bot.id===createDraft.leaderBotId;check.addEventListener('change',function(){createDraft.memberBotIds=checkedMembers(panel);}); label.append(check,el('span','',bot.name)); memberList.appendChild(label);
    });
    if (!model.bots.length) memberList.appendChild(el('p','org-workspaces-muted',tr('当前没有可加入的 Bot。',"No Bots are available to add.")));
    membersField.appendChild(memberList); panel.appendChild(membersField);
    panel.appendChild(el('p','org-workspaces-muted',tr('共享记忆和私有记忆在空间对话中按权限分别管理。',"Shared and private memory are managed separately by permissions in space conversations.")));
    var actions=el('div','org-workspaces-form-actions'); var cancel=button('org-workspaces-create-cancel','', tr('取消',"Cancel")); cancel.addEventListener('click',function(){ if(model.spaces.length){showCreate=false;renderMain();} }); var submit=button('org-workspaces-create-submit','org-workspaces-send',tr('创建空间',"Create space")); submit.type='submit';submit.disabled=!model.bots.length;actions.append(cancel,submit);panel.appendChild(actions);
    dom.main.appendChild(panel); syncCreateMembers(panel);
    dom.createName=name; dom.createLeader=leader; dom.createPanel=panel;
  }
  function checkedMembers(panel){
    return Array.prototype.map.call(panel.querySelectorAll('input[data-create-member]:checked'),function(input){return input.value;});
  }
  function syncCreateMembers(panel){
    if (!panel) return;
    var leader=panel.querySelector('#org-workspaces-create-leader'); var leaderId=leader && leader.value || '';
    Array.prototype.forEach.call(panel.querySelectorAll('input[data-create-member]'),function(input){
      if (input.value===leaderId){input.checked=true;input.disabled=true;} else input.disabled=false;
    });
    createDraft.memberBotIds=checkedMembers(panel); if (leaderId && createDraft.memberBotIds.indexOf(leaderId)<0) createDraft.memberBotIds.push(leaderId);
  }
  function focusCreateName(){ setTimeout(function(){if(dom.createName && !dom.createName.disabled)dom.createName.focus();},0); }
  function submitCreate(event){
    event.preventDefault();
    if (!model.bots.length) return;
    var name=(dom.createName && dom.createName.value || '').trim(),leader=dom.createLeader && dom.createLeader.value || '',members=checkedMembers(dom.createPanel);
    if (!name || !leader) { setStatus(tr('请填写空间名称并选择', 'Enter a name and choose a ')+roleLabel(null,'leader')+tr('。','.'),'error'); if(dom.createName && !name)dom.createName.focus(); return; }
    if (members.indexOf(leader)<0) members.push(leader);
    var ticket=lifeEpoch; var submit=dom.createPanel.querySelector('#org-workspaces-create-submit'); if(submit)submit.disabled=true;setStatus(tr('正在创建空间…',"Creating space…"));
    apiCall('orgWorkspaceCreate',{name:name,leaderBotId:leader,memberBotIds:members}).then(function(next){
      if(!open || ticket!==lifeEpoch)return;
      model=normalizeState(next);createDraft={name:'',leaderBotId:'',memberBotIds:[]};showCreate=false;ensureCurrent();renderSpaces();renderMain();setStatus(tr('空间已创建。',"Space created."),'ok');loadCurrentView(ticket);
    }).catch(function(error){setStatus(tr('创建失败：',"Creation failed: ")+safeText(error && error.message,error),'error');if(submit)submit.disabled=false;});
  }
  function profileCopy(value){
    try{return JSON.parse(JSON.stringify(value));}catch(_){return value;}
  }
  function profileId(value){
    var raw=idFor(value).trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);
    return raw || ('role-' + uuid().replace(/[^A-Za-z0-9_-]/g,'').slice(0,24));
  }
  function profileRole(raw,index){
    raw=raw&&typeof raw==='object'?raw:{};
    return { id:profileId(raw.id || ('role-'+(index+1))), name:safeText(raw.name,tr('新角色',"New role")).slice(0,120), instructions:safeText(raw.instructions).slice(0,2000) };
  }
  function normalizeProfileEditor(value, spaceName){
    value=value&&typeof value==='object'?value:{};
    var profile=value.profile&&typeof value.profile==='object'?value.profile:value;
    var baseRevision=Number.isSafeInteger(value.revision)?value.revision:0;
    var roles=Array.isArray(profile.roles)?profile.roles.slice(0,20).map(profileRole):[];
    var seen=Object.create(null);
    roles=roles.filter(function(role){if(seen[role.id])return false;seen[role.id]=true;return true;});
    var budget=profile.budget&&typeof profile.budget==='object'?profile.budget:{};
    var compute=['cpu','gpu','auto'].indexOf(profile.compute)>=0?profile.compute:'cpu';
    var bindings=value.bindings&&typeof value.bindings==='object'?value.bindings:{};
    var cleanBindings={};
    roles.forEach(function(role){var bot=idFor(bindings[role.id]);if(bot)cleanBindings[role.id]=bot;});
    return {schema:'openbot.workspace-meta-profile/1',name:safeText(profile.name,spaceName||'Workspace Profile').slice(0,120),goal:safeText(profile.goal).slice(0,2000),instructions:safeText(profile.instructions).slice(0,8000),roles:roles,dataRequirements:safeText(profile.dataRequirements).slice(0,4000),compute:compute,budget:{maxRounds:Number.isSafeInteger(budget.maxRounds)?budget.maxRounds:8,maxParallel:Number.isSafeInteger(budget.maxParallel)?budget.maxParallel:1},validation:safeText(profile.validation).slice(0,4000),bindings:cleanBindings,baseRevision:baseRevision};
  }
  function profileTemplate(spaceName){
    return normalizeProfileEditor({profile:{schema:'openbot.workspace-meta-profile/1',name:(spaceName||tr('数据分析',"Data analysis"))+' · AutoResearch',goal:tr('通用表格与业务数据库分析，围绕业务问题完成可复核的深挖与结论。',"Analyze spreadsheets and business databases to produce verifiable findings for business questions."),instructions:tr('先核对数据质量、粒度和口径，再提出可复核的 SQL 或 Python 分析建议；明确区分事实、假设和待验证项。',"Check data quality, grain, and definitions first, then propose reproducible SQL or Python analysis. Distinguish facts, assumptions, and open questions."),roles:[{id:'research-lead',name:tr('研究负责人',"Research lead"),instructions:tr('拆解问题、安排分析顺序，并维护结论与待验证项。',"Break down questions, sequence the analysis, and maintain findings and open questions.")},{id:'data-analyst',name:tr('数据分析师',"Data analyst"),instructions:tr('检查表格或业务数据库，完成分组、趋势、异常和驱动因素分析。',"Inspect spreadsheets or business databases, then analyze segments, trends, anomalies, and drivers.")},{id:'evidence-reviewer',name:tr('证据审查',"Evidence reviewer"),instructions:tr('复核来源、口径、计算和不确定性，指出证据缺口。',"Review sources, definitions, calculations, and uncertainty. Identify gaps in evidence.")}],dataRequirements:tr('请说明数据来源、时间范围、字段含义、更新频率、脱敏约束和允许的查询方式。',"Specify data sources, date range, field definitions, refresh frequency, privacy constraints, and permitted query methods."),compute:'cpu',budget:{maxRounds:8,maxParallel:1},validation:tr('每个结论都要能追溯到数据、查询或计算；报告中区分事实、推断和未验证假设。',"Trace every finding to data, queries, or calculations. Separate facts, inferences, and untested assumptions in reports.")}},spaceName);
  }
  function profileDraftFor(spaceId){
    return profileDrafts[idFor(spaceId)] || (profileUi.record ? normalizeProfileEditor(profileUi.record,currentSpace()&&currentSpace().name) : null);
  }
  function portableProfile(draft){
    draft=draft||{};
    return {schema:'openbot.workspace-meta-profile/1',name:safeText(draft.name).slice(0,120),goal:safeText(draft.goal).slice(0,2000),instructions:safeText(draft.instructions).slice(0,8000),roles:Array.isArray(draft.roles)?draft.roles.map(function(role){return {id:profileId(role.id),name:safeText(role.name).slice(0,120),instructions:safeText(role.instructions).slice(0,2000)};}):[],dataRequirements:safeText(draft.dataRequirements).slice(0,4000),compute:['cpu','gpu','auto'].indexOf(draft.compute)>=0?draft.compute:'cpu',budget:{maxRounds:Math.max(1,Math.min(100,Number(draft.budget&&draft.budget.maxRounds)||1)),maxParallel:Math.max(1,Math.min(10,Number(draft.budget&&draft.budget.maxParallel)||1))},validation:safeText(draft.validation).slice(0,4000)};
  }
  function profileBindings(draft){
    var result={};
    Object.keys((draft&&draft.bindings)||{}).forEach(function(roleId){var botId=idFor(draft.bindings[roleId]);if(botId)result[roleId]=botId;});
    return result;
  }
  function profileBotOptions(select,space){
    if(!select||!space)return;
    select.replaceChildren();
    var none=el('option','',tr('暂不分配',"Unassigned"));none.value='';select.appendChild(none);
    space.memberBotIds.forEach(function(id){var bot=botForSpace(space,id);if(!bot)return;var option=el('option','',bot.name);option.value=id;if(bot.model)option.title=bot.name+' · '+bot.model;select.appendChild(option);});
  }
  function captureProfileForm(){
    if(!profileUi.open||profileUi.loading||!profileUi.draft||!dom.profilePanel||!dom.profilePanel.isConnected||dom.profilePanel.dataset.profileSpaceId!==profileUi.spaceId||!currentSpace()||currentSpace().id!==profileUi.spaceId)return;
    var form=dom.profilePanel;
    var draft=profileUi.draft;
    ['name','goal','instructions','dataRequirements','validation'].forEach(function(key){var node=form.querySelector('[data-profile-field="'+key+'"]');if(node)draft[key]=node.value;});
    var compute=form.querySelector('[data-profile-field="compute"]');if(compute)draft.compute=compute.value;
    var rounds=form.querySelector('[data-profile-field="maxRounds"]');if(rounds)draft.budget.maxRounds=Math.max(1,Math.min(100,Number(rounds.value)||1));
    var parallel=form.querySelector('[data-profile-field="maxParallel"]');if(parallel)draft.budget.maxParallel=Math.max(1,Math.min(10,Number(parallel.value)||1));
    Array.prototype.forEach.call(form.querySelectorAll('[data-profile-role]'),function(row){var id=row.dataset.profileRole;var role=draft.roles.filter(function(item){return item.id===id;})[0];if(!role)return;var name=row.querySelector('[data-role-field="name"]'),instructions=row.querySelector('[data-role-field="instructions"]'),bot=row.querySelector('[data-role-field="bot"]');if(name)role.name=name.value;if(instructions)role.instructions=instructions.value;if(bot)draft.bindings[id]=bot.value;});
  }
  function profileField(labelText,key,value,tagName,placeholder){
    var field=el('div','org-workspaces-field org-workspaces-profile-field');var label=el('label','',labelText);label.htmlFor='org-workspaces-profile-'+key;field.appendChild(label);var input=el(tagName||'input');input.id='org-workspaces-profile-'+key;input.dataset.profileField=key;if(placeholder)input.placeholder=placeholder;input.value=value||'';if(tagName==='textarea')input.rows=key==='goal'?3:key==='instructions'?5:3;field.appendChild(input);return field;
  }
  function renderProfilePanel(){
    var space=currentSpace(),draft=profileUi.draft;
    dom.main.replaceChildren();
    if(!space){profileUi.open=false;profileUi.loading=false;profileUi.saving=false;profileUi.casConflict=false;renderMain();return;}
    var panel=el('section','org-workspaces-profile-panel');panel.id='org-workspaces-profile-panel';panel.dataset.profileSpaceId=space.id;panel.setAttribute('aria-labelledby','org-workspaces-profile-title');
    var top=el('div','org-workspaces-profile-top');var heading=el('div','org-workspaces-profile-heading');heading.appendChild(el('h3','org-workspaces-profile-title','Workspace Profile'));heading.appendChild(el('p','org-workspaces-profile-subtitle',space.name+tr(' · 这个空间自己的目标、角色和验收标准'," · Goals, roles, and acceptance criteria for this space")));var actions=el('div','org-workspaces-profile-actions');
    var back=button('org-workspaces-profile-back','', tr('返回对话',"Back to chat"));back.addEventListener('click',closeProfileEditor);var template=button('org-workspaces-profile-template','', tr('数据分析模板',"Data analysis template"));template.title=tr('加载通用数据分析 AutoResearch 草稿',"Load a general data analysis AutoResearch draft");template.addEventListener('click',function(){captureProfileForm();var base=Number.isSafeInteger(draft.baseRevision)?draft.baseRevision:(profileUi.record&&Number.isSafeInteger(profileUi.record.revision)?profileUi.record.revision:0);profileUi.draft=profileTemplate(space.name);profileUi.draft.baseRevision=base;profileDrafts[space.id]=profileUi.draft;renderProfilePanel();setStatus(tr('模板已加载到草稿，保存后才会写入空间。',"Template loaded into the draft. Save to apply it to this space."),'ok');});
    var importButton=button('org-workspaces-profile-import','', tr('导入 JSON',"Import JSON"));importButton.addEventListener('click',importProfileDraft);var exportButton=button('org-workspaces-profile-export','', tr('导出已保存',"Export saved Profile"));exportButton.addEventListener('click',exportSavedProfile);actions.append(back,template,importButton,exportButton);top.append(heading,actions);panel.appendChild(top);
    var note=el('p','org-workspaces-profile-note',tr('仅保存空间配置；不会携带聊天、文件、密钥、运行历史或实际权限。GPU 与预算字段只是需求声明，当前聊天仍是一轮一 Bot，不会自动申请设备或启动并行调度。',"Only space configuration is saved. Chats, files, secrets, run history, and actual permissions are excluded. GPU and budget fields declare requirements only. Chat still uses one Bot per turn and does not request hardware or schedule parallel work automatically."));panel.appendChild(note);
    panel.appendChild(profileField(tr('名称',"Name"),'name',draft.name,'input',tr('例如：数据分析 AutoResearch',"e.g. Data analysis AutoResearch")));
    panel.appendChild(profileField(tr('目标',"Goal"),'goal',draft.goal,'textarea',tr('这个空间要解决什么问题？',"What should this space accomplish?")));
    panel.appendChild(profileField(tr('工作说明',"Working instructions"),'instructions',draft.instructions,'textarea',tr('先做什么，如何组织协作？',"What comes first, and how should members collaborate?")));
    var rolesSection=el('section','org-workspaces-profile-section');var rolesHead=el('div','org-workspaces-profile-section-head');rolesHead.appendChild(el('h4','', tr('角色与成员',"Roles and members")));var addRole=button('org-workspaces-profile-add-role','', tr('添加角色',"Add role"));addRole.disabled=draft.roles.length>=20;addRole.title=addRole.disabled?tr('已达到 20 个角色上限',"Maximum of 20 roles reached"):tr('添加一个空间角色',"Add a role to this space");addRole.addEventListener('click',function(){if(draft.roles.length>=20)return;captureProfileForm();var role=profileRole({id:'role-'+uuid().slice(0,8),name:tr('新角色',"New role"),instructions:''},draft.roles.length);draft.roles.push(role);draft.bindings[role.id]='';renderProfilePanel();});rolesHead.appendChild(addRole);rolesSection.appendChild(rolesHead);rolesSection.appendChild(el('p','org-workspaces-profile-help',tr('同一个 Bot 可在不同空间承担不同角色；成员选择只限于当前空间。',"A Bot can have different roles in different spaces. Choose only members of this space.")));
    var roleList=el('div','org-workspaces-profile-role-list');draft.roles.forEach(function(role,index){var row=el('article','org-workspaces-profile-role');row.dataset.profileRole=role.id;var rowHead=el('div','org-workspaces-profile-role-head');var roleTitle=el('strong','',role.name||tr('新角色',"New role"));rowHead.appendChild(roleTitle);var remove=button('','', tr('移除',"Remove"));remove.addEventListener('click',function(){captureProfileForm();draft.roles=draft.roles.filter(function(item){return item.id!==role.id;});delete draft.bindings[role.id];renderProfilePanel();});rowHead.appendChild(remove);row.appendChild(rowHead);
      var nameField=profileField(tr('角色名称',"Role name"),'role-name-'+role.id,role.name,'input',tr('例如：数据分析师',"e.g. Data analyst"));nameField.querySelector('input').dataset.roleField='name';row.appendChild(nameField);var instField=profileField(tr('角色说明',"Role description"),'role-instructions-'+role.id,role.instructions,'textarea',tr('这个角色负责什么？',"What is this role responsible for?"));instField.querySelector('textarea').dataset.roleField='instructions';row.appendChild(instField);var memberField=el('div','org-workspaces-field');var memberLabel=el('label','', tr('绑定空间成员',"Assign a space member"));var member=el('select');member.id='org-workspaces-profile-role-bot-'+role.id;member.dataset.roleField='bot';memberLabel.htmlFor=member.id;memberField.appendChild(memberLabel);profileBotOptions(member,space);member.value=draft.bindings[role.id]||'';member.addEventListener('change',function(){draft.bindings[role.id]=member.value;});memberField.appendChild(member);row.appendChild(memberField);roleList.appendChild(row);});rolesSection.appendChild(roleList);panel.appendChild(rolesSection);
    var advanced=el('details','org-workspaces-profile-advanced');advanced.open=true;advanced.appendChild(el('summary','', tr('数据、计算与预算声明',"Data, compute, and budget requirements")));var advancedBody=el('div','org-workspaces-profile-advanced-body');advancedBody.appendChild(profileField(tr('数据要求',"Data requirements"),'dataRequirements',draft.dataRequirements,'textarea',tr('来源、字段、时间范围、口径和脱敏约束',"Sources, fields, date range, definitions, and privacy constraints")));
    var computeField=el('div','org-workspaces-field');var computeLabel=el('label','', tr('计算需求',"Compute requirements"));computeLabel.htmlFor='org-workspaces-profile-compute';computeField.appendChild(computeLabel);var compute=el('select');compute.id='org-workspaces-profile-compute';compute.dataset.profileField='compute';[['cpu',tr('CPU / API（默认）',"CPU / API (default)")],['gpu',tr('GPU（仅需求声明）',"GPU (requirement only)")],['auto',tr('按任务需要',"As tasks require")]].forEach(function(item){var option=el('option','',item[1]);option.value=item[0];compute.appendChild(option);});compute.value=draft.compute;computeField.appendChild(compute);advancedBody.appendChild(computeField);
    var budget=el('div','org-workspaces-profile-budget');var rounds=profileField(tr('最多轮次（声明）',"Maximum rounds (declared)"),'maxRounds',draft.budget.maxRounds,'input','8');rounds.querySelector('input').type='number';rounds.querySelector('input').min='1';rounds.querySelector('input').max='100';var parallel=profileField(tr('并行上限（声明）',"Concurrency limit (declared)"),'maxParallel',draft.budget.maxParallel,'input','1');parallel.querySelector('input').type='number';parallel.querySelector('input').min='1';parallel.querySelector('input').max='10';budget.append(rounds,parallel);advancedBody.appendChild(budget);advancedBody.appendChild(profileField(tr('验收标准',"Acceptance criteria"),'validation',draft.validation,'textarea',tr('结论如何复核？如何区分事实、假设与待验证项？',"How can findings be verified? How should facts, assumptions, and open questions be distinguished?")));advanced.appendChild(advancedBody);panel.appendChild(advanced);
    var foot=el('div','org-workspaces-profile-footer');var revision=profileUi.record&&Number(profileUi.record.revision)>0?tr('已保存 v',"Saved v")+String(profileUi.record.revision):tr('尚未保存',"Not saved yet");foot.appendChild(el('span','org-workspaces-profile-revision',revision));var footerActions=el('div','org-workspaces-form-actions');if(profileUi.casConflict){var reload=button('org-workspaces-profile-reload','', tr('重新载入（放弃草稿）',"Reload (discard draft)"));reload.title=tr('读取最新版本并丢弃当前草稿',"Load the latest version and discard this draft");reload.addEventListener('click',reloadProfileBase);footerActions.appendChild(reload);}var cancel=button('org-workspaces-profile-cancel','', tr('取消',"Cancel"));cancel.addEventListener('click',closeProfileEditor);var save=button('org-workspaces-profile-save','org-workspaces-send',tr('保存 Profile',"Save Profile"));save.type='button';save.addEventListener('click',saveProfileDraft);footerActions.append(cancel,save);foot.appendChild(footerActions);panel.appendChild(foot);
    dom.main.appendChild(panel);dom.profilePanel=panel;
    if(profileUi.saving){Array.prototype.forEach.call(panel.querySelectorAll('input,textarea,select,button'),function(control){control.disabled=true;});}
  }
  function openProfileEditor(){
    var space=currentSpace();if(!space)return;rememberComposer();profileUi.open=true;profileUi.loading=true;profileUi.saving=false;profileUi.casConflict=false;profileUi.spaceId=space.id;profileUi.imported=null;profileUi.record=null;profileUi.draft=profileDrafts[space.id]||null;renderMain();var ticket=++profileTicket,life=lifeEpoch;setStatus(tr('正在读取空间 Profile…',"Loading space Profile…"));apiCall('orgWorkspaceProfile',{spaceId:space.id}).then(function(record){if(!open||life!==lifeEpoch||ticket!==profileTicket||!profileUi.open||profileUi.spaceId!==space.id)return;profileUi.record=record&&record.profile?record:record;var cached=profileDrafts[space.id]||null;var serverRevision=Number.isSafeInteger(record&&record.revision)?record.revision:0;var cachedRevision=Number.isSafeInteger(cached&&cached.baseRevision)?cached.baseRevision:0;profileUi.casConflict=!!cached&&cachedRevision!==serverRevision;profileUi.draft=cached||normalizeProfileEditor(record,space.name);if(!Number.isSafeInteger(profileUi.draft.baseRevision))profileUi.draft.baseRevision=cachedRevision;profileDrafts[space.id]=profileUi.draft;profileUi.loading=false;renderMain();setStatus(profileUi.casConflict?tr('Profile 已在其他地方更新；当前草稿已保留，请保存或重新载入。',"Profile was updated elsewhere. Your draft is preserved; save it or reload."):'');}).catch(function(error){if(!open||life!==lifeEpoch||ticket!==profileTicket)return;profileUi.loading=false;profileUi.draft=profileDrafts[space.id]||profileTemplate(space.name);if(!Number.isSafeInteger(profileUi.draft.baseRevision))profileUi.draft.baseRevision=0;profileDrafts[space.id]=profileUi.draft;renderMain();setStatus(tr('读取 Profile 失败：',"Failed to load Profile: ")+safeText(error&&error.message,error),'error');});
  }
  function closeProfileEditor(){captureProfileForm();if(profileUi.spaceId&&profileUi.draft)profileDrafts[profileUi.spaceId]=profileUi.draft;profileUi.open=false;profileUi.loading=false;profileUi.saving=false;profileUi.casConflict=false;profileUi.imported=null;profileTicket++;renderMain();setStatus('');}
  function saveProfileDraft(){
    var space=currentSpace();if(!space||!profileUi.draft||profileUi.saving)return;captureProfileForm();profileDrafts[space.id]=profileUi.draft;var expected=Number.isSafeInteger(profileUi.draft.baseRevision)?profileUi.draft.baseRevision:0,ticket=++profileTicket,life=lifeEpoch;profileUi.saving=true;setStatus(tr('正在保存空间 Profile…',"Saving space Profile…"));renderProfilePanel();apiCall('orgWorkspaceProfileSave',{spaceId:space.id,expectedRevision:expected,profile:portableProfile(profileUi.draft),bindings:profileBindings(profileUi.draft)}).then(function(record){if(!open||life!==lifeEpoch||ticket!==profileTicket||!profileUi.open)return;if(record&&record.profile)profileUi.record=record;else profileUi.record=record;profileUi.draft=normalizeProfileEditor(record,space.name);profileDrafts[space.id]=profileUi.draft;profileUi.saving=false;profileUi.casConflict=false;renderMain();setStatus(tr('Workspace Profile 已保存。',"Space Profile saved."),'ok');}).catch(function(error){if(!open||life!==lifeEpoch||ticket!==profileTicket)return;profileUi.saving=false;profileUi.casConflict=error&&error.code==='STALE_REVISION';renderProfilePanel();setStatus(profileUi.casConflict?tr('Profile 已被其他编辑更新；草稿已保留，请选择“重新载入（放弃草稿）”后再编辑。',"Profile was updated by another editor. Your draft is preserved. Choose “Reload (discard draft)” before editing again."):tr('保存失败：',"Save failed: ")+safeText(error&&error.message,error)+tr('；草稿已保留。',". Your draft is preserved."),'error');});
  }
  function reloadProfileBase(){
    var space=currentSpace();if(!space)return;
    if(typeof root.confirm==='function'&&!root.confirm(tr('重新载入最新 Profile？当前草稿会被放弃。',"Reload the latest Profile and discard this draft?")))return;
    var ticket=++profileTicket,life=lifeEpoch;profileUi.loading=true;profileUi.saving=false;setStatus(tr('正在重新载入最新 Profile…',"Reloading latest Profile…"));renderMain();
    apiCall('orgWorkspaceProfile',{spaceId:space.id}).then(function(record){if(!open||life!==lifeEpoch||ticket!==profileTicket||!profileUi.open||profileUi.spaceId!==space.id)return;profileUi.record=record;profileUi.draft=normalizeProfileEditor(record,space.name);profileDrafts[space.id]=profileUi.draft;profileUi.loading=false;profileUi.casConflict=false;renderMain();setStatus(tr('已载入最新 Profile。',"Latest Profile loaded."),'ok');}).catch(function(error){if(!open||life!==lifeEpoch||ticket!==profileTicket)return;profileUi.loading=false;renderMain();setStatus(tr('重新载入失败：',"Reload failed: ")+safeText(error&&error.message,error),'error');});
  }
  function applyImportedProfile(result){
    var space=currentSpace();if(!space||!result||!result.profile)return;captureProfileForm();var base=Number.isSafeInteger(profileUi.draft&&profileUi.draft.baseRevision)?profileUi.draft.baseRevision:(profileUi.record&&Number.isSafeInteger(profileUi.record.revision)?profileUi.record.revision:0);var imported=normalizeProfileEditor({profile:result.profile},space.name);imported.baseRevision=base;imported.bindings={};profileUi.draft=imported;profileDrafts[space.id]=imported;profileUi.imported=true;renderProfilePanel();setStatus(tr('已导入到草稿；请为当前成员重新分配角色并保存。',"Imported into the draft. Reassign roles to current members and save."),'ok');}
  function importProfileDraft(){
    var space=currentSpace();if(!space)return;captureProfileForm();var targetSpaceId=space.id,ticket=++profileTicket,life=lifeEpoch;setStatus(tr('正在选择 Profile 文件…',"Choosing a Profile file…"));apiCall('orgWorkspaceProfileImport',{spaceId:targetSpaceId}).then(function(result){if(!open||life!==lifeEpoch||ticket!==profileTicket||!profileUi.open||profileUi.spaceId!==targetSpaceId||!currentSpace()||currentSpace().id!==targetSpaceId)return;if(result&&result.canceled){setStatus(tr('已取消导入。',"Import canceled."));return;}applyImportedProfile(result);}).catch(function(error){if(open&&life===lifeEpoch&&ticket===profileTicket&&profileUi.spaceId===targetSpaceId)setStatus(tr('导入失败：',"Import failed: ")+safeText(error&&error.message,error),'error');});
  }
  function exportSavedProfile(){
    var space=currentSpace();if(!space)return;var ticket=lifeEpoch;setStatus(tr('正在导出已保存的 Profile…',"Exporting saved Profile…"));apiCall('orgWorkspaceProfileExport',{spaceId:space.id}).then(function(result){if(!open||ticket!==lifeEpoch)return;setStatus(result&&result.path?tr('已导出：',"Exported: ")+result.path:tr('Profile 已导出。',"Profile exported."),'ok');}).catch(function(error){if(open&&ticket===lifeEpoch)setStatus(tr('导出失败：',"Export failed: ")+safeText(error&&error.message,error),'error');});
  }
  function assetRelease(version){
    var releases=assetsUi.catalog&&Array.isArray(assetsUi.catalog.releases)?assetsUi.catalog.releases:[],needle=assetVersionText(version);
    for(var i=0;i<releases.length;i++)if(releases[i].version===needle)return releases[i];
    return null;
  }
  function compareAssetVersions(left,right){
    var a=String(left||'').split(/[^0-9]+/).filter(Boolean).map(Number),b=String(right||'').split(/[^0-9]+/).filter(Boolean).map(Number),length=Math.max(a.length,b.length);
    if(!a.length||!b.length)return String(left||'').localeCompare(String(right||''));
    for(var i=0;i<length;i++){var av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv?1:-1;}
    return 0;
  }
  function latestAvailableAssetVersion(catalog,bindingVersion){
    var releases=catalog&&Array.isArray(catalog.releases)?catalog.releases:[],best=null;releases.forEach(function(item){if(!item||item.revoked||!item.version)return;if(bindingVersion&&compareAssetVersions(item.version,bindingVersion)<=0)return;if(!best||compareAssetVersions(item.version,best.version)>0)best=item;});return best;
  }
  function currentUpgradeVersion(){
    var instance=instanceFor(current.spaceId,current.botId);if(!instance||instance.sharedAssetsUpdateAvailable!==true)return '';
    return assetVersionText(instance.sharedAssetsLatestVersion);
  }
  function assetDiffSummary(oldRelease,newRelease){
    var oldItems=oldRelease&&Array.isArray(oldRelease.knowledge)?oldRelease.knowledge:[],newItems=newRelease&&Array.isArray(newRelease.knowledge)?newRelease.knowledge:[];
    function diff(a,b,fields){var oldMap=Object.create(null),added=0,removed=0,changed=0;a.forEach(function(item,index){var id=safeText(item&&item.id)||('__index_'+index);oldMap[id]=item;});var seen=Object.create(null);b.forEach(function(item,index){var id=safeText(item&&item.id)||('__index_'+index);seen[id]=true;if(!oldMap[id])added++;else if(fields.some(function(field){return safeText(oldMap[id][field])!==safeText(item&&item[field]);}))changed++;});Object.keys(oldMap).forEach(function(id){if(!seen[id])removed++;});return {added:added,removed:removed,changed:changed};}
    var oldSkills=oldRelease&&Array.isArray(oldRelease.skills)?oldRelease.skills:[],newSkills=newRelease&&Array.isArray(newRelease.skills)?newRelease.skills:[];
    return {knowledge:diff(oldItems,newItems,['title','text']),skills:diff(oldSkills,newSkills,['name','desc'])};
  }
  function assetDiffEntries(oldItems,newItems,fields){
    oldItems=Array.isArray(oldItems)?oldItems:[];newItems=Array.isArray(newItems)?newItems:[];
    var oldMap=Object.create(null),newMap=Object.create(null),order=[];
    oldItems.forEach(function(item,index){var id=safeText(item&&item.id)||('__index_'+index);if(!Object.hasOwn(oldMap,id))order.push(id);oldMap[id]=item;});
    newItems.forEach(function(item,index){var id=safeText(item&&item.id)||('__index_'+index);if(!Object.hasOwn(newMap,id))newMap[id]=item;});
    Object.keys(newMap).forEach(function(id){if(!Object.hasOwn(oldMap,id))order.push(id);});
    return order.map(function(id){var oldItem=oldMap[id],newItem=newMap[id],change=oldItem&&newItem?'changed':newItem?'added':'removed';if(change==='changed'&&!fields.some(function(field){return safeText(oldItem[field])!==safeText(newItem[field]);}))return null;return {id:id,change:change,oldItem:oldItem||null,newItem:newItem||null};}).filter(Boolean);
  }
  function assetItemEvidence(identity){
    var details=document.createElement('details');details.className='org-workspaces-assets-item-evidence';
    details.appendChild(el('summary','',tr('查看条目标识','View item ID')));
    details.appendChild(el('code','org-workspaces-assets-item-id',safeText(identity)));
    return details;
  }
  function assetDiffItemText(kind,item){
    if(!item)return '—';
    var title=safeText(kind==='knowledge'?item.title:item.name),body=safeText(kind==='knowledge'?item.text:item.desc),lines=[];
    if(title)lines.push(tr(kind==='knowledge'?'标题：':'名称：',kind==='knowledge'?'title: ':'name: ')+title);
    if(body)lines.push(tr(kind==='knowledge'?'正文：':'说明：',kind==='knowledge'?'text: ':'desc: ')+body);
    return lines.join('\n')||'—';
  }
  function renderAssetDiffDetails(oldRelease,newRelease){
    var details=document.createElement('details');details.id='org-workspaces-assets-diff-details';details.className='org-workspaces-assets-diff-details';details.open=false;
    details.appendChild(el('summary','',tr('查看详细变化',"View detailed changes")));
    var body=el('div','org-workspaces-assets-diff-body');
    [['knowledge','知识变更','Knowledge changes',['title','text']],['skills','技能变更','Skill changes',['name','desc']]].forEach(function(group){
      var oldItems=oldRelease&&Array.isArray(oldRelease[group[0]])?oldRelease[group[0]]:[],newItems=newRelease&&Array.isArray(newRelease[group[0]])?newRelease[group[0]]:[],entries=assetDiffEntries(oldItems,newItems,group[3]),section=el('section','org-workspaces-assets-diff-group');
      section.appendChild(el('h5','',tr(group[1],group[2])));
      if(!entries.length){section.appendChild(el('p','org-workspaces-muted',tr('没有内容变化。','No content changes.')));}
      entries.forEach(function(entry){
        var row=el('article','org-workspaces-assets-diff-row');row.dataset.assetsDiffChange=entry.change;
        var head=el('div','org-workspaces-assets-diff-row-head');head.appendChild(el('span','org-workspaces-assets-diff-change',tr({added:'新增',changed:'修改',removed:'删除'}[entry.change],{added:'Added',changed:'Changed',removed:'Removed'}[entry.change])));row.appendChild(head);
        if(entry.id.indexOf('__index_')!==0)row.appendChild(assetItemEvidence(entry.id));
        var values=el('div','org-workspaces-assets-diff-values');
        var old=el('div','org-workspaces-assets-diff-side');old.appendChild(el('span','org-workspaces-assets-diff-side-label',tr('旧版本','Previous')));old.appendChild(el('pre','org-workspaces-assets-diff-value',assetDiffItemText(group[0],entry.oldItem)));values.appendChild(old);
        var next=el('div','org-workspaces-assets-diff-side');next.appendChild(el('span','org-workspaces-assets-diff-side-label',tr('新版本','New')));next.appendChild(el('pre','org-workspaces-assets-diff-value',assetDiffItemText(group[0],entry.newItem)));values.appendChild(next);
        row.appendChild(values);section.appendChild(row);
      });
      body.appendChild(section);
    });
    details.appendChild(body);return details;
  }
  function renderAssetTargetPreview(release){
    var details=document.createElement('details');details.id='org-workspaces-assets-target-preview';details.className='org-workspaces-assets-target-preview';details.open=true;
    details.appendChild(el('summary','',tr('查看目标版本内容',"View target version content")));
    var body=el('div','org-workspaces-assets-target-body');
    [['knowledge','知识内容','Knowledge content'],['skills','技能内容','Skill content']].forEach(function(group){
      var items=release&&Array.isArray(release[group[0]])?release[group[0]]:[],section=el('section','org-workspaces-assets-target-group');
      section.appendChild(el('h5','',tr(group[1],group[2])));
      if(!items.length)section.appendChild(el('p','org-workspaces-muted',tr('这个类别没有内容。','No content in this category.')));
      items.forEach(function(item,index){
        var row=el('article','org-workspaces-assets-target-row');row.dataset.assetsTargetItem=group[0];
        var identity=safeText(item&&item.id);if(identity)row.appendChild(assetItemEvidence(identity));
        row.appendChild(el('pre','org-workspaces-assets-diff-value',assetDiffItemText(group[0],item)));section.appendChild(row);
      });
      body.appendChild(section);
    });
    details.appendChild(body);return details;
  }
  function assetsActionButton(text,handler,primary){
    var node=button('','org-workspaces-assets-button'+(primary?' primary':''),text);if(typeof handler==='function')node.addEventListener('click',handler);return node;
  }
  function renderAssetsShared(panel){
    var catalog=assetsUi.catalog||{revision:0,latestVersion:'',releases:[]},binding=assetsUi.binding||{version:'',disabledSkillIds:[],instanceRevision:0},release=assetsUi.currentRelease&&assetsUi.currentRelease.revoked!==true?assetsUi.currentRelease:null,baseUnavailable=!!binding.version&&!release,mutationDisabled=assetMutationDisabled();
    var note=el('p','org-workspaces-assets-note',tr('共享资料属于 Bot 类；绑定版本只作用于当前空间的这个 Bot 实例。不会从私有记忆自动填充，也不会因为发布而自动升级实例。',"Shared assets belong to the Bot class; a binding applies only to this Bot instance in the current space. Private memory is never filled in automatically, and publishing never upgrades an instance."));panel.appendChild(note);
    if(assetsUi.catalogError)panel.appendChild(el('p','org-workspaces-assets-warning',assetsUi.catalogError));
    var role=el('div','org-workspaces-assets-role-note');role.appendChild(el('span','org-workspaces-assets-role-label',tr('操作主体说明',"Control scope")));role.appendChild(el('span','org-workspaces-assets-role-tag',tr('用户拥有者 · 当前面板',"Owner UI · this panel")));role.appendChild(el('span','org-workspaces-assets-role-tag',tr('Agent 主脑 · 全部 Bot profile',"Agent primary · all Bot profiles")));role.appendChild(el('span','org-workspaces-assets-role-tag',tr('Agent 空间组长 · 当前空间实例',"Agent space lead · current space instance")));role.appendChild(el('span','org-workspaces-assets-role-copy',tr('面板操作由本机拥有者发起；Agent 的设置请求仍由服务端按角色校验。',"Panel actions are initiated by the local owner; Agent configuration requests remain subject to server-side role checks.")));panel.appendChild(role);
    if(assetsUi.compareVersion){var compare=el('section','org-workspaces-assets-update');var compareHead=el('div','org-workspaces-assets-section-head');compareHead.appendChild(el('h4','',tr('共享能力可更新',"Shared capability update")));compareHead.appendChild(el('span','org-workspaces-assets-meta',tr('当前 '+assetBindingVersionLabel(binding)+' → v'+assetsUi.compareVersion,"Current "+assetBindingVersionLabel(binding)+" → v"+assetsUi.compareVersion)));compare.appendChild(compareHead);if(assetsUi.compareLoading)compare.appendChild(el('p','org-workspaces-muted',tr('正在读取变化…',"Reading changes…")));else if(assetsUi.compareRelease){var upgrade=assetsActionButton(tr('采用 v'+assetsUi.compareVersion+'（仅当前实例）',"Adopt v"+assetsUi.compareVersion+" (this instance only)"),function(){upgradeAssetVersion(assetsUi.compareVersion);},true);upgrade.id='org-workspaces-assets-upgrade';upgrade.disabled=mutationDisabled;if(baseUnavailable){compare.appendChild(el('p','org-workspaces-assets-warning',tr('当前绑定的旧版本不可用，无法完整比较；以下展示目标版本内容。',"The bound previous version is unavailable, so a complete comparison is not possible. The target version content is shown below.")));compare.appendChild(upgrade);compare.appendChild(renderAssetTargetPreview(assetsUi.compareRelease));}else{var diff=assetDiffSummary(release,assetsUi.compareRelease),summary=el('p','org-workspaces-muted',tr('知识：新增 '+diff.knowledge.added+'、修改 '+diff.knowledge.changed+'、删除 '+diff.knowledge.removed+'；技能：新增 '+diff.skills.added+'、修改 '+diff.skills.changed+'、删除 '+diff.skills.removed+'。',"Knowledge: "+diff.knowledge.added+" added, "+diff.knowledge.changed+" changed, "+diff.knowledge.removed+" removed; skills: "+diff.skills.added+" added, "+diff.skills.changed+" changed, "+diff.skills.removed+" removed."));compare.appendChild(summary);compare.appendChild(upgrade);compare.appendChild(renderAssetDiffDetails(release,assetsUi.compareRelease));}compare.appendChild(el('p','org-workspaces-assets-meta',tr('只会更新共享版本绑定和同 ID 技能的停用状态；文件、记忆与其他实例不变。',"Only the shared version binding and disabled state for matching skill IDs change; files, memory, and other instances are untouched.")));}else compare.appendChild(el('p','org-workspaces-assets-warning',tr('新版本内容暂时不可用，请稍后重试。',"The new version content is not available yet.")));panel.appendChild(compare);}

    var bindingSection=el('section','org-workspaces-assets-section');var bindingHead=el('div','org-workspaces-assets-section-head');bindingHead.appendChild(el('h4','',tr('当前实例绑定',"Current instance binding")));var bindingMeta=binding.version?tr('已绑定 v'+binding.version+' · 实例修订 '+String(binding.instanceRevision),"Bound to v"+binding.version+" · instance revision "+String(binding.instanceRevision)):binding.versionZero===true?tr('未引用共享版本（v0）',"No shared version referenced (v0)"):tr('未引用共享版本',"No shared version referenced");bindingHead.appendChild(el('span','org-workspaces-assets-meta',bindingMeta));bindingSection.appendChild(bindingHead);
    if(assetsUi.bindingError){var bindingError=el('p','org-workspaces-assets-warning',assetsUi.bindingError==='CLASS_ASSETS_REVOKED'?tr('当前绑定版本已撤回；请选择可用版本，或取消引用。',"The bound version was withdrawn. Choose an available version or cancel the reference."):assetsUi.bindingError);bindingSection.appendChild(bindingError);}
    if(release){
      var releaseInfo=el('div','org-workspaces-assets-current');releaseInfo.appendChild(el('strong','',tr('生效版本 v'+release.version,"Effective version v"+release.version)));
      bindingSection.appendChild(releaseInfo);
      if(release.digest){var digestEvidence=document.createElement('details');digestEvidence.id='org-workspaces-assets-current-evidence';digestEvidence.className='org-workspaces-assets-current-evidence';digestEvidence.appendChild(el('summary','',tr('查看版本摘要','View version digest')));digestEvidence.appendChild(el('code','org-workspaces-assets-current-digest',release.digest));bindingSection.appendChild(digestEvidence);}
      var skillBlock=el('div','org-workspaces-assets-skill-block');skillBlock.appendChild(el('div','org-workspaces-assets-label',tr('共享技能开关',"Shared skill toggles")));var skillList=el('div','org-workspaces-assets-skill-list');var disabled=binding.disabledSkillIds||[];
      if(!release.skills.length)skillList.appendChild(el('p','org-workspaces-muted',tr('这个版本没有技能。',"This version has no skills.")));
      release.skills.forEach(function(skill){var label=el('label','org-workspaces-assets-check');var check=el('input');check.type='checkbox';check.value=skill.id;check.checked=disabled.indexOf(skill.id)<0;check.disabled=mutationDisabled;label.append(check,el('span','',safeText(skill.name,skill.id)));if(skill.desc)label.title=skill.desc;skillList.appendChild(label);});skillBlock.appendChild(skillList);var saveSkills=assetsActionButton(tr('保存技能开关',"Save skill toggles"),function(){saveAssetSkillToggles(skillList);},false);saveSkills.disabled=mutationDisabled;skillBlock.appendChild(saveSkills);bindingSection.appendChild(skillBlock);
    }else bindingSection.appendChild(el('p','org-workspaces-muted',binding.version?tr('当前版本内容不可用。',"The current version content is unavailable."):tr('绑定一个发布版本后，这里会显示可停用的共享技能。',"Bind a published version to manage its shared skill toggles.")));
    var bindingActions=el('div','org-workspaces-assets-actions');if(binding.version){var cancelBinding=assetsActionButton(tr('取消引用',"Cancel reference"),function(){bindAssetVersion('');},false);cancelBinding.disabled=mutationDisabled;bindingActions.appendChild(cancelBinding);}bindingSection.appendChild(bindingActions);panel.appendChild(bindingSection);

    var releasesSection=el('section','org-workspaces-assets-section');var releasesHead=el('div','org-workspaces-assets-section-head');releasesHead.appendChild(el('h4','',tr('发布版本目录',"Published versions")));releasesHead.appendChild(el('span','org-workspaces-assets-meta',tr('目录修订 '+String(catalog.revision),"Catalog revision "+String(catalog.revision))));releasesSection.appendChild(releasesHead);var latest= catalog.latestVersion?tr('最新发布版本：v'+catalog.latestVersion+'（不会自动绑定）',"Latest published version: v"+catalog.latestVersion+" (not bound automatically)"):tr('还没有发布版本。',"No published versions yet.");releasesSection.appendChild(el('p','org-workspaces-muted',latest));var releases=el('div','org-workspaces-assets-release-list');
    if(!catalog.releases.length)releases.appendChild(el('p','org-workspaces-muted',tr('发布第一个共享版本后，它会出现在这里。',"Publish the first shared version to see it here.")));
    catalog.releases.forEach(function(item){var row=el('div','org-workspaces-assets-release');var copy=el('div','org-workspaces-assets-release-copy');copy.appendChild(el('strong','', 'v'+item.version));copy.appendChild(el('span','org-workspaces-assets-meta',tr(item.knowledgeCount+' 条知识 · '+item.skillCount+' 个技能',item.knowledgeCount+' knowledge · '+item.skillCount+' skills')+(item.digest?' · '+item.digest:'')));if(item.revoked)copy.appendChild(el('span','org-workspaces-assets-status revoked',tr('已撤回',"Withdrawn")));row.appendChild(copy);var actions=el('div','org-workspaces-assets-release-actions');var bind=assetsActionButton(tr('绑定',"Bind"),function(){bindAssetVersion(item.version);},false);bind.disabled=item.revoked||mutationDisabled;actions.appendChild(bind);var withdraw=assetsActionButton(tr('撤回',"Withdraw"),function(){withdrawAssetVersion(item.version);},false);withdraw.disabled=item.revoked||mutationDisabled;actions.appendChild(withdraw);row.appendChild(actions);releases.appendChild(row);});releasesSection.appendChild(releases);

    var publishDetails=document.createElement('details');publishDetails.id='org-workspaces-assets-publish-details';publishDetails.className='org-workspaces-assets-publish-details';publishDetails.open=false;var publishSummary=el('summary','',tr('发布与版本管理',"Publish & version management"));publishDetails.appendChild(publishSummary);publishDetails.appendChild(releasesSection);
    var editor=el('section','org-workspaces-assets-section');var editorHead=el('div','org-workspaces-assets-section-head');editorHead.appendChild(el('h4','',tr('发布共享版本',"Publish a shared version")));editorHead.appendChild(el('span','org-workspaces-assets-meta',tr('显式编辑后发布',"Edit explicitly, then publish")));editor.appendChild(editorHead);editor.appendChild(el('p','org-workspaces-muted',tr('格式：知识 [{id,title,text}]；技能 [{id,name,desc}]。内容来自这个编辑器，不会读取私有记忆。',"Format: knowledge [{id,title,text}]; skills [{id,name,desc}]. This editor is the source; private memory is never read.")));
    var loadCurrent=assetsActionButton(tr('载入当前共享版本',"Load current shared version"),function(){if(!release)return;assetsUi.knowledgeDraft=assetJson(release.knowledge);assetsUi.skillsDraft=assetJson(release.skills);renderMain({captureAssets:false});},false);loadCurrent.id='org-workspaces-assets-load-current';loadCurrent.disabled=!release||assetsUi.busy;editor.appendChild(loadCurrent);
    var knowledgeField=el('div','org-workspaces-assets-field');var knowledgeLabel=el('label','',tr('共享知识 JSON',"Shared knowledge JSON"));knowledgeLabel.htmlFor='org-workspaces-assets-knowledge';knowledgeField.appendChild(knowledgeLabel);var knowledge=el('textarea');knowledge.id='org-workspaces-assets-knowledge';knowledge.dataset.assetsKnowledge='true';knowledge.rows=6;knowledge.spellcheck=false;knowledge.value=assetsUi.knowledgeDraft;knowledge.addEventListener('input',function(){assetsUi.knowledgeDraft=knowledge.value;});knowledgeField.appendChild(knowledge);editor.appendChild(knowledgeField);
    var skillsField=el('div','org-workspaces-assets-field');var skillsLabel=el('label','',tr('共享技能 JSON',"Shared skills JSON"));skillsLabel.htmlFor='org-workspaces-assets-skills';skillsField.appendChild(skillsLabel);var skills=el('textarea');skills.id='org-workspaces-assets-skills';skills.dataset.assetsSkills='true';skills.rows=6;skills.spellcheck=false;skills.value=assetsUi.skillsDraft;skills.addEventListener('input',function(){assetsUi.skillsDraft=skills.value;});skillsField.appendChild(skills);editor.appendChild(skillsField);
    var publish=assetsActionButton(tr('发布共享版本',"Publish shared version"),publishAssetVersion,true);publish.disabled=mutationDisabled;var editorActions=el('div','org-workspaces-assets-actions');editorActions.appendChild(publish);editor.appendChild(editorActions);publishDetails.appendChild(editor);panel.appendChild(publishDetails);
  }
  function fileConflictSnapshotUsable(snapshot){
    return !!(snapshot&&snapshot.name&&Number.isSafeInteger(snapshot.revision)&&(!snapshot.deleted||snapshot.revision>0));
  }
  function renderAssetConflictRecovery(){
    if(!assetsUi.fileConflict)return null;
    var section=el('section','org-workspaces-assets-conflict');section.id='org-workspaces-assets-conflict';
    var head=el('div','org-workspaces-assets-section-head');head.appendChild(el('h4','',tr('文件版本冲突',"File version conflict")));head.appendChild(el('span','org-workspaces-assets-meta',tr('本地草稿已保留',"Local draft preserved")));section.appendChild(head);
    section.appendChild(el('p','org-workspaces-assets-warning',tr('服务器上的文件状态已变化。先查看最新版本，再选择放弃草稿或基于该版本覆盖保存。',"The server file changed. View the latest version, then choose whether to discard the draft or overwrite from that revision.")));
    var actions=el('div','org-workspaces-assets-actions');var load=assetsActionButton(assetsUi.fileConflictLoading?tr('正在读取…',"Reading…"):tr('查看最新版本',"View latest version"),loadLatestAssetConflict,false);load.id='org-workspaces-assets-conflict-load';load.disabled=assetsUi.fileConflictLoading||assetsUi.busy;actions.appendChild(load);section.appendChild(actions);
    var snapshot=assetsUi.fileServerSnapshot;if(snapshot&&snapshot.name===assetsUi.fileName){
      var server=el('div','org-workspaces-assets-conflict-server');server.id='org-workspaces-assets-conflict-server';server.dataset.assetsConflictServer='true';
      var serverHead=el('div','org-workspaces-assets-section-head');serverHead.appendChild(el('strong','',tr('已保存的最新状态',"Latest saved state")));serverHead.appendChild(el('span','org-workspaces-assets-meta',snapshot.deleted?tr('已删除 · 修订 '+String(snapshot.revision),"Deleted · revision "+String(snapshot.revision)):tr('修订 '+String(snapshot.revision),"Revision "+String(snapshot.revision))));server.appendChild(serverHead);
      var content=el('pre','org-workspaces-assets-conflict-content',snapshot.deleted?tr('该文件已删除。',"This file has been deleted."):safeText(snapshot.content));content.id='org-workspaces-assets-conflict-server-content';content.dataset.assetsServerContent='true';content.dataset.assetsServerRevision=String(snapshot.revision);content.dataset.assetsServerDeleted=String(!!snapshot.deleted);server.appendChild(content);section.appendChild(server);
      var recovery=el('div','org-workspaces-assets-actions');var adopt=assetsActionButton(tr('采用最新版本',"Adopt latest"),adoptLatestAssetConflict,false);adopt.id='org-workspaces-assets-conflict-adopt';adopt.disabled=!fileConflictSnapshotUsable(snapshot)||assetsUi.busy||assetsUi.fileConflictLoading||!!assetsUi.mutationNotice;recovery.appendChild(adopt);var save=assetsActionButton(tr('保留草稿并覆盖保存',"Save draft over latest"),saveDraftOverAssetConflict,true);save.id='org-workspaces-assets-conflict-save-draft';save.disabled=!fileConflictSnapshotUsable(snapshot)||assetsUi.busy||assetsUi.fileConflictLoading||!!assetsUi.mutationNotice;recovery.appendChild(save);section.appendChild(recovery);
    }
    return section;
  }
  function renderAssetsFiles(panel){
    var files=assetsUi.files||{revision:0,files:[],tombstones:[]};var filesSection=el('section','org-workspaces-assets-section');var filesHead=el('div','org-workspaces-assets-section-head');filesHead.appendChild(el('h4','',tr('当前实例文件',"Current instance files")));filesHead.appendChild(el('span','org-workspaces-assets-meta',tr('列表修订 '+String(files.revision),"List revision "+String(files.revision))));filesSection.appendChild(filesHead);filesSection.appendChild(el('p','org-workspaces-muted',tr('仅支持 UTF-8 文本：.md、.csv、.json、.txt。不执行文件内容。',"UTF-8 text only: .md, .csv, .json, and .txt. File contents are never executed.")));var list=el('div','org-workspaces-assets-file-list');
    if(assetsUi.filesError)list.appendChild(el('p','org-workspaces-assets-warning',assetsUi.filesError));
    if(!files.files.length&&!assetsUi.filesError)list.appendChild(el('p','org-workspaces-muted',tr('这个实例还没有文件。',"This instance has no files yet.")));
    files.files.forEach(function(file){var row=button('','org-workspaces-assets-file-row');row.type='button';row.dataset.assetsFileRow=file.name;row.disabled=assetsUi.fileLoading||assetsUi.busy;row.setAttribute('aria-pressed',String(assetsUi.fileMode==='existing'&&assetsUi.fileName===file.name));row.appendChild(el('span','org-workspaces-assets-file-name',file.name));row.appendChild(el('span','org-workspaces-assets-meta',tr('修订 '+String(file.revision),"rev "+String(file.revision))));row.addEventListener('click',function(){readAssetFile(file.name);});list.appendChild(row);});
    if(files.tombstones.length){var tomb=el('div','org-workspaces-assets-tombstones');tomb.appendChild(el('span','org-workspaces-assets-label',tr('已删除文件（重建需沿用修订）',"Deleted files (recreate with their revision)")));files.tombstones.forEach(function(item){tomb.appendChild(el('span','org-workspaces-assets-tombstone',item.name+' · v'+String(item.revision)));});list.appendChild(tomb);}
    filesSection.appendChild(list);var newButton=assetsActionButton(tr('新建文件',"New file"),function(){captureAssetsDraft();assetsTicket++;assetsUi.fileMode='new';assetsUi.fileName='';assetsUi.fileContent='';assetsUi.fileRevision=null;assetsUi.fileConflict=false;assetsUi.fileConflictInfo=null;assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;renderMain({captureAssets:false});},false);newButton.id='org-workspaces-assets-new-file';newButton.disabled=assetMutationDisabled();var listActions=el('div','org-workspaces-assets-actions');listActions.appendChild(newButton);filesSection.appendChild(listActions);panel.appendChild(filesSection);
    if(assetsUi.fileConflict){var conflict=renderAssetConflictRecovery();if(conflict)panel.appendChild(conflict);}
    var editor=el('section','org-workspaces-assets-section');var heading=el('div','org-workspaces-assets-section-head');heading.appendChild(el('h4','',assetsUi.fileMode==='existing'?tr('编辑文件',"Edit file"):tr('新建文件',"New file")));if(assetsUi.fileMode==='existing'&&Number.isSafeInteger(assetsUi.fileRevision))heading.appendChild(el('span','org-workspaces-assets-meta',tr('修订 '+String(assetsUi.fileRevision),"Revision "+String(assetsUi.fileRevision))));editor.appendChild(heading);if(assetsUi.fileConflict)editor.appendChild(el('p','org-workspaces-assets-warning',tr('文件已被其他编辑更新；草稿已保留，请先查看最新版本。',"The file changed elsewhere; your draft is preserved. View the latest version before deciding whether to overwrite it.")));
    var form=el('form','org-workspaces-assets-file-editor');form.addEventListener('submit',function(event){event.preventDefault();writeAssetFile();});var nameField=el('div','org-workspaces-assets-field');var nameLabel=el('label','',tr('文件名',"File name"));nameLabel.htmlFor='org-workspaces-assets-file-name';nameField.appendChild(nameLabel);var nameInput=el('input');nameInput.id='org-workspaces-assets-file-name';nameInput.dataset.assetsFileName='true';nameInput.maxLength=240;nameInput.placeholder='notes.md';nameInput.value=assetsUi.fileName;nameInput.disabled=assetsUi.fileMode==='existing'||assetsUi.busy;nameInput.addEventListener('input',function(){assetsUi.fileName=nameInput.value;if(assetsUi.fileMode==='new'){assetsTicket++;if(assetsUi.fileConflictLoading){assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;var conflictLoad=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-assets-conflict-load'),conflictAdopt=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-assets-conflict-adopt'),conflictSave=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-assets-conflict-save-draft');if(conflictLoad){conflictLoad.disabled=false;conflictLoad.textContent=tr('查看最新版本',"View latest version");}if(conflictAdopt)conflictAdopt.disabled=true;if(conflictSave)conflictSave.disabled=true;}}});nameField.appendChild(nameInput);form.appendChild(nameField);var contentField=el('div','org-workspaces-assets-field');var contentLabel=el('label','',tr('内容（UTF-8）',"Content (UTF-8)"));contentLabel.htmlFor='org-workspaces-assets-file-content';contentField.appendChild(contentLabel);var content=el('textarea');content.id='org-workspaces-assets-file-content';content.dataset.assetsFileContent='true';content.rows=12;content.spellcheck=false;content.value=assetsUi.fileContent;content.disabled=assetsUi.fileLoading||assetsUi.busy;content.addEventListener('input',function(){assetsUi.fileContent=content.value;});contentField.appendChild(content);form.appendChild(contentField);var actions=el('div','org-workspaces-assets-actions');var save=assetsActionButton(assetsUi.fileLoading?tr('正在读取…',"Reading…"):tr('保存文件',"Save file"),writeAssetFile,true);save.type='submit';save.disabled=assetsUi.fileLoading||assetMutationDisabled();actions.appendChild(save);if(assetsUi.fileMode==='existing'){var remove=assetsActionButton(tr('删除文件',"Delete file"),removeAssetFile,false);remove.disabled=assetsUi.fileLoading||assetMutationDisabled();actions.appendChild(remove);}form.appendChild(actions);editor.appendChild(form);panel.appendChild(editor);
  }
  function normalizeWorkspaceInstanceSnapshot(value){
    value=value&&typeof value==='object'?value:{};var instance=value.instance&&typeof value.instance==='object'?value.instance:{};
    if(!instance.instanceId||!instance.spaceId||!instance.botId||!Number.isSafeInteger(instance.revision)||!instance.profile||typeof instance.profile!=='object')throw new Error(tr('实例服务返回的数据不完整。','The instance service returned incomplete data.'));
    var defaults=value.classDefaults&&typeof value.classDefaults==='object'?value.classDefaults:{};
    return {instance:{instanceId:idFor(instance.instanceId),spaceId:idFor(instance.spaceId),botId:idFor(instance.botId),revision:instance.revision,profile:normalizeInstanceProfile(instance.profile),execution:instance.execution&&typeof instance.execution==='object'?cloneInstanceValue(instance.execution):{}},
      classDefaults:{botId:idFor(defaults.botId),name:safeText(defaults.name),profile:normalizeInstanceProfile(defaults.profile)},
      changedFields:Array.isArray(value.changedFields)?value.changedFields.map(idFor):[],editableFields:Array.isArray(value.editableFields)?value.editableFields.map(idFor):[],
      providers:Array.isArray(value.providers)?value.providers.filter(function(item){return item&&typeof item==='object'&&item.id;}).map(function(item){return {id:idFor(item.id),name:safeText(item.name,item.id)};}):[],
      execution:value.execution&&typeof value.execution==='object'?cloneInstanceValue(value.execution):{kind:safeText(instance.execution&&instance.execution.kind),supported:false,reason:tr('宿主未返回空间对话支持状态。','The host did not report space conversation support.')}};
  }
  function applyWorkspaceInstanceSnapshot(value,mode,options){
    options=options||{};var versionAtStart=options.versionAtStart;
    var snapshot=normalizeWorkspaceInstanceSnapshot(value),key=instanceIdentityKey(snapshot.instance.spaceId,snapshot.instance.botId,snapshot.instance.instanceId);
    if(snapshot.instance.spaceId!==instanceUi.spaceId||snapshot.instance.botId!==instanceUi.botId)throw new Error(tr('回读实例身份与当前空间不符。','The read-back instance does not match the current space.'));
    if(mode==='conflict'){
      instanceUi.conflictSnapshot=snapshot;instanceUi.conflictReviewed=false;instanceUi.refreshing=false;instanceUi.error='';instanceUi.notice=tr('已读取服务器修订 '+snapshot.instance.revision+'。展开属性并确认后，才可继续保存本地草稿。','Server revision '+snapshot.instance.revision+' is loaded. Review the properties and confirm before saving your local draft.');return snapshot;
    }
    if(mode==='readback'&&instanceUi.key&&instanceUi.key!==key)throw new Error(tr('回读身份与当前实例不符，请重新打开此面板核对。','The read-back identity does not match the current instance. Reopen this panel to verify it.'));
    var stored=instanceDrafts[key],hasDraft=!!instanceUi.draft,serverProfile=cloneInstanceValue(snapshot.instance.profile),previousDraft=hasDraft?cloneInstanceValue(instanceUi.draft):null,previousBase=instanceUi.baseProfile?cloneInstanceValue(instanceUi.baseProfile):null;
    instanceUi.key=key;instanceScopeIndex[instanceUi.scopeKey]=key;instanceUi.instance=snapshot.instance;instanceUi.classDefaults=snapshot.classDefaults;instanceUi.editableFields=snapshot.editableFields;instanceUi.providers=snapshot.providers;instanceUi.execution=snapshot.execution;
    if(mode==='initial'&&stored&&stored.profile){
      instanceUi.draft=cloneInstanceValue(stored.profile);
      var hadVerifiedBase=!!stored.baseProfile&&Number.isSafeInteger(stored.baseRevision),storedBase=hadVerifiedBase?cloneInstanceValue(stored.baseProfile):null;
      var stale=stored.needsReview===true||!hadVerifiedBase||stored.baseRevision!==snapshot.instance.revision||!sameInstanceValue(stored.baseProfile,serverProfile);
      if(stale){
        instanceUi.baseProfile=storedBase;instanceUi.baseRevision=hadVerifiedBase?stored.baseRevision:null;instanceUi.conflict=true;instanceUi.conflictSnapshot=snapshot;instanceUi.conflictReviewed=false;
        instanceUi.notice=tr('服务器版本在面板关闭期间发生变化；本地草稿已保留。请查看服务器属性并确认后再继续。','The server changed while this panel was closed. Your local draft is preserved. Review the server properties and confirm before continuing.');
      }else{instanceUi.baseProfile=cloneInstanceValue(serverProfile);instanceUi.baseRevision=snapshot.instance.revision;}
    }else if(mode==='readback'){
      var expectedPatch=options.expectedPatch,patchMatches=!!expectedPatch&&Object.keys(expectedPatch).every(function(field){return sameInstanceValue(instanceComparable(field,snapshot.instance.profile[field]),instanceComparable(field,expectedPatch[field]));});
      var versionChanged=instanceUi.editVersion!==versionAtStart,merged=instanceMergeDraft(serverProfile,previousDraft,previousBase,snapshot.editableFields),mergedProfile=merged.profile,overlap=[];
      if(expectedPatch&&merged.hasBase){
        merged.localFields.forEach(function(field){
          var patchHasField=Object.prototype.hasOwnProperty.call(expectedPatch,field),serverMatches=patchHasField&&sameInstanceValue(instanceComparable(field,serverProfile[field]),instanceComparable(field,expectedPatch[field]));
          var newerEdit=versionChanged&&patchHasField&&!sameInstanceValue(instanceComparable(field,previousDraft[field]),instanceComparable(field,expectedPatch[field]));
          if(serverMatches&&!newerEdit)mergedProfile[field]=cloneInstanceValue(serverProfile[field]);
          else if(merged.conflicts.indexOf(field)>=0&&!serverMatches)overlap.push(field);
        });
      }else overlap=merged.conflicts.slice();
      if(!versionChanged&&patchMatches)mergedProfile=serverProfile;
      instanceUi.draft=mergedProfile;
      if(overlap.length){
        instanceUi.baseProfile=previousBase;instanceUi.baseRevision=Number.isSafeInteger(instanceUi.baseRevision)?instanceUi.baseRevision:null;instanceUi.conflict=true;instanceUi.conflictSnapshot=snapshot;instanceUi.conflictReviewed=false;
        instanceUi.notice=tr('服务器同时修改了本地草稿涉及的字段；保存仍暂停，请查看两边内容并确认。','The server also changed fields in your draft. Saving remains paused; review both versions and confirm.');
      }else{
        instanceUi.baseProfile=cloneInstanceValue(serverProfile);instanceUi.baseRevision=snapshot.instance.revision;instanceUi.conflict=false;instanceUi.conflictSnapshot=null;instanceUi.conflictReviewed=false;
      }
    }else{
      instanceUi.draft=cloneInstanceValue(serverProfile);instanceUi.baseProfile=cloneInstanceValue(serverProfile);instanceUi.baseRevision=snapshot.instance.revision;
    }
    if(stored){instanceUi.advancedOpen=stored.advancedOpen===true;instanceUi.skillsOpen=stored.skillsOpen===true;}
    instanceUi.loading=false;instanceUi.refreshing=false;instanceUi.blocked=false;instanceUi.error='';
    if(mode==='initial'&&!instanceUi.conflict){instanceUi.conflictSnapshot=null;instanceUi.conflictReviewed=false;instanceUi.notice='';}
    if(mode==='readback'&&!instanceUi.conflict){
      var savedVerified=instanceUi.editVersion===versionAtStart&&patchMatches;
      instanceUi.notice=tr('已从服务器核对实例修订 '+snapshot.instance.revision+'。'+(savedVerified?'保存内容已核对。':'本地草稿仍保留；服务器上的其他更新也已保留。'),'Server read-back verified instance revision '+snapshot.instance.revision+'. '+(savedVerified?'The saved values are verified.':'Your local draft is preserved, along with other server updates.'));
    }
    persistInstanceDraft();return snapshot;
  }
  function loadWorkspaceInstance(options){
    options=options||{};var mode=options.mode||'initial',spaceId=instanceUi.spaceId,botId=instanceUi.botId,ticket=instanceTicket,versionAtStart=options.versionAtStart===undefined?instanceUi.editVersion:options.versionAtStart;
    if(!spaceId||!botId)return Promise.resolve();if(mode==='initial')instanceUi.loading=true;else instanceUi.refreshing=true;
    instanceUi.error='';if(mode!=='conflict')instanceUi.notice=mode==='readback'?tr('正在回读服务器版本…','Reading back the server version…'):'';renderMain({captureAssets:false});
    return apiCall('orgWorkspaceInstanceRead',{spaceId:spaceId,botId:botId}).then(function(value){
      if(!instanceScopeIsCurrent(ticket,spaceId,botId))return;applyWorkspaceInstanceSnapshot(value,mode,{versionAtStart:versionAtStart,expectedPatch:options.expectedPatch});
      if(assetsUi.activeTab==='instance')renderMain({captureAssets:false});else instanceUpdateNotice(instanceUi.notice,'ok');return value;
    }).catch(function(error){
      if(!instanceScopeIsCurrent(ticket,spaceId,botId))return;instanceUi.loading=false;instanceUi.refreshing=false;
      if(mode==='readback'){instanceUi.blocked=true;instanceUi.notice=tr('服务器回读尚未核对；保存已暂停。请重新读取后再继续。','Server read-back is not verified; saving is paused. Read it again before continuing.');}
      else if(mode==='conflict')instanceUi.notice=tr('读取最新服务器版本失败；本地草稿仍保留。','Could not read the latest server version. Your local draft is preserved.');
      instanceUi.error=safeText(error&&error.message,error)||tr('实例属性暂不可用。','Instance properties are unavailable.');if(assetsUi.activeTab==='instance')renderMain({captureAssets:false});return null;
    });
  }
  function openWorkspaceInstance(){
    var space=currentSpace();if(!space||current.mode!=='private')return;var scopeKey=instanceScopeKey(space.id,current.botId);
    if(instanceUi.spaceId===space.id&&instanceUi.botId===current.botId&&instanceUi.instance)return;
    captureInstanceDraft();instanceTicket++;instanceUi.ticket=instanceTicket;instanceUi.spaceId=space.id;instanceUi.botId=current.botId;instanceUi.scopeKey=scopeKey;instanceUi.key=instanceScopeIndex[scopeKey]||'';instanceUi.instance=null;instanceUi.classDefaults=null;instanceUi.editableFields=[];instanceUi.providers=[];instanceUi.execution=null;instanceUi.baseProfile=null;instanceUi.baseRevision=null;
    var stored=instanceUi.key&&instanceDrafts[instanceUi.key];instanceUi.draft=stored?cloneInstanceValue(stored.profile):null;instanceUi.advancedOpen=stored&&stored.advancedOpen===true;instanceUi.skillsOpen=stored&&stored.skillsOpen===true;
    instanceUi.loading=true;instanceUi.saving=false;instanceUi.refreshing=false;instanceUi.blocked=false;instanceUi.conflict=false;instanceUi.error='';instanceUi.notice='';instanceUi.conflictSnapshot=null;instanceUi.conflictReviewed=false;instanceUi.editVersion=0;loadWorkspaceInstance({mode:'initial'});
  }
  function instanceEdit(field,value){
    if(!instanceUi.draft||!instanceEditable(field))return;instanceUi.draft[field]=value;instanceUi.editVersion++;persistInstanceDraft();
    if(!instanceUi.error&&!instanceUi.conflict&&!instanceUi.blocked)instanceUi.notice='';instanceUpdateNotice(instanceUi.notice,instanceUi.error?'error':'');
  }
  function instanceFieldLabel(field){
    var labels={name:['名称','Name'],persona:['人设','Persona'],role:['职责','Responsibility'],style:['表达风格','Voice style'],title:['称谓','Title'],section:['分组','Section'],avatar:['头像','Avatar'],color:['头像颜色','Avatar color'],tags:['标签','Tags'],skills:['补充技能','Additional skills'],model:['模型','Model'],providerId:['模型连接','Model connection'],temperature:['温度','Temperature'],harness:['运行内核','Runtime'],roleLabelOverrides:['角色称呼','Role labels']};
    return labels[field]?tr(labels[field][0],labels[field][1]):field;
  }
  function instanceComparable(field,value){
    if(field==='tags')return Array.isArray(value)?value.filter(function(item){return item&&safeText(item.label).trim();}).map(function(item){return {type:safeText(item.type),label:safeText(item.label).trim()};}):[];
    if(field==='skills')return Array.isArray(value)?value.filter(function(item){return item&&(safeText(item.name).trim()||safeText(item.desc).trim());}).map(function(item){return {id:safeText(item.id),name:safeText(item.name).trim(),desc:safeText(item.desc).trim()};}):[];
    if(field==='roleLabelOverrides')return normalizeRoleLabelOverrides(value);
    return value;
  }
  function instancePatchValue(field,value){return cloneInstanceValue(instanceComparable(field,value));}
  function roleOverridesEmpty(value){return Object.keys(normalizeRoleLabelOverrides(value)).length===0;}
  function instanceClassDiffers(field,value,defaultValue){
    if(field==='roleLabelOverrides'&&roleOverridesEmpty(value))return false;
    return !sameInstanceValue(instanceComparable(field,value),instanceComparable(field,defaultValue));
  }
  function instanceChangedFromClass(){
    if(!instanceUi.draft||!instanceUi.classDefaults)return[];var defaults=normalizeInstanceProfile(instanceUi.classDefaults.profile);
    return instanceUi.editableFields.filter(function(field){return instanceClassDiffers(field,instanceUi.draft[field],defaults[field]);});
  }
  function instanceDirtyFields(){
    if(!instanceUi.draft||!instanceUi.baseProfile)return[];
    return instanceUi.editableFields.filter(function(field){return !sameInstanceValue(instanceComparable(field,instanceUi.draft[field]),instanceComparable(field,instanceUi.baseProfile[field]));});
  }
  function instanceMergeDraft(serverProfile,draft,baseProfile,fields){
    var merged=cloneInstanceValue(serverProfile),localFields=[],conflicts=[];
    if(!draft||!baseProfile)return {profile:cloneInstanceValue(draft||serverProfile),localFields:fields.slice(),conflicts:fields.slice(),hasBase:false};
    fields.forEach(function(field){
      var localChanged=!sameInstanceValue(instanceComparable(field,draft[field]),instanceComparable(field,baseProfile[field]));
      if(!localChanged)return;
      localFields.push(field);merged[field]=cloneInstanceValue(draft[field]);
      var serverChanged=!sameInstanceValue(instanceComparable(field,serverProfile[field]),instanceComparable(field,baseProfile[field]));
      if(serverChanged&&!sameInstanceValue(instanceComparable(field,serverProfile[field]),instanceComparable(field,draft[field])))conflicts.push(field);
    });
    return {profile:merged,localFields:localFields,conflicts:conflicts,hasBase:true};
  }
  function instanceFieldChanged(field){return instanceChangedFromClass().indexOf(field)>=0;}
  function instanceUpdateNotice(message,tone){
    instanceUi.notice=message||'';if(tone==='error')instanceUi.error=message||'';
    var status=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-instance-status');
    if(status){status.textContent=instanceUi.error||instanceUi.notice;status.dataset.tone=instanceUi.error?'error':tone||'';status.setAttribute('role',instanceUi.error?'alert':'status');}
    var save=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-instance-save');if(save)save.disabled=instanceUi.saving||instanceUi.loading||instanceUi.blocked||instanceUi.conflict||!instanceDirtyFields().length||!instanceUi.editableFields.length;
    var count=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-instance-dirty-count');if(count){var dirty=instanceDirtyFields();count.textContent=dirty.length?tr(dirty.length+' 项未保存',dirty.length+' unsaved change'+(dirty.length===1?'':'s')):'';}
    var changed=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-instance-changed-summary');if(changed){var fields=instanceChangedFromClass();changed.textContent=fields.length?tr('与当前类默认不同：'+fields.map(instanceFieldLabel).join('、'),'Different from current class defaults: '+fields.map(instanceFieldLabel).join(', ')):tr('与当前类默认配置一致。','Matches current class defaults.');}
  }
  function captureInstanceFocus(){
    var active=document.activeElement;if(!active||!active.closest||!active.closest('#org-workspaces-instance-panel')||!active.id)return null;
    return {id:active.id,start:typeof active.selectionStart==='number'?active.selectionStart:null,end:typeof active.selectionEnd==='number'?active.selectionEnd:null,direction:active.selectionDirection||'none'};
  }
  function restoreInstanceFocus(snapshot){
    var target=snapshot&&dom.assetsPanel&&dom.assetsPanel.querySelector('#'+snapshot.id);
    if(target&&target.getClientRects().length&&!target.disabled){target.focus({preventScroll:true});if(snapshot.start!==null&&typeof target.setSelectionRange==='function'){try{target.setSelectionRange(snapshot.start,snapshot.end,snapshot.direction);}catch(_){}}return;}
    var status=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-instance-status');if(status&&status.getClientRects().length)status.focus({preventScroll:true});
  }
  function instanceFormField(field,kind,value,options){
    options=options||{};var wrapper=el('div','org-workspaces-instance-field'),label=el('label','',instanceFieldLabel(field));label.htmlFor='org-workspaces-instance-'+field;
    if(instanceFieldChanged(field))label.appendChild(el('span','org-workspaces-instance-diff-mark',tr('与类默认不同','differs from class')));
    var control=el(kind==='textarea'?'textarea':'input');if(kind!=='textarea')control.type=kind==='number'?'number':'text';control.id='org-workspaces-instance-'+field;control.dataset.instanceField=field;control.value=value===undefined||value===null?'':String(value);control.disabled=instanceUi.loading||!instanceEditable(field);
    if(options.rows)control.rows=options.rows;if(options.maxLength)control.maxLength=options.maxLength;if(kind==='number'){control.min='0';control.max='2';control.step='0.1';}
    control.addEventListener('input',function(){instanceEdit(field,field==='temperature'?(control.value===''?null:Number(control.value)):control.value);});wrapper.append(label,control);if(options.help)wrapper.appendChild(el('p','org-workspaces-instance-help',options.help));return wrapper;
  }
  function instanceSelect(field,value,items){
    var wrapper=el('div','org-workspaces-instance-field'),label=el('label','',instanceFieldLabel(field));label.htmlFor='org-workspaces-instance-'+field;
    if(instanceFieldChanged(field))label.appendChild(el('span','org-workspaces-instance-diff-mark',tr('与类默认不同','differs from class')));
    var select=el('select');select.id='org-workspaces-instance-'+field;select.dataset.instanceField=field;select.disabled=instanceUi.loading||!instanceEditable(field);
    items.forEach(function(item){var option=el('option','',item.label);option.value=item.value;option.selected=item.value===value;select.appendChild(option);});
    if(value&&!items.some(function(item){return item.value===value;})){var unavailable=el('option','',tr('当前选择不可用：','Current selection unavailable: ')+value);unavailable.value=value;unavailable.selected=true;select.insertBefore(unavailable,select.firstChild);}
    select.addEventListener('change',function(){instanceEdit(field,select.value);});wrapper.append(label,select);return wrapper;
  }
  function instanceFormat(value,field){
    if(value===undefined||value===null||value==='')return tr('未设置','Not set');if(Array.isArray(value)&&!value.length)return tr('无','None');
    if(field==='tags'&&Array.isArray(value))return value.map(function(item){return safeText(item.label);}).filter(Boolean).join(' · ')||tr('无','None');
    if(field==='skills'&&Array.isArray(value))return value.map(function(item){return safeText(item.name)||safeText(item.id);}).filter(Boolean).join(' · ')||tr('无','None');
    if(field==='roleLabelOverrides'&&value&&typeof value==='object'){var labels=[];Object.keys(value).forEach(function(role){Object.keys(value[role]||{}).forEach(function(lang){labels.push(role+' / '+lang+': '+value[role][lang]);});});return labels.join(' · ')||tr('未覆盖','No override');}
    if(typeof value==='object')return tr('已设置','Set');return String(value);
  }
  function instanceTagEditor(){
    var section=el('div','org-workspaces-instance-list-editor'),list=el('div','org-workspaces-instance-tag-list');
    (instanceUi.draft.tags||[]).forEach(function(tag,index){var row=el('div','org-workspaces-instance-tag-row'),type=el('select'),label=el('input');
      [['role','role'],['style','style'],['skill','skill'],['custom','custom']].forEach(function(item){var option=el('option','',item[0]);option.value=item[0];option.selected=item[0]===tag.type;type.appendChild(option);});type.setAttribute('aria-label',tr('标签类型','Tag type'));label.value=tag.label;label.maxLength=40;label.setAttribute('aria-label',tr('标签内容','Tag text'));
      function update(){var next=cloneInstanceValue(instanceUi.draft.tags||[]);next[index]={type:type.value,label:label.value};instanceEdit('tags',next);}
      type.addEventListener('change',update);label.addEventListener('input',update);var remove=button('','org-workspaces-instance-remove',tr('移除','Remove'));remove.setAttribute('aria-label',tr('移除标签','Remove tag'));remove.addEventListener('click',function(){instanceEdit('tags',(instanceUi.draft.tags||[]).filter(function(_,i){return i!==index;}));renderMain({captureAssets:false});});row.append(type,label,remove);list.appendChild(row);
    });
    var add=button('','org-workspaces-instance-add',tr('添加标签','Add tag'));add.disabled=!instanceEditable('tags');add.addEventListener('click',function(){instanceEdit('tags',(instanceUi.draft.tags||[]).concat([{type:'custom',label:''}]));renderMain({captureAssets:false});});section.append(list,add);return section;
  }
  function instanceSkillsEditor(){
    var section=el('div','org-workspaces-instance-list-editor'),list=el('div','org-workspaces-instance-skill-list');
    (instanceUi.draft.skills||[]).forEach(function(skill,index){var row=el('div','org-workspaces-instance-skill-row'),head=el('div','org-workspaces-instance-skill-head');head.appendChild(el('span','org-workspaces-instance-meta',safeText(skill.id)));var remove=button('','org-workspaces-instance-remove',tr('移除','Remove'));remove.setAttribute('aria-label',tr('移除技能','Remove skill'));remove.addEventListener('click',function(){instanceEdit('skills',(instanceUi.draft.skills||[]).filter(function(_,i){return i!==index;}));renderMain({captureAssets:false});});head.appendChild(remove);row.appendChild(head);
      var name=el('input');name.value=skill.name;name.maxLength=120;name.setAttribute('aria-label',tr('技能名称','Skill name'));name.addEventListener('input',function(){var next=cloneInstanceValue(instanceUi.draft.skills||[]);next[index].name=name.value;instanceEdit('skills',next);});
      var desc=el('textarea');desc.value=skill.desc;desc.rows=2;desc.maxLength=2000;desc.setAttribute('aria-label',tr('技能说明','Skill description'));desc.addEventListener('input',function(){var next=cloneInstanceValue(instanceUi.draft.skills||[]);next[index].desc=desc.value;instanceEdit('skills',next);});row.append(name,desc);list.appendChild(row);
    });
    var add=button('','org-workspaces-instance-add',tr('添加技能','Add skill'));add.disabled=!instanceEditable('skills');add.addEventListener('click',function(){var skills=cloneInstanceValue(instanceUi.draft.skills||[]);skills.push({id:'space-skill-'+uuid(),name:'',desc:''});instanceEdit('skills',skills);instanceUi.skillsOpen=true;renderMain({captureAssets:false});var next=dom.assetsPanel&&dom.assetsPanel.querySelector('.org-workspaces-instance-skill-row input');if(next)next.focus();});section.append(list,add);return section;
  }
  function instanceRoleLabelsEditor(){
    var section=el('div','org-workspaces-instance-role-labels'),roles=[['primary',['主 BOT','Primary BOT']],['leader',['组长','Group lead']],['member',['成员 BOT','Member BOT']]],languages=[['zh','简体中文','Chinese'],['en','English','English']];
    roles.forEach(function(role){var row=el('fieldset','org-workspaces-instance-role-label-row');row.appendChild(el('legend','',tr(role[1][0],role[1][1])));languages.forEach(function(language){var field=el('div','org-workspaces-instance-field'),label=el('label','',tr(language[1],language[2])),id='org-workspaces-instance-role-label-'+role[0]+'-'+language[0],input=el('input');label.htmlFor=id;input.id=id;input.maxLength=40;input.value=instanceUi.draft.roleLabelOverrides[role[0]]&&instanceUi.draft.roleLabelOverrides[role[0]][language[0]]||'';input.setAttribute('aria-label',tr(role[1][0]+' · '+language[1],role[1][1]+' · '+language[2]));input.disabled=instanceUi.loading||!instanceEditable('roleLabelOverrides');input.addEventListener('input',function(){var next=cloneInstanceValue(instanceUi.draft.roleLabelOverrides||{});next[role[0]]=next[role[0]]||{};if(input.value.trim())next[role[0]][language[0]]=input.value;else delete next[role[0]][language[0]];if(!Object.keys(next[role[0]]).length)delete next[role[0]];instanceEdit('roleLabelOverrides',next);});field.append(label,input);row.appendChild(field);});section.appendChild(row);});
    section.appendChild(el('p','org-workspaces-instance-help',tr('留空时按全局设置与系统默认称呼解析。','Blank values resolve through global settings and system defaults.')));return section;
  }
  function renderInstanceProperties(panel){
    var wrapper=el('section','org-workspaces-instance-panel');wrapper.id='org-workspaces-instance-panel';wrapper.setAttribute('aria-busy',String(instanceUi.loading||instanceUi.saving||instanceUi.refreshing));
    var status=el('p','org-workspaces-instance-status',instanceUi.error||instanceUi.notice);status.id='org-workspaces-instance-status';status.setAttribute('role',instanceUi.error?'alert':'status');status.setAttribute('aria-live',instanceUi.error?'assertive':'polite');status.tabIndex=-1;if(instanceUi.error)status.dataset.tone='error';else if(instanceUi.notice)status.dataset.tone='ok';wrapper.appendChild(status);
    if(instanceUi.loading){var loading=el('div','org-workspaces-assets-loading');loading.setAttribute('role','status');loading.setAttribute('aria-live','polite');loading.appendChild(el('p','org-workspaces-chat-empty',tr('正在读取当前空间实例属性…','Loading this space instance…')));wrapper.appendChild(loading);panel.appendChild(wrapper);return;}
    if(!instanceUi.instance||!instanceUi.draft){wrapper.appendChild(el('p','org-workspaces-instance-unavailable',instanceUi.error||tr('实例属性尚未读取。','Instance properties have not been loaded.')));var retry=button('org-workspaces-instance-refresh','org-workspaces-assets-button',tr('重新读取','Read again'));retry.disabled=instanceUi.refreshing;retry.addEventListener('click',function(){loadWorkspaceInstance({mode:'initial'});});wrapper.appendChild(retry);panel.appendChild(wrapper);return;}
    var space=spaceById(instanceUi.spaceId),bot=botById(instanceUi.botId),botName=bot&&bot.name||instanceUi.botId;
    var context=el('div','org-workspaces-instance-context');context.appendChild(el('p','',tr('当前空间：'+(space&&space.name||instanceUi.spaceId)+' · Bot：'+botName,'Current space: '+(space&&space.name||instanceUi.spaceId)+' · Bot: '+botName)));context.appendChild(el('p','',tr('来源类：'+botName+' · 仅修改此空间实例','Source class: '+botName+' · edits apply only to this space instance')));context.appendChild(el('p','org-workspaces-instance-snapshot-note',tr('实例属性在创建时保存为快照；类默认值的后续变化不会自动写入已有实例。角色称呼覆盖按其独立回退规则解析。','Instance properties are saved as a creation-time snapshot; later class-default changes do not automatically rewrite existing instances. Role label overrides follow their own fallback rules.')));wrapper.appendChild(context);
    if(instanceUi.execution){
      var execution=el('div','org-workspaces-instance-execution');
      execution.appendChild(el('strong','',tr('空间对话支持情况 · '+safeText(instanceUi.execution.kind,'unknown'),'Space conversation support · '+safeText(instanceUi.execution.kind,'unknown'))));
      if(instanceUi.execution.supported===false){var executionReason=safeText(instanceUi.execution.reason,tr('未提供原因','No reason provided')).trim().replace(/[。.!?；;]+$/,'');execution.appendChild(el('p','org-workspaces-instance-warning',tr('此空间对话入口暂不支持：'+executionReason+'。属性仍可编辑；更改属性不会改变执行来源。','This space conversation entry is not supported yet: '+executionReason+'. Properties remain editable; editing them does not change the execution source.')));}
      else execution.appendChild(el('p','org-workspaces-instance-help',tr('此执行来源支持空间对话实例。连接凭据、模型有效性与实际运行状态仍由运行时检查。','This execution source supports space conversation instances. Connection credentials, model validity, and actual runtime state are still checked by the runtime.')));
      wrapper.appendChild(execution);
    }
    var changed=instanceChangedFromClass(),changedSummary=el('p','org-workspaces-instance-changed-summary',changed.length?tr('与当前类默认不同：'+changed.map(instanceFieldLabel).join('、'),'Different from current class defaults: '+changed.map(instanceFieldLabel).join(', ')):tr('与当前类默认配置一致。','Matches current class defaults.'));changedSummary.id='org-workspaces-instance-changed-summary';wrapper.appendChild(changedSummary);
    var diffDetails=document.createElement('details');diffDetails.id='org-workspaces-instance-class-diff';diffDetails.className='org-workspaces-instance-class-diff';diffDetails.appendChild(el('summary','',tr('查看类默认值对比','Compare current class defaults')));diffDetails.appendChild(el('p','org-workspaces-instance-help',tr('对比依据是当前 Bot 类默认配置，不代表实例创建时的原始值。','This comparison uses current Bot class defaults, not the values captured when this instance was created.')));
    if(changed.length){var diffList=el('dl','org-workspaces-instance-diff-list'),defaults=normalizeInstanceProfile(instanceUi.classDefaults.profile);changed.forEach(function(field){var row=el('div','org-workspaces-instance-diff-row');row.appendChild(el('dt','',instanceFieldLabel(field)));var values=el('dd','');values.appendChild(el('span','org-workspaces-instance-diff-value',tr('当前实例：','Instance: ')+instanceFormat(instanceUi.draft[field],field)));values.appendChild(el('span','org-workspaces-instance-diff-value',tr('当前类默认：','Class default: ')+instanceFormat(defaults[field],field)));row.appendChild(values);diffList.appendChild(row);});diffDetails.appendChild(diffList);}else diffDetails.appendChild(el('p','org-workspaces-instance-help',tr('当前没有不同字段。','There are no differing fields.')));wrapper.appendChild(diffDetails);
    var form=el('form','org-workspaces-instance-form');form.id='org-workspaces-instance-form';form.setAttribute('aria-busy',String(instanceUi.saving||instanceUi.refreshing));form.addEventListener('submit',function(event){event.preventDefault();saveWorkspaceInstance();});
    var primary=el('div','org-workspaces-instance-primary-fields');[['name','input',instanceUi.draft.name,{maxLength:40}],['persona','textarea',instanceUi.draft.persona,{rows:4,maxLength:8000}],['role','input',instanceUi.draft.role,{maxLength:80}],['style','textarea',instanceUi.draft.style,{rows:3,maxLength:8000}]].forEach(function(spec){if(instanceEditable(spec[0]))primary.appendChild(instanceFormField(spec[0],spec[1],spec[2],spec[3]));});if(!instanceUi.editableFields.length)primary.appendChild(el('p','org-workspaces-instance-help',tr('当前宿主没有提供可编辑字段。','The host has not provided editable fields.')));form.appendChild(primary);
    var advanced=document.createElement('details');advanced.id='org-workspaces-instance-advanced';advanced.className='org-workspaces-instance-advanced';advanced.open=instanceUi.advancedOpen;advanced.appendChild(el('summary','',tr('高级属性','Advanced properties')));advanced.addEventListener('toggle',function(){instanceUi.advancedOpen=advanced.open;persistInstanceDraft();});var advancedBody=el('div','org-workspaces-instance-advanced-body');
    [['title','input',instanceUi.draft.title,{maxLength:80}],['section','input',instanceUi.draft.section,{maxLength:80}]].forEach(function(spec){if(instanceEditable(spec[0]))advancedBody.appendChild(instanceFormField(spec[0],spec[1],spec[2],spec[3]));});
    if(instanceEditable('avatar')){var avatarField=el('div','org-workspaces-instance-field');avatarField.appendChild(el('span','org-workspaces-instance-label',instanceFieldLabel('avatar')));if(root.OpenBotAvatars&&typeof root.OpenBotAvatars.picker==='function'){var avatarPicker=el('div','org-workspaces-instance-avatar-picker');avatarPicker.innerHTML=root.OpenBotAvatars.picker(instanceUi.draft.avatar,instanceUi.draft.color);avatarPicker.addEventListener('click',function(event){var option=event.target.closest&&event.target.closest('.avatar-option');if(!option)return;var chosen=option.getAttribute('data-avatar');if(!chosen)return;instanceEdit('avatar',chosen);avatarPicker.querySelectorAll('.avatar-option').forEach(function(item){var selected=item===option;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));});});avatarField.appendChild(avatarPicker);}advancedBody.appendChild(avatarField);}
    if(instanceEditable('color')){var colorField=el('div','org-workspaces-instance-field'),colorLabel=el('label','',instanceFieldLabel('color')),colorInput=el('input');colorInput.id='org-workspaces-instance-color';colorInput.type='color';colorInput.dataset.instanceField='color';colorInput.value=safeColor(instanceUi.draft.color);colorInput.disabled=instanceUi.loading;colorLabel.htmlFor=colorInput.id;colorInput.addEventListener('input',function(){instanceEdit('color',colorInput.value);});colorField.append(colorLabel,colorInput);advancedBody.appendChild(colorField);}
    if(instanceEditable('tags')){var tagsField=el('div','org-workspaces-instance-field');tagsField.appendChild(el('span','org-workspaces-instance-label',instanceFieldLabel('tags')));tagsField.appendChild(instanceTagEditor());advancedBody.appendChild(tagsField);}
    if(instanceEditable('skills')){var skillsField=el('div','org-workspaces-instance-field');skillsField.appendChild(el('span','org-workspaces-instance-label',instanceFieldLabel('skills')));skillsField.appendChild(instanceSkillsEditor());advancedBody.appendChild(skillsField);}
    if(instanceEditable('model'))advancedBody.appendChild(instanceFormField('model','input',instanceUi.draft.model,{maxLength:160}));
    if(instanceEditable('providerId'))advancedBody.appendChild(instanceSelect('providerId',instanceUi.draft.providerId,[{value:'',label:tr('默认连接','Default connection')}].concat(instanceUi.providers.map(function(item){return {value:item.id,label:item.name};}))));
    if(instanceEditable('temperature'))advancedBody.appendChild(instanceFormField('temperature','number',instanceUi.draft.temperature,{help:tr('范围 0–2。','Range: 0–2.')}));
    if(instanceEditable('harness'))advancedBody.appendChild(instanceSelect('harness',instanceUi.draft.harness,[{value:'',label:tr('默认','Default')},{value:'dsh',label:'DSH'},{value:'pi',label:'Pi'},{value:'legacy',label:'legacy'}]));
    if(instanceEditable('roleLabelOverrides')){var labelsField=el('div','org-workspaces-instance-field');labelsField.appendChild(el('span','org-workspaces-instance-label',instanceFieldLabel('roleLabelOverrides')));labelsField.appendChild(instanceRoleLabelsEditor());advancedBody.appendChild(labelsField);}advanced.appendChild(advancedBody);form.appendChild(advanced);
    if(instanceUi.conflict){
      var conflict=el('section','org-workspaces-instance-conflict');conflict.id='org-workspaces-instance-conflict';conflict.setAttribute('role','alert');
      conflict.appendChild(el('h4','',tr('服务器版本已变化','Server version changed')));
      conflict.appendChild(el('p','org-workspaces-instance-warning',tr('本地草稿已保留。读取最新版本并核对差异后，才能基于新修订继续保存。','Your local draft is preserved. Read the latest version and review the differences before continuing from its revision.')));
      var refresh=button('org-workspaces-instance-refresh','org-workspaces-assets-button',instanceUi.refreshing?tr('正在读取…','Reading…'):tr('读取最新服务器版本','Read latest server version'));refresh.disabled=instanceUi.refreshing;refresh.addEventListener('click',function(){loadWorkspaceInstance({mode:'conflict'});});conflict.appendChild(refresh);
      if(instanceUi.conflictSnapshot){
        var snapshot=instanceUi.conflictSnapshot,details=document.createElement('details');details.id='org-workspaces-instance-server-review';
        details.addEventListener('toggle',function(){var ack=conflict.querySelector('#org-workspaces-instance-review-ack');if(ack)ack.disabled=!details.open;});
        details.appendChild(el('summary','',tr('查看本地草稿与服务器修订 '+snapshot.instance.revision+' 的差异','Review local draft against server revision '+snapshot.instance.revision)));
        var diffList=el('dl','org-workspaces-instance-diff-list'),different=snapshot.editableFields.filter(function(field){return !sameInstanceValue(instanceComparable(field,instanceUi.draft[field]),instanceComparable(field,snapshot.instance.profile[field]));});
        if(!different.length)details.appendChild(el('p','org-workspaces-instance-help',tr('本地草稿与服务器属性一致。','The local draft matches the server properties.')));
        different.forEach(function(field){var row=el('div','org-workspaces-instance-diff-row');row.appendChild(el('dt','',instanceFieldLabel(field)));var values=el('dd','');values.appendChild(el('span','org-workspaces-instance-diff-value',tr('本地草稿：','Local draft: ')+instanceFormat(instanceUi.draft[field],field)));values.appendChild(el('span','org-workspaces-instance-diff-value',tr('服务器：','Server: ')+instanceFormat(snapshot.instance.profile[field],field)));row.appendChild(values);diffList.appendChild(row);});
        if(different.length)details.appendChild(diffList);conflict.appendChild(details);
        var reviewLabel=el('label','org-workspaces-instance-review-label'),ack=el('input');ack.id='org-workspaces-instance-review-ack';ack.type='checkbox';ack.disabled=true;ack.checked=instanceUi.conflictReviewed;
        ack.addEventListener('change',function(){instanceUi.conflictReviewed=ack.checked;var proceed=conflict.querySelector('#org-workspaces-instance-continue');if(proceed)proceed.disabled=!ack.checked;});
        reviewLabel.append(ack,el('span','',tr('我已查看差异，保留本地草稿继续编辑。','I reviewed the differences and want to keep editing my local draft.')));conflict.appendChild(reviewLabel);
        var proceed=button('org-workspaces-instance-continue','org-workspaces-assets-button primary',tr('确认服务器修订并继续','Confirm server revision and continue'));proceed.disabled=!instanceUi.conflictReviewed;
        proceed.addEventListener('click',function(){if(!instanceUi.conflictReviewed||!instanceUi.conflictSnapshot)return;var latest=instanceUi.conflictSnapshot,local=cloneInstanceValue(instanceUi.draft),merge=instanceMergeDraft(latest.instance.profile,local,instanceUi.baseProfile,latest.editableFields);instanceUi.instance=latest.instance;instanceUi.classDefaults=latest.classDefaults;instanceUi.baseProfile=cloneInstanceValue(latest.instance.profile);instanceUi.baseRevision=latest.instance.revision;instanceUi.editableFields=latest.editableFields;instanceUi.providers=latest.providers;instanceUi.execution=latest.execution;instanceUi.draft=merge.profile;instanceUi.conflict=false;instanceUi.conflictSnapshot=null;instanceUi.conflictReviewed=false;instanceUi.error='';instanceUi.notice=tr('服务器修订已确认；本地修改字段已保留，其他字段采用服务器值。检查差异后可单独保存。','Server revision confirmed. Your edited fields are preserved; other fields use the server values. Review the changes, then save them separately.');persistInstanceDraft();renderMain({captureAssets:false});focusInstanceStatus();});
        conflict.appendChild(proceed);
      }
      form.appendChild(conflict);
    }
    var footer=el('div','org-workspaces-instance-footer'),meta=el('span','org-workspaces-instance-meta',tr('实例修订 '+instanceUi.instance.revision,'Instance revision '+instanceUi.instance.revision));meta.id='org-workspaces-instance-revision';footer.append(meta);var dirtyFields=instanceDirtyFields(),dirty=el('span','org-workspaces-instance-dirty-count',dirtyFields.length?tr(dirtyFields.length+' 项未保存',dirtyFields.length+' unsaved change'+(dirtyFields.length===1?'':'s')):'');dirty.id='org-workspaces-instance-dirty-count';footer.appendChild(dirty);var actions=el('div','org-workspaces-instance-actions'),save=button('org-workspaces-instance-save','org-workspaces-assets-button primary',instanceUi.saving?tr('正在保存…','Saving…'):tr('保存实例属性','Save instance properties'));save.type='submit';save.disabled=instanceUi.saving||instanceUi.loading||instanceUi.blocked||instanceUi.conflict||!dirtyFields.length||!instanceUi.editableFields.length;actions.appendChild(save);
    if(instanceUi.blocked){var retry=button('org-workspaces-instance-refresh','org-workspaces-assets-button',instanceUi.refreshing?tr('正在回读…','Reading back…'):tr('重新读取服务器版本','Read server version again'));retry.disabled=instanceUi.refreshing;retry.addEventListener('click',function(){loadWorkspaceInstance({mode:'readback'});});actions.appendChild(retry);}footer.appendChild(actions);form.appendChild(footer);wrapper.appendChild(form);panel.appendChild(wrapper);
  }
  function saveWorkspaceInstance(){
    if(!instanceUi.instance||!instanceUi.draft||instanceUi.saving||instanceUi.loading||instanceUi.blocked||instanceUi.conflict)return;captureInstanceDraft();var dirty=instanceDirtyFields();if(!dirty.length)return;
    var patch={},versionAtStart=instanceUi.editVersion;dirty.forEach(function(field){patch[field]=instancePatchValue(field,instanceUi.draft[field]);});var ticket=instanceTicket,spaceId=instanceUi.spaceId,botId=instanceUi.botId,revision=Number.isSafeInteger(instanceUi.baseRevision)?instanceUi.baseRevision:instanceUi.instance.revision;
    instanceUi.saving=true;instanceUi.error='';instanceUi.notice=tr('正在保存当前空间实例属性…','Saving this space instance…');renderMain({captureAssets:false});
    apiCall('orgWorkspaceInstanceSave',{spaceId:spaceId,botId:botId,expectedRevision:revision,patch:patch}).then(function(value){
      if(!instanceScopeIsCurrent(ticket,spaceId,botId))return;instanceUi.saving=false;instanceUi.blocked=true;instanceUi.notice=value&&value.committed===true?tr('保存已提交，正在回读核对…','Save committed; verifying it from the server…'):tr('正在回读服务器版本…','Reading back the server version…');renderMain({captureAssets:false});return loadWorkspaceInstance({mode:'readback',versionAtStart:versionAtStart,expectedPatch:patch});
    }).catch(function(error){
      if(!instanceScopeIsCurrent(ticket,spaceId,botId))return;instanceUi.saving=false;var flagged=!!(error&&(error.committed===true||error.readbackRequired===true||error.commitUncertain===true||error.committedUncertain===true||error.commitState));
      if(flagged){instanceUi.blocked=true;instanceUi.notice=tr('保存结果需要服务器回读核对；保存已暂停。','The save result needs server read-back verification; saving is paused.');renderMain({captureAssets:false});loadWorkspaceInstance({mode:'readback',versionAtStart:versionAtStart,expectedPatch:patch});return;}
      if(error&&error.code==='STALE_REVISION'){instanceUi.conflict=true;instanceUi.conflictSnapshot=null;instanceUi.conflictReviewed=false;instanceUi.error='';instanceUi.notice=tr('服务器版本已变化；本地草稿已保留。读取并核对最新版本后再继续。','The server version changed. Your local draft is preserved. Read and review the latest version before continuing.');renderMain({captureAssets:false});}
      else{instanceUi.error=safeText(error&&error.message,error)||tr('保存失败；草稿已保留。','Save failed; your draft is preserved.');instanceUi.notice='';renderMain({captureAssets:false});}
    });
  }
  function setAssetsTab(tab,focus){
    if(['instance','shared','files','experience'].indexOf(tab)<0)return;captureAssetsDraft();captureExperienceDraft();captureInstanceDraft();assetsUi.activeTab=tab;
    if(tab==='instance'&&!instanceUi.instance&&!instanceUi.loading)openWorkspaceInstance();
    renderMain({captureAssets:false});
    if(focus){var target=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-assets-tab-'+tab);if(target)target.focus();}
    if(tab==='experience'&&assetsUi.open)loadExperience(lifeEpoch,assetsTicket,assetsUi.key);
  }
  function renderAssetsPanel(){
    var space=currentSpace(),bot=currentBot();if(!space||current.mode!=='private'){clearAssetsUi();renderMain();return;}
    dom.main.replaceChildren();var panel=el('section','org-workspaces-assets-panel');panel.id='org-workspaces-assets-panel';panel.dataset.assetsKey=assetsUi.key;var top=el('div','org-workspaces-assets-top');var heading=el('div','org-workspaces-assets-heading');heading.appendChild(el('h3','org-workspaces-assets-title',tr('实例设置',"Instance settings")));heading.appendChild(el('p','org-workspaces-assets-subtitle',(bot?bot.name:tr('当前 Bot',"Current Bot"))+' · '+space.name+tr(' · 当前实例'," · current instance")));var back=assetsActionButton(tr('返回对话',"Back to chat"),closeAssetsPanel,false);back.id='org-workspaces-assets-back';top.append(heading,back);panel.appendChild(top);
    var tabs=el('div','org-workspaces-assets-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',tr('实例设置页面','Instance settings pages'));
    var tabSpecs=[['instance',['实例属性','Instance properties']],['shared',['共享资料与技能','Shared assets']],['files',['实例文件','Instance files']],['experience',['经验','Experience']]];
    tabSpecs.forEach(function(spec){var tab=button('org-workspaces-assets-tab-'+spec[0],'',tr(spec[1][0],spec[1][1]));tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(assetsUi.activeTab===spec[0]));tab.setAttribute('aria-controls','org-workspaces-assets-content');tab.tabIndex=assetsUi.activeTab===spec[0]?0:-1;tab.addEventListener('click',function(){setAssetsTab(spec[0],false);});tabs.appendChild(tab);});
    tabs.addEventListener('keydown',function(event){var keys=['ArrowLeft','ArrowRight','Home','End'];if(keys.indexOf(event.key)<0)return;event.preventDefault();var tabIds=['instance','shared','files','experience'],index=tabIds.indexOf(assetsUi.activeTab);if(event.key==='Home')index=0;else if(event.key==='End')index=tabIds.length-1;else index=(index+(event.key==='ArrowRight'?1:tabIds.length-1))%tabIds.length;setAssetsTab(tabIds[index],true);});panel.appendChild(tabs);
    if(assetsUi.mutationNotice)panel.appendChild(el('p','org-workspaces-assets-readback',assetsUi.mutationNotice));
    var content=el('div','org-workspaces-assets-content');content.id='org-workspaces-assets-content';content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby','org-workspaces-assets-tab-'+assetsUi.activeTab);content.tabIndex=0;
    if(assetsUi.activeTab==='instance')renderInstanceProperties(content);
    else if(assetsUi.activeTab==='experience'){if(experienceUi.loading){var experienceLoading=el('div','org-workspaces-assets-loading');experienceLoading.setAttribute('role','status');experienceLoading.appendChild(el('p','org-workspaces-chat-empty',tr('正在读取实例经验…','Loading instance experience…')));content.appendChild(experienceLoading);}else renderExperience(content);}
    else if(assetsUi.loading){var loading=el('div','org-workspaces-assets-loading');loading.setAttribute('role','status');loading.appendChild(el('p','org-workspaces-chat-empty',tr('正在读取当前实例资料…',"Loading this instance's assets…")));content.appendChild(loading);}
    else if(assetsUi.activeTab==='files')renderAssetsFiles(content);else renderAssetsShared(content);
    panel.appendChild(content);dom.main.appendChild(panel);dom.assetsPanel=panel;if(assetsUi.activeTab==='experience')updateExperienceButtons();
    panel.addEventListener('keydown',function(event){if(event.key==='Escape'&&!event.isComposing){event.preventDefault();closeAssetsPanel();}});
    if(assetsUi.busy&&assetsUi.activeTab!=='instance')Array.prototype.forEach.call(panel.querySelectorAll('input,textarea,select,button'),function(control){if(control!==back)control.disabled=true;});
  }
  function loadAssetFiles(life,ticket,key,after){
    return apiCall('orgWorkspaceFiles',{action:'list',spaceId:assetsUi.spaceId,botId:assetsUi.botId}).then(function(value){
      if(!assetsIsCurrent(life,ticket,key))return value;assetsUi.files=normalizeAssetFiles(value);assetsUi.filesError='';if(typeof after==='function')after(value);else renderMain({captureAssets:false});return value;
    }).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;assetsUi.filesError=tr('读取实例文件失败：',"Failed to read instance files: ")+safeText(error&&error.message,error);if(typeof after==='function')after(null,error);else renderMain({captureAssets:false});});
  }
  function loadAssetsPanel(life,ticket,key){
    if(!assetsIsCurrent(life,ticket,key))return Promise.resolve();assetsUi.loading=true;assetsUi.catalogError='';assetsUi.filesError='';renderMain();
    var selection={spaceId:assetsUi.spaceId,botId:assetsUi.botId};
    return Promise.all([apiCall('orgWorkspaceAssets',{action:'catalog',spaceId:selection.spaceId,botId:selection.botId}),apiCall('orgWorkspaceFiles',{action:'list',spaceId:selection.spaceId,botId:selection.botId})]).then(function(values){
      if(!assetsIsCurrent(life,ticket,key))return values;var snapshot=normalizeAssetsSnapshot(values[0]);assetsUi.catalog=snapshot.catalog;assetsUi.binding=snapshot.binding;assetsUi.currentRelease=snapshot.currentRelease;assetsUi.bindingError=snapshot.bindingError;assetsUi.files=normalizeAssetFiles(values[1]);assetsUi.loading=false;assetsUi.catalogError='';assetsUi.filesError='';var candidate=assetsUi.compareVersion?assetRelease(assetsUi.compareVersion):null;if(!candidate||candidate.revoked|| (assetsUi.binding&&assetsUi.binding.version&&compareAssetVersions(candidate.version,assetsUi.binding.version)<=0))candidate=latestAvailableAssetVersion(snapshot.catalog,assetsUi.binding&&assetsUi.binding.version);assetsUi.compareVersion=candidate?candidate.version:'';assetsUi.compareRelease=null;assetsUi.compareLoading=!!candidate;renderMain({captureAssets:false});setStatus('');if(candidate)loadAssetComparison(life,ticket,key,candidate.version);return values;
    }).catch(function(error){
      if(!assetsIsCurrent(life,ticket,key))return;assetsUi.loading=false;assetsUi.busy=false;var message=safeText(error&&error.message,error)||tr('资料服务暂不可用。',"Assets service is unavailable.");assetsUi.catalogError=message;assetsUi.filesError=message;renderMain({captureAssets:false});setStatus(tr('读取资料失败：',"Failed to load assets: ")+message,'error');
    });
  }
  function loadAssetComparison(life,ticket,key,version){
    if(!assetsIsCurrent(life,ticket,key)||!version)return;apiCall('orgWorkspaceAssets',{action:'read',spaceId:assetsUi.spaceId,botId:assetsUi.botId,version:assetVersionValue(version)}).then(function(value){if(!assetsIsCurrent(life,ticket,key))return;assetsUi.compareRelease=normalizeAssetRelease(value&&value.release&&typeof value.release==='object'?value.release:value);assetsUi.compareLoading=false;renderMain({captureAssets:false});}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;assetsUi.compareLoading=false;assetsUi.catalogError=assetsUi.catalogError||tr('读取更新内容失败：',"Failed to read update: ")+safeText(error&&error.message,error);renderMain({captureAssets:false});});
  }
  function experienceStatusLabel(status){
    var labels={draft:['待人工验收','Awaiting human review'],accepted:['已人工通过','Human accepted'],failed:['未通过','Failed review'],rejected:['已拒绝','Rejected'],cancelled:['已取消','Cancelled'],publishing:['发布结果待确认','Publication pending'],published:['已发布为类共享版本','Published to class'],publish_unknown:['发布结果未知','Publication outcome unknown']};
    var item=labels[String(status||'')];return item?tr(item[0],item[1]):safeText(status,tr('状态未知','Unknown status'));
  }
  function experienceDate(value){
    if(value===undefined||value===null||value==='')return '';
    var stamp=typeof value==='number'?value:Date.parse(String(value));return Number.isFinite(stamp)&&stamp>0?new Date(stamp).toLocaleString():'';
  }
  function experienceSourceLabel(source){
    var title=safeText(source&&source.title);if(title)title=tr('输入：','Input: ')+title;
    else title=safeText(source&&source.conversationId)||safeText(source&&source.runId)||tr('已完成私聊运行','Completed private run');
    var time=experienceDate(source&&source.endedAt||source&&source.startedAt);
    return title+(time?' · '+time:'');
  }
  function experienceCandidateLabel(candidate){
    var title=safeText(candidate&&candidate.title,tr('未命名候选','Untitled candidate'));
    return title+' · '+experienceStatusLabel(candidate&&candidate.status);
  }
  function experienceValidMaterial(draft){
    if(!draft||!safeText(draft.title).trim()||!safeText(draft.scope).trim()||!safeText(draft.criteria).trim())return false;
    var knowledge=Array.isArray(draft.knowledge)?draft.knowledge:[],skills=Array.isArray(draft.skills)?draft.skills:[];
    if(!knowledge.length&&!skills.length||knowledge.length>32||skills.length>32)return false;
    return knowledge.every(function(item){return item&&safeText(item.id).trim()&&safeText(item.title).trim()&&safeText(item.text).trim();})&&
      skills.every(function(item){return item&&safeText(item.id).trim()&&safeText(item.name).trim();});
  }
  function experienceFrozen(candidate){return !!candidate&&['publishing','published','publish_unknown'].indexOf(String(candidate.status||''))>=0;}
  function experienceCurrentCandidate(){return experienceUi.mode==='candidate'?experienceCandidate(experienceUi.selectedCandidateId):null;}
  function experienceCurrentSource(){
    var candidate=experienceCurrentCandidate(),runId=candidate&&candidate.source&&candidate.source.runId||experienceUi.draft&&experienceUi.draft.runId;
    var source=experienceSource(runId);if(candidate){if(experienceSourceMatchesCandidate(source,candidate))return source;
      var exact=String(experienceUi.candidateSourceRunId||'')===String(runId||'')?experienceUi.candidateSource:null;
      return experienceSourceMatchesCandidate(exact,candidate)?exact:null;}
    return source&&experienceSourceOutput(source)?source:null;
  }
  function loadExperienceCandidateSource(life,ticket,key){
    if(!assetsIsCurrent(life,ticket,key)||!assetsUi.open||assetsUi.activeTab!=='experience')return Promise.resolve(null);
    var candidate=experienceCurrentCandidate(),runId=candidate&&candidate.source&&String(candidate.source.runId||'');
    if(!candidate||!runId)return Promise.resolve(null);
    var listed=experienceSource(runId);
    if(experienceSourceMatchesCandidate(listed,candidate)){experienceUi.source=listed;experienceUi.sourceLoadingRunId='';experienceUi.sourceErrorRunId='';experienceUi.sourceError='';return Promise.resolve(listed);}
    var cached=String(experienceUi.candidateSourceRunId||'')===runId?experienceUi.candidateSource:null;
    if(experienceSourceMatchesCandidate(cached,candidate)){experienceUi.source=cached;experienceUi.sourceLoadingRunId='';experienceUi.sourceErrorRunId='';experienceUi.sourceError='';return Promise.resolve(cached);}
    if(experienceUi.sourceLoadingRunId===runId||experienceUi.sourceErrorRunId===runId)return Promise.resolve(null);
    var sourceTicket=++experienceUi.sourceTicket,experienceTicket=experienceUi.ticket,candidateId=String(candidate.id);
    experienceUi.source=null;experienceUi.candidateSource=null;experienceUi.candidateSourceRunId='';experienceUi.sourceLoadingRunId=runId;experienceUi.sourceErrorRunId='';experienceUi.sourceError='';
    function current(){var selected=experienceCurrentCandidate();return assetsIsCurrent(life,ticket,key)&&experienceUi.key===key&&experienceUi.ticket===experienceTicket&&experienceUi.sourceTicket===sourceTicket&&experienceUi.mode==='candidate'&&String(experienceUi.selectedCandidateId)===candidateId&&selected&&String(selected.source&&selected.source.runId||'')===runId;}
    return apiCall('orgWorkspaceExperience',{action:'source',spaceId:assetsUi.spaceId,botId:assetsUi.botId,runId:runId}).then(function(value){
      if(!current())return value;var exact=value&&value.source;experienceUi.sourceLoadingRunId='';
      if(experienceSourceMatchesCandidate(exact,experienceCurrentCandidate())){experienceUi.candidateSource=exact;experienceUi.candidateSourceRunId=runId;experienceUi.source=exact;experienceUi.sourceErrorRunId='';experienceUi.sourceError='';}
      else{experienceUi.candidateSource=null;experienceUi.candidateSourceRunId='';experienceUi.source=null;experienceUi.sourceErrorRunId=runId;experienceUi.sourceError=tr('服务返回的准确来源与候选记录不匹配。','The exact source returned by the service does not match this candidate record.');}
      renderMain({captureAssets:false});return value;
    }).catch(function(error){
      if(!current())return;experienceUi.source=null;experienceUi.sourceLoadingRunId='';experienceUi.sourceErrorRunId=runId;
      experienceUi.sourceError=tr('无法读取该候选的准确原始输出：','Could not read this candidate’s exact original output: ')+safeText(error&&error.message,tr('来源不可用','Source unavailable'));
      renderMain({captureAssets:false});
    });
  }
  function experienceWritesBlocked(){return !!(experienceUi.loading||experienceUi.busy||experienceUi.readbackRequired||!!experienceUi.sourceLoadingRunId||experienceUi.stale||!assetsUi.open||assetsUi.activeTab!=='experience');}
  function updateExperienceButtons(){
    var panel=dom.assetsPanel;if(!panel||!panel.isConnected)return;
    var blocked=experienceWritesBlocked(),draft=experienceUi.draft,candidate=experienceCurrentCandidate(),source=experienceCurrentSource(),dirty=experienceMaterialDirty();
    var create=panel.querySelector('#org-workspaces-experience-create');if(create)create.disabled=blocked||experienceUi.mode!=='new'||!source||!experienceValidMaterial(draft);
    var update=panel.querySelector('#org-workspaces-experience-update');if(update)update.disabled=blocked||experienceUi.mode!=='candidate'||experienceFrozen(candidate)||!source||!dirty||!experienceValidMaterial(draft);
    var review=panel.querySelector('#org-workspaces-experience-review');if(review)review.disabled=blocked||experienceUi.mode!=='candidate'||experienceFrozen(candidate)||!source||dirty||!experienceUi.reviewAck||!safeText(draft&&draft.reviewNote).trim()||!candidate;
    var publish=panel.querySelector('#org-workspaces-experience-publish');var classReady=!!(assetsUi.catalog&&!assetsUi.catalogError&&!assetsUi.loading);
    if(publish)publish.disabled=blocked||!classReady||!candidate||experienceFrozen(candidate)||candidate.status!=='accepted'||dirty||!source||!candidate.review||candidate.review.candidateDigest!==candidate.digest||safeText(draft&&draft.reviewDecision,'accepted')!=='accepted'||!!safeText(draft&&draft.reviewNote);
    var reload=panel.querySelector('#org-workspaces-experience-readback');if(reload)reload.disabled=experienceUi.loading||experienceUi.busy;
    var refresh=panel.querySelector('#org-workspaces-experience-refresh');if(refresh)refresh.disabled=experienceUi.loading||experienceUi.busy;
    var makeNew=panel.querySelector('#org-workspaces-experience-new');if(makeNew)makeNew.disabled=experienceDraftDirty()||experienceUi.busy||experienceUi.loading;
  }
  function loadExperience(life,ticket,key){
    if(!assetsIsCurrent(life,ticket,key))return Promise.resolve();
    var requestTicket=++experienceEpoch;experienceUi.ticket=requestTicket;experienceUi.sourceTicket++;experienceUi.candidateSource=null;experienceUi.candidateSourceRunId='';experienceUi.sourceLoadingRunId='';experienceUi.sourceErrorRunId='';experienceUi.sourceError='';experienceUi.loading=true;experienceUi.error='';
    renderMain({captureAssets:false});
    return apiCall('orgWorkspaceExperience',{action:'list',spaceId:assetsUi.spaceId,botId:assetsUi.botId}).then(function(value){
      if(!experienceCurrent(life,ticket,key,requestTicket))return value;
      experienceUi.candidates=(Array.isArray(value&&value.candidates)?value.candidates:[]).filter(function(item){return item&&item.id;}).sort(function(a,b){return Number(b.createdAt||0)-Number(a.createdAt||0);});
      experienceUi.sources=(Array.isArray(value&&value.sources)?value.sources:[]).filter(function(item){return item&&item.runId;});
      experienceUi.loading=false;
      if(experienceUi.mode==='candidate'){
        var currentCandidate=experienceCurrentCandidate();
        if(!currentCandidate){experienceUi.stale=true;experienceUi.error=tr('当前实例中未找到此候选。请核对空间与 Bot 后重新读取。','This candidate was not found for the current instance. Check the space and Bot, then reload.');}
        else if(experienceUi.baseRevision!==currentCandidate.revision||experienceUi.baseDigest!==currentCandidate.digest){
          if(experienceDraftDirty()){experienceUi.stale=true;experienceUi.notice=tr('候选已在其他位置更新；当前草稿保留。先核对或放弃草稿后再继续。','This candidate changed elsewhere. Your draft is preserved; review or discard it before continuing.');}
          else experienceEditorFor('candidate',currentCandidate.id);
        }
      }else if(experienceUi.mode==='new'&&experienceUi.draft&&!experienceUi.draft.runId&&experienceUi.sources.length){experienceUi.draft.runId=String(experienceUi.sources[0].runId);}
      if(experienceUi.mode==='new'&&experienceUi.draft&&experienceUi.draft.runId&&experienceDraftDirty()){
        var matchingCandidate=experienceUi.candidates.find(function(item){return item.source&&String(item.source.runId)===String(experienceUi.draft.runId)&&experienceMaterialKey(item)===experienceMaterialKey(experienceUi.draft);});
        if(matchingCandidate){experienceEditorFor('candidate',matchingCandidate.id);experienceUi.notice=tr('已找到相同来源和内容的候选；已打开现有候选，未重复创建。','A candidate with the same source and content already exists. It is open here; no duplicate was created.');}
      }
      if(experienceUi.readbackRequired){experienceUi.readbackRequired=false;var pending=experienceUi.pendingUnknown;experienceUi.pendingUnknown=null;
        if(pending&&pending.action==='create'){
          var match=experienceUi.candidates.find(function(item){return item.source&&String(item.source.runId)===String(pending.input.runId)&&experienceMaterialKey(item)===experienceMaterialKey(pending.input);});
          if(match){experienceEditorFor('candidate',match.id);experienceUi.notice=tr('已重新读取并找到保存的候选；没有重复创建。','Read-back found the saved candidate; no duplicate was created.');}
          else experienceUi.notice=tr('已重新读取候选列表；未找到匹配项。请核对列表后再决定是否重新提交。','The candidate list was re-read and no match was found. Review it before deciding whether to submit again.');
        }else experienceUi.notice=tr('已重新读取当前实例的实际候选状态，请先核对后再继续。','The current instance state was re-read. Review it before continuing.');
      }
      experienceUi.source=experienceCurrentSource();if(experienceUi.mode==='candidate')loadExperienceCandidateSource(life,ticket,key);captureExperienceDraft();renderMain({captureAssets:false});
      if(experienceUi.readbackRequired===false&&experienceUi.notice)setStatus(experienceUi.notice,'ok');
      return value;
    }).catch(function(error){
      if(!experienceCurrent(life,ticket,key,requestTicket))return;
      experienceUi.loading=false;experienceUi.error=safeText(error&&error.message,error)||tr('经验服务暂不可用。','Experience service is unavailable.');renderMain({captureAssets:false});setStatus(experienceUi.error,'error');
    });
  }
  function selectExperienceEditor(value){
    var next=value==='new'?'new':'candidate:'+idFor(value);
    if(next!==experienceEditorKey()&&experienceDraftDirty()){
      var selector=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-experience-candidate');if(selector)selector.value=experienceUi.mode==='new'?'new':experienceUi.selectedCandidateId;
      experienceUi.notice=tr('当前编辑有未保存内容；先保存或放弃后再切换候选。','This editor has unsaved changes. Save or discard them before switching candidates.');
      updateExperienceMessage();return;
    }
    captureExperienceDraft();experienceUi.sourceTicket++;experienceUi.candidateSource=null;experienceUi.candidateSourceRunId='';experienceUi.sourceLoadingRunId='';experienceUi.sourceErrorRunId='';experienceUi.sourceError='';
    if(value==='new')experienceEditorFor('new','');else experienceEditorFor('candidate',value);
    experienceUi.notice='';experienceUi.error='';experienceUi.source=experienceCurrentSource();if(experienceUi.mode==='candidate')loadExperienceCandidateSource(lifeEpoch,assetsTicket,assetsUi.key);renderMain({captureAssets:false});
  }
  function updateExperienceMessage(){
    var node=dom.assetsPanel&&dom.assetsPanel.querySelector('#org-workspaces-experience-message');if(!node)return;
    var message=experienceUi.error||experienceUi.notice||(experienceDraftDirty()?tr('有未保存修改。保存后会使旧人工验收失效。','Unsaved changes. Saving will invalidate the previous human review.'):'');
    node.textContent=message;node.dataset.tone=experienceUi.error?'error':'';node.setAttribute('role',experienceUi.error?'alert':'status');updateExperienceButtons();
  }
  function experienceControlDisabled(candidate){return !!(experienceUi.busy||experienceUi.loading||experienceUi.readbackRequired||experienceUi.stale||experienceFrozen(candidate)||experienceUi.mode==='candidate'&&!experienceCurrentSource());}
  function experienceField(parent,labelText,key,kind,options){
    options=options||{};var wrapper=el('div','org-workspaces-experience-field'),label=el('label','',labelText),control=el(kind==='textarea'?'textarea':'input');
    control.id='org-workspaces-experience-'+key;label.htmlFor=control.id;control.value=safeText(experienceUi.draft&&experienceUi.draft[key]);
    if(options.rows)control.rows=options.rows;if(options.maxLength)control.maxLength=options.maxLength;if(options.placeholder)control.placeholder=options.placeholder;
    control.disabled=experienceControlDisabled(experienceCurrentCandidate());
    control.addEventListener('input',function(){experienceUi.draft[key]=control.value;if(key==='title'||key==='scope'||key==='criteria')experienceUi.reviewAck=false;captureExperienceDraft();updateExperienceMessage();});
    wrapper.append(label,control);if(options.help)wrapper.appendChild(el('p','org-workspaces-experience-help',options.help));parent.appendChild(wrapper);return control;
  }
  function experienceItemsEditor(parent,kind){
    var knowledge=kind==='knowledge',key=knowledge?'knowledge':'skills',items=Array.isArray(experienceUi.draft[key])?experienceUi.draft[key]:[],candidate=experienceCurrentCandidate();
    var section=el('section','org-workspaces-experience-items');var heading=el('div','org-workspaces-assets-section-head');
    heading.appendChild(el('h4','',knowledge?tr('知识','Knowledge'):tr('技能','Skills')));
    heading.appendChild(el('span','org-workspaces-assets-meta',tr(items.length+' 项',items.length+' item'+(items.length===1?'':'s'))));section.appendChild(heading);
    var list=el('div','org-workspaces-experience-item-list');
    items.forEach(function(item,index){
      var row=el('div','org-workspaces-experience-item');row.dataset.experienceItem=key;
      var fields=el('div','org-workspaces-experience-item-fields');
      var first=el('input');first.type='text';first.maxLength=120;first.value=safeText(item&&item[knowledge?'title':'name']);first.disabled=experienceControlDisabled(candidate);
      first.setAttribute('aria-label',knowledge?tr('知识标题','Knowledge title'):tr('技能名称','Skill name'));
      var second=el('textarea');second.rows=knowledge?3:2;second.maxLength=8000;second.value=safeText(item&&item[knowledge?'text':'desc']);second.disabled=experienceControlDisabled(candidate);
      second.setAttribute('aria-label',knowledge?tr('知识正文','Knowledge text'):tr('技能说明','Skill description'));
      first.addEventListener('input',function(){experienceUi.draft[key][index][knowledge?'title':'name']=first.value;experienceUi.reviewAck=false;captureExperienceDraft();updateExperienceMessage();});
      second.addEventListener('input',function(){experienceUi.draft[key][index][knowledge?'text':'desc']=second.value;experienceUi.reviewAck=false;captureExperienceDraft();updateExperienceMessage();});
      fields.append(first,second);row.appendChild(fields);
      var remove=button('', 'org-workspaces-instance-remove',tr('移除','Remove'));remove.disabled=experienceControlDisabled(candidate);remove.setAttribute('aria-label',tr('移除第 '+(index+1)+' 项', 'Remove item '+(index+1)));
      remove.addEventListener('click',function(){experienceUi.draft[key].splice(index,1);experienceUi.reviewAck=false;captureExperienceDraft();renderMain({captureAssets:false});});
      row.appendChild(remove);list.appendChild(row);
    });
    if(!items.length)list.appendChild(el('p','org-workspaces-muted',knowledge?tr('还没有知识条目。','No knowledge entries yet.'):tr('还没有技能条目。','No skills yet.')));
    section.appendChild(list);
    var add=button('', 'org-workspaces-instance-add',knowledge?tr('添加知识','Add knowledge'):tr('添加技能','Add skill'));add.id='org-workspaces-experience-'+key+'-add';add.disabled=experienceControlDisabled(candidate)||items.length>=32;
    add.addEventListener('click',function(){
      var index=experienceUi.draft[key].length;experienceUi.draft[key].push(knowledge?{id:uuid(),title:'',text:''}:{id:uuid(),name:'',desc:''});
      experienceUi.reviewAck=false;captureExperienceDraft();renderMain({captureAssets:false});
      var target=dom.assetsPanel&&dom.assetsPanel.querySelectorAll('.org-workspaces-experience-item-fields input')[index];if(knowledge&&target)target.focus();
    });
    section.appendChild(add);parent.appendChild(section);
  }
  function renderExperienceEvidence(parent,source,candidate){
    var binding=candidate&&candidate.source||{},fields=[
      [tr('运行 ID','Run ID'),source&&source.runId||binding.runId],
      [tr('会话 ID','Conversation ID'),source&&source.conversationId||binding.conversationId],
      [tr('空间 ID','Space ID'),source&&source.spaceId||binding.spaceId],
      [tr('Bot ID','Bot ID'),source&&source.botId||binding.botId],
      [tr('实例 ID','Instance ID'),source&&source.instanceId||binding.instanceId],
      [tr('实例修订','Instance revision'),source&&source.instanceRevision!==undefined?source.instanceRevision:binding.instanceRevision],
      [tr('准确输出摘要','Exact output digest'),source&&source.outputDigest||binding.outputDigest],
      [tr('候选摘要','Candidate digest'),candidate&&candidate.digest]
    ].filter(function(field){return field[1]!==undefined&&field[1]!==null&&field[1]!=='';});
    if(!fields.length)return;
    var details=document.createElement('details');details.className='org-workspaces-experience-evidence';
    details.appendChild(el('summary','',tr('证据详情','Evidence details')));
    var list=el('dl','org-workspaces-experience-evidence-list');fields.forEach(function(field){var row=el('div','org-workspaces-experience-evidence-row');row.appendChild(el('dt','',field[0]));row.appendChild(el('dd','',String(field[1])));list.appendChild(row);});
    details.appendChild(list);parent.appendChild(details);
  }
  function renderExperienceSource(parent,source,candidate){
    var section=el('section','org-workspaces-experience-source');section.appendChild(el('h4','',tr('来源与实际输出','Source and actual output')));
    if(candidate&&(!source||!experienceSourceMatchesCandidate(source,candidate))){
      var runId=String(candidate.source&&candidate.source.runId||''),space=currentSpace(),message;
      if(runId&&experienceUi.sourceLoadingRunId===runId)message=tr('正在按候选记录读取这条准确原始输出。验收和编辑会在来源核对完成前保持禁用。','Reading the exact original output recorded for this candidate. Review and editing stay disabled until it is verified.');
      else if(runId&&experienceUi.sourceErrorRunId===runId)message=experienceUi.sourceError||tr('准确原始输出当前不可用；不能据此验收、编辑或发布。','The exact original output is unavailable. It cannot be reviewed, edited, or published.');
      else message=tr('准确原始输出当前不可用或来源修订已变化；不能据此验收、编辑或发布。请重新读取后核对。','The exact original output is unavailable or its source revision changed. It cannot be reviewed, edited, or published. Reload and verify it.');
      var sourceLoading=runId&&experienceUi.sourceLoadingRunId===runId;
      var unavailable=el('p',sourceLoading?'org-workspaces-experience-source-loading':'org-workspaces-assets-warning',message);unavailable.setAttribute('role',sourceLoading?'status':'alert');section.appendChild(unavailable);
      var fixed=candidate.source||{},meta=[space&&space.name?tr('空间 ','Space ')+space.name:'',fixed.instanceRevision!==undefined?tr('实例修订 ','Instance revision ')+String(fixed.instanceRevision):''].filter(Boolean).join(' · ');
      if(meta)section.appendChild(el('p','org-workspaces-assets-meta',meta));renderExperienceEvidence(section,null,candidate);parent.appendChild(section);return;
    }
    if(!source){section.appendChild(el('p','org-workspaces-muted',tr('请选择一个当前空间中已完成、绑定此实例的私聊运行。','Choose a completed private run bound to this instance in the current space.')));parent.appendChild(section);return;}
    var space=currentSpace(),meta=[space&&space.name?tr('空间 ','Space ')+space.name:'',
      source.instanceRevision!==undefined?tr('实例修订 ','Instance revision ')+String(source.instanceRevision):'',
      experienceDate(source.endedAt)?tr('完成 ','Completed ')+experienceDate(source.endedAt):''].filter(Boolean).join(' · ');
    if(meta)section.appendChild(el('p','org-workspaces-assets-meta',meta));
    if(source.title)section.appendChild(el('p','org-workspaces-experience-input-summary',tr('本次输入摘要：','Run input summary: ')+String(source.title)));
    var output=experienceSourceOutput(source);
    if(!output){section.appendChild(el('p','org-workspaces-assets-warning',tr('服务未返回准确输出正文；不能创建或验收候选。','The service did not return the exact output text; a candidate cannot be created or reviewed.')));renderExperienceEvidence(section,source,candidate);parent.appendChild(section);return;}
    var details=document.createElement('details');details.open=true;details.className='org-workspaces-experience-output';
    details.appendChild(el('summary','',tr('查看实际输出','Review actual output')));details.appendChild(el('pre','',output));section.appendChild(details);renderExperienceEvidence(section,source,candidate);parent.appendChild(section);
  }
  function renderExperienceMaterialEditor(parent,candidate){
    var disabled=experienceControlDisabled(candidate);var title=experienceField(parent,tr('候选标题','Candidate title'),'title','input',{maxLength:120});
    var scope=experienceField(parent,tr('适用范围','Applicable scope'),'scope','textarea',{rows:3,maxLength:2000,help:tr('范围留在当前空间经验中；发布时只分享知识和技能。需要跨空间理解的范围请明确写进共享内容。','Scope stays with this space’s experience; publishing shares only knowledge and skills. Put any cross-space scope needed by other instances in the shared content itself.')});
    var criteria=experienceField(parent,tr('验收标准','Acceptance criteria'),'criteria','textarea',{rows:4,maxLength:4000});
    title.disabled=disabled;scope.disabled=disabled;criteria.disabled=disabled;
    experienceItemsEditor(parent,'knowledge');experienceItemsEditor(parent,'skills');
  }
  function renderExperienceReviewRecord(parent,candidate){
    if(!candidate.review)return;
    var box=el('section','org-workspaces-experience-review-record');box.appendChild(el('h4','',tr('上次人工验收','Last human review')));
    var summary=experienceStatusLabel(candidate.review.decision)+(experienceDate(candidate.review.at)?' · '+experienceDate(candidate.review.at):'');box.appendChild(el('p','org-workspaces-assets-meta',summary));
    if(candidate.review.criteria)box.appendChild(el('p','org-workspaces-experience-review-criteria',tr('验收标准：','Criteria: ')+String(candidate.review.criteria)));
    if(candidate.review.note)box.appendChild(el('p','org-workspaces-experience-review-note',String(candidate.review.note)));
    parent.appendChild(box);
  }
  function renderExperienceCandidateEditor(parent){
    var candidate=experienceCurrentCandidate(),draft=experienceUi.draft;
    if(!candidate){parent.appendChild(el('p','org-workspaces-assets-warning',tr('未找到所选候选；请重新读取列表。','The selected candidate was not found. Reload the list.')));return;}
    var frozen=experienceFrozen(candidate),header=el('div','org-workspaces-experience-candidate-head');header.appendChild(el('strong','',experienceStatusLabel(candidate.status)));
    header.appendChild(el('span','org-workspaces-assets-meta',tr('候选修订 ', 'Candidate revision ')+String(candidate.revision)));parent.appendChild(header);
    var source=experienceCurrentSource();renderExperienceSource(parent,source,candidate);
    if(experienceUi.stale){
      var publishedStale=candidate.status==='published',conflict=el('section',publishedStale?'org-workspaces-experience-published-note':'org-workspaces-experience-conflict');
      conflict.setAttribute('role',publishedStale?'status':'alert');conflict.appendChild(el('p','',publishedStale
        ?tr('此候选已发布并冻结；本地草稿基于旧修订，无法再保存。可放弃旧草稿以查看已发布内容。','This candidate is published and frozen. The local draft uses an older revision and cannot be saved. Discard it to inspect the published content.')
        :tr('当前草稿基于旧修订。服务会拒绝旧写入；先核对并载入最新候选，或放弃草稿。','This draft is based on an older revision. The service will reject stale writes; review and load the latest candidate or discard the draft.')));
      var discard=assetsActionButton(publishedStale?tr('放弃旧草稿并查看已发布候选','Discard old draft and view published candidate'):tr('放弃草稿并载入最新候选','Discard draft and load latest'),experienceDiscardDraft,false);discard.disabled=experienceUi.busy||experienceUi.loading;conflict.appendChild(discard);parent.appendChild(conflict);
    }
    if(frozen){
      var frozenMessage,frozenClass;
      if(candidate.status==='published'){
        var publishedRelease=assetsUi.catalog&&!assetsUi.loading&&!assetsUi.catalogError?assetRelease(candidate.publication&&candidate.publication.version):null;
        frozenClass='org-workspaces-experience-published-note';
        frozenMessage=publishedRelease&&publishedRelease.revoked
          ?tr('此类版本已撤回；已发布记录保留，此版本当前不可采用。请在共享资料与技能中核对可用版本。','This class release was withdrawn. The publication record remains, but this version is unavailable for adoption. Check available versions in Shared assets.')
          :publishedRelease
            ?tr('此候选已成为类共享版本。共享版本不会自动绑定到此实例或其他实例。','This candidate is a class release. The release is not automatically bound to this instance or any other instance.')
            :tr('候选的已发布记录仍保留；类版本可用性尚未核实。请在共享资料与技能中核对。发布不会自动绑定到此实例或其他实例。','The publication record remains; class version availability has not been verified. Check Shared assets. Publication does not bind this instance or any other instance automatically.');
      }else{
        frozenClass='org-workspaces-assets-warning';
        frozenMessage=tr('发布提交或结果未确认。为避免重复发布，此候选已冻结；请先在共享资料与技能中核对类版本。','Publication was submitted or its result is unknown. This candidate is frozen to prevent replay; inspect class versions in Shared assets first.');
      }
      var frozenNote=el('p',frozenClass,frozenMessage);frozenNote.setAttribute('role',candidate.status==='published'?'status':'alert');parent.appendChild(frozenNote);
    }
    renderExperienceMaterialEditor(parent,candidate);
    if(!frozen){
      var editActions=el('div','org-workspaces-assets-actions');var save=assetsActionButton(tr('保存候选修改','Save candidate changes'),function(){
        if(!experienceValidMaterial(experienceUi.draft))return;
        experienceWrite('update',{action:'update',spaceId:assetsUi.spaceId,botId:assetsUi.botId,candidateId:candidate.id,expectedRevision:experienceUi.baseRevision,
          patch:experienceMaterial(experienceUi.draft)},function(result,saved){
          if(!saved||!saved.id)return;delete experienceSavedScope(assetsUi.key).editors['candidate:'+String(saved.id)];experienceEditorFor('candidate',saved.id);
          experienceUi.draft.reviewNote='';experienceUi.draft.reviewDecision='accepted';experienceUi.notice=tr('候选已保存，旧人工验收已失效；请重新核对原始输出与标准。','Candidate saved. The previous human review is invalid; review the original output and criteria again.');
        });
      },true);save.id='org-workspaces-experience-update';editActions.appendChild(save);parent.appendChild(editActions);
      renderExperienceReviewRecord(parent,candidate);
      var reviewSection=el('section','org-workspaces-experience-review-form');reviewSection.appendChild(el('h4','',tr('人工验收','Human review')));
      reviewSection.appendChild(el('p','org-workspaces-experience-help',tr('请先查看上方完整原始输出，并按候选中的验收标准核对。此记录来自人工判断，不代表自动质量评分或已验证的持续改进。','Read the full original output above and check it against the candidate’s acceptance criteria. This records a human judgment; it is not an automatic quality score or proof of ongoing improvement.')));
      var decisionWrap=el('div','org-workspaces-experience-field'),decisionLabel=el('label','',tr('人工结论','Human decision'));decisionLabel.htmlFor='org-workspaces-experience-decision';
      var decision=el('select');decision.id='org-workspaces-experience-decision';[['accepted',['通过','Accepted']],['failed',['未通过','Failed']],['rejected',['拒绝','Rejected']],['cancelled',['取消','Cancelled']]].forEach(function(spec){var option=el('option','',tr(spec[1][0],spec[1][1]));option.value=spec[0];decision.appendChild(option);});
      decision.value=safeText(draft.reviewDecision,'accepted');decision.disabled=experienceControlDisabled(candidate);decision.addEventListener('change',function(){experienceUi.draft.reviewDecision=decision.value;captureExperienceDraft();updateExperienceMessage();});decisionWrap.append(decisionLabel,decision);reviewSection.appendChild(decisionWrap);
      var note=el('div','org-workspaces-experience-field'),noteLabel=el('label','',tr('验收记录','Review note'));noteLabel.htmlFor='org-workspaces-experience-review-note';var noteInput=el('textarea');noteInput.id='org-workspaces-experience-review-note';noteInput.rows=3;noteInput.maxLength=4000;noteInput.value=safeText(draft.reviewNote);noteInput.disabled=experienceControlDisabled(candidate);noteInput.addEventListener('input',function(){experienceUi.draft.reviewNote=noteInput.value;captureExperienceDraft();updateExperienceMessage();});note.append(noteLabel,noteInput);reviewSection.appendChild(note);
      var ackLabel=el('label','org-workspaces-experience-ack');var ack=el('input');ack.type='checkbox';ack.id='org-workspaces-experience-review-ack';ack.checked=experienceUi.reviewAck;ack.disabled=experienceControlDisabled(candidate)||!source||experienceMaterialDirty();ack.addEventListener('change',function(){experienceUi.reviewAck=ack.checked;updateExperienceButtons();});ackLabel.append(ack,el('span','',tr('我已查看上述实际输出，并按当前验收标准逐项核对。','I reviewed the actual output above against the current acceptance criteria.')));reviewSection.appendChild(ackLabel);
      var review=assetsActionButton(tr('记录人工结论','Record human decision'),function(){
        var current=experienceCurrentCandidate(),actualSource=experienceCurrentSource();if(!current||!actualSource||!experienceUi.reviewAck||!safeText(experienceUi.draft.reviewNote).trim())return;
        experienceWrite('review',{action:'review',spaceId:assetsUi.spaceId,botId:assetsUi.botId,candidateId:current.id,expectedRevision:experienceUi.baseRevision,
          expectedDigest:experienceUi.baseDigest,outputDigest:actualSource.outputDigest,decision:experienceUi.draft.reviewDecision,note:experienceUi.draft.reviewNote},function(result,saved){
          if(!saved||!saved.id)return;delete experienceSavedScope(assetsUi.key).editors['candidate:'+String(saved.id)];experienceEditorFor('candidate',saved.id);
          experienceUi.draft.reviewDecision=saved.review&&saved.review.decision||'accepted';experienceUi.draft.reviewNote='';experienceUi.reviewAck=false;
          experienceUi.notice=tr('人工结论已绑定当前候选摘要和准确输出。','The human decision is bound to this candidate digest and exact output.');
        });
      },true);review.id='org-workspaces-experience-review';reviewSection.appendChild(review);parent.appendChild(reviewSection);
      var publishAllowed=candidate.status==='accepted'&&candidate.review&&candidate.review.candidateDigest===candidate.digest;
      if(publishAllowed){
        var publishSection=el('section','org-workspaces-experience-publish');publishSection.appendChild(el('h4','',tr('可选：发布到 Bot 类','Optional: publish to Bot class')));
        publishSection.appendChild(el('p','org-workspaces-experience-help',tr('发布只分享下列知识和技能，并由本机主进程再次确认；不会更改当前实例绑定，也不会更新其他实例。适用范围和验收标准留在本空间。','Publishing shares only the knowledge and skills below and requires confirmation by the desktop host. It does not change this instance’s binding or update other instances. Scope and criteria remain in this space.')));
        var publish=assetsActionButton(tr('申请发布到类共享版本…','Review and publish to class…'),function(){
          var current=experienceCurrentCandidate();if(!current||!current.review)return;
          experienceWrite('publish',{action:'publish',spaceId:assetsUi.spaceId,botId:assetsUi.botId,candidateId:current.id,expectedRevision:experienceUi.baseRevision,
            expectedDigest:experienceUi.baseDigest,expectedClassRevision:assetsUi.catalog&&assetsUi.catalog.revision,shareConfirmed:true},function(result,saved){
            if(!saved||!saved.id)return;experienceUi.notice=tr('类共享版本已发布；没有自动绑定或升级任何实例。','The class release was published. No instance was bound or upgraded automatically.');
            assetsUi.compareVersion=assetVersionText(saved.publication&&saved.publication.version);setAssetsTab('shared',false);loadAssetsPanel(lifeEpoch,assetsTicket,assetsUi.key);
          });
        },true);publish.id='org-workspaces-experience-publish';publishSection.appendChild(publish);
        if(!assetsUi.catalog||assetsUi.catalogError)publishSection.appendChild(el('p','org-workspaces-assets-warning',tr('共享类目录尚未读取成功，暂不能发布。请重试读取共享资料。','The class catalog is unavailable. Publishing is disabled until Shared assets loads successfully.')));
        parent.appendChild(publishSection);
      }
    }
    if(candidate.status==='published'&&candidate.publication){
      var publication=el('section','org-workspaces-experience-published');publication.appendChild(el('h4','',tr('类共享版本','Class release')));
      publication.appendChild(el('p','org-workspaces-assets-meta',tr('版本 ', 'Version ')+String(candidate.publication.version||'—')+' · '+safeText(candidate.publication.releaseDigest)));
      var inspect=assetsActionButton(tr('在共享资料与技能中查看','View in Shared assets'),function(){assetsUi.compareVersion=assetVersionText(candidate.publication.version);setAssetsTab('shared',false);loadAssetsPanel(lifeEpoch,assetsTicket,assetsUi.key);},false);publication.appendChild(inspect);parent.appendChild(publication);
    }
  }
  function renderExperienceNewEditor(parent){
    var draft=experienceUi.draft||emptyExperienceDraft(''),source=experienceCurrentSource();var sourceField=el('div','org-workspaces-experience-field');
    var sourceLabel=el('label','',tr('已完成的私聊运行','Completed private run'));sourceLabel.htmlFor='org-workspaces-experience-source';sourceField.appendChild(sourceLabel);
    var sourceSelect=el('select');sourceSelect.id='org-workspaces-experience-source';
    if(!experienceUi.sources.length){var noSource=el('option','',tr('没有可核验的完成运行','No eligible completed runs'));noSource.value='';noSource.disabled=true;sourceSelect.appendChild(noSource);}
    experienceUi.sources.forEach(function(item){var option=el('option','',experienceSourceLabel(item));option.value=String(item.runId);sourceSelect.appendChild(option);});
    sourceSelect.value=safeText(draft.runId);sourceSelect.disabled=experienceUi.busy||experienceUi.loading||experienceUi.readbackRequired;
    sourceSelect.addEventListener('change',function(){if(experienceDraftDirty()){sourceSelect.value=safeText(experienceUi.draft.runId);experienceUi.notice=tr('先保存或清除当前候选草稿，再切换来源。','Save or clear this candidate draft before switching its source.');updateExperienceMessage();return;}experienceUi.draft.runId=sourceSelect.value;experienceUi.source=experienceCurrentSource();captureExperienceDraft();renderMain({captureAssets:false});});
    sourceField.appendChild(sourceSelect);sourceField.appendChild(el('p','org-workspaces-experience-help',tr('仅列当前空间中最近20条已完成且绑定此实例的私聊运行。','Only the 20 most recent completed private runs bound to this instance in the current space are listed.')));parent.appendChild(sourceField);
    renderExperienceSource(parent,source,null);
    parent.appendChild(el('p','org-workspaces-experience-help',tr('创建只保存待验收候选，不会自动通过或改变实例行为。','Creating a candidate only saves it for review. It does not accept it or change instance behavior.')));
    renderExperienceMaterialEditor(parent,null);
    var actions=el('div','org-workspaces-assets-actions');var create=assetsActionButton(tr('保存为候选','Save as candidate'),function(){
      var actual=experienceCurrentSource(),currentDraft=experienceUi.draft;if(!actual||!experienceValidMaterial(currentDraft))return;
      var input={action:'create',spaceId:assetsUi.spaceId,botId:assetsUi.botId,runId:String(actual.runId),title:String(currentDraft.title),scope:String(currentDraft.scope),criteria:String(currentDraft.criteria),
        knowledge:cloneExperience(currentDraft.knowledge),skills:cloneExperience(currentDraft.skills)};
      experienceWrite('create',input,function(result,candidate){
        if(!candidate||!candidate.id)return;experienceEditorFor('candidate',candidate.id);experienceUi.notice=tr('候选已保存，尚未人工验收。','Candidate saved. Human review is still required.');
      });
    },true);create.id='org-workspaces-experience-create';actions.appendChild(create);parent.appendChild(actions);
  }
  function renderExperience(parent){
    parent.classList.add('org-workspaces-experience-panel');
    var note=el('p','org-workspaces-assets-note',tr('经验按当前空间与 Bot 实例隔离。候选从已完成私聊提炼；必须由人核对实际输出和验收标准，发布共享为可选步骤。','Experience is isolated by space and Bot instance. Candidates come from completed private runs and require human review of the actual output against the criteria. Class publication is optional.'));
    parent.appendChild(note);
    if(experienceUi.readbackRequired){var readback=el('p','org-workspaces-assets-warning',tr('上次写入结果未知；先重新读取实际候选状态，再决定是否继续。不会自动重试。','The previous write result is unknown. Re-read the actual candidate state before deciding what to do. It will not be retried automatically.'));parent.appendChild(readback);}
    if(experienceUi.error)parent.appendChild(el('p','org-workspaces-assets-warning',experienceUi.error));
    var toolbar=el('div','org-workspaces-experience-toolbar');var chooser=el('div','org-workspaces-experience-field');var label=el('label','',tr('候选','Candidate'));label.htmlFor='org-workspaces-experience-candidate';var select=el('select');select.id='org-workspaces-experience-candidate';
    var newOption=el('option','',tr('选择已保存候选…','Select a saved candidate…'));newOption.value='new';newOption.disabled=true;select.appendChild(newOption);
    experienceUi.candidates.forEach(function(candidate){var option=el('option','',experienceCandidateLabel(candidate));option.value=String(candidate.id);select.appendChild(option);});
    select.value=experienceUi.mode==='new'?'new':experienceUi.selectedCandidateId;select.disabled=experienceUi.loading||experienceUi.busy;
    select.addEventListener('change',function(){selectExperienceEditor(select.value);});chooser.append(label,select);toolbar.appendChild(chooser);
    var toolbarActions=el('div','org-workspaces-experience-toolbar-actions');var makeNew=assetsActionButton(tr('新建候选','New candidate'),function(){selectExperienceEditor('new');},false);makeNew.id='org-workspaces-experience-new';makeNew.disabled=experienceDraftDirty()||experienceUi.busy||experienceUi.loading;toolbarActions.appendChild(makeNew);
    var refresh=assetsActionButton(experienceUi.readbackRequired?tr('读取实际状态','Read actual state'):tr('重新读取','Reload'),function(){loadExperience(lifeEpoch,assetsTicket,assetsUi.key);},false);refresh.id='org-workspaces-experience-refresh';toolbarActions.appendChild(refresh);toolbar.appendChild(toolbarActions);parent.appendChild(toolbar);
    var message=el('p','org-workspaces-experience-message');message.id='org-workspaces-experience-message';message.setAttribute('role',experienceUi.error?'alert':'status');message.dataset.tone=experienceUi.error?'error':'';parent.appendChild(message);
    if(experienceUi.mode==='new')renderExperienceNewEditor(parent);else renderExperienceCandidateEditor(parent);
    updateExperienceMessage();
  }
  function experienceStoreCandidate(candidate){
    if(!candidate||!candidate.id)return;
    var index=experienceUi.candidates.findIndex(function(item){return String(item.id)===String(candidate.id);});
    if(index<0)experienceUi.candidates.push(candidate);else experienceUi.candidates[index]=candidate;
    experienceUi.candidates.sort(function(a,b){return Number(b.createdAt||0)-Number(a.createdAt||0);});
  }
  function experienceDiscardDraft(){
    var saved=experienceSavedScope(experienceUi.key),key=experienceEditorKey();delete saved.editors[key];saved.selected=key;
    if(experienceUi.mode==='candidate')experienceEditorFor('candidate',experienceUi.selectedCandidateId);
    else experienceEditorFor('new','');
    experienceUi.stale=false;experienceUi.notice=tr('已载入最新候选；未保存草稿已放弃。','The latest candidate is loaded; the unsaved draft was discarded.');experienceUi.error='';renderMain({captureAssets:false});
  }
  function experienceWrite(action,input,onSuccess){
    if(experienceWritesBlocked())return;
    var life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key,requestTicket=++experienceEpoch;
    experienceUi.ticket=requestTicket;experienceUi.busy=true;experienceUi.error='';experienceUi.notice='';captureExperienceDraft();renderMain({captureAssets:false});
    setStatus(tr('正在保存经验候选…','Saving experience candidate…'));
    apiCall('orgWorkspaceExperience',input).then(function(result){
      if(!experienceCurrent(life,ticket,key,requestTicket))return result;
      experienceUi.busy=false;
      if(result&&result.cancelled===true){
        experienceUi.notice=tr('已取消分享；候选仍保留为已人工验收，未发布也未改变实例绑定。','Sharing was canceled. The candidate remains human accepted; nothing was published or bound to this instance.');captureExperienceDraft();renderMain({captureAssets:false});
        return loadExperience(life,ticket,key).then(function(){return result;});
      }
      var candidate=result&&result.candidate||result&&result.item||result;
      if(candidate&&candidate.id)experienceStoreCandidate(candidate);
      if(typeof onSuccess==='function')onSuccess(result,candidate);
      experienceUi.error='';captureExperienceDraft();renderMain({captureAssets:false});setStatus(experienceUi.notice||'',experienceUi.notice?'ok':'');return result;
    }).catch(function(error){
      if(!experienceCurrent(life,ticket,key,requestTicket))return;
      experienceUi.busy=false;experienceUi.error=safeText(error&&error.message,error)||tr('经验操作失败；草稿已保留。','Experience action failed; the draft was preserved.');
      if(error&&(error.commitUncertain||error.readbackRequired||error.committedUncertain||error.commitState==='unknown'||error.code==='EXPERIENCE_RECOVERY_REQUIRED')){
        experienceUi.readbackRequired=true;experienceUi.pendingUnknown={action:action,input:cloneExperience(input)};
        experienceUi.error=tr('保存结果暂不能确认；正在重新读取实际候选状态，不会重试写入。','The save result is unconfirmed. Re-reading the actual candidate state; the write will not be retried.');captureExperienceDraft();renderMain({captureAssets:false});
        loadExperience(life,ticket,key);return;
      }
      if(error&&error.code==='STALE_REVISION'){
        experienceUi.stale=true;experienceUi.notice=tr('候选或类目录已变化；草稿仍保留。正在读取最新状态供核对。','The candidate or class catalog changed. Your draft is preserved; the latest state is being read for review.');
      }
      captureExperienceDraft();renderMain({captureAssets:false});setStatus(experienceUi.error,'error');
      if(error&&(error.code==='STALE_REVISION'||error.code==='EXPERIENCE_SOURCE_CHANGED'))loadExperience(life,ticket,key);
    });
  }
  function openAssetsPanel(options){
    options=options||{};var space=currentSpace();if(!space||current.mode!=='private')return;rememberComposer();var key=assetsKey(space.id,current.botId),draft=assetsDraftFor(key);assetsUi.open=true;assetsUi.loading=true;assetsUi.busy=false;assetsUi.activeTab=['shared','files','experience'].indexOf(options.activeTab)>=0?options.activeTab:(options.compareVersion||currentUpgradeVersion()?'shared':'instance');assetsUi.spaceId=space.id;assetsUi.botId=current.botId;assetsUi.key=key;activateExperienceScope(key,space.id,current.botId);assetsUi.catalog=null;assetsUi.binding=null;assetsUi.currentRelease=null;assetsUi.bindingError='';assetsUi.catalogError='';assetsUi.mutationNotice='';assetsUi.files=null;assetsUi.filesError='';assetsUi.fileLoading=false;assetsUi.fileConflict=draft.fileConflict;assetsUi.fileConflictInfo=null;assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;assetsUi.fileMode=draft.fileMode;assetsUi.fileName=draft.fileName;assetsUi.fileContent=draft.fileContent;assetsUi.fileRevision=draft.fileRevision;assetsUi.knowledgeDraft=draft.knowledgeDraft;assetsUi.skillsDraft=draft.skillsDraft;assetsUi.compareVersion=assetVersionText(options.compareVersion)||currentUpgradeVersion();assetsUi.compareRelease=null;assetsUi.compareLoading=false;var ticket=++assetsTicket,life=lifeEpoch;openWorkspaceInstance();setStatus(tr('正在读取当前实例资料…',"Loading this instance's assets…"));loadAssetsPanel(life,ticket,key);if(assetsUi.activeTab==='experience')loadExperience(life,ticket,key);
  }
  function closeAssetsPanel(){if(!assetsUi.open)return;clearAssetsUi();renderMain();setStatus('');var target=document.getElementById('org-workspaces-assets-open');if(target&&typeof target.focus==='function')target.focus();}
  function assetMutationReady(){return !!(assetsUi.open&&!assetsUi.loading&&!assetsUi.busy&&assetsUi.catalog&&assetsUi.files&&!assetsUi.catalogError&&!assetsUi.filesError);}
  function assetMutationDisabled(){return !!(assetsUi.busy||assetsUi.mutationNotice||!assetMutationReady());}
  function assetMutationBlocked(){
    if(!assetsUi.open)return true;
    if(assetsUi.mutationNotice){setStatus(tr('结果未确认，请先关闭此面板核对实际状态。',"The result is unconfirmed. Close this panel and verify the actual state first."),'error');return true;}
    if(assetsUi.busy)return true;
    if(!assetsUi.catalog||!assetsUi.files||assetsUi.loading||assetsUi.catalogError||assetsUi.filesError){setStatus(tr('资料与文件尚未完整读取，暂不能修改。',"Assets and files have not loaded completely; changes are temporarily unavailable."),'error');return true;}
    return false;
  }
  function assetMutationStarted(){if(assetMutationBlocked())return false;assetsUi.busy=true;assetsUi.mutationNotice='';captureAssetsDraft();renderMain({captureAssets:false});return true;}
  function assetMutationNeedsReadback(result){return !!(result&&(result.readbackRequired===true||result.committedUncertain===true||result.commitUncertain===true));}
  function assetReadbackMessage(result){return result&&result.committed===true?tr('已保存但需核对：结果未确认。请关闭此面板后核对实际状态，不要重复提交。',"Saved, but verification is required: the result is unconfirmed. Close this panel and verify the actual state; do not submit again."):tr('结果未确认，请关闭此面板后核对实际状态，不要重复提交。',"The result is unconfirmed. Close this panel and verify the actual state; do not submit again.");}
  function handleAssetReadback(life,ticket,key,result){if(!assetsIsCurrent(life,ticket,key)||!assetMutationNeedsReadback(result))return false;assetsUi.busy=false;assetsUi.mutationNotice=assetReadbackMessage(result);renderMain({captureAssets:false});setStatus(assetsUi.mutationNotice,'error');return true;}
  function refreshAssetsAfterMutation(life,ticket,key,result,message,tone){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,result))return;assetsUi.busy=false;loadAssetsPanel(life,ticket,key).then(function(){if(assetsIsCurrent(life,ticket,key)&&message)setStatus(message,tone);});}
  function bindAssetVersion(version){
    if(!assetsUi.open||!assetsUi.binding||!assetsUi.catalog)return;var target=safeText(version),release=target?assetRelease(target):null;if(target&&(!release||release.revoked)){setStatus(tr('只能绑定未撤回的发布版本。',"Only a published version that is not withdrawn can be bound."),'error');return;}var life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key,expected=Number.isSafeInteger(assetsUi.binding.instanceRevision)?assetsUi.binding.instanceRevision:0,payload={action:'bind',spaceId:assetsUi.spaceId,botId:assetsUi.botId,expectedRevision:expected,version:target?assetVersionValue(target):0,disabledSkillIds:[]};if(!assetMutationStarted())return;setStatus(target?tr('正在绑定版本…',"Binding version…"):tr('正在取消引用…',"Canceling reference…"));apiCall('orgWorkspaceAssets',payload).then(function(result){if(!assetsIsCurrent(life,ticket,key))return;refreshAssetsAfterMutation(life,ticket,key,result,target?tr('当前实例已绑定 v'+target+'.',"This instance is now bound to v"+target+'.'):tr('当前实例已取消共享版本引用。',"This instance no longer references a shared version."),'ok');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,error))return;assetsUi.busy=false;setStatus(tr('绑定失败：',"Binding failed: ")+safeText(error&&error.message,error)+tr('；当前实例保持原设置。',". The instance keeps its previous setting."),'error');renderMain({captureAssets:false});});
  }
  function upgradeAssetVersion(version){
    if(assetMutationBlocked())return;
    var targetVersion=assetVersionText(version),catalogTarget=targetVersion?assetRelease(targetVersion):null,comparison=assetsUi.compareRelease,binding=assetsUi.binding;
    var validBinding=!!(binding&&typeof binding==='object'&&typeof binding.version==='string'&&Array.isArray(binding.disabledSkillIds)&&Number.isSafeInteger(binding.instanceRevision)&&binding.instanceRevision>=0);
    var completeComparison=!!(comparison&&assetsUi.compareLoading!==true&&comparison.version===targetVersion&&comparison.revoked!==true&&Array.isArray(comparison.knowledge)&&Array.isArray(comparison.skills)&&comparison.knowledgeCount===comparison.knowledge.length&&comparison.skillCount===comparison.skills.length);
    if(!targetVersion||assetsUi.compareVersion!==targetVersion||!catalogTarget||catalogTarget.version!==targetVersion||catalogTarget.revoked||!validBinding||!completeComparison){setStatus(tr('目标版本内容或当前实例绑定尚未完整核对，暂不能升级。','The target version content or current instance binding is not fully verified; upgrade is unavailable.'),'error');return;}
    var currentVersion=assetBindingVersionLabel(binding);if(typeof root.confirm==='function'&&!root.confirm(tr('将当前实例从 '+currentVersion+' 升级到 v'+targetVersion+'？只更新共享绑定和同 ID 技能开关。',"Upgrade this instance from "+currentVersion+" to v"+targetVersion+"? Only the shared binding and matching skill toggles will change.")))return;
    var ids=comparison.skills.map(function(skill){return skill.id;}).filter(Boolean),disabled=binding.disabledSkillIds.filter(function(id){return ids.indexOf(id)>=0;}),life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key,expected=binding.instanceRevision;if(!assetMutationStarted())return;setStatus(tr('正在升级当前实例…',"Upgrading this instance…"));apiCall('orgWorkspaceAssets',{action:'bind',spaceId:assetsUi.spaceId,botId:assetsUi.botId,version:assetVersionValue(targetVersion),expectedRevision:expected,disabledSkillIds:disabled}).then(function(result){if(!assetsIsCurrent(life,ticket,key))return;if(assetMutationNeedsReadback(result)){handleAssetReadback(life,ticket,key,result);return;}assetsUi.compareVersion='';assetsUi.compareRelease=null;refreshAssetsAfterMutation(life,ticket,key,result,tr('当前实例已升级到 v'+targetVersion+'。',"This instance is now on v"+targetVersion+'.'),'ok');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,error))return;assetsUi.busy=false;setStatus(tr('升级失败：',"Upgrade failed: ")+safeText(error&&error.message,error)+tr('；草稿和原绑定已保留。',". The draft and previous binding are preserved."),'error');renderMain({captureAssets:false});});
  }
  function renderAssetUpgradeNotice(){
    if(current.mode!=='private')return null;var latest=currentUpgradeVersion(),key=assetsKey(current.spaceId,current.botId);if(!latest||assetsUpgradeDismissed[key]===latest)return null;var notice=el('div','org-workspaces-assets-upgrade-notice');var copy=el('div','org-workspaces-assets-upgrade-copy');copy.appendChild(el('strong','',tr('共享能力 v'+latest+' 可更新',"Shared capabilities v"+latest+" are available")));copy.appendChild(el('span','',tr('不会自动修改这个实例。',"This instance will not change automatically.")));notice.appendChild(copy);var actions=el('div','org-workspaces-assets-upgrade-actions');var viewButton=assetsActionButton(tr('查看变化',"View changes"),function(){openAssetsPanel({compareVersion:latest});},true);var later=assetsActionButton(tr('稍后',"Later"),function(){assetsUpgradeDismissed[key]=latest;renderConversation(false);},false);actions.append(viewButton,later);notice.appendChild(actions);return notice;
  }
  function saveAssetSkillToggles(skillList){
    if(!assetsUi.binding||!assetsUi.binding.version||!assetsUi.currentRelease)return;if(assetMutationBlocked())return;var disabled=[];Array.prototype.forEach.call(skillList.querySelectorAll('input[type="checkbox"]'),function(input){if(!input.checked)disabled.push(input.value);});var life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key,expected=Number.isSafeInteger(assetsUi.binding.instanceRevision)?assetsUi.binding.instanceRevision:0;if(!assetMutationStarted())return;setStatus(tr('正在保存技能开关…',"Saving skill toggles…"));apiCall('orgWorkspaceAssets',{action:'bind',spaceId:assetsUi.spaceId,botId:assetsUi.botId,version:assetVersionValue(assetsUi.binding.version),disabledSkillIds:disabled,expectedRevision:expected}).then(function(result){if(!assetsIsCurrent(life,ticket,key))return;refreshAssetsAfterMutation(life,ticket,key,result,tr('技能开关已保存。',"Skill toggles saved."),'ok');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,error))return;assetsUi.busy=false;setStatus(tr('技能开关保存失败：',"Failed to save skill toggles: ")+safeText(error&&error.message,error),'error');renderMain({captureAssets:false});});
  }
  function withdrawAssetVersion(version){
    var release=assetRelease(version);if(!release||release.revoked||!assetsUi.catalog)return;if(assetMutationBlocked())return;if(typeof root.confirm==='function'&&!root.confirm(tr('撤回 v'+release.version+'？仍引用它的实例会保持原绑定，直到用户选择其他版本或取消引用。',"Withdraw v"+release.version+"? Instances that reference it will keep the binding until a user chooses another version or cancels the reference.")))return;var life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key,expected=Number.isSafeInteger(assetsUi.catalog.revision)?assetsUi.catalog.revision:0;if(!assetMutationStarted())return;setStatus(tr('正在撤回版本…',"Withdrawing version…"));apiCall('orgWorkspaceAssets',{action:'withdraw',spaceId:assetsUi.spaceId,botId:assetsUi.botId,version:assetVersionValue(release.version),expectedRevision:expected}).then(function(result){if(!assetsIsCurrent(life,ticket,key))return;refreshAssetsAfterMutation(life,ticket,key,result,tr('版本已撤回；实例不会自动切换。',"Version withdrawn; instances will not switch automatically."),'ok');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,error))return;assetsUi.busy=false;setStatus(tr('撤回失败：',"Withdraw failed: ")+safeText(error&&error.message,error),'error');renderMain({captureAssets:false});});
  }
  function publishAssetVersion(){
    if(!assetsUi.catalog)return;if(assetMutationBlocked())return;captureAssetsDraft();var knowledge,skills;try{knowledge=parseAssetJson(assetsUi.knowledgeDraft,'knowledge');skills=parseAssetJson(assetsUi.skillsDraft,'skills');}catch(error){setStatus(safeText(error&&error.message,error),'error');return;}var life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key,expected=Number.isSafeInteger(assetsUi.catalog.revision)?assetsUi.catalog.revision:0;if(!assetMutationStarted())return;setStatus(tr('正在发布共享版本…',"Publishing shared version…"));apiCall('orgWorkspaceAssets',{action:'publish',spaceId:assetsUi.spaceId,botId:assetsUi.botId,expectedRevision:expected,knowledge:knowledge,skills:skills}).then(function(result){if(!assetsIsCurrent(life,ticket,key))return;refreshAssetsAfterMutation(life,ticket,key,result,tr('共享版本已发布；当前实例保持原绑定。',"Shared version published; this instance keeps its existing binding."),'ok');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,error))return;assetsUi.busy=false;setStatus(tr('发布失败：',"Publish failed: ")+safeText(error&&error.message,error)+tr('；草稿已保留。',". Your draft is preserved."),'error');renderMain({captureAssets:false});});
  }
  function assetFileConflictCode(error){var code=safeText(error&&error.code);return ['STALE_REVISION','FILE_REVISION_STALE','INSTANCE_FILES_NOT_FOUND'].indexOf(code)>=0;}
  function markAssetFileConflict(name,error){
    captureAssetsDraft();assetsUi.busy=false;assetsUi.fileConflict=true;assetsUi.fileConflictInfo={name:String(name||''),code:safeText(error&&error.code)};assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;captureAssetsDraft();renderMain({captureAssets:false});setStatus(safeText(error&&error.code)==='INSTANCE_FILES_NOT_FOUND'?tr('文件状态已变化或已删除；草稿已保留，请查看最新版本。',"The file state changed or the file was deleted; your draft is preserved. View the latest saved version."):tr('文件版本已变化；草稿已保留，请查看最新版本。',"The file revision changed; your draft is preserved. View the latest saved version."),'error');
  }
  function finishAssetConflictSnapshot(life,ticket,key,name,snapshot){
    if(!assetsIsCurrent(life,ticket,key)||assetsUi.fileName!==name||!assetsUi.fileConflict)return;assetsUi.fileServerSnapshot=snapshot;assetsUi.fileConflictLoading=false;renderMain({captureAssets:false});setStatus(snapshot&&snapshot.deleted?tr('已读取已保存的最新状态：文件已删除，重建需沿用墓碑修订。',"Latest saved state loaded: the file is deleted; recreation must use its tombstone revision."):snapshot?tr('已读取已保存的最新版本（修订 '+String(snapshot.revision)+'）。',"Latest saved version loaded (revision "+String(snapshot.revision)+")."):tr('未找到可用的最新版本，无法安全重建。',"No usable latest version was found; safe recreation is unavailable."),'error');
  }
  function loadLatestAssetConflict(){
    if(!assetsUi.open||!assetsUi.fileConflict||assetsUi.fileConflictLoading)return;var name=String(assetsUi.fileName||'').trim();if(!name)return;captureAssetsDraft();var life=lifeEpoch,ticket=++assetsTicket,key=assetsUi.key;assetsUi.fileConflictLoading=true;assetsUi.fileServerSnapshot=null;renderMain({captureAssets:false});setStatus(tr('正在读取已保存的最新版本…',"Reading the latest saved version…"));apiCall('orgWorkspaceFiles',{action:'list',spaceId:assetsUi.spaceId,botId:assetsUi.botId}).then(function(value){if(!assetsIsCurrent(life,ticket,key)||assetsUi.fileName!==name||!assetsUi.fileConflict)return;assetsUi.files=normalizeAssetFiles(value);assetsUi.filesError='';var file=activeAssetFile(name),tomb=activeAssetTombstone(name);if(file){return apiCall('orgWorkspaceFiles',{action:'read',spaceId:assetsUi.spaceId,botId:assetsUi.botId,name:file.name}).then(function(read){if(!assetsIsCurrent(life,ticket,key)||assetsUi.fileName!==name||!assetsUi.fileConflict)return;finishAssetConflictSnapshot(life,ticket,key,name,{name:file.name,revision:Number.isSafeInteger(read&&read.revision)?read.revision:file.revision,content:safeText(read&&read.content),deleted:false,bytes:Number.isSafeInteger(read&&read.bytes)?read.bytes:file.bytes,sha256:safeText(read&&read.sha256)||file.sha256});}).catch(function(error){if(!assetsIsCurrent(life,ticket,key)||assetsUi.fileName!==name||!assetsUi.fileConflict)return;if(assetFileConflictCode(error)&&tomb){finishAssetConflictSnapshot(life,ticket,key,name,{name:tomb.name,revision:tomb.revision,content:'',deleted:true});return;}assetsUi.fileConflictLoading=false;renderMain({captureAssets:false});setStatus(tr('读取已保存的最新版本失败：',"Failed to read the latest saved version: ")+safeText(error&&error.message,error),'error');});}finishAssetConflictSnapshot(life,ticket,key,name,tomb?{name:tomb.name,revision:tomb.revision,content:'',deleted:true}:{name:name,revision:null,content:'',deleted:true,unknown:true});}).catch(function(error){if(!assetsIsCurrent(life,ticket,key)||assetsUi.fileName!==name||!assetsUi.fileConflict)return;assetsUi.fileConflictLoading=false;assetsUi.filesError=tr('读取最新文件列表失败：',"Failed to read the latest file list: ")+safeText(error&&error.message,error);renderMain({captureAssets:false});setStatus(assetsUi.filesError,'error');});
  }
  function adoptLatestAssetConflict(){
    var snapshot=assetsUi.fileServerSnapshot;if(!fileConflictSnapshotUsable(snapshot)||snapshot.name!==assetsUi.fileName)return;if(typeof root.confirm==='function'&&!root.confirm(snapshot.deleted?tr('已保存版本已删除 '+snapshot.name+'；放弃本地草稿并保留删除状态？',"The saved version deleted "+snapshot.name+". Discard the local draft and keep the deleted state?"):tr('放弃本地草稿并采用已保存的最新版本（修订 '+String(snapshot.revision)+'）？',"Discard the local draft and adopt the latest saved version (revision "+String(snapshot.revision)+")?")))return;captureAssetsDraft();assetsTicket++;assetsUi.fileMode=snapshot.deleted?'new':'existing';assetsUi.fileName=snapshot.name;assetsUi.fileContent=snapshot.deleted?'':safeText(snapshot.content);assetsUi.fileRevision=snapshot.deleted?null:snapshot.revision;assetsUi.fileConflict=false;assetsUi.fileConflictInfo=null;assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;renderMain({captureAssets:false});setStatus(tr('已采用已保存的最新版本。',"The latest saved version was adopted."),'ok');
  }
  function saveDraftOverAssetConflict(){
    var snapshot=assetsUi.fileServerSnapshot;if(!fileConflictSnapshotUsable(snapshot)||snapshot.name!==assetsUi.fileName)return;if(typeof root.confirm==='function'&&!root.confirm(snapshot.deleted?tr('已保存版本已删除；保留本地草稿并按墓碑修订重建 '+snapshot.name+'？',"The saved version deleted this file. Keep the local draft and recreate "+snapshot.name+" using its tombstone revision?"):tr('以本地草稿覆盖已保存的最新版本（修订 '+String(snapshot.revision)+'）？仍会进行修订校验。',"Overwrite the latest saved version (revision "+String(snapshot.revision)+") with the local draft? The revision check still applies.")))return;captureAssetsDraft();assetsTicket++;assetsUi.fileMode=snapshot.deleted?'new':'existing';assetsUi.fileName=snapshot.name;assetsUi.fileRevision=snapshot.deleted?null:snapshot.revision;assetsUi.fileConflict=false;assetsUi.fileConflictInfo=null;assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;renderMain({captureAssets:false});writeAssetFile();
  }
  function readAssetFile(name){
    var file=activeAssetFile(name);if(!file)return;var life=lifeEpoch,ticket=++assetsTicket,key=assetsUi.key,requestName=file.name;captureAssetsDraft();assetsUi.fileMode='existing';assetsUi.fileName=requestName;assetsUi.fileRevision=file.revision;assetsUi.fileContent='';assetsUi.fileLoading=true;assetsUi.fileConflict=false;assetsUi.fileConflictInfo=null;assetsUi.fileConflictLoading=false;assetsUi.fileServerSnapshot=null;renderMain({captureAssets:false});setStatus(tr('正在读取文件…',"Reading file…"));apiCall('orgWorkspaceFiles',{action:'read',spaceId:assetsUi.spaceId,botId:assetsUi.botId,name:requestName}).then(function(value){if(!assetsIsCurrent(life,ticket,key)||assetsUi.fileName!==requestName)return;assetsUi.fileContent=safeText(value&&value.content);assetsUi.fileRevision=Number.isSafeInteger(value&&value.revision)?value.revision:file.revision;assetsUi.fileLoading=false;assetsDrafts[key]={knowledgeDraft:assetsUi.knowledgeDraft,skillsDraft:assetsUi.skillsDraft,fileName:assetsUi.fileName,fileContent:assetsUi.fileContent,fileRevision:assetsUi.fileRevision,fileMode:'existing',fileConflict:false};renderMain({captureAssets:false});setStatus('');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key)||assetsUi.fileName!==requestName)return;assetsUi.fileLoading=false;setStatus(tr('读取文件失败：',"Failed to read file: ")+safeText(error&&error.message,error),'error');renderMain({captureAssets:false});});
  }
  function writeAssetFile(){
    if(!assetsUi.open||assetsUi.busy||assetsUi.fileLoading||assetMutationBlocked())return;captureAssetsDraft();var name=String(assetsUi.fileName||'').trim();if(!supportedAssetFileName(name)){setStatus(tr('文件名必须以 .md、.csv、.json 或 .txt 结尾，且不能包含路径。',"Use a .md, .csv, .json, or .txt filename without a path."),'error');return;}assetsUi.fileName=name;var nameInput=dom.assetsPanel&&dom.assetsPanel.querySelector('[data-assets-file-name]');if(nameInput)nameInput.value=name;var existing=assetsUi.fileMode==='existing';if(existing&&!Number.isSafeInteger(assetsUi.fileRevision)){setStatus(tr('请先读取文件的最新版本。',"Read the latest file version first."),'error');return;}if(!existing&&activeAssetFile(name)){setStatus(tr('同名文件已存在，请先读取后编辑。',"A file with this name already exists. Read it before editing."),'error');return;}var expected=existing?assetsUi.fileRevision:fileTombstoneRevision(name);if(!existing&&expected===0&&activeAssetTombstone(name)){setStatus(tr('缺少有效的删除墓碑修订，不能用修订 0 绕过冲突。',"A valid tombstone revision is required; revision 0 cannot bypass the conflict."),'error');return;}var life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key;if(!assetMutationStarted())return;setStatus(existing?tr('正在保存文件…',"Saving file…"):tr('正在新建文件…',"Creating file…"));apiCall('orgWorkspaceFiles',{action:'write',spaceId:assetsUi.spaceId,botId:assetsUi.botId,name:name,content:String(assetsUi.fileContent||''),expectedRevision:expected}).then(function(value){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,value))return;var revision=Number.isSafeInteger(value&&value.revision)?value.revision:Number.isSafeInteger(value&&value.file&&value.file.revision)?value.file.revision:null;assetsUi.fileMode='existing';assetsUi.fileName=name;assetsUi.fileRevision=revision;assetsUi.fileConflict=false;assetsUi.fileConflictInfo=null;assetsUi.fileServerSnapshot=null;refreshAssetsAfterFileMutation(life,ticket,key,tr('文件已保存。',"File saved."),'ok');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,error))return;if(assetFileConflictCode(error)){markAssetFileConflict(name,error);return;}assetsUi.busy=false;setStatus(tr('保存文件失败：',"Failed to save file: ")+safeText(error&&error.message,error),'error');renderMain({captureAssets:false});});
  }
  function refreshAssetsAfterFileMutation(life,ticket,key,message,tone){
    loadAssetFiles(life,ticket,key,function(value,error){if(!assetsIsCurrent(life,ticket,key))return;if(error){assetsUi.busy=false;renderMain({captureAssets:false});setStatus(assetsUi.filesError,'error');return;}var file=activeAssetFile(assetsUi.fileName);if(file&&!Number.isSafeInteger(assetsUi.fileRevision))assetsUi.fileRevision=file.revision;assetsUi.busy=false;assetsDrafts[key]={knowledgeDraft:assetsUi.knowledgeDraft,skillsDraft:assetsUi.skillsDraft,fileName:assetsUi.fileName,fileContent:assetsUi.fileContent,fileRevision:assetsUi.fileRevision,fileMode:assetsUi.fileMode,fileConflict:assetsUi.fileConflict};renderMain({captureAssets:false});setStatus(message||'',tone);});
  }
  function removeAssetFile(){
    if(assetsUi.fileMode!=='existing'||!Number.isSafeInteger(assetsUi.fileRevision))return;if(assetMutationBlocked())return;if(typeof root.confirm==='function'&&!root.confirm(tr('删除 '+assetsUi.fileName+'？删除后会保留修订墓碑，同名重建必须沿用它。',"Delete "+assetsUi.fileName+"? Its revision tombstone will remain and a same-name file must reuse it.")))return;var life=lifeEpoch,ticket=assetsTicket,key=assetsUi.key,name=assetsUi.fileName,expected=assetsUi.fileRevision;if(!assetMutationStarted())return;setStatus(tr('正在删除文件…',"Deleting file…"));apiCall('orgWorkspaceFiles',{action:'remove',spaceId:assetsUi.spaceId,botId:assetsUi.botId,name:name,expectedRevision:expected}).then(function(result){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,result))return;assetsUi.fileMode='new';assetsUi.fileName='';assetsUi.fileContent='';assetsUi.fileRevision=null;assetsUi.fileConflict=false;assetsUi.fileConflictInfo=null;assetsUi.fileServerSnapshot=null;refreshAssetsAfterFileMutation(life,ticket,key,tr('文件已删除。',"File deleted."),'ok');}).catch(function(error){if(!assetsIsCurrent(life,ticket,key))return;if(handleAssetReadback(life,ticket,key,error))return;if(assetFileConflictCode(error)){markAssetFileConflict(name,error);return;}assetsUi.busy=false;setStatus(tr('删除文件失败：',"Failed to delete file: ")+safeText(error&&error.message,error),'error');renderMain({captureAssets:false});});
  }
  function renderConversation(loading){
    var before=rememberComposer(),space=currentSpace(),bot=space&&botForSpace(space,current.botId),unsupported=activeUnsupported();
    dom.main.replaceChildren();
    if(!space){ renderCreatePanel(); return; }
    var head=el('header','org-workspaces-chat-head'); head.id='org-workspaces-chat-head';
    head.appendChild(avatarFor(bot || botById(space.leaderBotId),'list'));
    var heading=el('div','org-workspaces-chat-heading');heading.appendChild(el('span','org-workspaces-chat-name',space.name));heading.appendChild(el('span','org-workspaces-chat-meta',(bot?bot.name:tr('未选择 BOT',"No BOT selected"))+' · '+(current.mode==='private'?tr('私聊',"Direct chat"):tr('群聊',"Group chat"))+' · '+roleLabel(botForSpace(space,space.leaderBotId),'leader')+' '+leaderName(space)));head.appendChild(heading);
    var controls=el('div','org-workspaces-controls');
    if(root.OpenBotTemporaryBots)root.OpenBotTemporaryBots.decorate(dom.main,{kind:'space',id:space.id,label:space.name},controls,20);
    var selector=el('select');selector.id='org-workspaces-bot';selector.setAttribute('aria-label',tr('选择空间 Bot',"Choose a space Bot"));space.memberBotIds.forEach(function(id){var member=botForSpace(space,id);if(!member)return;var option=el('option','',member.name+((space.temporaryBotIds||[]).indexOf(id)>=0?tr(' · 临时',' · Temporary'):'')+(member.unsupportedReason?tr(' · 暂不可用'," · Unavailable"):''));option.value=id;if(member.model)option.title=member.name+' · '+member.model;selector.appendChild(option);});selector.value=current.botId;selector.addEventListener('change',function(){selectBot(selector.value);});controls.appendChild(selector);
    var modes=el('div','org-workspaces-mode');modes.setAttribute('role','group');modes.setAttribute('aria-label',tr('对话模式',"Chat mode"));['group','private'].forEach(function(mode){var label=mode==='group'?tr('群聊',"Group chat"):tr('私聊',"Direct chat");var modeButton=button('org-workspaces-mode-'+mode,'',label);modeButton.setAttribute('aria-pressed',String(current.mode===mode));modeButton.addEventListener('click',function(){selectMode(mode);});modes.appendChild(modeButton);});controls.appendChild(modes);head.appendChild(controls);dom.main.appendChild(head);
    if(current.mode==='private'&&(space.temporaryBotIds||[]).indexOf(current.botId)<0){
      var assetsButton=button('org-workspaces-assets-open','org-workspaces-assets-open',tr('实例设置',"Instance settings"));assetsButton.title=tr('管理当前空间实例属性、共享技能和文件',"Manage this space instance’s properties, shared skills, and files");assetsButton.addEventListener('click',openAssetsPanel);controls.insertBefore(assetsButton,selector);
    }
    var profileButton=button('org-workspaces-profile-open','org-workspaces-profile-open',tr('空间 Profile',"Space Profile"));profileButton.title=tr('编辑这个空间自己的目标、角色和验收标准',"Edit goals, roles, and acceptance criteria for this space");profileButton.addEventListener('click',openProfileEditor);controls.insertBefore(profileButton,selector);
    var unsupportedNode=el('p','org-workspaces-unsupported');unsupportedNode.id='org-workspaces-unsupported';unsupportedNode.hidden=!unsupported;unsupportedNode.textContent=unsupported?tr('该 Bot 当前不可用：',"This Bot is unavailable: ")+unsupported:'';dom.main.appendChild(unsupportedNode);
    var upgradeNotice=renderAssetUpgradeNotice();if(upgradeNotice)dom.main.appendChild(upgradeNotice);
    var messages=el('div','org-workspaces-messages');messages.id='org-workspaces-messages';
    if(loading){messages.appendChild(el('p','org-workspaces-chat-empty',tr('正在读取这个范围的会话…',"Loading conversations for this scope…")));}
    else if(!pane || !pane.messages.length){messages.appendChild(el('p','org-workspaces-chat-empty',tr('这个空间还没有消息。可以从下方开始交办；群聊默认由组长响应。',"No messages in this space yet. Send a task below; the group lead responds to group chats by default.").replace('组长',roleLabel(botForSpace(space,space.leaderBotId),'leader')).replace('group lead',roleLabel(botForSpace(space,space.leaderBotId),'leader'))));}
    else pane.messages.forEach(function(message){messages.appendChild(renderMessage(message));});
    dom.main.appendChild(messages);
    var running=activeRun();var progress=el('div','org-workspaces-progress');progress.id='org-workspaces-progress';var progressText='';
    if(running)progressText=(currentBot()?currentBot().name:tr('空间 Bot',"Space Bot"))+tr('正在处理这条空间消息 · '," is processing this space message · ")+statusLabel(running.status);else if(pane && pane.runs.length){var latest=pane.runs[pane.runs.length-1];if(latest && latest.status==='failed')progressText=tr('上次执行失败：',"Previous run failed: ")+(latest.error || tr('请查看错误后重试',"Review the error and retry"));else if(latest && latest.status==='cancelled')progressText=tr('上次执行已取消',"Previous run canceled");else if(latest && latest.status==='interrupted')progressText=tr('上次执行在中断后保留',"Previous run preserved after interruption");}
    if(progressText){progress.appendChild(el('span','org-workspaces-progress-dot'));progress.appendChild(el('span','',progressText));}else progress.hidden=true;dom.main.appendChild(progress);
    if(!loading && pane && (space.temporaryBotIds||[]).indexOf(current.botId)<0) renderMemory();
    var composer=el('div','org-workspaces-composer');composer.id='org-workspaces-composer';var textarea=el('textarea');textarea.id='org-workspaces-composer-input';textarea.rows=1;textarea.maxLength=8000;textarea.placeholder=unsupported?tr('该 Bot 暂不可用',"This Bot is unavailable"):tr('在这个空间里说点什么…',"Message this space…");textarea.value=drafts[conversationKey()] || '';textarea.disabled=!!unsupported || !bridge || loading;textarea.addEventListener('input',function(){drafts[conversationKey()]=textarea.value;updateComposerControls();});textarea.addEventListener('compositionstart',function(){composing=true;});textarea.addEventListener('compositionend',function(){composing=false;if(refreshQueued){refreshQueued=false;loadState();}});textarea.addEventListener('keydown',function(event){if(event.isComposing || event.keyCode===229)return;if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage();}});composer.appendChild(textarea);
    var send=button('org-workspaces-send','org-workspaces-send',tr('发送',"Send"));send.addEventListener('click',sendMessage);composer.appendChild(send);
    var stop=button('org-workspaces-stop','org-workspaces-stop',tr('停止',"Stop"));stop.addEventListener('click',stopRun);composer.appendChild(stop);dom.main.appendChild(composer);dom.composer=textarea;dom.send=send;dom.stop=stop;dom.composerKey=conversationKey();updateComposerControls();
    if(before && before.key===conversationKey() && before.selection && before.selection.focused){setTimeout(function(){if(!dom.composer)return;dom.composer.focus({preventScroll:true});try{dom.composer.setSelectionRange(before.selection.start,before.selection.end);}catch(_){ }},0);}
    if(messages.scrollHeight>messages.clientHeight)messages.scrollTop=messages.scrollHeight;
  }
  function renderMessage(message){
    var role=message.role==='user'?'user':'assistant', wrap=el('article','org-workspaces-message');wrap.dataset.role=role;
    var speaker=message.speakerBotId ? botForSpace(currentSpace(),message.speakerBotId) : null;
    if(role==='user'){
      var userAvatar=el('span','org-workspaces-avatar');userAvatar.textContent=tr('你',"You");userAvatar.style.background='var(--accent,#5b8cff)';userAvatar.setAttribute('aria-hidden','true');wrap.appendChild(userAvatar);
    }else if(speaker)wrap.appendChild(avatarFor(speaker,'mini'));
    var content=el('div','org-workspaces-message-wrap');var metaLabel=role==='user'?tr('你',"You"):speaker?speaker.name:tr('空间 Bot',"Space Bot");var meta=el('div','org-workspaces-message-meta',metaLabel+(formatTime(message.at)?' · '+formatTime(message.at):''));var bubble=el('div','org-workspaces-message-bubble',message.text);content.append(meta,bubble);wrap.appendChild(content);return wrap;
  }
  function updateComposerControls(){
    if(!dom.composer || !dom.send || !dom.stop)return;
    var unsupported=!!activeUnsupported(),loading=!pane,run=activeRun(),busy=!!sendBusy[conversationKey()] || !!run;
    dom.composer.disabled=unsupported || !bridge || loading;
    dom.send.disabled=unsupported || !bridge || loading || busy || !dom.composer.value.trim();
    dom.stop.hidden=!run;dom.stop.disabled=!run;
  }
  function renderMemory(){
    var details=el('details','org-workspaces-memory');details.id='org-workspaces-memory';details.open=memoryUi.open;details.addEventListener('toggle',function(){memoryUi.open=details.open;});
    var summary=el('summary','', tr('记忆 · 当前对话可用',"Memory · Available to this conversation"));details.appendChild(summary);var body=el('div','org-workspaces-memory-body');
    var toolbar=el('div','org-workspaces-memory-toolbar');toolbar.appendChild(el('span','org-workspaces-muted',tr('仅显示当前 Bot 在此空间和私聊范围可读取的条目。',"Only entries this Bot can read within this space and direct chat are shown.")));var add=button('org-workspaces-memory-add','', tr('新增记忆',"Add memory"));add.addEventListener('click',function(){memoryUi.editor={type:'new'};renderConversation(false);openMemoryDetails();});toolbar.appendChild(add);body.appendChild(toolbar);
    var list=el('div','org-workspaces-memory-list');var records=memoryRecords();if(!records.length)list.appendChild(el('p','org-workspaces-muted',tr('当前没有可用记忆。',"No memory available.")));records.forEach(function(item){list.appendChild(renderMemoryItem(item));});body.appendChild(list);
    if(memoryUi.editor)body.appendChild(renderMemoryEditor(memoryUi.editor));
    if(memoryUi.access)body.appendChild(renderMemoryAccess(memoryUi.access));
    details.appendChild(body);dom.main.appendChild(details);dom.memory=details;
  }
  function openMemoryDetails(){memoryUi.open=true;if(dom.memory)dom.memory.open=true;}
  function renderMemoryItem(item){
    var row=el('div','org-workspaces-memory-item');row.dataset.memoryId=idFor(item.id);var copy=el('div','org-workspaces-memory-copy');copy.appendChild(el('span','org-workspaces-memory-text',item.text));copy.appendChild(el('span','org-workspaces-memory-kind',memoryKindLabel(item.kind)+' · v'+String(item.version || 1)));row.appendChild(copy);
    var actions=el('div','org-workspaces-memory-actions');
    // A readable record can be returned to every audience member, while
    // mutations stay visible only to its current owner. The service repeats
    // this check; the UI must not invite an action that will be rejected.
    var editable=idFor(item.ownerBotId)===current.botId;
    if(editable){
      var edit=button('','', tr('编辑',"Edit"));edit.dataset.memoryAction='edit';edit.dataset.memoryId=idFor(item.id);edit.addEventListener('click',function(){memoryUi.editor={type:'edit',id:item.id,text:item.text,version:item.version};memoryUi.access=null;renderConversation(false);openMemoryDetails();});actions.appendChild(edit);
      if(item.kind==='space'||item.kind==='shared'){var access=button('','', tr('共享',"Share"));access.dataset.memoryAction='access';access.dataset.memoryId=idFor(item.id);access.addEventListener('click',function(){memoryUi.access={id:item.id,version:item.version,kind:item.kind,readerBotIds:Array.isArray(item.readerBotIds)?item.readerBotIds.slice():[],writerBotIds:Array.isArray(item.writerBotIds)?item.writerBotIds.slice():[],allowedOrgSpaceIds:Array.isArray(item.allowedOrgSpaceIds)?item.allowedOrgSpaceIds.slice():null};memoryUi.editor=null;renderConversation(false);openMemoryDetails();});actions.appendChild(access);}
      var remove=button('','', tr('删除',"Delete"));remove.dataset.memoryAction='remove';remove.dataset.memoryId=idFor(item.id);remove.addEventListener('click',function(){removeMemory(item);});actions.appendChild(remove);
    }else actions.appendChild(el('span','org-workspaces-muted',tr('只读',"Read only")));
    row.appendChild(actions);return row;
  }
  function renderMemoryEditor(editor){
    var form=el('form','org-workspaces-memory-editor');form.id='org-workspaces-memory-editor';form.addEventListener('submit',function(event){event.preventDefault();saveMemoryEditor(editor);});
    var textLabel=el('label','org-workspaces-muted',tr('内容',"Content"));textLabel.htmlFor='org-workspaces-memory-text-input';form.appendChild(textLabel);var text=el('textarea');text.id='org-workspaces-memory-text-input';text.maxLength=8000;text.required=true;text.placeholder=tr('写下这条记忆…',"Write a memory…");text.value=editor.text || '';text.addEventListener('input',function(){editor.text=text.value;});form.appendChild(text);
    if(editor.type==='new'){
      var field=el('div','org-workspaces-field');var kindLabel=el('label','',tr('范围',"Scope"));kindLabel.htmlFor='org-workspaces-memory-kind';field.appendChild(kindLabel);var kind=el('select');kind.id='org-workspaces-memory-kind';[['bot',tr('Bot 私有',"Private to Bot")],['bot-space',tr('Bot × 空间',"Bot × Space")],['space',tr('空间共享',"Shared in space")],['shared',tr('指定 Bot 共享',"Shared with selected Bots")]].forEach(function(item){var option=el('option','',item[1]);option.value=item[0];kind.appendChild(option);});kind.value=editor.kind || 'bot-space';kind.addEventListener('change',function(){editor.kind=kind.value;renderMemoryEditorReaders(form,editor);});field.appendChild(kind);form.appendChild(field);renderMemoryEditorReaders(form,editor);
    }
    var actions=el('div','org-workspaces-memory-editor-actions');var cancel=button('','', tr('取消',"Cancel"));cancel.addEventListener('click',function(){memoryUi.editor=null;renderConversation(false);openMemoryDetails();});var save=button('','primary',editor.type==='new'?tr('新增',"Add"):tr('保存',"Save"));save.type='submit';actions.append(cancel,save);form.appendChild(actions);return form;
  }
  function renderMemoryEditorReaders(form,editor){
    var old=form.querySelector('.org-workspaces-memory-readers');if(old)old.remove();if(editor.kind!=='shared')return;var space=currentSpace(),memberIds=space?space.memberBotIds:[];if(!Array.isArray(editor.readerBotIds))editor.readerBotIds=memberIds.slice();var block=el('div','org-workspaces-field org-workspaces-memory-readers');block.appendChild(el('span','', tr('可读取的 Bot（需明确选择）',"Bots with read access (select explicitly)")));var access=el('div','org-workspaces-access');memberIds.forEach(function(id){var bot=botForSpace(space,id);if(!bot)return;var label=el('label');var check=el('input');check.type='checkbox';check.value=id;check.dataset.memoryReader='true';check.checked=editor.readerBotIds.indexOf(id)>=0;check.addEventListener('change',function(){editor.readerBotIds=Array.prototype.map.call(form.querySelectorAll('input[data-memory-reader]:checked'),function(input){return input.value;});});label.append(check,el('span','',bot.name));access.appendChild(label);});block.appendChild(access);form.insertBefore(block,form.querySelector('.org-workspaces-memory-editor-actions'));}
  function saveMemoryEditor(editor){
    var form=dom.main.querySelector('#org-workspaces-memory-editor');if(!form)return;var text=form.querySelector('textarea').value.trim();if(!text){setStatus(tr('记忆内容不能为空。',"Memory content cannot be empty."),'error');return;}var command;
    if(editor.type==='edit')command={type:'revise',id:editor.id,text:text,expectedVersion:editor.version};
    else {var kind=(form.querySelector('#org-workspaces-memory-kind')||{}).value || 'bot-space',space=currentSpace(),owner=current.botId,readers=kind==='shared'?(editor.readerBotIds||[]):kind==='space'?(space?space.memberBotIds.slice():[]):[owner],writers=kind==='space'?(space?[space.leaderBotId]:[owner]):[owner];if(kind==='shared'&&!readers.length){setStatus(tr('共享记忆需要至少选择一个读取 Bot。',"Choose at least one Bot with read access for shared memory."),'error');return;}if(writers.some(function(id){return readers.indexOf(id)<0;}))writers=writers.filter(function(id){return readers.indexOf(id)>=0;});command={type:'remember',record:{id:'memory_'+uuid().replace(/[^A-Za-z0-9_-]/g,'').slice(0,60),kind:kind,ownerBotId:owner,orgSpaceId:(kind==='bot-space'||kind==='space')?(space&&space.id):null,text:text,readerBotIds:readers,writerBotIds:writers,allowedOrgSpaceIds:kind==='shared'?(space?[space.id]:[]):null,sourceRefs:[]}};}
    runMemoryCommand(command);
  }
  function renderMemoryAccess(access){
    var item=memoryRecords().filter(function(record){return record.id===access.id;})[0];if(!item)return el('div');var form=el('form','org-workspaces-memory-editor');form.id='org-workspaces-memory-access';form.addEventListener('submit',function(event){event.preventDefault();saveMemoryAccess(access,form);});form.appendChild(el('div','org-workspaces-muted',tr('共享权限 · ',"Sharing permissions · ")+memoryKindLabel(item.kind)));var readerBlock=el('div','org-workspaces-field');readerBlock.appendChild(el('span','', tr('可读取的 Bot',"Bots with read access")));var readers=el('div','org-workspaces-access');var space=currentSpace();(space?space.memberBotIds:model.bots.map(function(bot){return bot.id;})).forEach(function(id){var bot=botForSpace(space,id);if(!bot)return;var label=el('label');var check=el('input');check.type='checkbox';check.value=id;check.dataset.accessReader='true';check.checked=access.readerBotIds.indexOf(id)>=0;check.addEventListener('change',function(){access.readerBotIds=Array.prototype.map.call(form.querySelectorAll('input[data-access-reader]:checked'),function(input){return input.value;});});label.append(check,el('span','',bot.name));readers.appendChild(label);});readerBlock.appendChild(readers);form.appendChild(readerBlock);var writerBlock=el('div','org-workspaces-field');writerBlock.appendChild(el('span','', tr('可修改的 Bot',"Bots with write access")));var writers=el('div','org-workspaces-access');(space?space.memberBotIds:[]).forEach(function(id){var bot=botForSpace(space,id);if(!bot)return;var label=el('label');var check=el('input');check.type='checkbox';check.value=id;check.dataset.accessWriter='true';check.checked=access.writerBotIds.indexOf(id)>=0;check.addEventListener('change',function(){access.writerBotIds=Array.prototype.map.call(form.querySelectorAll('input[data-access-writer]:checked'),function(input){return input.value;});});label.append(check,el('span','',bot.name));writers.appendChild(label);});writerBlock.appendChild(writers);form.appendChild(writerBlock);var actions=el('div','org-workspaces-memory-editor-actions');var cancel=button('','', tr('取消',"Cancel"));cancel.addEventListener('click',function(){memoryUi.access=null;renderConversation(false);openMemoryDetails();});var save=button('','primary',tr('保存权限',"Save permissions"));save.type='submit';actions.append(cancel,save);form.appendChild(actions);return form;
  }
  function saveMemoryAccess(access,form){
    var readers=Array.prototype.map.call(form.querySelectorAll('input[data-access-reader]:checked'),function(input){return input.value;}),writers=Array.prototype.map.call(form.querySelectorAll('input[data-access-writer]:checked'),function(input){return input.value;});if(writers.some(function(id){return readers.indexOf(id)<0;})){setStatus(tr('可修改的 Bot 必须同时拥有读取权限。',"Bots with write access must also have read access."),'error');return;}runMemoryCommand({type:'set-access',id:access.id,readerBotIds:readers,writerBotIds:writers,allowedOrgSpaceIds:access.kind==='shared'?(currentSpace()?[currentSpace().id]:[]):null,expectedVersion:access.version});}
  function removeMemory(item){
    if (typeof root.confirm==='function' && !root.confirm(tr('删除这条记忆？删除后会保留版本墓碑，不能恢复正文。',"Delete this memory? A version tombstone is retained; the content cannot be restored."))) return;
    runMemoryCommand({type:'remove',id:item.id,expectedVersion:item.version});
  }
  function runMemoryCommand(command){
    var ticket=lifeEpoch;setStatus(tr('正在更新记忆…',"Updating memory…"));
    apiCall('orgWorkspaceMemory',{spaceId:current.spaceId,botId:current.botId,command:command}).then(function(){
      if(!open||ticket!==lifeEpoch)return;memoryUi.editor=null;memoryUi.access=null;setStatus(tr('记忆已更新。',"Memory updated."),'ok');return loadCurrentView(ticket);
    }).catch(function(error){setStatus(tr('记忆更新失败：',"Memory update failed: ")+safeText(error && error.message,error),'error');});
  }
  function selectSpace(id){
    var space=spaceById(id);if(!space)return;selectionEpoch++;rememberComposer();if(assetsUi.open)clearAssetsUi();captureProfileForm();if(profileUi.open&&profileUi.spaceId&&profileUi.draft)profileDrafts[profileUi.spaceId]=profileUi.draft;profileUi.open=false;profileUi.loading=false;profileUi.saving=false;profileUi.casConflict=false;profileTicket++;view='chat';syncViewSwitch();current={spaceId:space.id,botId:space.leaderBotId,mode:'group'};pane=null;showCreate=false;viewEpoch++;renderSpaces();renderMain();notifySelection();loadCurrentView(lifeEpoch);
  }
  function clearSelection(){
    // An empty or invalid persisted space must clear the old pane before the
    // host can render again. Keep its draft keyed to the old conversation,
    // but make every send/stop path fail closed against that old scope.
    selectionEpoch++;rememberComposer();if(assetsUi.open)clearAssetsUi();if(profileUi.open){captureProfileForm();if(profileUi.spaceId&&profileUi.draft)profileDrafts[profileUi.spaceId]=profileUi.draft;profileUi.open=false;profileUi.loading=false;profileUi.saving=false;profileUi.casConflict=false;profileTicket++;}view='chat';syncViewSwitch();current={spaceId:'',botId:'',mode:'group'};pane=null;showCreate=false;viewEpoch++;renderSpaces();renderMain();notifySelection();
  }
  function selectBot(id){
    var space=currentSpace();if(!space||space.memberBotIds.indexOf(id)<0)return;selectionEpoch++;rememberComposer();if(assetsUi.open)clearAssetsUi();current.botId=id;pane=null;viewEpoch++;renderSpaces();renderMain();notifySelection();loadCurrentView(lifeEpoch);
  }
  function selectMode(mode){
    if(mode!=='group'&&mode!=='private')return;selectionEpoch++;rememberComposer();if(assetsUi.open)clearAssetsUi();current.mode=mode;pane=null;viewEpoch++;renderMain();notifySelection();loadCurrentView(lifeEpoch);
  }
  function notifySelection(){
    if(typeof onSelectionChange!=='function')return;
    try{onSelectionChange({spaceId:current.spaceId,botId:current.botId,mode:current.mode});}catch(_){ }
  }
  function loadCurrentView(ticket){
    if(!open || ticket!==lifeEpoch || !current.spaceId)return Promise.resolve();
    var viewTicket=++viewEpoch,key=conversationKey();setStatus(tr('正在读取会话…',"Loading conversation…"));
    return apiCall('orgWorkspaceView',{spaceId:current.spaceId,botId:current.botId,mode:current.mode}).then(function(value){
      if(!open||ticket!==lifeEpoch||viewTicket!==viewEpoch)return value;
      pane=normalizeView(value);if(pane.spaceId)current.spaceId=pane.spaceId;if(pane.botId)current.botId=pane.botId;current.mode=pane.mode;
      var run=pane.runs.filter(function(item){return item.status==='running';}).slice(-1)[0];if(run)activeRuns[key]=run.runId;else delete activeRuns[key];setStatus('');renderSpaces();if(view==='chat'){if(assetsUi.open){captureAssetsDraft();renderMain();}else if(profileUi.open){captureProfileForm();renderMain();}else renderConversation(false);}else renderMain();return value;
    }).catch(function(error){if(!open||ticket!==lifeEpoch||viewTicket!==viewEpoch)return;pane=null;setStatus(tr('读取会话失败：',"Failed to load conversation: ")+safeText(error && error.message,error),'error');if(view==='chat'){if(assetsUi.open){captureAssetsDraft();renderMain();}else if(profileUi.open){captureProfileForm();renderMain();}else renderConversation(false);}else renderMain();});
  }
  function loadDashboardSnapshot(ticket){
    if(!open || ticket!==lifeEpoch || view!=='dashboard') return Promise.resolve();
    var requestEpoch=++dashboardEpoch;
    var query=Object.assign({},dashboardQuery||{});
    if(!query.range)query.range='7d';
    if(!query.timeZone)query.timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
    if(!query.scope)query.scope='class';
    dashboardQuery=Object.assign({},query);
    // The dashboard bridge has its own projection and must be the only data
    // source while this view is open. Keep the initial query sparse: the host
    // decides whether an omitted botId means CEO or another default.
    if(!query.botId) delete query.botId;
    if(!query.view) delete query.view;
    if(dashboardController&&typeof dashboardController.setQuery==='function')dashboardController.setQuery(query);
    dashboardSnapshot={loading:true};
    setStatus(tr('正在读取 Bot 数据…',"Loading Bot data…"));
    if(dashboardController&&typeof dashboardController.update==='function') dashboardController.update(dashboardSnapshot);
    var healthRequest = typeof bridge.botHealthSnapshot === 'function'
      ? apiCall('botHealthSnapshot').catch(function(error){
        return {ok:false,message:safeText(error&&error.message,error)||tr('健康数据暂不可用',"Health data is unavailable")};
      })
      : Promise.resolve({ok:false,message:tr('健康数据暂不可用',"Health data is unavailable")});
    return Promise.all([apiCall('botDashboardSnapshot',query), healthRequest]).then(function(results){
      if(!open||ticket!==lifeEpoch||view!=='dashboard'||requestEpoch!==dashboardEpoch)return results[0];
      var value=results[0];
      dashboardSnapshot=value&&typeof value==='object'?value:{ok:false,message:tr('Bot 数据返回无效。',"Invalid Bot data returned.")};
      dashboardHealthSnapshot=results[1]&&typeof results[1]==='object'?results[1]:{ok:false,message:tr('健康数据暂不可用',"Health data is unavailable")};
      if(dashboardController&&typeof dashboardController.updateHealth==='function') dashboardController.updateHealth(dashboardHealthSnapshot);
      if(dashboardController&&typeof dashboardController.update==='function') dashboardController.update(dashboardSnapshot); else renderMain();
      setStatus('');
      return value;
    }).catch(function(error){
      if(!open||ticket!==lifeEpoch||view!=='dashboard'||requestEpoch!==dashboardEpoch)return;
      dashboardSnapshot={ok:false,code:error&&error.code,message:safeText(error&&error.message,error)||tr('读取 Bot 数据失败。',"Failed to load Bot data.")};
      if(dashboardController&&typeof dashboardController.update==='function') dashboardController.update(dashboardSnapshot); else renderMain();
      setStatus(tr('读取 Bot 数据失败：',"Failed to load Bot data: ")+safeText(error&&error.message,error),'error');
    });
  }
  function loadState(){
    if(!open)return Promise.resolve();var ticket=lifeEpoch,stateTicket=++stateEpoch,hadSpaces=model.spaces.length>0,requestedSpaceId=current.spaceId;stateBusy=true;setStatus(tr('正在读取工作空间…',"Loading spaces…"));
    return apiCall('orgWorkspaceState').then(function(value){
      if(!open||ticket!==lifeEpoch||stateTicket!==stateEpoch)return value;model=normalizeState(value);
      if(inlineMounted && inlineSelectionRequired) current.spaceId=requestedSpaceId || '';
      ensureCurrent();stateBusy=false;renderSpaces();
      if(typeof onStateChange==='function'){try{onStateChange(model);}catch(_){ }}
      // A persisted space can disappear while its mode remains selected. The
      // inline host must stay on its explicit empty state; the modal's create
      // form is only appropriate when the user deliberately manages spaces.
      if(inlineMounted && inlineSelectionRequired && !currentSpace()){
        showCreate=false;renderMain();setStatus(model.spaces.length?tr('请选择一个空间。',"Choose a space."):tr('当前没有可用空间。',"No spaces available."));return value;
      }
      // An organization refresh can update the chart in place. The chart
      // controller preserves selected identity, scroll and node focus; a full
      // workspace render would unnecessarily discard that browsing context.
      if(view==='chart'&&!showCreate&&chartController&&typeof chartController.update==='function'){
        chartController.update(model);setStatus('');return value;
      }
      // A service event can create the first space while the empty form is
      // still open. Move into that space automatically; keep the form open
      // only when the user deliberately pressed “新建” with existing spaces.
      // The organization view has its own empty state and must never be
      // replaced by the chat creation form.
      if(profileUi.open){captureProfileForm();renderMain();setStatus('');return value;}
      if(!model.spaces.length && view==='chart'){showCreate=false;renderMain();setStatus('');}
      else if(!model.spaces.length){showCreate=true;renderMain();setStatus(tr('先创建一个空间，再开始群聊。',"Create a space to start a group chat."));}
      else if(showCreate && !hadSpaces){showCreate=false;if(view==='chart')renderMain();else {renderConversation(true);loadCurrentView(ticket);}}
      else if(showCreate)renderMain();
      else if(view==='chart')renderMain();
      else {renderConversation(true);loadCurrentView(ticket);}
      return value;
    }).catch(function(error){if(!open||ticket!==lifeEpoch||stateTicket!==stateEpoch)return;stateBusy=false;var message=tr('读取工作空间失败：',"Failed to load spaces: ")+safeText(error && error.message,error);model={revision:0,bots:[],spaces:[],instances:[],error:message};pane=null;renderSpaces();if(profileUi.open){captureProfileForm();renderMain();setStatus(message,'error');}else if(view==='chart'){showCreate=false;destroyChart();renderMain();setStatus(message,'error');}else{showCreate=true;renderMain();setStatus(message,'error');}});
  }
  function sendMessage(){
    if(!dom.composer||!current.spaceId||activeUnsupported()||sendBusy[conversationKey()]||activeRun())return;var text=dom.composer.value.trim();if(!text)return;var key=conversationKey(),ticket=lifeEpoch,requestId=uuid(),selection={spaceId:current.spaceId,botId:current.botId,mode:current.mode};drafts[key]='';dom.composer.value='';sendBusy[key]=true;updateComposerControls();setStatus(tr('已提交，等待空间 Bot 响应…',"Submitted. Waiting for the space Bot…"));
    apiCall('orgWorkspaceSend',{spaceId:selection.spaceId,botId:selection.botId,mode:selection.mode,text:text,requestId:requestId}).then(function(result){if(result&&result.runId)activeRuns[key]=idFor(result.runId);if(result&&result.duplicate)setStatus(tr('已恢复这条请求的执行状态。',"Run status restored for this request."));if(open&&ticket===lifeEpoch&&conversationKey()===key)return loadCurrentView(ticket);return result;}).catch(function(error){
      // Do not replace a draft typed after the request, and do not put text
      // into a different pane. A failed request is still kept for a return to
      // its original pane, but only the empty same-pane composer is restored.
      if (drafts[key] === '') drafts[key]=text;
      if(open&&ticket===lifeEpoch&&conversationKey()===key&&dom.composer&&dom.composerKey===key&&!dom.composer.value){dom.composer.value=text;drafts[key]=text;updateComposerControls();}
      setStatus(tr('发送失败：',"Send failed: ")+safeText(error && error.message,error),'error');
    }).then(function(){sendBusy[key]=false;updateComposerControls();});
  }
  function stopRun(){
    var key=conversationKey(),run=activeRun();if(!run)return;var ticket=lifeEpoch;dom.stop.disabled=true;setStatus(tr('正在停止…',"Stopping…"));apiCall('orgWorkspaceStop',{runId:run.runId}).then(function(){delete activeRuns[key];setStatus(tr('已请求停止这条执行。',"Stop requested for this run."),'ok');return loadCurrentView(ticket);}).catch(function(error){setStatus(tr('停止失败：',"Stop failed: ")+safeText(error && error.message,error),'error');}).then(updateComposerControls);
  }
  function createInlineSurface(host){
    inlineRoot=el('div','org-workspaces-inline'); inlineRoot.id='org-workspaces-inline';
    var bar=el('div','org-workspaces-inline-bar');
    var copy=el('div','org-workspaces-inline-copy');
    copy.appendChild(el('span','org-workspaces-inline-kicker',tr('空间模式',"Space mode")));
    copy.appendChild(el('span','org-workspaces-inline-count',tr('请选择一个空间',"Choose a space")));
    var select=el('select'); select.id='org-workspaces-inline-space'; select.setAttribute('aria-label',tr('选择空间',"Choose space"));
    select.addEventListener('change',function(){selectSpace(select.value);});
    var status=el('span','org-workspaces-inline-status'); status.id='org-workspaces-inline-status'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    bar.append(copy,select,status); inlineRoot.append(bar,dom.main); host.appendChild(inlineRoot); inlineSpaceSelect=select; dom.inlineStatus=status; renderInlineSpaceSelect();
  }
  function mountInline(options){
    if(!initialized || !options || !options.host)return false;
    if(inlineMounted){
      var hasSpaceId=Object.prototype.hasOwnProperty.call(options,'spaceId');
      if(hasSpaceId && String(options.spaceId || '')!==current.spaceId){
        var requestedSpaceId=String(options.spaceId || '');
        if(requestedSpaceId && spaceById(requestedSpaceId)) selectSpace(requestedSpaceId);
        else clearSelection();
      } else if(options.botId && options.botId!==current.botId) selectBot(options.botId);
      return true;
    }
    if(open) closeDialog();
    focusBefore=document.activeElement;
    onStateChange=typeof options.onStateChange==='function'?options.onStateChange:onStateChange;
    onSelectionChange=typeof options.onSelectionChange==='function'?options.onSelectionChange:onSelectionChange;
    inlineMounted=true; inlineHost=options.host; inlineSelectionRequired=options.requireSpace!==false;
    view='chat'; syncViewSwitch(); open=true; lifeEpoch++; viewEpoch++; stateEpoch++; showCreate=false; pane=null; memoryUi={open:false,editor:null,access:null};clearAssetsUi();
    current={spaceId:idFor(options.spaceId),botId:idFor(options.botId),mode:options.mode==='private'?'private':'group'};
    createInlineSurface(inlineHost); renderSpaces(); renderMain(); loadState();
    return true;
  }
  function unmountInline(options){
    options=options||{};
    if(!inlineMounted)return false;
    rememberComposer();
    if(assetsUi.open)clearAssetsUi();if(profileUi.open){captureProfileForm();if(profileUi.spaceId&&profileUi.draft)profileDrafts[profileUi.spaceId]=profileUi.draft;profileUi.open=false;profileUi.loading=false;profileUi.saving=false;profileUi.casConflict=false;profileTicket++;}
    if(inlineRoot && inlineRoot.parentNode) inlineRoot.parentNode.removeChild(inlineRoot);
    if(dom.layout && dom.main && dom.main.parentNode!==dom.layout) dom.layout.appendChild(dom.main);
    inlineMounted=false; inlineHost=null; inlineRoot=null; inlineSpaceSelect=null; inlineSelectionRequired=false; dom.inlineStatus=null;
    open=false; lifeEpoch++; viewEpoch++; stateEpoch++; dashboardEpoch++; destroyChart(); destroyDashboard(); dashboardSnapshot=null; dashboardHealthSnapshot=null; dashboardQuery=null; pane=null; setStatus('');
    if(!options.keepSession)inlineResume=null;
    return true;
  }
  function addMember(spaceId,botId){
    var ticket=lifeEpoch;
    return apiCall('orgWorkspaceAddMember',{spaceId:idFor(spaceId),botId:idFor(botId),expectedOrganizationRevision:model.organizationRevision}).then(function(next){
      if(!open||ticket!==lifeEpoch)return next;
      model=normalizeState(next);ensureCurrent();renderSpaces();renderMain();if(typeof onStateChange==='function'){try{onStateChange(model);}catch(_){ }};notifySelection();return next;
    });
  }
  function refreshSnapshot(){
    return apiCall('orgWorkspaceState').then(function(value){
      model=normalizeState(value); if(typeof onStateChange==='function'){try{onStateChange(model);}catch(_){ }} return model;
    });
  }
  function openDialog(options){
    if(!initialized)return;
    if(inlineMounted){
      inlineResume={host:inlineHost,spaceId:current.spaceId,botId:current.botId,mode:current.mode,requireSpace:inlineSelectionRequired,onStateChange:onStateChange,onSelectionChange:onSelectionChange};
      unmountInline({keepSession:true});
      // Keep the main-window scope frozen while the modal temporarily browses
      // another space. mountInline(resume) restores the callback on close.
      onSelectionChange=null;
    }
    var opener=options&&options.opener;
    focusBefore=opener&&opener.isConnected&&typeof opener.focus==='function'&&!opener.hidden?opener:document.activeElement;
    var requestedView=options&&options.view;
    view=requestedView==='graph'||requestedView==='chart'?'chart':requestedView==='dashboard'?'dashboard':'chat';
    dashboardQuery=null;
    if(view==='dashboard'){
      dashboardQuery={};
      if(options&&options.dashboardQuery&&typeof options.dashboardQuery==='object') dashboardQuery=Object.assign({},options.dashboardQuery);
      if(options&&Object.prototype.hasOwnProperty.call(options,'botId')&&options.botId) dashboardQuery.botId=idFor(options.botId);
    }
    syncViewSwitch();open=true;lifeEpoch++;dashboardEpoch++;showCreate=false;pane=null;dashboardSnapshot=null;dashboardHealthSnapshot=null;memoryUi={open:false,editor:null,access:null};clearAssetsUi();dom.overlay.hidden=false;dom.overlay.setAttribute('aria-hidden','false');
    var ready;if(view==='dashboard'){renderMain();ready=loadDashboardSnapshot(lifeEpoch);}else{renderSpaces();renderMain();ready=loadState();}
    setTimeout(function(){if(dom.close)dom.close.focus();},0);
    return ready;
  }
  function openAssetsFor(options){
    options=options||{};
    var spaceId=idFor(options.spaceId),botId=idFor(options.botId);
    var ready=openDialog({opener:options.opener,view:'chat'}),ticket=lifeEpoch,selectionTicket=selectionEpoch;
    return Promise.resolve(ready).then(function(){
      if(!open||ticket!==lifeEpoch||selectionTicket!==selectionEpoch)return;
      var space=spaceById(spaceId);
      if(!space||space.memberBotIds.indexOf(botId)<0){setStatus(tr('这个空间或 BOT 已不可用，请刷新导入空间列表。','This space or BOT is unavailable. Refresh imported spaces.'),'error');return;}
      selectSpace(spaceId);selectBot(botId);selectMode('private');
      if(current.spaceId===spaceId&&current.botId===botId&&current.mode==='private')openAssetsPanel({compareVersion:options.compareVersion,activeTab:options.activeTab});
    });
  }
  function closeDialog(){
    if(inlineMounted){unmountInline();return;}
    if(!open)return;if(assetsUi.open)clearAssetsUi();if(profileUi.open){captureProfileForm();if(profileUi.spaceId&&profileUi.draft)profileDrafts[profileUi.spaceId]=profileUi.draft;profileUi.open=false;profileUi.loading=false;profileUi.saving=false;profileUi.casConflict=false;profileTicket++;}rememberComposer();open=false;lifeEpoch++;viewEpoch++;stateEpoch++;dashboardEpoch++;destroyChart();destroyDashboard();dashboardSnapshot=null;dashboardHealthSnapshot=null;dashboardQuery=null;dom.overlay.hidden=true;dom.overlay.setAttribute('aria-hidden','true');setStatus('');var entry=document.getElementById('org-workspaces-open');var target=(focusBefore&&focusBefore.isConnected?focusBefore:null)||(entry&&entry.isConnected?entry:null);if(target&&typeof target.focus==='function')target.focus();focusBefore=null;
    if(inlineResume){var resume=inlineResume;inlineResume=null;mountInline(resume);}
  }
  function handleChanged(){
    if(!open)return;if(composing){refreshQueued=true;return;}if(profileUi.open)captureProfileForm();rememberComposer();if(view==='dashboard'){loadDashboardSnapshot(lifeEpoch);return;}var assetLife=lifeEpoch,assetTicket=assetsTicket,assetKey=assetsUi.key;loadState().then(function(){if(assetsUi.open&&assetsIsCurrent(assetLife,assetTicket,assetKey))loadAssetsPanel(assetLife,assetTicket,assetKey);});
  }
  function init(options){
    if(initialized)return root.OpenBotOrgWorkspaces;initialized=true;
    var config=options&&options.bridge!==undefined?options:null;
    bridge=config?config.bridge:(options||root.grokbot||null);
    onOpenBot=config&&typeof config.onOpenBot==='function'?config.onOpenBot:null;
    onStateChange=config&&typeof config.onStateChange==='function'?config.onStateChange:onStateChange;
    onSelectionChange=config&&typeof config.onSelectionChange==='function'?config.onSelectionChange:onSelectionChange;
    createModal();var entry=document.getElementById('org-workspaces-open');if(entry)entry.addEventListener('click',openDialog);document.addEventListener('keydown',function(event){if(!open||inlineMounted||event.target.closest('.ob-bot-drag__dialog')||(document.getElementById('ob-health-dialog')&&!document.getElementById('ob-health-dialog').hidden))return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeDialog();}});
    if(bridge&&typeof bridge.onOrgWorkspaceChanged==='function'){try{unsubscribe=bridge.onOrgWorkspaceChanged(handleChanged);}catch(_){unsubscribe=null;}}
    return root.OpenBotOrgWorkspaces;
  }
  root.OpenBotOrgWorkspaces={init:init,open:openDialog,openAssetsFor:openAssetsFor,close:closeDialog,mountInline:mountInline,unmountInline:unmountInline,
    select:function(options){options=options||{};if(Object.prototype.hasOwnProperty.call(options,'spaceId')&&String(options.spaceId||'')!==current.spaceId){var requestedSpaceId=String(options.spaceId||'');if(requestedSpaceId&&spaceById(requestedSpaceId))selectSpace(requestedSpaceId);else clearSelection();}else if(options.botId&&options.botId!==current.botId)selectBot(options.botId);if(options.mode)selectMode(options.mode);},
    addMember:addMember,refresh:refreshSnapshot,getSnapshot:function(){return JSON.parse(JSON.stringify(model));},getSelection:function(){return {spaceId:current.spaceId,botId:current.botId,mode:current.mode};}};
})(window);
