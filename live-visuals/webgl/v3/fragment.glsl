precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform int u_visualizationType;
uniform float u_audioData[64];
uniform float u_audioLevel;
uniform float u_audioSensitivity;
uniform vec3 u_color1;
uniform vec3 u_color2;
float random(vec2 st) {
return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
float ripple(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos)*2.0;
    float angle = atan(pos.y,pos.x);
    float rippleEffect = 0.0;
    for(int i=0; i<32; i++){
        float freq = float(i)*0.00002;
        float wave = sin(r*10.0 - time*4.0 + freq);
        rippleEffect += u_audioData[i]*wave*u_audioSensitivity;
    }
    float beams = 0.0;
    for(int i=0; i<12; i++){
        float rot = angle + time*0.5 + float(i)*3.14159/3.0;
        beams += pow(abs(sin(rot*3.0)),5.0)*0.3;
    }
    return (rippleEffect + beams) * u_audioSensitivity;
}
float kaleidoscope(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos), angle = atan(pos.y,pos.x);
    float segments = 8.0;
    angle = mod(angle + time*0.2, 2.0*3.14159/segments);
    angle = abs(angle - 3.14159/segments);
    vec2 kpos = vec2(cos(angle), sin(angle)) * r;
    float pattern = 0.0;
    for(int i=0; i<32; i++){
        float freq = float(i) * 0.3;
        pattern += u_audioData[i] * sin(kpos.x * 20.0 + time + freq)
                                    * cos(kpos.y * 20.0 - time + freq)
                                    * u_audioSensitivity;
    }
    return pattern * (10.0 - r) * u_audioSensitivity;
}
float Vortex(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos)*2.0;
    float angle = atan(pos.y,pos.x);
    float spiralPower = 0.0;
    for(int i=0; i<32; i++){
        spiralPower += u_audioData[i] * 1.2 * sin(r*15.0 - time*3.0 + float(i));
    }
    angle += spiralPower * u_audioSensitivity * 2.0 + r*5.0;
    float segments = 6.0;
    angle = mod(angle, 2.0*3.14159/segments);
    angle = abs(angle - 3.14159/segments);
    return sin(angle*10.0 + time*2.0) * pow(r,2.0) * u_audioSensitivity;
}
float Petal(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos) * 2.0;
    float angle = atan(pos.y, pos.x);
    float bass = 0.0, mid = 0.0, treble = 0.0;
    for (int i = 0; i < 10; i++) {
        bass += u_audioData[i];
    }
    for (int i = 10; i < 24; i++) {
        mid += u_audioData[i];
    }
    for (int i = 24; i < 32; i++) {
        treble += u_audioData[i];
    }
    bass *= u_audioSensitivity * 0.5;
    mid *= u_audioSensitivity * 0.5;
    treble *= u_audioSensitivity * 0.5;
    float rings = sin(r * (12.0 + bass * 20.0) - time * 4.0);
    float petals = cos(angle * (6.0 + mid * 10.0) + sin(time)) * 0.5 + 0.5;
    float dynamicFlash = treble * sin(time * 10.0 + r * 5.0);
    float pattern = rings * petals + dynamicFlash;
    return pattern * pow(1.0 - r * 0.5, 2.0);
}
float Flow(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float distortion = 0.0;
    for (int i = 0; i < 32; i++) {
        float freqEffect = u_audioData[i] * u_audioSensitivity;
        distortion += freqEffect * sin(r * 15.0 - time * 2.0 + float(i));
    }
    angle += distortion * 0.2;
    float segments = 6.0;
    angle = mod(angle, 2.0 * 3.14159 / segments);
    angle = abs(angle - 3.14159 / segments);
    return sin(angle * 10.0 + time * 2.0) * pow(r, 1.0) * u_audioSensitivity;
}
float Bloom(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float pulse = 0.0;
    for (int i = 0; i < 32; i++) {
        pulse += u_audioData[i] * sin(r * 10.0 - time * 2.0 + float(i)) * u_audioSensitivity;
    }
    float wave = sin(r * (15.0 + pulse * 20.0) - time * 3.0);
    float expulsion = cos(angle * 10.0 + time * 5.0);
    return wave * expulsion * u_audioSensitivity;
}
float Spawn(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float auroraEffect = 0.0;
    for (int i = 0; i < 32; i++) {
        auroraEffect += u_audioData[i] * sin(r * 10.0 - time * 5.0 + float(i)) * u_audioSensitivity;
    }
    float lightWave = sin(time + r * (15.0 + auroraEffect * 10.0));
    float movement = cos(angle * 2.0 + time * 0.5) * 0.5 + 0.5;
    return lightWave * movement * u_audioSensitivity;
}
float Zap(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float warpEffect = 0.0;
    for (int i = 0; i < 32; i++) {
        warpEffect += u_audioData[i] * 0.4 * sin(r * 30.0 - time * 2.0 + float(i)) * u_audioSensitivity;
    }
    float spaceWarp = r * sin(angle * 8.0 + warpEffect * 4.0) - time * 1.5;
    return spaceWarp * u_audioSensitivity;
}
float Trance(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float disintegration = 0.0;
    for (int i = 0; i < 32; i++) {
        disintegration += u_audioData[i] * 0.5 * sin(r * 5.0 - time * 3.0 + float(i)) * u_audioSensitivity;
    }
    float fadeEffect = fract(r * 20.0 + disintegration * 15.0 - time * 1.5);
    return fadeEffect * u_audioSensitivity;
}
void main(){
    vec2 st = gl_FragCoord.xy / u_resolution;
    float t = u_time * 0.5;
    float vis;
    if(u_visualizationType == 0) {
        vis = ripple(st, t);
    } else if(u_visualizationType == 1) {
        vis = kaleidoscope(st, t);
    } else if(u_visualizationType == 2) {
        vis = Vortex(st, t);
    } else if(u_visualizationType == 3) {
        vis = Petal(st, t);
    } else if(u_visualizationType == 4) {
        vis = Flow(st, t);
    } else if(u_visualizationType == 5) {
        vis = Bloom(st, t);
    } else if(u_visualizationType == 6) {
        vis = Spawn(st, t);
    } else if(u_visualizationType == 7) {
        vis = Zap(st, t);
    } else if(u_visualizationType == 8) {
        vis = Trance(st, t);
    }
    float f = 0.5 + 0.5 * sin(vis + t * 0.1);
    vec3 color = mix(u_color1, u_color2, f);
    float boost = u_audioLevel * u_audioSensitivity;
    color = mix(color, vec3(1.0), boost * vis * 0.5);
    gl_FragColor = vec4(color, 1.0);
}