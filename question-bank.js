(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.LOSQuestionBank=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const DIFFICULTIES=["kids-easy","kids-medium","kids-hard","easy","medium","hard","savage"],EDITIONS=["original","work","solo","family"],STATUSES=["draft","reviewed","verified","approved","rejected","disabled"],CLASSIFICATIONS=["educational","entertainment","mixed"];
const VISIBLE_DIFFICULTIES={kids:["kids-easy","kids-medium","kids-hard"],easy:["kids-easy","kids-medium","easy"],medium:["easy","medium"],hard:["medium","hard"],savage:["hard","savage"]};
const normalize=s=>String(s||"").toLocaleLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
const isoDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||"")&&!Number.isNaN(Date.parse(value+"T00:00:00Z"));
function approvedFactErrors(q,at){
 const errors=[],fact=q.fact||{},sources=Array.isArray(fact.sources)?fact.sources:[];
 if(sources.length<2)errors.push(`${at}.fact.sources requires two independent verification records for approved questions`);
 const identities=new Set();
 for(const [i,source] of sources.entries()){
  const sat=`${at}.fact.sources[${i}]`;
  if(!source||typeof source!=="object"){errors.push(`${sat} must be an object`);continue}
  if(typeof source.title!=="string"||!source.title.trim())errors.push(`${sat}.title is required`);
  if(typeof source.publisher!=="string"||!source.publisher.trim())errors.push(`${sat}.publisher is required`);
  if(typeof source.url!=="string"||!/^https:\/\//.test(source.url))errors.push(`${sat}.url must be an https reference`);
  if(!isoDate(source.verifiedAt))errors.push(`${sat}.verifiedAt must be YYYY-MM-DD`);
  if(source.confirmsAnswer!==true||source.confirmsWording!==true)errors.push(`${sat} must confirm both answer and wording`);
  identities.add(normalize(source.publisher)+"|"+normalize(source.url));
 }
 if(sources.length>=2&&identities.size<2)errors.push(`${at}.fact.sources must contain two distinct references`);
 if(!isoDate(fact.verifiedAt))errors.push(`${at}.fact.verifiedAt must be YYYY-MM-DD for approved questions`);
 if(fact.wordingFair!==true||fact.ambiguityChecked!==true)errors.push(`${at}.fact must record fair-wording and ambiguity checks`);
 if(typeof fact.dateSensitive!=="boolean")errors.push(`${at}.fact.dateSensitive must be boolean`);
 if(fact.dateSensitive&&!isoDate(fact.currentAsOf))errors.push(`${at}.fact.currentAsOf is required for date-sensitive questions`);
 return errors
}
function validateBank(bank,{nearDuplicates=false}={}){
 const errors=[],warnings=[],ids=new Map(),prompts=new Map(),answers=new Map();
 if(!bank||bank.schemaVersion!==1)errors.push("Bank schemaVersion must be 1");
 if(!Array.isArray(bank?.subjectCatalog)||!bank.subjectCatalog.length)errors.push("subjectCatalog must be a non-empty array");
 if(!Array.isArray(bank?.questions))errors.push("questions must be an array");
 for(const [i,q] of (bank?.questions||[]).entries()){
  const at=`questions[${i}]`;
  if(!q||typeof q!=="object"){errors.push(`${at} must be an object`);continue}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(q.id||""))errors.push(`${at}.id is missing or invalid`);
  else if(ids.has(q.id))errors.push(`${at}.id duplicates ${ids.get(q.id)}`);else ids.set(q.id,at);
  if(typeof q.prompt!=="string"||!q.prompt.trim())errors.push(`${at}.prompt is empty`);
  const prompt=normalize(q.prompt);if(prompt){if(prompts.has(prompt))errors.push(`${at}.prompt duplicates ${prompts.get(prompt)}`);else prompts.set(prompt,at)}
  if(!bank.subjectCatalog?.includes(q.subject))errors.push(`${at}.subject is invalid`);
  if(!DIFFICULTIES.includes(q.difficulty))errors.push(`${at}.difficulty is invalid`);
  if(!Array.isArray(q.editions)||!q.editions.length||q.editions.some(x=>!EDITIONS.includes(x)))errors.push(`${at}.editions is invalid`);
  if(typeof q.workSafe!=="boolean"||typeof q.kidsSafe!=="boolean")errors.push(`${at} safety flags must be boolean`);
  if(q.gradeRange!==null&&(!q.gradeRange||!Number.isInteger(q.gradeRange.min)||!Number.isInteger(q.gradeRange.max)||q.gradeRange.min<1||q.gradeRange.max>12||q.gradeRange.min>q.gradeRange.max))errors.push(`${at}.gradeRange is invalid`);
  if(!CLASSIFICATIONS.includes(q.classification))errors.push(`${at}.classification is invalid`);
  if(!q.answer||typeof q.answer.canonical!=="string"||!q.answer.canonical.trim())errors.push(`${at}.answer.canonical is empty`);
  if(!q.answer?.accepted||Object.entries(q.answer.accepted).some(([key,x])=>!["en","es","equivalents"].includes(key)||!Array.isArray(x)||x.some(v=>typeof v!=="string"||!v.trim())))errors.push(`${at}.answer.accepted is invalid`);
  if(!STATUSES.includes(q.review?.status))errors.push(`${at}.review.status is invalid`);
  if(q.review?.status==="approved")errors.push(...approvedFactErrors(q,at));
  if(q.review?.status==="approved"&&q.review?.approvalStandard==="stage-6.8"){
   const rubric=q.quality?.rubric||{},required=["factual","fair","difficulty","worthwhile","gameWording","templateVariety","answerSpecific","timerSuitable"];
   if(!q.quality||!['passed','rewritten'].includes(q.quality.status)||required.some(key=>rubric[key]!==true))errors.push(`${at}.quality must pass the complete Stage 6.8 human-quality rubric before approval`)
  }
  if(q.review?.status==="approved"&&q.review?.approvalStandard==="stage-6.9"){
   const rubric=q.quality?.rubric||{},required=["factual","fair","difficulty","worthwhile","gameWording","templateVariety","answerSpecific","timerSuitable","culturallyFair","memorable"];
   if(!q.quality||!['passed','rewritten'].includes(q.quality.status)||required.some(key=>rubric[key]!==true))errors.push(`${at}.quality must pass the complete Stage 6.9 human-quality and cultural-fairness rubric before approval`)
  }
  if(!Number.isInteger(q.schemaVersion)||q.schemaVersion!==bank.schemaVersion||!Number.isInteger(q.revision)||q.revision<1)errors.push(`${at} schema/revision is invalid`);
  const answer=normalize(q.answer?.canonical);if(answer){const peers=answers.get(answer)||[];peers.push(at);answers.set(answer,peers)}
 }
 for(const [answer,peers] of answers)if(peers.length>1)warnings.push(`Suspicious repeated canonical answer "${answer}": ${peers.join(", ")}`);
 if(nearDuplicates){const qs=bank.questions||[];for(let i=0;i<qs.length;i++)for(let j=i+1;j<qs.length;j++){const a=normalize(qs[i].prompt),b=normalize(qs[j].prompt);if(a!==b&&a.length>20&&b.length>20&&(a.includes(b)||b.includes(a)))warnings.push(`Possible near-duplicate: ${qs[i].id} / ${qs[j].id}`)}}
 return {valid:errors.length===0,errors,warnings,count:bank?.questions?.length||0}
}
function createQuestionBank(bank){
 const report=validateBank(bank);if(!report.valid)throw new Error("Invalid Last One Standing question bank:\n"+report.errors.join("\n"));
 const selectable=bank.questions.filter(q=>!["draft","rejected","disabled"].includes(q.review.status));
 const byEdition=new Map(EDITIONS.map(e=>[e,selectable.filter(q=>q.editions.includes(e)&&(e!=="work"||q.workSafe))]));
 const byId=new Map(selectable.map(q=>[q.id,q]));
 const ordered=DIFFICULTIES;
 const difficultyPool=(pool,visible)=>{
  const desired=VISIBLE_DIFFICULTIES[visible]||VISIBLE_DIFFICULTIES.medium,exact=pool.filter(q=>desired.includes(q.difficulty));if(exact.length)return exact;
  const centers=desired.map(x=>ordered.indexOf(x));let best=Infinity,out=[];for(const q of pool){const distance=Math.min(...centers.map(x=>Math.abs(ordered.indexOf(q.difficulty)-x)));if(distance<best){best=distance;out=[q]}else if(distance===best)out.push(q)}return out
 };
 const choose=(pool,usedIds,recentCategories,random)=>{
  if(!pool.length)return null;const eligibleIds=new Set(pool.map(q=>q.id)),used=new Set((usedIds||[]).filter(id=>eligibleIds.has(id)));let available=pool.filter(q=>!used.has(q.id));
  if(!available.length){for(const id of eligibleIds)used.delete(id);available=pool.slice()}
  const recent=new Set((recentCategories||[]).slice(-2)),varied=available.filter(q=>!recent.has(q.subject));if(varied.length)available=varied;
  return available[Math.min(available.length-1,Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*available.length))]
 };
 function select({edition="original",difficulty="medium",usedIds=[],recentCategories=[],random=Math.random}={}){
  let pool=difficultyPool(byEdition.get(edition)||[],difficulty);if(!pool.length)return null;
  if(edition==="work"){
   const dedicated=pool.filter(q=>q.workTrack==="dedicated"),broad=pool.filter(q=>q.workTrack==="broad"),preferred=random()<.7?dedicated:broad;
   pool=preferred.length?preferred:(dedicated.length?dedicated:broad)
  }
  return choose(pool,usedIds,recentCategories,random)
 }
 return {schemaVersion:bank.schemaVersion,bankVersion:bank.bankVersion,questions:selectable,byId,byEdition,select,validate:()=>validateBank(bank),toGameplay(q){const en=[...(q.answer.accepted.en||[])],es=[...(q.answer.accepted.es||[])],equivalents=[...(q.answer.accepted.equivalents||[])],legacy=[...(q.alts||[])];return{id:q.id,q:q.prompt,a:q.answer.canonical,cat:q.subject,accept:en,es,equivalents,alts:[...new Set([...legacy,...en])],edition:q.workTrack==="dedicated"?"work":undefined,difficulty:q.difficulty,editions:[...q.editions]}}}
}
return {DIFFICULTIES,EDITIONS,STATUSES,VISIBLE_DIFFICULTIES,normalize,validateBank,createQuestionBank,approvedFactErrors};
});
