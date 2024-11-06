// 创建弹窗容器
function createPopupContainer() {
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.id = 'quick-search-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    z-index: 999998;
    display: none;
  `;

  // 创建弹窗容器
  const container = document.createElement('div');
  container.id = 'quick-search-popup';
  container.style.cssText = `
    position: fixed;
    top: 25%;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 999999;
    display: none;
  `;

  // 添加点击遮罩层关闭弹窗的功能
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      container.style.display = 'none';
    }
  });

  document.body.appendChild(overlay);
  document.body.appendChild(container);
  return { overlay, container };
}

// 添加ESC监听
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('quick-search-overlay');
    const container = document.getElementById('quick-search-popup');
    if (container && container.style.display === 'block') {
      overlay.style.display = 'none';
      container.style.display = 'none';
    }
  }
});

// 监听来自iframe的消息
window.addEventListener('message', (event) => {
  if (event.data === 'closePopup') {
    const overlay = document.getElementById('quick-search-overlay');
    const container = document.getElementById('quick-search-popup');
    if (container) {
      overlay.style.display = 'none';
      container.style.display = 'none';
    }
  }
});

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理ping消息
  if (request.action === 'ping') {
    sendResponse('pong');
    return;
  }
  
  if (request.action === 'togglePopup') {
    const elements = document.getElementById('quick-search-popup') ? 
      {
        overlay: document.getElementById('quick-search-overlay'),
        container: document.getElementById('quick-search-popup')
      } : createPopupContainer();
    
    elements.overlay.style.display = elements.container.style.display === 'none' ? 'block' : 'none';
    elements.container.style.display = elements.container.style.display === 'none' ? 'block' : 'none';
    
    if (elements.container.style.display === 'block') {
      // 加载popup内容
      elements.container.innerHTML = '<iframe src="' + chrome.runtime.getURL('popup/popup.html') + '" frameborder="0" style="width: 400px; height: 120px;"></iframe>';
    }
  }
}); 