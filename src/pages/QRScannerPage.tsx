import React from 'react';
import { QRScannerView } from '../components/attendance/QRScannerView';

export const QRScannerPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <QRScannerView />
    </div>
  );
};
