// 多波形混合架构
const OSC_CONFIGS = {
  'Simple': {
    layer: [
      { type: 'triangle', ratio: 2 ** 0, gain: 0.5, decay: 0.001, delay: 3 },
      { type: 'triangle', ratio: 2 ** 1, gain: 0.5, decay: 0.001, delay: 3 },
      { type: 'triangle', ratio: 2 ** 2, gain: 0.5, decay: 0.001, delay: 3 }
    ]
  },
  '普通钢琴': {
    layer: [
      // 每个音源包含4个振荡器：三角波（基频）+ 方波（3次谐波）+ 三角波（5次谐波）+ 正弦波（7次谐波）
      // 各谐波增益比例：60% → 40% → 30% → 20%（模拟真实钢琴泛音衰减）
      { type: 'triangle', ratio: 1, gain: 0.6, decay: 0.001, delay: 1.5 }, // 基频 (三角波)
      { type: 'square', ratio: 3, gain: 0.4, decay: 0.001, delay: 1.5 }, // 3次谐波 (方波)   高频谐波使用方波增加金属感
      { type: 'triangle', ratio: 5, gain: 0.3, decay: 0.001, delay: 1.5 }, // 5次谐波 (三角波) 低频谐波使用三角波保持温暖感
      { type: 'sine', ratio: 7, gain: 0.2, decay: 0.001, delay: 1.5 } // 7次谐波 (正弦波) 正弦波用于最高次谐波避免失真
    ]
  },
  '立式钢琴': {
    layer: [
      { type: 'triangle', ratio: 1, gain: 0.6, decay: 0.001, delay: 3 }, // 基频 (三角波)
      { type: 'sawtooth', ratio: 3, gain: 0.4, decay: 0.001, delay: 3 }, // 3次谐波 (锯齿波)
      { type: 'triangle', ratio: 5, gain: 0.3, decay: 0.001, delay: 3 }, // 5次谐波 (三角波)
      { type: 'sine', ratio: 7, gain: 0.2, decay: 0.001, delay: 3 } // 7次谐波 (正弦波)
    ]
  },
  '金属感': (() => {
    // DeepSeek 生成的音色
    // 泛音层级扩展：从基频到12次泛音，采用渐弱式增益比例（1.0 → 0.1），符合钢琴泛音衰减规律
    // 波形组合策略：
    //  三角波作为基频保持温暖感
    //  锯齿波/方波增强中低频浑厚度
    //  高频使用纯正弦波避免失真
    //  自定义波形模拟琴弦金属噪声
    const oscConfig = [
      // 基频层 (温暖感核心)
      { type: 'triangle', ratio: 1, gain: 1.0, decay: 0.002, delay: 0.5 },

      // 低频泛音层 (增加浑厚度)
      { type: 'sawtooth', ratio: 2, gain: 0.6, decay: 0.003, delay: 0.8 },
      { type: 'square', ratio: 3, gain: 0.4, decay: 0.005, delay: 1.2 },

      // 中高频泛音层 (明亮感来源)
      { type: 'sine', ratio: 4.5, gain: 0.3, decay: 0.008, delay: 1.5 },
      { type: 'sine', ratio: 6.7, gain: 0.2, decay: 0.01, delay: 2.0 },

      // 高频噪声层 (模拟琴槌敲击)
      { type: 'square', ratio: 8.9, gain: 0.15, decay: 0.005, delay: 0.3 },
      {
        type: 'custom',
        ratio: 12,
        gain: 0.1,
        decay: 0.002,
        delay: 0.2,
        waveform: new Float32Array([0.2, 1, -0.8, 0.5, -0.3])
      } // 自定义波形模拟金属噪声
    ]
    // 随机化处理, 微小的随机调谐，模拟真实钢琴弦的微小失调
    // 引入 非谐波成分（自定义波形）模拟机械噪声
    oscConfig.forEach(conf => {
      conf.ratio *= 1 + (Math.random() * 0.002 - 0.001) // 微调谐波频率
      conf.delay *= 1 + (Math.random() * 0.1 - 0.05) // 随机延迟触发
    })
    return { layer: oscConfig }
  })(),
  '明亮': {
    /*
      三角波基频：提供温暖的核心音色，配合±1音分的随机失谐（detune）模拟真实弦列微小失调 2
      方波3次谐波：增强金属质感，通过2000Hz高通滤波器避免低频浑浊 1
      自定义噪声波形：在8.9倍频处添加不规则波形，模拟琴槌击弦的瞬态噪声 2
    */
    layer: [
      // 基础层（温暖感）
      {
        type: 'triangle',
        ratio: 1,
        gain: 0.8,
        decay: 0.002,
        delay: 0.5,
        detune: Math.random() * 2 - 1 // 微调谐波失谐
      },
      // 泛音层（金属感）
      {
        type: 'square',
        ratio: 3,
        gain: 0.4,
        decay: 0.005,
        delay: 1.2,
        filter: { type: 'highpass', freq: 2000 } // 避免低频浑浊
      },
      // 高频噪声层（琴槌质感）
      {
        type: 'custom',
        ratio: 8.9,
        gain: 0.15,
        decay: 0.001,
        delay: 0.3,
        waveform: new Float32Array([0.3, 1, -0.5, 0.2]) // 不规则波形模拟机械噪声
      }
    ]
  }
}

