import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { ScaffoldPage } from "./pages/ScaffoldPage";

export default function App() {
  useQueryClient();

  return (
    <Routes>
      <Route path="/" element={<ScaffoldPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
