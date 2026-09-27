"use client";

import { useEffect, useRef } from "react";

/**
 * The signature move: a print develops under the visitor's hand.
 *
 * A silver gelatin print comes up in the tray darkest tones first: the shadows
 * appear, then the midtones, the sky last. The shader models exactly that. Each
 * pixel stays paper white until the development front reaches its own tone,
 * then darkens to it. Under the safelight everything reads red; when the
 * development is done the white light comes on and the print is seen for the
 * first time in neutral tones.
 *
 * The act's scroll progress is the development time. Scroll back and the image
 * sinks back into the paper.
 *
 * Without WebGL the same timing drives a CSS fade. Under reduced motion, or
 * without JavaScript, the finished print is simply shown.
 */

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = (a_pos + 1.0) * 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_image;
uniform float u_develop;
uniform float u_light;
uniform float u_paper;
uniform float u_cover;
uniform vec2 u_res;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;
  // object-fit: cover, so any photograph fills the print without distortion
  if (u_cover > 1.0) uv.y = 0.5 + (uv.y - 0.5) / u_cover;
  else uv.x = 0.5 + (uv.x - 0.5) * u_cover;

  vec3 src = texture2D(u_image, uv).rgb;
  float target = min(dot(src, vec3(0.2126, 0.7152, 0.0722)), u_paper);

  // Darker tones start earlier. A pixel does nothing until the front reaches
  // its tone, then comes down to it over a short stretch of development.
  float start = target * 0.58;
  float p = smoothstep(start, start + 0.36, u_develop);
  float tone = mix(u_paper, target, p);

  // Silver grain, fixed to the paper and stronger where there is silver.
  tone += (hash(floor(v_uv * u_res)) - 0.5) * 0.035 * (0.35 + p);
  tone = clamp(tone, 0.0, 1.0);

  vec3 safelight = vec3(1.0, 0.26, 0.18) * tone * 0.62;
  vec3 white = vec3(tone) * vec3(1.0, 0.985, 0.955);
  gl_FragColor = vec4(mix(safelight, white, u_light), 1.0);
}`;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Scroll progress through the act, the same number the engine publishes as --sc-p. */
function actProgress(act: Element): number {
  const rect = act.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  return clamp01(-rect.top / travel);
}

/** The timeline, in act progress. Mirrors the CSS in home.css. */
export const DEVELOP_FROM = 0.2;
export const DEVELOP_TO = 0.7;
/** The safelight is a switch, not a dimmer: there is no in-between to park on. */
export const LIGHT_AT = 0.72;

type Props = {
  src: string;
  srcMobile?: string;
  alt: string;
  /** width / height of the photograph */
  ratio: number;
};

export function DevelopPrint({ src, srcMobile, alt, ratio }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      host.dataset.mode = "still";
      return;
    }

    const act = host.closest("[data-sc-act]");
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false });
    if (!act || !gl) {
      host.dataset.mode = "css";
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram()!;
    if (!vs || !fs) {
      host.dataset.mode = "css";
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      host.dataset.mode = "css";
      return;
    }
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      develop: gl.getUniformLocation(program, "u_develop"),
      light: gl.getUniformLocation(program, "u_light"),
      paper: gl.getUniformLocation(program, "u_paper"),
      cover: gl.getUniformLocation(program, "u_cover"),
      res: gl.getUniformLocation(program, "u_res"),
    };
    gl.uniform1f(u.paper, 0.92);

    let imageAspect = ratio;
    let ready = false;
    let visible = false;
    let raf = 0;
    let develop = -1;
    let light = -1;
    let drawn = { develop: -2, light: -2, w: 0, h: 0 };
    let lost = false;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(box.width * dpr));
      canvas.height = Math.max(1, Math.round(box.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      gl.uniform1f(u.develop, develop);
      gl.uniform1f(u.light, light);
      gl.uniform1f(u.cover, canvas.width / canvas.height / imageAspect);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      drawn = { develop, light, w: canvas.width, h: canvas.height };
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!ready || !visible || lost) return;
      const p = actProgress(act);
      const targetDevelop = clamp01((p - DEVELOP_FROM) / (DEVELOP_TO - DEVELOP_FROM));
      const targetLight = p >= LIGHT_AT ? 1 : 0;
      // Lerped, so a trackpad flick reads as development, not as a jump.
      develop = develop < 0 ? targetDevelop : develop + (targetDevelop - develop) * 0.16;
      // The switch still takes a few frames, like a lamp warming up.
      light = light < 0 ? targetLight : light + (targetLight - light) * 0.22;
      if (Math.abs(targetDevelop - develop) < 0.0005) develop = targetDevelop;
      if (Math.abs(targetLight - light) < 0.0005) light = targetLight;
      if (develop !== drawn.develop || light !== drawn.light || canvas.width !== drawn.w || canvas.height !== drawn.h) draw();
    };

    const image = new Image();
    const url = srcMobile && window.matchMedia("(max-width: 767px)").matches ? srcMobile : src;
    if (new URL(url, window.location.href).origin !== window.location.origin) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      if (lost) return;
      imageAspect = image.naturalWidth / image.naturalHeight || ratio;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      } catch {
        host.dataset.mode = "css"; // a cross-origin image without CORS headers
        return;
      }
      resize();
      ready = true;
      host.dataset.mode = "gl";
    };
    image.onerror = () => {
      host.dataset.mode = "css";
    };
    image.src = url;

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      host.dataset.mode = "css";
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const resizeObserver = new ResizeObserver(() => {
      if (ready) resize();
    });
    resizeObserver.observe(canvas);

    // Only render while the darkroom is anywhere near the screen.
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { rootMargin: "25% 0px" });
    viewObserver.observe(act);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
    };
  }, [src, srcMobile, ratio]);

  return (
    <div ref={hostRef} className="print" data-mode="css">
      <div className="print__paper">
        <div className="print__image" style={{ aspectRatio: String(ratio) }}>
          <picture>
            {srcMobile && <source media="(max-width: 767px)" srcSet={srcMobile} />}
            {/* The finished print: what reduced motion, no JavaScript and no WebGL all see. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="print__still" src={src} alt={alt} decoding="async" loading="lazy" />
          </picture>
          <canvas ref={canvasRef} className="print__canvas" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
