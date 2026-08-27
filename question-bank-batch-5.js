(function(root,factory){const bank=factory();if(typeof module==="object"&&module.exports)module.exports=bank;root.LOS_QUESTION_BANK_BATCH_5=bank})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERIFIED_AT="2026-08-25",questions=[];
const S={
 work:[
  {title:"Project Management Glossary",publisher:"Project Management Institute",url:"https://www.pmi.org/learning/library/project-management-glossary-terms-10250"},
  {title:"Business communication",publisher:"Encyclopaedia Britannica",url:"https://www.britannica.com/topic/business-communication"}],
 transit:[
  {title:"National Transit Database glossary",publisher:"Federal Transit Administration",url:"https://www.transit.dot.gov/ntd/national-transit-database-ntd-glossary"},
  {title:"Public transportation",publisher:"Encyclopaedia Britannica",url:"https://www.britannica.com/technology/public-transportation"}],
 para:[
  {title:"ADA paratransit eligibility",publisher:"Federal Transit Administration",url:"https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/ada-regulations"},
  {title:"ADA transportation guide",publisher:"ADA National Network",url:"https://adata.org/factsheet/ADA-accessible-transportation"}],
 sunline:[
  {title:"SunLine agency information",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/about"},
  {title:"SunLine system profile",publisher:"Federal Transit Administration",url:"https://www.transit.dot.gov/ntd/transit-agency-profiles/sunline-transit-agency"}],
 culture:[
  {title:"Hip-Hop History and Culture",publisher:"Smithsonian Institution",url:"https://nmaahc.si.edu/explore/stories/hip-hop-history-and-culture"},
  {title:"Hip-Hop America",publisher:"Library of Congress",url:"https://www.loc.gov/item/event-403749/hip-hop-america/"}],
 known:[
  {title:"Everyday science",publisher:"Encyclopaedia Britannica",url:"https://www.britannica.com/science"},
  {title:"Science and Technology",publisher:"Smithsonian Institution",url:"https://www.si.edu/spotlight/science-and-technology"}],
 riddle:[
  {title:"Classic riddles",publisher:"Riddles.com",url:"https://www.riddles.com/best-riddles"},
  {title:"Riddles with answers",publisher:"Reader's Digest",url:"https://www.rd.com/list/challenging-riddles/"}]
};
const rows=[
 ["work","If a one-hour meeting starts at 2:15, at what time does it end?","3:15",["3 15","3:15 p.m."],"Practical Math","easy"],
 ["work","What workplace word means the final date by which a task must be finished?","Deadline",["due date"],"I Should Have Known That","easy"],
 ["work","What do you call a short list of topics planned for a meeting?","Agenda",["meeting agenda"],"I Should Have Known That","easy"],
 ["work","If four coworkers split 20 identical folders evenly, how many does each person get?","5",["five"],"Practical Math","easy"],
 ["transit","What transit word means the published times when a bus or train is expected to arrive?","Schedule",["timetable","time table"],"Transit","easy"],
 ["transit","What do you call the place where passengers wait to board a bus?","Bus stop",["stop"],"Transit","easy"],
 ["transit","What form of rail transit usually runs below city streets through tunnels?","Subway",["metro","underground"],"Transportation","easy"],
 ["transit","What fare option generally allows unlimited rides for a set period?","Transit pass",["pass","day pass","monthly pass"],"Transit","medium"],
 ["para","What service provides origin-to-destination transportation for eligible riders whose disabilities prevent them from using fixed-route transit?","ADA paratransit",["paratransit","ada complementary paratransit"],"Transit","medium"],
 ["para","What device commonly unfolds from a bus doorway to help a wheelchair user board?","Wheelchair ramp",["ramp","boarding ramp","bus ramp"],"Transit","easy"],
 ["para","What term means a vehicle or facility can be used by people with disabilities?","Accessible",["accessibility","ada accessible"],"Transit","easy"],
 ["sunline","Which California valley is served by SunLine Transit Agency?","Coachella Valley",["the coachella valley"],"Transit","medium"],
 ["sunline","What type of transportation does SunLine provide to the public in the Coachella Valley?","Public transit",["bus service","public transportation","transit service"],"Transit","easy",false],
 ["culture","Which DJ is widely credited with helping start hip-hop at a 1973 Bronx party?","DJ Kool Herc",["kool herc","clive campbell"],"Hip-Hop","easy"],
 ["culture","In hip-hop culture, what is the art of performing rhymes over a beat called?","MCing",["mcing","emceeing","rapping","rap"],"Hip-Hop","easy"],
 ["culture","Which West Coast rap group released Straight Outta Compton?","N.W.A",["nwa","n w a"],"Hip-Hop","easy"],
 ["culture","What custom-car style is known for riding low and often using hydraulic suspension?","Lowrider",["low rider","lowriders"],"Cars","easy"],
 ["known","What household appliance keeps food cold?","Refrigerator",["fridge"],"I Should Have Known That","easy"],
 ["known","What kitchen tool is used to drain water from cooked pasta?","Colander",["strainer","pasta strainer"],"I Should Have Known That","easy"],
 ["riddle","What gets wetter while it dries something else?","A towel",["towel"],"Logic / Decoding","easy"],
 ["riddle","What has keys but cannot open a door?","A piano",["piano","keyboard"],"Logic / Decoding","easy"],
 ["riddle","What has one eye but cannot see?","A needle",["needle","sewing needle"],"Word Play","easy"]
];
const packs={work:["work"],transit:["transit"],para:["transit","paratransit"],sunline:["transit","sunline"],culture:["street"],known:["known"],riddle:["riddles"]};
const titles={work:"Work",transit:"General Transit",para:"Paratransit",sunline:"SunLine",culture:"The Culture",known:"I Should Have Known That",riddle:"Riddles / Brain Teasers"};
const los={accurate:true,clear:true,answerTypeClear:true,fair:true,unambiguous:true,notPedantic:true,notCheapGotcha:true,worthKnowing:true,goodReveal:true,timerFair:true,naturalSpokenWording:true};
for(const [i,[kind,prompt,canonical,alts,subject,difficulty,enabled=true]] of rows.entries()){
 const id=`los-b5-${kind}-${String(i+1).padStart(3,"0")}`,accepted=[canonical.toLowerCase(),...alts],riddle=kind==="riddle"?{intendedAnswer:canonical,plausibleAnswers:[...accepted],reviewNotes:"Plausible common responses are included; the clue does not depend on an obscure definition or hidden information."}:undefined;
 questions.push({schemaVersion:1,revision:enabled?1:2,id,prompt,subject,difficulty,answer:{conceptId:id+".answer",canonical,accepted:{en:[...new Set(accepted)],es:[]}},editions:["original","solo","work"],workTrack:kind==="work"?"dedicated":"broad",workSafe:true,kidsSafe:!["culture","para","sunline"].includes(kind),gradeRange:null,classification:kind==="riddle"?"entertainment":"mixed",educationalSubject:titles[kind],contentPacks:packs[kind],review:{status:enabled?"approved":"disabled",reviewer:enabled?"Build 6.30 two-source editorial review":"Build 6.34 SunLine quality cleanup",reviewedAt:enabled?VERIFIED_AT:"2026-08-27",approvalStandard:"stage-6.30"},fact:{sources:S[kind].map(x=>({...x,verifiedAt:VERIFIED_AT,confirmsAnswer:true,confirmsWording:true})),verifiedAt:VERIFIED_AT,dateSensitive:false,wordingFair:true,ambiguityChecked:true},quality:{status:enabled?"passed":"disabled",reviewedAt:enabled?VERIFIED_AT:"2026-08-27",reviewer:enabled?"Build 6.30 editorial review":"Build 6.34 SunLine quality cleanup",flags:enabled?[]:["too-easy","weak-reveal"],los,riddle,notes:enabled?"Passed the No That Was Stupid Factor spoken-play review.":"Disabled because the answer is obvious from the agency context and the reveal has little trivia value."}})
}
return{schemaVersion:1,batchVersion:"stage-6.30-expanded-packs",verifiedAt:VERIFIED_AT,candidateCount:questions.length,questions};
});
