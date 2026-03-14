import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Check, ShoppingBag, Loader2, Server, GripVertical, Trash2, History, ListTodo, RefreshCcw, Search, AlertCircle, X, Calendar, Settings, Sun, Moon, Smartphone, Pointer, HelpCircle, Scale, ZoomIn, ZoomOut, Star, Share2, ChevronRight, Pencil, List } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, Reorder, useDragControls, animate as springAnimate } from 'framer-motion';
import { getItems, saveItems, getHistory, saveHistory, getSetting, saveSetting, getLearnedCategories, saveLearnedCategory, deleteLearnedCategoriesByValue } from './db';
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

const emojiDict = {
  'キャベツ': '🥬', 'レタス': '🥬', 'ほうれん草': '🥬', '小松菜': '🥬', '白菜': '🥬',
  'にんじん': '🥕', 'ニンジン': '🥕', '人参': '🥕',
  'じゃがいも': '🥔', 'ジャガイモ': '🥔',
  'たまねぎ': '🧅', 'タマネギ': '🧅', '玉ねぎ': '🧅', '玉葱': '🧅',
  'にんにく': '🧄', 'ニンニク': '🧄',
  'ブロッコリー': '🥦',
  'きゅうり': '🥒', 'キュウリ': '🥒',
  'とうもろこし': '🌽', 'コーン': '🌽',
  'トマト': '🍅', 'ミニトマト': '🍅',
  'なす': '🍆', 'ナス': '🍆',
  'さつまいも': '🍠', 'サツマイモ': '🍠',
  'りんご': '🍎', 'リンゴ': '🍎',
  'みかん': '🍊', 'ミカン': '🍊', 'オレンジ': '🍊',
  'レモン': '🍋',
  'バナナ': '🍌',
  'ぶどう': '🍇', 'ブドウ': '🍇',
  'いちご': '🍓', 'イチゴ': '🍓',
  'すいか': '🍉', 'スイカ': '🍉',
  'もも': '🍑', 'モモ': '🍑', '桃': '🍑',
  '洋梨': '🍐', 'ナシ': '🍐',
  'メロン': '🍈',
  'さくらんぼ': '🍒', 'チェリー': '🍒',
  '牛肉': '🥩', '豚肉': '🥩', 'ひき肉': '🥩', 'ステーキ': '🥩',
  '鶏肉': '🍗', 'とりにく': '🍗', '鶏もも': '🍗',
  '魚': '🐟', 'サーモン': '🐟', 'マグロ': '🐟', 'さば': '🐟', 'サバ': '🐟',
  'エビ': '🦐', 'えび': '🦐',
  '卵': '🥚', 'たまご': '🥚', 'タマゴ': '🥚',
  '牛乳': '🥛', 'ミルク': '🥛',
  'バター': '🧈',
  'チーズ': '🧀',
  'ヨーグルト': '🫙',
  'パン': '🍞', '食パン': '🍞',
  'お米': '🍚', '米': '🍚', 'ご飯': '🍚',
  'うどん': '🍜', 'ラーメン': '🍜', 'パスタ': '🍝', 'そば': '🍜',
  'お茶': '🍵', '緑茶': '🍵', '麦茶': '🍵',
  'コーヒー': '☕',
  'ジュース': '🧃',
  'ビール': '🍺',
  'ワイン': '🍷',
  'チョコレート': '🍫', 'チョコ': '🍫',
  'アイスクリーム': '🍦', 'アイス': '🍦',
  'クッキー': '🍪', 'ビスケット': '🍪',
  'ケーキ': '🎂',
  '塩': '🧂',
  'シャンプー': '🧴', 'リンス': '🧴', 'コンディショナー': '🧴',
  '洗剤': '🧹', '洗濯洗剤': '🧺',
  'ティッシュ': '🧻', 'トイレットペーパー': '🧻',
  '歯ブラシ': '🪥', '歯磨き粉': '🪥',
};

