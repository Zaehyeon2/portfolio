// 불릿이 "라벨: 내용" 으로 시작하면 라벨을 <b class="lb"> 로 감싼다(라벨 30자 이하, 라벨 안에 : 없음).
export default function rehypeLabel() {
  const walk = (node) => {
    if (node.tagName === 'li') {
      const first = node.children.find((c) => c.type !== 'text' || c.value.trim());
      const m = first?.type === 'text' && first.value.match(/^(\s*)([^:*\n]{1,30}):\s+([\s\S]*)$/);
      if (m) {
        node.children.splice(node.children.indexOf(first), 1,
          { type: 'element', tagName: 'b', properties: { className: ['lb'] }, children: [{ type: 'text', value: m[2] }] },
          { type: 'text', value: ` ${m[3]}` });
      }
    }
    node.children?.forEach(walk);
  };
  return walk;
}
