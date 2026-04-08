import * as fs from 'fs';
import * as path from 'path';

interface CharPron {
  initial: string;
  final: string;
  tone: number;       // 转换后的声调
  originalTone: number; // 原始声调（保留备用）
  pron: string;
  note: string;
}

function buildChromeDict() {
  // ===================== 声调映射规则 =====================
  const toneMap: Record<number, number> = {
    1: 33,
    2: 22,
    3: 35,
    5: 213,
    6: 31,
    7: 45,
    8: 21
  };

  // 文件路径
  const tsvPath = path.join(__dirname, "data", "惠州2025-12-7.tsv");
  const content = fs.readFileSync(tsvPath, "utf8");
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  const charDictionary: Record<string, CharPron> = {};
  let currentFinal = "";

  for (const line of lines) {
    // 跳过注释行
    if (line.startsWith("注释：")) continue;

    // 匹配韵母行 #a #ai
    if (line.startsWith("#")) {
      currentFinal = line.slice(1).trim();
      continue;
    }

    // 无韵母则跳过
    if (!currentFinal) continue;

    // TAB 分割
    const parts = line.split("\t").map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) continue;

    const initial = parts[0];
    const charSection = parts[1];

    // 匹配声调+汉字
    const toneMatches = charSection.matchAll(/\[(\d+)\]([^\[]+)/g);
    for (const m of toneMatches) {
      const originalTone = parseInt(m[1], 10);
      // 执行声调转换
      const tone = toneMap[originalTone] || originalTone;
      
      let text = m[2].trim();
      let note = "";

      // 提取 {注释}
      const noteMatch = text.match(/\{([^}]+)\}/);
      if (noteMatch) {
        note = noteMatch[1];
        text = text.replace(/\{[^}]+\}/g, "").trim();
      }

      // 遍历汉字生成注音
      for (const char of text) {
        if (/[\u4e00-\u9fa5]/.test(char)) {
          charDictionary[char] = {
            initial,
            final: currentFinal,
            tone,
            originalTone,
            pron: `${initial}${currentFinal}${tone}`,
            note
          };
        }
      }
    }
  }

  // 生成插件字典
  const pluginDir = path.join(__dirname, "../chrome-extension");
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);
  
  const dictCode = `const CHAR_DICT = ${JSON.stringify(charDictionary, null, 2)};`;
  fs.writeFileSync(path.join(pluginDir, "dict.js"), dictCode, "utf8");

  
  console.log("字典生成完成！");
}

buildChromeDict();