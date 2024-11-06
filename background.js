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
function togglePopup() {
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    if (tabs[0]) {
      // 检查是否是chrome://页面
      if (tabs[0].url.startsWith('chrome://')) {
        alert('此页面不支持搜索功能');
        return;
      }
      
      try {
        // 先检查content script是否已经注入
        try {
          await chrome.tabs.sendMessage(tabs[0].id, {action: 'ping'});
        } catch {
          // 如果没有注入，则注入content script
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          });
        }
        // 发送切换弹窗的消息
        chrome.tabs.sendMessage(tabs[0].id, {action: 'togglePopup'});
      } catch (error) {
        console.error('Error:', error);
        alert('无法在此页面使用搜索功能');
      }
    }
  });
} 