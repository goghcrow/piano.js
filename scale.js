
// 调式音程结构定义（单位：半音数）
const SCALE_INTERVALS = {
    major: [2, 2, 1, 2, 2, 2, 1],       // 大调
    minor: [2, 1, 2, 2, 1, 2, 2],       // 自然小调
  
    // 中古教会调式（七声音阶）
    ionian:     [2,2,1,2,2,2,1],    // 伊奥尼亚（自然大调）
    dorian:     [2,1,2,2,2,1,2],    // 多利亚
    phrygian:   [1,2,2,2,1,2,2],    // 弗里几亚
    lydian:     [2,2,2,1,2,2,1],    // 利底亚
    mixolydian: [2,2,1,2,2,1,2],    // 混合利底亚
    aeolian:    [2,1,2,2,1,2,2],    // 爱奥尼亚（自然小调）
    locrian:    [1,2,2,1,2,2,2],    // 洛克里亚
  
    // 小调变体
    harmonicMinor: [2,1,2,2,1,3,1],  // 和声小调
    melodicMinor:  [2,1,2,2,2,2,1],  // 旋律小调（上行）
    
    // 五声/六声音阶
    pentatonicMajor: [2,2,3,2,3],     // 大调五声（中国宫调式）
    pentatonicMinor: [3,2,2,3,2],     // 小调五声（中国羽调式）
    blues:          [3,2,1,1,3,2],    // 布鲁斯音阶（含blue note）
    
    // 特殊调式
    chromatic:      [1,1,1,1,1,1,1,1,1,1,1], // 半音阶
    wholeTone:      [2,2,2,2,2,2],           // 全音阶
    octatonic:      [2,1,2,1,2,1,2,1],       // 八度音阶（减音阶）
    doubleHarmonic: [1,3,1,2,1,3,1],         // 双和声小调（拜占庭）
    hungarianMinor: [2,1,3,1,1,3,1],        // 匈牙利小调
    
    // 民族音阶
    japaneseIn:     [1,4,1,4,2],            // 日本都节音阶
    arabic:         [2,1,3,1,2,1,2],        // 阿拉伯音阶
    hirajoshi:      [2,1,4,1,4],            // 日本平调子
    pelog:          [1,2,4,1,4]             // 印尼佩洛格音阶
  }
  
  const A4 = 440 // Hz
  
  // 获取根音频率（基于A4 = 440Hz）
  function getRootFrequency(noteName = 'A', octave = 4) {
    const noteValues = {
      'C' : -9, 
      'C#': -8, 
      'D' : -7, 
      'D#': -6, 
      'E' : -5, 
      'F' : -4, 
      'F#': -3,
      'G' : -2,
      'G#': -1,
      'A' : 0,
      'A#': 1,
      'B' : 2,
    }
    const semitones = noteValues[noteName] + (octave - 4) * 12
    return calculateFreq(A4, semitones)
  }
  
  function calculateFreq(freq, semitones) {
      return freq * (2 ** (semitones / 12))
  }
  
  // 生成音阶频率序列
  function generateScale(rootNote = 'C', octave = 4, mode = 'major') {
    const rootFreq = getRootFrequency(rootNote, octave)
    const intervals = SCALE_INTERVALS[mode] || SCALE_INTERVALS.major
    
    let currentSt = 0 // current semitome
    const frequencies = [rootFreq]
    
    for (const interval of intervals) {
      currentSt += interval
      frequencies.push(calculateFreq(rootFreq, currentSt))
    }
    
    return frequencies.slice(0, -1)
  }
  
  
  function divmod(a, b) {
    const quotient = Math.trunc(a / b)
    const remainder = a % b
    return [quotient, remainder]
  }
  
  // 生成音阶频率序列
  function mkScaleGenerator(rootNote = 'C', octave = 4, mode = 'major') {
    const rootFreq = getRootFrequency(rootNote, octave)
    const intervals = SCALE_INTERVALS[mode] || SCALE_INTERVALS.major
    
    return idx => {
      // debugger
      let [quotient, remainder] = divmod(idx, intervals.length)
      if (idx > 0) {
        const freq = rootFreq * 2 ** quotient
        const semitones = intervals.slice(0, remainder).reduce((acc, cur) => acc + cur, 0)
        return freq * (2 ** (semitones / 12))
      }
    //   if (idx < 0) {
    //     const freq = rootFreq * (1/2) ** -quotient
    //     const semitones = intervals.reverse().slice(0, -remainder).reduce((acc, cur) => acc + cur, 0)
    //     return freq * (2 ** (semitones / -12))
    //   }
      return rootFreq
    }
  }
  
  
  // x * 2^半音个数/12
  
  // 示例：生成C大调音阶并映射到键盘
  const C_MAJOR = generateScale('C', 4, 'major')
  // 切换调式示例：生成A小调
  const A_MINOR = generateScale('A', 4, 'minor')
  
  // const scales = generateScale('C', 4, 'major')
  
  // console.log(scales)
  // debugger
  
  // 应该根据实际音阶长度动态映射
  // const NOTE_KEYS = [
  //     'Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8', 'Digit0', 
  //     'Minus', 'Equal', 'Backspace',
  // ]
  // const NOTE_FREQ = new Map(
  //   scales.slice(0,8).map((freq, i) => [NOTE_KEYS[i], freq])
  // )
  

  // const genScale = mkScaleGenerator('C', 4, 'major')
// const NOTE_KEYS = [
//     'Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8', 'Digit9', 'Digit0', 
//     'Minus', 'Equal', 'Backspace',
// ]

// const NOTE_FREQ = new Map(
//   NOTE_KEYS.map((key, i) => [key, genScale(i)])
// )

// const scales = mkScaleGenerator('C', 4, 'major')
