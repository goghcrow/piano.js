// 钢琴参数配置
const PIANO_CONFIG = {
  keyCount: 24, // 琴键总数 (C4-C8)  52
  whiteKeyWidth: 33.5, // 国际标准白键宽度23.5mm
  blackKeyWidth: 24.5, // 黑键宽度≈白键的61.7%, 14.5mm
  keyHeight: 150, // 白键高度150mm
  blackKeyHeight: 95, // 黑键高度≈白键的63%
  padding: 22 // 琴体边距
}

// 琴键布局模式
const KEY_PATTERN = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0] // 白键间隔模式

// 事件分发函数
function dispatchPianoEvent(eventName, detail) {
  const event = new CustomEvent(eventName, { detail })
  canvas.dispatchEvent(event)
}

class PianoRenderer {
  constructor(ctx, config) {
    this.ctx = ctx
    this.config = config
    this.keys = []
    this.init()
  }

  init() {
    this.calculateDimensions()
    this.generateKeys()
    this.createWoodTexture()
  }

  // 计算钢琴尺寸
  calculateDimensions() {
    this.whiteKeys =
      KEY_PATTERN.filter(x => x === 0).length * (this.config.keyCount / 12)
    this.totalWidth = this.whiteKeys * this.config.whiteKeyWidth
    this.startX = (this.ctx.canvas.width - this.totalWidth) / 2
  }

  // 生成琴键数据
  generateKeys() {
    let whiteIndex = 0
    // 每个八度内黑键对应的白键索引和偏移比例
    const OCTAVE_BLACK_POSITIONS = [
      { whiteKey: 0, offset: 0.75 }, // C# 位于C键右侧75%处
      { whiteKey: 1, offset: 0.75 }, // D# 位于D键右侧75%处
      { whiteKey: 3, offset: 0.75 }, // F# 位于F键右侧75%处
      { whiteKey: 4, offset: 0.75 }, // G# 位于G键右侧75%处
      { whiteKey: 5, offset: 0.75 } // A# 位于A键右侧75%处
    ]
    // 每个八度内黑键的索引位置
    const BLACK_KEY_PATTERN_INDEXES = [1, 3, 6, 8, 10]

    for (let i = 0; i < this.config.keyCount; i++) {
      const octave = Math.floor(i / 12)
      const keyInOctave = i % 12
      const isBlack = KEY_PATTERN[keyInOctave]

      if (!isBlack) {
        // 白键：直接按顺序排列
        this.keys.push({
          type: 'white',
          x: this.startX + whiteIndex * this.config.whiteKeyWidth,
          y: this.config.padding,
          width: this.config.whiteKeyWidth - 0.3, // 保留间隙
          height: this.config.keyHeight,
          midiNote: 60 + i,
          pressed: false
        })
        whiteIndex++
      } else {
        // 黑键：计算精确位置
        const blackKeyIdx = BLACK_KEY_PATTERN_INDEXES.indexOf(keyInOctave)
        if (blackKeyIdx === -1) continue

        // 获取对应白键的全局索引
        const { whiteKey, offset } = OCTAVE_BLACK_POSITIONS[blackKeyIdx]
        const referenceWhiteIndex = octave * 7 + whiteKey

        // 计算基准位置
        const baseX = this.startX + referenceWhiteIndex * this.config.whiteKeyWidth

        // 应用偏移量
        const x =
          baseX +
          this.config.whiteKeyWidth * offset -
          this.config.blackKeyWidth / 2

        this.keys.push({
          type: 'black',
          x: x + 5,
          y: this.config.padding - 8, // 上移显示在白键上方
          width: this.config.blackKeyWidth,
          height: this.config.blackKeyHeight,
          midiNote: 60 + i,
          pressed: false,
          curvature: blackKeyIdx < 2 ? 1.8 : 2.4 // 前两个黑键弧度较小
        })
      }
    }
  }

  // 创建木质纹理
  createWoodTexture() {
    const wood = document.createElement('canvas')
    wood.width = 256 // 增大纹理尺寸
    wood.height = 256
    const wctx = wood.getContext('2d')

    // 木纹方向改为纵向
    const lingrad = wctx.createLinearGradient(0, 0, 0, wood.height)
    lingrad.addColorStop(0, '#5d4037')
    lingrad.addColorStop(1, '#3e2723')
    wctx.fillStyle = lingrad
    wctx.fillRect(0, 0, wood.width, wood.height)

    // 调整木纹线条方向为纵向
    wctx.strokeStyle = 'rgba(0,0,0,0.15)'
    for (let i = 0; i < 80; i++) {
      wctx.beginPath()
      wctx.moveTo(Math.random() * wood.width, 0)
      wctx.lineTo(Math.random() * wood.width, wood.height)
      wctx.stroke()
    }
    this.woodTexture = this.ctx.createPattern(wood, 'repeat')
  }