// 主音量 ADSR包络增强物理感
const MASTER_GAIN_ADSR = {
  attack: 0.01, // 起音时间（秒），模拟琴槌击弦速度
  decay: 0.3, // 衰减时间（到持续电平）
  sustain: 0.15, // 持续电平（原声钢琴无真正sustain，此处模拟共鸣）
  release: 0.5 // 释音时间（琴弦振动停止时长）
}

// 动态滤波器配置
const DYNAMIC_FILTER = {
  type: 'lowpass',
  baseFreq: 6000, // 初始高频保留明亮度 !!!
  endFreq: 800, // 衰减后低频保持温暖感
  Q: 1.5, // 适度共振峰增强
  tracking: 0.3 // 频率随力度动态变化
}

const STEREO_CONF = {
  width: 1.5 // 立体声宽度扩展
}

class Piano {
  #pianoBodyIRCache = null
  #activeOscConfig = ""   // 当前激活的音色配置
 
  constructor(audioContext, config = {}) {
    this.ctx = audioContext
    this.config = {
      oscs: { ...OSC_CONFIGS, ...config.oscs },
      filter: { ...DYNAMIC_FILTER, ...config.filter },
      gain: { ...MASTER_GAIN_ADSR, ...config.gain },
      stereo: { ...STEREO_CONF, ...config.stereo },
    }
    const oscs = this.config.oscs
    const defaultTimbre = Object.keys(oscs)[0]
    this.config.timbre = config.timbre || defaultTimbre
    this.#activeOscConfig = oscs[this.config.timbre] || oscs[defaultTimbre]
    const self = this
    this.config = new Proxy(this.config, {
      set(target, prop, value) {
        if (prop === 'timbre') {
          if (!oscs[value]) return true // 无效音色配置不更新
          self.#activeOscConfig = oscs[value]
        } else {
          target[prop] = value
        }
        return true
      }
    })
  }

  /**
   * 创建一个振荡器
   *
   * @param freq 振荡器的频率
   * @param conf 配置对象，包含波形类型、波形数据、衰减比例、延迟时间等参数
   * @returns 包含振荡器、立体声控制器、波形整形器和增益控制器的对象
   */
  #createOscillator(freq, conf) {
    const ctx = this.ctx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()

    if (conf.type === 'custom' && conf.waveform) {
      // 处理自定义波形
      const real = new Float32Array([1, ...conf.waveform]) // 第0元素需为1（DC偏移）
      const imag = new Float32Array(real.length).fill(0) // 无相位偏移
      const customWave = ctx.createPeriodicWave(real, imag)
      osc.setPeriodicWave(customWave)
    } else {
      osc.type = conf.type // 标准波形直接设置类型
    }
    osc.frequency.setValueAtTime(freq * conf.ratio, now) // 频率设置需要补偿基频比

