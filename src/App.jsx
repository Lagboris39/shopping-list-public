import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Check, ShoppingBag, Loader2, Server, GripVertical, Trash2, History, ListTodo, RefreshCcw, Search, AlertCircle, X, Calendar, PawPrint, Sun, Moon, Smartphone, Pointer, HelpCircle, Scale, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, Reorder, useDragControls, animate as springAnimate } from 'framer-motion';
import { getItems, saveItems, getHistory, saveHistory, getSetting, saveSetting, getLearnedCategories, saveLearnedCategory } from './db';
import { categoryDict, categoryColors, categoryNames, categoryIcons } from './categoryDict';

const overlayVariants = {
  hidden: { opacity: 0, pointerEvents: 'none' },
  visible: { opacity: 1, pointerEvents: 'auto' },
  exit: { opacity: 0, pointerEvents: 'none', transition: { duration: 0.15, ease: 'easeOut' } }
};

const drawerVariants = {
  hidden: { x: '100%', opacity: 0, pointerEvents: 'none' },
  visible: { x: 0, opacity: 1, pointerEvents: 'auto' },
  exit: { x: '100%', opacity: 0, pointerEvents: 'none', transition: { duration: 0.15, ease: 'easeOut' } }
};

const bottomSheetVariants = {
  hidden: { y: '100%', opacity: 0, pointerEvents: 'none' },
  visible: { y: 0, opacity: 1, pointerEvents: 'auto' },
  exit: { y: '100%', opacity: 0, pointerEvents: 'none', transition: { duration: 0.18, ease: 'easeOut' } }
};

const drawerTransition = {
  type: 'tween',
  duration: 0.2,
  ease: 'easeOut'
};

const SwipeableItem = ({ item, onPurchase, onDelete, onChangeCategory, onUpdateQuantity }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);
  const dragControls = useDragControls();
  const swipeDragControls = useDragControls();

  const spring = { type: 'spring', stiffness: 500, damping: 40 };

  const handleDragEnd = (event, info) => {
    if (info.offset.x < -60) {
      setIsRevealed(true);
      springAnimate(x, -70, spring);
    } else {
      setIsRevealed(false);
      springAnimate(x, 0, spring);
    }
  };

  const handleSwipePointerDown = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const saved = e;
    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      if (Math.hypot(dx, dy) < 8) return;
      window.removeEventListener('pointermove', onMove);
      if (Math.abs(dx) >= Math.abs(dy)) {
        swipeDragControls.start(saved);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', () => {
      window.removeEventListener('pointermove', onMove);
    }, { once: true });
  };

  const catColor = item.category ? categoryColors[item.category] : categoryColors.other;

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      className="draggable-item-container"
      dragListener={false}
      dragControls={dragControls}
      style={{ position: 'relative', borderRadius: 'var(--radius)' }}
    >
      <div className="swipe-bg-danger">
        <button onClick={() => onDelete(item.id)} className="swipe-delete-btn">
          <Trash2 size={24} />
        </button>
      </div>

      <motion.div
        style={{ x, backgroundColor: catColor, position: 'relative', zIndex: 2, boxShadow: 'var(--shadow)', touchAction: 'pan-y' }}
        drag="x"
        dragListener={false}
        dragControls={swipeDragControls}
        dragConstraints={{ left: -70, right: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        onPointerDown={handleSwipePointerDown}
        className="item-card"
        whileDrag={{ boxShadow: 'var(--shadow-lg)', scale: 1.02, zIndex: 10 }}
      >
        {/* 左: 1行コンテンツ */}
        <div className="item-main-area">
          <div className="item-row-single">
            <div
              className="drag-handle"
              onPointerDown={(e) => {
                e.stopPropagation();
                const timer = setTimeout(() => dragControls.start(e), 400);
                const cancel = () => clearTimeout(timer);
                window.addEventListener('pointerup', cancel, { once: true });
                window.addEventListener('pointercancel', cancel, { once: true });
              }}
            >
              <GripVertical size={18} />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                document.activeElement?.blur();
                onChangeCategory(item);
              }}
              className="category-select-btn item-cat-btn"
              title="タップしてカテゴリ変更"
            >
              <span>{categoryIcons[item.category || 'other']}</span>
              <span className="category-arrow">▼</span>
            </button>
            <span className="item-text">{item.name}</span>
          </div>
        </div>

        {/* 縦ステッパー */}
        <div className="qty-vertical">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, 1); }}
            className="qty-v-btn"
          >▲</button>
          <span className="qty-v-count">{item.quantity || 1}</span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, -1); }}
            className="qty-v-btn"
          >▼</button>
        </div>

        {/* 右: 購入ボタン */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { setIsRevealed(false); onPurchase(item.id); }}
          className="buy-button"
        >
          <Check size={26} strokeWidth={3} />
        </button>
      </motion.div>
    </Reorder.Item>
  );
};

