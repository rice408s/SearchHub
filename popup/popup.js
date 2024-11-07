document.addEventListener('DOMContentLoaded', async function() {
  const baseSearchEngines = [
    {
      name: 'Google',
      searchUrl: 'https://www.google.com/search?q='
    },
    {
      name: 'Bing',
      searchUrl: 'https://www.bing.com/search?q='
    },
    {
      name: 'DuckDuckGo',
      searchUrl: 'https://duckduckgo.com/?q='
    },
    {
      name: 'Xiaohongshu',
      searchUrl: 'https://www.xiaohongshu.com/search_result?keyword='
    },
    {
      name: 'Perplexity',
      searchUrl: 'https://www.perplexity.ai/search?q='
    },
    {
      name: 'WeixinSogou',
      searchUrl: 'https://weixin.sogou.com/weixin?type=2&query='
    },
    {
      name: 'X',
      searchUrl: 'https://x.com/search?q='
    }
  ];

  function getSearchCounts() {
    return JSON.parse(localStorage.getItem('searchCounts') || '{}');
  }

  function updateSearchCount(engineName) {
    const counts = getSearchCounts();
    counts[engineName] = (counts[engineName] || 0) + 1;
    localStorage.setItem('searchCounts', JSON.stringify(counts));
    return counts;
  }

  function getSortedEngines() {
    const counts = getSearchCounts();
    return baseSearchEngines.sort((a, b) => {
      return (counts[b.name] || 0) - (counts[a.name] || 0);
    });
  }

  const engineIcons = document.getElementById('engineIcons');
  const searchInput = document.getElementById('searchInput');

  function createLetterIcon(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = getColorForLetter(name[0]);
    ctx.beginPath();
    ctx.arc(12, 12, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name[0].toUpperCase(), 12, 12);
    
    return canvas.toDataURL();
  }

  function getColorForLetter(letter) {
    const colors = [
      '#4285F4', '#34A853', '#FBBC05', '#EA4335',
      '#1DB954', '#FF9900', '#00B2FF', '#7B1FA2'
    ];
    return colors[letter.charCodeAt(0) % colors.length];
  }

  function performSearch(engine) {
    const query = encodeURIComponent(searchInput.value);
    if (query) {
      updateSearchCount(engine.name);
      window.open(engine.searchUrl + query, '_blank');
      window.parent.postMessage('closePopup', '*');
    }
  }

  let currentEngineIndex = 0; // 当前选中的搜索引擎索引

  function renderEngineIcons() {
    engineIcons.innerHTML = '';
    const sortedEngines = getSortedEngines();
    
    sortedEngines.forEach((engine, index) => {
      const icon = document.createElement('img');
      icon.className = 'engine-icon';
      if (index === currentEngineIndex) {
        icon.classList.add('selected');
      }
      
      const storedIcon = localStorage.getItem(`favicon_${engine.name}`);
      if (storedIcon) {
        icon.src = storedIcon;
        icon.onerror = () => {
          icon.src = createLetterIcon(engine.name);
        };
      } else {
        icon.src = createLetterIcon(engine.name);
      }
      
      icon.title = engine.name;
      icon.addEventListener('click', () => performSearch(engine));
      engineIcons.appendChild(icon);
    });
  }

  // 处理Tab键切换搜索引擎
  searchInput.addEventListener('keydown', (e) => {
    const sortedEngines = getSortedEngines();
    
    if (e.key === 'Tab') {
      e.preventDefault(); // 阻止默认的Tab行为
      
      if (e.shiftKey) {
        // Shift+Tab 向前切换
        currentEngineIndex = (currentEngineIndex - 1 + sortedEngines.length) % sortedEngines.length;
      } else {
        // Tab 向后切换
        currentEngineIndex = (currentEngineIndex + 1) % sortedEngines.length;
      }
      
      renderEngineIcons(); // 重新渲染以更新选中状态
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (sortedEngines.length > 0) {
        performSearch(sortedEngines[currentEngineIndex]); // 使用当前选中的搜索引擎
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.parent.postMessage('closePopup', '*');
    }
  });

  // 获取选中文本并填充搜索框
  async function fillSearchInput() {
    try {
      // 首先尝试获取页面选中的文本
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否可以执行脚本
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        try {
          const selectedText = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString().trim()
          });

          if (selectedText && selectedText[0].result) {
            searchInput.value = selectedText[0].result;
            searchInput.select();
            return;
          }
        } catch (error) {
          console.error('获取选中文本失败:', error);
        }
      }

      // 检查剪贴板内容
      const textArea = document.createElement('textarea');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      
      try {
        const successful = document.execCommand('paste');
        if (successful) {
          const currentClipboardContent = textArea.value.trim();
          const lastClipboardContent = localStorage.getItem('lastClipboardContent');
          const hasBeenFilled = localStorage.getItem('hasBeenFilled') === 'true';

          if (currentClipboardContent) {
            // 如果是新的剪贴板内容，或者是第一次打开
            if (currentClipboardContent !== lastClipboardContent || !hasBeenFilled) {
              searchInput.value = currentClipboardContent;
              searchInput.select();
              localStorage.setItem('lastClipboardContent', currentClipboardContent);
              localStorage.setItem('hasBeenFilled', 'true');
            }
          }
        }
      } catch (err) {
        console.error('execCommand paste failed:', err);
      } finally {
        document.body.removeChild(textArea);
      }

    } catch (error) {
      console.error('fillSearchInput error:', error);
    }
  }

  // 确保在DOM加载完成后立即执行
  setTimeout(fillSearchInput, 100);
  setTimeout(() => {
    renderEngineIcons();
    searchInput.focus();
  }, 150);  // 稍微延后于fillSearchInput执行

  renderEngineIcons();
  searchInput.focus();
}); 