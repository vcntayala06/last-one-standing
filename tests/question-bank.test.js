"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{performance}=require("node:perf_hooks");
const seed=require("../question-bank-data"),batch=require("../question-bank-batch-1"),batch2=require("../question-bank-batch-2"),batch3=require("../question-bank-batch-3"),batch4=require("../question-bank-batch-4"),api=require("../question-bank"),data={...seed,bankVersion:"stage-6.29-music-subcategories",questions:[...seed.questions,...batch.questions,...batch2.questions,...batch3.questions,...batch4.questions]};
const clone=value=>JSON.parse(JSON.stringify(value));

test("all seeds and population batches pass the versioned schema with stable unique IDs",()=>{
 const report=api.validateBank(data,{nearDuplicates:true});assert.equal(report.valid,true,report.errors.join("\n"));assert.equal(seed.questions.length,34);assert.equal(batch.questions.length,500);assert.equal(batch2.questions.length,550);assert.equal(batch3.questions.length,550);assert.equal(batch4.questions.length,18);assert.equal(report.count,1652);assert.equal(new Set(data.questions.map(q=>q.id)).size,1652);assert.equal(data.questions.every(q=>q.schemaVersion===1&&q.revision>=1),true);assert.equal(report.warnings.filter(x=>x.includes("near-duplicate")).length,0)
});

test("Build 6.29 audits every playable question and passes the complete wording gate",()=>{const bank=api.createQuestionBank(data),audit=bank.audit();assert.equal(audit.audited,1520);assert.equal(audit.passed,1520);assert.deepEqual(audit.issues,[])});

test("Build 6.29 Music records have structured metadata and performer-type wording",()=>{const music=api.createQuestionBank(data).questions.filter(q=>q.subject==="Music");assert.ok(music.length>=200);for(const q of music){assert.ok(q.music);assert.ok(q.music.genres.length);assert.ok(api.PERFORMER_TYPES.includes(q.music.performerType));assert.ok(!/Name the artist connected with|points to which artist or group|Which artist is known for Steven Tyler/.test(q.prompt),q.prompt)}assert.ok(music.some(q=>q.prompt==="What band was Jim Morrison the lead singer of?"));assert.ok(music.some(q=>q.prompt==="Which rapper was a founding member of N.W.A?"))});

test("Music subcategory selection is multi-select and preserves other pack eligibility",()=>{const bank=api.createQuestionBank(data),hip=bank.questions.filter(q=>q.subject==="Music"&&q.music.genres.includes("hip-hop"));assert.ok(hip.length);for(let i=0;i<20;i++){const q=bank.select({packs:["music"],musicSubcategories:["hip-hop"],random:()=>i/20});assert.ok(q.music.genres.includes("hip-hop"))}const street=bank.select({packs:["street","music"],musicSubcategories:["classic-rock"],random:()=>0});assert.ok(bank.packsFor(street).includes("street")||street.music.genres.includes("classic-rock"))});

test("Batch 3 applies the cultural-quality gate and requested production balance",()=>{
 const approved=batch3.questions.filter(q=>q.review.status==="approved"),entertainment=approved.filter(q=>["Music","Movies & TV"].includes(q.subject)),preferred=entertainment.filter(q=>q.culture?.preferred);
 assert.equal(batch3.candidateCount,550);assert.equal(approved.length,545);assert.equal(batch3.questions.filter(q=>q.review.status==="rejected").length,5);assert.equal(approved.filter(q=>q.kidsSafe).length,150);assert.equal(approved.filter(q=>q.workTrack==="dedicated").length,30);assert.ok(approved.filter(q=>q.answer.accepted.es.length).length>=150);assert.equal(approved.filter(q=>q.difficulty==="savage").length,25);assert.ok(preferred.length/entertainment.length>=.65&&preferred.length/entertainment.length<=.75);
 for(const q of approved){assert.equal(q.review.approvalStandard,"stage-6.9");assert.equal(q.fact.sources.length,2,q.id);assert.equal(new Set(q.fact.sources.map(s=>s.publisher+"|"+s.url)).size,2,q.id);for(const key of ["factual","fair","difficulty","worthwhile","gameWording","templateVariety","answerSpecific","timerSuitable","culturallyFair","memorable"])assert.equal(q.quality.rubric[key],true,`${q.id}:${key}`)}
});

