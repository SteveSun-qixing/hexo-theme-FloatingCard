// 配置模块：存储全局配置参数
const config = {
    // 基础卡片宽度，取窗口宽度的1/6和200px中的较小值
    baseCardWidth: Math.min(window.innerWidth / 6, 200),
    // 基础卡片高度，为宽度的3/4
    get baseCardHeight() { return this.baseCardWidth * 0.75; },
    // 页面中心X坐标
    get centerX() { return window.innerWidth / 2; },
    // 页面中心Y坐标
    get centerY() { return window.innerHeight / 2; },
    // 外层椭圆宽度，为窗口宽度的35%
    get ellipseWidth1() { return window.innerWidth * 0.35; },
    // 外层椭圆高度，为窗口高度的46.67%
    get ellipseHeight1() { return window.innerHeight * 0.4667; },
    // 内层椭圆宽度，为窗口宽度的25%
    get ellipseWidth2() { return window.innerWidth * 0.25; },
    // 内层椭圆高度，为窗口高度的33.33%
    get ellipseHeight2() { return window.innerHeight * 0.3333; },
    // 头像大小，取窗口高度和宽度的1/3中的较小值
    get avatarSize() { return Math.min(window.innerHeight / 3, window.innerWidth / 3); },
    // 头像图片URL
    avatarUrl: 'img/touxiang_big.webp',
    // 最片数量
    maxCards: 8,
    // 卡片重叠阈值
    overlapThreshold: 0.1,
    // 最小距离因子
    minDistanceFactor: 0.5,
    // 屏幕边缘留白
    screenMargin: 20
};

// 全局状态：存储应用的当前状态
const state = {
    posts: [],        // 存储所有文章数据
    cards: [],        // 存储当前显示的卡片
    currentPostIndex: 0  // 当前文章索引
};

// 工具函数模块：提供各种辅助函数
const utils = {
    // 计算卡片重叠面积比例
    calculateOverlap(x, y, width, height) {
        let totalOverlap = 0;
        state.cards.forEach(card => {
            const overlapX = Math.max(0, Math.min(x + width, card.x + card.width) - Math.max(x, card.x));
            const overlapY = Math.max(0, Math.min(y + height, card.y + card.height) - Math.max(y, card.y));
            totalOverlap += overlapX * overlapY;
        });
        return totalOverlap / (width * height);  // 返回重叠比例
    },

    // 检查位置是否有效（不与其他卡片重叠过多，不超出屏幕边界）
    isValidPosition(x, y, width, height) {
        const minDistance = Math.min(width, height) * config.minDistanceFactor;  // 最小允许距离
        // 检查是否超出屏幕边界
        if (x < config.screenMargin || y < config.screenMargin || 
            x + width > window.innerWidth - config.screenMargin || 
            y + height > window.innerHeight - config.screenMargin) {
            return false;
        }
        // 检查重叠度和最小距离
        return utils.calculateOverlap(x, y, width, height) < config.overlapThreshold &&
            state.cards.every(card => Math.hypot(x - card.x, y - card.y) > minDistance);
    },

    // 获取随机位置
    getRandomPosition(width, height) {
        let x, y, angle, scale;
        let attempts = 0;
        do {
            angle = Math.random() * 2 * Math.PI;  // 随机角度
            scale = 0.9 + Math.random() * 0.2;  // 随机缩放（0.9到1.1之间）
            const isFirstLayer = Math.random() < 0.5;  // 随机选择内外层
            const ellipseWidth = isFirstLayer ? config.ellipseWidth1 : config.ellipseWidth2;
            const ellipseHeight = isFirstLayer ? config.ellipseHeight1 : config.ellipseHeight2;
            // 计算椭圆上的随机位置
            x = config.centerX + ellipseWidth * Math.cos(angle) - width / 2;
            y = config.centerY + ellipseHeight * Math.sin(angle) - height / 2;
            attempts++;
            if (attempts > 100) {
                console.log("无法找到合适的位置");
                return null;
            }
        } while (!utils.isValidPosition(x, y, width, height) || utils.isOverlappingAvatar(x, y, width, height));

        return { x, y, scale };
    },

    // 生成随机柔和色
    generateRandomPastelColor() {
        const hue = Math.random() * 360;
        return {
            pastelColor: `hsl(${hue}, 100%, 85%)`,
            borderColor: `hsl(${hue}, 100%, 70%)`
        };
    },

    // 生成边框样式
    generateBorderStyles(borderColor) {
        return {
            border: `2px solid ${borderColor}`,
            boxShadow: `0 8px 16px rgba(0, 0, 0, 0.2)`
        };
    },

    // 节流函数：限制函数的执行频率
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // 检查是否与头像重叠
    isOverlappingAvatar(x, y, width, height) {
        const avatarLeft = config.centerX - config.avatarSize / 2;
        const avatarTop = config.centerY - config.avatarSize / 2;
        const avatarRight = avatarLeft + config.avatarSize;
        const avatarBottom = avatarTop + config.avatarSize;

        return !(x + width < avatarLeft || 
                 x > avatarRight || 
                 y + height < avatarTop || 
                 y > avatarBottom);
    }
};