const ToggleSwitch = ({ value, onChange }) => (
  <button
    role="switch"
    aria-checked={value}
    onClick={() => onChange(!value)}
    style={{
      width: '44px', height: '26px', borderRadius: '13px',
      background: value ? 'var(--primary)' : 'var(--border)',
      border: 'none', position: 'relative',
      cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.2s',
      padding: 0, touchAction: 'manipulation',
    }}
  >
    <span style={{
      position: 'absolute', width: '20px', height: '20px',
      borderRadius: '50%', background: 'white',
      top: '3px', left: value ? '21px' : '3px',
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </button>
);

const getItemEmoji = (name) => {
  for (const [keyword, emoji] of Object.entries(emojiDict)) {
    if (name.includes(keyword)) return emoji;
  }
  return null;
};

const SwipeableItem = ({ item, onPurchase, onDelete, onChangeCategory, onUpdateQuantity, onToggleStar, showStarFeature = true, categoryColorsMap = categoryColors, isTutorialCard = false }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const x = useMotionValue(0);
  const dragControls = useDragControls();
  const swipeDragControls = useDragControls();
  const handleRef = useRef(null);

  const spring = { type: 'spring', stiffness: 500, damping: 40 };

  const handleDragEnd = (event, info) => {
    if (info.offset.x < -48) {
      setIsRevealed(true);
      springAnimate(x, -60, spring);
    } else {
      setIsRevealed(false);
      springAnimate(x, 0, spring);
    }
  };

  const handleSwipePointerDown = (e) => {
    setIsPressing(true);
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
    const onUp = () => {
      setIsPressing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const catColor = item.category ? categoryColorsMap[item.category] : categoryColorsMap.other;
  const emoji = getItemEmoji(item.name);

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      className="draggable-item-container"
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={() => setIsPressing(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius)',
        filter: isPressing ? 'brightness(0.95)' : 'brightness(1)',
        boxShadow: isPressing ? 'inset 0 2px 6px rgba(0,0,0,0.15)' : 'none',
        transition: 'filter 0.2s, box-shadow 0.2s'
      }}
    >
      <div className="swipe-bg-danger">
        <button onClick={() => onDelete(item.id)} className="swipe-delete-btn">
          <Trash2 size={24} />
        </button>
      </div>

      <motion.div
        style={{
          x, backgroundColor: catColor, position: 'relative', zIndex: 2, boxShadow: 'var(--shadow)', touchAction: 'pan-y',
          ...(isTutorialCard && { border: '2px dashed rgba(0,0,0,0.2)', borderRadius: '12px' })
        }}
        drag="x"
        dragListener={false}
        dragControls={swipeDragControls}
        dragConstraints={{ left: -60, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(e, info) => {
          setIsPressing(false);
          handleDragEnd(e, info);
        }}
        onPointerDown={handleSwipePointerDown}
        className="item-card"
        whileDrag={{ boxShadow: 'var(--shadow-lg)', scale: 1.02, zIndex: 10 }}
      >
        {/* 左: 1行コンテンツ（長押しでカテゴリ変更） */}
        <div
          className="item-main-area"
          onPointerDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const timer = setTimeout(() => {
              document.activeElement?.blur();
              onChangeCategory(item);
            }, 600);
            const onMove = (me) => {
              if (Math.hypot(me.clientX - startX, me.clientY - startY) > 8) {
                clearTimeout(timer);
                window.removeEventListener('pointermove', onMove);
              }
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', () => {
              clearTimeout(timer);
              window.removeEventListener('pointermove', onMove);
            }, { once: true });
          }}
        >
          <div className="item-row-single">
            <div
              ref={handleRef}
              className="drag-handle"
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsPressing(true);
                const startX = e.clientX;
                const startY = e.clientY;
                let latestEvent = e;
                let dragStarted = false;
                let timer;

                const onMove = (me) => {
                  const dx = me.clientX - startX;
                  const dy = me.clientY - startY;
                  if (!dragStarted && Math.hypot(dx, dy) >= 8 && Math.abs(dy) >= Math.abs(dx)) {
                    dragStarted = true;
                    window.removeEventListener('pointermove', onMove);
                    clearTimeout(timer);
                    window.removeEventListener('pointerup', cancel);
                    window.removeEventListener('pointercancel', cancel);
                    dragControls.start(e);
                    return;
                  }
                  if (handleRef.current?.contains(me.target)) {
                    latestEvent = me;
                  }
                };

                const cancel = () => {
                  clearTimeout(timer);
                  setIsPressing(false);
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', cancel);
                  window.removeEventListener('pointercancel', cancel);
                };

                window.addEventListener('pointermove', onMove);
                timer = setTimeout(() => {
                  if (dragStarted) return;
                  window.removeEventListener('pointermove', onMove);
                  dragControls.start(latestEvent);
                }, 300);
                window.addEventListener('pointerup', cancel);
                window.addEventListener('pointercancel', cancel);
              }}
            >
              <GripVertical size={18} />
            </div>
            {/* 星ボタン（ハンドル右隣） */}
            {showStarFeature && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleStar(item.id); }}
                className="star-btn"
                style={{ color: item.starred ? '#f59e0b' : 'var(--text-sub, #bbb)' }}
                title={item.starred ? '優先を解除' : '優先にする'}
              >
                <Star size={20} fill={item.starred ? '#f59e0b' : 'none'} />
              </button>
            )}
            <span className="item-text">{item.name}{emoji && <span className="item-emoji">{emoji}</span>}</span>
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

  const historyEmoji = getItemEmoji(item.name);

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
          <span className="history-item-text">
            {item.name}{historyEmoji && <span className="item-emoji">{historyEmoji}</span>}
          </span>
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

