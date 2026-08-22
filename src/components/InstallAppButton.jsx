import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
  );
  const isAppleMobile = /iPad|iPhone|iPod/.test(window.navigator.userAgent);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      if (isAppleMobile) {
        window.alert('Di Safari, tekan tombol Bagikan lalu pilih “Add to Home Screen” untuk memasang Selasar POS.');
      }
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (isInstalled || (!installPrompt && !isAppleMobile)) return null;

  return (
    <button type="button" className="pwa-install-button" onClick={install} title="Pasang Selasar POS di perangkat ini">
      <Download size={16} />
      <span>{isAppleMobile ? 'Tambah ke layar utama' : 'Install aplikasi'}</span>
    </button>
  );
}
