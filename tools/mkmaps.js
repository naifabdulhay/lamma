const fs=require('fs');
const rd=f=>JSON.parse(fs.readFileSync(f));
function rings(g){return g.type==='Polygon'?g.coordinates:g.type==='MultiPolygon'?g.coordinates.flat():[]}
function build(feats,proj,W,pad=8){
  // project all
  const P=feats.map(f=>({...f,rs:rings(f.geometry).map(r=>r.map(proj))}));
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  P.forEach(f=>f.rs.forEach(r=>r.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)})));
  const s=(W-2*pad)/(x1-x0);const H=Math.round((y1-y0)*s+2*pad);
  const out=P.map(f=>{let A=0,cx=0,cy=0,bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
    const d=f.rs.map(r=>{const q=r.map(([x,y])=>[(x-x0)*s+pad,(y-y0)*s+pad]);
      for(let i=0,j=q.length-1;i<q.length;j=i++){const c=q[j][0]*q[i][1]-q[i][0]*q[j][1];A+=c;cx+=(q[j][0]+q[i][0])*c;cy+=(q[j][1]+q[i][1])*c}
      q.forEach(([x,y])=>{bx0=Math.min(bx0,x);by0=Math.min(by0,y);bx1=Math.max(bx1,x);by1=Math.max(by1,y)});
      let pts=[];q.forEach(([x,y])=>{const t=x.toFixed(1)+' '+y.toFixed(1);if(pts[pts.length-1]!==t)pts.push(t)});
      return pts.length>2?'M'+pts.join('L')+'Z':''}).join('');
    A/=2;const ab=Math.abs(A);cx/=(6*A);cy/=(6*A);
    if(!isFinite(cx)){cx=(bx0+bx1)/2;cy=(by0+by1)/2}
    return {k:f.k,ar:f.ar,d,cx:+cx.toFixed(1),cy:+cy.toFixed(1),a:Math.round(ab)}});
  return {w:W,h:H,r:out};
}
const eq=(lon0,lat0)=>([lon,lat])=>[(lon-lon0)*Math.cos(lat0*Math.PI/180),-lat];
const M={};
// Saudi
let g=rd('sa.geojson');
M.sa=build(g.features.map(f=>({k:f.properties.k,ar:f.properties.ar.replace(/^منطقة /,''),geometry:f.geometry})),eq(45,24),600);
g=rd('sy.geojson');
M.sy=build(g.features.map(f=>({k:f.properties.k,ar:f.properties.ar.replace(/^محافظة /,''),geometry:f.geometry})),eq(38,35),600);
// US
const usAr={Alabama:'ألاباما',Alaska:'ألاسكا',Arizona:'أريزونا',Arkansas:'أركنساس',California:'كاليفورنيا',Colorado:'كولورادو',Connecticut:'كونيتيكت',Delaware:'ديلاوير',Florida:'فلوريدا',Georgia:'جورجيا',Hawaii:'هاواي',Idaho:'أيداهو',Illinois:'إلينوي',Indiana:'إنديانا',Iowa:'أيوا',Kansas:'كانساس',Kentucky:'كنتاكي',Louisiana:'لويزيانا',Maine:'مين',Maryland:'ماريلاند',Massachusetts:'ماساتشوستس',Michigan:'ميشيغان',Minnesota:'مينيسوتا',Mississippi:'مسيسيبي',Missouri:'ميزوري',Montana:'مونتانا',Nebraska:'نبراسكا',Nevada:'نيفادا','New Hampshire':'نيوهامبشير','New Jersey':'نيوجيرسي','New Mexico':'نيومكسيكو','New York':'نيويورك','North Carolina':'كارولاينا الشمالية','North Dakota':'داكوتا الشمالية',Ohio:'أوهايو',Oklahoma:'أوكلاهوما',Oregon:'أوريغون',Pennsylvania:'بنسلفانيا','Rhode Island':'رود آيلاند','South Carolina':'كارولاينا الجنوبية','South Dakota':'داكوتا الجنوبية',Tennessee:'تينيسي',Texas:'تكساس',Utah:'يوتا',Vermont:'فيرمونت',Virginia:'فرجينيا',Washington:'واشنطن','West Virginia':'فرجينيا الغربية',Wisconsin:'ويسكونسن',Wyoming:'وايومنغ','District of Columbia':'مقاطعة كولومبيا'};
g=rd(require('fs').existsSync('us1.geojson')?'us1.geojson':'us.geojson');
M.us=build(g.features.map(f=>({k:f.properties.name,ar:usAr[f.properties.name]||f.properties.name,geometry:f.geometry})),p=>p,700);
// Arab world
const arAr={'Saudi Arabia':'السعودية',Yemen:'اليمن',Oman:'عُمان','United Arab Emirates':'الإمارات',Qatar:'قطر',Kuwait:'الكويت',Bahrain:'البحرين',Iraq:'العراق',Syria:'سوريا',Jordan:'الأردن',Lebanon:'لبنان',Egypt:'مصر',Sudan:'السودان',Libya:'ليبيا',Tunisia:'تونس',Algeria:'الجزائر',Morocco:'المغرب',Mauritania:'موريتانيا',Somalia:'الصومال',Djibouti:'جيبوتي',Turkey:'تركيا',Iran:'إيران',Ethiopia:'إثيوبيا',Chad:'تشاد',Niger:'النيجر',Mali:'مالي',Eritrea:'إريتريا','S. Sudan':'جنوب السودان',Afghanistan:'أفغانستان',Pakistan:'باكستان',Cyprus:'قبرص',Greece:'اليونان',Italy:'إيطاليا',Spain:'إسبانيا'};
g=rd(require('fs').existsSync('arab1.geojson')?'arab1.geojson':'arab.geojson');
const merge={'W. Sahara':'Morocco','Israel':'Palestine','Palestine':'Palestine','Somaliland':'Somalia'};
const groups={};
g.features.forEach(f=>{let n=f.properties.name;n=merge[n]||n;(groups[n]=groups[n]||[]).push(f.geometry)});
const feats=Object.entries(groups).map(([n,gs])=>({k:n,ar:n==='Palestine'?'فلسطين':(arAr[n]||''),geometry:{type:'MultiPolygon',coordinates:gs.flatMap(x=>x.type==='Polygon'?[x.coordinates]:x.coordinates)}}));
M.arab=build(feats,eq(22,25),760);
fs.writeFileSync('/home/claude/fq/src/maps.js','const MAPS='+JSON.stringify(M)+';\n');
for(const k in M)console.log(k,M[k].w,M[k].h,M[k].r.length,M[k].r.map(r=>r.ar+':'+r.a).join(' '));
console.log(fs.statSync('/home/claude/fq/src/maps.js').size);
