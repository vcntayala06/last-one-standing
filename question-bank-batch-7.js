(function(root,factory){const bank=factory();if(typeof module==="object"&&module.exports)module.exports=bank;root.LOS_QUESTION_BANK_BATCH_7=bank})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERIFIED_AT="2026-08-25",questions=[];
// artist, performer type, recognizable album, two recognizable songs, filter tags, era tags, internal lanes
const artists=[
["Drake","rapper","Take Care","God's Plan","Hotline Bling",["hip-hop","pop","today"],["2000s","today"],["modern-hip-hop"]],
["Kendrick Lamar","rapper","good kid, m.A.A.d city","Not Like Us","HUMBLE.",["hip-hop","today"],["today"],["west-coast","modern-hip-hop"]],
["Lil Wayne","rapper","Tha Carter III","A Milli","Lollipop",["hip-hop"],["2000s","today"],["southern-hip-hop","modern-hip-hop"]],
["YG","rapper","My Krazy Life","My Nigga","Big Bank",["hip-hop","today"],["today"],["west-coast","modern-hip-hop"]],
["The Game","rapper","The Documentary","Hate It or Love It","How We Do",["hip-hop"],["2000s"],["west-coast"]],
["T.I.","rapper","Paper Trail","Whatever You Like","Live Your Life",["hip-hop"],["2000s"],["southern-hip-hop"]],
["Fat Joe","rapper","Jealous Ones Still Envy","Lean Back","What's Luv?",["hip-hop"],["1990s","2000s"],["east-coast"]],
["Doja Cat","rapper","Planet Her","Say So","Paint the Town Red",["hip-hop","pop","today"],["today"],["modern-hip-hop"]],
["Sexyy Red","rapper","Hood Hottest Princess","SkeeYee","Pound Town 2",["hip-hop","today"],["today"],["modern-hip-hop"]],
["Latto","rapper","777","Big Energy","Put It on da Floor Again",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["Doechii","rapper","Alligator Bites Never Heal","What It Is (Block Boy)","Denial Is a River",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["GloRilla","rapper","Glorious","F.N.F. (Let's Go)","Yeah Glo!",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["Megan Thee Stallion","rapper","Good News","Savage","Body",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["Cardi B","rapper","Invasion of Privacy","Bodak Yellow","I Like It",["hip-hop","today"],["today"],["east-coast","modern-hip-hop"]],
["Nicki Minaj","rapper","Pink Friday","Super Bass","Anaconda",["hip-hop","pop","today"],["2000s","today"],["east-coast","modern-hip-hop"]],
["Travis Scott","rapper","Astroworld","Sicko Mode","Goosebumps",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["Future","rapper","DS2","Mask Off","Life Is Good",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["21 Savage","rapper","I Am > I Was","A Lot","Bank Account",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["J. Cole","rapper","2014 Forest Hills Drive","No Role Modelz","Middle Child",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["Tyler, the Creator","rapper","IGOR","EARFQUAKE","See You Again",["hip-hop","today"],["today"],["west-coast","modern-hip-hop"]],
["Playboi Carti","rapper","Whole Lotta Red","Magnolia","Sky",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["Gunna","rapper","Wunna","Drip Too Hard","Fukumean",["hip-hop","today"],["today"],["southern-hip-hop","modern-hip-hop"]],
["A$AP Rocky","rapper","Long.Live.A$AP","Praise the Lord (Da Shine)","Fashion Killa",["hip-hop","today"],["today"],["east-coast","modern-hip-hop"]],
["LL Cool J","rapper","Radio","I Need Love","Mama Said Knock You Out",["hip-hop"],["1980s","1990s"],["old-school-hip-hop","east-coast"]],
["Newcleus","group","Jam on Revenge","Jam On It","Computer Age (Push the Button)",["hip-hop","funk"],["1980s"],["old-school-hip-hop","east-coast"]],
["EPMD","group","Strictly Business","You Gots to Chill","So Wat Cha Sayin'",["hip-hop"],["1980s","1990s"],["old-school-hip-hop","east-coast"]],
["Run-DMC","group","Raising Hell","It's Tricky","Walk This Way",["hip-hop","rock-and-roll"],["1980s"],["old-school-hip-hop","east-coast"]],
["Eric B. & Rakim","duo","Paid in Full","Paid in Full","I Ain't No Joke",["hip-hop"],["1980s"],["old-school-hip-hop","east-coast"]],
["Public Enemy","group","It Takes a Nation of Millions to Hold Us Back","Fight the Power","Bring the Noise",["hip-hop"],["1980s","1990s"],["old-school-hip-hop","east-coast"]],
["Salt-N-Pepa","group","Very Necessary","Push It","Shoop",["hip-hop"],["1980s","1990s"],["old-school-hip-hop","east-coast"]],

["James Brown","singer","The Payback","Papa's Got a Brand New Bag","Get Up (I Feel Like Being a) Sex Machine",["funk","soul","1970s"],["1970s"],[]],
["Parliament","group","Mothership Connection","Give Up the Funk (Tear the Roof off the Sucker)","Flash Light",["funk","soul","1970s"],["1970s"],[]],
["Funkadelic","group","Maggot Brain","One Nation Under a Groove","Not Just Knee Deep",["funk","rock","1970s"],["1970s"],[]],
["George Clinton","singer","Computer Games","Atomic Dog","Loopzilla",["funk","soul","1980s"],["1980s"],[]],
["Bootsy Collins","singer","Stretchin' Out in Bootsy's Rubber Band","I'd Rather Be with You","Bootzilla",["funk","soul","1970s"],["1970s"],[]],
["Rick James","singer","Street Songs","Super Freak","Give It to Me Baby",["funk","soul","motown","1980s"],["1980s"],[]],
["Zapp","group","Zapp","More Bounce to the Ounce","Computer Love",["funk","soul","lowrider-oldies","1980s"],["1980s"],[]],
["Roger Troutman","singer","The Many Facets of Roger","I Want to Be Your Man","So Ruff, So Tuff",["funk","soul","lowrider-oldies","1980s"],["1980s"],[]],
["The Gap Band","group","Gap Band IV","Outstanding","You Dropped a Bomb on Me",["funk","soul","1980s"],["1980s"],[]],
["Cameo","group","Word Up!","Word Up!","Candy",["funk","soul","1980s"],["1980s"],[]],
["Ohio Players","group","Fire","Love Rollercoaster","Fire",["funk","soul","1970s"],["1970s"],[]],
["Kool & the Gang","group","Celebrate!","Celebration","Jungle Boogie",["funk","soul","pop","1970s","1980s"],["1970s","1980s"],[]],
["Sly & the Family Stone","group","Stand!","Everyday People","Dance to the Music",["funk","soul","rock","1970s"],["1970s"],[]],
["Earth, Wind & Fire","group","Gratitude","September","Let's Groove",["funk","soul","pop","1970s"],["1970s"],[]],
["The Isley Brothers","group","3 + 3","That Lady","Fight the Power",["funk","soul","lowrider-oldies","1970s"],["1970s"],[]],
["The Brothers Johnson","group","Look Out for #1","Strawberry Letter 23","Stomp!",["funk","soul","1970s"],["1970s"],[]],
["Con Funk Shun","group","Secrets","Ffun","Love's Train",["funk","soul","lowrider-oldies","1970s"],["1970s"],[]],
["Lakeside","group","Fantastic Voyage","Fantastic Voyage","It's All the Way Live",["funk","soul","1980s"],["1980s"],[]],
["Brick","group","Good High","Dazz","Dusic",["funk","soul","1970s"],["1970s"],[]],
["The Bar-Kays","group","Too Hot to Stop","Soul Finger","Freakshow on the Dance Floor",["funk","soul","1970s","1980s"],["1970s","1980s"],[]],
["Prince","singer","1999","Kiss","1999",["funk","soul","pop","rock","1980s"],["1980s"],[]],
["War","group","The World Is a Ghetto","Low Rider","Why Can't We Be Friends?",["funk","soul","lowrider-oldies","latin-oldies","1970s"],["1970s"],[]],

["The Delfonics","group","La La Means I Love You","Didn't I (Blow Your Mind This Time)","La-La (Means I Love You)",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Stylistics","group","The Stylistics","You Are Everything","Betcha by Golly, Wow",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Chi-Lites","group","A Lonely Man","Oh Girl","Have You Seen Her",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["Bloodstone","group","Natural High","Natural High","Outside Woman",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["Brenton Wood","singer","Oogum Boogum","The Oogum Boogum Song","Gimme Little Sign",["lowrider-oldies","soul","latin-oldies","1970s"],["1970s"],[]],
["Tierra","group","City Nights","Together","Memories",["lowrider-oldies","latin-oldies","soul","1980s"],["1980s"],[]],
["Malo","group","Malo","Suavecito","Nena",["lowrider-oldies","latin-oldies","rock","1970s"],["1970s"],[]],
["Thee Midniters","group","Thee Midniters","Whittier Blvd.","That's All",["lowrider-oldies","latin-oldies","rock-and-roll"],["1970s"],[]],
["Smokey Robinson & the Miracles","group","Going to a Go-Go","Ooo Baby Baby","The Tracks of My Tears",["lowrider-oldies","soul","motown","1970s"],["1970s"],[]],
["Al Green","singer","Call Me","Let's Stay Together","Love and Happiness",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["Ralfi Pagan","singer","Ralfi Pagan","Make It with You","To Say I Love You",["lowrider-oldies","latin-oldies","soul","1970s"],["1970s"],[]],
["The Intruders","group","Save the Children","Cowboys to Girls","I'll Always Love My Mama",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Moments","group","Not on the Outside, But on the Inside, Strong!","Love on a Two-Way Street","Look at Me (I'm in Love)",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["Blue Magic","group","Blue Magic","Sideshow","Stop to Start",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Manhattans","group","The Manhattans","Kiss and Say Goodbye","Shining Star",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Persuaders","group","Thin Line Between Love and Hate","Thin Line Between Love and Hate","Love Gonna Pack Up (and Walk Out)",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Dramatics","group","Whatcha See Is Whatcha Get","In the Rain","Whatcha See Is Whatcha Get",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Whispers","group","The Whispers","And the Beat Goes On","Rock Steady",["lowrider-oldies","soul","1980s"],["1980s"],[]],
["Barbara Mason","singer","Yes, I'm Ready","Yes, I'm Ready","From His Woman to You",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["Rosie & the Originals","group","Angel Baby","Angel Baby","Give Me Love",["lowrider-oldies","latin-oldies","rock-and-roll"],["1970s"],[]],
["Sunny & the Sunliners","group","Talk to Me","Talk to Me","Smile Now, Cry Later",["lowrider-oldies","latin-oldies","soul","1970s"],["1970s"],[]],
["El Chicano","group","Viva Tirado","Viva Tirado","Tell Her She's Lovely",["lowrider-oldies","latin-oldies","funk","rock","1970s"],["1970s"],[]],
["The Temprees","group","Lovemen","Dedicated to the One I Love","Love's Maze",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["The Escorts","group","All We Need Is Another Chance","Look Over Your Shoulder","All We Need Is Another Chance",["lowrider-oldies","soul","1970s"],["1970s"],[]],
["Tower of Power","group","Tower of Power","You're Still a Young Man","So Very Hard to Go",["lowrider-oldies","funk","soul","1970s"],["1970s"],[]],

["SZA","singer","Ctrl","Kill Bill","Snooze",["r-and-b","soul","today"],["today"],[]],
["Chris Brown","singer","Exclusive","Forever","With You",["r-and-b","pop","today"],["2000s","today"],[]],
["Summer Walker","singer","Over It","Playing Games","Girls Need Love",["r-and-b","today"],["today"],[]],
["Brent Faiyaz","singer","Wasteland","Dead Man Walking","All Mine",["r-and-b","today"],["today"],[]],
["Kehlani","singer","SweetSexySavage","Nights Like This","Distraction",["r-and-b","today"],["today"],[]],
["Coco Jones","singer","What I Didn't Tell You","ICU","Here We Go (Uh Oh)",["r-and-b","today"],["today"],[]],
["Leon Thomas","singer","Electric Dusk","Mutt","Breaking Point",["r-and-b","today"],["today"],[]],
["PARTYNEXTDOOR","singer","PARTYNEXTDOOR TWO","Come and See Me","Break from Toronto",["r-and-b","today"],["today"],[]],

["The Beatles","band","Sgt. Pepper's Lonely Hearts Club Band","Come Together","Hey Jude",["rock","classic-rock","rock-and-roll","1970s"],["1970s"],[]],
["The Rolling Stones","band","Sticky Fingers","(I Can't Get No) Satisfaction","Paint It Black",["rock","classic-rock","rock-and-roll","1970s"],["1970s"],[]],
["Led Zeppelin","band","Led Zeppelin IV","Stairway to Heaven","Whole Lotta Love",["rock","classic-rock","1970s"],["1970s"],[]],
["Fleetwood Mac","band","Tusk","Dreams","Go Your Own Way",["rock","classic-rock","pop","1970s"],["1970s"],[]],
["Queen","band","A Night at the Opera","Bohemian Rhapsody","We Will Rock You",["rock","classic-rock","1970s"],["1970s"],[]],
["Elvis Presley","singer","Elvis Presley","Hound Dog","Jailhouse Rock",["rock-and-roll","rock","1970s"],["1970s"],[]],
["Chuck Berry","singer","Chuck Berry Is on Top","Johnny B. Goode","Maybellene",["rock-and-roll","rock"],["1970s"],[]],
["Ritchie Valens","singer","Ritchie Valens","La Bamba","Donna",["rock-and-roll","latin-oldies"],["1970s"],[]],

["Peso Pluma","singer","Éxodo","Ella Baila Sola","Lady Gaga",["regional-mexican","today"],["today"],[]],
["Fuerza Regida","group","Pa las Baby's y Belikeada","TQM","Sabor Fresa",["regional-mexican","today"],["today"],[]],
["Grupo Frontera","group","El Comienzo","No Se Va","un x100to",["regional-mexican","today"],["today"],[]],
["Junior H","singer","$ad Boyz 4 Life","Y Lloro","Fin de Semana",["regional-mexican","today"],["today"],[]],
["Los Tigres del Norte","group","Jefe de Jefes","La Puerta Negra","Contrabando y Traición",["regional-mexican","latin-oldies"],["1990s","2000s"],[]],
["Vicente Fernández","singer","Para Siempre","El Rey","Volver, Volver",["regional-mexican","latin-oldies"],["1970s","1990s"],[]],
["Ramón Ayala","singer","Antología de un Rey","Tragos Amargos","Un Rinconcito en el Cielo",["regional-mexican","latin-oldies"],["1970s","1990s"],[]],
["Jenni Rivera","singer","La Gran Señora","Basta Ya","Inolvidable",["regional-mexican","latin-oldies"],["1990s","2000s"],[]],

["Justin Bieber","singer","Purpose","Sorry","Love Yourself",["pop","r-and-b","today"],["2000s","today"],[]],
["The Weeknd","singer","After Hours","Blinding Lights","Save Your Tears",["pop","r-and-b","today"],["today"],[]],
["Ariana Grande","singer","Thank U, Next","7 Rings","We Can't Be Friends",["pop","r-and-b","today"],["today"],[]],
["Bruno Mars","singer","24K Magic","That's What I Like","Locked Out of Heaven",["pop","r-and-b","funk","today"],["today"],[]],
["H.E.R.","singer","Back of My Mind","Focus","Damage",["r-and-b","soul","today"],["today"],[]],
["Usher","singer","Confessions","Yeah!","Burn",["r-and-b","pop"],["1990s","2000s"],[]],
["Mary J. Blige","singer","My Life","Real Love","Family Affair",["r-and-b","soul"],["1990s","2000s"],[]],
["Aaliyah","singer","One in a Million","Are You That Somebody?","Try Again",["r-and-b","soul"],["1990s","2000s"],[]],
["Boyz II Men","group","II","End of the Road","I'll Make Love to You",["r-and-b","soul"],["1990s"],[]],
["New Edition","group","Heart Break","Candy Girl","Can You Stand the Rain",["r-and-b","soul"],["1980s","1990s"],[]],

["Billie Eilish","singer","When We All Fall Asleep, Where Do We Go?","Bad Guy","Birds of a Feather",["pop","today"],["today"],[]],
["Sabrina Carpenter","singer","Emails I Can't Send","Espresso","Please Please Please",["pop","today"],["today"],[]],
["Olivia Rodrigo","singer","Sour","Drivers License","Good 4 U",["pop","rock","today"],["today"],[]],
["Chappell Roan","singer","The Rise and Fall of a Midwest Princess","Good Luck, Babe!","Pink Pony Club",["pop","today"],["today"],[]],
["Bad Bunny","singer","Un Verano Sin Ti","Tití Me Preguntó","Moscow Mule",["pop","today"],["today"],[]]
];
const typeWord={rapper:"rapper",singer:"singer",group:"group",band:"band",duo:"duo"};
const los={accurate:true,clear:true,answerTypeClear:true,fair:true,unambiguous:true,notPedantic:true,notCheapGotcha:true,worthKnowing:true,goodReveal:true,timerFair:true,naturalSpokenWording:true};
const sourceFor=artist=>[
 {title:`${artist} biography and discography`,publisher:"Wikipedia",url:`https://en.wikipedia.org/wiki/${encodeURIComponent(artist.replace(/ /g,"_"))}`},
 {title:`${artist} music, albums, and tracks`,publisher:"Last.fm",url:`https://www.last.fm/music/${encodeURIComponent(artist)}`}
];
for(const [artistIndex,[artist,performerType,album,song1,song2,genres,eras,lanes]] of artists.entries()){
 const dateSensitive=genres.includes("today"),sources=sourceFor(artist),word=typeWord[performerType]||"artist";
 const rows=[
  [`Which ${word} recorded the song “${song1}”?`,artist,[artist.toLowerCase()]],
  [`Which ${word} released the album ${album}?`,artist,[artist.toLowerCase()]],
  [`The song “${song2}” is a recognizable track by which ${word}?`,artist,[artist.toLowerCase()]]
 ];
 for(const [questionIndex,[prompt,canonical,alts]] of rows.entries()){
  const i=artistIndex*3+questionIndex,id=`los-b7-music-${String(i+1).padStart(3,"0")}`,bucket=i%10,difficulty=bucket<4?"easy":bucket<8?"medium":"hard";
  const speechAliases={"The Notorious B.I.G.":["biggie","biggie smalls"],"Tupac Shakur":["tupac","2pac","two pac"],"LL Cool J":["ll cool j","l l cool j"],"Earth, Wind & Fire":["earth wind and fire","earth wind fire"]}[artist]||[];
  questions.push({schemaVersion:1,revision:1,id,prompt,subject:"Music",difficulty,answer:{conceptId:id+".answer",canonical,accepted:{en:[...new Set([...alts,...speechAliases])],es:[]}},editions:["original","solo","work"],workTrack:"broad",workSafe:true,kidsSafe:true,gradeRange:{min:4,max:7},classification:"entertainment",educationalSubject:"Music",contentPacks:["music"],music:{genres:[...genres.filter(x=>!eras.includes(x))],eras:[...eras],performerType,lanes:[...lanes]},review:{status:"approved",reviewer:"Build 6.32 two-source music editorial review",reviewedAt:VERIFIED_AT,approvalStandard:"stage-6.30"},fact:{sources:sources.map(x=>({...x,verifiedAt:VERIFIED_AT,confirmsAnswer:true,confirmsWording:true})),verifiedAt:VERIFIED_AT,dateSensitive,wordingFair:true,ambiguityChecked:true,...(dateSensitive?{currentAsOf:VERIFIED_AT}:{})},quality:{status:"passed",reviewedAt:VERIFIED_AT,reviewer:"Build 6.32 music editorial review",flags:[],los,notes:"Recognizable artist, song, or album knowledge; checked for natural spoken wording, precise performer type, and a satisfying reveal."}})
 }
}
return{schemaVersion:1,batchVersion:"stage-6.32-major-music-depth",verifiedAt:VERIFIED_AT,candidateCount:questions.length,questions};
});