test("Batch 3 representation metadata remains balanced and editorial only",()=>{
 const approved=batch3.questions.filter(q=>q.review.status==="approved"),music=approved.filter(q=>q.subject==="Music"),genders=new Set(music.map(q=>q.culture.gender)),lanes=new Set(music.map(q=>q.culture.lane));assert.deepEqual(genders,new Set(["male","female","group"]));for(const lane of ["West Coast","Hip-Hop / Rap","R&B / Soul","Funk / Oldies","Regional Mexican","Tejano / Latin","Classic Rock","Pop / Mainstream"])assert.ok(lanes.has(lane),lane);assert.ok(music.filter(q=>q.culture.gender==="female").length<.6*music.length);assert.ok(music.filter(q=>q.culture.gender==="male").length>.2*music.length)
});

test("Stage 6.9 validator rejects incomplete cultural-quality approval",()=>{
 const bad=clone(batch3.questions.find(q=>q.review.status==="approved"));bad.quality.rubric.culturallyFair=false;const report=api.validateBank({...seed,questions:[bad]});assert.equal(report.valid,false);assert.ok(report.errors.some(x=>x.includes("Stage 6.9")))
});

test("Batch 2 applies the complete quality and double-verification gate before approval",()=>{
 const approved=batch2.questions.filter(q=>q.review.status==="approved"),rejected=batch2.questions.filter(q=>q.review.status==="rejected");assert.equal(batch2.candidateCount,550);assert.equal(approved.length,545);assert.equal(rejected.length,5);assert.equal(approved.filter(q=>q.quality.status==="rewritten").length,5);
 for(const q of approved){assert.equal(q.review.approvalStandard,"stage-6.8");assert.equal(q.fact.sources.length,2,q.id);assert.equal(new Set(q.fact.sources.map(s=>s.publisher+"|"+s.url)).size,2,q.id);for(const key of ["factual","fair","difficulty","worthwhile","gameWording","templateVariety","answerSpecific","timerSuitable"])assert.equal(q.quality.rubric[key],true,`${q.id}:${key}`)}
});

test("Batch 2 quality gate rejects approved records with incomplete human review",()=>{
 const bad=clone(batch2.questions.find(q=>q.review.status==="approved"));bad.quality.rubric.timerSuitable=false;const report=api.validateBank({...seed,questions:[bad]});assert.equal(report.valid,false);assert.ok(report.errors.some(x=>x.includes("human-quality rubric")))
});

test("Batch 2 balances Kids metadata, Work content, Spanish answers, and difficulty",()=>{
 const approved=batch2.questions.filter(q=>q.review.status==="approved"),count=d=>approved.filter(q=>q.difficulty===d).length;assert.equal(approved.filter(q=>q.kidsSafe).length,165);assert.ok(approved.filter(q=>q.kidsSafe).every(q=>q.gradeRange&&q.gradeRange.min>=4&&q.gradeRange.max<=7&&q.difficulty.startsWith("kids-")));assert.equal(approved.filter(q=>q.workTrack==="dedicated").length,29);assert.ok(approved.filter(q=>q.answer.accepted.es.length).length>=100);assert.ok(count("medium")>count("easy")&&count("medium")>count("hard"));assert.ok(count("savage")>=20&&count("savage")<=30)
});

test("every approved Batch 1 question has two independent dated fact and wording checks",()=>{
 const approved=batch.questions.filter(q=>q.review.status==="approved");assert.equal(approved.length,378);
 for(const q of approved){assert.equal(q.fact.sources.length,2,q.id);assert.equal(new Set(q.fact.sources.map(s=>s.publisher+"|"+s.url)).size,2,q.id);assert.match(q.fact.verifiedAt,/^\d{4}-\d{2}-\d{2}$/);assert.equal(q.fact.wordingFair,true);assert.equal(q.fact.ambiguityChecked,true);assert.equal(q.fact.dateSensitive,false);assert.ok(q.fact.sources.every(s=>s.confirmsAnswer&&s.confirmsWording&&s.verifiedAt===q.fact.verifiedAt),q.id)}
});

