(function(){
  /* =================================================================== */
  /* =========================  GAME SETTINGS  ========================= */
  /* =================================================================== */
  var GAME = {
    walkSpeed:   11,             // how fast Tommy moves
    fieldHalf:   42,             // half-size of the field 
    giftPos:     {x:-30, z:-26}, // gift location
    findRadius:  5,              // how close Tommy must get to open the letter
    tommyScale:  0.8,            // Tommy's size 
    giftScale:   1.8             // gift size
  };
  /* =================================================================== */

  /* ---------- starfield (hero) ---------- */
  var stars = document.getElementById('stars');
  var sfrag = document.createDocumentFragment();
  for(var i=0;i<230;i++){
    var stx = document.createElement('div'); stx.className='star';
    var size = Math.random()*2 + 0.4;
    stx.style.width=size+'px'; stx.style.height=size+'px';
    stx.style.left=Math.random()*100+'%'; stx.style.top=Math.random()*100+'%';
    stx.style.setProperty('--o',(0.4+Math.random()*0.6).toFixed(2));
    stx.style.setProperty('--tw',(2.5+Math.random()*5).toFixed(1)+'s');
    stx.style.animationDelay=(Math.random()*5).toFixed(1)+'s';
    if(Math.random()>0.93){ stx.style.boxShadow='0 0 6px 1px rgba(255,225,240,.9)'; }
    sfrag.appendChild(stx);
  }
  stars.appendChild(sfrag);

  /* ---------- solar system (hero) ---------- */
  var planets = [ {rx:210, ry:105, size:24, per:16, tilt:-20, earth:true} ];
  var solar = document.getElementById('solar');
  var sun = document.createElement('div'); sun.className='sun'; solar.appendChild(sun);
  planets.forEach(function(p){
    var orbit=document.createElement('div'); orbit.className='orbit';
    orbit.style.width=(p.rx*2)+'px'; orbit.style.height=(p.ry*2)+'px';
    orbit.style.transform='translate(-50%,-50%) rotate('+p.tilt+'deg)';
    var d='M 0,'+p.ry+' A '+p.rx+','+p.ry+' 0 1,0 '+(p.rx*2)+','+p.ry+' A '+p.rx+','+p.ry+' 0 1,0 0,'+p.ry;
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width',p.rx*2); svg.setAttribute('height',p.ry*2); svg.setAttribute('viewBox','0 0 '+(p.rx*2)+' '+(p.ry*2));
    var path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',d); path.setAttribute('class','orbit-line');
    if(p.earth) path.setAttribute('stroke','rgba(120,255,180,.28)');
    svg.appendChild(path); orbit.appendChild(svg);
    var pl=document.createElement('div'); pl.className='planet'+(p.earth?' earth earth-halo':'');
    pl.style.width=p.size+'px'; pl.style.height=p.size+'px'; pl.style.setProperty('--per',p.per+'s');
    pl.style.offsetPath="path('"+d+"')"; pl.style.animationDelay='-'+(Math.random()*p.per).toFixed(1)+'s';
    orbit.appendChild(pl); solar.appendChild(orbit);
  });

  /* ---------- scroll zoom into the sun ---------- */
  var wrap=document.querySelector('.galaxy-wrap');
  var veil=document.getElementById('veil');
  var heroText=document.getElementById('heroText');
  var scrollHint=document.getElementById('scrollHint');
  var ticking=false;
  function update(){
    var rect=wrap.getBoundingClientRect();
    var total=wrap.offsetHeight-window.innerHeight;
    var scrolled=Math.min(Math.max(-rect.top,0),total);
    var pr=total>0?scrolled/total:0;
    sun.style.transform='translate(-50%,-50%) scale('+(1+(pr*pr)*46).toFixed(3)+')';
    heroText.style.opacity=pr<0.18?1:Math.max(0,1-(pr-0.18)/0.22);
    scrollHint.style.opacity=pr<0.05?1:Math.max(0,1-pr/0.1);
    solar.style.opacity=pr<0.45?1:Math.max(0,1-(pr-0.45)/0.28);
    stars.style.opacity=pr<0.4?1:Math.max(0,1-(pr-0.4)/0.3);
    veil.style.opacity=pr<0.6?0:Math.min(1,(pr-0.6)/0.34);
  }
  window.addEventListener('scroll',function(){ if(!ticking){ requestAnimationFrame(function(){update();ticking=false;}); ticking=true; } },{passive:true});
  window.addEventListener('resize',update); update();

  /* ---------- letter modal ---------- */
  var modal=document.getElementById('modal');
  var closeBtn=document.getElementById('closeBtn');
  function openCard(){ modal.classList.add('open'); }
  function closeCard(){
    modal.classList.remove('open');
    var b=document.getElementById('gameBanner'); if(b) b.classList.remove('show'); // clear the "you found something" message
  }
  closeBtn.addEventListener('click',closeCard);
  modal.addEventListener('click',function(e){ if(e.target===modal) closeCard(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeCard(); });
  document.getElementById('fallbackBtn').addEventListener('click',openCard);

  /* =================================================================== */
  /* ============================  3D FIELD  =========================== */
  /* =================================================================== */
  var gameSection=document.getElementById('game');
  var isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if(isTouch) gameSection.classList.add('touch');

  if(typeof THREE==='undefined'){ document.getElementById('gameFallback').classList.add('show'); return; }

  var started=false, visible=false;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      visible = e.isIntersecting;
      if(e.isIntersecting && !started){ started=true; try{ initGame(); }catch(err){ console.error(err); document.getElementById('gameFallback').classList.add('show'); } }
    });
  },{threshold:0.25});
  io.observe(gameSection);

  function initGame(){
    var canvas=document.getElementById('game-canvas');
    var renderer=new THREE.WebGLRenderer({canvas:canvas, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));

    var scene=new THREE.Scene();
    var sky=document.createElement('canvas'); sky.width=4; sky.height=256;
    var sctx=sky.getContext('2d'); var grd=sctx.createLinearGradient(0,0,0,256);
    grd.addColorStop(0,'#a9d8ea'); grd.addColorStop(0.55,'#cfe8e0'); grd.addColorStop(1,'#ffe0c2');
    sctx.fillStyle=grd; sctx.fillRect(0,0,4,256);
    scene.background=new THREE.CanvasTexture(sky);
    scene.fog=new THREE.Fog(0xe9ddc8, 55, 125);

    var camera=new THREE.PerspectiveCamera(50,1,0.1,400);
    function sizeR(){ var w=canvas.clientWidth||window.innerWidth, h=canvas.clientHeight||window.innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }

    scene.add(new THREE.HemisphereLight(0xffffff,0x88aa77,0.95));
    var dir=new THREE.DirectionalLight(0xfff0d4,1.0); dir.position.set(26,42,16); scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff,0.22));

    function box(w,h,d,color){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshLambertMaterial({color:color})); }

    var m=new THREE.Matrix4(), q=new THREE.Quaternion(), v=new THREE.Vector3(), s=new THREE.Vector3(1,1,1);

    // ---- ground: alternating blocky grass tiles ----
    var GN=Math.ceil(GAME.fieldHalf), TILE=2;
    var tileGeo=new THREE.BoxGeometry(TILE,1,TILE);
    var nTiles=(GN*2)*(GN*2);
    var imL=new THREE.InstancedMesh(tileGeo,new THREE.MeshLambertMaterial({color:0x84c95a}),nTiles);
    var imD=new THREE.InstancedMesh(tileGeo,new THREE.MeshLambertMaterial({color:0x73b94a}),nTiles);
    var ci=0,di=0;
    for(var gx=-GN;gx<GN;gx++){ for(var gz=-GN;gz<GN;gz++){
      v.set(gx*TILE+TILE/2,-0.5,gz*TILE+TILE/2); m.compose(v,q,s);
      if((gx+gz)&1){ imL.setMatrixAt(ci++,m); } else { imD.setMatrixAt(di++,m); }
    }}
    imL.count=ci; imD.count=di; imL.instanceMatrix.needsUpdate=true; imD.instanceMatrix.needsUpdate=true;
    scene.add(imL,imD);

    // ---- grass tufts (denser) ----
    var NT=520, tufts=new THREE.InstancedMesh(new THREE.BoxGeometry(0.22,0.9,0.22), new THREE.MeshLambertMaterial({color:0x5fa83f}), NT);
    for(var t=0;t<NT;t++){
      var ex=GAME.fieldHalf-2;
      v.set((Math.random()*2-1)*ex,0.45,(Math.random()*2-1)*ex);
      q.setFromEuler(new THREE.Euler(0,Math.random()*Math.PI,0));
      var sc2=0.7+Math.random()*0.9; s.set(sc2,sc2,sc2); m.compose(v,q,s); tufts.setMatrixAt(t,m);
    }
    q.identity(); s.set(1,1,1); tufts.instanceMatrix.needsUpdate=true; scene.add(tufts);

    // ---- peonies (denser): stem + two pink layers + golden center ----
    var NF=150, ex2=GAME.fieldHalf-3, fpos=[];
    for(var fi=0;fi<NF;fi++){ fpos.push({x:(Math.random()*2-1)*ex2, z:(Math.random()*2-1)*ex2, sc:0.8+Math.random()*0.6}); }
    function instAt(geo,mat,n,yBase){
      var im=new THREE.InstancedMesh(geo,mat,n);
      for(var k=0;k<n;k++){ var f=fpos[k]; v.set(f.x,yBase*f.sc,f.z); s.set(f.sc,f.sc,f.sc); m.compose(v,q,s); im.setMatrixAt(k,m); }
      s.set(1,1,1); im.instanceMatrix.needsUpdate=true; scene.add(im); return im;
    }
    instAt(new THREE.BoxGeometry(0.18,1.4,0.18), new THREE.MeshLambertMaterial({color:0x3f8c3c}), NF, 0.7);
    instAt(new THREE.BoxGeometry(1.0,0.45,1.0), new THREE.MeshLambertMaterial({color:0xef7398}), NF, 1.55);
    instAt(new THREE.BoxGeometry(0.7,0.4,0.7),  new THREE.MeshLambertMaterial({color:0xffa8c4}), NF, 1.9);
    instAt(new THREE.BoxGeometry(0.3,0.3,0.3),  new THREE.MeshLambertMaterial({color:0xffd76a}), NF, 2.15);

    // ---- trees (more, scattered) ----
    function tree(x,z){ var g=new THREE.Group();
      var tr=box(1.1,3.2,1.1,0x8a5a32); tr.position.y=1.6; g.add(tr);
      var c1=box(3.2,2.4,3.2,0x57a24a); c1.position.y=4.0; g.add(c1);
      var c2=box(2.2,1.8,2.2,0x65b257); c2.position.y=5.4; g.add(c2);
      g.position.set(x,0,z); scene.add(g);
    }
    var placed=0,tries=0;
    while(placed<13 && tries<300){ tries++;
      var tx=(Math.random()*2-1)*(GAME.fieldHalf-3), tz=(Math.random()*2-1)*(GAME.fieldHalf-3);
      if(Math.abs(tx)<6 && tz>0) continue;                 // keep spawn lane clear
      if(Math.hypot(tx-GAME.giftPos.x,tz-GAME.giftPos.z)<7) continue;  // not on the gift
      tree(tx,tz); placed++;
    }

    // ---- pond + little fence ----
    var pond=new THREE.Mesh(new THREE.CircleGeometry(6,28), new THREE.MeshLambertMaterial({color:0x5fc6e8, transparent:true, opacity:0.85}));
    pond.rotation.x=-Math.PI/2; pond.position.set(20,0.06,18); scene.add(pond);
    var fenceMat=new THREE.MeshLambertMaterial({color:0xceaa78});
    for(var fp=0; fp<9; fp++){
      var post=new THREE.Mesh(new THREE.BoxGeometry(0.35,1.7,0.35), fenceMat); post.position.set(-22+fp*2.4,0.85,10); scene.add(post);
      if(fp<8){ var rail=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.25,0.18), fenceMat); rail.position.set(-22+fp*2.4+1.2,1.25,10); scene.add(rail); }
    }

    // ---- clouds ----
    var clouds=[];
    function cloud(x,z){ var g=new THREE.Group(); var cm=new THREE.MeshLambertMaterial({color:0xffffff});
      [[0,0,0,3,1.4,2],[2,-.2,.3,2,1.1,1.6],[-2,-.2,-.2,2,1.1,1.6],[.6,.5,0,1.8,1,1.4]].forEach(function(b){
        var c=new THREE.Mesh(new THREE.BoxGeometry(b[3],b[4],b[5]),cm); c.position.set(b[0],b[1],b[2]); g.add(c);
      });
      g.position.set(x,24+Math.random()*6,z); g.scale.setScalar(1.5+Math.random()*1.2); scene.add(g); clouds.push(g);
    }
    cloud(-28,-14); cloud(14,-30); cloud(32,6); cloud(-20,22); cloud(4,32); cloud(-36,-4); cloud(24,-10); cloud(-8,30);

    // ---- the glowing gift (bigger + always luminous) + beam + ground halo ----
    var gift=new THREE.Group();
    var giftBox=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6), new THREE.MeshLambertMaterial({color:0xff8fb0, emissive:0xff4d80, emissiveIntensity:0.75}));
    giftBox.position.y=0.8; gift.add(giftBox);
    var ribMat=new THREE.MeshLambertMaterial({color:0xfff0a0, emissive:0xffcf55, emissiveIntensity:0.6});
    var r1=new THREE.Mesh(new THREE.BoxGeometry(0.32,1.7,1.7),ribMat); r1.position.y=0.8; gift.add(r1);
    var r2=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.7,0.32),ribMat); r2.position.y=0.8; gift.add(r2);
    var bow=new THREE.Mesh(new THREE.BoxGeometry(0.75,0.5,0.75),ribMat); bow.position.y=1.85; gift.add(bow);
    var beacon=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.0,34,14,1,true), new THREE.MeshBasicMaterial({color:0xfff0b0, transparent:true, opacity:0.3, side:THREE.DoubleSide, depthWrite:false}));
    beacon.position.y=17; gift.add(beacon);
    var glow=new THREE.PointLight(0xffd58a,2.2,28); glow.position.y=2; gift.add(glow);
    // a ring of sparkle-dots that orbit the gift (always on)
    var orbitGroup=new THREE.Group(); gift.add(orbitGroup);
    var dots=[];
    for(var o=0;o<7;o++){
      var dot=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.2), new THREE.MeshBasicMaterial({color:(o%2)?0xffffff:0xfff0a0}));
      var ang=o/7*Math.PI*2; dot.position.set(Math.cos(ang)*2.6, 1.5, Math.sin(ang)*2.6);
      dot.userData={ph:ang}; orbitGroup.add(dot); dots.push(dot);
    }
    gift.scale.setScalar(GAME.giftScale);
    gift.position.set(GAME.giftPos.x,0,GAME.giftPos.z); scene.add(gift);

    var halo=new THREE.Mesh(new THREE.CircleGeometry(5,30), new THREE.MeshBasicMaterial({color:0xffe39a, transparent:true, opacity:0.4, side:THREE.DoubleSide, depthWrite:false}));
    halo.rotation.x=-Math.PI/2; halo.position.set(GAME.giftPos.x,0.05,GAME.giftPos.z); scene.add(halo);

    // ---- Tommy (blocky capybara, built facing +Z) ----
    var tommy=new THREE.Group();
    var rig=new THREE.Group(); tommy.add(rig);
    var brown=0xb07a4f, dark=0x8a5b3c;
    var body=box(3.2,1.9,4.6,brown); body.position.y=2.2; rig.add(body);
    var head=box(2.3,2.0,2.0,brown); head.position.set(0,2.95,2.5); rig.add(head);
    var snout=box(1.35,1.0,0.8,0x9a6845); snout.position.set(0,2.6,3.55); rig.add(snout);
    var earL=box(0.6,0.6,0.45,dark); earL.position.set(-0.75,3.95,2.3); rig.add(earL);
    var earR=box(0.6,0.6,0.45,dark); earR.position.set(0.75,3.95,2.3); rig.add(earR);
    var eyeL=box(0.28,0.28,0.2,0x241813); eyeL.position.set(-0.6,3.1,3.45); rig.add(eyeL);
    var eyeR=box(0.28,0.28,0.2,0x241813); eyeR.position.set(0.6,3.1,3.45); rig.add(eyeR);
    var legs=[];
    [[-1.05,1.6],[1.05,1.6],[-1.05,-1.6],[1.05,-1.6]].forEach(function(L){
      var lg=new THREE.BoxGeometry(0.8,1.6,0.8); lg.translate(0,-0.8,0);
      var leg=new THREE.Mesh(lg,new THREE.MeshLambertMaterial({color:dark}));
      leg.position.set(L[0],1.5,L[1]); tommy.add(leg); legs.push(leg);
    });
    var shadow=new THREE.Mesh(new THREE.CircleGeometry(2.4,20), new THREE.MeshBasicMaterial({color:0x224400, transparent:true, opacity:0.22}));
    shadow.rotation.x=-Math.PI/2; shadow.position.y=0.03; tommy.add(shadow);
    tommy.scale.setScalar(GAME.tommyScale);
    tommy.position.set(0,0,12); tommy.rotation.y=Math.PI; scene.add(tommy);

    // ---- controls ----
    var keys={};
    window.addEventListener('keydown',function(e){ keys[e.key.toLowerCase()]=true; if(['arrowup','arrowdown','arrowleft','arrowright'].indexOf(e.key.toLowerCase())>=0 && visible) e.preventDefault(); },{passive:false});
    window.addEventListener('keyup',function(e){ keys[e.key.toLowerCase()]=false; });

    var joy=document.getElementById('joystick'), knob=document.getElementById('knob');
    var joyActive=false, joyX=0, joyY=0, jr=52;
    function joyStart(e){ joyActive=true; joy.setPointerCapture&&joy.setPointerCapture(e.pointerId); joyMove(e); }
    function joyMove(e){ if(!joyActive) return; var r=joy.getBoundingClientRect(); var dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
      var dd=Math.hypot(dx,dy); if(dd>jr){ dx=dx/dd*jr; dy=dy/dd*jr; } knob.style.transform='translate('+dx+'px,'+dy+'px)'; joyX=dx/jr; joyY=dy/jr; }
    function joyEnd(){ joyActive=false; joyX=0; joyY=0; knob.style.transform='translate(0,0)'; }
    joy.addEventListener('pointerdown',joyStart);
    joy.addEventListener('pointermove',joyMove);
    joy.addEventListener('pointerup',joyEnd);
    joy.addEventListener('pointercancel',joyEnd);

    var hint=document.getElementById('gameHint');
    setTimeout(function(){ hint.classList.add('fade'); }, 7000);

    // ---- discovery (re-triggers each time she walks up to the gift) ----
    var banner=document.getElementById('gameBanner');
    var armed=true, haloT=0, sparkles=[];
    function spawnSparkle(){
      var sp=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.34,0.34), new THREE.MeshBasicMaterial({color:Math.random()>0.5?0xfff2a0:0xffffff}));
      sp.position.set(gift.position.x,2.4,gift.position.z);
      sp.userData={vx:(Math.random()*2-1)*6, vy:5+Math.random()*5, vz:(Math.random()*2-1)*6, life:1.4};
      scene.add(sp); sparkles.push(sp);
    }
    function trigger(){
      hint.classList.add('fade');
      banner.classList.add('show');
      for(var i=0;i<28;i++) spawnSparkle();
      setTimeout(openCard, 1200);
    }

    // ---- loop ----
    function lerpAngle(a,b,t){ var d=((b-a+Math.PI)%(Math.PI*2))-Math.PI; return a+d*t; }
    var clock=performance.now(), walk=0;
    function loop(now){
      var dt=Math.min((now-clock)/1000, 0.05); clock=now;
      requestAnimationFrame(loop);
      if(!visible){ return; }

      var mx=0, mz=0;
      if(joyActive && (Math.abs(joyX)>0.08 || Math.abs(joyY)>0.08)){ mx=joyX; mz=joyY; }
      else {
        if(keys['arrowup']||keys['w']) mz-=1;
        if(keys['arrowdown']||keys['s']) mz+=1;
        if(keys['arrowleft']||keys['a']) mx-=1;
        if(keys['arrowright']||keys['d']) mx+=1;
      }
      var len=Math.hypot(mx,mz); if(len>1){ mx/=len; mz/=len; }
      var moving=(mx*mx+mz*mz)>0.01;

      if(moving){
        tommy.position.x+=mx*GAME.walkSpeed*dt;
        tommy.position.z+=mz*GAME.walkSpeed*dt;
        var b=GAME.fieldHalf-1.5;
        tommy.position.x=Math.max(-b,Math.min(b,tommy.position.x));
        tommy.position.z=Math.max(-b,Math.min(b,tommy.position.z));
        tommy.rotation.y=lerpAngle(tommy.rotation.y, Math.atan2(mx,mz), 0.2);
        walk+=dt*11;
        legs[0].rotation.x=Math.sin(walk)*0.5; legs[3].rotation.x=Math.sin(walk)*0.5;
        legs[1].rotation.x=-Math.sin(walk)*0.5; legs[2].rotation.x=-Math.sin(walk)*0.5;
        rig.position.y=Math.abs(Math.sin(walk))*0.12;
      } else {
        legs.forEach(function(l){ l.rotation.x*=0.8; });
        rig.position.y += (0 - rig.position.y)*0.1;
      }

      var tx=tommy.position.x, tz=tommy.position.z;
      camera.position.x += (tx - camera.position.x)*0.09;
      camera.position.z += (tz+17 - camera.position.z)*0.09;
      camera.position.y += (13 - camera.position.y)*0.09;
      camera.lookAt(tx, 1.8, tz);

      // gift glow: bob, spin, orbiting dots, pulsing halo (always on)
      gift.position.y=Math.sin(now*0.0026)*0.25;
      gift.rotation.y+=dt*0.6;
      orbitGroup.rotation.y+=dt*1.6;
      for(var dd2=0; dd2<dots.length; dd2++){ dots[dd2].position.y=1.5+Math.sin(now*0.004+dots[dd2].userData.ph)*0.4; }
      haloT+=dt; var hp=Math.sin(haloT*2.4)*0.5+0.5;
      halo.material.opacity=0.25+hp*0.35; halo.scale.setScalar(1+hp*0.18);

      // trigger / re-arm
      var gdx=tx-gift.position.x, gdz=tz-gift.position.z, gd2=gdx*gdx+gdz*gdz;
      if(armed && gd2 < GAME.findRadius*GAME.findRadius){ armed=false; trigger(); }
      else if(gd2 > (GAME.findRadius*1.9)*(GAME.findRadius*1.9)){ armed=true; }

      // sparkles
      for(var si=sparkles.length-1; si>=0; si--){ var sp=sparkles[si], u=sp.userData;
        u.vy-=9*dt; sp.position.x+=u.vx*dt; sp.position.y+=u.vy*dt; sp.position.z+=u.vz*dt;
        u.life-=dt*0.5; sp.scale.setScalar(Math.max(0.01,u.life)); sp.rotation.y+=dt*6;
        if(u.life<=0){ scene.remove(sp); sparkles.splice(si,1); }
      }

      for(var c=0;c<clouds.length;c++){ var cl=clouds[c]; cl.position.x+=dt*0.6; if(cl.position.x>46) cl.position.x=-46; }

      renderer.render(scene,camera);
    }

    sizeR();
    window.addEventListener('resize',sizeR);
    requestAnimationFrame(loop);
  }
})();