// 목록 이름·경력 링크 뒤 꺾쇠. 움직임은 global.css 의 .lm·.arm
export const Chevron = () => (
  <svg className="lm" viewBox="0 0 16 16" aria-hidden="true">
    <path className="arm up" d="M6 4L10 8" />
    <path className="arm dn" d="M10 8L6 12" />
  </svg>
);
