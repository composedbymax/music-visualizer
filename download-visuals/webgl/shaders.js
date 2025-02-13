const vsSource = `
  attribute vec2 aPosition;
  void main(){
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;
const fsSourceWaves = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main(void) {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float wave = sin(10.0 * radius - uTime * 2.0 + uAudioLevel * 5.0) + sin(5.0 * angle + uTime);
    vec3 col = mix(uUserColor1, uUserColor2, 0.5 + 0.5 * sin(uTime + wave));
    gl_FragColor = vec4(col * (1.0 + radius * 0.5), 1.0);
}`;
const fsSourceElectricField = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;

void main(void) {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float field = cos(angle * 5.0 + uTime) * sin(radius * 10.0 - uTime);
    vec3 col = mix(uUserColor1, uUserColor2, 0.5 + 0.5 * field);
    gl_FragColor = vec4(col, 1.0);
}`;
const fsSourceQCD = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
vec3 quarkColors(int flavor) {
    if(flavor == 0) return uUserColor1;
    if(flavor == 1) return uUserColor2;
    return vec3(1.0);
}
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
    float field = sin(10.0*length(uv) - uTime*5.0) * 
                 cos(5.0*atan(uv.y, uv.x) + uTime*3.0);
    vec3 color = vec3(0.0);
    for(int i=0; i<3; i++) {
        vec2 pos = 0.2*vec2(
            sin(uTime + float(i)*2.094),
            cos(uTime + float(i)*2.094)
        );
        color += quarkColors(i) * 
                exp(-length(uv - pos)*10.0) * 
                (1.0 + field);
    }
    gl_FragColor = vec4(color * (1.0 + uAudioLevel), 1.0);
}`;
const fsSourceTunnel = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main(void) {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float stripes = sin(10.0 * radius - uTime * 5.0 + uAudioLevel * 10.0);
    vec3 col = mix(uUserColor1, uUserColor2, 0.5 + 0.5 * cos(uTime + stripes + angle * 2.0));
    gl_FragColor = vec4(col * (1.0 - radius), 1.0);
}`;
const fsSourceRadial = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    float radius = length(uv) * 3.0;
    float angle = atan(uv.y, uv.x);
    float wave = sin(radius * 10.0 - uTime * 5.0) * 
                cos(angle * 5.0 + uTime) * 
                (1.0 + uAudioLevel * 3.0);
    vec3 color = mix(uUserColor1, uUserColor2, smoothstep(0.4, 0.5, abs(wave)));
    color *= 1.0 - radius * 0.3;
    gl_FragColor = vec4(color, 1.0);
}`;
const fsSourceGravWaves = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
vec3 blackHole(vec2 uv, float mass) {
    float rs = mass * 0.5; // Schwarzschild radius
    float r = length(uv);
    if(r < rs) return vec3(0.0);
    float deflection = rs / (2.0*r);
    vec2 distorted = uv * (1.0 + deflection);
    float disk = smoothstep(0.3, 0.5, 
        abs(fract(atan(distorted.y, distorted.x)*5.0 + uTime) - 0.5));
    vec3 color = mix(uUserColor1, uUserColor2, 
        smoothstep(0.0, 1.0, dot(normalize(uv), vec2(0.0,1.0)))) * 
        disk * exp(-abs(r - rs*2.0));   
    return color;
}
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
    vec3 color = blackHole(uv, 0.2 + uAudioLevel*0.3);
    float wave = smoothstep(0.99, 1.0, 
        sin(length(uv)*50.0 - uTime*10.0)) * 
        exp(-length(uv)*2.0); 
    gl_FragColor = vec4(color + wave*uUserColor2*5.0, 1.0);
}`;
const fsSourcePhotonic = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
vec2 complex_exp(vec2 z) {
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y * 5.0;
    vec2 z = complex_exp(vec2(uv.y, uv.x + uTime));
    float bands = smoothstep(0.3, 0.5, 
        fract(atan(z.y,z.x)*2.0 + length(z)*0.5));
    vec3 color = mix(
        uUserColor1 * sin(length(z)*10.0 - uTime),
        uUserColor2 * cos(atan(z.y,z.x)*5.0),
        bands
    );
    vec2 grid = fract(uv * 2.0);
    float dots = smoothstep(0.1, 0.09, length(grid - 0.5)) * 
                (0.5 + 0.5*sin(uTime*5.0 + dot(grid,vec2(100.0))));
    gl_FragColor = vec4(color * (1.0 + dots*5.0*uAudioLevel), 1.0);
}`;
const fsSourceGrid = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
    uv *= 2.0 + uAudioLevel * 3.0;
    vec2 grid = fract(uv * 2.0);
    grid = abs(grid - 0.5);
    float line = min(grid.x, grid.y);
    float mask = smoothstep(0.1, 0.05, line);
    vec3 color = mix(uUserColor1, uUserColor2, mask);
    color *= sin(uTime + uv.x * 2.0) * 0.5 + 0.5;
    color += pow(1.0 - line, 20.0) * uUserColor2 * (0.5 + uAudioLevel);
    gl_FragColor = vec4(color, 1.0);
}`;
const fsSourcePixelate = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main() {
    float pixelSize = 10.0 + (1.0 - uAudioLevel) * 50.0;
    vec2 uv = floor(gl_FragCoord.xy / pixelSize) * pixelSize;
    uv /= uResolution.xy;
    uv.x *= uResolution.x/uResolution.y;
    float wave = sin(uv.x * 10.0 + uTime) * cos(uv.y * 8.0 - uTime);
    vec3 color = mix(uUserColor1, uUserColor2, 
        0.5 + 0.5 * wave) * 
        (1.0 - length(uv - 0.5));
    color *= 0.8 + 0.5 * sin(uTime * 2.0) + uAudioLevel;
    gl_FragColor = vec4(color, 1.0);
}`;
const fsSourceQuantum = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
#define PI 3.14159265359
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), 
                   hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), 
                   hash(i + vec2(1.0,1.0)), u.x), u.y);
}
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
    float energy = 0.0;
    for(float i = 0.0; i < 5.0; i++) {
        float t = uTime * (0.5 + 0.5*sin(i*PI/5.0)) + i*10.0;
        vec2 dir = vec2(cos(t), sin(t));
        energy += smoothstep(0.95, 1.0, 
            sin(30.0*(uv.x*dir.x + uv.y*dir.y) + 5.0*t + uAudioLevel*10.0));
    }
    vec2 gridUv = uv * 10.0;
    vec2 cell = floor(gridUv);
    vec2 subUv = fract(gridUv);
    float particle = pow(hash(cell), 10.0) * 
                    smoothstep(0.5, 0.0, length(subUv - 0.5)) * 
                    (1.0 + sin(uTime + hash(cell)*10.0));
    vec3 baseColor = mix(uUserColor1, uUserColor2, 
                        smoothstep(-0.5, 0.5, uv.y + 0.3*sin(uTime)));
    vec3 finalColor = baseColor * (energy * 0.8 + particle * 2.0) * 
                     (0.8 + 0.5*uAudioLevel);
    gl_FragColor = vec4(finalColor, 1.0);
}`;
const fsSourceMagnetic = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
vec2 field(vec2 uv) {
    float t = uTime * 0.5;
    return vec2(
        sin(uv.x*3.0 + t) + sin(uv.y*2.0 + t*1.3),
        cos(uv.x*2.4 - t) + cos(uv.y*3.1 + t*0.7)
    );
}
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
    vec2 f = field(uv * 2.0);
    float lines = sin(10.0*(uv.x*f.x + uv.y*f.y) + uTime*2.0);
    lines = smoothstep(0.9, 1.0, abs(lines));
    vec2 p = uv;
    for(int i = 0; i < 10; i++) {
        p += field(p) * 0.02 * (1.0 + uAudioLevel);
    }
    float flow = exp(-length(p - uv)*10.0);
    vec3 color = mix(uUserColor1, uUserColor2, 
                    smoothstep(-0.5, 0.5, p.x)) * 
                (lines + flow) * (1.0 + uAudioLevel);
    gl_FragColor = vec4(color, 1.0);
}`;
const fsSourceFluid = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
#define ITERATIONS 8
vec2 complexMul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}
void main() {
    vec2 uv = gl_FragCoord.xy/uResolution.xy;
    uv.x *= uResolution.x/uResolution.y;
    vec2 velocity = vec2(0.0);
    float pressure = 0.0;
    for(int i = 0; i < ITERATIONS; i++) {
        vec2 z = vec2(uv*2.0-1.0) * (1.0 + float(i)*0.3);
        z = complexMul(z, vec2(cos(uTime), sin(uTime)));
        velocity += 0.1*vec2(sin(z.x*3.0 + uTime), cos(z.y*2.0 - uTime));
        pressure += length(velocity)*0.5;
    }
    vec3 color = mix(uUserColor1, uUserColor2, 
        smoothstep(0.3, 0.7, fract(pressure*2.0 + uAudioLevel))) * 
        (1.0 + 2.0*sin(pressure*10.0 + uTime));
    float particles = pow(fract(sin(uv.x*347.1 + uv.y*982.3)*457.2), 50.0) * 
                     (0.5 + 0.5*sin(uTime*10.0));
    gl_FragColor = vec4(color + particles*uUserColor2*5.0, 1.0);
}`;
const fsSourceMoire = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy * 10.0;
    uv.x *= uResolution.x / uResolution.y;
    float pattern1 = sin(uv.x * 10.0 + uTime) * 
                    cos(uv.y * 8.0 + uTime);
    float pattern2 = sin((uv.x + uv.y) * 15.0 + uTime) * 
                    (1.0 + uAudioLevel * 2.0);
    float combined = sin(pattern1 * 5.0 + pattern2 * 3.0);
    vec3 color = mix(uUserColor1, uUserColor2, 0.5 + 0.5 * combined);
    gl_FragColor = vec4(color, 1.0);
}`;
const fsSourceSpectrum = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main(void) {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float barWidth = 0.05;
    float index = floor(uv.x / barWidth);
    float modTime = mod(uTime + index, 1.0);
    float bar = step(0.5, fract(uv.y * 10.0 + modTime + uAudioLevel * 5.0));
    vec3 col = mix(uUserColor1, uUserColor2, bar * (0.5 + 0.5 * sin(uTime)));
    gl_FragColor = vec4(col, 1.0);
}`;
const fsSourceFractal = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioLevel;
uniform vec3 uUserColor1;
uniform vec3 uUserColor2;
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
    vec2 z = uv;
    vec2 c = vec2(sin(uTime*0.5)*0.5, cos(uTime*0.3)*0.5);
    float n = 0.0;
    for(int i=0; i<50; i++) {
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        if(length(z) > 2.0) break;
        n++;
    }
    float t = n/50.0;
    vec3 color = mix(uUserColor1, uUserColor2, t) * (1.0 + uAudioLevel);
    gl_FragColor = vec4(color, 1.0);
}`;