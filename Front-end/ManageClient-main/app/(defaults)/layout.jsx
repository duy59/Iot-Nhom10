// layout.jsx
"use client"

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '../../components/Database/firebaseConfig'; // Đảm bảo đường dẫn chính xác
import { onAuthStateChanged } from 'firebase/auth';

import ContentAnimation from '@/components/layouts/content-animation';
import Footer from '@/components/layouts/footer';
import Header from '@/components/layouts/header';
import MainContainer from '@/components/layouts/main-container';
import Overlay from '@/components/layouts/overlay';
import ScrollToTop from '@/components/layouts/scroll-to-top';
import Setting from '@/components/layouts/setting';
import Sidebar from '@/components/layouts/sidebar';
import Portals from '@/components/portals';

export default function DefaultLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Trạng thái tải
  const [user, setUser] = useState(null); // Trạng thái người dùng

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Người dùng đã đăng nhập
        setUser(currentUser);
        setLoading(false);
      } else {
        // Người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập
        router.push('/auth/boxed-signin');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    // Hiển thị loading hoặc null trong khi kiểm tra trạng thái đăng nhập
    return null;
  }

  return (
    <>
      {/* BEGIN MAIN CONTAINER */}
      <div className="relative">
        <Overlay />
        <ScrollToTop />

        {/* BEGIN APP SETTING LAUNCHER */}
        {/* END APP SETTING LAUNCHER */}

        <MainContainer>
          {/* BEGIN SIDEBAR */}
          <Sidebar />
          {/* END SIDEBAR */}
          <div className="main-content flex min-h-screen flex-col">
            {/* BEGIN TOP NAVBAR */}
            <Header />
            {/* END TOP NAVBAR */}

            {/* BEGIN CONTENT AREA */}
            <ContentAnimation>{children}</ContentAnimation>
            {/* END CONTENT AREA */}

            {/* BEGIN FOOTER */}
            <Footer />
            {/* END FOOTER */}
            <Portals />
          </div>
        </MainContainer>
      </div>
    </>
  );
}