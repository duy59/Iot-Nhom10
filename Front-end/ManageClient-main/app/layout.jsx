import ProviderComponent from '@/components/layouts/provider-component';
import 'react-perfect-scrollbar/dist/css/styles.css';
import '../styles/tailwind.css';
import { Nunito } from 'next/font/google';

export const metadata = {
    title: 'IoT Nhom 5',
    description: 'IoT Nhom 5',
    icons: {
        icon: '/logo.jpg',
    },
};

const nunito = Nunito({
    weight: ['400', '500', '600', '700', '800'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-nunito',
});

export default function RootLayout({
    children
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/logo.jpg" type="image/jpeg" />
            </head>
            <body className={nunito.variable}>
                <ProviderComponent>{children}</ProviderComponent>
            </body>
        </html>
    );
}