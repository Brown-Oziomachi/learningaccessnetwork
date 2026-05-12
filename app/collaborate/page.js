// app/student/collaborate/page.jsx
import { Suspense } from "react";
import GlobalHubsClient from "./collaborate";

export default function CollaboratePage() {
  return (
    <Suspense fallback={null}>
      <GlobalHubsClient />
    </Suspense>
  );
}