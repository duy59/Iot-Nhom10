import React from 'react';

const AuthLayout = ({
    children
}) => {
    return <div className="min-h-screen text-black dark:text-white-dark">{children} </div>;
};

export default AuthLayout;
