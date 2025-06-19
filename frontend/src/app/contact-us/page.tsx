import React from 'react';
import Link from 'next/link';

const ContactPage: React.FC = () => {
  return (
    <div className="w-full h-[80vh] flex justify-center items-center">
      <div className="bg-[#f7f6cf] p-6 text-center rounded-lg space-y-8 shadow-md max-w-xl mx-auto py-10">
        <h2 className="text-3xl font-semibold font-libre text-gray-800">Contact Us</h2>
        <p className='text-sm sm:text-lg text-gray-700 font-poppins max-w-sm mx-auto'>3rdFloor, Room no 29, 
          <br />
          P2 unispace, Plot No: 128,
          
           EPIP Zone Whitefield Rd, 
          
          near Ginger Hotel, EPIP Zone, 
          
          Brookefield, Bengaluru, 
         
          Karnataka 560066</p>
        <p className="text-sm sm:text-base text-gray-700 font-poppins">
          Have a question or need assistance with your order? Just respond to our emails{' '}
          <Link
            href="mailto:support@diffrun.com"
            className="underline text-[#5784ba] transition-colors hover:text-[#3f6b96]"
            rel="noopener noreferrer"
          >
            support@diffrun.com
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default ContactPage;