const SwipeableHistoryItem = ({ item, onReAdd, onDelete, isAdded }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);
  const swipeDragControls = useDragControls();

  const spring = { type: 'spring', stiffness: 500, damping: 40 };

  const handleDragEnd = (event, info) => {
    if (info.offset.x < -50) {
      setIsRevealed(true);
      springAnimate(x, -60, spring);
    } else {
      setIsRevealed(false);
      springAnimate(x, 0, spring);
    }
  };

  const handleSwipePointerDown = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const saved = e;
    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      if (Math.hypot(dx, dy) < 8) return;
      window.removeEventListener('pointermove', onMove);
      if (Math.abs(dx) >= Math.abs(dy)) {
        swipeDragControls.start(saved);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', () => {
      window.removeEventListener('pointermove', onMove);
    }, { once: true });
  };

  const itemCategory = item.category ?? 'other';
  const catColor = categoryColors[itemCategory] || categoryColors.other;
  const catIcon = categoryIcons[itemCategory] || categoryIcons.other;

  return (
    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <div className="swipe-bg-danger" style={{ width: '60px' }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="swipe-delete-btn"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <motion.div
        style={{ x, backgroundColor: 'var(--card-bg)', position: 'relative', zIndex: 2, touchAction: 'pan-y' }}
        drag="x"
        dragListener={false}
        dragControls={swipeDragControls}
        dragConstraints={{ left: -60, right: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        onPointerDown={handleSwipePointerDown}
        className="history-item-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span
            className="history-category-badge"
            style={{ backgroundColor: catColor }}
            title={item.category}
          >
            {catIcon}
          </span>
          <span className="history-item-text">{item.name}</span>
        </div>
        {isAdded ? (
          <button disabled className="history-btn added">
            <Check size={16} /> 追加済み
          </button>
        ) : (
          <button onClick={() => { setIsRevealed(false); onReAdd(item.name); }} className="history-btn primary">
            <RefreshCcw size={16} /> 再登録
          </button>
        )}
      </motion.div>
    </div>
  );
};


function App() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [historyInput, setHistoryInput] = useState('');
  const [historyInputDate, setHistoryInputDate] = useState(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }));
  const [showDirectAdd, setShowDirectAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Theme and Menu states
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Text import and category state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [learnedCategories, setLearnedCategories] = useState({});
  const [categoryOrder, setCategoryOrder] = useState(Object.keys(categoryNames));
  const [selectedItemForCategory, setSelectedItemForCategory] = useState(null);
  const [isCategoryOrderMode, setIsCategoryOrderMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPriceCalc, setShowPriceCalc] = useState(false);
  const [calcA, setCalcA] = useState({ price: '', amount: '' });
  const [calcB, setCalcB] = useState({ price: '', amount: '' });
  const [listZoom, setListZoom] = useState(
    () => parseFloat(localStorage.getItem('listZoom') || '1')
  );

  const zoomIn  = () => { const v = Math.min(1.2, Math.round((listZoom + 0.1) * 10) / 10); setListZoom(v); localStorage.setItem('listZoom', String(v)); };
  const zoomOut = () => { const v = Math.max(0.6, Math.round((listZoom - 0.1) * 10) / 10); setListZoom(v); localStorage.setItem('listZoom', String(v)); };

  const reorderSaveTimeoutRef = useRef(null);
  const categoryOrderSaveTimeoutRef = useRef(null);


  const dismissTutorial = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  useEffect(() => {
    const applyTheme = (t) => {
      const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      const dbItems = await getItems();
      const dbHistory = await getHistory();
      const dbLearned = await getLearnedCategories();
      const dbCatOrder = await getSetting('categoryOrder');
      setItems(dbItems || []);
      setHistory(dbHistory || []);
      setLearnedCategories(dbLearned || {});
      if (dbCatOrder) setCategoryOrder(dbCatOrder);
      setLoading(false);
    };
    loadData();
  }, []);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // We keep fetchItems interface just for logical wrapper, but now it's local
  const fetchHistory = async () => {
    const dbHistory = await getHistory();
    setHistory(dbHistory || []);
  };

  const getInitialCategory = (name) => {
    const trimmedName = name.trim();
    const lowerName = trimmedName.toLowerCase();
    return categoryDict[trimmedName] || categoryDict[lowerName] || learnedCategories[trimmedName] || learnedCategories[lowerName] || "other";
  };

  const addSpecificItem = async (name) => {
    if (!name.trim()) return;

    if (name.trim().length > 50) {
      showError('50文字以内で入力してください');
      return;
    }

    if (items.length >= 100) {
      showError('リストの上限（100件）に達しています');
      return;
    }

    if (items.some(i => i.name.toLowerCase() === name.trim().toLowerCase())) {
      showError('すでにリストに入っています');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: name.trim(),
      category: getInitialCategory(name),
      created_at: new Date().toISOString(),
      order_index: items.length > 0 ? items[items.length - 1].order_index + 1 : 0
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    await saveItems(newItems);

    setNewItemName('');
    setIsFocused(false);

    showSuccess('リストに追加しました');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const addItem = async (e) => {
    e?.preventDefault();

    if (!newItemName.trim()) {
      // Blur if empty to close keyboard
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    await addSpecificItem(newItemName);
  };

  const addDirectlyToHistory = async (name, date) => {
    if (!name.trim()) return;
    const trimmedName = name.trim();
    const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    const purchaseDate = date || todayStr;

    // Future date check
    if (purchaseDate > todayStr) {
      showError('未来の日付は登録できません');
      return;
    }

    // Duplicate check (Case-insensitive) on the same date
    const isDuplicate = history.some(h =>
      h.purchased_date === purchaseDate &&
      h.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      showError(`「${trimmedName}」は既に${purchaseDate}の履歴に存在します`);
      return;
    }

    // Create new entry
    const newEntry = { id: Date.now().toString(), name: trimmedName, purchased_date: purchaseDate, category: getInitialCategory(trimmedName) };

    // Update history states
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    await saveHistory(newHistory);
    showSuccess(`「${trimmedName}」を${purchaseDate}の履歴に追加しました`);
  };

  const purchaseItem = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    await saveItems(newItems);

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

    // Add to history only if not already exists today (Case-insensitive)
    const existsInHistory = history.some(h =>
      h.purchased_date === today &&
      h.name.toLowerCase() === item.name.toLowerCase()
    );

    if (!existsInHistory) {
      const newHistory = [{ id: Date.now().toString(), name: item.name, purchased_date: today, category: item.category }, ...history];
      setHistory(newHistory);
      await saveHistory(newHistory);
    }
  };

  const deleteItem = async (id) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    await saveItems(newItems);
  };

  const confirmCategoryChange = async (item, nextCategory) => {
    // Update learned category DB
    const newLearned = { ...learnedCategories, [item.name]: nextCategory };
    setLearnedCategories(newLearned);
    await saveLearnedCategory(item.name, nextCategory);

    // Update all current items in the list with same name
    const newItems = items.map(i => i.name === item.name ? { ...i, category: nextCategory } : i);
    setItems(newItems);
    await saveItems(newItems);

    setSelectedItemForCategory(null);
    showSuccess(`「${categoryNames[nextCategory]}」に分類しました`);
  };

  const updateQuantity = async (id, delta) => {
    const newItems = items.map(i => {
      if (i.id === id) {
        const newQ = Math.max(1, (i.quantity || 1) + delta);
        return { ...i, quantity: newQ };
      }
      return i;
    });
    setItems(newItems);
    await saveItems(newItems);
  };

  const handleReorder = (newOrder) => {
    if (JSON.stringify(newOrder.map(i => i.id)) === JSON.stringify(items.map(i => i.id))) {
      return;
    }
    const updatedItems = newOrder.map((item, index) => ({ ...item, order_index: index }));
    setItems(updatedItems);

    if (reorderSaveTimeoutRef.current) {
      clearTimeout(reorderSaveTimeoutRef.current);
    }
    reorderSaveTimeoutRef.current = setTimeout(() => {
      saveItems(updatedItems);
      reorderSaveTimeoutRef.current = null;
    }, 400);
  };

  const reAddFromHistory = async (name) => {
    await addSpecificItem(name);
  };

  const deleteHistory = async (id) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    await saveHistory(newHistory);
    // ドラッグ中の motion.div がアンマウントされる際にポインター状態が残ることがあるため、
    // イベントループを一周回してからフォーカスとポインターキャプチャを解放する
    requestAnimationFrame(() => {
      document.activeElement?.blur();
    });
  };

  const handleImport = async () => {
    if (!importText.trim()) return;

    const rawWords = importText.split(/[\n,、。　\s]+/);
    const parsedItems = [];
    let currentItem = null;

    for (let word of rawWords) {
      if (!word.trim()) continue;

      const qtyMatch = word.match(/^([0-9０-９]+)(個|パック|本|箱|袋|枚)?$/);
      if (qtyMatch && currentItem) {
        let num = parseInt(qtyMatch[1].replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)));
        currentItem.quantity += (num > 1 ? num - 1 : 0);
        continue;
      }

      currentItem = { name: word.trim(), quantity: 1 };
      parsedItems.push(currentItem);
    }

    let newItems = [...items];
    let itemsModified = false;

    for (let p of parsedItems) {
      const cat = getInitialCategory(p.name);
      if (cat === "ignore") continue;

      const existingIdx = newItems.findIndex(i => i.name === p.name);
      if (existingIdx !== -1) {
        newItems[existingIdx].quantity = (newItems[existingIdx].quantity || 1) + p.quantity;
      } else {
        newItems.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: p.name,
          quantity: p.quantity,
          category: cat,
          created_at: new Date().toISOString(),
          order_index: newItems.length > 0 ? newItems[newItems.length - 1].order_index + 1 : 0
        });
      }
      itemsModified = true;
    }

    if (itemsModified) {
      setItems(newItems);
      await saveItems(newItems);
      showSuccess(`抽出してリストに追加しました (${parsedItems.length}件)`);
    }

    setImportText('');
    setShowImport(false);
  };

  const filteredHistory = searchQuery.trim()
    ? history.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : history.slice(0, 500);

  const groupedHistory = filteredHistory.reduce((acc, curr) => {
    if (!acc[curr.purchased_date]) acc[curr.purchased_date] = [];
    acc[curr.purchased_date].push(curr);
    // Sort items within the same date by ID desc (recency)
    acc[curr.purchased_date].sort((a, b) => b.id.localeCompare(a.id));
    return acc;
  }, {});

  const historySuggestions = useMemo(() => {
    const freq = {};
    history.forEach(h => { freq[h.name] = (freq[h.name] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .filter(name => !items.some(i => i.name === name));
  }, [history, items]);

  const suggestions = newItemName.trim()
    ? historySuggestions.filter(n => n.toLowerCase().includes(newItemName.toLowerCase())).slice(0, 5)
    : historySuggestions.slice(0, 5);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-main">
          <div className="header-left">
            <img src={import.meta.env.BASE_URL + 'icon.png'} alt="App Icon" className="app-icon" />
            <div className="header-titles">
              <span className="sub-title">お買い物リスト</span>
              <h1 className="title">買い物行くドン！</h1>
            </div>
          </div>
          <div className="header-right" style={{ display: 'flex', gap: '12px' }}>
            <button className="menu-toggle" onClick={() => { document.activeElement?.blur(); setIsMenuOpen(true); }}>
              <PawPrint size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="menu-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              key="menu-drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={drawerTransition}
              className="drawer"
            >
              <div className="drawer-header">
                <h2>設定・メニュー</h2>
                <button className="close-drawer" onClick={() => setIsMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="drawer-content">
                <div className="settings-section">
                  <h3 className="section-title">テーマ設定</h3>
                  <div className="theme-options">
                    <button
                      className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <Sun size={18} /> ライト
                    </button>
                    <button
                      className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon size={18} /> ダーク
                    </button>
                    <button
                      className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                      onClick={() => setTheme('system')}
                    >
                      <Smartphone size={18} /> システム
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 className="section-title">カスタマイズ</h3>
                  <button onClick={() => { setIsMenuOpen(false); document.activeElement?.blur(); setIsCategoryOrderMode(true); }} style={{ width: '100%', marginBottom: '16px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <GripVertical size={18} />
                    カテゴリの並び替え
                  </button>
                </div>

                <div className="settings-section">
                  <h3 className="section-title">ヘルプ</h3>
                  <button onClick={() => { setIsMenuOpen(false); setShowTutorial(true); }} style={{ width: '100%', marginBottom: '16px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <HelpCircle size={18} />
                    アプリの使い方を見る
                  </button>
                </div>

                <div className="settings-section">
                  <button
                    onClick={() => { location.href = location.pathname + '?v=' + Date.now(); }}
                    style={{ width: '100%', marginBottom: '8px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <RefreshCcw size={18} />
                    最新版に更新
                  </button>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0', lineHeight: 1.5, textAlign: 'center' }}>
                    ホーム画面から開いて古い画面が表示される場合にお試しください
                  </p>
                </div>

                <div className="drawer-footer">
                  <p>買い物行くドン！ v1.5.0</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            key="error-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="error-toast"
          >
            <AlertCircle size={18} /> {errorMsg}
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            key="success-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="success-toast"
          >
            <Check size={18} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              key="history-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay" onClick={() => { setShowHistory(false); setShowDirectAdd(false); }}
            />
            <motion.div
              key="history-modal"
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={drawerTransition}
              className="drawer-fixed-bottom"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={24} /> 過去の履歴
                </h2>
                <button onClick={() => { setShowHistory(false); setShowDirectAdd(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><X size={28} /></button>
              </div>

              <div style={{ marginBottom: '16px', flexShrink: 0 }}>
                {/* 検索 + 履歴に追加ボタン 横並び */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="履歴から検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => setShowDirectAdd(v => !v)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px',
                      background: showDirectAdd ? 'var(--primary)' : 'var(--card-bg)',
                      color: showDirectAdd ? 'white' : 'var(--text-main)',
                      border: '1px solid var(--border)', fontSize: '13px', fontWeight: 'bold',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.15s, color 0.15s'
                    }}
                  >
                    <Plus size={14} /> 履歴に追加
                  </button>
                </div>

                {/* 折りたたみ入力エリア */}
                {showDirectAdd && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="品名"
                      aria-label="品名"
                      value={historyInput}
                      onChange={(e) => setHistoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (historyInput.trim()) {
                            addDirectlyToHistory(historyInput, historyInputDate);
                            setHistoryInput('');
                            setShowDirectAdd(false);
                            document.activeElement?.blur();
                          }
                        }
                      }}
                      style={{ flex: 1, minWidth: '100px' }}
                      autoFocus
                    />
                    <input
                      type="date"
                      className="search-input"
                      aria-label="日付"
                      value={historyInputDate}
                      max={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })}
                      onChange={(e) => setHistoryInputDate(e.target.value)}
                      style={{ width: '130px', fontSize: '13px', padding: '6px 8px', flexShrink: 0 }}
                    />
                    <button
                      onClick={() => {
                        if (historyInput.trim()) {
                          addDirectlyToHistory(historyInput, historyInputDate);
                          setHistoryInput('');
                          setShowDirectAdd(false);
                          document.activeElement?.blur();
                        }
                      }}
                      style={{
                        padding: '8px 14px', borderRadius: '8px', background: 'var(--primary)', color: 'white',
                        border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0
                      }}
                    >
                      <Plus size={14} /> 追加する
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.keys(groupedHistory).length > 0 ? (
                  Object.entries(groupedHistory).sort((a, b) => b[0].localeCompare(a[0])).map(([date, historyEntries]) => (
                    <div key={date} className="history-group">
                      <div className="history-date">{date}</div>
                      {historyEntries.map(item => (
                        <SwipeableHistoryItem
                          key={item.id}
                          item={item}
                          onReAdd={reAddFromHistory}
                          onDelete={deleteHistory}
                          isAdded={items.some(listItem => listItem.name.toLowerCase() === item.name.toLowerCase())}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <History className="empty-icon" />
                    <p>履歴はありません</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Selection Modal */}
      <AnimatePresence>
        {selectedItemForCategory && (
          <>
            <motion.div
              key="category-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay" onClick={() => setSelectedItemForCategory(null)}
            />
            <motion.div
              key="category-modal"
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={drawerTransition}
              className="drawer-fixed-bottom"
              style={{ top: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{selectedItemForCategory.name} の分類</h3>
                <button onClick={() => setSelectedItemForCategory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.keys(categoryNames).map(key => (
                  <button
                    key={key}
                    onClick={() => confirmCategoryChange(selectedItemForCategory, key)}
                    style={{
                      padding: '12px', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: categoryColors[key] || categoryColors.other,
                      border: (selectedItemForCategory.category || 'other') === key ? '2px solid var(--theme-color)' : '1px solid rgba(0,0,0,0.1)',
                      fontWeight: 'bold', textAlign: 'center', color: 'rgba(0,0,0,0.7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{categoryIcons[key] || '🏷️'}</span>
                    <span>{categoryNames[key]}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay" onClick={dismissTutorial}
              style={{ zIndex: 200 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed', top: '10%', left: '5%', right: '5%', bottom: '10%',
                backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '24px',
                zIndex: 201, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflowY: 'auto',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-color)' }}>使い方ガイド 🛒</h2>
                <p style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '14px', margin: '8px 0 0 0' }}>
                  毎日のお買い物がちょっと便利になります。
                </p>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>テキストから一括追加</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.8 }}>
                      候補一覧タブの「＋」ボタンから、LINEなどで送付された「牛乳２ 洗剤」等のテキストをコピペすると、個数と商品名を自動で分離してリスト化します！
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Pointer size={24} color="#eab308" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>タップで賢くカテゴリ学習</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.8 }}>
                      リストにある商品の「左端の色付き丸」をタップするとカテゴリを変更できます。変更するとアプリが学習し、次回からは自動でそのカテゴリに振り分けられます。
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GripVertical size={24} color="#22c55e" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>自分好みに並び替え</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.8 }}>
                      左側の「⋮⋮」を押し込む（約1秒間）とアイテムの順番を変えられます。右上メニューからは「スーパーの売り場ごとの順番」も自由にカスタマイズ可能です！
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={dismissTutorial} style={{
                marginTop: '32px', padding: '16px', borderRadius: '12px',
                backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                fontSize: '16px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}>
                はじめる！
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Order Modal */}
      <AnimatePresence>
        {isCategoryOrderMode && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay" onClick={() => setIsCategoryOrderMode(false)}
              style={{ zIndex: 100 }}
            />
            <motion.div
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={drawerTransition}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, height: '80vh', backgroundColor: 'var(--card-bg)',
                borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px',
                zIndex: 101, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>カテゴリの並び替え</h3>
                <button onClick={() => setIsCategoryOrderMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><X size={24} /></button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-color)', opacity: 0.8, marginBottom: '20px' }}>
                スーパーの売り場・陳列順に合わせて並び替えると、買い周りが一層スムーズになります。（上下にドラッグ＆ドロップ）
              </p>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <Reorder.Group axis="y" values={categoryOrder} onReorder={(newOrder) => {
                  setCategoryOrder(newOrder);
                  if (categoryOrderSaveTimeoutRef.current) {
                    clearTimeout(categoryOrderSaveTimeoutRef.current);
                  }
                  categoryOrderSaveTimeoutRef.current = setTimeout(() => {
                    saveSetting('categoryOrder', newOrder);
                    categoryOrderSaveTimeoutRef.current = null;
                  }, 400);
                }} style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '40px' }}>
                  {categoryOrder.map(catKey => (
                    <Reorder.Item key={catKey} value={catKey} style={{
                      padding: '12px 16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ cursor: 'grab', marginRight: '16px', color: 'rgba(0,0,0,0.4)', touchAction: 'none' }}>
                        <GripVertical size={20} />
                      </div>
                      <span style={{ fontSize: '20px', marginRight: '12px' }}>{categoryIcons[catKey] || '🏷️'}</span>
                      <span style={{ fontWeight: 'bold' }}>{categoryNames[catKey] || 'その他'}</span>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="sticky-top-container">
        <form className="input-container" onSubmit={addItem}>
          <input
            type="text"
            placeholder="なにか買う？"
            value={newItemName}
            maxLength={50}
            onChange={(e) => setNewItemName(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />
          <button className="add-button" type="submit" disabled={items.length >= 100} aria-label="リストに追加" title="リストに追加">
            <Plus size={20} /><span className="add-button-label">追加</span>
          </button>

          <AnimatePresence>
            {isFocused && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="suggestions-dropdown"
              >
                {suggestions.map(s => (
                  <div key={s} className="suggestion-item" onClick={() => addSpecificItem(s)}>
                    {s}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="quick-actions">
          <button onClick={() => setShowImport(true)} className="quick-btn">
            <Plus size={16} /> 一括追加
          </button>
          <button onClick={() => setShowHistory(true)} className="quick-btn">
            <History size={16} /> 履歴から探す
          </button>
        </div>
      </div>

      <main className="main-content">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {loading ? (
            <div className="empty-state">
              <div className="animate-spin" style={{ display: 'inline-block' }}>
                <Loader2 size={32} />
              </div>
            </div>
          ) : (
            <div className="list-container" style={{ zoom: listZoom }}>
              {items.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={48} className="empty-icon" />
                  <p>買うものはありません</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.7 }}>上の欄から追加するか、履歴から選んでください</p>
                </div>
              ) : (
                <>
                  {categoryOrder
                    .filter(catKey => items.some(i => (i.category || 'other') === catKey))
                    .map(catKey => {
                      const catItems = items.filter(i => (i.category || 'other') === catKey);
                      return (
                        <div key={catKey} className="category-group" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          <div className="category-sidebar" style={{
                            width: '40px', flexShrink: 0,
                            backgroundColor: categoryColors[catKey] || categoryColors.other,
                            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', padding: '12px 0px', border: '1px solid rgba(0,0,0,0.1)',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                          }}>
                            {categoryIcons[catKey] || '🏷️'}
                          </div>
                          <Reorder.Group
                            axis="y"
                            values={catItems}
                            onReorder={(newOrder) => {
                              const newItems = items.filter(i => (i.category || 'other') !== catKey);
                              handleReorder([...newItems, ...newOrder]);
                            }}
                            style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}
                          >
                            {catItems.map((item) => (
                              <SwipeableItem
                                key={item.id}
                                item={item}
                                onPurchase={purchaseItem}
                                onDelete={deleteItem}
                                onChangeCategory={(i) => setSelectedItemForCategory(i)}
                                onUpdateQuantity={updateQuantity}
                              />
                            ))}
                          </Reorder.Group>
                        </div>
                      )
                    })}
                </>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Import Text Modal */}
      <AnimatePresence>
        {showImport && (
          <>
            <motion.div
              key="import-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay" onClick={() => setShowImport(false)}
            />
            <motion.div
              key="import-modal"
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={drawerTransition}
              className="drawer-fixed-bottom"
              style={{ top: 'auto', padding: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>テキストから一括追加</h3>
                <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><X size={24} /></button>
              </div>
              <textarea
                placeholder="LINEやメモ帳からテキストを貼り付けできます。(例: 牛乳 2、卵)"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)',
                  resize: 'none', backgroundColor: 'var(--bg)', color: 'var(--text-main)',
                  marginBottom: '16px', fontSize: '1rem', outline: 'none'
                }}
              />
              <button
                onClick={handleImport}
                className="add-button"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem' }}
              >
                抽出して一括追加
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zoom Control (left-bottom floating) */}
      <div style={{
        position: 'fixed', bottom: '24px', left: '16px', zIndex: 100,
        display: 'flex', alignItems: 'center', gap: '2px',
        background: 'var(--card-bg)', borderRadius: '999px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)', border: '1px solid var(--border)',
        padding: '4px 6px'
      }}>
        <button onClick={zoomOut} disabled={listZoom <= 0.6} className="zoom-btn" title="縮小">
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '11px', minWidth: '30px', textAlign: 'center', color: 'var(--text-main)', fontWeight: '600', userSelect: 'none' }}>
          {Math.round(listZoom * 100)}%
        </span>
        <button onClick={zoomIn} disabled={listZoom >= 1.2} className="zoom-btn" title="拡大">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Price Comparison FAB */}
      <button
        className="price-calc-fab"
        onClick={() => setShowPriceCalc(true)}
        aria-label="お得比較計算機を開く"
        title="どっちがお得？"
      >
        <Scale size={22} />
      </button>

      {/* Price Comparison Bottom Sheet */}
      <AnimatePresence>
        {showPriceCalc && (() => {
          const priceA = parseFloat(calcA.price);
          const amountA = parseFloat(calcA.amount);
          const priceB = parseFloat(calcB.price);
          const amountB = parseFloat(calcB.amount);

          const unitPriceA = (!isNaN(priceA) && !isNaN(amountA) && amountA > 0)
            ? priceA / amountA
            : null;
          const unitPriceB = (!isNaN(priceB) && !isNaN(amountB) && amountB > 0)
            ? priceB / amountB
            : null;

          let winner = null;
          if (unitPriceA !== null && unitPriceB !== null) {
            if (unitPriceA < unitPriceB) winner = 'A';
            else if (unitPriceB < unitPriceA) winner = 'B';
            else winner = 'same';
          }

          return (
            <>
              <motion.div
                key="price-calc-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="drawer-overlay"
                onClick={() => setShowPriceCalc(false)}
              />
              <motion.div
                key="price-calc-sheet"
                variants={bottomSheetVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={drawerTransition}
                className="drawer-fixed-bottom"
                style={{ top: 'auto', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={20} /> どっちがお得？
                  </h3>
                  <button
                    onClick={() => setShowPriceCalc(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="price-calc-grid">
                  {/* 商品A */}
                  <div className={`price-calc-card${winner === 'A' ? ' calc-result-winner' : ''}`}>
                    <div className="price-calc-card-label">商品 A</div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub, #888)', marginBottom: '3px', fontWeight: '600' }}>値段（円）</div>
                      <input
                        className="search-input"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        placeholder="例: 198"
                        value={calcA.price}
                        onChange={(e) => setCalcA(p => ({ ...p, price: e.target.value }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub, #888)', marginBottom: '3px', fontWeight: '600' }}>内容量</div>
                      <input
                        className="search-input"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        placeholder="例: 500"
                        value={calcA.amount}
                        onChange={(e) => setCalcA(p => ({ ...p, amount: e.target.value }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="price-calc-result-unit">
                      {unitPriceA !== null ? `単価 ${unitPriceA.toFixed(2)}円` : '---'}
                    </div>
                    {winner === 'A' && <div className="price-calc-winner-badge">✓ 安い！</div>}
                  </div>

                  {/* VS */}
                  <div className="price-calc-vs">VS</div>

                  {/* 商品B */}
                  <div className={`price-calc-card${winner === 'B' ? ' calc-result-winner' : ''}`}>
                    <div className="price-calc-card-label">商品 B</div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub, #888)', marginBottom: '3px', fontWeight: '600' }}>値段（円）</div>
                      <input
                        className="search-input"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        placeholder="例: 198"
                        value={calcB.price}
                        onChange={(e) => setCalcB(p => ({ ...p, price: e.target.value }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub, #888)', marginBottom: '3px', fontWeight: '600' }}>内容量</div>
                      <input
                        className="search-input"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        placeholder="例: 500"
                        value={calcB.amount}
                        onChange={(e) => setCalcB(p => ({ ...p, amount: e.target.value }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="price-calc-result-unit">
                      {unitPriceB !== null ? `単価 ${unitPriceB.toFixed(2)}円` : '---'}
                    </div>
                    {winner === 'B' && <div className="price-calc-winner-badge">✓ 安い！</div>}
                  </div>
                </div>

                {winner === 'same' && (
                  <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    ほぼ同じ価格です
                  </div>
                )}

                <button
                  onClick={() => {
                    setCalcA({ price: '', amount: '' });
                    setCalcB({ price: '', amount: '' });
                  }}
                  style={{
                    marginTop: '16px', width: '100%', padding: '12px', borderRadius: '10px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  リセット
                </button>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

export default App;

