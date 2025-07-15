export function createBtn(content: string, className?: string) {
  const btn = document.createElement('button')
  btn.textContent = content
  if (className) {
    btn.className = className
  }

  return btn
}

/**
 * 创建测试卡片
 */
export function createCard(title: string, description: string) {
  const card = document.createElement('div')
  card.className = 'card'
  card.innerHTML = `
    <h2>${title}</h2>
    <p class="info">${description}</p>
  `
  return card
}

/**
 * 创建并注入页面样式
 */
export function injectStyles() {
  const style = document.createElement('style')
  style.textContent = `
    :root {
      --bg-color: #f0f4f8;
      --text-color: #333;
      --primary-color: #4a90e2;
      --secondary-color: #50e3c2;
      --card-bg: #ffffff;
      --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
      margin: 0;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      color: var(--primary-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      width: 100%;
      max-width: 1200px;
      margin-top: 2rem;
    }
    .card {
      background: var(--card-bg);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
    }
    .card h2 {
      margin-top: 0;
      color: var(--primary-color);
      border-bottom: 2px solid var(--secondary-color);
      padding-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .animation-box {
      width: 80px;
      height: 80px;
      background-color: var(--secondary-color);
      border-radius: 12px;
      margin-top: 1rem;
      position: relative;
    }
    button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-right: 0.5rem;
      margin-top: 1rem;
    }
    button:hover {
      background-color: #357abd;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .info {
      font-size: 0.9em;
      color: #666;
    }
    .flex-row {
      display: flex;
      gap: 1rem;
    }
  `
  document.head.appendChild(style)
}
