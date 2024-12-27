import Link from 'next/link';
import React from 'react';

export const metadata = {
    title: 'Error 503',
};

const Error503 = () => {
    return (
        <div
            className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <div
                className="px-6 py-16 text-center font-semibold before:container before:absolute before:left-1/2 before:aspect-square before:-translate-x-1/2 before:rounded-full before:bg-[linear-gradient(180deg,#4361EE_0%,rgba(67,97,238,0)_50.73%)] before:opacity-10 md:py-20">
                <div className="relative">
                    <img
                        src="/assets/images/error/503-dark.svg"
                        alt="503"
                        className="dark-img mx-auto w-full max-w-xs object-cover md:max-w-xl" />
                    <img
                        src="/assets/images/error/503-light.svg"
                        alt="503"
                        className="light-img mx-auto w-full max-w-xs object-cover md:max-w-xl" />
                    <p className="mt-5 text-base dark:text-white">Service Unavailable!</p>
                    <Link
                        href="/"
                        className="btn btn-gradient mx-auto !mt-7 w-max border-0 uppercase shadow-none">
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Error503;