import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight, Heart } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import '../../css/components/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoImg} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            <span>Gia Phả Số</span>
          </h3>
          <p>
            Nền tảng quản lý và lưu giữ gia phả số hóa hiện đại, giúp kết nối các thế hệ, bảo tồn truyền thống và lưu truyền những giá trị tốt đẹp của dòng họ cho muôn đời sau.
          </p>
        </div>

        <div className="footer-column">
          <h3>Liên Kết Nhanh</h3>
          <ul className="footer-links">
            <li>
              <Link to="/">
                <ChevronRight size={16} />
                Trang chủ
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Liên Hệ</h3>
          <div className="footer-contact">
            <div className="contact-item">
              <MapPin size={18} />
              <span>Hà Nội, Việt Nam</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>+84 123 456 789</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>hotro@giaphaso.vn</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div>&copy; {currentYear} Gia Phả Số. All rights reserved.</div>
      </div>
    </footer>
  );
};

export default Footer;
