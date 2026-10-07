import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-narrow text-center">
      <h1 className="page-title">Page not found</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist or has moved.</p>
      <Link to="/dashboard" className="btn btn-primary mt-6">Back to home</Link>
    </div>
  );
}
