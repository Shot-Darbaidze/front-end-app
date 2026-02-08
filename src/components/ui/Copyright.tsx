import React from 'react';

const Copyright = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <p 
        className="text-center"
        style={{
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '22px',
          color: '#4E5562'
        }}
      >
        © All rights reserved.
      </p>
    </div>
  );
};

export default Copyright;
