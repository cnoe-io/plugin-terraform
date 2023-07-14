import React from 'react';
import { Routes, Route } from "react-router-dom";
import { MainPageComponent } from "../MainPageComponent";
import { ResourceDetailComponent } from "../ResourceDetailComponent";

export const RootComponent = () => (
  <Routes>
    {/* myPlugin.routes.root will take the user to this page */}
    <Route path="/" element={<MainPageComponent />} />

    {/* myPlugin.routes.details will take the user to this page */}
    <Route path="/resourcedetails" element={<ResourceDetailComponent />} />
  </Routes>
);