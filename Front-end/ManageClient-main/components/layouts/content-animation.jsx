'use client';;
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const ContentAnimation = ({
    children
}) => {
    const pathname = usePathname();
    const themeConfig = useSelector((state) => state.themeConfig);
    const [animation, setAnimation] = useState(themeConfig.animation);

    useEffect(() => {
        setAnimation(themeConfig.animation);
    }, [themeConfig.animation]);

    useEffect(() => {
        setAnimation(themeConfig.animation);
        setTimeout(() => {
            setAnimation('');
        }, 1100);
    }, [pathname]);
    return <>
        {/* BEGIN CONTENT AREA */}
        <div className={`${animation} animate__animated p-6`}>{children}</div>
        {/* END CONTENT AREA */}
    </>;
};

export default ContentAnimation;
