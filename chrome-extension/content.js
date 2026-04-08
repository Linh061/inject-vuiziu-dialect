(function() {
  'use strict';

  // 1. 字典检查
  if (typeof CHAR_DICT === 'undefined') {
    console.error('字典未加载');
    return;
  }
  console.log('字典加载成功，共收录汉字：', Object.keys(CHAR_DICT).length);

  // 标记已处理，防止重复
  const MARK = 'hzDone';

  // 2. 给单个文字加注音
  function addRuby(char) {
    const pron = CHAR_DICT[char]?.pron;
    if (!pron) return document.createTextNode(char);

    const ruby = document.createElement('ruby');
    ruby.className = 'hz-dialect-ruby';
    
    const rb = document.createElement('rb');
    rb.textContent = char;
    
    const rt = document.createElement('rt');
    rt.className = 'hz-dialect-pron';
    rt.textContent = pron;
    
    ruby.append(rb, rt);
    return ruby;
  }

  // 3. 暴力处理文本节点
  function processText(element) {
    if (!element || element[MARK]) return;
    if (['SCRIPT','STYLE','BUTTON','INPUT','IFRAME','RUBY'].includes(element.tagName)) return;

    element[MARK] = true;
    const childNodes = Array.from(element.childNodes);

    childNodes.forEach(node => {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const frag = document.createDocumentFragment();
        node.textContent.split('').forEach(c => frag.appendChild(addRuby(c)));
        node.replaceWith(frag);
      } else if (node.nodeType === 1) {
        processText(node);
      }
    });
  }

  // 4. 强制扫描百度百科所有正文区域
  function scanPage() {
    // 直接抓取百科所有正文标签，暴力处理
    const contents = document.querySelectorAll('p, div, span, h1, h2, h3, h4, dd, dt, .content, .lemma-wrap, .main-content');
    contents.forEach(el => processText(el));
    console.log('正文扫描完成');
  }

  // 5. 多次暴力扫描，适配动态页面
  setTimeout(scanPage, 300);
  setTimeout(scanPage, 800);
  window.addEventListener('load', () => setTimeout(scanPage, 500));

  console.log('插件启动成功');
})();