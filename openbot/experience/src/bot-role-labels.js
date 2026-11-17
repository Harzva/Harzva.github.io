(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OpenBotRoleLabels=factory();})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
// Cosmetic display names only: callers derive the role from actual identity/membership.
const ROLES = Object.freeze(['primary','leader','member']);
const LANGUAGES = Object.freeze(['zh','en']);
const DEFAULT_ROLE_LABELS = Object.freeze({primary:Object.freeze({zh:'主 BOT',en:'Primary BOT'}),leader:Object.freeze({zh:'组长',en:'Group lead'}),member:Object.freeze({zh:'成员 BOT',en:'Member BOT'})});
function invalid(){throw Object.assign(new Error('BOT显示标签格式无效。'),{code:'BOT_ROLE_LABELS_INVALID'});}
function entries(value,allowed){
 if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value)))invalid();
 const descriptors=Object.getOwnPropertyDescriptors(value);
 if(Reflect.ownKeys(descriptors).some(k=>typeof k!=='string'||!allowed.includes(k)||!Object.hasOwn(descriptors[k],'value')))invalid();
 return Object.entries(descriptors).map(([k,d])=>[k,d.value]);
}
function normalizeRoleLabels(value){
 if(value===undefined||value===null)return {};
 const out={};
 for(const [role,labels] of entries(value,ROLES)){
  if(labels===null)continue;const normalized={};
  for(const [lang,label] of entries(labels,LANGUAGES)){
   if(label===null)continue;
   if(typeof label!=='string'||label.length>40||!label.trim()||/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/u.test(label))invalid();
   normalized[lang]=label.trim();
  }
  if(Object.keys(normalized).length)out[role]=normalized;
 }
 return out;
}
function mergeRoleLabels(base,overrides){
 const a=normalizeRoleLabels(base),b=normalizeRoleLabels(overrides),out={};
 for(const role of ROLES){const labels={...a[role],...b[role]};if(Object.keys(labels).length)out[role]=labels;}
 return out;
}
function resolveRoleLabel(state,bot,role,language='zh'){
 if(!ROLES.includes(role)||!LANGUAGES.includes(language))invalid();
 const own=normalizeRoleLabels(bot?.roleLabelOverrides),global=normalizeRoleLabels(state?.botRoleLabels);
 return own[role]?.[language]??global[role]?.[language]??DEFAULT_ROLE_LABELS[role][language];
}
return Object.freeze({ROLES,LANGUAGES,DEFAULT_ROLE_LABELS,normalizeRoleLabels,mergeRoleLabels,resolveRoleLabel});
});
