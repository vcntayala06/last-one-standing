
export class Router{
  constructor(){this.routes=new Map()}
  register(name,render){this.routes.set(name,render)}
  go(name,payload){
    const render=this.routes.get(name);
    if(!render)throw new Error(`Unknown route: ${name}`);
    render(payload);
  }
}
