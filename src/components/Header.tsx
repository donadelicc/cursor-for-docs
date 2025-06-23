import React from 'react';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="p-4">
      <div className="flex items-center bg-transparent">
        <Image src="/logo2.png" alt="Logo" width={50} height={50} />
      </div>
    </header>
  );
};

export default Header;
