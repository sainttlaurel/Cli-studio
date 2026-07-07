import type { PlacedSticker, StickerKey } from './store';

export interface StickerDefinition {
  key: StickerKey;
  label: string;
  text: string;
  bg: string;
  fg: string;
  border: string;
  shape: 'pill' | 'circle' | 'ticket';
}

export const STICKERS: StickerDefinition[] = [
  {
    key: 'love',
    label: 'Love',
    text: 'LOVE',
    bg: '#FFE4F1',
    fg: '#BE185D',
    border: '#FF1493',
    shape: 'pill',
  },
  {
    key: 'xoxo',
    label: 'XOXO',
    text: 'XOXO',
    bg: '#EDE9FE',
    fg: '#6D28D9',
    border: '#A78BFA',
    shape: 'ticket',
  },
  {
    key: 'bff',
    label: 'BFF',
    text: 'BFF',
    bg: '#D1FAE5',
    fg: '#047857',
    border: '#34D399',
    shape: 'circle',
  },
  {
    key: 'wow',
    label: 'Wow',
    text: 'WOW',
    bg: '#FEF3C7',
    fg: '#B45309',
    border: '#FBBF24',
    shape: 'pill',
  },
  {
    key: 'cute',
    label: 'Cute',
    text: 'CUTE',
    bg: '#DBEAFE',
    fg: '#1D4ED8',
    border: '#60A5FA',
    shape: 'ticket',
  },
  {
    key: 'flash',
    label: 'Flash',
    text: 'FLASH',
    bg: '#FCE7F3',
    fg: '#9D174D',
    border: '#F472B6',
    shape: 'pill',
  },
];

export function getStickerDefinition(key: StickerKey) {
  return STICKERS.find((sticker) => sticker.key === key) ?? STICKERS[0];
}

export function getNextStickerPosition(count: number): Pick<PlacedSticker, 'x' | 'y' | 'rotation'> {
  const positions = [
    { x: 18, y: 16, rotation: -9 },
    { x: 78, y: 24, rotation: 8 },
    { x: 24, y: 62, rotation: 7 },
    { x: 74, y: 76, rotation: -6 },
    { x: 50, y: 43, rotation: 3 },
    { x: 40, y: 84, rotation: -4 },
  ];

  return positions[count % positions.length];
}
