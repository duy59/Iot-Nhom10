'use client';;
import App from '@/App';
import store from '@/store';
import { Provider } from 'react-redux';
import React, { Suspense } from 'react';
import Loading from '@/components/layouts/loading';

const ProviderComponent = ({
    children
}) => {
    return (
        <Provider store={store}>
            <Suspense fallback={<Loading />}>
                <App>{children} </App>
            </Suspense>
        </Provider>
    );
};

export default ProviderComponent;
// todo
// export default appWithI18Next(ProviderComponent, ni18nConfig);
