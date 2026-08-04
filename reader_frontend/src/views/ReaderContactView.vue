<script setup>
const libraryServices = [
  {
    icon: "bi bi-search",
    title: "Tra cứu sách trực tuyến",
    description:
      "Tìm kiếm sách theo tên, tác giả, thể loại và tình trạng còn sách.",
  },
  {
    icon: "bi bi-bag-check",
    title: "Đăng ký mượn sách",
    description:
      "Lựa chọn sách và gửi yêu cầu mượn trực tuyến đến thư viện.",
  },
  {
    icon: "bi bi-clock-history",
    title: "Theo dõi lịch sử mượn",
    description:
      "Kiểm tra sách đang mượn, hạn trả, sách đã trả và trạng thái yêu cầu.",
  },
  {
    icon: "bi bi-person-check",
    title: "Quản lý tài khoản",
    description:
      "Cập nhật hồ sơ độc giả và quản lý thông tin cá nhân thuận tiện.",
  },
];

const libraryValues = [
  {
    icon: "bi bi-book-half",
    title: "Tri thức",
    description:
      "Mang sách và nguồn tri thức đến gần hơn với mọi độc giả.",
  },
  {
    icon: "bi bi-lightning-charge",
    title: "Thuận tiện",
    description:
      "Đơn giản hóa quá trình tìm kiếm, đăng ký và theo dõi mượn sách.",
  },
  {
    icon: "bi bi-shield-check",
    title: "Tin cậy",
    description:
      "Quản lý dữ liệu độc giả và hoạt động thư viện rõ ràng, an toàn.",
  },
];

const contactItems = [
  {
    icon: "bi bi-geo-alt",
    label: "Địa chỉ",
    value: "123 Đường Sách, Ninh Kiều, Cần Thơ",
  },
  {
    icon: "bi bi-telephone",
    label: "Hotline",
    value: "1900 9876",
  },
  {
    icon: "bi bi-envelope",
    label: "Email",
    value: "support@kbook.vn",
  },
  {
    icon: "bi bi-clock",
    label: "Thời gian hoạt động",
    value: "Thứ 2 – Thứ 7, từ 08:00 đến 21:00",
  },
];
</script>

