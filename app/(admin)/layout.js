import "@/app/css/admin.css";
import AuthProvider from "@/components/AuthProvider";
import Jaga from "@/components/Jaga";

export const metadata = { title: "Admin RentalMalang", description: "Panel admin rental mobil" };

export default function AdminRoot({ children }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider><Jaga role="admin">{children}</Jaga></AuthProvider>
      </body>
    </html>
  );
}
