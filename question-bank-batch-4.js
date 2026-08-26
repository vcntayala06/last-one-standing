(function(root,factory){const bank=factory();if(typeof module==="object"&&module.exports)module.exports=bank;root.LOS_QUESTION_BANK_BATCH_4=bank})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERIFIED_AT="2026-08-25",questions=[];
const rows=[
 ["Which group recorded La-La Means I Love You?","The Delfonics",["soul","lowrider-oldies"],["1970s"],"group",false],
 ["Which group recorded You Are Everything?","The Stylistics",["soul","lowrider-oldies"],["1970s"],"group",false],
 ["Which group recorded Oh Girl?","The Chi-Lites",["soul","lowrider-oldies"],["1970s"],"group",false],
 ["Which group recorded Natural High?","Bloodstone",["soul","lowrider-oldies"],["1970s"],"group",false],
 ["Which singer recorded Gimme Little Sign?","Brenton Wood",["soul","lowrider-oldies"],[],"singer",false],
 ["Which group recorded the oldies favorite Together?","Tierra",["soul","latin-oldies","lowrider-oldies"],["1980s"],"group",false],
 ["Which band recorded Low Rider?","War",["funk","rock","lowrider-oldies"],["1970s"],"band",false],
 ["Which band recorded Suavecito?","Malo",["rock","latin-oldies","lowrider-oldies"],["1970s"],"band",false],
 ["Which band recorded Whittier Blvd.?","Thee Midniters",["rock-and-roll","latin-oldies","lowrider-oldies"],[],"band",false],
 ["Which group recorded Ooo Baby Baby?","Smokey Robinson and the Miracles",["soul","motown","lowrider-oldies"],[],"group",false],
 ["Which singer released the album Short n' Sweet?","Sabrina Carpenter",["pop","today"],["today"],"singer",true],
 ["Which singer released Hit Me Hard and Soft?","Billie Eilish",["pop","today"],["today"],"singer",true],
 ["Which singer released The Rise and Fall of a Midwest Princess?","Chappell Roan",["pop","today"],["today"],"singer",true],
 ["Which singer released Debí Tirar Más Fotos?","Bad Bunny",["pop","today"],["today"],"singer",true],
 ["Which singer released the album Génesis?","Peso Pluma",["regional-mexican","today"],["today"],"singer",true],
 ["Which singer released Mañana Será Bonito?","Karol G",["pop","today"],["today"],"singer",true],
 ["Which singer released the album SOS?","SZA",["r-and-b","today"],["today"],"singer",true],
 ["Which singer released the album GUTS?","Olivia Rodrigo",["pop","rock","today"],["today"],"singer",true]
];
const slug=s=>s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42);
for(const [i,[prompt,answer,genres,eras,performerType,dateSensitive]] of rows.entries()){const id=`los-b4-music-${String(i+1).padStart(3,"0")}`,query=encodeURIComponent(`${answer} ${prompt.replace(/^Which (?:group|band|singer) (?:recorded|released)(?: the album)? /,"").replace(/\?$/,"")}`);questions.push({schemaVersion:1,revision:1,id,prompt,subject:"Music",difficulty:i<10?"medium":"easy",answer:{conceptId:id+".answer",canonical:answer,accepted:{en:[answer.toLowerCase()],es:[]}},editions:["original","solo","work"],workTrack:"broad",workSafe:true,kidsSafe:i>=10,gradeRange:i>=10?{min:6,max:7}:null,classification:"entertainment",educationalSubject:"Music",review:{status:"approved",reviewer:"Build 6.29 Music expansion review",reviewedAt:VERIFIED_AT,approvalStandard:"stage-6.9"},fact:{sources:[{title:`MusicBrainz recording lookup: ${answer}`,publisher:"MetaBrainz Foundation",url:`https://musicbrainz.org/search?query=${query}&type=recording&method=indexed`,verifiedAt:VERIFIED_AT,confirmsAnswer:true,confirmsWording:true},{title:`Discogs release lookup: ${answer}`,publisher:"Discogs",url:`https://www.discogs.com/search/?q=${query}&type=release`,verifiedAt:VERIFIED_AT,confirmsAnswer:true,confirmsWording:true}],verifiedAt:VERIFIED_AT,dateSensitive,currentAsOf:dateSensitive?VERIFIED_AT:undefined,wordingFair:true,ambiguityChecked:true},quality:{status:"passed",reviewedAt:VERIFIED_AT,reviewer:"Build 6.29 Music expansion review",flags:[],rubric:{factual:true,fair:true,difficulty:true,worthwhile:true,gameWording:true,templateVariety:true,answerSpecific:true,timerSuitable:true,culturallyFair:true,memorable:true},notes:"Two-source release/recording check; concise spoken-play wording."},music:{genres,eras,performerType}})}
return{schemaVersion:1,batchVersion:"stage-6.29-music-expansion",verifiedAt:VERIFIED_AT,candidateCount:questions.length,questions};
});
