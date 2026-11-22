const fs=require('fs');global.localStorage={getItem:()=>null,setItem:()=>{}};
const src=['maps','core','vis','bank','qgen'].map(f=>fs.readFileSync('src/'+f+'.js','utf8')).join('\n')+'\n;global.QG=QG;global.renderMedia=renderMedia;global.optHTML=optHTML;';
eval(src);
const errs=[];let n=0;const types={};
for(const t of Object.keys(QG.G)){for(let r=1;r<=4;r++)for(let k=0;k<60;k++){let q;try{q=QG.G[t](r)}catch(e){errs.push(t+': '+e.message);continue}n++;types[t]=(types[t]||0)+1;
 const bad=m=>errs.push(t+' '+m+' :: '+JSON.stringify(q).slice(0,200));
 if(!q.prompt)bad('no prompt');
 if(q.input==='choice'){ if(!(q.opts.length>=2))bad('opts'); if(!(q.ans>=0&&q.ans<q.opts.length))bad('ans idx'); const ss=q.opts.map(o=>JSON.stringify(o)); if(new Set(ss).size!==ss.length)bad('dup opts'); if(q.opts.some(o=>o===undefined||o===''))bad('empty opt'); if(q.type!=='tf'&&q.opts.length!==4)bad('not4');}
 if(q.input==='num'&&!(Number.isInteger(q.ans)&&q.ans>=0))bad('num ans '+q.ans);
 if(q.input==='order'&&q.ans.length!==q.opts.length)bad('order');
 if(q.input==='tap'&&!(q.ans>=0))bad('tap');
 if(q.media){try{const h=renderMedia(q.media,{tap:true});if(!h)bad('empty media '+q.media.k)}catch(e){bad('media err '+e.message)}}
 if(q.input==='choice')q.opts.forEach(o=>optHTML(o));
}}
console.log('generated',n,'errors',errs.length);console.log([...new Set(errs)].slice(0,30).join('\n'));
// rounds
for(let r=1;r<6;r++){const qs=QG.round(r,{});console.log('round',r,qs.map(q=>q.type).join(','))}
