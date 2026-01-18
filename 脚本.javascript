// ========== 核心功能逻辑 ==========
// 延迟函数
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// 全局控制变量 - 调整默认参数核心位置
let isRunning = false;
let toolboxConfig = {
    maxCount: 99,          // 单次选择数量（默认99）
    delayAfterSelect: 3000,// 选择图片后延迟(ms)（默认3000）
    delayAfterDownload: 5000,// 触发下载后延迟(ms)（默认5000）
    delayAfterUnselect: 3000,// 取消选中后延迟(ms)（默认3000）
    delayAfterDeleteBtn: 3000,// 点击删除按钮后延迟(ms)（默认3000）
    delayAfterConfirmDel: 3000,// 点击确认删除后延迟(ms)（默认3000）
    delayLoopInterval: 2000 // 循环间隔延迟(ms)（默认2000）
};

// 读取工具箱配置（从输入框获取并校验）
function getToolboxConfig() {
    const getNum = (id, defaultValue) => {
        const el = document.getElementById(id);
        const num = parseInt(el.value.trim());
        // 校验：非数字/负数则用默认值，并提示
        if (isNaN(num) || num < (id === 'maxCount' ? 1 : 0)) {
            el.value = defaultValue;
            alert(`⚠️ ${el.dataset.label}输入不合法，已重置为默认值${defaultValue}ms`);
            return defaultValue;
        }
        return num;
    };

    return {
        maxCount: getNum('maxCount', 99),
        delayAfterSelect: getNum('delayAfterSelect', 3000),
        delayAfterDownload: getNum('delayAfterDownload', 5000),
        delayAfterUnselect: getNum('delayAfterUnselect', 3000),
        delayAfterDeleteBtn: getNum('delayAfterDeleteBtn', 3000),
        delayAfterConfirmDel: getNum('delayAfterConfirmDel', 3000),
        delayLoopInterval: getNum('delayLoopInterval', 2000)
    };
}

// 单次处理函数（读取动态配置）
async function downloadOnce() {
    const config = getToolboxConfig(); // 每次执行都读取最新配置
    let allItems = Array.from(document.querySelectorAll('.photo-item:not(.photo-checked)'));

    if (allItems.length === 0) {
        alert("📦 没有更多图片了！");
        isRunning = false;
        updateToolboxStatus('已停止', '#666');
        return false;
    }

    // 执行选择操作
    const toSelect = allItems.slice(0, config.maxCount);
    toSelect.forEach(item => {
        const checkBtn = item.querySelector('.check-btn');
        checkBtn?.click();
    });
    console.log(`✅ 已选择 ${toSelect.length} 张图片`);
    await delay(config.delayAfterSelect);

    // 点击下载按钮
    const downloadBtn = document.querySelector('.yk-icon-datuxiazai');
    if (!downloadBtn) {
        alert("❌ 找不到下载按钮");
        isRunning = false;
        updateToolboxStatus('已停止', '#666');
        return false;
    }
    downloadBtn.click();
    console.log("📥 下载已触发，等待加载...");
    await delay(config.delayAfterDownload);

    // 取消选中
    toSelect.forEach(item => {
        const checkBtn = item.querySelector('.check-btn');
        checkBtn?.click();
    });
    await delay(config.delayAfterUnselect);

    // 点击删除按钮
    document.querySelector('.right-btn .yk-icon-trash')?.click();
    await delay(config.delayAfterDeleteBtn);

    // 自动点击确认删除按钮（兼容多类样式）
    const confirmBtn = document.querySelector('.popover-content .confirm') || 
                       document.querySelector('.el-button--primary.confirm') || 
                       document.querySelector('[class*="confirm"]') ||
                       document.querySelector('.confirm-btn');
    if (confirmBtn) {
        confirmBtn.click();
        console.log("🗑️ 已自动点击删除确认按钮");
    } else {
        console.warn("⚠️ 未找到删除确认按钮，可能需要手动点击");
    }
    await delay(config.delayAfterConfirmDel);

    return true;
}

// 循环执行函数
async function downloadLoop() {
    if (isRunning) return;
    isRunning = true;
    const config = getToolboxConfig();
    updateToolboxStatus('运行中', '#409EFF');
    console.log("🔄 开始循环处理图片，当前配置：", config);
    
    while (isRunning) {
        const hasMore = await downloadOnce();
        if (!hasMore) {
            console.log("🏁 循环处理完成");
            alert("🎉 所有图片处理完成！");
            break;
        }
        await delay(config.delayLoopInterval);
    }
    isRunning = false;
    updateToolboxStatus('已停止', '#666');
}

// 停止循环函数
function stopDownload() {
    isRunning = false;
    updateToolboxStatus('已停止', '#666');
    console.log("🛑 已停止循环处理");
    // 可选：轻提示，不弹窗避免打断
    showToolboxTip('操作已停止');
}

// ========== 工具箱UI及交互 ==========
// 更新工具箱状态
function updateToolboxStatus(text, color) {
    const statusEl = document.getElementById('toolboxStatus');
    statusEl.innerText = text;
    statusEl.style.color = color;
}