    const stereoControl = new StereoControl(ctx)
    stereoControl.setWidth(this.config.stereo.width) // 可以实时控制

    // 使用 WaveShaperNode 实现磁带饱和效果，增强256Hz和2-3kHz频段的谐波
    const waveShaper = ctx.createWaveShaper()
    waveShaper.curve = new Float32Array(
      [...Array(1024)].map(
        (_, i) => Math.tanh(((i - 512) / 512) * 2) // 双曲正切曲线柔化高频
      )
    )

    // 分层衰减控制：
    // - 单个振荡器层面：每个振荡器有自己的指数衰减 (衰减至 conf.decay 持续conf.delay)
    // - 主音量层面：全局衰减

    // 设置初始增益和衰减曲线
    // 模拟钢琴衰减: 按下时快速衰减到持续电平 (conf.gain-> conf.decay)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(conf.gain, now) // 设置音量包络
    gain.gain.exponentialRampToValueAtTime(conf.decay, now + conf.delay)

    osc.connect(stereoControl.input)
    stereoControl.connect(waveShaper)
    waveShaper.connect(gain)

    return { osc, stereoControl, waveShaper, gain }
  }

  /**
   * 根据给定的频率和振荡器配置创建多个振荡器。
   *
   * @param freq 振荡器的频率
   * @param oscConfig 振荡器的配置数组，每个元素是一个包含振荡器配置的对象
   * @returns 返回创建的振荡器数组
   */
  #createOscillators(freq, oscConfig) {
    return oscConfig.layer.map(conf => this.#createOscillator(freq, conf))
  }

  /**
   * 创建一个低通滤波器
   * 低通滤波器从6000Hz衰减到800Hz（模拟音色随时间变暗）
   * 想要更明亮的音色, 提高初始滤波器截止频率, e.g. 5000
   *
   * @returns {BiquadFilterNode} 返回创建的BiquadFilterNode滤波器节点
   */
  #createFilter() {
    const now = this.ctx.currentTime
    const adsr = this.config.gain // master gain adsr
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    if (false) {
      filter.Q.value = 2 // 提升共振峰表现
      filter.frequency.setValueCurveAtTime(
        new Float32Array([6000, 4000, 2000, 800]),
        now,
        3
      )
    } else {
      // 滤波器联动控制
      // 高频部分随时间减少，使音色变得更柔和
      // 频率变化指数衰减，从6000Hz到800Hz，持续_秒
      filter.frequency.setValueAtTime(this.config.filter.baseFreq, now)
      filter.frequency.exponentialRampToValueAtTime(
        this.config.filter.endFreq,
        now + adsr.attack + adsr.decay + adsr.release // 释音阶段影响滤波器
      )
    }
    return filter
  }

  /**
   * 创建主增益节点
   *
   * @returns 返回创建的增益节点
   */
  #createMasterGain() {
    const now = this.ctx.currentTime
    const adsr = this.config.gain // master gain adsr
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now) // gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(1, now + adsr.attack) // 线性起音更符合物理冲击
    gain.gain.exponentialRampToValueAtTime(
      adsr.sustain,
      now + adsr.attack + adsr.decay
    )
    return gain
  }

  /**
   * 预创建共鸣器脉冲响应
   *
   * @param impulse 卷积节点的脉冲响应缓冲区
   * @returns 返回创建的卷积节点对象
   */
  #createConvolver(impulse) {
    const convolver = this.ctx.createConvolver()
    convolver.buffer = impulse
    return convolver
  }

  #getPianoBodyIR() {
    if (!this.#pianoBodyIRCache) {
      this.#pianoBodyIRCache = this.#createPianoBodyIR(this.ctx)
    }
    return this.#pianoBodyIRCache
  }

  /**
   * 创建钢琴共鸣箱脉冲响应
   *
   * @returns 返回钢琴音色的人工脉冲响应缓冲区
   */
  #createPianoBodyIR() {
    // 1. 创建人工脉冲响应（替代实际录音文件）
    const duration = 2.3 // 模拟2.3秒混响时间
    const sampleRate = this.ctx.sampleRate
    const length = sampleRate * duration
    const buffer = this.ctx.createBuffer(2, length, sampleRate) // 双声道

    // 2. 生成衰减曲线, 双声道随机噪声+指数衰减,模拟真实钢琴共鸣衰减
    const left = buffer.getChannelData(0)
    const right = buffer.getChannelData(1)
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      // 指数衰减叠加随机噪声
      left[i] = Math.random() * 0.1 * Math.exp(-t * 3)
      right[i] = Math.random() * 0.1 * Math.exp(-t * 2.8)
    }
    return buffer
  }

  /**
   * 创建主压缩器
   *
   * @returns 返回创建的压缩器对象
   */
  #createMasterCompressor() {
    const compressor = this.ctx.createDynamicsCompressor()
    compressor.threshold.value = -24 // 柔和压缩防止削波
    compressor.knee.value = 30
    compressor.ratio.value = 12 // 软拐点保持动态
    compressor.attack.value = 0.01
    compressor.release.value = 0.25
    return compressor
  }

  /**
   * 创建音频节点
   *
   * @param freq 音频节点的频率。
   * @param oscConfig 振荡器配置。
   * @returns 包含振荡器、滤波器、共鸣器、主音量包络控制和主压缩器的对象
   */
  #createVoice(freq, oscConfig) {
    const ctx = this.ctx
    const oscs = this.#createOscillators(freq, oscConfig) // 创建包含独立增益振荡器
    const filter = this.#createFilter() // 创建共用低频滤波器动态控制
    const convolver = this.#createConvolver(this.#getPianoBodyIR()) // 创建共鸣器
    const masterGain = this.#createMasterGain() // 创建主音量包络控制
    const compressor = this.#createMasterCompressor() // 增加动态压缩防止过载

    // 此处可加入力度敏感滤波器, 从 evt 读取到 velocity 参数
    // filter.frequency.linearRampToValueAtTime($baseFreq - ($baseFreq - $endFreq) * $velocity, now + 0.1)

    /*
Oscillators → StereoPanner → WaveShaper → Gains → Filter → Convolver → Compressor → Gain → Output
                      ↗
               updateFilter
*/

    // 完整信号链
    // 振荡器组 → 立体声扩展 → 独立增益控制 → 动态滤波器 → 共鸣器 → 主压缩器 → 主增益控制

    // 连接节点
    oscs.forEach(({ gain }) => gain.connect(filter))
    if (false) {
      filter.connect(convolver)
      convolver.connect(masterGain)
    } else {
      filter.connect(masterGain)
    }
    masterGain.connect(compressor)
    compressor.connect(ctx.destination)

    // 启动所有振荡器
    oscs.forEach(({ osc }) => osc.start())

    const voice = { oscs, filter, convolver, masterGain, compressor, 
      release: () => this.#releaseVoice(voice) }
    return voice
  }

  /**
   * 释放音频节点
   * 物理衰减模拟
   * 按下时快速衰减到持续电平, 已经在初始化处理
   * 添加短促的阻尼衰减（模拟制音器接触琴弦）
   * 松开时添加额外释放阶段, 避免突然切断音频造成的爆音
   *
   * @param {Object} voice - 包含振荡器和主增益控制的对象
   */
  #releaseVoice(voice) {
    /*
  时间线优化
    - 单一时序链：使用连续的时间点调度，避免setValueAtTime覆盖前一个自动化事件
    - 二阶衰减：先快速线性衰减模拟制音器接触，再指数衰减保持自然音尾
  
  精确资源释放
    - 基于音频上下文的stop()：直接使用osc.stop(stopTime)，由音频线程保证时序精确
    - 自动断开机制：通过虚拟AudioParam的自动化事件触发清理，避免依赖setTimeout
  
  异常处理增强
    - Safari兼容：使用oncancel事件作为备用清理方案
    - 当前值捕获：currentValue = gain.value避免时间线跳跃
  
  物理模型准确性
    - 动态sustain调整：adsr.sustain * 0.1更符合真实钢琴制音器接触时的快速衰减特性
  */

    const ctx = this.ctx
    const now = ctx.currentTime
    const {
      oscs,
      masterGain: { gain }
    } = voice
    const adsr = this.config.gain // master gain adsr

    // 1. 清除所有未来调度 (保留当前值)
    gain.cancelScheduledValues(now)

    // 2. 获取当前实际增益值作为起点
    const currentValue = gain.value

    // 3. 计算总释放时间（线性释放+指数阻尼）
    const releaseDuration = adsr.release + 0.05 // 增加阻尼阶段时间
    const stopTime = now + releaseDuration

    // 4. 创建平滑释放曲线（二阶衰减）
    gain.setValueAtTime(currentValue, now)
    // 第一阶段：线性衰减到原sustain的1/10（模拟制音器接触）
    gain.linearRampToValueAtTime(adsr.sustain * 0.1, now + adsr.release * 0.3)
    // 第二阶段：指数衰减到静音
    gain.exponentialRampToValueAtTime(0.001, stopTime)

    // 5. 精确停止所有振荡器
    oscs.forEach(({ osc }) => osc.stop(stopTime))

    // 6. 使用音频上下文时钟自动断开连接
    const cleanup = () => this.#cleanup(voice)

    // 通过AudioParam自动触发清理
    const dummyParam = ctx.createGain().gain
    dummyParam.setValueAtTime(0, stopTime)
    dummyParam.oncancel = cleanup // 兼容Safari
    dummyParam.linearRampToValueAtTime(0, stopTime + 0.001)
  }

  /**
   * 清理声音对象的连接
   *
   * @param {Object} voice - 声音对象，包含oscs, filter, convolver, masterGain, compressor等属性
   */
  #cleanup(voice) {
    const { oscs, filter, convolver, masterGain, compressor } = voice
    oscs.forEach(({ osc, stereoControl, waveShaper, gain }) => {
      osc.disconnect()
      stereoControl.disconnect()
      waveShaper.disconnect()
      gain.disconnect()
    })
    filter.disconnect()
    convolver.disconnect()
    masterGain.disconnect()
    compressor.disconnect()
  }

  /**
   * 释放音频节点
   * Web Audio API对自动化事件（automation events）的严格时序要求
   * 时序安全链
   *    now → releaseEnd → dampStart → dampEnd
   *    |-----释放阶段-----||---阻尼阶段---|
   *
   * @param voice 声音对象
   */
  #releaseVoice_legacy(voice) {
    const ctx = this.ctx
    const now = ctx.currentTime
    const gain = voice.masterGain.gain
    const adsr = this.config.gain // master gain adsr

    // 1. 取消所有未执行的自动化事件
    // 使用cancelScheduledValues清除冲突事件
    gain.cancelScheduledValues(now)

    // 2. 精确计算释放结束时间点
    const releaseEnd = now + adsr.release

    // 3. 使用链式调度确保时序不重叠
    // now → releaseEnd
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(adsr.sustain, releaseEnd)

    // 4. 阻尼效果在释放结束后触发
    // releaseEnd → releaseEnd + 0.05
    gain.setValueAtTime(adsr.sustain, releaseEnd)
    gain.exponentialRampToValueAtTime(0.001, releaseEnd + 0.05)

    // 5. 使用精确的音频上下文时间代替setTimeout
    // releaseEnd(dampStart) → dampStart + 0.05
    const dampStart = releaseEnd + 0.001 // 增加1ms安全间隔
    gain.setValueAtTime(adsr.sustain, dampStart)
    gain.exponentialRampToValueAtTime(0.001, dampStart + 0.05)

    // 清理资源: 在释放阶段结束后自动断开音频节点, 防止内存泄漏
    const timeoutSec = dampStart + 0.05 + 0.01 // 增加10ms安全间隔
    // voice.oscs.forEach(({ osc }) => osc.stop(timeoutSec))
    setTimeout(() => this.#cleanup(voice), timeoutSec * 1000)
  }

  // 存储每个按键的独立音源节点, 跟踪所有活动音源, 支持多音同时演奏而不会互相干扰
  // midiNote => voice
  activeVoices = new Map()
  
  /**
   * 按下音符
   *
   * @param {string} midiNote
   * @returns {void}
   */
  pressKey(midiNote) {
    if (this.activeVoices.has(midiNote)) return

    const freq = midiToFrequency(midiNote)
    const voice = this.#createVoice(freq, this.#activeOscConfig)
    this.activeVoices.set(midiNote, voice)
    
    dispatchEvent(new CustomEvent('piano/attack', { detail: {midiNote} }))
  }

  /**
   * 释放音符
   *
   * @param {number} midiNote
   * @returns {void}
   */
  releaseKey(midiNote) {
    if (!this.activeVoices.has(midiNote)) return

    const voice = this.activeVoices.get(midiNote)
    voice.release()
    this.activeVoices.delete(midiNote)

    dispatchEvent(new CustomEvent('piano/release', { detail: {midiNote} }))
  }
}

