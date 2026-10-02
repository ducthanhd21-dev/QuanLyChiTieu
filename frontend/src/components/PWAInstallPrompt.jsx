import { useState, useEffect } from 'react';
import { Button, Modal, Card, Typography, Space } from 'antd';
import {
  DownloadOutlined, MobileOutlined, AppleOutlined,
  AndroidOutlined, CloseOutlined, ShareAltOutlined, PlusSquareOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const PWAInstallPrompt = ({ type = 'banner' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed & opened as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event (Android / Chrome / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setIosModalOpen(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If prompt is not available, show guide modal
      setIosModalOpen(true);
    }
  };

  // If already installed, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Sidebar Menu item / button type
  if (type === 'sidebar-button') {
    return (
      <>
        <div style={{ padding: '0 16px 12px' }}>
          <Button
            type="primary"
            ghost
            block
            icon={<DownloadOutlined />}
            onClick={handleInstallClick}
            style={{
              borderColor: '#1890ff',
              color: '#69c0ff',
              borderRadius: 8,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            Tải app về máy
          </Button>
        </div>

        {/* iOS / General Install Guide Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isIOS ? <AppleOutlined style={{ fontSize: 20 }} /> : <AndroidOutlined style={{ fontSize: 20 }} />}
              <span>Cài đặt BillTrack về màn hình chính</span>
            </div>
          }
          open={iosModalOpen}
          onCancel={() => setIosModalOpen(false)}
          footer={[
            <Button key="ok" type="primary" onClick={() => setIosModalOpen(false)}>
              Đã hiểu
            </Button>,
          ]}
          centered
        >
          <div style={{ padding: '12px 0' }}>
            {isIOS ? (
              <div>
                <Text style={{ display: 'block', marginBottom: 14 }}>
                  Để cài đặt BillTrack về iPhone/iPad của bạn:
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>1</div>
                    <Text>Mở trang web này bằng trình duyệt <b>Safari</b> trên iPhone.</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>2</div>
                    <Text>Nhấn vào nút <b>Chia sẻ</b> (biểu tượng hình vuông có mũi tên <ShareAltOutlined /> ở thanh dưới cùng).</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>3</div>
                    <Text>Cuộn xuống và chọn <b>"Thêm vào Màn hình chính"</b> (Add to Home Screen <PlusSquareOutlined />).</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>4</div>
                    <Text>Nhấn <b>"Thêm" (Add)</b> ở góc trên bên phải để hoàn tất!</Text>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Text style={{ display: 'block', marginBottom: 14 }}>
                  Để cài đặt BillTrack trên Android / Máy tính:
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>1</div>
                    <Text>Nhấn vào biểu tượng <b>3 chấm ⋮</b> ở góc trên bên phải trình duyệt Chrome.</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>2</div>
                    <Text>Chọn <b>"Cài đặt ứng dụng"</b> (hoặc <i>"Thêm vào Màn hình chính"</i>).</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>3</div>
                    <Text>Bấm xác nhận <b>"Cài đặt"</b>. Ứng dụng sẽ xuất hiện ngay trên màn hình!</Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </>
    );
  }

  // Floating mobile banner type
  if (bannerDismissed) {
    return null;
  }

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        borderRadius: 14,
        padding: '12px 16px',
        marginBottom: 16,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 14px rgba(24, 144, 255, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}>
            <MobileOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
              Cài đặt app BillTrack về điện thoại
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Dùng như app thật, mở nhanh không cần gõ web
            </div>
          </div>
        </div>

        <Space size={6} style={{ flexShrink: 0, marginLeft: 10 }}>
          <Button
            size="small"
            onClick={handleInstallClick}
            style={{
              background: '#fff',
              color: '#1890ff',
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              padding: '0 12px',
              fontSize: 12,
            }}
          >
            Cài đặt
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} />}
            onClick={() => setBannerDismissed(true)}
          />
        </Space>
      </div>

      {/* Guide Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isIOS ? <AppleOutlined style={{ fontSize: 20 }} /> : <AndroidOutlined style={{ fontSize: 20 }} />}
            <span>Cài đặt BillTrack về màn hình chính</span>
          </div>
        }
        open={iosModalOpen}
        onCancel={() => setIosModalOpen(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setIosModalOpen(false)}>
            Đã hiểu
          </Button>,
        ]}
        centered
      >
        <div style={{ padding: '12px 0' }}>
          {isIOS ? (
            <div>
              <Text style={{ display: 'block', marginBottom: 14 }}>
                Để cài đặt BillTrack về iPhone/iPad của bạn:
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>1</div>
                  <Text>Mở trang web này bằng trình duyệt <b>Safari</b> trên iPhone.</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>2</div>
                  <Text>Nhấn vào nút <b>Chia sẻ</b> (biểu tượng hình vuông có mũi tên <ShareAltOutlined /> ở thanh dưới cùng).</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>3</div>
                  <Text>Cuộn xuống và chọn <b>"Thêm vào Màn hình chính"</b> (Add to Home Screen <PlusSquareOutlined />).</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>4</div>
                  <Text>Nhấn <b>"Thêm" (Add)</b> ở góc trên bên phải để hoàn tất!</Text>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Text style={{ display: 'block', marginBottom: 14 }}>
                Để cài đặt BillTrack trên Android / Máy tính:
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>1</div>
                  <Text>Nhấn vào biểu tượng <b>3 chấm ⋮</b> ở góc trên bên phải trình duyệt Chrome.</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>2</div>
                  <Text>Chọn <b>"Cài đặt ứng dụng"</b> (hoặc <i>"Thêm vào Màn hình chính"</i>).</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#e6f7ff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1890ff', flexShrink: 0 }}>3</div>
                  <Text>Bấm xác nhận <b>"Cài đặt"</b>. Ứng dụng sẽ xuất hiện ngay trên màn hình!</Text>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default PWAInstallPrompt;
