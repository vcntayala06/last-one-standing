
export async function loadQuestions(){
  const r=await fetch("./data/questions.json",{cache:"no-store"});
  if(!r.ok) throw new Error("Could not load question bank.");
  return await r.json();
}

export function shuffled(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

export function buildDeck(all,{mode,industry}){
  let pool=all.filter(q=>q.mode===mode);
  if(mode==="work" && industry){
    const industryPool=pool.filter(q=>q.industry===industry);
    if(industryPool.length) pool=industryPool;
  }
  return shuffled(pool);
}
