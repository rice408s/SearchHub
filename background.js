// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    togglePopup();
  }
});

// 监听工具栏图标点击
if (chrome.action) {
  chrome.action.onClicked.addListener(() => {
    togglePopup();
  });
}

// 切换弹窗显示
async function togglePopup() {
  try {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs[0]) return;

    const tab = tabs[0];
    
    // 检查是否是受限页面
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      console.log('不支持在此页面使用搜索功能');
      return;
    }

    // 对于Bing搜索页面的特殊处理
    if (tab.url.includes('bing.com/search')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // 移除可能存在的旧实例
            const oldOverlay = document.getElementById('quick-search-overlay');
            const oldPopup = document.getElementById('quick-search-popup');
            if (oldOverlay) oldOverlay.remove();
            if (oldPopup) oldPopup.remove();
          }
        });
      } catch (e) {
        console.error('清理旧实例失败:', e);
      }
    }

    try {
      // 尝试向已存在的content script发送消息
      await chrome.tabs.sendMessage(tab.id, {action: 'ping'});
    } catch (e) {
      // 如果content script不存在，注入它
      console.log('注入content script...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // 对于Bing搜索页面，额外注入样式
      if (tab.url.includes('bing.com/search')) {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
      }
    }

    // 发送切换弹窗的消息
    await chrome.tabs.sendMessage(tab.id, {action: 'togglePopup'});
    
  } catch (error) {
    console.error('togglePopup error:', error);
    // 如果出错，尝试重新注入content script
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await chrome.tabs.sendMessage(tab.id, {action: 'togglePopup'});
    } catch (retryError) {
      console.error('重试失败:', retryError);
    }
  }
}

// 确保扩展启动时注册命令
chrome.runtime.onInstalled.addListener(() => {
  chrome.commands.getAll((commands) => {
    console.log('已注册的命令:', commands);
  });
}); 