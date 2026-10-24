import { useRef } from 'react';

// 메뉴 행([data-row])을 따라 미끄러지는 하이라이트 하나. 처음 뜰 땐 제자리에 나타나고(페이드), 그 뒤로는 행 사이를 이동한다.
export function useGlide() {
  const pill = useRef<HTMLSpanElement>(null);
  const shown = useRef(false);
  const move = (row: Element | null | undefined) => {
    const p = pill.current;
    if (!p) return;
    if (!(row instanceof HTMLElement)) {
      p.style.opacity = '0';
      shown.current = false;
      return;
    }
    p.style.transitionDuration = shown.current ? '' : '0ms, 150ms';
    const list = p.parentElement!;
    const top = row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    p.style.transform = `translateY(${top}px)`;
    p.style.height = `${row.offsetHeight}px`;
    p.style.opacity = '1';
    shown.current = true;
  };
  const rowOf = (e: { target: EventTarget }) => (e.target as Element).closest('[data-row]');
  const handlers = {
    onPointerOver: (e: React.PointerEvent) => move(rowOf(e)),
    onFocus: (e: React.FocusEvent) => move(rowOf(e)),
    onPointerLeave: () => move(null),
  };
  return { pill, move, handlers };
}
