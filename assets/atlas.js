const wide = {
  width:1080, height:610, gap:15,
  circles:{
    math:{x:272,y:255,r:220,label:[144,135]},
    ml:{x:543,y:313,r:282,label:[534,82]},
    deep:{x:550,y:382,r:172,label:[547,493]},
    ai:{x:810,y:266,r:220,label:[924,144]}
  }
};
const narrow = {
  width:360, height:600, gap:7,
  circles:{
    math:{x:109,y:118,r:102,label:[94,59]},
    ml:{x:182,y:303,r:162,label:[281,242]},
    deep:{x:181,y:295,r:116,label:[137,294]},
    ai:{x:251,y:468,r:103,label:[267,519]}
  }
};

export const layoutFor = compact => compact ? narrow : wide;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export const inCircle = (point,circle) => distance(point,circle) <= circle.r;
export const regionsOf = (point,layout) => Object.keys(layout.circles).filter(id=>inCircle(point,layout.circles[id]));

export function fieldFor(layout, explicit) {
  const allowed = new Set(explicit);
  if (allowed.has('deep')) allowed.add('ml');
  const outside = Object.keys(layout.circles).filter(id=>!allowed.has(id));
  const contains = point =>
    explicit.some(id=>inCircle(point, layout.circles[id])) &&
    outside.every(id=>!inCircle(point,layout.circles[id]));
  const segmentInside = (a,b) => {
    if (!explicit.some(id=>inCircle(a,layout.circles[id])&&inCircle(b,layout.circles[id]))) return false;
    const dx=b.x-a.x, dy=b.y-a.y;
    return outside.every(id=>{
      const circle=layout.circles[id];
      const t=Math.max(0,Math.min(1,((circle.x-a.x)*dx+(circle.y-a.y)*dy)/(dx*dx+dy*dy)));
      return !inCircle({x:a.x+t*dx,y:a.y+t*dy},circle);
    });
  };
  const grid = new Map();
  const gap = layout.gap;
  const key = (i,j) => i+','+j;
  const limit = layout===narrow ? 18 : 24;
  for (let i=1;i*gap<layout.width;i++) {
    for (let j=1;j*gap<layout.height;j++) {
      const node={x:i*gap,y:j*gap,i,j,neighbors:[]};
      if (node.x<limit || node.y<limit || node.x>layout.width-limit || node.y>layout.height-limit || !contains(node)) continue;
      grid.set(key(i,j),node);
    }
  }
  const offsets = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (const node of grid.values()) {
    for (const [di,dj] of offsets) {
      const neighbor=grid.get(key(node.i+di,node.j+dj));
      if (neighbor && segmentInside(node,neighbor)) node.neighbors.push(neighbor);
    }
  }
  const components=[];
  for (const first of grid.values()) {
    if (first.component) continue;
    const component=[first];
    first.component=component;
    for (const node of component) {
      for (const neighbor of node.neighbors) {
        if (neighbor.component) continue;
        neighbor.component=component;
        component.push(neighbor);
      }
    }
    components.push(component);
  }
  const major=components.sort((a,b)=>b.length-a.length)[0]??[];
  return {major, contains, segmentInside};
}

const choose = items => items[Math.floor(Math.random()*items.length)];

function pathTo(start,goal) {
  const previous=new Map([[start,null]]);
  const queue=[start];
  for (const node of queue) {
    if (node===goal) break;
    for (const neighbor of node.neighbors) {
      if (previous.has(neighbor)) continue;
      previous.set(neighbor,node);
      queue.push(neighbor);
    }
  }
  if (!previous.has(goal)) return [];
  const path=[];
  for (let node=goal;node!==start;node=previous.get(node)) path.unshift(node);
  return path;
}

export function beginRoute(ball,layout) {
  const current=ball.anchor;
  const active=regionsOf(current,layout);
  const next=ball.zones.filter(id=>!active.includes(id));
  const targetZone=choose(next);
  // Explicitly visit another related zone when it has reachable positions.
  const alternate=targetZone ? current.component.filter(node=>inCircle(node,layout.circles[targetZone])) : [];
  const candidates=alternate.length?alternate:current.component;
  const far=candidates.filter(node=>distance(current,node)>layout.gap*4);
  ball.route=pathTo(current,choose(far.length?far:candidates));
}

export function migrate(ball,layout,seconds) {
  if (!ball.route.length) beginRoute(ball,layout);
  const step=ball.speed*seconds;
  const next=ball.route[0];
  if (!next) return;
  const length=distance(ball,next);
  if (length<=step) {
    ball.x=next.x;
    ball.y=next.y;
    ball.anchor=ball.route.shift();
    return;
  }
  ball.x+=(next.x-ball.x)*step/length;
  ball.y+=(next.y-ball.y)*step/length;
}

export function scatter(balls,layout) {
  const placed=[];
  const labelPoints=Object.values(layout.circles).map(circle=>({x:circle.label[0],y:circle.label[1]}));
  const fields=new Map();
  for (const ball of [...balls].sort((a,b)=>a.zones.length-b.zones.length)) {
    const key=[...ball.zones].sort().join(',');
    if (!fields.has(key)) fields.set(key,fieldFor(layout,ball.zones));
    const {major}=fields.get(key);
    let best;
    let score=-Infinity;
    for (let i=0;i<36;i++) {
      const point=choose(major);
      const space=Math.min(layout.gap*9,...placed.map(other=>distance(point,other)-(ball.size+other.size)/2));
      const nearLabel=labelPoints.some(label=>distance(point,label)<ball.size*.58+14);
      const value=Math.min(space,layout.gap*5)+Math.random()*layout.gap*2-(nearLabel?layout.gap*5:0);
      if (value>score) {score=value;best=point;}
    }
    ball.anchor=best;
    ball.x=best.x;
    ball.y=best.y;
    ball.speed=(layout===narrow?19:28)+Math.random()*(layout===narrow?13:20);
    ball.route=[];
    placed.push(ball);
  }
}
