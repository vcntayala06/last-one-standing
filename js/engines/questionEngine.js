
export function shuffle(input){
  const a=[...input];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

export class QuestionEngine{
  constructor(catalog){this.catalog=catalog}

  buildDeck({mode,industry,packs=[]}){
    let core=this.catalog.filter(q=>q.mode===mode);

    if(mode==="work"&&industry){
      const industryQuestions=core.filter(q=>q.industry===industry);
      if(industryQuestions.length)core=industryQuestions;
    }

    const extras=packs.length
      ? this.catalog.filter(q=>q.mode==="pack"&&packs.includes(q.pack))
      : [];

    // Main game remains dominant. Optional packs are roughly 30% of the deck.
    const desiredExtras=Math.min(extras.length,Math.max(0,Math.round(core.length*.43)));
    const extraSlice=shuffle(extras).slice(0,desiredExtras);

    const mixed=[...shuffle(core),...extraSlice];
    return shuffle(mixed);
  }
}
