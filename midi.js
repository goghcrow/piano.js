// MIDI音符转音符名称（支持升号与降号）
function midiToNoteName(midiNumber, useSharps = true) {
  const sharps = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B'
  ]
  const flats = [
    'C',
    'Db',
    'D',
    'Eb',
    'E',
    'F',
    'Gb',
    'G',
    'Ab',
    'A',
    'Bb',
    'B'
  ]
  const octave = Math.floor(midiNumber / 12) - 1
  const noteIndex = midiNumber % 12

  if (midiNumber < 0 || midiNumber > 127) {
    throw new Error('MIDI number out of range (0-127)')
  }

  return (useSharps ? sharps[noteIndex] : flats[noteIndex]) + octave
}

// 音符名称转MIDI音符编号
function noteNameToMidi(noteName) {
  const regex = /^([A-Ga-g](?:#|b)?)(-?\d+)$/
  const matches = noteName.match(regex)

  if (!matches) {
    throw new Error('Invalid note format. Use format like "C#4" or "Db3"')
  }

  const noteMap = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11
  }

  // 标准化音名（首字母大写，符号小写）
  const pitch = matches[1][0].toUpperCase() + matches[1].slice(1).toLowerCase()
  const octave = parseInt(matches[2], 10)

  if (!(pitch in noteMap)) {
    throw new Error(`Invalid note name: ${pitch}`)
  }

  const midiNumber = (octave + 1) * 12 + noteMap[pitch]

  if (midiNumber < 0 || midiNumber > 127) {
    throw new Error('Resulting MIDI number out of range (0-127)')
  }

  return midiNumber
}

// 统一转换函数（根据输入类型自动判断方向）
function midiNoteConverter(input, useSharps = true) {
  return typeof input === 'number'
    ? midiToNoteName(input, useSharps)
    : noteNameToMidi(input)
}

/**
 * 将MIDI音符编号转换为对应频率（单位：Hz）
 * @param {number} midiNumber - MIDI编号（0-127整数）
 * @param {number} [tuning=440] - A4基准频率（默认440Hz）
 * @param {number} [precision] - 可选精度（保留小数位数）
 * @returns {number} 计算得到的频率值
 */
function midiToFrequency(midiNumber, tuning = 440, precision) {
  // 参数校验
  if (typeof midiNumber !== 'number' || !Number.isInteger(midiNumber)) {
    throw new TypeError('MIDI编号必须为整数')
  }
  if (midiNumber < 0 || midiNumber > 127) {
    throw new RangeError('MIDI编号需在0-127范围内')
  }
  if (typeof tuning !== 'number' || tuning <= 0) {
    throw new TypeError('基准频率必须为正数')
  }

  // 核心计算公式
  // 基于十二平均律计算公式：
  // frequency = tuning * 2^((n-69)/12)
  // 其中 n 为MIDI编号，tuning 为A4基准频率
  const frequency = tuning * Math.pow(2, (midiNumber - 69) / 12)

  // 精度处理
  return precision !== undefined
    ? Number(frequency.toFixed(precision))
    : frequency
}

function noteNameToFrequency(noteName, tuning = 440, precision) {
  return midiToFrequency(noteNameToMidi(noteName), tuning)
}

if (false) {
  /* 使用示例 */
  // 标准A4调音（440Hz）
  console.log(midiToFrequency(69)) // 440
  console.log(midiToFrequency(60)) // 261.6255653005986
  console.log(midiToFrequency(60, 440, 2)) // 261.63

  // 使用历史调音标准（A4=415Hz）
  console.log(midiToFrequency(69, 415)) // 415
  console.log(midiToFrequency(60, 415, 1)) // 246.9

  // 边缘情况测试
  console.log(midiToFrequency(0)) // 8.175798915643707
  console.log(midiToFrequency(127)) // 12543.853951416975
}

if (false) {
    // 音符频率（基于 A4 = 440Hz）
    const A4 = 440 // Hz
    const NOTE_FREQ = {
    'C4': A4 * 2 ** (-9 / 12),
    'C#4': A4 * 2 ** (-8 / 12),
    'D4': A4 * 2 ** (-7 / 12),
    'D#4': A4 * 2 ** (-6 / 12),
    'E4': A4 * 2 ** (-5 / 12),
    'F4': A4 * 2 ** (-4 / 12),
    'F#4': A4 * 2 ** (-3 / 12),
    'G4': A4 * 2 ** (-2 / 12),
    'G#4': A4 * 2 ** (-1 / 12),
    'A4': A4 * 2 ** (-0 / 12),
    'A#4': A4 * 2 ** (1 / 12),
    'B4': A4 * 2 ** (2 / 12),
    'C5': A4 * 2 ** (3 / 12),
    'C#5': A4 * 2 ** (4 / 12),
    'D5': A4 * 2 ** (5 / 12),
    'D#5': A4 * 2 ** (6 / 12),
    'E5': A4 * 2 ** (7 / 12),
    'F5': A4 * 2 ** (8 / 12),
    'F#5': A4 * 2 ** (9 / 12),
    'G5': A4 * 2 ** (10 / 12),
    'G#5': A4 * 2 ** (11 / 12),
    'A5': A4 * 2 ** (12 / 12),
    }
}