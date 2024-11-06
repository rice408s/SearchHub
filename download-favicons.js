const searchEngines = [
  {
    name: 'Google',
    favicon: 'https://www.google.com/favicon.ico',
    searchUrl: 'https://www.google.com/search?q='
  },
  {
    name: 'Bing',
    favicon: 'https://www.bing.com/favicon.ico',
    searchUrl: 'https://www.bing.com/search?q='
  },
  {
    name: 'DuckDuckGo',
    favicon: 'https://duckduckgo.com/favicon.ico',
    searchUrl: 'https://duckduckgo.com/?q='
  },
  {
    name: 'Xiaohongshu',
    favicon: 'https://www.xiaohongshu.com/favicon.ico',
    searchUrl: 'https://www.xiaohongshu.com/search_result?keyword='
  },
  {
    name: 'Perplexity',
    favicon: 'https://www.perplexity.ai/favicon.ico',
    searchUrl: 'https://www.perplexity.ai/search?q='
  },
  {
    name: 'WeixinSogou',
    favicon: 'https://weixin.sogou.com/favicon.ico',
    searchUrl: 'https://weixin.sogou.com/weixin?type=2&query='
  },
  {
    name: 'X',
    favicon: 'https://x.com/favicon.ico',
    searchUrl: 'https://x.com/search?q='
  }
];

async function downloadFavicons() {
  for (const engine of searchEngines) {
    try {
      const response = await fetch(engine.favicon);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = function() {
        localStorage.setItem(`favicon_${engine.name}`, reader.result);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(`下载 ${engine.name} 的favicon失败:`, error);
    }
  }
}

downloadFavicons(); 