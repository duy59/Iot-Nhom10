'use client';;
import React from 'react';
import { useSelector } from 'react-redux';

const MainContainer = ({
    children
}) => {
    const themeConfig = useSelector((state) => state.themeConfig);
    return (
        <div
            className={`${themeConfig.navbar} main-container min-h-screen text-black dark:text-white-dark`}> {children}</div>
    );
};

export default MainContainer;
