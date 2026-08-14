(function(root,factory){const bank=factory();if(typeof module==="object"&&module.exports)module.exports=bank;root.LOS_QUESTION_BANK_DATA=bank})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const broadSubjects=new Set(["General Knowledge","Geography","Music"]);
function seed(id,prompt,subject,canonical,accepted,difficulty,options={}){
 const dedicated=options.work===true,broad=!dedicated&&broadSubjects.has(subject);
 return {
  schemaVersion:1,revision:1,id,prompt,subject,difficulty,
  answer:{conceptId:id+".answer",canonical,accepted:{en:accepted,es:[]}},
  editions:dedicated?["work"]:["original","solo",...(broad?["work"]:[])],
  workTrack:dedicated?"dedicated":broad?"broad":null,
  workSafe:true,kidsSafe:options.kidsSafe??!dedicated,
  gradeRange:(options.kidsSafe??!dedicated)?{min:4,max:7}:null,
  classification:options.classification||"educational",educationalSubject:options.educationalSubject||subject,
  review:{status:"reviewed",reviewer:null,reviewedAt:null},
  fact:{sources:[],verifiedAt:null,dateSensitive:false}
 }
}
return {schemaVersion:1,bankVersion:"seed-2026-08-stage-6.6",subjectCatalog:[
 "General Knowledge","I Should Have Known That","Movies & TV","Music","Hip-Hop","R&B","Funk / Oldies","Pop / Rock","Sports","Geography","History","Science","Science & Nature","Space","Nature","Math","Practical Math","Logic / Decoding","Logic & Decoding","Food / Everyday Life","Food & Drink","Cars","Transportation","Transit","Pop Culture","Fun / Weird Facts","Language Arts / Vocabulary","Word Play","Social Studies / Civics"
],questions:[
 seed("los-science-oxygen-001","What gas do humans need to breathe to survive?","Science & Nature","oxygen",["oxygen"],"kids-easy"),
 seed("los-space-mars-001","What planet is known as the Red Planet?","Science & Nature","Mars",["mars"],"kids-easy"),
 seed("los-geography-pacific-001","What is the largest ocean on Earth?","Geography","Pacific Ocean",["pacific","pacific ocean"],"medium"),
 seed("los-general-leap-year-001","How many days are in a leap year?","General Knowledge","366",["366","three hundred sixty six","three hundred and sixty six"],"easy"),
 seed("los-geography-california-capital-001","What is the capital of California?","Geography","Sacramento",["sacramento"],"medium"),
 seed("los-nature-dog-001","What animal is known as man's best friend?","Science & Nature","Dog",["dog","a dog"],"kids-easy"),
 seed("los-science-color-mix-001","What color do you get when you mix blue and yellow?","General Knowledge","Green",["green"],"kids-easy"),
 seed("los-math-triangle-sides-001","How many sides does a triangle have?","General Knowledge","3",["3","three"],"kids-easy"),
 seed("los-science-frozen-water-001","What is frozen water called?","Science & Nature","Ice",["ice"],"kids-easy"),
 seed("los-geography-opposite-north-001","What is the opposite of north?","Geography","South",["south"],"kids-easy"),
 seed("los-food-guacamole-001","What fruit is traditionally used to make guacamole?","Food & Drink","Avocado",["avocado"],"easy"),
 seed("los-general-month-after-june-001","Which month comes after June?","General Knowledge","July",["july"],"kids-easy"),
 seed("los-math-five-times-five-001","What is 5 times 5?","General Knowledge","25",["25","twenty five"],"kids-easy"),
 seed("los-nature-cow-sound-001","Which animal says moo?","Science & Nature","Cow",["cow","a cow"],"kids-easy"),
 seed("los-nature-bees-honey-001","What do bees make?","Science & Nature","Honey",["honey"],"kids-easy"),
 seed("los-language-first-letter-001","What is the first letter of the alphabet?","Word Play","A",["a","letter a"],"kids-easy"),
 seed("los-math-square-sides-001","What shape has four equal sides?","General Knowledge","Square",["square"],"kids-easy"),
 seed("los-space-closest-star-001","What star is closest to Earth?","Science & Nature","The Sun",["sun","the sun"],"easy"),
 seed("los-music-piano-keys-001","What instrument has black and white keys?","Music","Piano",["piano"],"easy",{classification:"entertainment"}),
 seed("los-science-season-after-summer-001","Which season comes after summer?","General Knowledge","Fall",["fall","autumn"],"kids-medium"),
 seed("los-transit-ada-001","On a city bus, what does the abbreviation ADA commonly refer to?","Transportation","Americans with Disabilities Act",["americans with disabilities act"],"hard",{work:true,kidsSafe:false}),
 seed("los-math-bus-arrival-001","A bus leaves at 2:35 and the trip takes 45 minutes. What time does it arrive?","Practical Math","3:20",["three twenty","3 20"],"medium",{work:true,kidsSafe:false}),
 seed("los-math-route-time-001","A route is 24 miles long and averages 12 miles per hour. How long does it take?","Practical Math","2 hours",["two hours","2 hours"],"medium",{work:true,kidsSafe:false}),
 seed("los-logic-doubling-pattern-001","Decode this pattern: 2, 4, 8, 16. What comes next?","Logic & Decoding","32",["thirty two","32"],"medium",{work:true,kidsSafe:false}),
 seed("los-logic-metro-electric-001","If every Metro is a vehicle and some vehicles are electric, must every Metro be electric?","Logic & Decoding","No",["no"],"hard",{work:true,kidsSafe:false}),
 seed("los-math-quarter-percent-001","What percentage is one quarter?","Practical Math","25 percent",["twenty five percent","25 percent"],"medium",{work:true,kidsSafe:false}),
 seed("los-general-us-road-side-001","What side of the road do vehicles normally travel on in the United States?","I Should Have Known That","The right side",["right","right side","the right side"],"easy",{work:true,kidsSafe:false}),
 seed("los-geography-equator-001","What is the imaginary line at zero degrees latitude called?","Geography","The Equator",["equator","the equator"],"medium",{work:true,kidsSafe:false}),
 seed("los-music-crescendo-001","Which music term means gradually getting louder?","Music","Crescendo",["crescendo"],"hard",{work:true,kidsSafe:false,classification:"entertainment"}),
 seed("los-movies-oscar-001","What movie award is commonly represented by a gold statuette?","Movies & TV","The Oscar",["oscar","the oscar","academy award"],"medium",{work:true,kidsSafe:false,classification:"entertainment"}),
 seed("los-transit-headway-001","In transit scheduling, what does headway measure?","Transportation","Time between vehicles",["time between vehicles","time between buses"],"hard",{work:true,kidsSafe:false}),
 seed("los-history-colosseum-001","Which ancient civilization built the Colosseum?","History","The Romans",["romans","the romans","roman empire"],"medium",{work:true,kidsSafe:false}),
 seed("los-pop-culture-octothorpe-001","What social media symbol is also called an octothorpe?","Pop Culture","Hashtag",["hashtag","the hashtag","pound sign"],"hard",{work:true,kidsSafe:false,classification:"entertainment"}),
 seed("los-math-two-half-hours-001","How many minutes are in two and a half hours?","General Knowledge","150",["one hundred fifty","150"],"medium",{work:true,kidsSafe:false})
]}
});
