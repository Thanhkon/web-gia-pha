import { POST_STATUS, POST_VISIBILITY } from '../types/posts';
import { mockPostCreator } from './mockAuth';

export const mockPosts = [
  {
    id: 'post-001',
    familyId: 'family-nguyen',
    title: 'Lễ dâng hương đầu xuân tại từ đường họ Nguyễn',
    summary: 'Con cháu các chi họ cùng về từ đường dâng hương, ôn lại gia phong và bàn việc khuyến học trong năm mới.',
    content: `Sáng mùng 8 tháng Giêng, con cháu họ Nguyễn từ nhiều nơi đã có mặt tại từ đường chính để dự lễ dâng hương đầu xuân.

Buổi lễ diễn ra trang nghiêm với phần đọc chúc văn, tưởng nhớ công đức tổ tiên và báo cáo những việc dòng họ đã làm được trong năm qua. Đại diện các chi cũng thống nhất tiếp tục duy trì quỹ khuyến học, hỗ trợ việc ghi chép phả hệ và tu bổ khuôn viên từ đường.

Sau nghi lễ, các gia đình cùng dùng bữa cơm thân mật. Nhiều câu chuyện về nếp nhà, nghề nghiệp và ký ức quê hương được chia sẻ, giúp lớp trẻ hiểu thêm về nguồn cội và trách nhiệm gìn giữ truyền thống.`,
    category: 'Hoạt động dòng họ',
    coverImage: 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?auto=format&fit=crop&w=1200&q=80',
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.PUBLIC,
    author: mockPostCreator,
    publishedAt: '2026-02-24T09:00:00+07:00',
    createdAt: '2026-02-20T20:15:00+07:00',
    updatedAt: '2026-02-24T09:00:00+07:00',
    notifiedAt: '2026-02-24T09:00:00+07:00',
    hasSentPublishNotification: true,
  },
  {
    id: 'post-002',
    familyId: 'family-nguyen',
    title: 'Danh sách học sinh nhận thưởng khuyến học năm 2026',
    summary: 'Quỹ khuyến học dòng họ công bố danh sách con cháu đạt thành tích nổi bật trong năm học vừa qua.',
    content: `Ban khuyến học họ Nguyễn đã tổng hợp thành tích học tập của con cháu trong năm học 2025 - 2026. Năm nay có 18 cháu đạt học sinh giỏi cấp trường, 6 cháu đạt giải cấp huyện và 2 cháu trúng tuyển đại học với điểm số cao.

Lễ trao thưởng dự kiến tổ chức trong ngày họp mặt cuối tháng Bảy. Các gia đình vui lòng kiểm tra thông tin, bổ sung giấy khen còn thiếu và gửi về ban liên lạc trước ngày 25/07/2026.

Dòng họ mong muốn quỹ khuyến học không chỉ là phần thưởng vật chất, mà còn là lời nhắc rằng sự học luôn là nếp đẹp cần được nâng đỡ qua từng thế hệ.`,
    category: 'Khuyến học',
    coverImage: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.INTERNAL,
    author: {
      id: 'user-member-thi-b',
      name: 'Nguyễn Thị B',
      role: 'Thành viên',
    },
    publishedAt: '2026-07-05T07:30:00+07:00',
    createdAt: '2026-07-02T14:10:00+07:00',
    updatedAt: '2026-07-05T07:30:00+07:00',
    notifiedAt: '2026-07-05T07:30:00+07:00',
    hasSentPublishNotification: true,
  },
  {
    id: 'post-003',
    familyId: 'family-nguyen',
    title: 'Ghi chép về cụ Nguyễn Văn Thành trong gia phả cũ',
    summary: 'Một số tư liệu mới tìm được giúp bổ sung mốc thời gian và nơi sinh sống của cụ Nguyễn Văn Thành.',
    content: `Trong quá trình rà soát bản gia phả chép tay lưu tại nhà thờ chi 2, ban biên tập tìm thấy thêm ghi chú liên quan đến cụ Nguyễn Văn Thành. Ghi chú này cho biết cụ từng tham gia khai hoang vùng bãi ven sông và là người đứng ra dựng nhà thờ nhỏ đầu tiên của chi.

Thông tin vẫn cần được đối chiếu thêm với lời kể của các bậc cao niên và bản sao sắc phong do gia đình ông Nguyễn Văn D lưu giữ. Bài viết này đang để ở dạng bản nháp để chờ bổ sung nguồn dẫn đầy đủ.

Các thành viên có tư liệu liên quan có thể gửi ảnh chụp hoặc bản chép tay cho ban biên tập gia phả.`,
    category: 'Lịch sử và truyền thống',
    coverImage: '',
    status: POST_STATUS.DRAFT,
    visibility: POST_VISIBILITY.INTERNAL,
    author: mockPostCreator,
    publishedAt: null,
    createdAt: '2026-06-15T21:45:00+07:00',
    updatedAt: '2026-07-01T19:20:00+07:00',
    notifiedAt: null,
    hasSentPublishNotification: false,
  },
  {
    id: 'post-004',
    familyId: 'family-nguyen',
    title: 'Thông báo tạm hoãn buổi họp đại diện các chi',
    summary: 'Do điều kiện thời tiết, buổi họp đại diện các chi dự kiến cuối tuần này sẽ được chuyển sang tuần sau.',
    content: `Ban liên lạc dòng họ thông báo tạm hoãn buổi họp đại diện các chi dự kiến tổ chức vào Chủ nhật tuần này.

Lý do là một số gia đình ở xa bị ảnh hưởng bởi mưa lớn, việc di chuyển không thuận tiện. Thời gian họp mới dự kiến là 08:30 ngày 02/08/2026 tại nhà văn hóa thôn.

Nội dung họp vẫn gồm ba phần chính: chuẩn bị lễ giỗ tổ, rà soát danh sách thành viên mới và thống nhất kế hoạch sửa chữa sân từ đường.`,
    category: 'Thông báo',
    coverImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    status: POST_STATUS.HIDDEN,
    visibility: POST_VISIBILITY.PUBLIC,
    author: mockPostCreator,
    publishedAt: '2026-07-18T08:00:00+07:00',
    createdAt: '2026-07-17T22:00:00+07:00',
    updatedAt: '2026-07-20T06:30:00+07:00',
    notifiedAt: '2026-07-18T08:00:00+07:00',
    hasSentPublishNotification: true,
  },
  {
    id: 'post-005',
    familyId: 'family-nguyen',
    title: 'Gương sáng dòng họ: bác sĩ Nguyễn Minh Cường',
    summary: 'Câu chuyện về bác sĩ trẻ trở về quê tổ chức khám sức khỏe miễn phí cho các cụ cao niên trong họ.',
    content: `Bác sĩ Nguyễn Minh Cường, con cháu chi 4, hiện công tác tại một bệnh viện tuyến trung ương. Trong dịp về quê vừa qua, anh đã phối hợp với trạm y tế xã tổ chức buổi kiểm tra huyết áp, đường huyết và tư vấn sức khỏe cho các cụ cao niên trong dòng họ.

Điều đáng quý là hoạt động được chuẩn bị giản dị nhưng chu đáo. Các cháu thanh niên phụ trách đưa đón, ghi phiếu và hỗ trợ các cụ trong suốt buổi khám.

Ban liên lạc mong muốn câu chuyện này lan tỏa tinh thần sống có ích, biết nhớ về quê hương và quan tâm tới người lớn tuổi trong gia đình.`,
    category: 'Văn hóa dòng họ',
    coverImage: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.PUBLIC,
    author: {
      id: 'user-member-minh-c',
      name: 'Nguyễn Minh Cường',
      role: 'Thành viên',
    },
    publishedAt: '2026-06-12T10:30:00+07:00',
    createdAt: '2026-06-10T18:00:00+07:00',
    updatedAt: '2026-06-12T10:30:00+07:00',
    notifiedAt: '2026-06-12T10:30:00+07:00',
    hasSentPublishNotification: true,
  },
  {
    id: 'post-006',
    familyId: 'family-tran',
    title: 'Tin nội bộ họ Trần về việc bổ sung phả hệ',
    summary: 'Bài nội bộ thuộc dòng họ khác, dùng để kiểm tra giới hạn xem và quản lý theo familyId.',
    content: 'Nội dung này phục vụ kiểm thử phân quyền giữa các dòng họ khác nhau. Người dùng họ Nguyễn không được xem trực tiếp bài nội bộ này.',
    category: 'Khác',
    coverImage: '',
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.INTERNAL,
    author: {
      id: 'user-other-family',
      name: 'Nguyễn Văn D',
      role: 'Thành viên',
    },
    publishedAt: '2026-05-02T08:20:00+07:00',
    createdAt: '2026-04-30T09:00:00+07:00',
    updatedAt: '2026-05-02T08:20:00+07:00',
    notifiedAt: '2026-05-02T08:20:00+07:00',
    hasSentPublishNotification: true,
  },
  {
    id: 'post-007',
    familyId: 'family-nguyen',
    title: 'Kế hoạch sưu tầm ảnh tư liệu các đời',
    summary: 'Ban gia phả kêu gọi con cháu gửi ảnh cũ, giấy tờ và kỷ vật để số hóa, lưu giữ lâu dài.',
    content: `Trong tháng tới, ban gia phả sẽ mở đợt sưu tầm ảnh tư liệu các đời. Những ảnh chân dung, ảnh lễ họ, giấy chứng nhận, bản chép tay hoặc kỷ vật có câu chuyện gia đình đều có giá trị lưu giữ.

Mỗi gia đình có thể gửi bản scan hoặc ảnh chụp rõ nét. Ban biên tập sẽ phân loại, ghi chú nguồn cung cấp và xin phép trước khi đưa lên thư viện chung.

Việc số hóa tư liệu là bước cần thiết để các thế hệ sau có thể nhìn lại lịch sử dòng họ bằng những hình ảnh gần gũi, cụ thể.`,
    category: 'Tin dòng họ',
    coverImage: '',
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.INTERNAL,
    author: mockPostCreator,
    publishedAt: '2026-07-14T16:00:00+07:00',
    createdAt: '2026-07-11T09:30:00+07:00',
    updatedAt: '2026-07-14T16:00:00+07:00',
    notifiedAt: '2026-07-14T16:00:00+07:00',
    hasSentPublishNotification: true,
  },
  {
    id: 'post-008',
    familyId: 'family-tran',
    title: 'Gương sáng họ Trần: người gìn giữ nghề mộc truyền thống',
    summary: 'Bài công khai thuộc dòng họ khác, dùng để kiểm tra người quản lý họ Nguyễn có thể xem nhưng không thể thao tác.',
    content: `Ông Trần Văn Nghĩa nhiều năm gìn giữ nghề mộc truyền thống của gia đình và truyền lại cho con cháu trong làng.

Câu chuyện được đăng công khai để các dòng họ khác có thể tham khảo cách lưu giữ ký ức nghề nghiệp và nếp nhà qua từng thế hệ.`,
    category: 'Gương sáng',
    coverImage: '',
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.PUBLIC,
    author: {
      id: 'user-family-head-tran-01',
      name: 'Trần Văn Quản',
      role: 'Trưởng họ',
    },
    publishedAt: '2026-04-12T08:00:00+07:00',
    createdAt: '2026-04-10T20:30:00+07:00',
    updatedAt: '2026-04-12T08:00:00+07:00',
    notifiedAt: '2026-04-12T08:00:00+07:00',
    hasSentPublishNotification: true,
  },
];
