(function () {
  var canvas = document.getElementById('dither-bg');
  if (!canvas) { console.error('dither: canvas not found'); return; }
  var gl = canvas.getContext('webgl');
  if (!gl) { console.error('dither: webgl not supported'); return; }

  var mouse = { x: 0, y: 0 };
  var mouseActive = false;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX * dpr;
    mouse.y = e.clientY * dpr;
    mouseActive = true;
  });
  window.addEventListener('mouseleave', function() { mouseActive = false; });

  var vs = 'attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.0,1.0);}';

  // WebGL 1.0 compatible — no array declarations, bayer via if/else chain
  var fs = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform vec2 u_mouse;',
    'uniform int u_mouse_on;',
    'uniform float u_mouseRadius;',
    'uniform float u_speed;',
    'uniform float u_freq;',
    'uniform float u_amp;',
    'uniform vec3 u_color;',
    'uniform float u_colorNum;',
    'uniform float u_pixelSize;',

    'vec4 mod289v(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 perm(vec4 x){return mod289v(((x*34.0)+1.0)*x);}',
    'vec4 taylorInv(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'vec2 fade2(vec2 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}',

    'float cnoise(vec2 P){',
    '  vec4 Pi=floor(P.xyxy)+vec4(0.0,0.0,1.0,1.0);',
    '  vec4 Pf=fract(P.xyxy)-vec4(0.0,0.0,1.0,1.0);',
    '  Pi=mod289v(Pi);',
    '  vec4 ix=Pi.xzxz,iy=Pi.yyww,fx=Pf.xzxz,fy=Pf.yyww;',
    '  vec4 i=perm(perm(ix)+iy);',
    '  vec4 gx=fract(i*(1.0/41.0))*2.0-1.0;',
    '  vec4 gy=abs(gx)-0.5;',
    '  vec4 tx=floor(gx+0.5);gx=gx-tx;',
    '  vec2 g00=vec2(gx.x,gy.x),g10=vec2(gx.y,gy.y),g01=vec2(gx.z,gy.z),g11=vec2(gx.w,gy.w);',
    '  vec4 norm=taylorInv(vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11)));',
    '  g00*=norm.x;g01*=norm.y;g10*=norm.z;g11*=norm.w;',
    '  float n00=dot(g00,vec2(fx.x,fy.x)),n10=dot(g10,vec2(fx.y,fy.y));',
    '  float n01=dot(g01,vec2(fx.z,fy.z)),n11=dot(g11,vec2(fx.w,fy.w));',
    '  vec2 fxy=fade2(Pf.xy);',
    '  vec2 nx=mix(vec2(n00,n01),vec2(n10,n11),fxy.x);',
    '  return 2.3*mix(nx.x,nx.y,fxy.y);',
    '}',

    'float fbm(vec2 p){',
    '  float v=0.0;float a=1.0;float f=u_freq;',
    '  for(int i=0;i<4;i++){v+=a*abs(cnoise(p));p*=f;a*=u_amp;}',
    '  return v;',
    '}',

    'float pattern(vec2 p){',
    '  vec2 p2=p-u_time*u_speed;',
    '  return fbm(p+fbm(p2));',
    '}',

    // Bayer 8x8 lookup via mod — WebGL 1.0 safe, no array needed
    'float bayer8(int x, int y){',
    '  int idx = y*8+x;',
    '  if(idx==0)  return 0.0/64.0;  if(idx==1)  return 48.0/64.0;',
    '  if(idx==2)  return 12.0/64.0; if(idx==3)  return 60.0/64.0;',
    '  if(idx==4)  return 3.0/64.0;  if(idx==5)  return 51.0/64.0;',
    '  if(idx==6)  return 15.0/64.0; if(idx==7)  return 63.0/64.0;',
    '  if(idx==8)  return 32.0/64.0; if(idx==9)  return 16.0/64.0;',
    '  if(idx==10) return 44.0/64.0; if(idx==11) return 28.0/64.0;',
    '  if(idx==12) return 35.0/64.0; if(idx==13) return 19.0/64.0;',
    '  if(idx==14) return 47.0/64.0; if(idx==15) return 31.0/64.0;',
    '  if(idx==16) return 8.0/64.0;  if(idx==17) return 56.0/64.0;',
    '  if(idx==18) return 4.0/64.0;  if(idx==19) return 52.0/64.0;',
    '  if(idx==20) return 11.0/64.0; if(idx==21) return 59.0/64.0;',
    '  if(idx==22) return 7.0/64.0;  if(idx==23) return 55.0/64.0;',
    '  if(idx==24) return 40.0/64.0; if(idx==25) return 24.0/64.0;',
    '  if(idx==26) return 36.0/64.0; if(idx==27) return 20.0/64.0;',
    '  if(idx==28) return 43.0/64.0; if(idx==29) return 27.0/64.0;',
    '  if(idx==30) return 39.0/64.0; if(idx==31) return 23.0/64.0;',
    '  if(idx==32) return 2.0/64.0;  if(idx==33) return 50.0/64.0;',
    '  if(idx==34) return 14.0/64.0; if(idx==35) return 62.0/64.0;',
    '  if(idx==36) return 1.0/64.0;  if(idx==37) return 49.0/64.0;',
    '  if(idx==38) return 13.0/64.0; if(idx==39) return 61.0/64.0;',
    '  if(idx==40) return 34.0/64.0; if(idx==41) return 18.0/64.0;',
    '  if(idx==42) return 46.0/64.0; if(idx==43) return 30.0/64.0;',
    '  if(idx==44) return 33.0/64.0; if(idx==45) return 17.0/64.0;',
    '  if(idx==46) return 45.0/64.0; if(idx==47) return 29.0/64.0;',
    '  if(idx==48) return 10.0/64.0; if(idx==49) return 58.0/64.0;',
    '  if(idx==50) return 6.0/64.0;  if(idx==51) return 54.0/64.0;',
    '  if(idx==52) return 9.0/64.0;  if(idx==53) return 57.0/64.0;',
    '  if(idx==54) return 5.0/64.0;  if(idx==55) return 53.0/64.0;',
    '  if(idx==56) return 42.0/64.0; if(idx==57) return 26.0/64.0;',
    '  if(idx==58) return 38.0/64.0; if(idx==59) return 22.0/64.0;',
    '  if(idx==60) return 41.0/64.0; if(idx==61) return 25.0/64.0;',
    '  if(idx==62) return 37.0/64.0; if(idx==63) return 21.0/64.0;',
    '  return 0.0;',
    '}',

    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/u_res;',
    '  uv-=0.5;',
    '  uv.x*=u_res.x/u_res.y;',
    '  float f=pattern(uv);',
    '  if(u_mouse_on==1){',
    '    vec2 mn=(u_mouse/u_res-0.5)*vec2(1.0,-1.0);',
    '    mn.x*=u_res.x/u_res.y;',
    '    float d=length(uv-mn);',
    '    float eff=1.0-smoothstep(0.0,u_mouseRadius,d);',
    '    f-=0.5*eff;',
    '  }',
    '  vec3 col=mix(vec3(0.0),u_color,f);',
    '  vec2 sc=floor(gl_FragCoord.xy/u_pixelSize);',
    '  int bx=int(mod(sc.x,8.0));',
    '  int by=int(mod(sc.y,8.0));',
    '  float thresh=bayer8(bx,by)-0.25;',
    '  float step2=1.0/(u_colorNum-1.0);',
    '  col+=thresh*step2;',
    '  col=clamp(col-0.2,0.0,1.0);',
    '  col=floor(col*(u_colorNum-1.0)+0.5)/(u_colorNum-1.0);',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  function mkShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vShader = mkShader(gl.VERTEX_SHADER, vs);
  var fShader = mkShader(gl.FRAGMENT_SHADER, fs);
  if (!vShader || !fShader) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vShader);
  gl.attachShader(prog, fShader);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var u = {};
  ['u_res','u_time','u_mouse','u_mouse_on','u_mouseRadius',
   'u_speed','u_freq','u_amp','u_color','u_colorNum','u_pixelSize'
  ].forEach(function(n){ u[n] = gl.getUniformLocation(prog, n); });

  function draw(t) {
    gl.uniform2f(u.u_res, canvas.width, canvas.height);
    gl.uniform1f(u.u_time, t * 0.001);
    gl.uniform2f(u.u_mouse, mouse.x, mouse.y);
    gl.uniform1i(u.u_mouse_on, mouseActive ? 1 : 0);
    gl.uniform1f(u.u_mouseRadius, 0.3);
    gl.uniform1f(u.u_speed, 0.05);
    gl.uniform1f(u.u_freq, 3.0);
    gl.uniform1f(u.u_amp, 0.3);
    gl.uniform3f(u.u_color, 0.20, 0.31, 0.12);
    gl.uniform1f(u.u_colorNum, 4.0);
    gl.uniform1f(u.u_pixelSize, 2.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  console.log('dither: running!');
})();