test("approved status is rejected without double verification and a fairness check",()=>{
 const bad=clone(batch.questions[0]);bad.fact.sources=bad.fact.sources.slice(0,1);bad.fact.wordingFair=false;const report=api.validateBank({...seed,questions:[bad]});assert.equal(report.valid,false);assert.ok(report.errors.some(x=>x.includes("two independent")));assert.ok(report.errors.some(x=>x.includes("fair-wording")))
});

test("Stage 6.7A records an individual quality disposition and excludes failed questions",()=>{
 assert.ok(batch.questions.every(q=>q.quality&&q.quality.reviewedAt&&q.quality.rubric&&Array.isArray(q.quality.flags)));assert.equal(batch.questions.filter(q=>q.quality.status==="disabled").length,122);assert.ok(batch.questions.filter(q=>q.quality.status==="rewritten").length>=98);assert.ok(batch.questions.filter(q=>q.quality.status==="recalibrated").length>=26);assert.equal(batch.questions.filter(q=>["passed","rewritten","recalibrated","disabled"].includes(q.quality.status)).length,500);assert.ok(batch.questions.filter(q=>q.review.status==="disabled").every(q=>q.quality.status==="disabled"));assert.ok(batch.questions.filter(q=>q.review.status==="approved"&&q.kidsSafe).every(q=>q.gradeRange&&q.gradeRange.min>=4&&q.gradeRange.max<=7))
});

test("reported weak templates are repaired or absent from the selectable pool",()=>{
 const bank=api.createQuestionBank(data),prompts=bank.questions.map(q=>q.prompt);for(const pattern of [/Who or what is most directly connected/i,/mainly associated with what setting/i,/birthplace or home region/i,/Which term belongs most directly/i])assert.equal(prompts.some(p=>pattern.test(p)),false,String(pattern));assert.equal(bank.byId.get("los-b1-transit-411").difficulty,"easy");assert.match(bank.byId.get("los-b1-history-271").prompt,/Father of the Constitution/);assert.match(bank.byId.get("los-b1-science-nature-341").prompt,/group of mammals/);assert.equal(bank.byId.has("los-b1-movies-tv-141"),false)
});

test("Batch 1 eligibility and Work tracks cannot leak across editions",()=>{
 assert.equal(batch.questions.filter(q=>q.workTrack==="dedicated").length,25);assert.equal(batch.questions.filter(q=>q.workTrack==="broad").length,475);assert.ok(batch.questions.filter(q=>q.workTrack==="dedicated").every(q=>q.editions.length===1&&q.editions[0]==="work"));assert.ok(batch.questions.filter(q=>q.workTrack==="broad").every(q=>q.editions.includes("original")&&q.editions.includes("solo")&&q.editions.includes("work")))
});

test("validator rejects malformed metadata, duplicate IDs, and normalized duplicate prompts",()=>{
 const bad=clone(data);bad.questions[1].id=bad.questions[0].id;bad.questions[2].prompt=bad.questions[0].prompt.toUpperCase()+"!!!";bad.questions[3].difficulty="impossible";bad.questions[4].gradeRange={min:8,max:4};bad.questions[5].answer.accepted.en="not-an-array";bad.questions[6].editions=["arcade"];const report=api.validateBank(bad);assert.equal(report.valid,false);for(const fragment of ["duplicates","prompt duplicates","difficulty","gradeRange","answer.accepted","editions"])assert.ok(report.errors.some(x=>x.includes(fragment)),fragment)
});

test("accepted.equivalents is validated and projected through the canonical gameplay contract",()=>{
 const one=clone(batch3.questions.find(q=>q.review.status==="approved"));one.answer.accepted.equivalents=["same intended concept"];let report=api.validateBank({...seed,questions:[one]});assert.equal(report.valid,true,report.errors.join("\n"));const projected=api.createQuestionBank({...seed,questions:[one]}).toGameplay(one);assert.deepEqual(projected.equivalents,["same intended concept"]);one.answer.accepted.equivalents="unsafe broad synonym";report=api.validateBank({...seed,questions:[one]});assert.equal(report.valid,false);assert.ok(report.errors.some(x=>x.includes("answer.accepted")))
});