// 卡片模块：处理卡片的创建、移除和添加
const cardModule = {
    // 创建新卡片
    createCard(post) {
        let width = config.baseCardWidth;
        let height = config.baseCardHeight;
        const position = utils.getRandomPosition(width, height);
        
        if (!position) {
            return null;
        }

        const { x, y, scale } = position;
        width *= scale;
        height *= scale;

        // 生成卡片颜色和边框样式
        const { pastelColor, borderColor } = utils.generateRandomPastelColor();
        const { border, boxShadow } = utils.generateBorderStyles(borderColor);

        // 生成随机浮动参数
        const floatX1 = (Math.random() - 0.5) * 40;
        const floatY1 = (Math.random() - 0.5) * 40;
        const floatX2 = (Math.random() - 0.5) * 40;
        const floatY2 = (Math.random() - 0.5) * 40;
        const floatX3 = (Math.random() - 0.5) * 40;
        const floatY3 = (Math.random() - 0.5) * 40;
        const floatRotate1 = (Math.random() - 0.5) * 10;
        const floatRotate2 = (Math.random() - 0.5) * 10;
        const floatRotate3 = (Math.random() - 0.5) * 10;

        // 创建卡片DOM元素
        const card = document.createElement('div');
        card.className = 'card';
        card.style.left = x + 'px';
        card.style.top = y + 'px';
        card.style.width = width + 'px';
        card.style.height = height + 'px';
        card.style.backgroundColor = pastelColor;
        card.style.border = border;
        card.style.boxShadow = boxShadow;
        
        // 添加随机动画延迟和浮动参数
        card.style.setProperty('--delay', Math.random() * 10);
        card.style.setProperty('--float-x1', `${floatX1}px`);
        card.style.setProperty('--float-y1', `${floatY1}px`);
        card.style.setProperty('--float-x2', `${floatX2}px`);
        card.style.setProperty('--float-y2', `${floatY2}px`);
        card.style.setProperty('--float-x3', `${floatX3}px`);
        card.style.setProperty('--float-y3', `${floatY3}px`);
        card.style.setProperty('--float-rotate1', `${floatRotate1}deg`);
        card.style.setProperty('--float-rotate2', `${floatRotate2}deg`);
        card.style.setProperty('--float-rotate3', `${floatRotate3}deg`);

        // 设置卡片内容
        card.innerHTML = `
            <h3>${post.title}</h3>
            <p>${new Date(post.date).toLocaleDateString()}</p>
        `;

        // 添加点击事件监听器
        card.addEventListener('click', function(event) {
            console.log('卡片被点击', post.title);
            event.stopPropagation(); // 阻止事件冒泡
            // 导航到文章页面，在新标签页打开
            if (post.path) {
                // 构建完整的 URL
                const fullUrl = new URL(post.path, window.location.origin).href;
                console.log('跳转到:', fullUrl);
                window.open(fullUrl, '_blank'); // 使用 '_blank' 在新标签页打开
            } else {
                console.error('文章缺少 path:', post.title);
            }
        });

        // 添加鼠标进入事件监听器
        card.addEventListener('mouseenter', function() {
            console.log('鼠标进入卡片', post.title);
            card.style.boxShadow = `0 0 20px ${pastelColor}, 0 0 40px ${pastelColor}`;
            card.classList.add('card-pause'); // 添加暂停类
            card.style.zIndex = '1000'; // 将卡片移到最上层
        });

        // 添加鼠标离开事件监听器
        card.addEventListener('mouseleave', function() {
            console.log('鼠标离开卡片', post.title);
            card.style.boxShadow = boxShadow; // 恢复原始阴影
            card.classList.remove('card-pause'); // 移除暂停类
            card.style.zIndex = '10'; // 恢复原来的 z-index
        });

        console.log('卡片创建完成', post.title); // 调试信息

        // 将卡片添加到容器中
        document.getElementById('card-container').appendChild(card);
        
        // 返回卡片对象
        return {x, y, width, height, element: card, post: post};
    },

    // 移除最旧的卡片
    removeNextCard() {
        if (state.cards.length === 0) return;
        const card = state.cards.shift();  // 移除并获取最旧的卡片
        // 添加移除动画
        card.element.style.transform = 'translateY(100vh)';
        card.element.style.opacity = '0';
        
        // 延迟后从DOM中移除卡片
        setTimeout(() => {
            document.getElementById('card-container').removeChild(card.element);
        }, 500);
    },

    // 添加新卡片
    addNewCard() {
        if (state.cards.length >= config.maxCards) {
            cardModule.removeNextCard();  // 如果卡片数量达到上限，移除一个旧卡片
        }
        if (state.posts.length > 0) {
            const post = state.posts[state.currentPostIndex];
            const newCard = cardModule.createCard(post);
            if (newCard) {
                state.cards.push(newCard);
                // 添加出现动画
                setTimeout(() => {
                    newCard.element.style.opacity = '1';
                    newCard.element.classList.add('card-new');
                    setTimeout(() => {
                        newCard.element.classList.add('card-float');
                    }, 600);
                }, 50);
            }
            state.currentPostIndex = (state.currentPostIndex + 1) % state.posts.length; // 循环索引
        }
    }
};

