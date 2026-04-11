"use client";
import dynamic from 'next/dynamic';

const ClientApp = dynamic(() => import('./components/ClientApp'), {
  ssr: false,
  loading: () => (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F4F6F5"}}>
      <div style={{color:"#1A2E23",fontSize:14}}>Loading...</div>
    </div>
  )
});

export default function Page() {
  return <ClientApp />;
}
