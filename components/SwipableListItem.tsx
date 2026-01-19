
import React, { useState, useRef } from 'react';

interface SwipableListItemProps {
  children: React.ReactNode;
  onSwipe: () => void;
  swipeContent: React.ReactNode;
  isBookmarked?: boolean;  // 是否已收藏
  unbookmarkContent?: React.ReactNode;  // 取消收藏时显示的内容
}

const SwipableListItem: React.FC<SwipableListItemProps> = ({
  children,
  onSwipe,
  swipeContent,
  isBookmarked = false,
  unbookmarkContent
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [showSwipeContent, setShowSwipeContent] = useState(false);
  const actionTriggered = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleDragStart = (clientX: number, clientY: number, e?: React.TouchEvent | React.MouseEvent) => {
    // Don't interfere with parent's touch handling - just record start position
    actionTriggered.current = false;
    startPos.current = { x: clientX, y: clientY };
    isHorizontalSwipe.current = null;
    // Don't set isSwiping yet - wait until we determine direction
  };

  const handleDragMove = (clientX: number, clientY: number, e?: React.TouchEvent | React.MouseEvent) => {
    if (!startPos.current) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if this is a horizontal or vertical swipe after initial movement
    if (isHorizontalSwipe.current === null && (absDeltaX > 10 || absDeltaY > 10)) {
      isHorizontalSwipe.current = absDeltaX > absDeltaY;

      // If it's vertical, reset and let parent handle (pull-to-refresh)
      if (!isHorizontalSwipe.current) {
        startPos.current = null;
        setIsSwiping(false);
        setTranslateX(0);
        setShowSwipeContent(false);
        isHorizontalSwipe.current = null;
        return; // Let event bubble to parent
      }

      // If horizontal, start handling the swipe
      setIsSwiping(true);
      if (itemRef.current) itemRef.current.style.transition = 'none';
      setShowSwipeContent(true);
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current === true && deltaX > 0) { // Only allow right swipe
      if (e) {
        if ('preventDefault' in e && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
        if ('stopPropagation' in e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      }
      setTranslateX(Math.min(deltaX, 96));
    }
  };

  const handleDragEnd = () => {
    if (!startPos.current) return;

    if (itemRef.current) itemRef.current.style.transition = 'transform 0.15s ease-out';

    if (isSwiping && isHorizontalSwipe.current === true && translateX > 70 && !actionTriggered.current) {
      actionTriggered.current = true;
      onSwipe();
    }

    setTranslateX(0);
    setIsSwiping(false);
    startPos.current = null;
    isHorizontalSwipe.current = null;
    setTimeout(() => setShowSwipeContent(false), 200);
  };

  // 根据是否已收藏显示不同的滑动内容
  const displaySwipeContent = isBookmarked && unbookmarkContent ? unbookmarkContent : swipeContent;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className={`absolute inset-0 flex items-center justify-start rounded-2xl transition-opacity duration-150 ${showSwipeContent ? 'opacity-100' : 'opacity-0'}`}
      >
        {displaySwipeContent}
      </div>
      <div
        ref={itemRef}
        style={{
          transform: `translate3d(${translateX}px, 0, 0)`,
          willChange: isSwiping ? 'transform' : 'auto'
        }}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY, e)}
        onMouseMove={(e) => handleDragMove(e.clientX, e.clientY, e)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleDragStart(touch.clientX, touch.clientY, e);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleDragMove(touch.clientX, touch.clientY, e);
        }}
        onTouchEnd={handleDragEnd}
        className="relative z-10 w-full"
      >
        {children}
      </div>
    </div>
  );
};

export default SwipableListItem;
