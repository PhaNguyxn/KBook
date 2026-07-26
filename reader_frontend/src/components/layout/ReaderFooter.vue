<template>
  <footer class="reader-footer">
    <section class="newsletter-section">
      <div class="reader-container newsletter-inner">
        <div class="newsletter-heading">
          <span class="newsletter-icon">
            <i class="bi bi-envelope-paper" />
          </span>

          <div>
            <h2>
              Đăng ký nhận bản tin
            </h2>

            <p>
              Nhận thông tin sách mới và ưu đãi
              hấp dẫn mỗi tuần.
            </p>
          </div>
        </div>

        <form class="newsletter-form">
          <input
            type="email"
            placeholder="Nhập email của bạn"
          />

          <button type="submit">
            Đăng ký
          </button>
        </form>
      </div>
    </section>

    <section class="footer-main">
      <div class="reader-container footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <i class="bi bi-book-half" />

            <div>
              <strong>KBook</strong>
              <small>Reader</small>
            </div>
          </div>

          <p>
            Nền tảng mượn sách trực tuyến tiện
            lợi, giúp bạn đọc nhiều hơn mỗi ngày.
          </p>

          <div class="social-links">
            <a href="#">
              <i class="bi bi-facebook" />
            </a>

            <a href="#">
              <i class="bi bi-instagram" />
            </a>

            <a href="#">
              <i class="bi bi-youtube" />
            </a>

            <a href="#">
              <i class="bi bi-tiktok" />
            </a>
          </div>
        </div>

        <div class="footer-column">
          <h3>Về KBook</h3>

          <RouterLink to="/">
            Giới thiệu
          </RouterLink>

          <RouterLink to="/books">
            Danh mục sách
          </RouterLink>

          <a href="#">
            Hướng dẫn mượn
          </a>

          <a href="#">
            Điều khoản sử dụng
          </a>

          <a href="#">
            Chính sách bảo mật
          </a>
        </div>

        <div class="footer-column">
          <h3>Hỗ trợ</h3>

          <a href="#">
            Trung tâm trợ giúp
          </a>

          <a href="#">
            Câu hỏi thường gặp
          </a>

          <a href="#">
            Quy định thư viện
          </a>

          <a href="#">
            Chính sách hội viên
          </a>

          <a href="#">
            Liên hệ hỗ trợ
          </a>
        </div>

        <div class="footer-column">
          <h3>Tài khoản</h3>

          <RouterLink to="/login">
            Đăng nhập
          </RouterLink>

          <RouterLink to="/register">
            Đăng ký
          </RouterLink>

          <RouterLink to="/profile">
            Quản lý tài khoản
          </RouterLink>

          <RouterLink to="/requests">
            Yêu cầu mượn
          </RouterLink>

          <RouterLink to="/borrows">
            Lịch sử mượn
          </RouterLink>
        </div>

        <div class="footer-column contact-column">
          <h3>Liên hệ</h3>

          <p>
            <i class="bi bi-telephone" />
            Hotline: 1900 9876
          </p>

          <p>
            <i class="bi bi-envelope" />
            support@kbook.vn
          </p>

          <p>
            <i class="bi bi-geo-alt" />
            123 Đường Sách, Ninh Kiều, Cần Thơ
          </p>
        </div>
      </div>

      <div class="reader-container footer-bottom">
        <span>
          © 2026 KBook Reader.
          All rights reserved.
        </span>

        <div>
          <span>VISA</span>
          <span>Mastercard</span>
          <span>MoMo</span>
          <span>ZaloPay</span>
        </div>
      </div>
    </section>
  </footer>
</template>

<style scoped>
.newsletter-section {
  padding: 25px 0;
  background: var(--reader-primary);
  color: #fff;
}

.newsletter-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.newsletter-heading {
  display: flex;
  align-items: center;
  gap: 13px;
}

.newsletter-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border: 1px solid
    rgb(255 255 255 / 25%);
  border-radius: 14px;
  font-size: 22px;
}

.newsletter-heading h2 {
  margin: 0;
  font-size: 19px;
}

.newsletter-heading p {
  margin: 5px 0 0;
  color:
    rgb(255 255 255 / 70%);
  font-size: 10px;
}

.newsletter-form {
  width: min(440px, 100%);
  height: 42px;
  display: grid;
  grid-template-columns:
    1fr 110px;
  overflow: hidden;
  border-radius: 999px;
  background: #fff;
}

.newsletter-form input {
  min-width: 0;
  padding: 0 17px;
  border: 0;
  outline: none;
}

.newsletter-form button {
  border: 0;
  background:
    var(--reader-primary-dark);
  color: #fff;
  font-weight: 800;
}

.footer-main {
  padding: 43px 0 17px;
  background: #043a2a;
  color: #fff;
}

.footer-grid {
  display: grid;
  grid-template-columns:
    1.35fr repeat(4, 1fr);
  gap: 40px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-logo > i {
  font-size: 34px;
}

.footer-logo strong,
.footer-logo small {
  display: block;
}

.footer-logo strong {
  font-size: 23px;
}

.footer-logo small {
  font-size: 9px;
}

.footer-brand > p {
  max-width: 240px;
  margin: 17px 0;
  color:
    rgb(255 255 255 / 67%);
  font-size: 10px;
  line-height: 1.8;
}

.social-links {
  display: flex;
  gap: 9px;
}

.social-links a {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background:
    rgb(255 255 255 / 9%);
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.footer-column h3 {
  margin: 3px 0 9px;
  font-size: 11px;
  text-transform: uppercase;
}

.footer-column a,
.footer-column p {
  margin: 0;
  color:
    rgb(255 255 255 / 67%);
  font-size: 9px;
  line-height: 1.7;
}

.contact-column p {
  display: flex;
  align-items: flex-start;
  gap: 7px;
}

.footer-bottom {
  margin-top: 35px;
  padding-top: 17px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid
    rgb(255 255 255 / 10%);
  color:
    rgb(255 255 255 / 55%);
  font-size: 8px;
}

.footer-bottom > div {
  display: flex;
  gap: 10px;
}

@media (max-width: 900px) {
  .newsletter-inner {
    align-items: stretch;
    flex-direction: column;
  }

  .newsletter-form {
    width: 100%;
  }

  .footer-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    align-items: flex-start;
    flex-direction: column;
    gap: 13px;
  }
}
</style>