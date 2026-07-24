import { ALBUM_STATUS, ALBUM_VISIBILITY, MEDIA_TYPE } from '../types/gallery';
import { mockEventCreator } from './mockAuth';

const familyId = 'family-nguyen';

const svgImage = (title, bg, fg = '#ffffff') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="${bg}"/>
      <circle cx="1010" cy="160" r="96" fill="rgba(255,255,255,0.18)"/>
      <path d="M0 610 C210 520 360 610 560 540 C760 470 910 580 1200 470 L1200 800 L0 800 Z" fill="rgba(255,255,255,0.2)"/>
      <text x="80" y="650" fill="${fg}" font-family="Arial, sans-serif" font-size="64" font-weight="700">${title}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const videoPoster = (title) => svgImage(title, '#374151');

export const mockGalleryAlbums = [
  {
    id: 'album-thanh-minh-2026',
    familyId,
    title: 'Lễ Thanh Minh 2026',
    description: 'Những khoảnh khắc con cháu về tảo mộ, dâng hương và gặp mặt đầu năm.',
    coverImage: svgImage('Lễ Thanh Minh 2026', '#9b2c2c'),
    visibility: ALBUM_VISIBILITY.PUBLIC,
    status: ALBUM_STATUS.VISIBLE,
    createdBy: mockEventCreator,
    createdAt: '2026-04-05T08:00:00+07:00',
    updatedAt: '2026-04-05T11:30:00+07:00',
    notifiedAt: '2026-04-05T08:05:00+07:00',
    media: [
      {
        id: 'media-thanh-minh-01',
        type: MEDIA_TYPE.IMAGE,
        url: svgImage('Dâng hương tại mộ tổ', '#742a2a'),
        thumbnailUrl: svgImage('Dâng hương tại mộ tổ', '#742a2a'),
        fileName: 'dang-huong-mo-to.webp',
        description: 'Con cháu chuẩn bị lễ vật và dâng hương tại phần mộ tổ.',
        uploadedBy: mockEventCreator,
        uploadedAt: '2026-04-05T08:20:00+07:00',
      },
      {
        id: 'media-thanh-minh-02',
        type: MEDIA_TYPE.IMAGE,
        url: svgImage('Gặp mặt sau lễ', '#b45309'),
        thumbnailUrl: svgImage('Gặp mặt sau lễ', '#b45309'),
        fileName: 'gap-mat-sau-le.webp',
        description: 'Các gia đình chụp ảnh lưu niệm sau phần lễ chính.',
        uploadedBy: mockEventCreator,
        uploadedAt: '2026-04-05T10:15:00+07:00',
      },
      {
        id: 'media-thanh-minh-03',
        type: MEDIA_TYPE.VIDEO,
        url: '',
        thumbnailUrl: videoPoster('Video đọc gia phả'),
        fileName: 'doc-gia-pha.webm',
        description: 'Video ghi lại phần đọc lại tên các chi trong gia phả.',
        uploadedBy: mockEventCreator,
        uploadedAt: '2026-04-05T10:40:00+07:00',
      },
    ],
  },
  {
    id: 'album-tu-duong',
    familyId,
    title: 'Khánh thành từ đường',
    description: 'Album nội bộ ghi lại quá trình hoàn thiện và lễ khánh thành từ đường họ Nguyễn.',
    coverImage: svgImage('Khánh thành từ đường', '#1f2937'),
    visibility: ALBUM_VISIBILITY.INTERNAL,
    status: ALBUM_STATUS.VISIBLE,
    createdBy: mockEventCreator,
    createdAt: '2026-05-18T07:30:00+07:00',
    updatedAt: '2026-05-18T12:10:00+07:00',
    notifiedAt: '2026-05-18T07:35:00+07:00',
    media: [
      {
        id: 'media-tu-duong-01',
        type: MEDIA_TYPE.IMAGE,
        url: svgImage('Cổng từ đường mới', '#365314'),
        thumbnailUrl: svgImage('Cổng từ đường mới', '#365314'),
        fileName: 'cong-tu-duong-moi.webp',
        description: 'Cổng từ đường sau khi hoàn thiện phần sơn son thếp vàng.',
        uploadedBy: mockEventCreator,
        uploadedAt: '2026-05-18T08:00:00+07:00',
      },
      {
        id: 'media-tu-duong-02',
        type: MEDIA_TYPE.VIDEO,
        url: '',
        thumbnailUrl: videoPoster('Nghi thức khánh thành'),
        fileName: 'nghi-thuc-khanh-thanh.mp4',
        description: 'Đoạn video ngắn ghi lại nghi thức cắt băng khánh thành.',
        uploadedBy: mockEventCreator,
        uploadedAt: '2026-05-18T09:30:00+07:00',
      },
    ],
  },
  {
    id: 'album-khuyen-hoc',
    familyId,
    title: 'Trao thưởng khuyến học',
    description: 'Hình ảnh các cháu nhận phần thưởng khuyến học của dòng họ.',
    coverImage: svgImage('Trao thưởng khuyến học', '#0f766e'),
    visibility: ALBUM_VISIBILITY.PUBLIC,
    status: ALBUM_STATUS.VISIBLE,
    createdBy: mockEventCreator,
    createdAt: '2026-06-20T15:00:00+07:00',
    updatedAt: '2026-06-20T17:20:00+07:00',
    notifiedAt: '2026-06-20T15:05:00+07:00',
    media: [
      {
        id: 'media-khuyen-hoc-01',
        type: MEDIA_TYPE.IMAGE,
        url: svgImage('Trao giấy khen', '#0f766e'),
        thumbnailUrl: svgImage('Trao giấy khen', '#0f766e'),
        fileName: 'trao-giay-khen.webp',
        description: 'Các cháu đạt thành tích cao nhận giấy khen từ ban khuyến học.',
        uploadedBy: mockEventCreator,
        uploadedAt: '2026-06-20T15:45:00+07:00',
      },
    ],
  },
  {
    id: 'album-tu-lieu-cu',
    familyId,
    title: 'Tư liệu ảnh cũ',
    description: 'Album đang rà soát lại thông tin trước khi hiển thị cho mọi người.',
    coverImage: svgImage('Tư liệu ảnh cũ', '#4b5563'),
    visibility: ALBUM_VISIBILITY.INTERNAL,
    status: ALBUM_STATUS.HIDDEN,
    createdBy: mockEventCreator,
    createdAt: '2026-03-10T09:00:00+07:00',
    updatedAt: '2026-07-01T09:00:00+07:00',
    notifiedAt: null,
    media: [
      {
        id: 'media-tu-lieu-cu-01',
        type: MEDIA_TYPE.IMAGE,
        url: svgImage('Ảnh họp họ năm 1998', '#4b5563'),
        thumbnailUrl: svgImage('Ảnh họp họ năm 1998', '#4b5563'),
        fileName: 'hop-ho-1998.webp',
        description: 'Ảnh scan từ buổi họp họ năm 1998, đang xác minh tên người trong ảnh.',
        uploadedBy: mockEventCreator,
        uploadedAt: '2026-03-10T09:20:00+07:00',
      },
    ],
  },
];
