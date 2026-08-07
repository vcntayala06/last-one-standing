
const files=[
  "./data/modes/family.json",
  "./data/modes/friends.json",
  "./data/modes/work-general.json",

  "./data/work/transit.json",
  "./data/work/healthcare.json",
  "./data/work/first-responders.json",
  "./data/work/restaurant.json",
  "./data/work/retail.json",
  "./data/work/customer-service.json",
  "./data/work/office.json",
  "./data/work/warehouse.json",

  "./data/packs/music.json",
  "./data/packs/hmm.json",
  "./data/packs/real-or-made-up.json",
  "./data/packs/math.json",
  "./data/packs/should-know.json",
  "./data/packs/movies.json",
  "./data/packs/sports.json",
  "./data/packs/food.json",
  "./data/packs/science.json",
  "./data/packs/history.json",
  "./data/packs/random-facts.json"
];

export async function loadQuestionCatalog(){
  const groups=await Promise.all(files.map(async path=>{
    const r=await fetch(path,{cache:"no-store"});
    if(!r.ok)throw new Error(`Could not load ${path}`);
    return await r.json();
  }));

  return groups.flat();
}