test("duplicate canonical answers are reported for review but not silently deleted",()=>{
 const suspicious=clone(data);suspicious.questions[1].answer.canonical=suspicious.questions[0].answer.canonical;const report=api.validateBank(suspicious);assert.equal(report.valid,true);assert.ok(report.warnings.some(x=>x.includes("Suspicious repeated canonical answer")));assert.equal(report.count,1652)
});

test("edition indexes make Original, Work, and Solo eligibility explicit",()=>{
 const bank=api.createQuestionBank(data);assert.equal(bank.byEdition.get("original").length,1427);assert.equal(bank.byEdition.get("work").length,1511);assert.equal(bank.byEdition.get("solo").length,1427);assert.ok(bank.byEdition.get("work").every(q=>q.editions.includes("work")&&q.workSafe));assert.ok(bank.byEdition.get("solo").every(q=>q.editions.includes("solo")))
});

test("edition exhaustion returns null instead of recycling a used question",()=>{
 const bank=api.createQuestionBank(data);for(const edition of ["original","work","solo"]){const used=[],eligible=new Set(bank.byEdition.get(edition).map(q=>q.id));for(;;){const q=bank.select({edition,difficulty:"medium",usedIds:used,random:()=>0});if(!q)break;assert.ok(eligible.has(q.id),`${edition} leaked ${q.id}`);assert.equal(used.includes(q.id),false,`${edition} repeated ${q.id}`);used.push(q.id)}assert.ok(used.length>0,edition);assert.equal(bank.select({edition,difficulty:"medium",usedIds:used,random:()=>0}),null,edition)}
});

test("visible difficulty changes the eligible internal pool without crossing edition",()=>{
 const bank=api.createQuestionBank(data),sample=(difficulty)=>{const ids=new Set();for(let i=0;i<30;i++)ids.add(bank.select({edition:"original",difficulty,usedIds:[...ids],random:()=>0})?.id);return [...ids].map(id=>bank.byId.get(id))},kids=sample("kids"),hard=sample("hard");assert.ok(kids.every(q=>q.difficulty.startsWith("kids-")));assert.ok(hard.every(q=>["medium","hard","savage"].includes(q.difficulty)));assert.ok(kids.length&&hard.length);assert.deepEqual(new Set(kids.map(q=>q.id)).intersection?.(new Set(hard.map(q=>q.id)))||new Set(),new Set())
});

test("adult Easy no longer leaks Kids Hard, Medium, Hard, or Savage questions",()=>{
 const bank=api.createQuestionBank(data),used=[];for(let i=0;i<120;i++){const q=bank.select({edition:"original",difficulty:"easy",usedIds:used,random:()=>i/121});assert.ok(["kids-easy","kids-medium","easy"].includes(q.difficulty),q.difficulty);used.push(q.id)}
});

test("recent subject avoidance chooses another subject when one is available",()=>{
 const bank=api.createQuestionBank(data),first=bank.select({edition:"original",difficulty:"medium",random:()=>0}),second=bank.select({edition:"original",difficulty:"medium",usedIds:[first.id],recentCategories:[first.subject],random:()=>0});assert.notEqual(second.subject,first.subject)
});

test("Work selection follows a deterministic 70/30 dedicated-to-broad mix",()=>{
 const bank=api.createQuestionBank(data);let randomCall=0,selection=0,dedicated=0,broad=0;const random=()=>{const choosingTrack=randomCall++%2===0;if(choosingTrack)return (selection++%10)<7?0:.9;return 0};for(let i=0;i<100;i++){const q=bank.select({edition:"work",difficulty:"medium",random});q.workTrack==="dedicated"?dedicated++:broad++}assert.equal(dedicated,70);assert.equal(broad,30)
});

test("gameplay projection retains legacy alts without changing accepted-answer semantics",()=>{
 const bank=api.createQuestionBank(data),q=bank.toGameplay(bank.byId.get("los-general-leap-year-001"));assert.deepEqual(q.alts,["366","three hundred sixty six","three hundred and sixty six"]);assert.equal(q.id,"los-general-leap-year-001")
});