<template>
  <div class="about-page">
    <!-- Banner -->
    <section class="about-banner">
      <div class="reader-container">
        <div class="breadcrumb">
          <RouterLink
            :to="{
              name: 'reader-home',
            }"
          >
            Trang chủ
          </RouterLink>

          <i class="bi bi-chevron-right" />

          <span>Thông tin KBook</span>
        </div>

        <div class="banner-layout">
          <div class="banner-content">
            <span class="banner-label">
              Thư viện trực tuyến
            </span>

            <h1>
              KBook – Kết nối độc giả
              với thế giới tri thức
            </h1>

            <p>
              KBook là hệ thống quản lý và mượn sách trực tuyến,
              giúp độc giả dễ dàng tìm kiếm tài liệu, gửi yêu cầu
              mượn và theo dõi quá trình sử dụng sách tại thư viện.
            </p>

            <div class="banner-actions">
              <RouterLink
                :to="{
                  name: 'reader-books',
                }"
                class="primary-link"
              >
                <i class="bi bi-search" />

                Khám phá kho sách
              </RouterLink>

              <a
                href="tel:19009876"
                class="secondary-link"
              >
                <i class="bi bi-telephone" />

                Liên hệ KBook
              </a>
            </div>
          </div>

          <div class="banner-visual">
            <span class="visual-circle circle-one" />
            <span class="visual-circle circle-two" />

            <div class="visual-logo">
              <i class="bi bi-book-half" />

              <strong>KBook</strong>

              <small>
                Reader Library
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Giới thiệu -->
    <section class="about-section">
      <div class="reader-container introduction-layout">
        <div class="introduction-image">
          <div class="library-illustration">
            <span class="book book-one" />
            <span class="book book-two" />
            <span class="book book-three" />

            <div class="illustration-icon">
              <i class="bi bi-buildings" />
            </div>
          </div>

          <div class="experience-card">
            <strong>50+</strong>

            <span>
              Đầu sách đang được quản lý
            </span>
          </div>
        </div>

        <div class="introduction-content">
          <span class="section-label">
            Giới thiệu KBook
          </span>

          <h2>
            Giải pháp thư viện hiện đại dành cho độc giả
          </h2>

          <p>
            KBook được xây dựng nhằm hỗ trợ số hóa hoạt động quản lý
            và mượn trả sách. Hệ thống giúp độc giả chủ động tra cứu
            thông tin sách, kiểm tra số lượng còn lại và gửi yêu cầu
            mượn mà không cần thực hiện nhiều thủ tục trực tiếp.
          </p>

          <p>
            Thông qua KBook, thư viện có thể quản lý sách, độc giả,
            yêu cầu mượn và lịch sử mượn một cách tập trung. Đồng thời,
            độc giả có thể theo dõi toàn bộ hoạt động của mình trên
            một giao diện trực quan và dễ sử dụng.
          </p>

          <div class="introduction-features">
            <div>
              <i class="bi bi-check-circle-fill" />

              <span>
                Tra cứu sách nhanh chóng
              </span>
            </div>

            <div>
              <i class="bi bi-check-circle-fill" />

              <span>
                Gửi yêu cầu mượn trực tuyến
              </span>
            </div>

            <div>
              <i class="bi bi-check-circle-fill" />

              <span>
                Theo dõi hạn trả sách
              </span>
            </div>

            <div>
              <i class="bi bi-check-circle-fill" />

              <span>
                Quản lý hồ sơ độc giả
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Dịch vụ -->
    <section class="about-section services-section">
      <div class="reader-container">
        <div class="section-heading">
          <span class="section-label">
            Dịch vụ KBook
          </span>

          <h2>
            Những tiện ích dành cho độc giả
          </h2>

          <p>
            KBook cung cấp các chức năng cần thiết để hỗ trợ
            quá trình tìm kiếm và mượn sách thuận tiện hơn.
          </p>
        </div>

        <div class="services-grid">
          <article
            v-for="service in libraryServices"
            :key="service.title"
            class="service-card"
          >
            <span class="service-icon">
              <i :class="service.icon" />
            </span>

            <h3>
              {{ service.title }}
            </h3>

            <p>
              {{ service.description }}
            </p>

            <RouterLink
              :to="
                service.title === 'Tra cứu sách trực tuyến'
                  ? { name: 'reader-books' }
                  : { name: 'reader-profile' }
              "
            >
              Xem thêm

              <i class="bi bi-arrow-right" />
            </RouterLink>
          </article>
        </div>
      </div>
    </section>

    <!-- Thông tin liên hệ -->
    <section class="about-section contact-section">
      <div class="reader-container">
        <div class="section-heading">
          <span class="section-label">
            Thông tin liên hệ
          </span>

          <h2>
            Kết nối với thư viện KBook
          </h2>

          <p>
            Liên hệ với KBook khi cần hỗ trợ về tài khoản,
            sách, yêu cầu mượn hoặc thời gian trả sách.
          </p>
        </div>

        <div class="contact-layout">
          <div class="contact-information">
            <article
              v-for="item in contactItems"
              :key="item.label"
              class="contact-item"
            >
              <span>
                <i :class="item.icon" />
              </span>

              <div>
                <small>
                  {{ item.label }}
                </small>

                <strong>
                  {{ item.value }}
                </strong>
              </div>
            </article>

            <div class="social-information">
              <h3>
                Theo dõi KBook
              </h3>

              <p>
                Cập nhật thông tin sách mới và hoạt động của thư viện.
              </p>

              <div class="social-links">
                <a
                  href="#"
                  aria-label="Facebook KBook"
                >
                  <i class="bi bi-facebook" />
                </a>

                <a
                  href="#"
                  aria-label="Youtube KBook"
                >
                  <i class="bi bi-youtube" />
                </a>

                <a
                  href="#"
                  aria-label="Instagram KBook"
                >
                  <i class="bi bi-instagram" />
                </a>

                <a
                  href="mailto:support@kbook.vn"
                  aria-label="Email KBook"
                >
                  <i class="bi bi-envelope" />
                </a>
              </div>
            </div>
          </div>

          <div class="map-card">
            <div class="map-pattern">
              <span class="map-line line-one" />
              <span class="map-line line-two" />
              <span class="map-line line-three" />

              <div class="location-marker">
                <i class="bi bi-geo-alt-fill" />
              </div>
            </div>

            <div class="map-information">
              <span>
                <i class="bi bi-buildings" />
              </span>

              <div>
                <h3>
                  Thư viện KBook
                </h3>

                <p>
                  123 Đường Sách, Ninh Kiều, Cần Thơ
                </p>
              </div>

              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Xem bản đồ

                <i class="bi bi-arrow-up-right" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="about-section cta-section">
      <div class="reader-container">
        <div class="cta-card">
          <div>
            <span>
              Bắt đầu cùng KBook
            </span>

            <h2>
              Khám phá kho sách và gửi yêu cầu mượn ngay hôm nay
            </h2>

            <p>
              Đăng nhập tài khoản độc giả để sử dụng đầy đủ
              các tiện ích của thư viện.
            </p>
          </div>

          <div class="cta-actions">
            <RouterLink
              :to="{
                name: 'reader-books',
              }"
              class="cta-primary"
            >
              Xem danh sách sách
            </RouterLink>

            <RouterLink
              :to="{
                name: 'reader-profile',
              }"
              class="cta-secondary"
            >
              Tài khoản của tôi
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  background: #fff;
}

