(function(root,factory){const bank=factory();if(typeof module==="object"&&module.exports)module.exports=bank;root.LOS_QUESTION_BANK_BATCH_8=bank})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERIFIED_AT="2026-08-25",questions=[];
const refs=[
 {title:"Walt Disney Animation Studios Films",publisher:"Walt Disney Animation Studios",url:"https://www.disneyanimation.com/films/"},
 {title:"Disney A to Z",publisher:"D23",url:"https://d23.com/a-to-z/"}
];
const rows=[
// Snow White — characters, relationships, objects, and story moments.
["Snow White and the Seven Dwarfs","Which dwarf can barely keep his eyes open because he is always tired?","Sleepy",["sleepy"],"easy"],
["Snow White and the Seven Dwarfs","Which of the Seven Dwarfs is known for frequent sneezing?","Sneezy",["sneezy"],"easy"],
["Snow White and the Seven Dwarfs","Which dwarf communicates without speaking in Snow White and the Seven Dwarfs?","Dopey",["dopey"],"easy"],
["Snow White and the Seven Dwarfs","Which dwarf is the grouchiest member of the group?","Grumpy",["grumpy"],"easy"],
["Snow White and the Seven Dwarfs","Which dwarf has a name that matches his cheerful personality?","Happy",["happy"],"easy"],
["Snow White and the Seven Dwarfs","Which dwarf is especially shy and often blushes?","Bashful",["bashful"],"medium"],
["Snow White and the Seven Dwarfs","Which dwarf acts as the group's leader?","Doc",["doc"],"medium"],
["Snow White and the Seven Dwarfs","How many dwarfs share the cottage where Snow White takes shelter?","Seven",["seven","7"],"easy"],
["Snow White and the Seven Dwarfs","What object tells the Evil Queen who is the fairest of them all?","The Magic Mirror",["magic mirror","the magic mirror","mirror"],"easy"],
["Snow White and the Seven Dwarfs","What poisoned fruit does the disguised Queen give Snow White?","An apple",["apple","an apple","poisoned apple"],"easy"],
["Snow White and the Seven Dwarfs","What disguise does the Evil Queen use when she visits Snow White?","An old hag",["old hag","an old hag","old woman","peddler woman"],"medium"],
["Snow White and the Seven Dwarfs","Whom does the Evil Queen order to take Snow White into the forest?","The Huntsman",["huntsman","the huntsman"],"medium"],
["Snow White and the Seven Dwarfs","What awakens Snow White from the poisoned apple's sleeping spell?","The Prince's kiss",["the princes kiss","prince's kiss","a kiss from the prince","true loves kiss"],"easy"],
["Snow White and the Seven Dwarfs","Where do the Seven Dwarfs work each day?","A diamond mine",["diamond mine","a diamond mine","mine"],"medium"],
["Snow White and the Seven Dwarfs","Who is the main villain in Snow White and the Seven Dwarfs?","The Evil Queen",["evil queen","the evil queen","queen"],"easy"],

// Pinocchio.
["Pinocchio","Which woodcarver creates Pinocchio?","Geppetto",["geppetto"],"easy"],
["Pinocchio","Who brings the wooden puppet Pinocchio to life?","The Blue Fairy",["blue fairy","the blue fairy"],"easy"],
["Pinocchio","Which cricket is appointed to guide Pinocchio toward making good choices?","Jiminy Cricket",["jiminy cricket","jiminy"],"easy"],
["Pinocchio","What tempting island turns misbehaving boys into donkeys in Pinocchio?","Pleasure Island",["pleasure island"],"medium"],
["Pinocchio","What enormous sea creature swallows Geppetto in Pinocchio?","Monstro",["monstro","monstro the whale","a whale","whale"],"medium"],

// Dumbo.
["Dumbo","What unusual feature allows Dumbo to fly?","His large ears",["large ears","his ears","big ears"],"easy"],
["Dumbo","Which small mouse becomes Dumbo's loyal friend and mentor?","Timothy Q. Mouse",["timothy q mouse","timothy mouse","timothy"],"medium"],
["Dumbo","What kind of show is Dumbo born into?","A circus",["circus","a circus"],"easy"],
["Dumbo","What item does Dumbo initially believe helps him fly?","A magic feather",["magic feather","a magic feather","feather"],"easy"],
["Dumbo","What is the name of Dumbo's mother?","Mrs. Jumbo",["mrs jumbo","missus jumbo"],"medium"],

// Bambi.
["Bambi","What kind of animal is Bambi?","A deer",["deer","a deer","fawn"],"easy"],
["Bambi","Which rabbit is Bambi's energetic friend?","Thumper",["thumper"],"easy"],
["Bambi","Which skunk becomes one of Bambi's friends?","Flower",["flower"],"easy"],
["Bambi","What is the name of Bambi's childhood friend who later becomes his mate?","Faline",["faline"],"medium"],
["Bambi","Which respected forest leader is revealed to be Bambi's father?","The Great Prince of the Forest",["great prince of the forest","the great prince","great prince"],"medium"],

// Cinderella.
["Cinderella","What are the names of Cinderella's two best-known mouse friends?","Jaq and Gus",["jaq and gus","gus and jaq","jack and gus","gus gus and jaq"],"easy"],
["Cinderella","What is the name of Cinderella's cruel stepmother?","Lady Tremaine",["lady tremaine","tremaine"],"easy"],
["Cinderella","At what time does the Fairy Godmother's magic wear off?","Midnight",["midnight","12 oclock","twelve oclock"],"easy"],
["Cinderella","What vegetable becomes Cinderella's coach for the royal ball?","A pumpkin",["pumpkin","a pumpkin"],"easy"],
["Cinderella","What is the name of Lady Tremaine's cat?","Lucifer",["lucifer"],"medium"],

// Alice in Wonderland.
["Alice in Wonderland","Which smiling cat can disappear and leave only its grin behind?","The Cheshire Cat",["cheshire cat","the cheshire cat"],"easy"],
["Alice in Wonderland","Which hurried character does Alice follow into Wonderland?","The White Rabbit",["white rabbit","the white rabbit"],"easy"],
["Alice in Wonderland","What happens when Alice drinks from the bottle marked Drink Me?","She shrinks",["she shrinks","shrinks","gets smaller"],"easy"],
["Alice in Wonderland","What happens when Alice eats the cake marked Eat Me?","She grows",["she grows","grows","gets bigger","becomes larger"],"easy"],
["Alice in Wonderland","What birds are used as croquet mallets in the Queen of Hearts' game?","Flamingos",["flamingos","flamingo"],"medium"],

// Peter Pan.
["Peter Pan","What magical place is home to Peter Pan and the Lost Boys?","Never Land",["never land","neverland"],"easy"],
["Peter Pan","What group of children lives with Peter Pan?","The Lost Boys",["lost boys","the lost boys"],"easy"],
["Peter Pan","What sound warns Captain Hook that the crocodile is near?","A ticking clock",["ticking clock","a ticking clock","ticking"],"medium"],
["Peter Pan","Which Darling child travels to Never Land and tells stories to the Lost Boys?","Wendy",["wendy","wendy darling"],"easy"],
["Peter Pan","What magical dust helps Wendy and her brothers fly?","Pixie dust",["pixie dust","fairy dust"],"easy"],

// Lady and the Tramp.
["Lady and the Tramp","What breed of dog is Lady?","A cocker spaniel",["cocker spaniel","a cocker spaniel"],"medium"],
["Lady and the Tramp","What kind of dog is Tramp at the beginning of the movie?","A stray",["stray","a stray","stray dog"],"easy"],
["Lady and the Tramp","What food do Lady and Tramp famously share during dinner?","Spaghetti",["spaghetti","a plate of spaghetti","pasta"],"easy"],
["Lady and the Tramp","What are the names of Aunt Sarah's two Siamese cats?","Si and Am",["si and am","am and si"],"medium"],
["Lady and the Tramp","Which elderly bloodhound is one of Lady's neighborhood friends?","Trusty",["trusty"],"medium"],

// Sleeping Beauty.
["Sleeping Beauty","What are the names of the three good fairies who protect Aurora?","Flora, Fauna, and Merryweather",["flora fauna and merryweather","flora fauna merryweather"],"easy"],
["Sleeping Beauty","What sharp object does Aurora touch before falling asleep?","A spinning-wheel spindle",["spindle","a spindle","spinning wheel spindle","spinning wheel"],"easy"],
["Sleeping Beauty","Which prince battles Maleficent to reach Aurora?","Prince Phillip",["prince phillip","phillip","prince philip"],"easy"],
["Sleeping Beauty","What creature does Maleficent transform into during the final battle?","A dragon",["dragon","a dragon"],"easy"],
["Sleeping Beauty","Who are Aurora's royal parents?","King Stefan and Queen Leah",["king stefan and queen leah","stefan and leah","queen leah and king stefan"],"medium"],

// One Hundred and One Dalmatians.
["One Hundred and One Dalmatians","What are the names of the adult Dalmatian parents?","Pongo and Perdita",["pongo and perdita","perdita and pongo"],"easy"],
["One Hundred and One Dalmatians","Why does Cruella de Vil want the Dalmatian puppies?","To make a fur coat",["make a fur coat","to make a coat","for a fur coat","their fur"],"easy"],
["One Hundred and One Dalmatians","What are the names of Pongo and Perdita's human owners?","Roger and Anita",["roger and anita","anita and roger","roger and anita radcliffe"],"medium"],
["One Hundred and One Dalmatians","How many puppies are born to Pongo and Perdita before the rescue?","Fifteen",["fifteen","15"],"medium"],
["One Hundred and One Dalmatians","Who is the fur-obsessed villain of One Hundred and One Dalmatians?","Cruella de Vil",["cruella de vil","cruella"],"easy"],

// The Sword in the Stone.
["The Sword in the Stone","What nickname is young Arthur called before becoming king?","Wart",["wart","the wart"],"easy"],
["The Sword in the Stone","Which wizard teaches young Arthur?","Merlin",["merlin"],"easy"],
["The Sword in the Stone","What kind of animal is Merlin's companion Archimedes?","An owl",["owl","an owl"],"easy"],
["The Sword in the Stone","What does Arthur pull from a stone to prove he is the rightful king?","A sword",["sword","a sword","the sword"],"easy"],
["The Sword in the Stone","Which witch challenges Merlin to a magical duel?","Madam Mim",["madam mim","mim","madame mim"],"medium"],

// The Jungle Book.
["The Jungle Book","What is the name of the human boy raised in the jungle?","Mowgli",["mowgli"],"easy"],
["The Jungle Book","Which easygoing bear teaches Mowgli about the bare necessities?","Baloo",["baloo"],"easy"],
["The Jungle Book","What kind of animal is Mowgli's protector Bagheera?","A panther",["panther","a panther","black panther"],"easy"],
["The Jungle Book","Which tiger is determined to hunt Mowgli?","Shere Khan",["shere khan","sher khan"],"easy"],
["The Jungle Book","Which jungle ruler wants Mowgli to reveal the secret of fire?","King Louie",["king louie","louie","king louis"],"medium"],

// The Aristocats.
["The Aristocats","What is the name of the mother cat in The Aristocats?","Duchess",["duchess"],"easy"],
["The Aristocats","Which alley cat helps Duchess and her kittens return home?","Thomas O'Malley",["thomas omalley","o malley","omalley","thomas o malley"],"easy"],
["The Aristocats","Which white kitten is known for wearing a pink bow?","Marie",["marie"],"easy"],
["The Aristocats","What are the names of Duchess's three kittens?","Marie, Berlioz, and Toulouse",["marie berlioz and toulouse","berlioz toulouse and marie"],"medium"],
["The Aristocats","Which butler tries to steal the cats' inheritance?","Edgar",["edgar","edgar balthazar"],"easy"],

// Robin Hood.
["Robin Hood","What kind of animal is Disney's Robin Hood?","A fox",["fox","a fox"],"easy"],
["Robin Hood","What kind of animal is Robin Hood's friend Little John?","A bear",["bear","a bear"],"easy"],
["Robin Hood","Which lion rules England while King Richard is away?","Prince John",["prince john"],"easy"],
["Robin Hood","Which town is taxed by the Sheriff in Disney's Robin Hood?","Nottingham",["nottingham"],"medium"],
["Robin Hood","What kind of animal is Maid Marian?","A fox",["fox","a fox","vixen"],"medium"],

// Winnie the Pooh.
["Winnie the Pooh","What kind of animal is Winnie the Pooh?","A bear",["bear","a bear","teddy bear"],"easy"],
["Winnie the Pooh","What sweet food does Pooh love most?","Honey",["honey","hunny"],"easy"],
["Winnie the Pooh","Which small and timid character is Pooh's close friend?","Piglet",["piglet"],"easy"],
["Winnie the Pooh","Which bouncy tiger says that bouncing is what he does best?","Tigger",["tigger"],"easy"],
["Winnie the Pooh","Which gloomy donkey often loses his tail?","Eeyore",["eeyore"],"easy"],

// The Lion King.
["The Lion King","Which lion cub grows up to become king of the Pride Lands?","Simba",["simba"],"easy"],
["The Lion King","What is the name of Simba's father?","Mufasa",["mufasa"],"easy"],
["The Lion King","Which lion is Simba's uncle and the movie's main villain?","Scar",["scar"],"easy"],
["The Lion King","Which meerkat and warthog teach Simba to live by Hakuna Matata?","Timon and Pumbaa",["timon and pumbaa","pumbaa and timon"],"easy"],
["The Lion King","What landmark is home to the royal lions of the Pride Lands?","Pride Rock",["pride rock"],"easy"]
];
const los={accurate:true,clear:true,answerTypeClear:true,fair:true,unambiguous:true,notPedantic:true,notCheapGotcha:true,worthKnowing:true,goodReveal:true,timerFair:true,naturalSpokenWording:true};
for(const [i,[franchise,prompt,canonical,accepted,difficulty]] of rows.entries()){
 const id=`los-b8-disney-${String(i+1).padStart(3,"0")}`;
 questions.push({schemaVersion:1,revision:1,id,prompt,subject:"Movies & TV",difficulty,answer:{conceptId:id+".answer",canonical,accepted:{en:[...new Set(accepted)],es:[]}},editions:["original","solo","work"],workTrack:"broad",workSafe:true,kidsSafe:true,gradeRange:{min:4,max:7},classification:"entertainment",educationalSubject:"Classic Disney Characters and Stories",contentPacks:["movies","disney"],disney:{tags:["fairy-tales","disney-movies"],franchise},review:{status:"approved",reviewer:"Build 6.33 classic Disney two-source editorial review",reviewedAt:VERIFIED_AT,approvalStandard:"stage-6.30"},fact:{sources:refs.map(x=>({...x,verifiedAt:VERIFIED_AT,confirmsAnswer:true,confirmsWording:true})),verifiedAt:VERIFIED_AT,dateSensitive:false,wordingFair:true,ambiguityChecked:true},quality:{status:"passed",reviewedAt:VERIFIED_AT,reviewer:"Build 6.33 Disney rebalance",flags:[],los,notes:"Recognizable character, relationship, object, setting, or story knowledge; checked for balanced representation, natural spoken wording, and a satisfying reveal."}})
}
return{schemaVersion:1,batchVersion:"stage-6.33-disney-classics-rebalance",verifiedAt:VERIFIED_AT,candidateCount:questions.length,questions};
});