// 工具箱轻提示
function showToolboxTip(text) {
    const tipEl = document.getElementById('toolboxTip');
    tipEl.innerText = text;
    tipEl.style.opacity = '1';
    setTimeout(() => {
        tipEl.style.opacity = '0';
    }, 2000);
}

// 创建悬浮工具箱
(function createToolbox() {
    // 1. 创建工具箱主容器
    const toolbox = document.createElement('div');
    toolbox.id = 'photoToolbox';
    toolbox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        width: 320px;
        background: #fff;
        border: 1px solid #e6e6e6;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        padding: 15px;
        font-family: sans-serif;
        user-select: none;
        box-sizing: border-box;
    `;

    // 2. 创建工具箱头部（可拖动）
    const toolboxHeader = document.createElement('div');
    toolboxHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 10px;
        cursor: move;
    `;
    toolboxHeader.innerHTML = `
        <h4 style="margin:0; color:#333; font-size:14px;">📷 图片批量处理工具箱</h4>
        <span id="toolboxStatus" style="font-size:12px; color:#666;">已停止</span>
    `;

    // 3. 创建配置项容器
    const configContainer = document.createElement('div');
    configContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 10px;
        margin-bottom: 15px;
    `;

    // 配置项列表 - 调整默认值核心位置
    const configItems = [
        { label: '单次选择数量', id: 'maxCount', defaultValue: 99, placeholder: '请输入≥1的数字' },
        { label: '选择后延迟(ms)', id: 'delayAfterSelect', defaultValue: 3000, placeholder: '如：3000' },
        { label: '下载后延迟(ms)', id: 'delayAfterDownload', defaultValue: 5000, placeholder: '如：5000' },
        { label: '取消选中延迟(ms)', id: 'delayAfterUnselect', defaultValue: 3000, placeholder: '如：3000' },
        { label: '删除按钮延迟(ms)', id: 'delayAfterDeleteBtn', defaultValue: 3000, placeholder: '如：3000' },
        { label: '确认删除延迟(ms)', id: 'delayAfterConfirmDel', defaultValue: 3000, placeholder: '如：3000' },
        { label: '循环间隔延迟(ms)', id: 'delayLoopInterval', defaultValue: 2000, placeholder: '如：2000' },
    ];

    // 生成配置项输入框
    configItems.forEach(item => {
        const label = document.createElement('label');
        label.style.cssText = `
            font-size: 12px;
            color: #666;
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;
        label.innerHTML = `
            <span>${item.label}</span>
            <input 
                type="number" 
                id="${item.id}" 
                value="${item.defaultValue}" 
                placeholder="${item.placeholder}"
                style="
                    padding: 6px 8px;
                    border: 1px solid #e6e6e6;
                    border-radius: 4px;
                    font-size: 12px;
                    outline: none;
                "
            >
        `;
        configContainer.appendChild(label);
    });

    // 4. 创建按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
    `;
    btnContainer.innerHTML = `
        <button id="startBtn" style="
            flex: 1;
            padding: 8px 0;
            background: #409EFF;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        ">开始循环处理</button>
        <button id="stopBtn" style="
            flex: 1;
            padding: 8px 0;
            background: #F56C6C;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        ">停止操作</button>
    `;

    // 5. 创建轻提示容器
    const tipContainer = document.createElement('div');
    tipContainer.id = 'toolboxTip';
    tipContainer.style.cssText = `
        font-size: 12px;
        color: #999;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s;
    `;

    // 6. 组装工具箱
    toolbox.appendChild(toolboxHeader);
    toolbox.appendChild(configContainer);
    toolbox.appendChild(btnContainer);
    toolbox.appendChild(tipContainer);
    document.body.appendChild(toolbox);

    // ========== 工具箱拖动功能 ==========
    let isDragging = false;
    let startX, startY, offsetX, offsetY;

    toolboxHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        // 获取鼠标初始位置
        startX = e.clientX;
        startY = e.clientY;
        // 获取工具箱当前偏移
        const rect = toolbox.getBoundingClientRect();
        offsetX = startX - rect.left;
        offsetY = startY - rect.top;
        // 提升层级避免被遮挡
        toolbox.style.zIndex = '999999';
        toolbox.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        // 计算新位置
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;
        // 限制在可视区域内（可选）
        const maxLeft = window.innerWidth - toolbox.offsetWidth;
        const maxTop = window.innerHeight - toolbox.offsetHeight;
        toolbox.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
        toolbox.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        toolbox.style.right = 'auto'; // 取消right定位，改用left
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        toolbox.style.cursor = 'move';
    });

    // ========== 按钮绑定事件 ==========
    document.getElementById('startBtn').addEventListener('click', downloadLoop);
    document.getElementById('stopBtn').addEventListener('click', stopDownload);

    // 提示工具箱已创建
    console.log("✅ 图片批量处理工具箱已创建！");
    showToolboxTip('工具箱已就绪');
})();