const CategoryGroupRow = ({ catKey, catItems, mergedCategoryColors, mergedCategoryIcons, categoryColors, renderItem, items, showStarFeature, handleReorder }) => {
  const dragControls = useDragControls();
  const onItemsReorder = (newOrder) => {
    let catKeyReplaced = false;
    const newFullList = items.flatMap(i => {
      if ((i.category || 'other') === catKey) {
        if (!catKeyReplaced) {
          catKeyReplaced = true;
          return newOrder;
        }
        return [];
      }
      return [i];
    });
    handleReorder(newFullList.map((item, idx) => ({ ...item, order_index: idx })));
  };
  return (
    <Reorder.Item
      value={catKey}
      dragListener={false}
      dragControls={dragControls}
      style={{ display: 'flex', gap: '8px', marginBottom: '16px', listStyle: 'none' }}
    >
      <div
        onPointerDown={(e) => { e.stopPropagation(); dragControls.start(e); }}
        className="category-sidebar"
        style={{
          width: '40px', flexShrink: 0, cursor: 'grab', touchAction: 'none',
          backgroundColor: mergedCategoryColors[catKey] || categoryColors.other,
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', padding: '12px 0px', border: '1px solid rgba(0,0,0,0.1)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {mergedCategoryIcons[catKey] || '🏷️'}
      </div>
      <Reorder.Group
        axis="y"
        values={catItems}
        onReorder={onItemsReorder}
        style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}
      >
        {catItems.map(renderItem)}
      </Reorder.Group>
    </Reorder.Item>
  );
};

const CategoryOrderItem = ({
  catKey,
  icon,
  name,
  color,
  isDeletable,
  isFixed,
  onEdit,
  onDelete,
  isEditing,
  editName,
  editIcon,
  editColor,
  onEditNameChange,
  onEditIconChange,
  onEditColorChange,
  onSaveEdit,
  onCancelEdit,
  colorOptions,
}) => {
  const dragControls = useDragControls();
  const rowContent = (
    <>
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>カテゴリ名</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              placeholder="例：野菜・果物"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>絵文字（1〜2文字）</label>
            <input
              type="text"
              value={editIcon}
              onChange={(e) => onEditIconChange(e.target.value)}
              maxLength={2}
              style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.2rem', textAlign: 'center' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>表示色</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {colorOptions.map(c => (
                <button key={c} type="button" onClick={() => onEditColorChange(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: editColor === c ? '3px solid var(--primary)' : '2px solid var(--border)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={onSaveEdit} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>保存</button>
            <button type="button" onClick={onCancelEdit} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>キャンセル</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {!isFixed && (
            <div
              onPointerDown={(e) => { e.stopPropagation(); dragControls.start(e); }}
              style={{ cursor: 'grab', marginRight: '16px', color: 'rgba(0,0,0,0.4)', touchAction: 'none', flexShrink: 0 }}
            >
              <GripVertical size={20} />
            </div>
          )}
          {isFixed && <div style={{ width: '38px', marginRight: '16px', flexShrink: 0 }} />}
          <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginRight: '12px', flexShrink: 0 }}>{icon}</span>
          <span style={{ fontWeight: 'bold', flex: 1, minWidth: 0 }}>{name}</span>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', flexShrink: 0 }} title="編集"><Pencil size={18} /></button>
          {isDeletable && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', flexShrink: 0 }} title="削除"><Trash2 size={18} /></button>
          )}
        </div>
      )}
    </>
  );
  return isFixed ? (
    <div style={{ padding: '12px 16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      {rowContent}
    </div>
  ) : (
    <Reorder.Item value={catKey} dragListener={false} dragControls={dragControls} style={{ padding: '12px 16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      {rowContent}
    </Reorder.Item>
  );
};

const CUSTOM_CATEGORY_COLORS = ['#e8f5e9', '#ffebee', '#e3f2fd', '#fff8e1', '#fff3e0', '#efebe9', '#e0f2f1', '#f3e5f5', '#e0f7fa', '#fce4ec', '#ffffff'];
const BUILTIN_DEFAULT_HEX = { vegetable: '#e8f5e9', meat: '#ffebee', seafood: '#e3f2fd', dairy: '#fff8e1', carb: '#fff3e0', spice: '#efebe9', beverage: '#e0f2f1', daily: '#f3e5f5', frozen: '#e0f7fa', snack: '#fce4ec', other: '#ffffff' };

const DEMO_ITEMS = [
  { id: 'demo_1', name: '牛乳', category: 'dairy', order_index: 0, starred: false },
  { id: 'demo_2', name: '右の✓で購入済みに', category: 'other', order_index: 1, starred: false, isTutorialCard: true },
  { id: 'demo_3', name: 'にんじん', category: 'vegetable', order_index: 2, starred: false },
  { id: 'demo_4', name: '長押しでカテゴリ変更', category: 'other', order_index: 3, starred: false, isTutorialCard: true },
  { id: 'demo_5', name: '卵', category: 'dairy', order_index: 4, starred: false },
  { id: 'demo_6', name: '左にスワイプで削除', category: 'other', order_index: 5, starred: false, isTutorialCard: true },
  { id: 'demo_7', name: 'パン', category: 'carb', order_index: 6, starred: false },
  { id: 'demo_8', name: '☆を押すと優先表示', category: 'other', order_index: 7, starred: false, isTutorialCard: true },
];

const CustomCategoryForm = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState(CUSTOM_CATEGORY_COLORS[0]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), icon, color);
    setName('');
    setIcon('📦');
    setColor(CUSTOM_CATEGORY_COLORS[0]);
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>カテゴリ名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：ペット用品"
          style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>絵文字（1〜2文字）</label>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="📦"
          maxLength={2}
          style={{ width: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.4rem', textAlign: 'center' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>表示色</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CUSTOM_CATEGORY_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: color === c ? '3px solid var(--primary)' : '2px solid var(--border)', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
      <button type="submit" style={{ padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>カテゴリを追加</button>
    </form>
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
  const [categoryOverrides, setCategoryOverrides] = useState({});
  const [deletedCategoryIds, setDeletedCategoryIds] = useState([]);
  const [selectedItemForCategory, setSelectedItemForCategory] = useState(null);
  const [showCategoryManageMode, setShowCategoryManageMode] = useState(false);
  const [editingCatKey, setEditingCatKey] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPriceCalc, setShowPriceCalc] = useState(false);
  const [calcA, setCalcA] = useState({ price: '', amount: '' });
  const [calcB, setCalcB] = useState({ price: '', amount: '' });
  const [showStarFeature, setShowStarFeature] = useState(
    () => localStorage.getItem('showStarFeature') !== 'false'
  );
  const [showCategoryFeature, setShowCategoryFeature] = useState(
    () => localStorage.getItem('showCategoryFeature') !== 'false'
  );
  const [customCategories, setCustomCategories] = useState([]);
  const [listZoom, setListZoom] = useState(
    () => parseFloat(localStorage.getItem('listZoom') || '1')
  );
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const zoomIn = () => { const v = Math.min(1.2, Math.round((listZoom + 0.1) * 10) / 10); setListZoom(v); localStorage.setItem('listZoom', String(v)); };
  const zoomOut = () => { const v = Math.max(0.6, Math.round((listZoom - 0.1) * 10) / 10); setListZoom(v); localStorage.setItem('listZoom', String(v)); };

  const reorderSaveTimeoutRef = useRef(null);
  const categoryOrderSaveTimeoutRef = useRef(null);
  const importContainerRef = useRef(null);

  const { mergedCategoryNames, mergedCategoryColors, mergedCategoryIcons, effectiveCategoryOrder } = useMemo(() => {
    const names = { ...categoryNames };
    const colors = { ...categoryColors };
    const icons = { ...categoryIcons };
    for (const [key, override] of Object.entries(categoryOverrides)) {
      if (override.name != null) names[key] = override.name;
      if (override.icon != null) icons[key] = override.icon;
      if (override.color != null) colors[key] = override.color;
    }
    for (const c of customCategories) {
      names[c.id] = c.name;
      colors[c.id] = c.color || categoryColors.other;
      icons[c.id] = c.icon || '🏷️';
    }
    const customIds = customCategories.map(c => c.id);
    const deletedSet = new Set(deletedCategoryIds);
    const order = [...categoryOrder.filter(k => k !== 'other' && !deletedSet.has(k)), ...customIds.filter(id => !categoryOrder.includes(id)), 'other'];
    return { mergedCategoryNames: names, mergedCategoryColors: colors, mergedCategoryIcons: icons, effectiveCategoryOrder: order };
  }, [customCategories, categoryOrder, categoryOverrides, deletedCategoryIds]);

  const addCustomCategory = (name, icon, color) => {
    const id = 'custom_' + Date.now();
    const next = [...customCategories, { id, name, icon: icon || '🏷️', color: color || categoryColors.other }];
    setCustomCategories(next);
    saveSetting('customCategories', next);
    setCategoryOrder(prev => {
      const order = [...prev.filter(k => k !== 'other'), id, 'other'];
      saveSetting('categoryOrder', order);
      return order;
    });
  };

  const removeCustomCategory = (id) => {
    const next = customCategories.filter(c => c.id !== id);
    setCustomCategories(next);
    saveSetting('customCategories', next);
    setCategoryOrder(prev => {
      const order = prev.filter(k => k !== id);
      saveSetting('categoryOrder', order);
      return order;
    });
  };

  const updateCategoryOverride = (catKey, { name, icon, color }) => {
    const next = {
      ...categoryOverrides,
      [catKey]: {
        ...(categoryOverrides[catKey] || {}),
        ...(name != null && { name }),
        ...(icon != null && { icon }),
        ...(color != null && { color }),
      },
    };
    setCategoryOverrides(next);
    saveSetting('categoryOverrides', next);
  };

  const updateCustomCategory = (id, { name, icon, color }) => {
    const next = customCategories.map(c =>
      c.id === id
        ? { ...c, ...(name != null && { name }), ...(icon != null && { icon }), ...(color != null && { color }) }
        : c
    );
    setCustomCategories(next);
    saveSetting('customCategories', next);
  };

  const removeBuiltinCategory = async (catKey) => {
    const nextDeleted = [...deletedCategoryIds, catKey];
    setDeletedCategoryIds(nextDeleted);
    saveSetting('deletedCategoryIds', nextDeleted);
    const updatedItems = items.map(i => (i.category || 'other') === catKey ? { ...i, category: 'other' } : i);
    setItems(updatedItems);
    await saveItems(updatedItems);
    const updatedHistory = history.map(h => (h.category || 'other') === catKey ? { ...h, category: 'other' } : h);
    setHistory(updatedHistory);
    await saveHistory(updatedHistory);
    await deleteLearnedCategoriesByValue(catKey);
    const newLearned = Object.fromEntries(Object.entries(learnedCategories).filter(([, v]) => v !== catKey));
    setLearnedCategories(newLearned);
    setCategoryOrder(prev => {
      const order = prev.filter(k => k !== catKey);
      saveSetting('categoryOrder', order);
      return order;
    });
    const { [catKey]: _, ...restOverrides } = categoryOverrides;
    setCategoryOverrides(restOverrides);
    saveSetting('categoryOverrides', restOverrides);
    showSuccess('カテゴリを削除しました');
  };

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
      const dbCustom = await getSetting('customCategories');
      const dbOverrides = await getSetting('categoryOverrides');
      const dbDeleted = await getSetting('deletedCategoryIds');
      if (!dbItems || dbItems.length === 0) {
        await saveItems(DEMO_ITEMS);
        setItems([...DEMO_ITEMS]);
      } else {
        setItems(dbItems || []);
      }
      setHistory(dbHistory || []);
      setLearnedCategories(dbLearned || {});
      setCustomCategories(dbCustom || []);
      setCategoryOverrides(dbOverrides || {});
      setDeletedCategoryIds(dbDeleted || []);
      let order = dbCatOrder || Object.keys(categoryNames);
      const customIds = (dbCustom || []).map(c => c.id);
      for (const id of customIds) {
        if (!order.includes(id)) {
          order = [...order.filter(k => k !== 'other'), id, 'other'];
        }
      }
      setCategoryOrder(order);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!showImport || !window.visualViewport) return;
    const adjust = () => {
      if (!importContainerRef.current) return;
      importContainerRef.current.style.height = window.visualViewport.height + 'px';
      importContainerRef.current.style.top = window.visualViewport.offsetTop + 'px';
    };
    adjust();
    window.visualViewport.addEventListener('resize', adjust);
    window.visualViewport.addEventListener('scroll', adjust);
    return () => {
      window.visualViewport.removeEventListener('resize', adjust);
      window.visualViewport.removeEventListener('scroll', adjust);
    };
  }, [showImport]);

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
    const raw = categoryDict[trimmedName] || categoryDict[lowerName] || learnedCategories[trimmedName] || learnedCategories[lowerName] || "other";
    return deletedCategoryIds.includes(raw) ? "other" : raw;
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
      order_index: items.length > 0 ? items[items.length - 1].order_index + 1 : 0,
      starred: false,
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
    showSuccess(`「${mergedCategoryNames[nextCategory] || categoryNames[nextCategory]}」に分類しました`);
  };

  const toggleStar = async (id) => {
    const newItems = items.map(i => i.id === id ? { ...i, starred: !i.starred } : i);
    setItems(newItems);
    await saveItems(newItems);
  };

  const formatShareText = (itemsList) => {
    const starred = itemsList.filter(i => i.starred);
    const nonStarred = itemsList.filter(i => !i.starred);
    const toLine = (item) => {
      const qty = (item.quantity || 1) > 1 ? ` ×${item.quantity}` : '';
      return `${item.starred ? '★ ' : ''}${item.name}${qty}`;
    };
    return [...starred, ...nonStarred].map(toLine).join('\n');
  };

  const handleShare = async () => {
    const text = formatShareText(items);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        setShowShareConfirm(true);
      } catch {
        // キャンセルした場合は何もしない
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showSuccess('クリップボードにコピーしました');
        setShowShareConfirm(true);
      } catch {
        showError('コピーに失敗しました');
      }
    }
  };

  const handleMoveToHistory = async () => {
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    const existingNames = history
      .filter(h => h.purchased_date === today)
      .map(h => h.name.toLowerCase());
    const newEntries = items
      .filter(item => !existingNames.includes(item.name.toLowerCase()))
      .map(item => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: item.name,
        purchased_date: today,
        category: item.category || 'other',
      }));
    const newHistory = [...newEntries, ...history];
    setHistory(newHistory);
    await saveHistory(newHistory);
    setItems([]);
    await saveItems([]);
    setShowShareConfirm(false);
    showSuccess('履歴に移動しました');
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

      // 【...】形式のヘッダー行をスキップ
      if (/^【.*】$/.test(word)) continue;

      // 日本語・英数字を含まないトークン（絵文字のみ）をスキップ
      if (!/[一-龯ぁ-んァ-ンa-zA-Z0-9０-９]/.test(word)) continue;

      // ×N / xN 形式の数量を現在のアイテムに適用
      const qtyMatchX = word.match(/^[×x]([0-9０-９]+)$/);
      if (qtyMatchX && currentItem) {
        currentItem.quantity = parseInt(qtyMatchX[1].replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)));
        continue;
      }

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
          order_index: newItems.length > 0 ? newItems[newItems.length - 1].order_index + 1 : 0,
          starred: false,
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
            <img src={import.meta.env.BASE_URL + 'icon.png'} alt="カウモノ" className="app-icon" />
            <div className="header-titles">
              <span className="sub-title">お買い物リスト</span>
              <h1 className="title">カウモノ</h1>
            </div>
          </div>
          <div className="header-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {items.length > 0 && (
              <button
                onClick={handleShare}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '999px',
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: '500',
                  whiteSpace: 'nowrap',
                }}
              >
                <Share2 size={16} /> リストを共有
              </button>
            )}
            <button className="menu-toggle" onClick={() => { document.activeElement?.blur(); setIsMenuOpen(true); }}>
              <Settings size={22} />
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
                  <button
                    onClick={() => { setIsMenuOpen(false); document.activeElement?.blur(); setShowCategoryManageMode(true); }}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', marginBottom: '14px',
                      fontSize: '0.95rem', color: 'var(--text-main)', textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ListTodo size={16} /> カテゴリの管理
                    </span>
                    <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        <Star size={16} /> 優先（星）マーク機能
                      </span>
                      <ToggleSwitch
                        value={showStarFeature}
                        onChange={(v) => { setShowStarFeature(v); localStorage.setItem('showStarFeature', String(v)); }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        <ListTodo size={16} /> カテゴリ分類機能
                      </span>
                      <ToggleSwitch
                        value={showCategoryFeature}
                        onChange={(v) => { setShowCategoryFeature(v); localStorage.setItem('showCategoryFeature', String(v)); }}
                      />
                    </div>
                  </div>
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
                  <p>カウモノ v1.5.0</p>
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
                {effectiveCategoryOrder.filter(k => k !== 'other').concat(['other']).map(key => (
                  <button
                    key={key}
                    onClick={() => confirmCategoryChange(selectedItemForCategory, key)}
                    style={{
                      padding: '12px', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: mergedCategoryColors[key] || categoryColors.other,
                      border: (selectedItemForCategory.category || 'other') === key ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.1)',
                      fontWeight: 'bold', textAlign: 'center', color: 'var(--text-main)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{mergedCategoryIcons[key] || '🏷️'}</span>
                    <span>{mergedCategoryNames[key]}</span>
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
                      「一括追加」ボタンから、LINEなどで送付されたテキストを貼り付けて個数と商品名を自動分離します。
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Pointer size={24} color="#eab308" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>長押しでカテゴリ変更</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.8 }}>
                      リストの品目を長押しするとカテゴリを変更でき、学習して次回から自動振り分けされます。
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GripVertical size={24} color="#22c55e" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>並び替え</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.8 }}>
                      左の⋮⋮をドラッグしてアイテムの順番を変更。カテゴリのサイドバーをドラッグしてカテゴリ順も変更可能です。
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <List size={24} color="#a855f7" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>その他</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.8 }}>
                      左スワイプで削除、☆で優先表示、▲▼で数量変更、右の✓で購入済みに。設定の「カテゴリの管理」で並び・追加・編集が可能です。
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

      {/* Category Manage Modal (unified) */}
      <AnimatePresence>
        {showCategoryManageMode && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay"
              onClick={() => { setShowCategoryManageMode(false); setEditingCatKey(null); }}
              style={{ zIndex: 100 }}
            />
            <motion.div
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={drawerTransition}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, height: '85vh', backgroundColor: 'var(--card-bg)',
                borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px',
                zIndex: 101, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>カテゴリの管理</h3>
                <button onClick={() => { setShowCategoryManageMode(false); setEditingCatKey(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}><X size={24} /></button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                並び替え・編集・追加ができます。ハンドルをドラッグして順序を変更し、編集ボタンで名前・絵文字・色を変更できます。
              </p>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <Reorder.Group
                  axis="y"
                  values={categoryOrder.filter(k => k !== 'other' && !deletedCategoryIds.includes(k))}
                  onReorder={(newOrder) => {
                    const order = [...newOrder, 'other'];
                    setCategoryOrder(order);
                    if (categoryOrderSaveTimeoutRef.current) clearTimeout(categoryOrderSaveTimeoutRef.current);
                    categoryOrderSaveTimeoutRef.current = setTimeout(() => {
                      saveSetting('categoryOrder', order);
                      categoryOrderSaveTimeoutRef.current = null;
                    }, 400);
                  }}
                  style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px' }}
                >
                  {categoryOrder.filter(k => k !== 'other' && !deletedCategoryIds.includes(k)).map(catKey => {
                    const isCustom = catKey.startsWith('custom_');
                    const isEditing = editingCatKey === catKey;
                    const dispName = mergedCategoryNames[catKey] || 'その他';
                    const dispIcon = mergedCategoryIcons[catKey] || '🏷️';
                    const dispColor = mergedCategoryColors[catKey] || categoryColors.other;
                    return (
                      <CategoryOrderItem
                        key={catKey}
                        catKey={catKey}
                        icon={dispIcon}
                        name={dispName}
                        color={dispColor}
                        isDeletable={true}
                        isFixed={false}
                        onEdit={() => {
                          setEditingCatKey(catKey);
                          if (isCustom) {
                            const c = customCategories.find(x => x.id === catKey);
                            setEditName(c?.name || '');
                            setEditIcon(c?.icon || '🏷️');
                            setEditColor(c?.color || CUSTOM_CATEGORY_COLORS[0]);
                          } else {
                            const ov = categoryOverrides[catKey];
                            setEditName(ov?.name ?? dispName);
                            setEditIcon(ov?.icon ?? dispIcon);
                            const hexColor = ov?.color ?? BUILTIN_DEFAULT_HEX[catKey] ?? CUSTOM_CATEGORY_COLORS[0];
                            setEditColor(CUSTOM_CATEGORY_COLORS.includes(hexColor) ? hexColor : (BUILTIN_DEFAULT_HEX[catKey] ?? CUSTOM_CATEGORY_COLORS[0]));
                          }
                        }}
                        onDelete={() => setCategoryToDelete({ catKey, isCustom })}
                        isEditing={isEditing}
                        editName={editName}
                        editIcon={editIcon}
                        editColor={editColor}
                        onEditNameChange={setEditName}
                        onEditIconChange={setEditIcon}
                        onEditColorChange={setEditColor}
                        onSaveEdit={() => {
                          if (isCustom) {
                            updateCustomCategory(catKey, { name: editName.trim(), icon: editIcon || '🏷️', color: editColor });
                          } else {
                            updateCategoryOverride(catKey, { name: editName.trim(), icon: editIcon || '🏷️', color: editColor });
                          }
                          setEditingCatKey(null);
                          showSuccess('保存しました');
                        }}
                        onCancelEdit={() => setEditingCatKey(null)}
                        colorOptions={CUSTOM_CATEGORY_COLORS}
                      />
                    );
                  })}
                </Reorder.Group>
                {/* その他（常に末尾固定） */}
                <div style={{ marginBottom: '24px' }}>
                  <CategoryOrderItem
                    catKey="other"
                    icon={mergedCategoryIcons.other || '🏷️'}
                    name={mergedCategoryNames.other || 'その他'}
                    color={mergedCategoryColors.other || categoryColors.other}
                    isDeletable={false}
                    isFixed={true}
                    onEdit={() => {
                      setEditingCatKey('other');
                      const ov = categoryOverrides.other;
                      setEditName(ov?.name ?? (mergedCategoryNames.other || 'その他'));
                      setEditIcon(ov?.icon ?? (mergedCategoryIcons.other || '🏷️'));
                      const hexColor = ov?.color ?? BUILTIN_DEFAULT_HEX.other;
                      setEditColor(CUSTOM_CATEGORY_COLORS.includes(hexColor) ? hexColor : BUILTIN_DEFAULT_HEX.other);
                    }}
                    onDelete={() => {}}
                    isEditing={editingCatKey === 'other'}
                    editName={editName}
                    editIcon={editIcon}
                    editColor={editColor}
                    onEditNameChange={setEditName}
                    onEditIconChange={setEditIcon}
                    onEditColorChange={setEditColor}
                    onSaveEdit={() => {
                      updateCategoryOverride('other', { name: editName.trim(), icon: editIcon || '🏷️', color: editColor });
                      setEditingCatKey(null);
                      showSuccess('保存しました');
                    }}
                    onCancelEdit={() => setEditingCatKey(null)}
                    colorOptions={CUSTOM_CATEGORY_COLORS}
                  />
                </div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>新規追加</h4>
                <CustomCategoryForm onAdd={(name, icon, color) => { addCustomCategory(name, icon, color); showSuccess('カテゴリを追加しました'); }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Delete Confirmation */}
      <AnimatePresence>
        {categoryToDelete && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay"
              onClick={() => setCategoryToDelete(null)}
              style={{ zIndex: 110 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 111, width: 'min(90vw, 320px)', backgroundColor: 'var(--card-bg)',
                borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-lg)'
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>このカテゴリを削除しますか？</h4>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                含まれる品目は「その他」に振り替えられます。
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setCategoryToDelete(null)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>キャンセル</button>
                <button onClick={() => {
                  const { catKey, isCustom } = categoryToDelete;
                  setCategoryToDelete(null);
                  if (isCustom) {
                    removeCustomCategory(catKey);
                    showSuccess('カテゴリを削除しました');
                  } else {
                    removeBuiltinCategory(catKey);
                  }
                }} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>削除</button>
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
            <div className="list-container" style={{ zoom: listZoom, paddingBottom: '90px' }}>
              {items.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={48} className="empty-icon" />
                  <p>買うものはありません</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.7 }}>上の欄から追加するか、履歴から選んでください</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const starredItems = showStarFeature
                      ? items.filter(i => i.starred).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                      : [];
                    const nonStarredItems = showStarFeature
                      ? items.filter(i => !i.starred)
                      : items;

                    const renderItem = (item) => (
                      <SwipeableItem
                        key={item.id}
                        item={item}
                        onPurchase={purchaseItem}
                        onDelete={deleteItem}
                        onChangeCategory={(i) => setSelectedItemForCategory(i)}
                        onUpdateQuantity={updateQuantity}
                        onToggleStar={toggleStar}
                        showStarFeature={showStarFeature}
                        categoryColorsMap={mergedCategoryColors}
                        isTutorialCard={item.isTutorialCard}
                      />
                    );

                    return (
                      <>
                        {/* 星付きアイテム（最上部固定） */}
                        {showStarFeature && starredItems.length > 0 && (
                          <div className="category-group" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <div className="category-sidebar" style={{
                              width: '40px', flexShrink: 0,
                              backgroundColor: '#fef3c7',
                              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '20px', padding: '12px 0px', border: '1px solid rgba(0,0,0,0.1)',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                              ⭐
                            </div>
                            <Reorder.Group
                              axis="y"
                              values={starredItems}
                              onReorder={(newOrder) => {
                                handleReorder([...newOrder, ...nonStarredItems]);
                              }}
                              style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}
                            >
                              {starredItems.map(renderItem)}
                            </Reorder.Group>
                          </div>
                        )}

                        {/* カテゴリ分類OFF: 登録順フラット表示 */}
                        {!showCategoryFeature ? (
                          <Reorder.Group
                            axis="y"
                            values={nonStarredItems}
                            onReorder={(newOrder) => {
                              handleReorder([...starredItems, ...newOrder]);
                            }}
                            style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}
                          >
                            {nonStarredItems
                              .slice()
                              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                              .map(renderItem)}
                          </Reorder.Group>
                        ) : (
                          /* カテゴリグループ（非星アイテム）リスト画面でドラッグして並び替え可能 */
                          (() => {
                            const visibleCategoryKeys = effectiveCategoryOrder.filter(catKey => nonStarredItems.some(i => (i.category || 'other') === catKey));
                            return (
                              <Reorder.Group
                                axis="y"
                                values={visibleCategoryKeys}
                                onReorder={(newOrder) => {
                                  const order = [...newOrder.filter(k => k !== 'other'), ...effectiveCategoryOrder.filter(k => k !== 'other' && !newOrder.includes(k)), 'other'];
                                  setCategoryOrder(order);
                                  if (categoryOrderSaveTimeoutRef.current) clearTimeout(categoryOrderSaveTimeoutRef.current);
                                  categoryOrderSaveTimeoutRef.current = setTimeout(() => {
                                    saveSetting('categoryOrder', order);
                                    categoryOrderSaveTimeoutRef.current = null;
                                  }, 400);
                                }}
                                style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}
                              >
                                {visibleCategoryKeys.map(catKey => {
                                  const catItems = nonStarredItems.filter(i => (i.category || 'other') === catKey);
                                  return (
                                    <CategoryGroupRow
                                      key={catKey}
                                      catKey={catKey}
                                      catItems={catItems}
                                      mergedCategoryColors={mergedCategoryColors}
                                      mergedCategoryIcons={mergedCategoryIcons}
                                      categoryColors={categoryColors}
                                      renderItem={renderItem}
                                      items={items}
                                      showStarFeature={showStarFeature}
                                      handleReorder={handleReorder}
                                    />
                                  );
                                })}
                              </Reorder.Group>
                            );
                          })()
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Import Text Modal（全画面フレックス） */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            key="import-modal"
            ref={importContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0,
              height: '100dvh',
              zIndex: 1011,
              background: 'var(--bg)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* ヘッダー */}
            <div style={{
              flexShrink: 0,
              padding: '20px 24px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid var(--border)',
            }}>
              <h3 style={{ margin: 0 }}>テキストから一括追加</h3>
              <button
                onClick={() => setShowImport(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* textarea（残り空間を全て占有） */}
            <textarea
              autoFocus
              placeholder="LINEやメモ帳からテキストを貼り付けできます。&#10;(例: 牛乳 2、卵)"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              style={{
                flex: 1, margin: '16px 24px 0',
                padding: '14px', borderRadius: '12px',
                border: '1px solid var(--border)',
                resize: 'none',
                backgroundColor: 'var(--bg)', color: 'var(--text-main)',
                fontSize: '1rem', outline: 'none',
                minHeight: 0,
              }}
            />

            {/* ボタン（常に最下部） */}
            <div style={{ flexShrink: 0, padding: '12px 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleImport}
                className="add-button"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem' }}
              >
                抽出して一括追加
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Confirm Center Dialog */}
      <AnimatePresence>
        {showShareConfirm && (
          <>
            <motion.div
              key="share-confirm-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer-overlay"
              onClick={() => setShowShareConfirm(false)}
            />
            <div
              key="share-confirm-dialog-wrapper"
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000, width: 'min(90vw, 360px)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  background: 'var(--card-bg)', borderRadius: '20px',
                  boxShadow: 'var(--shadow-lg)', padding: '28px 24px',
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>リストを履歴に移動しますか？</h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  全アイテムを本日の履歴に追加してリストをクリアします。
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={handleMoveToHistory}
                    className="add-button"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem' }}
                  >
                    履歴に移動してリストをクリア
                  </button>
                  <button
                    onClick={() => setShowShareConfirm(false)}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      color: 'var(--text-main)', cursor: 'pointer'
                    }}
                  >
                    このまま残す
                  </button>
                </div>
              </motion.div>
            </div>
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

