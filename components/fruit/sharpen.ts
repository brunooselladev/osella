import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'

// A light unsharp mask on the final, tone-mapped image: crisper edges without touching the lighting.
const fragment = /* glsl */ `
uniform float amount;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 n = texture2D(inputBuffer, uv + vec2(texelSize.x, 0.0)).rgb
         + texture2D(inputBuffer, uv - vec2(texelSize.x, 0.0)).rgb
         + texture2D(inputBuffer, uv + vec2(0.0, texelSize.y)).rgb
         + texture2D(inputBuffer, uv - vec2(0.0, texelSize.y)).rgb;
  vec3 detail = clamp(inputColor.rgb - n * 0.25, -0.08, 0.08);
  outputColor = vec4(inputColor.rgb + detail * amount, inputColor.a);
}
`

export class SharpenEffect extends Effect {
  constructor(amount = 0.7) {
    super('SharpenEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([['amount', new Uniform(amount)]]),
    })
  }
}