/*
参数调节建议
参数	           范围	        最佳值 	 作用
feedbackGain	  0.01~0.05	  0.02	  相位抵消抑制强度
rampTime	      0.05~0.3秒	0.1秒	   宽度变化平滑度
centerPreserve	0.1~0.2	    0.15	  中央声道保留比例
*/
class StereoControl {
  constructor(audioContext) {
    this.ctx = audioContext

    // 核心音频节点
    this.input = this.ctx.createGain()
    this.splitter = this.ctx.createChannelSplitter(2)
    this.merger = this.ctx.createChannelMerger(2)
    this.leftGain = this.ctx.createGain()
    this.rightGain = this.ctx.createGain()
    this.feedbackGain = this.ctx.createGain() // 反馈抑制相位问题

    // 节点连接
    this.input.connect(this.splitter)

    // 左声道处理链
    this.splitter.connect(this.leftGain, 0)
    this.leftGain.connect(this.merger, 0, 0)

    // 右声道处理链
    this.splitter.connect(this.rightGain, 1)
    this.rightGain.connect(this.merger, 0, 1)

    // 反馈抑制连接
    this.merger.connect(this.feedbackGain)
    this.feedbackGain.connect(this.input)

    // 初始化参数
    this.setWidth(1.0) // 默认正常立体声
    this.feedbackGain.gain.value = 0.02 // 轻微反馈抑制
  }

