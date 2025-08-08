import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Section from './Section'; // Import the Section wrapper

interface QRCodeDisplayProps {
  isOpen: boolean; // To know when the EditPanel (and thus this component) is open
  theme: 'light' | 'dark'; // To get correct QR code colors
}

// Icon specific to QR Code Display
const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M.5 8a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V8.5A.5.5 0 0 1 .5 8zM2 8.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5zM8 4a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM16 8a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V8.5A.5.5 0 0 1 16 8zM8.5 1.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3zM.5 13a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 0-1h-15a.5.5 0 0 0-.5.5zM8 12.5a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 1-1 0V13a.5.5 0 0 1 .5-.5zM16 12.5a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 1-1 0V13a.5.5 0 0 1 .5-.5z" clipRule="evenodd" />
    </svg>
);

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ isOpen, theme }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      const pageUrl = window.location.origin + window.location.pathname;
      const qrCodeColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim();

      setTimeout(() => {
        QRCode.toDataURL(pageUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 256,
          color: { dark: qrCodeColor, light: bgColor },
        })
          .then(url => setQrCodeDataUrl(url))
          .catch(err => {
            console.error('Failed to generate QR code:', err);
            setQrCodeDataUrl('');
          });
      }, 100);
    }
  }, [isOpen, theme]);

  const handleDownloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = 'linkhub-qrcode.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Section title="Share QR Code">
      <div className="flex flex-col items-center text-center p-4 bg-[var(--background-color)] rounded-lg border border-[var(--border-color)]">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
            Share this QR code on posters, flyers, or social media to direct people to your page.
        </p>
        {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="QR Code for your Link Hub page" className="w-48 h-48 rounded-lg" />
        ) : (
            <div className="w-48 h-48 bg-[var(--surface-color-hover)] rounded-lg flex items-center justify-center">
                <p className="text-xs text-[var(--text-secondary)]">Generating...</p>
            </div>
        )}
        <button
            onClick={handleDownloadQrCode}
            disabled={!qrCodeDataUrl}
            className="w-full mt-4 p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold disabled:bg-[var(--disabled-background-color)] disabled:cursor-not-allowed transition-colors"
        >
            Download QR Code (.png)
        </button>
      </div>
    </Section>
  );
};

export default QRCodeDisplay;
