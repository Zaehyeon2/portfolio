import { useEffect, useRef, useState } from 'react';

// 바뀐 자리만 아래에서 튀어 오른다(Number pop-in). 자리는 오른쪽 끝부터 세어 key 를 잡아 안 바뀐 자리는 그대로 둔다.
export default function Digits({ value }: { value: number }) {
  const ready = useRef(false);
  useEffect(() => {
    ready.current = true;
  }, []);
  const s = String(value);
  let n = 0;
  return (
    <>
      {[...s].map((ch, i) => (
        <Digit key={`${s.length - i}:${ch}`} ch={ch} pop={ready.current} order={() => n++} />
      ))}
    </>
  );
}

function Digit({ ch, pop, order }: { ch: string; pop: boolean; order: () => number }) {
  // 처음 그릴 때만 정해 두어, 같은 자리가 다시 그려져도 애니메이션이 다시 걸리지 않는다.
  const [delay] = useState(() => (pop ? order() * 70 : -1));
  return delay < 0 ? <span className="dg">{ch}</span> : <span className="dg rise" style={{ animationDelay: `${delay}ms` }}>{ch}</span>;
}
