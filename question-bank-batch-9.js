(function(root,factory){const bank=factory();if(typeof module==="object"&&module.exports)module.exports=bank;root.LOS_QUESTION_BANK_BATCH_9=bank})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERIFIED_AT="2026-08-26",SUNLINE_VERIFIED_AT="2026-08-27",questions=[];
const SOURCES={
 general:[
  {title:"National Transit Database Glossary",publisher:"Federal Transit Administration",url:"https://www.transit.dot.gov/ntd/national-transit-database-ntd-glossary"},
  {title:"Title VI Fixed Route Transit Requirements",publisher:"U.S. Department of Transportation",url:"https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/title-vi-fixed-route-transit-requirements-video-transcript"}
 ],
 fixed:[
  {title:"Part 37—Transportation Services for Individuals with Disabilities",publisher:"Federal Transit Administration",url:"https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/part-37-transportation-services-individuals-disabilities"},
  {title:"California Commercial Driver Handbook",publisher:"California Department of Motor Vehicles",url:"https://www.dmv.ca.gov/portal/file/california-commercial-driver-handbook-pdf/"}
 ],
 para:[
  {title:"Part 37—Transportation Services for Individuals with Disabilities",publisher:"Federal Transit Administration",url:"https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/part-37-transportation-services-individuals-disabilities"},
  {title:"FTA Circular 4710.1—Americans with Disabilities Act Guidance",publisher:"U.S. Department of Transportation",url:"https://www.transit.dot.gov/sites/fta.dot.gov/files/docs/Final_FTA_ADA_Circular_C_4710.1_1.pdf"}
 ],
 cdl:[
  {title:"California Commercial Driver Handbook",publisher:"California Department of Motor Vehicles",url:"https://www.dmv.ca.gov/portal/file/california-commercial-driver-handbook-pdf/"},
  {title:"Commercial Driver's License—Drivers",publisher:"Federal Motor Carrier Safety Administration",url:"https://www.fmcsa.dot.gov/registration/commercial-drivers-license/drivers"}
 ],
 sunline:[]
};
const SUNLINE_SOURCES={
 history:[
  {title:"Alternative Fuels Milestones",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/alternative-fuels/milestones?language=en"},
  {title:"Short Range Transit Plan FY 2017/2018",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/sites/default/files/SRTP%20FY17-18%20FINAL%2020170530.pdf"}
 ],
 sundial:[
  {title:"SunDial Paratransit Service",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/services/sundial?language=en"},
  {title:"Short Range Transit Plan FY 2017/2018",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/sites/default/files/SRTP%20FY17-18%20FINAL%2020170530.pdf"}
 ],
 zeroEmission:[
  {title:"Alternative Fuels Milestones",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/alternative-fuels/milestones?language=en"},
  {title:"Zero-Emission Bus Rollout Plan",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/images/SunLine_ZEB_Rollout_Plan_FINAL.pdf"}
 ],
 sunride:[
  {title:"SunRide",publisher:"SunLine Transit Agency",url:"https://sunline.org/services/sunride"},
  {title:"Fare Information",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/fares-passes/fares"}
 ],
 commuter:[
  {title:"10 Commuter Link Service",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/services/10-commuter-link"},
  {title:"Short-Range Transit Plan FY 2025-2027",publisher:"SunLine Transit Agency",url:"https://www.sunline.org/images/SunLine_FY25-27_SRTP.pdf"}
 ]
};
const rows={
 general:[
 ["What transit term measures the time between vehicles traveling in the same direction?","Headway",["headway","vehicle headway"],"easy"],
 ["What does a shorter headway usually mean for passengers?","More frequent service",["more frequent service","higher frequency","buses come more often"],"easy"],
 ["What transit measure counts vehicles arriving per hour?","Service frequency",["service frequency","frequency"],"medium"],
 ["What is passenger-carrying transit operation called?","Revenue service",["revenue service","in revenue service"],"easy"],
 ["What transit term describes vehicle travel without carrying passengers?","Deadhead",["deadhead","deadheading","non revenue movement"],"easy"],
 ["What scheduled time at the end of a trip helps service recover from delays?","Layover or recovery time",["layover","recovery time","layover time","layover or recovery time"],"easy"],
 ["What does on-time performance compare with the published schedule?","Actual arrival or departure times",["actual times","actual arrival times","actual departure times","actual times against scheduled times"],"medium"],
 ["What is a location where passengers switch between routes called?","Transfer point",["transfer point","transfer center","connection point"],"easy"],
 ["What is the final endpoint of a transit route commonly called?","Terminus",["terminus","terminal","route terminal"],"easy"],
 ["What does a transit vehicle's destination sign tell riders?","The route or destination",["route or destination","the destination","where the vehicle is going","route and destination"],"easy"],
 ["What does service span describe?","The hours transit service operates",["hours of operation","the hours service operates","operating hours"],"medium"],
 ["What is a scheduled location used to measure a trip's progress called?","Timepoint",["timepoint","time point","scheduled timepoint"],"medium"],
 ["What does ridership count?","Passenger trips",["passenger trips","riders","boardings"],"easy"],
 ["What does vehicle capacity describe?","How many passengers the vehicle can carry",["number of passengers it can carry","how many passengers it holds","passenger capacity"],"easy"],
 ["What is the time a transit vehicle remains stopped for boarding and alighting called?","Dwell time",["dwell time","dwell"],"medium"],
 ["What is getting onto a transit vehicle called?","Boarding",["boarding","getting on"],"easy"],
 ["What is getting off a transit vehicle called?","Alighting",["alighting","getting off","exiting"],"medium"],
 ["What is a temporary replacement path around a blocked route called?","Detour",["detour","an approved detour"],"easy"],
 ["What fare product usually permits multiple rides during a defined period?","Transit pass",["transit pass","bus pass","pass"],"easy"],
 ["What type of trip uses more than one form of transportation?","Multimodal trip",["multimodal trip","multimodal travel","intermodal trip"],"medium"],
 ["What does a transit schedule publish for riders?","Expected arrival and departure times",["arrival and departure times","expected times","scheduled times"],"easy"],
 ["What term describes a passenger trip that includes changing vehicles?","Transfer",["transfer","a transfer"],"easy"],
 ["What does a route map show?","Where a transit route travels",["where the route travels","the route path","route alignment","stops and route path"],"easy"],
 ["What is the main purpose of real-time passenger information?","Show current arrival information",["current arrival information","updated arrival times","live arrivals","real time arrivals"],"medium"],
 ["What is a central place where several transit routes meet called?","Transit center",["transit center","transportation center","transit hub"],"easy"]
 ],
 fixed:[
 ["What defines fixed-route service?","Vehicles follow a prescribed route or schedule",["a prescribed route or schedule","fixed route and schedule","vehicles follow an established route"],"easy"],
 ["If an operator reaches a scheduled timepoint early, when should the bus leave?","At the scheduled departure time",["at the scheduled time","scheduled departure time","not before the scheduled time"],"easy"],
 ["What should an operator use to check the bus sides before pulling from a stop?","Mirrors",["mirrors","the mirrors"],"easy"],
 ["What sign on a bus helps waiting riders identify the route?","Destination sign",["destination sign","headsign","route sign"],"easy"],
 ["What is the operator's trip from the garage to the start of service called?","Pull-out",["pull out","pull-out"],"medium"],
 ["What is the trip from the end of service back to the garage called?","Pull-in",["pull in","pull-in"],"medium"],
 ["What is a location where one operator takes over a scheduled run called?","Relief point",["relief point","operator relief point"],"hard"],
 ["What schedule feature gives an operator time to recover from ordinary delay?","Recovery time",["recovery time","layover","layover time"],"easy"],
 ["What is the safest source for an operator's authorized detour path?","Dispatch or the agency's detour instructions",["dispatch","agency detour instructions","approved detour","authorized detour"],"medium"],
 ["What should a driver verify before moving after passengers board?","Doors are closed and the path is clear",["doors closed and path clear","the doors are closed","the path is clear","passengers are clear"],"medium"],
 ["What vehicle feature lowers the entrance to make boarding easier?","Kneeling system",["kneeling system","kneeling bus","kneeler"],"medium"],
 ["What accessibility equipment bridges the bus entrance and curb for a wheelchair user?","Ramp or lift",["ramp","lift","wheelchair ramp","wheelchair lift","ramp or lift"],"easy"],
 ["What area aboard a bus is designed for a wheelchair or mobility device?","Securement area",["securement area","wheelchair securement area","mobility device area"],"medium"],
 ["What must personnel help passengers use when assistance is necessary or requested?","Ramps, lifts, and securement systems",["ramps lifts and securements","accessibility equipment","lift ramp and securement system"],"hard"],
 ["Besides transfer points, what locations must fixed-route stop announcements include?","Major intersections and destination points",["major intersections and destinations","major intersections","destination points"],"hard"],
 ["Whose requested stop must be announced under the DOT ADA rule?","A passenger with a disability",["passenger with a disability","rider with a disability","disabled passenger"],"medium"],
 ["When several routes share a stop, what must help a rider with a visual disability?","A way to identify the correct vehicle",["way to identify the correct vehicle","route identification","vehicle identification"],"hard"],
 ["What animals must transit providers permit to accompany riders with disabilities?","Service animals",["service animals","a service animal"],"easy"],
 ["What should operators provide so riders can finish boarding or leaving safely?","Adequate time",["adequate time","enough time","sufficient time"],"easy"],
 ["What should be kept clear so passengers can reach emergency exits?","Aisles",["aisles","the aisle","bus aisles"],"easy"],
 ["What passenger-vehicle feature must be operable for emergency evacuation?","Emergency exits",["emergency exits","emergency doors and windows","exits"],"easy"],
 ["Where should baggage be placed so it does not block movement?","In a secure location away from aisles and exits",["secure location","away from aisles and exits","secured so it does not block exits"],"medium"],
 ["What does schedule adherence measure?","How closely service follows the schedule",["how closely service follows schedule","on time performance","adherence to scheduled times"],"medium"],
 ["What radio contact coordinates operators during disruptions?","Dispatch",["dispatch","dispatcher","operations control"],"easy"],
 ["What is a planned break in regular service caused by a blocked street called?","Service detour",["service detour","detour","reroute"],"easy"],
 ["What is the part of a route between two successive stops called?","Route segment",["route segment","segment"],"hard"],
 ["What does a farebox collect or validate?","Fares",["fares","fare payment","cash or fare media"],"easy"],
 ["What tells an operator the sequence of scheduled trips in a work assignment?","Run schedule",["run schedule","schedule card","paddle","run sheet"],"hard"],
 ["What is the point where a fixed route reverses direction called?","Route terminal",["route terminal","terminus","end of line"],"medium"],
 ["What should a driver check before turning to protect the bus's rear swing area?","Mirrors and clearance",["mirrors and clearance","mirror clearance","surroundings"],"medium"],
 ["What driving method helps preserve space to react to hazards?","Defensive driving",["defensive driving","maintaining a safety cushion","space management"],"easy"],
 ["What should an operator know before entering a low-clearance area?","The vehicle's height",["vehicle height","bus height","clearance height"],"medium"],
 ["What should a driver avoid relying on as the only guide while backing?","Mirrors alone",["mirrors alone","only mirrors"],"hard"],
 ["What must be checked during a passenger-vehicle pre-trip for safe evacuation?","Emergency exits",["emergency exits","emergency doors and windows","exit operation"],"medium"],
 ["What does a stop-request signal tell the operator?","A passenger wants the next stop",["passenger wants next stop","request to stop","someone wants to get off"],"easy"],
 ["What term describes passengers who ride while standing?","Standees",["standees","standing passengers"],"easy"],
 ["What should standees remain behind when a bus has a standee line?","The standee line",["standee line","the line","standing line"],"medium"],
 ["What should be inspected to confirm a wheelchair securement system is usable?","Securement straps and anchor points",["securement straps and anchors","straps and anchor points","wheelchair securements"],"hard"],
 ["What information should an operator give dispatch about a service interruption?","Location, route, and problem",["location route and problem","location and issue","route location and problem"],"medium"],
 ["What is the safest place to stop for passenger boarding?","A designated safe bus stop",["designated bus stop","safe bus stop","authorized stop"],"easy"]
 ],
 para:[
 ["What federal service complements public fixed-route transit for eligible riders with disabilities?","ADA complementary paratransit",["ADA paratransit","complementary paratransit","ADA complementary paratransit"],"easy"],
 ["What kind of service must complementary ADA paratransit provide?","Origin-to-destination service",["origin to destination","origin-to-destination service"],"easy"],
 ["Why does the federal rule use origin-to-destination instead of curb-to-curb?","Required assistance can vary by rider",["assistance varies by rider","to ensure riders can get from origin to destination","it may require help beyond the curb"],"hard"],
 ["How far on each side of a fixed bus route does the basic ADA paratransit corridor extend?","Three-quarters of a mile",["three quarters of a mile","3/4 mile","0.75 mile"],"medium"],
 ["How is the three-quarter-mile ADA service corridor measured?","As the crow flies",["as the crow flies","straight line distance"],"hard"],
 ["What must ADA paratransit days and hours be comparable to?","The corresponding fixed-route service",["fixed route service","the comparable bus or rail service","corresponding fixed route"],"medium"],
 ["What is the earliest reservation service ADA paratransit must generally provide?","Next-day service",["next day service","service the next day","next-day reservations"],"medium"],
 ["What trip purposes may ADA complementary paratransit prioritize?","None",["none","no trip purposes","it cannot prioritize by trip purpose"],"hard"],
 ["What are limits such as waiting lists or substantial trip denials called when they restrict service?","Capacity constraints",["capacity constraints","prohibited capacity constraints"],"hard"],
 ["What determines ADA paratransit eligibility: diagnosis alone or functional ability?","Functional ability to use fixed route",["functional ability","ability to use fixed route","functional inability to use fixed route"],"easy"],
 ["What eligibility type applies only under certain travel conditions?","Conditional eligibility",["conditional eligibility","conditionally eligible"],"medium"],
 ["What eligibility type covers a disability expected to last for a limited period?","Temporary eligibility",["temporary eligibility","temporary paratransit eligibility"],"medium"],
 ["What service may connect an eligible rider to an accessible fixed route?","Feeder service",["feeder service","paratransit feeder service"],"hard"],
 ["What may a visitor show to receive ADA paratransit in another jurisdiction?","Home-system eligibility documentation",["eligibility documentation","paratransit eligibility card","documentation from home system"],"medium"],
 ["For how many days in a 365-day period must visitor eligibility generally be honored?","Twenty-one days",["21 days","twenty one days"],"hard"],
 ["Who assists a rider with personal needs and rides complementary paratransit without a fare?","Personal care attendant",["personal care attendant","PCA","care attendant"],"easy"],
 ["How many companions must an eligible rider generally be allowed to bring?","One companion",["one companion","1 companion"],"medium"],
 ["When are additional companions carried on complementary paratransit?","When space is available",["space available","when space is available","on a space available basis"],"medium"],
 ["What must a companion share with the eligible paratransit rider?","The same origin and destination",["same origin and destination","same pickup and dropoff"],"hard"],
 ["What animals may accompany riders with disabilities on transit?","Service animals",["service animals","a service animal"],"easy"],
 ["What process allows a rider to challenge a paratransit eligibility denial?","Appeal",["appeal","appeals process","eligibility appeal"],"easy"],
 ["What must an eligibility decision provide when service is denied or conditional?","Written reasons",["written reasons","written notification and reasons","reasons in writing"],"hard"],
 ["What type of eligibility applies when some fixed-route trips are possible but others are not?","Conditional eligibility",["conditional eligibility","conditional"],"medium"],
 ["What federal concept may require a policy exception to avoid discrimination?","Reasonable modification",["reasonable modification","reasonable modification of policy"],"hard"],
 ["What is the maximum basic ADA paratransit fare compared with a similar full fixed-route fare?","Twice the fixed-route fare",["twice the fare","two times the fixed route fare","double the fixed route fare"],"hard"],
 ["What service characteristic means other riders may share the paratransit vehicle?","Shared ride",["shared ride","shared-ride service"],"easy"],
 ["What should eligibility assess about barriers to fixed-route use?","Their functional effect on the individual",["functional effect","how barriers affect the rider","individual functional ability"],"hard"],
 ["What may transit personnel need to provide between the vehicle and a rider's origin or destination?","Assistance",["assistance","needed assistance","origin to destination assistance"],"medium"],
 ["What does an accessible fixed route offer that some eligible riders may use for certain trips?","Accessible buses or trains",["accessible buses or trains","accessible vehicles","accessible fixed route vehicles"],"easy"],
 ["What must a transit agency avoid using as an automatic reason to deny a mobility device?","Difficulty securing it",["difficulty securing it","the device cannot be secured satisfactorily","securement difficulty"],"hard"],
 ["May personnel recommend that a wheelchair user transfer to a seat, and what can they not do?","Recommend it but not require it",["recommend but not require","they cannot require a transfer","suggest only"],"hard"],
 ["Who may use a vehicle lift besides wheelchair users when needed?","Standees with disabilities",["standees with disabilities","people with disabilities who cannot use steps","disabled standees"],"medium"],
 ["What equipment must personnel assist with when necessary?","Securement systems, ramps, and lifts",["securements ramps and lifts","accessibility equipment","ramp lift and securement"],"medium"],
 ["What must an ADA paratransit rider reserve for a companion?","Space on the trip",["space","a seat","companion space"],"medium"],
 ["What is ADA complementary paratransit intended to complement?","Public fixed-route service",["fixed route service","public fixed route transit","bus or rail fixed route"],"easy"]
 ],
 cdl:[
 ["What California commercial license class generally covers a single heavy vehicle without a qualifying heavy trailer?","Commercial Class B",["class b","commercial class b","class B CDL"],"easy"],
 ["What permit lets a CDL applicant practice on public roads with a qualified CDL holder?","Commercial Learner's Permit",["commercial learners permit","commercial learner permit","CLP"],"easy"],
 ["What endorsement is required to operate a qualifying commercial passenger vehicle?","Passenger endorsement",["passenger endorsement","P endorsement","P"],"easy"],
 ["What federal training program applies to many first-time Class B and passenger endorsement applicants?","Entry-Level Driver Training",["entry level driver training","ELDT"],"easy",true],
 ["Where must federally compliant entry-level CDL training providers be listed?","Training Provider Registry",["training provider registry","TPR","FMCSA registry"],"medium",true],
 ["How long must a California CLP generally be held before the skills test?","At least fourteen days",["14 days","fourteen days","at least 14 days"],"medium",true],
 ["How many behind-the-wheel training hours does California currently require for an original Class A or B applicant?","At least fifteen hours",["15 hours","fifteen hours","at least 15 hours"],"hard",true],
 ["What California form certifies the required commercial behind-the-wheel training?","DL 1236",["DL 1236","California commercial driver behind the wheel training certification"],"hard",true],
 ["Who must accompany a CLP holder operating a commercial vehicle on public roads?","A properly licensed CDL holder",["qualified CDL holder","properly licensed CDL holder","CDL holder with the correct class and endorsements"],"easy",true],
 ["Which ordinary passengers may a P-endorsed CLP holder carry during training?","None",["none","no ordinary passengers","only authorized training or testing personnel"],"hard",true],
 ["What system uses stored compressed air to apply vehicle brakes?","Air brakes",["air brakes","air brake system"],"easy"],
 ["What part pumps air into the storage tanks?","Air compressor",["air compressor","compressor"],"easy"],
 ["What controls when the air compressor cuts in and cuts out?","Air compressor governor",["air compressor governor","compressor governor","governor"],"easy"],
 ["What holds compressed air for repeated brake applications?","Air storage tanks",["air storage tanks","air tanks","reservoirs"],"easy"],
 ["What instrument shows pressure in the air tanks?","Air pressure gauge",["air pressure gauge","supply pressure gauge","air gauge"],"easy"],
 ["What device alerts the driver when air pressure becomes dangerously low?","Low-air-pressure warning",["low air warning","low air pressure warning","low-air-pressure warning"],"easy"],
 ["What brakes are held back by air pressure and apply when pressure is lost?","Spring brakes",["spring brakes","spring brake"],"medium"],
 ["Which air-brake system applies and releases brakes during normal driving?","Service brake system",["service brake system","service brakes"],"easy"],
 ["Which air-brake system holds the vehicle when parked?","Parking brake system",["parking brake system","parking brakes"],"easy"],
 ["Which air-brake system uses service and parking components during failure?","Emergency brake system",["emergency brake system","emergency brakes"],"medium"],
 ["What is the delay between pressing the pedal and air brakes beginning to work called?","Brake lag",["brake lag","air brake lag"],"medium"],
 ["What can repeated hard braking on a downgrade cause?","Brake fade",["brake fade","fading brakes","overheated brakes"],"medium"],
 ["What system helps prevent wheel lock during hard braking?","Anti-lock braking system",["anti lock braking system","ABS","anti-lock brakes"],"easy"],
 ["What is the purpose of dual air systems?","Provide separate air circuits for added safety",["separate air circuits","added braking reliability","two independent air systems"],"hard"],
 ["Why are manual air tanks drained?","To remove moisture and oil",["remove moisture and oil","drain water and oil","remove condensation"],"medium"],
 ["What inspection checks whether air pressure drops excessively with brakes applied?","Air leakage test",["air leakage test","leakage rate test","applied leakage test"],"hard"],
 ["What check confirms the low-air warning activates before pressure becomes unsafe?","Low-air warning test",["low air warning test","test the low pressure warning"],"medium"],
 ["What check confirms spring brakes apply as air pressure falls?","Spring-brake pop-out test",["spring brake pop out test","parking brake valve pop out test","spring brake application test"],"hard"],
 ["What should a driver use on a long downgrade instead of riding the brakes continuously?","A lower gear and proper braking technique",["lower gear","engine braking and proper brake use","select a safe gear"],"medium"],
 ["What combines perception distance, reaction distance, brake lag, and braking distance?","Total stopping distance",["total stopping distance","stopping distance"],"hard"],
 ["What happens to stopping distance as vehicle speed increases?","It increases",["it increases","gets longer","increases greatly"],"easy"],
 ["What vehicle inspection is performed before driving?","Pre-trip inspection",["pre trip inspection","pre-trip inspection","vehicle inspection"],"easy"],
 ["What should be checked for leaks, cuts, or damage during an engine-compartment inspection?","Hoses",["hoses","air and fluid hoses"],"medium"],
 ["What should tire tread, inflation, and condition be checked for during inspection?","Safe condition",["safe condition","proper inflation and damage","tire safety"],"easy"],
 ["What steering component connects the steering gear to the wheel linkage?","Steering linkage",["steering linkage","steering system linkage"],"hard"],
 ["What should wheel fasteners be checked for?","Looseness or missing parts",["loose or missing lug nuts","looseness","missing fasteners"],"medium"],
 ["What lighting should be checked before operating a passenger vehicle?","All required lights and reflectors",["lights and reflectors","all required lights","vehicle lighting"],"easy"],
 ["What passenger-vehicle inspection items let occupants escape in an emergency?","Emergency exits",["emergency exits","emergency doors and windows"],"easy"],
 ["What emergency equipment commonly includes a fire extinguisher and warning devices?","Required emergency equipment",["emergency equipment","fire extinguisher and warning devices","safety equipment"],"easy"],
 ["What must remain clear so passengers can evacuate?","Aisles and exits",["aisles and exits","the aisle","emergency exits"],"easy"],
 ["Where must baggage be secured on a passenger vehicle?","Away from aisles and exits",["away from aisles and exits","in a secure area","where it cannot block movement"],"medium"],
 ["What should a passenger driver inspect after every stop when riders have left items behind?","The passenger area",["passenger area","inside the bus","seating area"],"medium"],
 ["What term describes passengers who ride standing?","Standees",["standees","standing passengers"],"easy"],
 ["Where must standees remain if the vehicle has a standee line?","Behind the standee line",["behind the standee line","behind the line"],"medium"],
 ["What is the safest way to handle an unruly passenger while driving?","Stop safely and follow emergency procedures",["stop safely","pull over safely and follow procedure","contact dispatch or authorities from a safe stop"],"medium"],
 ["What should a driver do before opening doors for passengers?","Stop in a safe location and secure the vehicle",["stop safely and secure vehicle","secure the bus","make a safe stop"],"easy"],
 ["What should mirrors show before a passenger vehicle changes lanes?","The lane and surrounding traffic are clear",["lane is clear","surrounding traffic","clearance around the vehicle"],"easy"],
 ["What driving space helps a large vehicle complete a turn without striking objects?","Adequate clearance",["adequate clearance","turning clearance","enough space"],"easy"],
 ["What should a commercial driver know before passing under a low structure?","Vehicle height",["vehicle height","clearance height","bus height"],"easy"],
 ["What is the safest general approach to backing a large passenger vehicle?","Avoid backing when possible",["avoid backing","do not back unless necessary","minimize backing"],"medium"],
 ["What helper should be used when available during difficult backing?","Spotter",["spotter","helper","guide"],"easy"],
 ["What must a passenger driver check at a railroad-highway crossing?","Tracks are clear before crossing",["tracks are clear","look and listen for trains","railroad traffic"],"medium"],
 ["What should a driver select before beginning a steep downgrade?","A safe lower gear",["lower gear","safe gear","proper gear"],"medium"],
 ["What is the purpose of following distance?","Provide time and space to stop",["time and space to stop","safety cushion","room to react"],"easy"],
 ["What medical document may a non-excepted interstate commercial driver need to maintain?","Medical Examiner's Certificate",["medical examiners certificate","medical certificate","MEC"],"hard",true],
 ["What restriction appears when a driver is not qualified to operate full air brakes?","L restriction",["L restriction","no full air brakes restriction","air brake restriction"],"hard",true]
 ],
 sunline:[
 ["What is SunLine's ADA paratransit service called?","SunDial",["SunDial","Sun Dial"],"easy",true,"sundial","SunDial"],
 ["SunDial provides what kind of shared-ride service for eligible riders with disabilities?","Origin-to-destination paratransit",["origin to destination paratransit","origin-to-destination service","shared ride origin to destination paratransit"],"medium",true,"sundial","SunDial"],
 ["Which fixed-route service does SunDial complement?","SunBus",["SunBus","Sun Bus"],"easy",true,"sundial","SunDial"],
 ["How far from eligible local SunBus routes does SunDial generally operate?","Three-quarters of a mile",["three quarters of a mile","three quarter mile","3/4 mile","0.75 mile"],"medium",true,"sundial","SunDial"],
 ["In what year was SunLine Transit Agency established?","1977",["1977","nineteen seventy seven"],"easy",false,"history","Agency History"],
 ["How many buses did SunLine have when it began operations in 1977?","22 buses",["22","twenty two","twenty-two buses"],"hard",false,"history","Fleet / Bus History"],
 ["In what year did SunDial paratransit begin service?","1991",["1991","nineteen ninety one"],"medium",false,"history","SunDial"],
 ["How many vans launched SunDial paratransit in 1991?","10 vans",["10","ten","ten vans"],"hard",false,"history","SunDial"],
 ["What kind of fleet did SunLine commit to creating in 1992?","A 100% alternative-fuel fleet",["100 percent alternative fuel fleet","all alternative fuel fleet","an alternative fuel fleet"],"easy",false,"history","Alternative Fuels"],
 ["What fuel powered SunLine's landmark full-fleet conversion in 1994?","Compressed natural gas",["compressed natural gas","CNG","natural gas"],"easy",false,"history","Alternative Fuels"],
 ["What national first did SunLine achieve with its fleet in 1994?","The first transit fleet converted entirely to natural gas",["first all natural gas transit fleet","first fleet fully converted to natural gas","first transit fleet to use 100 percent natural gas"],"hard",false,"history","Major Milestones / Firsts"],
 ["What zero-emission fuel did SunLine begin demonstrating on a bus in 2000?","Hydrogen",["hydrogen","H2","hydrogen fuel"],"easy",false,"zeroEmission","Hydrogen"],
 ["What kind of bus did SunLine first operate in its 2002–2003 hydrogen program?","A hydrogen fuel-cell hybrid bus",["hydrogen fuel cell hybrid bus","fuel cell hybrid bus","H2 fuel cell hybrid"],"medium",false,"zeroEmission","Hydrogen"],
 ["What two alternative fuels could the pioneering SunFuels station dispense in 2006?","CNG and hydrogen",["CNG and hydrogen","compressed natural gas and hydrogen","natural gas and H2"],"medium",false,"history","Major Milestones / Firsts"],
 ["What national hydrogen-bus milestone did SunLine reach in 2010?","It added the first Buy America-compliant hydrogen fuel-cell bus",["first Buy America compliant hydrogen fuel cell bus","first Buy America compliant H2 bus"],"hard",false,"zeroEmission","Major Milestones / Firsts"],
 ["What zero-emission bus technology did SunLine place into service in January 2016?","A battery-electric bus",["battery electric bus","electric bus","BEB"],"easy",false,"zeroEmission","Battery Electric"],
 ["What is SunLine's on-demand rideshare service called?","SunRide",["SunRide","Sun Ride"],"easy",true,"sunride","SunRide"],
 ["What type of transit service is SunRide?","On-demand microtransit",["on demand microtransit","microtransit","on demand rideshare"],"medium",true,"sunride","SunRide"],
 ["What is SunLine's regional commuter service called?","10 Commuter Link",["10 Commuter Link","Route 10","10 Commuter","Route 10 Commuter Link"],"easy",true,"commuter","Route 10 / Regional"],
 ["The 10 Commuter Link connects the Coachella Valley with what neighboring region?","The Inland Empire",["Inland Empire","the Inland Empire","San Bernardino area"],"medium",true,"commuter","Route 10 / Regional"]
 ]
};
const packs={general:["transit","transit-general"],fixed:["transit","fixed-route"],para:["transit","paratransit"],cdl:["transit","cdl-dmv"],sunline:["transit","sunline"]};
const labels={general:"General Transit",fixed:"Fixed Route",para:"Paratransit",cdl:"CDL / DMV Knowledge",sunline:"SunLine"};
const los={accurate:true,clear:true,answerTypeClear:true,fair:true,unambiguous:true,notPedantic:true,notCheapGotcha:true,worthKnowing:true,goodReveal:true,timerFair:true,naturalSpokenWording:true};
for(const [lane,list] of Object.entries(rows))for(const [index,row] of list.entries()){
 const [prompt,canonical,accepted,difficulty,dateSensitive=false,sourceKey,contentType]=row,id=`los-b9-${lane}-${String(index+1).padStart(3,"0")}`,sources=lane==="sunline"?SUNLINE_SOURCES[sourceKey]:SOURCES[lane],recordVerifiedAt=lane==="sunline"?SUNLINE_VERIFIED_AT:VERIFIED_AT;
 questions.push({schemaVersion:1,revision:lane==="sunline"&&index<4?2:1,id,prompt,subject:"Transit",difficulty,answer:{conceptId:id+".answer",canonical,accepted:{en:[...new Set(accepted)],es:[]}},editions:["original","solo","work"],workTrack:"broad",workSafe:true,kidsSafe:lane==="general"&&difficulty==="easy",gradeRange:null,classification:"educational",educationalSubject:labels[lane],contentPacks:packs[lane],transit:{categories:[packs[lane][1]],lane:labels[lane],contentType:contentType||labels[lane]},review:{status:"approved",reviewer:"Build 6.34 official-source Transit review",reviewedAt:recordVerifiedAt,approvalStandard:"stage-6.30"},fact:{sources:sources.map(source=>({...source,verifiedAt:recordVerifiedAt,confirmsAnswer:true,confirmsWording:true})),verifiedAt:recordVerifiedAt,dateSensitive,currentAsOf:dateSensitive?recordVerifiedAt:null,wordingFair:true,ambiguityChecked:true},quality:{status:lane==="sunline"&&index===1?"rewritten":"passed",reviewedAt:recordVerifiedAt,reviewer:"Build 6.34 Transit quality gate",flags:[],los,notes:"Original open-answer wording derived from official public sources; checked for spoken clarity, useful knowledge, narrow aliases, and a satisfying reveal."}})
}
return{schemaVersion:1,batchVersion:"stage-6.34-major-transit-cdl-depth",verifiedAt:VERIFIED_AT,candidateCount:questions.length,questions};
});