test("a synthetic 4,000-question bank validates, indexes, and selects responsively",()=>{
 const template=data.questions[0],synthetic={...data,bankVersion:"synthetic-performance",questions:Array.from({length:4000},(_,i)=>({...clone(template),id:`synthetic-general-${String(i).padStart(4,"0")}`,prompt:`Synthetic performance question number ${i}?`,answer:{...clone(template.answer),conceptId:`synthetic-${i}.answer`,canonical:`Synthetic answer ${i}`,accepted:{en:[`synthetic answer ${i}`],es:[]}}}))};const started=performance.now(),report=api.validateBank(synthetic),bank=api.createQuestionBank(synthetic);let used=[];for(let i=0;i<100;i++){const q=bank.select({edition:"original",difficulty:"kids",usedIds:used,random:()=>.5});used.push(q.id)}const elapsed=performance.now()-started;assert.equal(report.valid,true,report.errors.join("\n"));assert.equal(bank.questions.length,4000);assert.ok(elapsed<1500,`4,000-record foundation took ${elapsed.toFixed(1)}ms`)
});

test("content packs combine pools while preserving Kids safety",()=>{
 const bank=api.createQuestionBank(data);
 const transit=bank.select({packs:["transit"],difficulty:"medium",random:()=>0});assert.ok(transit);assert.ok(bank.packsFor(transit).includes("transit"));
 const mixed=bank.select({packs:["street","movies"],difficulty:"medium",random:()=>.5});assert.ok(mixed);assert.ok(bank.packsFor(mixed).some(pack=>pack==="street"||pack==="movies"));
 for(const random of [()=>0,()=>.25,()=>.5,()=>.75,()=>.99]){const child=bank.select({packs:["kids","music","movies"],difficulty:"medium",random});assert.ok(child);assert.equal(child.kidsSafe,true)}
});

test("Street identity is substantial and receives a strong share in mixed vibe games",()=>{
 const bank=api.createQuestionBank(data),street=bank.questions.filter(q=>bank.packsFor(q).includes("street"));assert.ok(street.length>=100,`Street pool only has ${street.length} questions`);for(const difficulty of ["easy","medium","hard","savage"])assert.ok(street.some(q=>q.difficulty===difficulty),difficulty);
 let call=0,selection=0,streetPicks=0;const random=()=>call++%2===0?(selection++%100)/100:0;
 for(let i=0;i<100;i++){const q=bank.select({packs:["street","movies","music"],difficulty:"medium",random});if(bank.packsFor(q).includes("street"))streetPicks++}
 assert.ok(streetPicks>=60&&streetPicks<=65,`Street weighting was ${streetPicks}%`)
});

test("Street weighting and category avoidance never repeat a used question",()=>{
 const bank=api.createQuestionBank(data),used=[],recent=[];for(let i=0;i<120;i++){const q=bank.select({packs:["street","movies","music"],difficulty:"medium",usedIds:used,recentCategories:recent,random:()=>((i*37)%100)/100});assert.ok(q,`pool exhausted unexpectedly at ${i}`);assert.equal(used.includes(q.id),false,`repeated ${q.id}`);used.push(q.id);recent.push(q.subject)}assert.equal(new Set(used).size,used.length)
});

test("Street weighting never overrides Kids or Work safety",()=>{
 const bank=api.createQuestionBank(data);for(let i=0;i<100;i++){const child=bank.select({packs:["kids","street","music"],difficulty:"medium",random:()=>i/101});assert.ok(child);assert.equal(child.kidsSafe,true);const workplace=bank.select({packs:["work","street","movies"],difficulty:"medium",random:()=>i/101});assert.ok(workplace);assert.equal(workplace.workSafe,true)}
});

test("SunLine remains isolated until verified agency questions are supplied",()=>{
 const bank=api.createQuestionBank(data);assert.equal(bank.select({packs:["sunline"],difficulty:"medium",random:()=>0}),null);assert.ok(bank.questions.filter(q=>bank.packsFor(q).includes("sunline")).every(q=>q.contentPacks?.includes("sunline")))
});

test("bank loading and validation failures are explicit",()=>{
 assert.equal(api.validateBank(null).valid,false);assert.throws(()=>api.createQuestionBank({schemaVersion:1,subjectCatalog:[],questions:[{}]}),/Invalid Last One Standing question bank/)
});