  // 绘制琴体
  drawBody() {
    const { padding } = this.config

    // 主琴体
    this.ctx.save()
    this.ctx.translate(this.startX - 23, -20) // 对齐琴体左侧
    this.ctx.fillStyle = this.woodTexture
    this.ctx.shadowColor = 'rgba(0,0,0,0.5)'
    this.ctx.shadowBlur = 12
    this.ctx.shadowOffsetY = 8

    this.ctx.beginPath()
    this.ctx.roundRect(
      padding - 20,
      padding - 10,
      this.totalWidth + 40,
      this.config.keyHeight + 70,
      10
    )
    this.ctx.fill()

    // 金属部件
    this.ctx.fillStyle = 'linear-gradient(to right, #555, #888)'
    this.ctx.fillRect(
      padding - 15,
      padding + this.config.keyHeight + 30,
      this.totalWidth + 30,
      8
    )
    this.ctx.restore()
  }

  // 绘制单个琴键
  drawKey(key) {
    const isBlack = key.type === 'black'
    const lightPos = key.x + (isBlack ? key.width / 2 : 0)

    // 琴键立体效果
    const keyGradient = this.ctx.createLinearGradient(
      key.x,
      key.y,
      key.x,
      key.y + key.height
    )
    // 根据按压状态选择颜色
    const baseColor = key.pressed
      ? key.type === 'black'
        ? '#333'
        : '#ddd'
      : key.type === 'black'
      ? '#222'
      : '#f9f9f9'
    keyGradient.addColorStop(0, baseColor)

    // 绘制主体
    this.ctx.fillStyle = keyGradient
    this.ctx.beginPath()
    if (isBlack) {
      this.ctx.roundRect(key.x, key.y, key.width, key.height, 4)
    } else {
      // 在白键绘制时添加间隙
      ctx.roundRect(
        key.x + 0.5, // 右侧留0.5px间隙
        key.y,
        key.width - 1, // 宽度减少1px
        key.height,
        6
      )
    }
    this.ctx.fill()

    // 添加高光
    const highlight = this.ctx.createRadialGradient(
      lightPos,
      key.y - 10,
      0,
      lightPos,
      key.y,
      20
    )
    highlight.addColorStop(0, 'rgba(255,255,255,0.2)')
    highlight.addColorStop(1, 'rgba(255,255,255,0)')
    this.ctx.fillStyle = highlight
    this.ctx.fillRect(key.x, key.y, key.width, 15)

    // 边缘阴影
    this.ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(key.x + 0.5, key.y + 0.5, key.width - 1, key.height - 1)

    // 标签显示
    const keymap = this.config.keymap
    const noteName = midiToNoteName(key.midiNote)
    const keyCode = Object.keys(keymap).find(key => keymap[key] === noteName)
    if (isBlack) {
      ctx.font = '10px Arial'
      ctx.fillStyle = '#fff'
      ctx.fillText(noteName, key.x + 3, key.y + key.height - 10)
      if (keyCode) ctx.fillText(keyCode, key.x + 3, key.y + key.height - 25)
    } else {
      ctx.font = '10px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(noteName, key.x + 11, key.y + key.height - 10)
      if (keyCode) ctx.fillText(keyCode, key.x + 3, key.y + key.height - 25)
    }
  }

  render() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制顺序
    this.drawBody()
    this.keys.filter(k => k.type === 'white').forEach(k => this.drawKey(k))
    this.keys.filter(k => k.type === 'black').forEach(k => this.drawKey(k))

    // 添加反光效果
    const reflectGrad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    if (false) {
      reflectGrad.addColorStop(0, 'rgba(255,255,255,0.1)')
      reflectGrad.addColorStop(1, 'transparent')
    }
    ctx.fillStyle = reflectGrad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // 新增手动控制API
  pressKey(midiNote) {
    const key = this.keys.find(k => k.midiNote === midiNote)
    if (key && !key.pressed) {
      key.pressed = true
      this.render()
      dispatchPianoEvent('pianoKeyDown', midiNote)
    }
  }

  releaseKey(midiNote) {
    const key = this.keys.find(k => k.midiNote === midiNote)
    if (key && key.pressed) {
      key.pressed = false
      this.render()
      dispatchPianoEvent('pianoKeyUp', midiNote)
    }
  }

  toggleKey(midiNote) {
    const key = this.keys.find(k => k.midiNote === midiNote)
    if (key) {
      key.pressed = !key.pressed
      this.render()
      dispatchPianoEvent(key.pressed ? 'pianoKeyDown' : 'pianoKeyUp', midiNote)
    }
  }
}