// 初始化模块：处理页面初始化和事件监听
const initModule = {
    // 初始化卡片
    initializeCards() {
        // 创建头像元素
        const avatar = document.createElement('img');
        avatar.src = config.avatarUrl;
        avatar.className = 'avatar';
        avatar.style.width = `${config.avatarSize}px`;
        avatar.style.height = `${config.avatarSize}px`;
        avatar.style.position = 'absolute';
        avatar.style.left = `${config.centerX - config.avatarSize / 2}px`;
        avatar.style.top = `${config.centerY - config.avatarSize / 2}px`;
        avatar.style.borderRadius = '50%';
        avatar.style.zIndex = '1000'; // 确保头像在卡片上方
        avatar.style.objectFit = 'cover'; // 确保图片填充整个圆形区域
        document.getElementById('card-container').appendChild(avatar);

        // 初始化卡片
        for (let i = 0; i < config.maxCards && i < state.posts.length; i++) {
            const post = state.posts[state.currentPostIndex];
            const card = cardModule.createCard(post);
            if (card) {
                state.cards.push(card);
                card.element.style.opacity = '1';
                // 添加浮动动画
                setTimeout(() => {
                    card.element.classList.add('card-float');
                }, 50);
            }
            state.currentPostIndex = (state.currentPostIndex + 1) % state.posts.length; // 循环索引
        }
    },

    // 初始化事件监听器
    initializeEventListeners() {
        // 添加滚轮事件监听器，使用节流函数限制执行频率
        const throttledScrollHandler = utils.throttle(() => {
            cardModule.addNewCard();
        }, 500);

        window.addEventListener('wheel', throttledScrollHandler);
        // 添加窗口大小改变事件监听器，使用节流函数限制执行频率
        window.addEventListener('resize', utils.throttle(this.handleResize, 200));
    },

    // 处理窗口大小改变
    handleResize() {
        // 更新配置
        Object.keys(config).forEach(key => {
            if (typeof config[key] === 'function') {
                config[key] = config[key].bind(config)();
            }
        });

        // 更新头像
        const avatar = document.querySelector('.avatar');
        if (avatar) {
            avatar.style.width = `${config.avatarSize}px`;
            avatar.style.height = `${config.avatarSize}px`;
            avatar.style.left = `${config.centerX - config.avatarSize / 2}px`;
            avatar.style.top = `${config.centerY - config.avatarSize / 2}px`;
        }

        // 重新布局卡片
        state.cards.forEach(card => {
            const newPosition = utils.getRandomPosition(card.width, card.height);
            if (newPosition) {
                Object.assign(card, newPosition);
                Object.assign(card.element.style, {
                    left: `${card.x}px`,
                    top: `${card.y}px`,
                    width: `${card.width}px`,
                    height: `${card.height}px`
                });
            }
        });
    }
};

// 主函数：页面加载时执行的主要逻辑
function main() {
    // 检查当前页面是否为主页
    const isHomePage = document.body.classList.contains('home-page');

    if (isHomePage && window.hexoPostsData) {
        state.posts = window.hexoPostsData;
        console.log('Posts data loaded:', state.posts);
        // 详细检查每篇文章的属性
        state.posts.forEach((post, index) => {
            console.log(`文章 ${index + 1}:`);
            console.log('标题:', post.title);
            console.log('所有属性:', Object.keys(post));
            if (post.path) {
                console.log('path:', post.path);
                // 确保 path 以 '/' 开头
                if (!post.path.startsWith('/')) {
                    post.path = '/' + post.path;
                }
                // 确保 path 包含 '.html'
                if (!post.path.endsWith('.html')) {
                    post.path += '.html';
                }
            }
            if (post.permalink) console.log('permalink:', post.permalink);
            if (post.slug) console.log('slug:', post.slug);
            if (post.abbrlink) console.log('abbrlink:', post.abbrlink);
            console.log('完整post对象:', post);
            console.log('---');
        });
        initModule.initializeCards();
        initModule.initializeEventListeners();
    } else if (!isHomePage) {
        console.log('This is not the home page, not initializing cards.');
    } else {
        console.error('Hexo posts data not found');
    }
}

// 页面加载时执行主函数
window.addEventListener('load', main);