.about-banner {
  padding: 58px 0;
  overflow: hidden;
  border-bottom: 1px solid
    var(--reader-border, #e1e9e4);
  background:
    radial-gradient(
      circle at 90% 10%,
      rgb(255 255 255 / 70%),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      #eaf7ef,
      #fff2df
    );
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--reader-muted, #7d8a83);
  font-size: 10px;
}

.breadcrumb a {
  color: var(--reader-primary, #0c653d);
}

.banner-layout {
  margin-top: 32px;
  display: grid;
  grid-template-columns:
    minmax(0, 1.15fr)
    minmax(330px, 0.85fr);
  align-items: center;
  gap: 55px;
}

.banner-label,
.section-label {
  color: var(--reader-primary, #0c653d);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.banner-content h1 {
  max-width: 700px;
  margin: 13px 0 18px;
  color: var(--reader-text, #20352a);
  font-size: 45px;
  line-height: 1.2;
}

.banner-content > p {
  max-width: 700px;
  margin: 0;
  color: var(--reader-muted, #718078);
  font-size: 13px;
  line-height: 1.8;
}

.banner-actions {
  margin-top: 27px;
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
}

.primary-link,
.secondary-link {
  min-height: 44px;
  padding: 0 18px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 900;
}

.primary-link {
  background: var(--reader-primary, #0c653d);
  color: #fff;
}

.secondary-link {
  border: 1px solid
    var(--reader-primary, #0c653d);
  background: #fff;
  color: var(--reader-primary, #0c653d);
}

.banner-visual {
  min-height: 310px;
  position: relative;
  display: grid;
  place-items: center;
}

.visual-circle {
  position: absolute;
  border-radius: 50%;
}

.circle-one {
  width: 300px;
  height: 300px;
  background: rgb(12 101 61 / 9%);
}

.circle-two {
  width: 230px;
  height: 230px;
  border: 2px dashed
    rgb(12 101 61 / 25%);
}

.visual-logo {
  width: 190px;
  height: 190px;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 9px solid #fff;
  border-radius: 50%;
  background: var(--reader-primary, #0c653d);
  color: #fff;
  box-shadow:
    0 28px 55px
    rgb(12 101 61 / 25%);
}

.visual-logo i {
  font-size: 58px;
}

.visual-logo strong {
  margin-top: 9px;
  font-size: 24px;
}

.visual-logo small {
  margin-top: 4px;
  font-size: 8px;
  text-transform: uppercase;
}

.about-section {
  padding: 65px 0;
}

.introduction-layout {
  display: grid;
  grid-template-columns:
    minmax(320px, 0.9fr)
    minmax(0, 1.1fr);
  align-items: center;
  gap: 65px;
}

.introduction-image {
  min-height: 430px;
  position: relative;
}

.library-illustration {
  width: 100%;
  height: 390px;
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  border-radius: 25px;
  background:
    linear-gradient(
      145deg,
      #e0f2e7,
      #fbf3df
    );
}

.illustration-icon {
  width: 135px;
  height: 135px;
  display: grid;
  place-items: center;
  border-radius: 30px;
  background: #fff;
  color: var(--reader-primary, #0c653d);
  font-size: 63px;
  box-shadow:
    0 20px 45px
    rgb(15 23 42 / 12%);
}

.book {
  position: absolute;
  bottom: 48px;
  border-radius: 5px;
  box-shadow:
    0 12px 22px
    rgb(15 23 42 / 17%);
}

.book-one {
  width: 46px;
  height: 165px;
  left: 55px;
  background: #0c653d;
  transform: rotate(-7deg);
}

.book-two {
  width: 44px;
  height: 145px;
  left: 108px;
  background: #ef476f;
  transform: rotate(3deg);
}

.book-three {
  width: 42px;
  height: 125px;
  right: 55px;
  background: #e3b341;
  transform: rotate(8deg);
}

.experience-card {
  width: 190px;
  padding: 20px;
  position: absolute;
  right: -20px;
  bottom: 0;
  border: 7px solid #fff;
  border-radius: 17px;
  background: var(--reader-primary, #0c653d);
  color: #fff;
  box-shadow:
    0 18px 35px
    rgb(15 23 42 / 18%);
}

.experience-card strong,
.experience-card span {
  display: block;
}

.experience-card strong {
  font-size: 30px;
}

.experience-card span {
  margin-top: 5px;
  font-size: 9px;
  line-height: 1.5;
}

.introduction-content h2,
.section-heading h2,
.mission-content h2 {
  margin: 11px 0 15px;
  color: var(--reader-text, #20352a);
  font-size: 31px;
  line-height: 1.35;
}

.introduction-content > p,
.mission-content > p {
  margin: 11px 0;
  color: var(--reader-muted, #718078);
  font-size: 11px;
  line-height: 1.8;
}

.introduction-features {
  margin-top: 24px;
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.introduction-features div {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--reader-text, #20352a);
  font-size: 10px;
  font-weight: 800;
}

.introduction-features i {
  color: var(--reader-primary, #0c653d);
}

.services-section {
  background: #fafcfb;
}

.section-heading {
  max-width: 650px;
  margin: 0 auto 35px;
  text-align: center;
}

.section-heading p {
  margin: 0;
  color: var(--reader-muted, #718078);
  font-size: 10px;
  line-height: 1.7;
}

.services-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 17px;
}

.service-card {
  min-height: 250px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  border: 1px solid
    var(--reader-border, #e1e9e4);
  border-radius: 17px;
  background: #fff;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.service-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 17px 40px
    rgb(15 23 42 / 8%);
}

.service-icon {
  width: 55px;
  height: 55px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background:
    var(--reader-primary-light, #eaf7ef);
  color: var(--reader-primary, #0c653d);
  font-size: 22px;
}

.service-card h3 {
  margin: 17px 0 8px;
  color: var(--reader-text, #20352a);
  font-size: 14px;
}

.service-card p {
  margin: 0;
  color: var(--reader-muted, #718078);
  font-size: 9px;
  line-height: 1.7;
}

.service-card a {
  margin-top: auto;
  padding-top: 20px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--reader-primary, #0c653d);
  font-size: 9px;
  font-weight: 900;
}

.mission-section {
  background:
    linear-gradient(
      135deg,
      #edf8f1,
      #fff8e7
    );
}

.mission-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1.1fr)
    minmax(350px, 0.9fr);
  align-items: center;
  gap: 60px;
}

.mission-values {
  margin-top: 25px;
  display: grid;
  gap: 13px;
}

.mission-values article {
  padding: 14px;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  border-radius: 12px;
  background: rgb(255 255 255 / 75%);
}

.mission-values article > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 11px;
  background: #fff;
  color: var(--reader-primary, #0c653d);
  font-size: 18px;
}

.mission-values h3 {
  margin: 0;
  color: var(--reader-text, #20352a);
  font-size: 11px;
}

.mission-values p {
  margin: 5px 0 0;
  color: var(--reader-muted, #718078);
  font-size: 8px;
  line-height: 1.6;
}

.mission-statistics {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.mission-statistics article {
  min-height: 165px;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid
    rgb(255 255 255 / 80%);
  border-radius: 18px;
  background: rgb(255 255 255 / 75%);
  text-align: center;
  box-shadow:
    0 12px 30px
    rgb(15 23 42 / 6%);
}

.mission-statistics strong {
  color: var(--reader-primary, #0c653d);
  font-size: 28px;
}

.mission-statistics span {
  margin-top: 7px;
  color: var(--reader-muted, #718078);
  font-size: 9px;
}

.contact-section {
  background: #fff;
}

.contact-layout {
  display: grid;
  grid-template-columns:
    minmax(320px, 0.8fr)
    minmax(0, 1.2fr);
  gap: 28px;
}

.contact-information {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.contact-item {
  min-height: 135px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid
    var(--reader-border, #e1e9e4);
  border-radius: 14px;
  background: #fff;
}

.contact-item > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 11px;
  background:
    var(--reader-primary-light, #eaf7ef);
  color: var(--reader-primary, #0c653d);
  font-size: 17px;
}

.contact-item small,
.contact-item strong {
  display: block;
}

.contact-item small {
  color: var(--reader-muted, #718078);
  font-size: 8px;
}

.contact-item strong {
  margin-top: 6px;
  color: var(--reader-text, #20352a);
  font-size: 10px;
  line-height: 1.6;
}

.social-information {
  grid-column: 1 / -1;
  padding: 20px;
  border-radius: 14px;
  background:
    var(--reader-primary-light, #eaf7ef);
}

.social-information h3 {
  margin: 0;
  color: var(--reader-text, #20352a);
  font-size: 13px;
}

.social-information p {
  margin: 6px 0 14px;
  color: var(--reader-muted, #718078);
  font-size: 8px;
}

.social-links {
  display: flex;
  gap: 9px;
}

.social-links a {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #fff;
  color: var(--reader-primary, #0c653d);
}

.map-card {
  overflow: hidden;
  border: 1px solid
    var(--reader-border, #e1e9e4);
  border-radius: 18px;
  background: #fff;
}

.map-pattern {
  min-height: 330px;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(
      135deg,
      #e2f1e7,
      #f8efda
    );
}

.map-line {
  height: 9px;
  position: absolute;
  border-radius: 999px;
  background: rgb(255 255 255 / 75%);
}

.line-one {
  width: 120%;
  top: 85px;
  left: -50px;
  transform: rotate(15deg);
}

.line-two {
  width: 100%;
  top: 180px;
  left: 20px;
  transform: rotate(-17deg);
}

.line-three {
  width: 80%;
  top: 245px;
  left: -30px;
  transform: rotate(8deg);
}

.location-marker {
  width: 74px;
  height: 74px;
  position: absolute;
  top: 50%;
  left: 55%;
  display: grid;
  place-items: center;
  border: 8px solid #fff;
  border-radius: 50%;
  background: var(--reader-primary, #0c653d);
  color: #fff;
  font-size: 28px;
  box-shadow:
    0 15px 30px
    rgb(15 23 42 / 20%);
  transform: translate(-50%, -50%);
}

.map-information {
  padding: 19px;
  display: grid;
  grid-template-columns:
    42px 1fr auto;
  align-items: center;
  gap: 13px;
}

.map-information > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background:
    var(--reader-primary-light, #eaf7ef);
  color: var(--reader-primary, #0c653d);
}

.map-information h3 {
  margin: 0;
  color: var(--reader-text, #20352a);
  font-size: 12px;
}

.map-information p {
  margin: 5px 0 0;
  color: var(--reader-muted, #718078);
  font-size: 8px;
}

.map-information a {
  min-height: 36px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 8px;
  background: var(--reader-primary, #0c653d);
  color: #fff;
  font-size: 8px;
  font-weight: 900;
}

.cta-section {
  padding-top: 0;
}

.cta-card {
  padding: 35px 42px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  border-radius: 20px;
  background:
    radial-gradient(
      circle at 85% 20%,
      rgb(255 255 255 / 12%),
      transparent 35%
    ),
    var(--reader-primary, #0c653d);
  color: #fff;
}

.cta-card span {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
}

.cta-card h2 {
  max-width: 650px;
  margin: 9px 0 6px;
  font-size: 25px;
}

.cta-card p {
  margin: 0;
  color: rgb(255 255 255 / 75%);
  font-size: 10px;
}

.cta-actions {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
}

.cta-primary,
.cta-secondary {
  min-height: 40px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  border-radius: 9px;
  font-size: 9px;
  font-weight: 900;
}

.cta-primary {
  background: #fff;
  color: var(--reader-primary, #0c653d);
}

.cta-secondary {
  border: 1px solid rgb(255 255 255 / 60%);
  color: #fff;
}

@media (max-width: 1000px) {
  .banner-layout,
  .introduction-layout,
  .mission-layout,
  .contact-layout {
    grid-template-columns: 1fr;
  }

  .services-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .banner-visual {
    min-height: 280px;
  }

  .introduction-image {
    max-width: 650px;
    margin: auto;
  }
}

@media (max-width: 650px) {
  .about-banner {
    padding: 40px 0;
  }

  .banner-content h1 {
    font-size: 33px;
  }

  .about-section {
    padding: 45px 0;
  }

  .services-grid,
  .mission-statistics,
  .contact-information,
  .introduction-features {
    grid-template-columns: 1fr;
  }

  .social-information {
    grid-column: auto;
  }

  .cta-card {
    padding: 27px;
    align-items: flex-start;
    flex-direction: column;
  }

  .cta-actions {
    width: 100%;
    flex-direction: column;
  }

  .cta-primary,
  .cta-secondary {
    justify-content: center;
  }

  .map-information {
    grid-template-columns:
      42px minmax(0, 1fr);
  }

  .map-information a {
    grid-column: 1 / -1;
    justify-content: center;
  }
}
</style>