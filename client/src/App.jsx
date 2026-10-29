import { Route, Routes, Link } from "react-router-dom";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Case from "./pages/Case";
import Accuse from "./pages/Accuse";
import Results from "./pages/Results";

function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Nothing here</h1>
      <p className="mt-2 text-mute">That page isn't in the case files.</p>
      <Link to="/" className="btn btn-gold mt-6">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/case/:id" element={<Case />} />
        <Route path="/case/:id/accuse" element={<Accuse />} />
        <Route path="/case/:id/results" element={<Results />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
