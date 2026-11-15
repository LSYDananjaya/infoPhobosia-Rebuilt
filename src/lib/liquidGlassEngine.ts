/**
 * Singleton offscreen WebGL Liquid Glass engine.
 *
 * Keeps a single WebGL context for the entire application so Three.js scenes
 * in SoftModelStage never hit browser WebGL context limits, while rendering
 * SDF-accurate optical lens refraction, multi-tap dispersion blur, and
 * pointer-reactive Fresnel rim highlights into element-local 2D canvases.
 */

export type LiquidGlassAccent = "neutral" | "mars" | "cyan" | "amber";
export type LiquidGlassMode = "card" | "navbar";

export interface LiquidGlassRenderParams {
  targetCanvas: HTMLCanvasElement;
  width: number;
  height: number;
  radius: number;
  mouseX: number;
  mouseY: number;
  hover: number;
  accent: LiquidGlassAccent;
  mode: LiquidGlassMode;
  glassAlpha: number;
  scrollPhase: number;
  backdropSrc?: string;
}

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec4 iMouse;
  uniform sampler2D iChannel0;

  uniform float uRadius;
  uniform float uHover;
  uniform float uGlassAlpha;
  uniform float uIsNavbar;
  uniform float uScrollPhase;
  uniform vec3 uAccentColor;

  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  vec2 boxNormal(vec2 p, vec2 b, float r) {
    float eps = 1.25;
    float dx = sdRoundedBox(p + vec2(eps, 0.0), b, r) - sdRoundedBox(p - vec2(eps, 0.0), b, r);
    float dy = sdRoundedBox(p + vec2(0.0, eps), b, r) - sdRoundedBox(p - vec2(0.0, eps), b, r);
    vec2 g = vec2(dx, dy);
    float len = length(g);
    return len > 0.0001 ? g / len : vec2(0.0, 1.0);
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    const float NUM_ZERO = 0.0;
    const float NUM_ONE = 1.0;
    const float NUM_TWO = 2.0;
    const float SAMPLE_RANGE = 3.0;
    const float SAMPLE_OFFSET = 0.75;
    const float LIGHTING_INTENSITY = 0.36;

    vec2 res = max(iResolution.xy, vec2(1.0));
    vec2 uv = fragCoord / res;
    vec2 p = fragCoord - 0.5 * res;
    vec2 halfExtents = max(0.5 * res - vec2(1.5), vec2(2.0));
    float radius = clamp(uRadius, 2.0, min(halfExtents.x, halfExtents.y));

    float dist = sdRoundedBox(p, halfExtents, radius);

    // Superellipse-inspired optical masks mapped onto exact SDF distance
    float rb1 = NUM_ONE - smoothstep(-1.2, 0.8, dist);
    float rb2 = smoothstep(-3.0, -0.9, dist) * (NUM_ONE - smoothstep(-0.3, 1.1, dist));
    float rb3 = smoothstep(-18.0, -6.0, dist) * (NUM_ONE - smoothstep(-3.2, -0.6, dist));

    float transition = smoothstep(NUM_ZERO, NUM_ONE, rb1 + rb2);
    if (transition <= 0.001) {
      fragColor = vec4(NUM_ZERO);
      return;
    }

    float minDim = max(min(res.x, res.y), 1.0);
    float bezelWidth = clamp(minDim * 0.24, 14.0, 34.0);
    float edgeT = NUM_ONE - clamp(max(-dist, NUM_ZERO) / bezelWidth, NUM_ZERO, NUM_ONE);
    float curvedBezel = pow(edgeT, 3.0);

    vec2 normal = boxNormal(p, halfExtents, radius);

    // Local pointer coordinates (WebGL Y=0 is bottom)
    vec2 mouse = iMouse.xy;
    if (length(mouse) < NUM_ONE) {
      mouse = res * 0.5;
    }
    vec2 m2 = (fragCoord - mouse) / minDim;
    float pointerDist = length((fragCoord - mouse) / max(res, vec2(1.0)));
    float pointerGlow = exp(-pointerDist * 4.2) * uHover;

    // Localized optical lens refraction along curved bevel normal
    vec2 aspectScale = vec2(res.y / res.x, NUM_ONE);
    vec2 refractOffset = normal * curvedBezel * (0.048 + 0.022 * uHover) * aspectScale;
    vec2 scrollDrift = vec2(sin(uScrollPhase * 3.14159) * 0.02, uScrollPhase * 0.14) * uIsNavbar;
    vec2 lens = clamp(uv - refractOffset + scrollDrift, vec2(0.01), vec2(0.99));

    // Multi-tap dispersion blur across iChannel0
    vec4 blurred = vec4(NUM_ZERO);
    float total = NUM_ZERO;
    for (float x = -SAMPLE_RANGE; x <= SAMPLE_RANGE; x += 1.0) {
      for (float y = -SAMPLE_RANGE; y <= SAMPLE_RANGE; y += 1.0) {
        vec2 offset = vec2(x, y) * SAMPLE_OFFSET / res;
        blurred += texture2D(iChannel0, clamp(lens + offset, vec2(0.005), vec2(0.995)));
        total += NUM_ONE;
      }
    }
    blurred /= max(total, NUM_ONE);

    // Top-to-bottom dome gradient + anisotropic corner specular catchlight
    float ny = uv.y - 0.5;
    float topHighlight = smoothstep(0.08, 0.5, ny) * 0.22;
    float bottomCaustic = smoothstep(0.05, 0.5, -ny) * rb3 * 0.28;
    float gradient = topHighlight + bottomCaustic;

    // Light vector from top-left (-0.55, 0.84) creates realistic glass rim refraction
    float aniso = pow(abs(dot(normal, normalize(vec2(-0.52, 0.85)))), 1.6);
    // Soften internal WebGL wireframe stroke on navbar so CSS conic ::after serves as single crisp rim
    float navbarRimMix = mix(1.0, 0.16, uIsNavbar);
    float rimSpec = rb2 * navbarRimMix * (0.28 + 0.72 * aniso + pointerGlow * 0.65);

    vec3 baseGlass = mix(blurred.rgb, uAccentColor, 0.08 + 0.06 * uHover);
    vec3 lit = baseGlass
      + vec3(rb1) * gradient * (0.65 + 0.35 * uAccentColor)
      + vec3(rimSpec) * LIGHTING_INTENSITY * mix(vec3(0.85, 0.92, 1.0), uAccentColor + 0.45, 0.35)
      + uAccentColor * pointerGlow * 0.22 * rb1
      + vec3(rb3) * 0.08 * (0.4 + 0.6 * aniso);

    lit = clamp(lit, NUM_ZERO, NUM_ONE);

    // Straight alpha tuned so underlying CSS backdrop-filter shows real DOM content
    float bodyAlpha = rb1 * (uGlassAlpha + pointerGlow * 0.06);
    float edgeAlpha = rb2 * navbarRimMix * (0.58 + 0.34 * aniso + pointerGlow * 0.25) + rb3 * 0.22;
    float finalAlpha = clamp(max(bodyAlpha, edgeAlpha), NUM_ZERO, 0.92) * transition;

    // Output premultiplied RGBA for artifact-free 2D canvas drawImage blitting
    fragColor = vec4(lit * finalAlpha, finalAlpha);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const ACCENT_RGB: Record<LiquidGlassAccent, [number, number, number]> = {
  neutral: [0.78, 0.86, 0.98],
  mars: [0.92, 0.44, 0.3],
  cyan: [0.22, 0.74, 0.97],
  amber: [0.96, 0.62, 0.08],
};

class LiquidGlassEngine {
  private glCanvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private failed = false;
  private textures = new Map<string, WebGLTexture>();
  private loadingImages = new Set<string>();
  private uniforms: {
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    texture: WebGLUniformLocation | null;
    radius: WebGLUniformLocation | null;
    hover: WebGLUniformLocation | null;
    glassAlpha: WebGLUniformLocation | null;
    isNavbar: WebGLUniformLocation | null;
    scrollPhase: WebGLUniformLocation | null;
    accentColor: WebGLUniformLocation | null;
  } | null = null;

  private ensureContext(): boolean {
    if (this.failed || typeof document === "undefined") return false;
    if (this.gl && this.program && !this.gl.isContextLost()) return true;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;

      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      });

      if (!gl) {
        this.failed = true;
        return false;
      }

      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        this.gl = null;
        this.program = null;
        this.textures.clear();
      });

      const vs = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vs || !fs) {
        this.failed = true;
        return false;
      }

      const program = gl.createProgram();
      if (!program) {
        this.failed = true;
        return false;
      }

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        this.failed = true;
        return false;
      }

      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );

      const posLoc = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      this.uniforms = {
        resolution: gl.getUniformLocation(program, "iResolution"),
        time: gl.getUniformLocation(program, "iTime"),
        mouse: gl.getUniformLocation(program, "iMouse"),
        texture: gl.getUniformLocation(program, "iChannel0"),
        radius: gl.getUniformLocation(program, "uRadius"),
        hover: gl.getUniformLocation(program, "uHover"),
        glassAlpha: gl.getUniformLocation(program, "uGlassAlpha"),
        isNavbar: gl.getUniformLocation(program, "uIsNavbar"),
        scrollPhase: gl.getUniformLocation(program, "uScrollPhase"),
        accentColor: gl.getUniformLocation(program, "uAccentColor"),
      };

      this.glCanvas = canvas;
      this.gl = gl;
      this.program = program;
      return true;
    } catch {
      this.failed = true;
      return false;
    }
  }

  private compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  /**
   * Generates a context-appropriate Martian dark-space lightfield texture for iChannel0
   * so perimeter lens refraction bends authentic Mars/Cyan/Amber atmosphere hues.
   */
  private getProceduralTexture(
    gl: WebGLRenderingContext,
    accent: LiquidGlassAccent,
    mode: LiquidGlassMode
  ): WebGLTexture | null {
    const key = `proc:${mode}:${accent}`;
    const cached = this.textures.get(key);
    if (cached) return cached;

    const texCanvas = document.createElement("canvas");
    texCanvas.width = 256;
    texCanvas.height = 256;
    const ctx = texCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = mode === "navbar" ? "#0b0d14" : "#050914";
    ctx.fillRect(0, 0, 256, 256);

    const drawOrb = (x: number, y: number, r: number, color: string) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(4, 7, 14, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    };

    if (mode === "navbar") {
      // Smoked dark obsidian base with warm right-edge CTA reflection + overhead rim sheen
      drawOrb(226, 128, 130, "rgba(248, 190, 148, 0.50)");
      drawOrb(40, 64, 135, "rgba(148, 163, 184, 0.24)");
      drawOrb(128, 22, 115, "rgba(255, 255, 255, 0.26)");
    } else if (accent === "mars") {
      drawOrb(55, 48, 165, "rgba(232, 108, 72, 0.56)");
      drawOrb(210, 200, 150, "rgba(245, 158, 11, 0.38)");
      drawOrb(200, 44, 110, "rgba(56, 189, 248, 0.24)");
    } else if (accent === "cyan") {
      drawOrb(48, 42, 160, "rgba(56, 189, 248, 0.54)");
      drawOrb(212, 210, 155, "rgba(217, 75, 50, 0.32)");
      drawOrb(135, 18, 110, "rgba(224, 242, 254, 0.26)");
    } else if (accent === "amber") {
      drawOrb(56, 44, 155, "rgba(245, 158, 11, 0.52)");
      drawOrb(205, 195, 155, "rgba(56, 189, 248, 0.35)");
      drawOrb(190, 50, 110, "rgba(217, 75, 50, 0.32)");
    } else {
      drawOrb(52, 44, 155, "rgba(148, 163, 184, 0.36)");
      drawOrb(204, 62, 140, "rgba(56, 189, 248, 0.34)");
      drawOrb(120, 212, 150, "rgba(217, 75, 50, 0.3)");
    }

    // Subtle specular highlight streaks to give beveled glass crisp refraction cues
    const sheen = ctx.createLinearGradient(0, 0, 256, 256);
    sheen.addColorStop(0, "rgba(255, 255, 255, 0.14)");
    sheen.addColorStop(0.45, "rgba(255, 255, 255, 0.0)");
    sheen.addColorStop(1, "rgba(255, 255, 255, 0.1)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 256, 256);

    const texture = this.uploadCanvasTexture(gl, texCanvas);
    if (texture) {
      this.textures.set(key, texture);
    }
    return texture;
  }

  private getBackdropTexture(
    src: string,
    onReady: () => void
  ): WebGLTexture | null {
    const key = `img:${src}`;
    const cached = this.textures.get(key);
    if (cached) return cached;

    if (!this.loadingImages.has(src)) {
      this.loadingImages.add(src);
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        this.loadingImages.delete(src);
        if (!this.gl || this.gl.isContextLost()) return;

        const off = document.createElement("canvas");
        off.width = 256;
        off.height = 256;
        const ctx = off.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#04070e";
        ctx.fillRect(0, 0, 256, 256);

        const scale = Math.max(256 / image.width, 256 / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        ctx.globalAlpha = 0.55;
        ctx.drawImage(image, (256 - w) / 2, (256 - h) / 2, w, h);
        ctx.globalAlpha = 1;

        // Vignette keep center calm so interior card typography remains readable
        const vig = ctx.createRadialGradient(128, 128, 30, 128, 128, 150);
        vig.addColorStop(0, "rgba(8, 13, 25, 0.72)");
        vig.addColorStop(1, "rgba(8, 13, 25, 0.18)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, 256, 256);

        const tex = this.uploadCanvasTexture(this.gl, off);
        if (tex) {
          this.textures.set(key, tex);
          onReady();
        }
      };
      image.onerror = () => {
        this.loadingImages.delete(src);
      };
      image.src = src;
    }

    return null;
  }

  private uploadCanvasTexture(
    gl: WebGLRenderingContext,
    source: HTMLCanvasElement
  ): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture) return null;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  public render(params: LiquidGlassRenderParams, onBackdropLoaded?: () => void): boolean {
    if (!this.ensureContext() || !this.gl || !this.glCanvas || !this.program || !this.uniforms) {
      return false;
    }

    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pw = Math.max(Math.round(params.width * dpr), 2);
    const ph = Math.max(Math.round(params.height * dpr), 2);

    if (this.glCanvas.width !== pw || this.glCanvas.height !== ph) {
      this.glCanvas.width = pw;
      this.glCanvas.height = ph;
    }

    if (params.targetCanvas.width !== pw || params.targetCanvas.height !== ph) {
      params.targetCanvas.width = pw;
      params.targetCanvas.height = ph;
    }

    let texture: WebGLTexture | null = null;
    if (params.backdropSrc) {
      texture = this.getBackdropTexture(params.backdropSrc, () => {
        onBackdropLoaded?.();
      });
    }
    if (!texture) {
      texture = this.getProceduralTexture(gl, params.accent, params.mode);
    }
    if (!texture) return false;

    gl.viewport(0, 0, pw, ph);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform3f(this.uniforms.resolution, pw, ph, 1.0);
    gl.uniform1f(this.uniforms.time, performance.now() / 1000);

    // Convert DOM top-left mouse coordinates to WebGL bottom-left coordinates
    const mx = params.mouseX * dpr;
    const my = ph - params.mouseY * dpr;
    gl.uniform4f(this.uniforms.mouse, mx, my, 0, 0);

    gl.uniform1f(this.uniforms.radius, params.radius * dpr);
    gl.uniform1f(this.uniforms.hover, params.hover);
    gl.uniform1f(this.uniforms.glassAlpha, params.glassAlpha);
    gl.uniform1f(this.uniforms.isNavbar, params.mode === "navbar" ? 1.0 : 0.0);
    gl.uniform1f(this.uniforms.scrollPhase, params.scrollPhase);

    const [ar, ag, ab] = ACCENT_RGB[params.accent];
    gl.uniform3f(this.uniforms.accentColor, ar, ag, ab);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.uniforms.texture, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const ctx2d = params.targetCanvas.getContext("2d");
    if (!ctx2d) return false;
    ctx2d.clearRect(0, 0, pw, ph);
    ctx2d.drawImage(this.glCanvas, 0, 0, pw, ph);

    return true;
  }
}

export const liquidGlassEngine = new LiquidGlassEngine();
