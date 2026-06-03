import PromoPopup from '@/components/PromoPopup';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <PromoPopup />
    </>
  );
}