  // 设置立体声宽度（0:单声道 1:正常 >1:扩展）
  setWidth(width) {
    const now = this.ctx.currentTime

    // 计算左右声道增益（带防过冲保护）
    const safeWidth = Math.min(Math.max(width, 0), 2.5)
    const angle = (safeWidth * Math.PI) / 4 // 0~90度映射

    // 哈斯效应优化公式（保留中央声道）
    const leftGain = Math.cos(angle) + 0.15 * Math.sin(angle)
    const rightGain = Math.sin(angle) + 0.15 * Math.cos(angle)

    // 平滑过渡
    this.leftGain.gain.setValueAtTime(this.leftGain.gain.value, now)
    this.leftGain.gain.exponentialRampToValueAtTime(leftGain, now + 0.1)

    this.rightGain.gain.setValueAtTime(this.rightGain.gain.value, now)
    this.rightGain.gain.exponentialRampToValueAtTime(rightGain, now + 0.1)
  }

  // 输入/输出接口
  connect(dest) {
    this.merger.connect(dest)
    return dest
  }

  disconnect() {
    this.merger.disconnect()
  }

  // 处理单声道信号（自动立体化）
  monoToStereo() {
    const monoProcessor = this.ctx.createScriptProcessor(256, 1, 2)
    this.input.disconnect()
    this.input.connect(monoProcessor)

    monoProcessor.onaudioprocess = e => {
      const input = e.inputBuffer.getChannelData(0)
      e.outputBuffer.getChannelData(0).set(input)
      e.outputBuffer.getChannelData(1).set(input)
    }
  }
}
